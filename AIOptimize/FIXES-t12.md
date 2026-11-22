# R12 修复记录：单仓 CI 可运行性与文档一致性（t12）

> 修复人：pipeline-fixer（t12）。时间：2026-11-22（Asia/Shanghai）。
> 输入：R9 `review/04b-pipeline-reverification.md`（needs_revision）。
> 边界：只改 `wisdomdesign/{tools/ai-skill,.github,ai/skill,AIOptimize}/**`；未改 iOS / Android 源码、Provider 内容或 API/ABI 基线；未重写其他复核人的 `review/*.md`。

## 0. 结论先行

R9 的 4 类 blocking/partial finding 已修复，并分别用**单仓 /tmp 干净复现**与**三仓工作区**两条路径实测：

| R9 发现 | 修复后 |
| --- | --- |
| 单仓 checkout 下 `cli.js build/test`、`package.py` 因同级 iOS/android 不存在而失败 | `cli.js build/test` 不再要求平台仓；`package.py` 新增 `--platforms` 与 `--ios-root/--android-root`（或 env），默认 full 缺平台仓时**清晰非零退出**，`--platforms core` 单仓成功 |
| `manifest.js.catalogIds()` 依赖预生成 `ai/skill/core/catalog`（自举循环） | 组件集合改从设计真源 `contracts/WD*.yaml` 读取；`cli.js build` 在无 catalog 的干净 checkout 可直接构建；源码布局 runtime 测试按需用同一生成器补齐 catalog |
| `m4-ci` 死链审计把 `../../iOS/...` 跨仓证据链接判死；`md ≥ 90` 下限依赖生成 dist | 跨仓链接显式分类：平台仓存在时校验文件、单仓时记 cross-repo/unverifiable（不计死链），其它越界仍判死；下限改为源文档口径（≥20 内部链接、≥10 md） |
| F11 仍有过期数字 | 按最终一次 m4-ci/governance 输出刷新 04 两份与 `FIXES-t8.md`（governance 23、当前 fingerprint、md 数、5 个 job）；02 设计文档 §4.3/§11/§12.1 与实现对齐 |

## 1. 单仓可运行（P0）

### 1.1 平台来源解析（`lib/manifest.js`）

- `repoState(name, repoRoots)`：wisdomdesign 固定为本仓；iOS / android 依次尝试
  `--ios-root/--android-root` → `WISDOMDESIGN_IOS_ROOT/WISDOMDESIGN_ANDROID_ROOT` → 同级 `../iOS`、`../android`；
  不存在时返回 `null`（不执行 git，不伪造 commit）。
- Core 包只记录实际存在的仓库；当包选中某平台但该平台来源不存在时，构建以明确错误失败：
  `package includes ios but its source checkout is unavailable; checkout the iOS repo next to wisdomdesign, pass --ios-root <dir>, or set WISDOMDESIGN_IOS_ROOT`。
- manifest schema 的 `sources.repositories.required` 从三仓改为 **wisdomdesign 必填**（平台包仍带各自仓状态）；Core-only 包不再需要伪造平台 commit。

### 1.2 CLI / 打包器（`cli.js`、`package.py`、`write-manifest.js`）

- `cli.js build` 新增可选 `--ios-root/--android-root`（仅来源出处）；不传也能构建 Core（平台来源缺省则不记录）。
- `package.py --platforms core|core,ios,android`（默认 full）；`--ios-root/--android-root` 支持任意 checkout 位置（CI 用 `platform-checkouts/`，不再假设三仓同级）。
- 默认 full 且平台仓缺失时：`exit 1` + 明确提示（checkout / `--*-root` / `--platforms core`），不静默降级。
- `write-manifest.js` 同步新增根目录参数；四类包仍共用 `lib/manifest.js` 单套格式。

### 1.3 无预生成 catalog 自举

- `catalogIds()` 改读 `contracts/WD*.yaml`（37），不再读 `ai/skill/core/catalog/manifest.json`；
- `runtime.test.js` 在源码布局用例前检查 `ai/skill/core/catalog/manifest.json`，缺失时用 `lib/generate-core-catalog.js` 生成（与 `cli.js build` 同一生成器），因此 `cli.js test` 在干净 checkout 可运行。

### 1.4 CI workflow（单仓默认 + 显式 full）

- `contract-structure`（L0）、`change-scope-routing`（L1）、`native-depth`（L2）均单仓可运行；
- `package-repro` 默认 `--platforms core`（core-only dist + `dist-package --platforms core`）；仅当
  `vars.WISDOM_IOS_REPO` / `vars.WISDOM_ANDROID_REPO` 与 `secrets.WISDOM_REPO_TOKEN` 均已配置时，
  显式 checkout 平台仓到 `platform-checkouts/{iOS,android}` 并切到 full（`--ios-root/--android-root`），同时跑 `check-native-layers --strict-evidence`；
- `release-gate`（L3）校验 artifact 中实际存在的包集（core-only 或 full），不再假设四包；
- 默认路径不假设三仓同时存在，也不把未执行的原生/宿主/M5 项写成通过。

## 2. 死链审计（单仓可运行）

- 新增 `classifyLink()`：`internal`（仓内，必须存在）/ `cross-repo`（`../../iOS|android`，平台仓存在时校验文件；单仓时记 unverifiable）/ `escape`（其它越界，判死）。
- 新增用例 `dead-link-cross-repo-classification`、`dead-link-escape-rejected`。
- `dead-link-audit-not-empty` 下限改为源文档口径（≥20 内部链接、≥10 md），不再依赖 `dist`/生成的 catalog；单仓 checkout 实测 16 md / 47 internal / 6 cross-repo(6 unverifiable) / 0 dead；workspace 269 md / 47 internal / 6 cross-repo / 0 dead。
- 真源指纹（`check-no-mutation`）排除生成的 `core/catalog` 与 `core/dist`，单仓与完整工作区指纹一致（文档可引用稳定值）。

## 3. 文档一致性（F11）

- `04-M4-CI-Verification.md`：governance 19→23、m4-ci 61→63、fingerprint → 当前值、md 267→268（最终 269，含本文件）、内部链接 50→44 + 跨仓 6；新增单仓复现矩阵。
- `04-M4-CI-Compatibility-Contract.md`：“四层 job” → 5 个 job（L0 / L1 / L2 / package-repro / L3），并写明 core-only 默认与 full 显式 checkout。
- `FIXES-t8.md`：fingerprint `2eef9f399184` 更新为当前值并注明复算范围（排除生成 catalog/dist）。
- `02-SKILL-BUILD-PIPELINE.md` §4.3 改为实际 dist 布局（无 `reports/`，含 `files.json/build-info.json/checksums.json`）；§11 CLI 契约改为实际 `build/check/test` + `package.py` + `eval/run.js`（删除不存在的 `pack/verify-templates/evaluate`）；§12.1 补单仓/core-only 说明；§16 判定同步。

## 4. 验证矩阵

### 4.1 单仓 /tmp 干净复现（无 `../iOS`、`../android`，无 `ai/skill/core/catalog`、`dist`）

| 命令 | 退出码 | 结果 |
| --- | --- | --- |
| `node tools/ai-skill/tests/m4-ci.test.js` | 0 | 63 PASS / 0 FAIL；死链 0（6 跨仓链接 unverifiable） |
| `node tools/ai-skill/tests/contract-selftest.js` | 0 | 25 PASS |
| `node tools/ai-skill/tests/governance-selftest.js` | 0 | M6 GOVERNANCE SELFTEST OK |
| `node tools/ai-skill/cli.js test` | 0 | 契约 25 + 目录 8 + 运行时 12 + 构建 11 |
| `node tools/ai-skill/cli.js build` + `check` | 0 / 0 | 52 文件；manifest schema-valid；check OK |
| `python3 tools/ai-skill/package.py --platforms core` ×2 | 0 / 0 | core-only 53 文件；两次 checksums 逐字节一致 |
| `node tools/ai-skill/tests/dist-package.test.js --platforms core` | 0 | 32/32 |
| `node tools/ai-skill/ci/release-gate.js` | 0 | core-only candidate validated |
| `node tools/ai-skill/ci/check-native-layers.js --plan …` | 0 | 登记通过；平台证据 external-owned（不判死、不声称通过） |
| `python3 tools/ai-skill/package.py`（默认 full，无平台仓） | 1 | 明确提示平台来源缺失与三种修复方式 |

### 4.2 三仓工作区（本机）

| 命令 | 退出码 | 结果 |
| --- | --- | --- |
| `node tools/ai-skill/cli.js test` | 0 | 契约 25 + 目录 8 + 运行时 12 + 构建 11 |
| `node tools/ai-skill/cli.js build` + `check` | 0 / 0 | 52 文件，resident 5,389 B |
| `python3 tools/ai-skill/package.py` ×2 | 0 / 0 | 四包 53/98/80/125；checksums 逐字节一致 |
| `node tools/ai-skill/tests/dist-package.test.js` | 0 | 119/119 |
| `node tools/ai-skill/ci/release-gate.js` | 0 | 四包 candidate validated |
| `node tools/ai-skill/ci/check-native-layers.js --strict-evidence` | 0 | 7 层登记 + 平台仓证据指针可解析 |
| `node tools/ai-skill/tests/m4-ci.test.js` | 0 | 63 PASS |

### 4.3 单仓 + 显式平台根（模拟 CI full 模式）

在 /tmp 干净 checkout 中执行
`package.py --platforms core,ios,android --ios-root <workspace>/iOS --android-root <workspace>/android`：
四包生成成功；`dist-package --platforms core,ios,android` 119/119；`check-native-layers --strict-evidence --ios-root … --android-root …` 证据指针全部解析。

## 5. 变更文件

- `tools/ai-skill/lib/manifest.js`：平台来源解析（显式根/env/同级）、`catalogIds` 改读 contracts、schema 校验保持、单仓时省略平台来源。
- `tools/ai-skill/lib/write-manifest.js`、`cli.js`：新增 `--ios-root/--android-root`。
- `tools/ai-skill/package.py`：`--platforms`、平台根参数、按包集生成 checksums、清晰错误语义。
- `ai/skill/manifest/manifest.schema.json`：`sources.repositories.required` 放宽为 wisdomdesign（Core-only 不再伪造平台 commit）；平台包仍记录各自仓状态。
- `tools/ai-skill/tests/{m4-ci,dist-package,runtime}.test.js`；`tools/ai-skill/ci/{check-native-layers,release-gate}.js`。
- `tools/ai-skill/README.md`；`.github/workflows/ai-skill-ci.yml`。
- `AIOptimize/{02-SKILL-BUILD-PIPELINE,04-M4-CI-Verification,04-M4-CI-Compatibility-Contract,FIXES-t8}.md` 与本文件。
- 生成物：`ai/skill/core/{catalog,dist}/**`、`dist/ai-skill/v1.0.0/**`、`tools/ai-skill/reports/m4-ci-result.json`（可再生，不作提交证据）。

## 6. 未闭合边界（不得写成“已通过”）

1. 原生编译/快照/UI/真机未执行：iOS UI 矩阵 PTY blocked；Android 编译 blocked（缺 `:demo`）；本仓 CI 只校验登记与证据指针。
2. 宿主加载未执行；L3 只校验候选包不变量。
3. M5 真实评测未执行（5 blockers、observation-only）。
4. `platforms/ios/CI-INTEGRATION.md` 的机器路径属 iOS 仓文件，仍以 `package-exemptions.json` 登记而非改写平台文件。
5. 平台包内 provider evidenceRefs 仍为平台仓相对路径（R8 边界，未改平台文件）。
6. 跨机器确定性未验证（同机、同 Node/Python 版本两次一致）。
