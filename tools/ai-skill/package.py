#!/usr/bin/env python3
"""Deterministic M4 packaging: Core (+ optional iOS / Android / All) + checksums.

Single-repo support (R12): a standard checkout of wisdomdesign has no sibling iOS /
android repos. The packager therefore:
  * always builds the Core package (no platform checkout needed);
  * only builds platform packages for platforms selected with --platforms, and fails
    with an explicit message when a selected platform checkout is missing;
  * accepts --ios-root / --android-root (or WISDOMDESIGN_IOS_ROOT /
    WISDOMDESIGN_ANDROID_ROOT) so CI can place platform checkouts anywhere.

Pipeline (single source of truth, no second manifest format):
1. tools/ai-skill/cli.js build renders the Core package (SKILL.md, catalog, page-spec,
   runtime, component-overlays) and writes manifest.json / files.json / build-info.json
   through tools/ai-skill/lib/manifest.js.
2. Each platform package copies the Core payload read-only, adds platforms/<id>/ from
   the platform provider, appends the platform section to SKILL.md (resident budget
   checked), writes LICENSE-NOTICE.txt and re-runs the same manifest writer so
   LICENSE-NOTICE is in files.json and contents.fileCount is real.
3. Deterministic ZIPs (sorted entries, fixed timestamp/attrs) and checksums.json, which
   publishes each package's manifest.json / files.json hashes.

No network, no git writes, no platform source mutation. Exit code 1 on any failure.
"""
import argparse
import hashlib
import json
import os
import shutil
import subprocess
import sys
import zipfile
from pathlib import Path

DESIGN = Path(__file__).resolve().parents[2]
REPO = DESIGN.parent
AI = DESIGN / "ai" / "skill"
DIST = DESIGN / "dist" / "ai-skill"
VERSION = "1.0.0"
STAGING = DIST / "_staging"
FIXED_DATE = (2020, 1, 1, 0, 0, 0)
RESIDENT_BUDGET_BYTES = 6000
WRITE_MANIFEST = DESIGN / "tools" / "ai-skill" / "lib" / "write-manifest.js"
CLI = DESIGN / "tools" / "ai-skill" / "cli.js"
PLATFORM_NAMES = ["ios", "android"]
PLATFORM_REPO_DIR = {"ios": "iOS", "android": "android"}
PLATFORM_ENV = {"ios": "WISDOMDESIGN_IOS_ROOT", "android": "WISDOMDESIGN_ANDROID_ROOT"}
PROVIDER_SUBDIR = "ai/skill-provider"
LICENSE_TEXT = (
    "GENERATED PACKAGE - DO NOT EDIT.\n"
    "Built by wisdomdesign/tools/ai-skill/package.py from WisdomDesign truth sources.\n"
    "Core: design semantics only. Platforms: real public APIs, capability and verification status as recorded.\n"
)


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def tree(root):
    return sorted(p for p in root.rglob("*") if p.is_file())


def read_json(path, default=None):
    try:
        return json.loads(path.read_text())
    except FileNotFoundError:
        return default


def copy_tree(src, dst):
    if not src.exists():
        raise SystemExit(f"missing provider source: {src}")
    for p in tree(src):
        rel = p.relative_to(src)
        target = dst / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(p, target)


def run_node(args):
    result = subprocess.run(["node", *args], cwd=DESIGN, capture_output=True, text=True)
    if result.returncode != 0:
        raise SystemExit("node " + " ".join(args) + " failed: " + result.stdout + result.stderr)
    return result.stdout.strip()


def platform_root(platform, args):
    explicit = getattr(args, platform + "_root")
    if explicit:
        root = Path(explicit).resolve()
        if not root.exists():
            raise SystemExit(f"--{platform}-root does not exist: {root}")
        return root
    env = os.environ.get(PLATFORM_ENV[platform])
    if env:
        root = Path(env).resolve()
        if not root.exists():
            raise SystemExit(f"{PLATFORM_ENV[platform]} does not exist: {root}")
        return root
    sibling = REPO / PLATFORM_REPO_DIR[platform]
    if sibling.exists():
        return sibling
    return None


def require_platform_root(platform, args):
    root = platform_root(platform, args)
    if root is None:
        raise SystemExit(
            f"platform source for '{platform}' is not available: expected sibling directory "
            f"'{REPO / PLATFORM_REPO_DIR[platform]}'. Checkout the {PLATFORM_REPO_DIR[platform]} repo there, "
            f"pass --{platform}-root <dir>, set {PLATFORM_ENV[platform]}, or run with --platforms core "
            f"(Core package only)."
        )
    provider = root / PROVIDER_SUBDIR
    if not (provider / "provider.json").exists():
        raise SystemExit(f"{platform} provider not found at {provider / 'provider.json'}; check --{platform}-root")
    return root


def selected_packages(platforms):
    packages = ["core"]
    for platform in platforms:
        packages.append(platform)
    if "ios" in platforms and "android" in platforms:
        packages.append("all")
    return packages


def expected_packages(platforms_csv):
    platforms = [p for p in platforms_csv.split(",") if p and p != "core"]
    unknown = [p for p in platforms if p not in PLATFORM_NAMES]
    if unknown:
        raise SystemExit(f"unknown platform(s): {','.join(unknown)}; choose from core,{','.join(PLATFORM_NAMES)}")
    return selected_packages(platforms)


def write_manifest(pkg_root, package_name, platforms, args):
    command = [
        str(WRITE_MANIFEST),
        "--root", str(pkg_root),
        "--package", package_name,
        "--platforms", ",".join(["core", *platforms]),
        "--skill-version", VERSION,
    ]
    for platform in platforms:
        command += [f"--{platform}-root", str(require_platform_root(platform, args))]
    run_node(command)
    manifest = read_json(pkg_root / "manifest.json")
    actual = len(tree(pkg_root))
    if manifest["contents"]["fileCount"] != actual:
        raise SystemExit(
            f"{package_name}: manifest.contents.fileCount {manifest['contents']['fileCount']} != actual {actual}"
        )
    return manifest


def append_platform_skill(pkg_root, title, lines):
    path = pkg_root / "SKILL.md"
    with open(path, "a", encoding="utf-8") as f:
        f.write("\n## " + title + "\n\n" + "\n".join(lines) + "\n")
    size = path.stat().st_size
    if size > RESIDENT_BUDGET_BYTES:
        raise SystemExit(f"{pkg_root.name}: SKILL.md exceeds resident budget {size} > {RESIDENT_BUDGET_BYTES}")
    return size


def zip_package(pkg_root, out_path):
    out_path.parent.mkdir(parents=True, exist_ok=True)
    if out_path.exists():
        out_path.unlink()
    with zipfile.ZipFile(out_path, "w", zipfile.ZIP_DEFLATED) as z:
        for p in tree(pkg_root):
            info = zipfile.ZipInfo(str(p.relative_to(pkg_root)).replace("\\", "/"), FIXED_DATE)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            info.create_system = 3
            z.writestr(info, p.read_bytes())
    return out_path


def parse_args(argv):
    parser = argparse.ArgumentParser(description="Deterministic WisdomDesign Skill packaging")
    parser.add_argument(
        "--platforms",
        default="core,ios,android",
        help="comma list of core,ios,android (default core,ios,android); use 'core' for a single-repo checkout",
    )
    parser.add_argument("--ios-root", default=None, help="iOS checkout root (default: sibling ../iOS or WISDOMDESIGN_IOS_ROOT)")
    parser.add_argument("--android-root", default=None, help="android checkout root (default: sibling ../android or WISDOMDESIGN_ANDROID_ROOT)")
    parser.add_argument("--dist-version", default=VERSION, help=argparse.SUPPRESS)
    args = parser.parse_args(argv)
    args.wanted = [p for p in args.platforms.split(",") if p and p != "core"]
    unknown = [p for p in args.wanted if p not in PLATFORM_NAMES]
    if unknown:
        raise SystemExit(f"unknown platform(s): {','.join(unknown)}; choose from core,{','.join(PLATFORM_NAMES)}")
    return args


def main(argv=None):
    args = parse_args(sys.argv[1:] if argv is None else argv)
    for platform in args.wanted:
        require_platform_root(platform, args)

    if STAGING.exists():
        shutil.rmtree(STAGING)
    STAGING.mkdir(parents=True)

    core = STAGING / "wisdom-page-core"
    core_command = [str(CLI), "build", "--out", str(core)]
    for platform in args.wanted:
        core_command += [f"--{platform}-root", str(platform_root(platform, args))]
    run_node(core_command)

    packages = {"core": core}
    for platform in args.wanted:
        root = require_platform_root(platform, args)
        pkg = STAGING / f"wisdom-page-{platform}"
        shutil.copytree(core, pkg)
        copy_tree(root / PROVIDER_SUBDIR, pkg / "platforms" / platform)
        status = read_json(root / PROVIDER_SUBDIR / "provider.json", {}).get("status", {})
        effective = status.get("effective", "spec-only") if isinstance(status, dict) else str(status)
        append_platform_skill(pkg, f"Platform: {platform}", [
            f"Provider and API cards are under platforms/{platform}/.",
            f"Effective status: {effective}.",
        ])
        packages[platform] = pkg

    if "ios" in args.wanted and "android" in args.wanted:
        allpkg = STAGING / "wisdom-page-all"
        shutil.copytree(core, allpkg)
        for platform in args.wanted:
            copy_tree(require_platform_root(platform, args) / PROVIDER_SUBDIR, allpkg / "platforms" / platform)
        append_platform_skill(allpkg, "Platforms: ios, android", [
            "Use platforms/<id>/ provider data per task; do not mix platform APIs.",
            "Each platform keeps its own evidence; never mechanically translate one platform into another.",
        ])
        packages["all"] = allpkg

    for pkg in packages.values():
        (pkg / "LICENSE-NOTICE.txt").write_text(LICENSE_TEXT, encoding="utf-8")

    manifests = {}
    for name in ["core", *args.wanted, *(["all"] if "all" in packages else [])]:
        platforms = [] if name == "core" else (list(args.wanted) if name == "all" else [name])
        manifests[name] = write_manifest(packages[name], f"wisdom-page-{name}", platforms, args)

    final = DIST / f"v{args.dist_version}"
    if final.exists():
        shutil.rmtree(final)
    final.mkdir(parents=True)
    (final / "packages").mkdir()
    checksums = {"schemaVersion": "1.0", "generatedBy": "tools/ai-skill/package.py", "version": args.dist_version, "packages": {}}
    for name in packages:
        pkg = packages[name]
        dest = final / f"wisdom-page-{name}"
        shutil.copytree(pkg, dest)
        zip_path = zip_package(dest, final / "packages" / f"wisdom-page-{name}.zip")
        with zipfile.ZipFile(zip_path) as z:
            entries = len(z.namelist())
            if z.testzip() is not None:
                raise SystemExit(f"{zip_path.name}: CRC check failed")
        checksums["packages"][f"wisdom-page-{name}"] = {
            "zipPath": f"packages/wisdom-page-{name}.zip",
            "zipSha256": sha256(zip_path),
            "zipBytes": zip_path.stat().st_size,
            "zipEntries": entries,
            "manifestPath": f"wisdom-page-{name}/manifest.json",
            "manifestSha256": sha256(dest / "manifest.json"),
            "filesIndexPath": f"wisdom-page-{name}/files.json",
            "filesIndexSha256": sha256(dest / "files.json"),
            "fileCount": manifests[name]["contents"]["fileCount"],
            "contentHash": manifests[name]["contents"]["contentHash"],
        }
    (final / "checksums.json").write_text(json.dumps(checksums, indent=2) + "\n", encoding="utf-8")
    shutil.rmtree(STAGING)
    print("platforms:", ",".join(["core", *args.wanted]))
    for name in packages:
        entry = checksums["packages"][f"wisdom-page-{name}"]
        print(f"packaged {name}: {entry['fileCount']} files, zip {entry['zipEntries']} entries, {entry['zipSha256']}")
    print("checksums:", sha256(final / "checksums.json"))


if __name__ == "__main__":
    try:
        main()
    except subprocess.CalledProcessError as error:
        print("package failed:", error, file=sys.stderr)
        raise SystemExit(1)
