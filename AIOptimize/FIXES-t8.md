# R8 修复记录：Core 运行时 / manifest / 打包器 / CI / 治理（t8）

> 修复人：pipeline-fixer（t8）。时间：2026-11-22（Asia/Shanghai）。
> **R12 注（2026-11-22）**：本文件保留 R8 当时的复跑值（含生成 dist 的 truthFingerprint `2eef9f399184…`、m4-ci 61、dist-package 118、md 268）。R12 修复单仓可运行性并调整指纹范围为“排除生成的 core/catalog 与 core/dist”后，当前值为 m4-ci **63**、governance **23**、truthFingerprint `c303ee83e3f5dda86af1b9869d3c19d18f34cee04ae946a934c5f40e1680c0ab`、dist-package **119**（workspace full）/ **32**（core-only）、md **269**（47 internal + 6 cross-repo）；重新打包后的哈希见 [FIXES-t12](FIXES-t12.md) 与 [04-M4-CI-Verification](04-M4-CI-Verification.md) §6。下文 R8 值仅作历史记录，不再作为现状。
> 输入：R1 `review/01-contract-core.md`（F1–F11）与 R4 `review/04-pipeline.md`；依赖 R6/R10 交付的 iOS/android Provider 证据。
> 边界：只改 `wisdomdesign/ai/skill/**`、`wisdomdesign/tools/ai-skill/**`、`wisdomdesign/.github/**`、`wisdomdesign/AIOptimize/**`（报告/治理文案）与任务第 5 条点名的 `ai/README.md`；未改 iOS / Android 源码、Provider 内容或 API/ABI 基线，未重写其他复核人的 `review/*.md`。

## 0. 结论先行

R1/R4 指出的打包态运行时、manifest 契约脱节、单套 manifest、CI 路由/层级/L3、治理过期陈述与 F3/F4/F5/F7/F9/F10/F11 均已修复并有可复跑证据：

| 类别 | 修复后实测 |
| --- | --- |
| 打包态运行时 | 四包内 `get-component.js` / `validate-spec.js` 均可直接运行（默认 catalog 与 overlay 均不逃逸；错误与用法均非零退出） |
| manifest | 核心 + 四包 manifest 对 M0 `manifest.schema.json` **0 错**；`contents.fileCount` = 包内真实文件数；`LICENSE-NOTICE.txt` 纳入哈希；平台包 manifest 自哈希由 `checksums.json` 正确发布 |
| 单套 manifest | `tools/ai-skill/lib/manifest.js` 是唯一生成器，`cli.js build` 与 `package.py`（经 `lib/write-manifest.js`）共用，写入前用 `schema-lite` 校验，违规即非零退出 |
| CI | PR 使用 `git diff` 文件列表（`--require-paths`，空列表失败）；新增打包/可复现层与 `dist-package` 审计；L2 校验原生层登记与证据指针；L3 指向真实 `dist/ai-skill/v1.0.0`；死链正则修复（46 → 50 条内部链接真实匹配，0 死链，并有最小链接数下限） |
| 治理 | final-acceptance / coverage-model / ai README / AIOptimize README / 04-M4 两份 / 05-M5 / CONTRACT-STATUS 不再称 M1–M5 未实施；05 改用 `t11-post-t9.plan.json` |
| 交付 dist | 依 R6/R10 当前 HEAD 与修复后 provider 重打包，前后哈希见 §4 |

## 1. R1 F1–F11 逐项处置

| 发现 | 处置 | 证据 |
| --- | --- | --- |
| **F1** 打包态 get-component 不可用 | `runtime/get-component.js` 默认 catalog 自适应（`<root>/catalog` 优先、回退 `core/catalog`）；overlay 引用按 `ai/skill/` 前缀去掉后只在 Skill 包内解析，越界即 `exit 2`；Core 包携带 `component-overlays/`（检索元数据）使打包与源码布局的关键词/别名行为一致；新增“在构建出的包内执行 runtime”测试 | `tests/runtime.test.js`（打包布局用例）、`tests/dist-package.test.js`（四包 runtime 六种退出码） |
| **F2** manifest schema 未被消费、计数/哈希缺口 | 新增 `lib/manifest.js`：生成并校验 schema、`contents.fileCount` 取真实文件数、`files.json` 覆盖全部非自指文件（含 `LICENSE-NOTICE.txt`）、`checksums.json` 发布 `manifest.json`/`files.json` 哈希；`package.py` 改写 | 四包 manifest schema 0 错；dist-package R8 时 118 项、R12 后 119 项通过 |
| **F3** Provider/API 卡省略证据字段可绕过 verified | provider.schema 增加 effective/declared=verified → 强制 `evidenceRefs` 非空 + `computedAtBuild=true`；api-card 增加 example-compiled/template-verified → 强制 `compilation` 存在、`executed=true`、`exitCode=0`（template-verified 另需 `matrixRef`）；新增省略字段负例；修正 api-card `$id` | `tests/contract-fixtures.test.js`（25 PASS）、`tests/m4-ci.test.js` |
| **F4** 语义卡 sourceRefs 行号系统性错误 | `extract-design.rb` 改用绝对行号（`section[:lines]` 的 0-based index + 1），每条 bullet/note 附 `lineText`；移除重复 `when` 死代码；新增逐条回读断言（37 组件 × 全部 refs） | `tests/core-catalog.test.js` "F4" 用例；WDButton 由 :12/:14 修正为 :17/:18 |
| **F5** 状态/内容/无障碍结论未提取 | 提取 §5 状态（表格→`状态=…; 视觉=…`）、§7 内容、§10 无障碍，逐条带 `sourceRef`+`lineText`；卡片新增三段并纳入来源追溯 | `tests/core-catalog.test.js` 断言三段存在；WDButton 卡可见 §5/§7/§10 |
| **F6** 治理/状态文档过期且自检不查 | 刷新 final-acceptance（12 行当前状态）、coverage-model（designSemantic 37 / discovered iOS 10·Android 11 / 其余 0）、`ai/README.md`、AIOptimize README（含 §427）、CONTRACT-STATUS、04-M4 两文档、05-M5；governance-selftest 新增“治理状态与仓库事实一致”断言 | governance-selftest 23 PASS |
| **F7** 包内死引用 | SKILL.md.template 删除 “Full conflict resolution is in the source map.”（包内无该文件）改为内联优先级+冲突裁决说明；runtime/README 改为包相对路径；卡片中的仓库相对 markdown 链接退化为文本标签（来源改为 `path:line`）；m4-ci 死链审计递归覆盖 `ai/skill/core/**` 与 `dist`，dist-package 复测包内链接 | R8 时 268 md / 50 links / 0 dead；R12 后 269 md / 44 internal + 6 cross-repo / 0 dead（跨仓证据链接单列）；dist-package `-dead-refs` |
| **F8** 流程门禁（实现先于 M0 批准） | 属 captain/治理判定：未自行批准 M0；在 CONTRACT-STATUS 与 final-acceptance 如实记录“独立复核 needs_revision、修复后可复评、实现先于批准”的时序 | `ai/skill/CONTRACT-STATUS.md`、final-acceptance §6 |
| **F9** 6000 字节预算缺依据、溢出未测 | README 增加预算测量表（Core 5,389 B、平台包 5,489/5,497/5,582 B、上限 6,000、取值理由）；`build-info.json` 记录 `residentBytes/residentBudgetBytes/residentBudgetBasis`；新增超预算负例（临时模板副本，正式模板不改） | `tests/build.test.js` "F9" 用例、`cli.js --template` |
| **F10** structureValid 与语义错误混淆 | validate-spec 分开 `structureValid` / `semanticValid` 与 `gates.structure`/`gates.semantics`；语义规则吸收 `contains` 后不再把语义失败报成结构失败 | `tests/runtime.test.js` 语义-only 用例 |
| **F11** 过期断言/计数 | 04-M4-Verification 全量刷新（contract-selftest 17→25、m4-ci 39→61、死链 11 md→268 md/50 links、fingerprint 现值）；04-M4-Contract 的 “cli.js 未落地/L2 只声明/L3 不可运行” 等行改为现状；m4-ci 测试中 “allOf[0] omits wisdomdesign” 注释更新 | 两份 04 文档 |

## 2. R4 复核项处置

- **PR 路由失效**：`ci/route-changes.js` 新增 `--paths-file` 与 `--require-paths`；解析 REST `files[]`、`pull_request.changed_files`（数量时不再误当列表）、push `commits[]`；packaging 规则改为匹配 `tools/ai-skill/package.py` / `lib/manifest.js` / `lib/write-manifest.js`；新增 route/event 用例。
- **L2 no-op**：新增 `ai/skill/manifest/native-layers.json` 登记 7 个原生层（owner/command/status/evidence JSON pointer）与 `ci/check-native-layers.js`；未登记或证据不可解析即 `exit 1`；本仓不执行 xcodebuild/gradle、不声明原生通过（`--strict-evidence` 本地校验平台仓证据存在）。
- **L3 指向不存在的 manifest**：新增 `ci/release-gate.js --dist dist/ai-skill/v1.0.0`，校验真实四包 manifest schema、文件计数、reportRef/checksumsRef 存在、zip/manifest/files.json 哈希、dirty→snapshot、verified→四 flag。
- **CI 未覆盖 runtime/预算/复现/打包**：workflow 重写为 L0（含 `cli.js test` = runtime+budget）、L1（真实文件列表路由）、L2（原生层登记）、`package-repro`（build+check、两次 package.py checksums diff、dist-package 审计）、L3（显式批准的 release-gate）。
- **死链正则空跑**：正则改为 `/\[[^\]]*\]\(([^)]+)\)/g`，递归扫描并加 `dead-link-audit-not-empty`（≥40 内部链接、≥90 md）下限。
- **manifest 完整性 / 交付 dist 陈旧**：见 §1 F2 与 §4。
- **平台包 build-info 仍是 core**：manifest 生成器为每个包写 `build-info.json`（package/scope/platforms/residentBytes/inputs）；平台包 SKILL 追加后检查预算。
- **包内证据引用不可解析**：包 manifest 的 `verification.reportRef=build-info.json`、`checksumsRef=files.json` 均在包内；平台 provider 自带 evidenceRefs 保持平台仓相对路径（未改写平台文件），作为已知边界记录。

## 3. 变更文件

实现（wisdomdesign 内）：
- `ai/skill/runtime/get-component.js`、`ai/skill/runtime/validate-spec.js`、`ai/skill/runtime/README.md`
- `ai/skill/SKILL.md.template`
- `ai/skill/provider/provider.schema.json`、`ai/skill/provider/api-card.schema.json`
- `ai/skill/manifest/native-layers.json`（新）、`ai/skill/manifest/package-exemptions.json`（新）
- `ai/skill/governance/final-acceptance.md`、`ai/skill/governance/coverage-model.json`、`ai/skill/CONTRACT-STATUS.md`
- `tools/ai-skill/lib/manifest.js`（新）、`tools/ai-skill/lib/write-manifest.js`（新）
- `tools/ai-skill/lib/extract-design.rb`、`tools/ai-skill/lib/generate-core-catalog.js`
- `tools/ai-skill/cli.js`、`tools/ai-skill/package.py`
- `tools/ai-skill/ci/route-changes.js`、`tools/ai-skill/ci/check-native-layers.js`（新）、`tools/ai-skill/ci/release-gate.js`（新）
- `tools/ai-skill/tests/{contract-fixtures,core-catalog,runtime,build,m4-ci,governance-selftest}.js`、`tools/ai-skill/tests/dist-package.test.js`（新）
- `tools/ai-skill/README.md`
- `.github/workflows/ai-skill-ci.yml`
- `ai/README.md`（任务第 5 条点名）
- `AIOptimize/README.md`、`AIOptimize/04-M4-CI-Compatibility-Contract.md`、`AIOptimize/04-M4-CI-Verification.md`、`AIOptimize/05-M5-Evaluation-Report.md`、本文件

生成物（可再生，不作为提交证据）：
- `ai/skill/core/catalog/**`（37 卡 + catalog.md + manifest.json）
- `ai/skill/core/dist/wisdom-page-core/**`
- `dist/ai-skill/v1.0.0/**`
- `tools/ai-skill/reports/m4-ci-result.json`、`tools/ai-skill/eval/results/selftest.plan.json`（测试副作用）

## 4. 命令与退出码（2026-11-22 复跑）

| 命令 | 退出码 | 结果 |
| --- | --- | --- |
| `node tools/ai-skill/cli.js test` | 0 | M0 契约 25 + M1 目录 8 + M1 运行时 12 + M1 构建 11 全过 |
| `node tools/ai-skill/cli.js build` | 0 | 52 文件，resident 5,389 B，manifest schema-valid |
| `node tools/ai-skill/cli.js check` | 0 | 52 文件匹配临时重建（测试写报告/评测结果后仍通过） |
| `python3 tools/ai-skill/package.py` ×2 | 0 / 0 | 两次 `checksums.json` 逐字节一致（diff 空） |
| `node tools/ai-skill/tests/dist-package.test.js` | 0 | 118/118 通过（R8 时；R12 后 119/119） |
| `node tools/ai-skill/ci/release-gate.js` | 0 | 四包候选校验通过（workspace-snapshot） |
| `node tools/ai-skill/tests/m4-ci.test.js` | 0 | 61/61 通过（R8 时；R12 后 63/63）；truthFingerprint R8 值 `2eef9f399184…`，R12 当前值 `c303ee83e3f5dda86af1b9869d3c19d18f34cee04ae946a934c5f40e1680c0ab`（范围排除生成 catalog/dist） |
| `node tools/ai-skill/tests/contract-selftest.js` | 0 | 25 PASS |
| `node tools/ai-skill/tests/governance-selftest.js` | 0 | 23 PASS |
| `ruby tools/contracts-check.rb` | 0 | 37 组件 |
| `bash tools/token-build/selftest.sh` | 0 | 26 PASS |
| `node tools/ai-skill/eval/run.js --check-readiness` | 2 | 预期 5 个 blocker（未伪造就绪） |
| `node tools/ai-skill/eval/run.selftest.js` | 0 | 16 PASS |
| `node tools/ai-skill/ci/check-native-layers.js --plan … --strict-evidence` | 0 | 7 层登记 + 平台仓证据指针可解析（本地） |

### dist 前后哈希（SHA-256）

| 产物 | 修复前（R4 复核时 10:13 重建值） | 修复后（当前 HEAD + 修复后 provider） |
| --- | --- | --- |
| wisdom-page-core.zip | `36d60cd89d6a9fdea1afc3ba8dc04e4acd0e0fd1813c4d451c458225cf8f0aa2` | `d590fe08f206ae508e39f2f2dfbb9a18e1a8f03aef9ac4d1e66f1a6fc86709ae` |
| wisdom-page-ios.zip | `9690a73409620f677328813d056b226110833a2df81e6703b76b6e1dfbce7858` | `29ac36167470c655de2f13b18c5afbb3414363c1d4826242a0f6da20d33a95f1` |
| wisdom-page-android.zip | `f7744914d4ca44243831389c9be383c8a2f7c4cc170b7a024cf1c314d84f3bd7` | `f3a3e75015529d2092c1b8f63e067ae5f7fafe880a0ceb4ae41b8786db496f2d` |
| wisdom-page-all.zip | `d682d0e30888367287931130115e2b1ca0527542e88871b650cffee2c9782a63` | `74e93ee874a43c2f8cff232528636e07262684cfdb91ab637b23d084b412c54e` |
| checksums.json | `c327c14f4020ee0e6ac134eb2e12f65e7625e71bc0f27c2c4f5184b22be91550` | `332ee1fc1fb4ea7c4e52a47cd76187fa55d5477e0f2f831cfda6c16c474f5a0f` |
| core/manifest.json | `9dff49489bf35663afe9f31331a7d506335c38b13a29dff96da4d796952a950c` | `f9d92e9a7ba301cd8fb4c512c6a682c92620a34c586d9b9f72bc61e1eab6f964` |
| ios/manifest.json | `e1d6d298ca18d0b1609c95f18d2561e74b4fee6fd1144b538581a97343104322` | `61e1fc81cd2dadc3e6e1fdb102a3c4b33eb80be530bd6afaf07d8502acabdfdc` |
| android/manifest.json | `ec0991d1ed67e235dac5c9e910274b233b7b34474afeedc6568a1bea7b97eac4` | `56abe1330d8521a669bb926dc40b4f206df29fa1bb217e1724dabb360cab06ed` |
| all/manifest.json | `acc471dea7a49d6ced2a937126ea0de55fa33550a7ada59a945f06c6fc7542bb` | `341c43ca0fcea52bd184c2e64b2d8ecfe1a550677d8989dfd00976e1a082e225` |

（修复前的值同时记录在 R4 报告 §10.1；修复前 4 个包为 R4 复核重建的 stale-dirty 快照，见其 §2.2。）

当前包规模：core 53 文件 / ios 98 / android 80 / all 125；SKILL.md 5,389 / 5,489 / 5,497 / 5,582 B（均 < 6,000）。

## 5. 未闭合边界（不得写成“已通过”）

1. **原生编译/快照/UI/真机**未由本仓执行：iOS consumer build 通过但 UI 矩阵 blocked（PTY 沙箱）；Android 编译 blocked（缺 `:demo`）；本仓 CI 只校验登记与证据指针。
2. **宿主加载**未执行：D3 仍只声明通用目录包；L3 只校验候选包不变量。
3. **M5 真实评测**未执行：readiness 5 个 blocker，observation-only。
4. **机器路径豁免**：`platforms/ios/CI-INTEGRATION.md` 含平台所有者写入的本机路径（t6，属 iOS 仓），打包器只读复制、不得改写；已在 `ai/skill/manifest/package-exemptions.json` 登记（owner=iOS），未登记的新泄漏仍会使 dist-package 审计失败。
5. **M0 出口**：R1 verdict=needs_revision；本修复完成契约侧问题，但“M0 评审通过/可实施”仍由 captain 按 CONTRACT-STATUS §3 单独记录，实现者不自评。
6. **平台包内 provider 自带 evidenceRefs** 使用平台仓相对路径（如 `api/WisdomUI.api.json`），未改平台文件，因此包内不可解析；已在包 manifest 的 `verification.unverified` 与本文件显式声明，属平台所有者可改进项。
