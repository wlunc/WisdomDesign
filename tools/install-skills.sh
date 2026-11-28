#!/usr/bin/env bash
# Install the four rebuilt skill packages into the DSH skills directory.
# Every destination is verified to resolve under $SKILLS before anything is deleted.
set -euo pipefail

DIST="$PWD/dist/ai-skill/v1.0.0"
SKILLS="$HOME/.dsh/skills"
STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP="$SKILLS/.backup-$STAMP"

[ -d "$DIST" ] || { echo "FATAL: dist missing: $DIST"; exit 1; }
[ -d "$SKILLS" ] || { echo "FATAL: skills dir missing: $SKILLS"; exit 1; }
mkdir -p "$BACKUP"

PAIRS=(
  "wisdom-page-core:wisdom-page-design"
  "wisdom-page-ios:wisdom-page-ios"
  "wisdom-page-android:wisdom-page-android"
  "wisdom-page-all:wisdom-page"
)

# Guard: only ever touch a direct child of $SKILLS named wisdom-page*.
for pair in "${PAIRS[@]}"; do
  src="${pair%%:*}"; dst="${pair##*:}"
  case "$dst" in
    wisdom-page|wisdom-page-*) ;;
    *) echo "REFUSING unexpected destination name: $dst"; exit 1 ;;
  esac
  [ -d "$DIST/$src" ] || { echo "REFUSING missing package: $DIST/$src"; exit 1; }
done

echo "== backup =="
for pair in "${PAIRS[@]}"; do
  dst="${pair##*:}"
  if [ -d "$SKILLS/$dst" ]; then
    cp -R "$SKILLS/$dst" "$BACKUP/$dst"
    echo "  saved $dst ($(find "$SKILLS/$dst" -type f | wc -l | tr -d ' ') files)"
  fi
done

echo "== install =="
for pair in "${PAIRS[@]}"; do
  src="${pair%%:*}"; dst="${pair##*:}"
  rm -rf "$SKILLS/$dst"
  cp -R "$DIST/$src" "$SKILLS/$dst"
  echo "  $dst <- $src ($(find "$SKILLS/$dst" -type f | wc -l | tr -d ' ') files)"
done

echo "== verify manifests =="
for pair in "${PAIRS[@]}"; do
  dst="${pair##*:}"
  node -e '
    const m = require(process.argv[1] + "/manifest.json");
    console.log("  " + process.argv[2].padEnd(20) + " " + m.package.padEnd(18) +
      m.status.releaseKind.padEnd(18) + m.contents.fileCount + " files");
  ' "$SKILLS/$dst" "$dst"
done

echo "== smoke: core runtime from the installed location =="
CORE="$SKILLS/wisdom-page-design"
node "$CORE/runtime/get-component.js" --query 按钮 --json | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);console.log("  query 按钮 -> " + j.candidates.slice(0,3).map(c=>c.id).join(", ") + " (matched: " + (j.candidates[0].matched||[]).join("|") + ")");})'
node "$CORE/runtime/resolve-token.js" --path text.tertiary
node "$CORE/runtime/validate-spec.js" --file "$CORE/page-spec/examples/task-list.valid.json"
echo "  card sections: $(grep -c '^## ' "$CORE/catalog/components/WDButton.md") (4 titles + anatomy/size/variants)"

echo "== done: $BACKUP holds the previous installs =="
