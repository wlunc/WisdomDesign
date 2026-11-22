# R9 独立复验报告：Core / 打包 / CI 修复（R8）

> 复核人：pipeline-reviewer（独立复验；非 R8 实现者）
> 复核时间：2026-11-22 10:56–11:10（Asia/Shanghai）
> 复核对象：`wisdomdesign` 的 Core / manifest / 打包器 / CI / 治理产物，以及 R8 修复记录 `AIOptimize/FIXES-t8.md`；边界依赖 t6 iOS Provider、t10 Android Provider 的交付状态。
> 只读边界：未修改实现、契约、平台源码或 API/ABI 基线；只新增本报告。为验证确定性按任务要求重跑 `package.py` 两次（生成物 `dist/ai-skill` 被重建，R8 哈希保持），其余写模式在 `/tmp` 副本执行。
> 环境：wisdomdesign HEAD `b2c05d9`（tracked 修改仅 `AIOptimize/README.md`、`ai/README.md`，由 R8 文档刷新产生；CLI/catalog/dist 为生成物）；iOS HEAD `64539fe`；android HEAD `3656d6f`；Node v24.21.0；Python 3.10.4；Ruby 3.0.0p0。

## 0. 结论

**R9 verdict：needs_revision（附非阻断剩余项，见 §7）。**

- R8 的打包/运行时候选产物在本机多仓工作区成立：四包 runtime 可运行且错误退出非零（dist-package 118/118）；核心与四包 manifest 对 M0 schema 0 错、fileCount/LICENSE/files.json/checksums 自洽；`package.py` 两次重跑 checksums 逐字节一致并与当前 HEAD/provider 一致；release-gate/打包/复现/native-layer 脚本本地均可跑通。
- 但 **CI 作为 GitHub Actions（单仓 checkout）不可运行**：`cli.js build` 依赖同级的 `iOS/`、`android/` git 仓库与已生成 `ai/skill/core/catalog`；workflow 既不 checkout 平台仓，也不在 L0 生成 catalog/dist；干净 checkout 下 L0 `m4-ci`、`cli.js test` 与 `package-repro` 均失败。另 `m4-ci` 的死链审计把 `AIOptimize/README.md` 指向 `../../iOS/...` 的跨仓引用当作本仓内部链接，且 `dead-link-audit-not-empty` 要求 ≥90 md（依赖 dist/生成目录），在干净 checkout 上必失败。详见 §3。
- F11 的过期断言只修了一部分：`05` 与治理文档已刷新；`04-M4-CI-Verification.md` 的 governance 计数（19 vs 当前 23）、truthFingerprint（`7f1eb8969490` vs 当前 `449363d1a98b`）、死链 md 数（267 vs 当前 268），以及 `04-M4-CI-Compatibility-Contract.md` 的“四层 job”（当前 5 job）仍与当前输出不符；`FIXES-t8.md` 里的 `2eef9f399184` 也非当前值。F11 因此不能判 PASS。

| # | 任务清单 | 复验结论 | 主要证据 |
| --- | --- | --- | --- |
| 1 | dist 四包 get-component / validate-spec 可运行，错误退出非零 | **PASS** | dist-package 118/118；四包 runtime 六类退出码实测；§2.1 |
| 2 | core 与四包 manifest schema 0 错、fileCount/LICENSE/hash 自洽 | **PASS** | 5 个 manifest 0 schema errors；53/98/80/125 文件；LICENSE 入 files.json；checksums 三个自哈希匹配；§2.2 |
| 3 | package.py 两次重跑哈希一致且与当前 HEAD/provider 一致 | **PASS** | 两次 checksums `332ee1fc…` 一致；sources commit/contentHash 与当前 repoState 一致；provider 载荷逐字节等于源；§2.3 |
| 4 | CI 路由/打包/复现/运行时/预算/死链真实生效，无自动提交 | **FAIL** | 本地脚本全过；干净单仓 checkout 下 L0/package-repro 失败；跨仓链接与 md≥90 门槛不适配 CI；§3 |
| 5 | 治理与 05 报告不再过期 | **PARTIAL** | 05 已改用 `t11-post-t9`、5 blockers；governance 23 PASS；04-M4 两份报告仍有过期数字；§4 |
| 6 | F3–F5/F7/F9–F11 修复证据 | **PARTIAL** | F3/F4/F5/F7/F9/F10 有可复跑证据；F11 仍过期；§5 |
| 7 | 平台源码/API/ABI 零改动 | **PASS** | iOS/android HEAD 未变；API/ABI 工作区 SHA-256 等于 HEAD blob；tracked 改动仅 iOS 既有 `.gitignore`；§6 |

## 1. 环境、命令与只读边界

### 1.1 关键命令与退出码（本机多仓工作区，E1）

| 命令 | 退出码 | 结果 |
| --- | --- | --- |
| `node tools/ai-skill/tests/dist-package.test.js` | 0 | **118 PASS / 0 FAIL**；四包 manifest schema、fileCount、逐文件哈希、LICENSE、checksums、ZIP、runtime、预算均通过 |
| `node tools/ai-skill/tests/m4-ci.test.js` | 0 | **61 PASS / 0 FAIL**；死链审计本地 **268 md / 50 links / 0 dead** |
| `node tools/ai-skill/tests/contract-selftest.js` | 0 | 25 PASS |
| `node tools/ai-skill/tests/governance-selftest.js` | 0 | 23 PASS |
| `node tools/ai-skill/cli.js test` | 0 | M0 25 + catalog 8 + runtime 12 + build 11 全过 |
| `node tools/ai-skill/cli.js check` | 0 | 52 files match reproducible rebuild |
| `python3 tools/ai-skill/package.py` ×2 | 0 / 0 | 四包 53/98/80/125 文件；两次 checksums 逐字节一致（`332ee1fc…`） |
| `node tools/ai-skill/ci/release-gate.js` | 0 | 四包 candidate validated（workspace-snapshot；dirty=wisdomdesign,ios,android） |
| `node tools/ai-skill/ci/check-native-layers.js --plan <all-native> --strict-evidence` | 0 | 7 个原生层登记；iOS/android evidence JSON pointer 均解析 |
| `node tools/ai-skill/eval/run.js --check-readiness` | 2 | 5 blockers（预期前置不满足） |
| `node tools/ai-skill/eval/run.selftest.js`（/tmp 副本） | 0 | 16 PASS；24 cells 全 not-executed |
| `ruby tools/contracts-check.rb` | 0 | 37 组件通过 |
| `bash tools/token-build/selftest.sh` | 0 | 26 PASS / 0 FAIL |

### 1.2 写操作透明记录

| 对象 | 操作 | 说明 |
| --- | --- | --- |
| `dist/ai-skill/v1.0.0/**` | 重建两次 | R8 声明哈希 `332ee1fc…`；本次两次结果与 R8 完全一致（见 §2.3） |
| `tools/ai-skill/reports/m4-ci-result.json` | m4-ci 测试重写 | 生成物；当前 truthFingerprint `449363d1a98b…` |
| `ai/skill/core/dist/**`、`core/catalog/**` | 未由本次写入 | 仅读取；R8 生成物 |
| `AIOptimize/review/04b-pipeline-reverification.md` | 新增 | 本报告 |

> 未改实现代码；未写 iOS/android 源文件或 API/ABI；干净 checkout 模拟全部在 `/tmp` 完成。

## 2. 打包与运行时候选产物

### 2.1 四包 runtime（PASS）

在 `dist/ai-skill/v1.0.0` 的四个 package 内分别实测 `runtime/get-component.js` 与 `runtime/validate-spec.js`：

| 包 | exact (WDButton) | keyword (搜索) | unknown (WDFake) | catalog escape | valid spec | missing spec |
| --- | --- | --- | --- | --- | --- | --- |
| core | exit 0 | exit 0 | exit 3 | exit 2 | exit 0 | exit 2 |
| ios | exit 0 | exit 0 | exit 3 | exit 2 | exit 0 | exit 2 |
| android | exit 0 | exit 0 | exit 3 | exit 2 | exit 0 | exit 2 |
| all | exit 0 | exit 0 | exit 3 | exit 2 | exit 0 | exit 2 |

dist-package 118/118 还覆盖：包内 runtime 默认 catalog 解析、overlay 别名搜索、catalog 越界拒绝、ZIP 内文件与磁盘逐字节一致、路径安全、固定 2020-01-01/0644 元数据、SKILL 预算 5,389/5,489/5,497/5,582 < 6,000、包内死引用 0。

### 2.2 manifest / files.json / checksums（PASS）

独立脚本（`schema-lite.js` + `ai/skill/manifest/manifest.schema.json`）复核结果：

| 对象 | schema 错误 | fileCount / 实际 | files.json 条目 | LICENSE 入哈希 | 哈希不匹配 |
| --- | ---: | ---: | ---: | --- | ---: |
| `ai/skill/core/dist/wisdom-page-core` | 0 | 52 / 52 | 50（+2 自指） | 无（core 构建产物，不写 LICENSE） | 0 |
| dist core | 0 | 53 / 53 | 51（+2 自指） | 是 | 0 |
| dist ios | 0 | 98 / 98 | 96（+2 自指） | 是 | 0 |
| dist android | 0 | 80 / 80 | 78（+2 自指） | 是 | 0 |
| dist all | 0 | 125 / 125 | 123（+2 自指） | 是 | 0 |

- `manifest.contents.contentHash` 与 `files.json.contentHash` 一致；`files.json.sha256` 覆盖除 `manifest.json`/`files.json` 外全部文件。
- `checksums.json` 的 `zipSha256`/`manifestSha256`/`filesIndexSha256`/`fileCount` 对四包全部匹配（独立重算 SHA-256）。
- `manifest.json` 自身与 `files.json` 的自指哈希通过 `checksums.json` 发布，修复了 R4 的“自哈希缺失/错误”问题。
- source-core（`ai/skill/core/dist/wisdom-page-core`）不含 `LICENSE-NOTICE.txt`，与其“构建中间产物”定位一致；交付 dist core 包含。

### 2.3 两次打包与来源一致性（PASS）

`package.py` 连续两次运行（本机多仓工作区，dirty=true）输出完全一致：

| 产物 | SHA-256 |
| --- | --- |
| checksums.json | `332ee1fc1fb4ea7c4e52a47cd76187fa55d5477e0f2f831cfda6c16c474f5a0f` |
| wisdom-page-core.zip | `d590fe08f206ae508e39f2f2dfbb9a18e1a8f03aef9ac4d1e66f1a6fc86709ae` |
| wisdom-page-ios.zip | `29ac36167470c655de2f13b18c5afbb3414363c1d4826242a0f6da20d33a95f1` |
| wisdom-page-android.zip | `f3a3e75015529d2092c1b8f63e067ae5f7fafe880a0ceb4ae41b8786db496f2d` |
| wisdom-page-all.zip | `74e93ee874a43c2f8cff232528636e07262684cfdb91ab637b23d084b412c54e` |

来源一致性（用 `manifest.js` 的 `repoState` 重算并与包 manifest 对比）：

- `sources.repositories.{wisdomdesign,ios,android}.commit/contentHash/dirty/dirtyFiles` 全部一致；commit 分别为 `b2c05d9` / `64539fe` / `3656d6f`。
- iOS/Android 的 `platforms/<id>/**` 与平台 provider 源文件逐字节一致（iOS 42/42、Android 26/26；见 dist-package / 手工比对）。
- 四包 `status.releaseKind=workspace-snapshot`（三仓 dirty=true），`status.overall` 为 core spec-only、平台包 experimental；与当前证据一致。
- 包内 evidenceRefs 仍为平台仓相对路径（如 `api/WisdomUI.api.json`）；这是 R8 明确记录的边界，不影响包 manifest 的 schema/哈希自洽，但安装后“包内自包含证据”仍不可解析（见 §7）。

## 3. CI 复核：本地可跑，标准单仓 GitHub Actions 不可跑（FAIL）

### 3.1 结构与本地脚本（PASS）

- workflow 现有 **5 个 job**：L0 `contract-structure`、L1 `change-scope-routing`、L2 `native-depth`、`package-repro`、L3 `release-gate`；触发 PR / main push / workflow_dispatch，`permissions: contents: read`。
- L1 用 `git diff --name-only origin/<base>...HEAD` 生成 `changed-files.txt`，PR 走 `--paths-file --require-paths`（空列表 exit 2），不再依赖 `pull_request.changed_files` 数组。
- L2 `check-native-layers.js` 登记 7 个原生层；本地 `--strict-evidence` 全部 JSON pointer 解析通过；本仓不执行 xcodebuild/gradle。
- `package-repro` 本地执行 `cli.js build/check`、两次 `package.py` + checksums diff、`dist-package` 118 项；`release-gate.js` 本地 exit 0。
- 无 `git commit`/`git push`/`git tag`/发布上传步骤；`release-gate` 仅 `workflow_dispatch` + `inputs.release='true'` 运行；结论：无自动提交/自动发布。
- 本地 `m4-ci` 61/61；死链正则已修复，50 条内部链接真实匹配（`dead-link-audit-not-empty` 也通过）；这一点修复了 R4 的空跑问题。

### 3.2 干净单仓 checkout 的失败（FAIL，blocking）

按 GitHub Actions 默认单仓 checkout（只有 `wisdomdesign`，无 `iOS/`、`android/` 兄弟目录，无生成 `ai/skill/core/catalog` 和 `dist`）复现：

| 场景 | 命令 | 退出码 | 结果 |
| --- | --- | --- | --- |
| 干净单仓（无平台仓） | `node tools/ai-skill/tests/m4-ci.test.js` | 1 | **59/61**；死链审计命中 `AIOptimize/README.md -> ../../iOS/...` 5 条；`dead-link-audit-not-empty` 只有 15 md |
| 干净单仓 | `node tools/ai-skill/cli.js build` | 1 | `git rev-parse HEAD failed: fatal: cannot change to '.../iOS'` |
| 干净单仓 | `node tools/ai-skill/cli.js test` | 1 | **4/12 tests failed**（runtime packaged-layout / build 用例） |
| 干净单仓 | `python3 tools/ai-skill/package.py` | 1 | CLI build 在 `git rev-parse` 处失败 |
| 有平台仓兄弟目录、无生成 catalog/dist | `node tools/ai-skill/cli.js build` | 1 | `missing generated Core catalog; run tools/ai-skill/cli.js build first`（自举循环） |
| 同上 | `node tools/ai-skill/cli.js test` | 1 | **4/12 tests failed** |
| 同上 | `python3 tools/ai-skill/package.py` | 1 | 同上 missing generated Core catalog |
| 同上 | `node tools/ai-skill/tests/m4-ci.test.js` | 1 | **60/61**；dead-link 可解析（平台仓在），但 `dead-link-audit-not-empty` 只有 15 md |

根因（读源码确认）：

1. `tools/ai-skill/lib/manifest.js` 的 `repoState()` 对 wisdomdesign/ios/android 全部执行 `git rev-parse`/`status`；`REPOSITORIES` 的 iOS/android 路径固定为 `wisdomdesign` 的 sibling。workflow 只 `actions/checkout@v4` 了一个仓，`package-repro` 也没有 checkout 平台仓。因此 `cli.js build`、`cli.js test`、`package.py` 在任何标准 GitHub Actions checkout 上失败。
2. `manifest.js` 的 `catalogIds()` 读 `ai/skill/core/catalog/manifest.json`（源码树生成物），而不是刚生成的 `out/catalog`；`cli.js renderInto()` 虽然把 catalog 生成到 `out/catalog`，但 `buildManifest()` 仍要求源码树里已有 catalog。干净 checkout 无此生成物 → `missing generated Core catalog` → `cli.js build` 无法自举。这直接违背“可复现构建/CI 真实生效”的验收。
3. `m4-ci.test.js` 的死链审计把 `AIOptimize/README.md` 中 `../../iOS/...` 的跨仓引用按“本仓相对链接”解析；单仓 checkout 无 `iOS` 时 5 条全部判死。若平台仓被 checkout 到别处，路径也不一定匹配；需要显式区分“跨仓证据链接”与“仓内导航链接”。
4. `dead-link-audit-not-empty` 要求 ≥90 md；干净 checkout 只有 15 个源 md（`dist`/catalog 未生成），且 L0 在 `package-repro` 之前独立运行，不能使用其生成物。因此即使修好跨仓链接，L0 仍会因 md 下限失败。

**结论**：R8 的 CI 结论“5 层真实生效”只在本地多仓、已生成 catalog/dist 的工作区成立；在 workflow 声明的 `runs-on: ubuntu-latest` 单仓环境不成立。这是本次复验的主要 blocking finding。需要二选一或同时修复：workflow 显式 checkout 平台仓并固定 sibling 布局；或让 `manifest.js` 从 `out/catalog` 取 ID、让 CI 在 L0 先生成 catalog/dist，并把跨仓链接按外部处理/调整门槛。

### 3.3 其他 CI 观察

- L2 在 CI 不传 `--strict-evidence`，平台仓不在时只输出“evidence not verifiable here”并 exit 0；这与本地 strict 不同，属于如实声明，但意味着实际 PR 上 L2 只校验登记，不校验平台证据。
- `package-repro` 的两次 `package.py` 在干净 checkout 即使有平台仓也会因 `catalogIds` 自举失败；修复 #2 后还需确认 `cli.js build` 生成的 `ai/skill/core/dist` 是否会影响 `repoState` 的 dirty 标志（本机已为 dirty=true，CI 干净 checkout 会先变 dirty=true）。
- workflow 无自动提交/发布；未发现 `git commit`/`git push`/发布上传步骤。

## 4. 治理 / 05 / 04 文档

### 4.1 05-M5（PASS）

- `05-M5-Evaluation-Report.md` 已改用 `t11-post-t9.plan.json`（24 cells、5 blockers），并明确说明 `t11-observation.plan.json` 是 t9 前旧计划（7 blockers）不可混用；§6 步骤 2 已改为“确认 cli.js/dist 由当前 HEAD 重建”。
- `run-manifest.json`：`status=not-executed`、`reason=readiness-gate-blocked`、5 blockers、输入哈希与当前 tasks/golden-matrix 一致；`run.selftest.js` 16 PASS；`--check-readiness` exit 2。观察报告仍为 observation-only，无伪造评测。

### 4.2 治理（PARTIAL，文档仍有过期数字）

- `governance-selftest` **23 PASS**（含 R8 新增的 M1/M4/coverage/ai README 当前状态断言）；final-acceptance、coverage-model、CONTRACT-STATUS、AIOptimize/README、ai/README 已改为当前事实（M1/M2/M3/M4 已实施、M5 harness 未执行真实评测、原生 UI/宿主/M5 未执行），05 不再过期。
- 但 **F11 未全修复**，以下断言与当前输出不符：
  - `AIOptimize/04-M4-CI-Verification.md:13` 写 `governance-selftest` **19 项**；当前 **23 PASS**。
  - 同文件 `:22` 写当前 truthFingerprint 前缀 `7f1eb8969490`；当前 m4-ci 报告为 `449363d1a98b…`。
  - 同文件 `:36` 写死链审计 **267 个 md**；当前 m4-ci 报告 **268**。
  - `04-M4-CI-Compatibility-Contract.md:15` 仍写“**四层 job**”；当前 workflow 为 **5 个 job**（L0/L1/L2/package-repro/L3）。
  - `FIXES-t8.md:81` 记录 `m4-ci` truthFingerprint `2eef9f399184…`，与当前 `449363d1a98b…` 不一致（fix record 的复跑值已过期）。
- 这些是 low/medium 文档准确性问题，不是伪造；但任务第 5/6 条要求“不再过期/F11 修复证据”，因此不能判 PASS。

## 5. F3–F5 / F7 / F9–F11 证据

| 项 | 复验 | 证据 |
| --- | --- | --- |
| **F3** Provider/API 卡省略证据不能绕过 verified | **PASS** | provider.schema 对 effective/declared=verified 强制 evidenceRefs+computedAtBuild；api-card 对 example-compiled/template-verified 强制 compilation/executed/exitCode（template 还要求 matrixRef）；contract-selftest 25 PASS（含省略字段负例）；m4-ci 61 中 provider/api-card 负例通过 |
| **F4** 语义卡 sourceRefs 行号正确 | **PASS** | core-catalog.test 的 F4 用例逐条回读；抽检 WDButton 卡 `docs/specs/01-basic.md:15/17/18/19` 与源文件行内容一致；72/72 反例行由测试断言 |
| **F5** 状态/内容/无障碍结论已提取 | **PASS** | WDButton 卡含 §5 状态（6 行）、§7 内容（4 行）、§10 无障碍（6 行），每条带 `docs/specs/...:line`；core-catalog test 通过 |
| **F7** 包内死引用 | **PASS（本地）** | SKILL template 已删除 “source map” 死引用；package SKILL 无该文本；runtime/README 包相对；dist-package `dead-refs` 通过。**但 CI 死链审计的可移植性问题见 §3.2** |
| **F9** 6000 字节预算依据 + 溢出负例 | **PASS** | README 预算表、build-info `residentBytes=5,389`/`budget=6,000`/basis；build.test F9 用临时模板 >6,000 断言 build 非零；四包 SKILL 5,389/5,489/5,497/5,582 |
| **F10** structureValid 与 semanticValid 分离 | **PASS** | runtime.test “semantic-only failures…” 断言 structureValid=true、semanticValid=false、gates.structure=passed；validate-spec 实现分离 |
| **F11** 过期断言/计数 | **FAIL（部分）** | 04 两份报告仍有过期数字；见 §4.2；fix record 的 fingerprint 也过期 |

## 6. 平台源码 / API / ABI 零改动（PASS）

- iOS HEAD `64539fe78d9a036a6e34cbfa01c72e4430c0e2b0`、android HEAD `3656d6ff8ae83cfd07166dd7fe85db489ef61110`，与 R8 声明一致；Android tracked `git diff` 为空；iOS tracked diff 仅既有 `.gitignore`（删除 `/AIStarter/`、`/ai/` 两行，非源码/API）。
- iOS `api/WisdomUI.api.json` 工作区 SHA-256 `1d3be9d703f9ea54710905a6d90db2e9ef7c05b55ab8d8f529c9b2843b725348` 与 HEAD blob 一致；android `wisdom-ui/api/wisdom-ui.api` `06b240434600c9d5586bb676db562a83b18b5a1cd22e4c6a2597826670b4e984` 与 HEAD 一致。
- iOS/android provider 目录为平台所有者交付的 untracked 内容（t6/t10），不是本次复验或 R8 写入；未发现 R8 改动平台 tracked 源码/API/ABI。

## 7. 剩余项（非阻断 / 已知边界）

1. **原生/UI/宿主/M5 未执行**：iOS UI 矩阵仍 PTY blocked（exit 65）；Android native compile blocked（缺 `:demo`/activity-compose）；host-load 未执行；M5 真实评测未执行（5 blockers、observation-only）。这些项目前没有被写成通过。
2. **CI 干净 checkout 修复前，CI 证据不可用**（§3.2，阻断项）。
3. **包内平台证据引用仍为平台仓相对路径**（`api/WisdomUI.api.json` 等）：R8 明确保留并声明；若要求安装后自包含追溯，需要平台所有者改成包内相对或显式 base。
4. **machine-path 豁免**：`platforms/ios/CI-INTEGRATION.md` 含 `<home>` 本地路径，`package-exemptions.json` 登记（owner=iOS）；dist-package 通过但发布说明需保留该豁免，新增未登记泄漏应继续失败。
5. **设计文档漂移（低）**：`02-SKILL-BUILD-PIPELINE.md` §4.3 仍列 `dist/.../reports/{build,verification,evaluation}-report.json`，实际 dist 只有四包/checksums/files.json；§11 的 CLI 契约仍写 `pack/verify-templates/evaluate` 子命令，实际 cli 为 `build/check/test`（打包/评测拆到 package.py 与 eval）。这些是设计稿与实现的结构差异，若最终报告引用 02 需先刷新。
6. **跨机器确定性未验证**：本次只在当前 macOS + Node 24.21.0 + Python 3.10.4 上验证两次一致；未做跨 OS/zlib 版本验证（R4 也仅同机）。
7. **F11 文档过期**（§4.2，需修复）。

## 8. 建议（供 captain / fixer；本报告不实施）

**P0（使 CI 真正可运行）**

1. 在 workflow 中显式 checkout `iOS`/`android` 到 `package.py`/`manifest.js` 期望的 sibling 路径（或在 `manifest.js`/`package.py`/`cli.js` 增加显式 `--ios-root/--android-root`/环境变量，并在 PR CI 传入），并文档化 runner 布局；否则 `cli.js build`/`package.py` 在标准 GitHub Actions 必失败。
2. 修复 `manifest.js.catalogIds()`：从 `out/catalog`（或传入的 catalog 根）读取组件 ID，而不是要求 `ai/skill/core/catalog` 预先存在；或在 `cli.js build` 开头生成源码 catalog。务必在干净 checkout 上实测 `cli.js build`/`check`/`test`/`package.py`。
3. 修复 `m4-ci` 死链审计的跨仓处理：把 `../../iOS/...`/`../../android/...` 标为跨仓证据链接（显式 allowlist 或仅在本仓存在时解析），并调整 `dead-link-audit-not-empty` 的 md 下限（按只读源文档，或把 audit 移到 `package-repro` 生成 dist 之后）；确保 L0 在干净 checkout 可独立通过。
4. 若 L0 仍需 dist 文档，给 `contract-structure` 增加前置生成步骤或调整 job 依赖；不要把“依赖生成物”的门槛放在不产生生成物的 job。

**P1（使报告可审计）**

5. 用最终一次 m4-ci/governance 输出刷新 04-M4-CI-Verification/Contract：governance 19→23、fingerprint `449363d1a98b`、267→268 md、四层→5 个 job；顺手更新 `FIXES-t8.md` 的 fingerprint（或标注历史）。
6. 02 §4.3/§11 与实现对齐：补 `dist/.../reports/` 或不写入设计；把 CLI 契约改为实际 `build/check/test` + `package.py`/`eval/run.js`，避免最终报告引用过期设计。

**P2（边界）**

7. 保留 native/UI/host-load/M5 的未执行声明；release-gate 只做 candidate 校验，不宣称发布。
8. 平台证据引用与 machine-path 豁免：发布说明保留 `package-exemptions` 与“平台仓相对 evidenceRefs”边界；新增泄漏继续让 dist-package 失败。

## 9. 附录：关键哈希与复跑入口

### 9.1 当前 dist（本次两次重跑一致，与 R8 一致）

- `checksums.json`：`332ee1fc1fb4ea7c4e52a47cd76187fa55d5477e0f2f831cfda6c16c474f5a0f`
- core：`d590fe08f206ae508e39f2f2dfbb9a18e1a8f03aef9ac4d1e66f1a6fc86709ae`（53 files / 53 entries / 93,961 B）
- ios：`29ac36167470c655de2f13b18c5afbb3414363c1d4826242a0f6da20d33a95f1`（98 / 98 / 144,994 B）
- android：`f3a3e75015529d2092c1b8f63e067ae5f7fafe880a0ceb4ae41b8786db496f2d`（80 / 80 / 129,646 B）
- all：`74e93ee874a43c2f8cff232528636e07262684cfdb91ab637b23d084b412c54e`（125 / 125 / 180,632 B）

### 9.2 复跑入口

```bash
# 1) 四包审计（manifest/哈希/ZIP/runtime/预算/死链）
node tools/ai-skill/tests/dist-package.test.js

# 2) 本机多仓工作区
node tools/ai-skill/cli.js build
node tools/ai-skill/cli.js check
python3 tools/ai-skill/package.py   # 连续两次，diff checksums
node tools/ai-skill/tests/m4-ci.test.js
node tools/ai-skill/tests/contract-selftest.js
node tools/ai-skill/tests/governance-selftest.js
node tools/ai-skill/cli.js test
node tools/ai-skill/ci/release-gate.js
node tools/ai-skill/tests/dist-package.test.js

# 3) 干净单仓 CI 复现（会失败，见 §3.2）
#   仅 checkout wisdomdesign，无 ../iOS ../android，无 ai/skill/core/catalog、dist
node tools/ai-skill/tests/m4-ci.test.js      # 期望 59/61（死链 + md 下限）
node tools/ai-skill/cli.js build             # 期望 exit 1（git rev-parse iOS）
node tools/ai-skill/cli.js test              # 期望 exit 1（4/12）
python3 tools/ai-skill/package.py            # 期望 exit 1
```

> 本报告的 PASS 仅覆盖本报告列出的命令与产物；原生编译/快照/UI/真机、宿主加载、M5 真实评测、发布批准均未执行，也不应被后续报告补写成已执行。本次复验未改实现，仅重跑了生成物并在 `/tmp` 做了干净 checkout 复现。
