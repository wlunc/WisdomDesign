# R4 复核报告：打包 / CI / M5 评测 / 治理（t4）

> 复核人：pipeline-reviewer（独立复核，非实现者）
> 时间：2026-11-22 10:11–10:24（Asia/Shanghai）
> 对象：`wisdomdesign` 工作区（git `b2c05d9`；iOS HEAD `64539fe`；android HEAD `3656d6f`；AI Skill 相关产物均未提交，工作区 dirty=true）
> 边界：只读源码、生成物与测试；未修改实现代码、未写 iOS / android 仓。为验证确定性，按任务授权重建了 `dist/ai-skill`；所有原始哈希在重建前记录（见 §1.3）。M5 harness 的写模式（--dry-run/--report/--results）在 `/tmp` 的字节级副本中执行，避免改写仓内证据。
> 结论先行：**M5 反伪造链路真实且当前一致；M4 打包与 CI 的产物真实存在，但 M4 出口未闭环（逐文件 hash、manifest 契约、release gate、PR 路由、CI 覆盖均有实质缺口），不建议在最终报告把 t9/t10 标为“完成”。**

---

## 0. 复核结论摘要

| # | 复核项 | 结论 | 关键证据 | 备注 |
| --- | --- | --- | --- | --- |
| 1 | 四包（Core/iOS/Android/All）scope 隔离 | **通过** | 四包 ZIP 顶层与 `platforms/` 目录互斥；iOS 42/42、Android 26/26 文件与源字节一致；All 同时含双端且复用 Core | 见 §2.1 |
| 2 | 同一工作区两次重跑 SHA-256 | **通过（同机、同工具链）** | 两次 `package.py` 退出码 0，4 个 ZIP 哈希完全一致，`checksums.json` 两次 diff 为空 | 见 §2.2 |
| 3 | 交付时 `dist` 是否可由当前源复现 | **不通过（复核开始时已陈旧）** | 原始 4 个 ZIP 哈希 ≠ 重建值；原始 manifest 记录 iOS `c3c32f3`，当前 HEAD `64539fe`；android provider 文件在打包后 18:48 仍有修改 | 见 §2.2 |
| 4 | ZIP 条目与路径安全 | **通过（手工审计）** | 50/92/76/118 条目；无绝对路径、`..`、反斜杠、NUL、重复项；固定 2020-01-01、0644、deflate；解包字节与磁盘一致 | 条目按完整源路径排序，android/all 有 1 处文件名序反转（确定性不受影响） |
| 5 | checksums 与逐文件 hash | **整包通过；逐文件不完整** | `checksums.json` 4 个 SHA-256 均匹配 ZIP；每个包 manifest 都缺 `LICENSE-NOTICE.txt` 哈希；平台包 `manifest.json` 的自哈希是复制前 Core manifest 的旧哈希 | 见 §2.4 |
| 6 | manifest 是否符合 M0 冻结 schema | **不通过** | 4 个包 manifest 对 `manifest.schema.json` 分别报 26/24/24/25 个错误（缺 version/contents/versions/status/verification/reproducibility 等） | 见 §2.5 |
| 7 | CI 分层与无自动提交 | **结构通过；门禁功能部分不通过** | 4 个 job、3 段内联 JS 语法通过、`permissions: contents: read`、无 git commit/push 命令；但 L2 为 no-op，L3 无法运行 | 见 §3 |
| 8 | 变更范围路由 | **部分通过** | push payload 路由正确；pull_request payload 无文件列表（changed_files 是数量）→ 只输出 `structure-baseline`；`package.py` 变更未命中打包层 | 见 §3.2 |
| 9 | M4 CI 负向测试 | **通过（39/39）** | `node tools/ai-skill/tests/m4-ci.test.js` exit 0，重跑后报告字节不变 | 但负向用例是 fixture 层，未作用于真实包 manifest |
| 10 | 死链审计 | **实际无死链；自动证据无效** | 独立审计：92 个 md、46 条链接、0 死链（AIOptimize 与 ai/skill 全树）；`m4-ci.test.js` 的正则匹配 0 条链接却报通过 | 见 §3.4 |
| 11 | M5 readiness gate | **通过** | `--check-readiness` exit 2；恰好 5 个 blocker，无 CLI_MISSING/PACKAGE_MISSING | 见 §4.1 |
| 12 | 24 个 task×arm 单元 | **通过** | `t11-post-t9.plan.json` 24 cells 全部 `not-executed`；副本 `--dry-run` 复现 24 cells / 5 blockers / exit 2 | 见 §4.2 |
| 13 | comparisons / claims 为空 | **通过** | `observation-report.json`：status=`observation-only`，15 项指标 value=null/status=not-executed，A_vs_B/B_vs_C/A_vs_C=null，claims=[] | 见 §4.2 |
| 14 | 05-M5 报告与 harness 当前输出 | **基本一致，局部证据陈旧** | 5 blockers、24 单元、16 项 selftest、run-manifest 输入哈希均一致；§4 引用的 `t11-observation.plan.json` 是 t9 前的产物（7 blockers） | 见 §4.3 |
| 15 | governance 和 M4 CI 测试 | **测试通过；治理文档状态陈旧** | governance selftest 19 项 PASS；final-acceptance / coverage-model 仍写 M1–M5 未实施 | 见 §5 |
| 16 | AIOptimize 文档死链 | **实际 0 死链** | 46 条链接全部可解析；包内 164 个 md 无 markdown 链接 | 自动化审计不可信，见 §6 |

**总体判断**：未发现伪造 M5 指标、伪造原生通过或伪造 ZIP/checksums；但 M4 的“可复现、可校验、可加载”出口只完成了“目录包可生成、同一输入重复打包哈希一致”两件事，逐文件校验、manifest 契约、release gate 与 PR 路由均未闭环。最终报告建议：**t9/t10 记为“部分完成/待修补”，t11 记为“harness 完成、真实评测未开始”，治理记为“建议稿冻结、当前状态待刷新”**。

---

## 1. 复核环境、方法与证据保全

### 1.1 环境

| 项 | 值 |
| --- | --- |
| 工作目录 | `<workspace>` |
| 主仓 | `wisdomdesign`，HEAD `b2c05d9f15d63cfa49948347f8c2b211cd7bde9e`，status 全为未跟踪（`.github/`、`ai/skill/`、`AIOptimize/04*`、`05*`、`dist/ai-skill/`、`tools/ai-skill/`） |
| 平台仓 | iOS HEAD `64539fe78d9a036a6e34cbfa01c72e4430c0e2b0`（dirty，provider 目录未跟踪）；android HEAD `3656d6ff8ae83cfd07166dd7fe85db489ef61110`（dirty） |
| Node / Python / Ruby | v24.21.0 / 3.10.4 / 3.0.0p0 |
| 证据等级 | E1=实际执行并记录退出码/哈希；E2=源码或生成物静态核验；E3=仅文档声明、未独立复核 |

### 1.2 关键命令与退出码（E1）

| 命令 | 退出码 | 结果摘要 |
| --- | --- | --- |
| `python3 tools/ai-skill/package.py`（第 1 次） | 0 | 生成四包；新 checksums 见 §2.2 |
| `python3 tools/ai-skill/package.py`（第 2 次） | 0 | 四包 SHA-256 与第 1 次完全一致；两次 checksums diff 为空 |
| `node tools/ai-skill/cli.js check` | 0 | 49 files match reproducible rebuild |
| `node tools/ai-skill/cli.js build --out /tmp/wd-core-a --allow-outside-root` ×2 | 0 / 0 | 两次构建 `diff -r` 无差异（Core 确定性） |
| `node tools/ai-skill/tests/m4-ci.test.js` | 0 | 39 PASS / 0 FAIL；重跑前后报告文件 SHA-256 同为 `4f8a878d…cc5b` |
| `node tools/ai-skill/tests/contract-selftest.js` | 0 | 19 PASS |
| `node tools/ai-skill/tests/governance-selftest.js` | 0 | 19 PASS（含 8 个验收 token） |
| `ruby tools/contracts-check.rb` | 0 | 37 组件 / 37 文件 / 40 枚举通过 |
| `bash tools/token-build/selftest.sh` | 0 | 26 PASS / 0 FAIL |
| `node tools/ai-skill/cli.js test` | 0 | M0 19 + M1 catalog 7 + runtime 9 + build 7 全过 |
| `node tools/ai-skill/eval/run.js --check-readiness` | 2 | ready=false，5 个 blocker（见 §4.1） |
| `node tools/ai-skill/eval/run.js --dry-run --run-id review-dry`（/tmp 副本） | 2 | 24 cells，all not-executed，5 blockers |
| `node tools/ai-skill/eval/run.js --report`（/tmp 副本） | 0 | status=observation-only，claims=[]，comparisons 全 null |
| `node tools/ai-skill/eval/run.js --results /tmp/wd-fake.json`（/tmp 副本） | 2 | 拒绝写入伪造结果，未产生 results 文件 |
| `node tools/ai-skill/eval/run.selftest.js` | 0 | 16 PASS（副本与仓内各一次；仓内运行只改写 `selftest.plan.json` 的 generatedAt） |
| workflow 内联 JS ×3 `node --check` | 0 | 3 段语法通过；doc-only 冲突时退出 1；native-depth 无论如何退出 0 |
| release-gate 内联脚本（仓内） | 1 | `release manifest missing; abort`（路径不存在） |
| release-gate 内联脚本（/tmp 副本，放入核心包 manifest） | 1 | schema invalid：缺 version/contents/versions/status/verification/reproducibility 等 |
| `git -C wisdomdesign status --porcelain` | 0 | 复核前后均只有未跟踪目录；无 tracked 修改 |

### 1.3 复核造成的写操作（透明记录）

| 文件 | 操作 | 说明 |
| --- | --- | --- |
| `dist/ai-skill/v1.0.0/**` | 重建（允许） | 原值已记录：ZIP `a99b…/e811…/3af0…/4624…`，`checksums.json` 文件 SHA-256 `4e887a3c…06ee`；重建后见 §2.2 |
| `tools/ai-skill/reports/m4-ci-result.json` | 重跑覆盖 | 重跑前后字节完全一致（SHA-256 `4f8a878d…cc5b`），无内容变化 |
| `tools/ai-skill/eval/results/selftest.plan.json` | 重跑覆盖 | 仅 generatedAt 变化（新 SHA-256 `9182b770…f53b`）；05 报告未引用此文件 |
| `tools/ai-skill/eval/run-manifest.json` / `observation-report.json` / `t11-*.plan.json` | **未改** | 写模式全部在 `/tmp/wd-eval-copy` 中执行 |
| `ai/skill/**`、`tools/ai-skill/*.js|py`、iOS/android 源文件 | **未改** | 实现代码与真源保持原样 |
| `AIOptimize/review/04-pipeline.md` | 新增 | 本报告 |

> 说明：`dist/` 是未跟踪的生成物，不是可审计的提交证据；原始 ZIP 在重建后不可恢复，但原始哈希与 manifest 关键字段已在重建前读取并记录在 §2.2。

---

## 2. 打包复核（package.py / dist，E1+E2）

### 2.1 四包 scope 隔离与内容

重建后 `dist/ai-skill/v1.0.0` 的审计结果：

| 包 | ZIP 条目 | ZIP 字节 | 顶层目录 | `platforms/` 下平台 | 源文件完整性 |
| --- | ---: | ---: | --- | --- | --- |
| Core | 50 | 65,501 | SKILL.md / catalog / page-spec / runtime / build-info.json / manifest.json / LICENSE-NOTICE.txt | 无 | 与 `cli.js build` 临时构建相比：仅多 LICENSE-NOTICE，manifest 增加 coverage/sources |
| iOS | 92 | 100,185 | Core 全部 + `platforms/ios` | ios | iOS Provider 42/42 文件与源字节一致 |
| Android | 76 | 92,635 | Core 全部 + `platforms/android` | android | Android Provider 26/26 文件与源字节一致 |
| All | 118 | 127,330 | Core 全部 + `platforms/ios` + `platforms/android` | ios, android | 双端独立载荷；无第五份 Core 副本 |

- **通过**：Core 无平台目录；iOS 无 android 文件、Android 无 ios 文件；All 同时包含双端且平台载荷与各自源一致；Core 在三个平台包中的同名文件与独立 Core 包逐字节相同（仅 `SKILL.md` 因追加平台段落不同）。
- 平台包 `build-info.json` 仍为 Core 的构建信息（`"scope": "core"`、`"package": "wisdom-page-core"`）；虽不构成跨平台泄漏，但会误导包内容自描述（低）。
- 平台包 `SKILL.md` 追加了对应平台状态（ios/android: `Effective status: experimental`；All 为双端段落），未出现 verified 字样；平台包 SKILL 大小 5,288 / 5,316 / 5,205 bytes，均 < 6,000 预算，但 `package.py` **追加时不检查预算、manifest 也不记录追加后的 residentBytes**（低）。

### 2.2 确定性：两次重跑一致；交付快照与当前源不一致

同一工作区连续两次 `package.py` 的 ZIP SHA-256（E1，两次一致）：

| ZIP | 复核开始时原始值 | 重建后（两次一致） |
| --- | --- | --- |
| wisdom-page-core.zip | `a99ba5a17aa9095869a7b9cd6753bf013f8eef24514ce8f2d4d373eecb432a5b` | `36d60cd89d6a9fdea1afc3ba8dc04e4acd0e0fd1813c4d451c458225cf8f0aa2` |
| wisdom-page-ios.zip | `e811149ff6c4421e5c60ff15992f46eef25d634fc86f6a85d5ca509aef640feb` | `9690a73409620f677328813d056b226110833a2df81e6703b76b6e1dfbce7858` |
| wisdom-page-android.zip | `3af0d888c030fe68fa6b88eb543c7dc22e2c7c5e799be0cfb253f4e819a51779` | `f7744914d4ca44243831389c9be383c8a2f7c4cc170b7a024cf1c314d84f3bd7` |
| wisdom-page-all.zip | `462418ffb84e4d7ebb63ce29f23d5c228bf0893c56f1e5eda22598a401264e73` | `d682d0e30888367287931130115e2b1ca0527542e88871b650cffee2c9782a63` |
| checksums.json（文件） | `4e887a3c97c260b23f5fb209118e13185eac9ec776287b54654f23d702c206ee` | `c327c14f4020ee0e6ac134eb2e12f65e7625e71bc0f27c2c4f5184b22be91550` |

**差异原因（证据链，不是推测）**：

1. 复核开始时原始 Core manifest 的 `sources.ios.commit` = `c3c32f3…`；当前 iOS HEAD = `64539fe…`（提交时间 2026-11-22 09:56），重建后 manifest 记录 `64539fe…`。
2. 原始 manifest 中 android `platforms/android/verification.json` 哈希 = `2ffe0d…`；当前 = `f122b1…`，且文件 mtime = 2026-11-21 18:48:38，晚于原 dist 的 18:40。
3. `package.py` mtime = 18:47:35，原 `dist` 目录 mtime = 18:40，iOS `verification.json` mtime = 18:46:47；即原始包构建于最终打包器与部分平台内容之前。
4. 原始与当前 `SKILL.md` 哈希相同（5fe74d… / 16b5af… / 3271cf… / 2605fc…），说明主要差异来自 sources 字段与平台内容，而非 Core 渲染逻辑。

**结论**：`package.py` 对“同一输入”是确定性的（E1）；但复核开始时仓内的 `dist` 是**陈旧 dirty snapshot**，不能由当前源复现。`dist` 为未跟踪生成物、manifest 只记录 commit+dirty（无 contentHash），因此这种陈旧在包内不可见。重建后当前 `dist` 已与当前源一致（仍应视为 generated，不是提交证据）。

### 2.3 ZIP 条目、路径安全与固定元数据

审计脚本逐 ZIP 检查（E1）：

- 条目数：Core 50 / iOS 92 / Android 76 / All 118；全部为文件条目，无目录条目、无重复名、CRC `testzip()` 均通过。
- 路径：无 `/` 开头、无 `..` 段、无反斜杠、无 NUL、无 Windows 盘符；全部为仓库相对 POSIX 路径。
- 元数据：全部 `date_time=(2020,1,1,0,0,0)`、`external_attr=0o644`、`create_system=3`、deflate；ZIP 内文件字节与磁盘副本逐字节一致。
- 排序：`tree()` 按完整源路径排序，ZIP 条目名基本有序；android/all 存在 1 处按“相对名”比较的反转：`platforms/android/templates/task-list/TaskListScreen.kt` 在 `platforms/android/templates/task-list.manifest.json` 之前（因 `/` > `.`）。**确定性不受影响**，但若外部要求“归档名严格字典序”，需改成按相对名排序（低）。
- 无 `.DS_Store`、`.git`、`.env`、`__pycache__`、日志或密钥文件；全包文本扫描无 `/Users/`、`chenweilun`、`C:`、`file://`、`/var/folders` 等机器路径。

### 2.4 checksums 与逐文件 hash：整包通过、逐文件不完整

`checksums.json` 对 4 个 ZIP 的 SHA-256 全部匹配（E1）。但包内 manifest 的逐文件校验存在确定性缺陷：

| 包 | `files.count` | `files.sha256` 条目 | 实际文件数 | 缺失哈希 | 哈希不匹配 |
| --- | ---: | ---: | ---: | --- | --- |
| Core | 49 | 48 | 50 | `LICENSE-NOTICE.txt` | 无 |
| iOS | 91 | 91 | 92 | `LICENSE-NOTICE.txt` | `manifest.json`（旧 Core manifest 的哈希） |
| Android | 75 | 75 | 76 | `LICENSE-NOTICE.txt` | `manifest.json`（同上） |
| All | 117 | 117 | 118 | `LICENSE-NOTICE.txt` | `manifest.json`（同上） |

原因（读源码确认）：`write_manifest()` 先对当前目录全部文件求哈希，再写包内 `manifest.json`；`LICENSE-NOTICE.txt` 在 manifest 之后才写入。平台包由 Core 复制而来，复制时带入 Core manifest，因此平台包哈希表里的 `manifest.json` 是 Core manifest 的旧哈希，随后被包 manifest 覆盖，形成自哈希不匹配。

对应 M4-2 验收“逐文件与整包 hash 可校验”：**整包通过，逐文件不通过**（core 缺 1 个、平台包缺 1 个且 1 个错误）。同时 `files.count` 语义不统一（Core 的 count 含 manifest 自身、平台包的 count 不含 LICENSE-NOTICE），不能作为包完整性声明。

### 2.5 manifest 契约：不符合 M0 冻结 schema

对 4 个包 manifest 直接调用 `lib/schema-lite.js` + `ai/skill/manifest/manifest.schema.json`（E1）：

| 包 | schema 错误数 | 典型错误 |
| --- | ---: | --- |
| Core | 26 | 缺 `version`/`contents`/`versions`/`status`/`verification`/`reproducibility`；`builderVersion`/`platformScope`/`residentEntry`/`generatedBy` 为 schema 未知字段 |
| iOS | 24 | 同上 |
| Android | 24 | 同上 |
| All | 25 | 同上 |

具体缺口：

- **没有 `status.releaseKind` / `status.overall` / `status.platforms`**：package manifest 没有任何“release vs workspace-snapshot”字段；虽然 `sources.*.dirty=true` 诚实记录了 dirty，但 M0 schema 的 dirty→snapshot 约束无法作用于真实包。
- **sources 结构不同**：实际为 `sources.design/ios/android/tokens`；M0 schema 要求 `sources.repositories.{wisdomdesign,ios,android}` 与 `sources.design.{tokenVersion,tokenHash,contractCount,contractTreeHash}`，且每个 repo 要求 `repository/commit/dirty`（可选 `contentHash`）。实际缺 repository 名、design 内容哈希/契约计数。
- **没有包 `version`、`contents.entry/contentHash`、`versions`、`verification`、`reproducibility`**。
- `coverage` 形状为平台 `status/evidence/apiCardFiles/nativeVerification`，与 schema 的 components/verification 形状不同。

影响：M4-1“manifest 正确标各平台 coverage / 状态”只完成 coverage；M4-4 的 dirty/release 负向保证只存在于 fixture 层（`m4-ci.test.js` 的 `baseManifest()`），未作用于真实包；L3 release-gate 也无法校验真实包（见 §3.3）。

补充：平台包 manifest 的 `coverage[*].status.evidenceRefs` 在包内不可解析：

- iOS：`api/WisdomUI.api.json`、`ai/skill-provider/api-cards/index.json`、`ai/skill-provider/verification.json#…` 均为平台仓相对路径，包内不存在。
- Android：`api/cards/index.json`、`capabilities.json`、`verification.json` 均相对 provider 根，包内不存在。
这说明包不是“证据自包含”的；若要求安装后可追溯，需要改为包内相对路径或显式标注 source base。当前没有 `dist-package` 测试覆盖这一点（见 §3.4）。

### 2.6 与设计文档的目录差异

`02-SKILL-BUILD-PIPELINE.md` §4.3 约定 `dist/ai-skill/<version>/` 下含 `reports/build-report.json`、`verification-report.json`、`evaluation-report.json`；实际 `dist/ai-skill/v1.0.0` 只有四包、`packages/` 与 `checksums.json`，没有 `reports/`。M4 CI 报告落在 `tools/ai-skill/reports/m4-ci-result.json`，与设计目录不一致（中）。这也是 release-gate 无法找到可校验报告引用的原因之一。

---

## 3. CI 复核（.github/workflows/ai-skill-ci.yml，E1+E2）

### 3.1 结构与安全：通过

- YAML 可解析，4 个 job：`contract-structure` → `change-scope-routing` → `native-depth` → `release-gate`；触发为 `pull_request`（paths-ignore 图片/LICENSE）、`push: main`、`workflow_dispatch`；当前分支确实是 `main`。
- `permissions: contents: read`；全文件无 `git commit`/`git push`/`git tag`/`gh release`/`npm publish` 等步骤；`release-gate` 仅在 `workflow_dispatch` + `inputs.release == 'true'` 时运行。
- 3 段内联 `node -e` 脚本 `node --check` 全部语法通过（与 04-M4 验证报告一致）；doc-only 冲突检查在 `docOnly && nativeRequired` 时确实 exit 1（E1）。
- L0 的 artifact 上传路径 `tools/ai-skill/reports/m4-ci-result.json` 与测试实际输出一致。

### 3.2 变更范围路由：push 可用，PR 实际失效

`route-changes.js` 的单元路由（直接 `planFor(paths)`）正确（m4-ci 的 4 个 route 用例通过），但事件级集成存在实质问题（E1，使用合成 payload 实测）：

| 场景 | 输出 |
| --- | --- |
| push payload `commits[].modified = ["iOS/Sources/X.swift","tools/ai-skill/package.py"]` | `ios-native-compile,ios-snapshot-ui,structure-full,reproducibility,all-template-compile` |
| pull_request payload（典型：`pull_request.changed_files` 为数量，无文件列表） | `requiredLayers=["structure-baseline"]`，`changedPaths=0`，`nativeRequired=false` |
| `planFor(["tools/ai-skill/package.py"])` | `structure-full,reproducibility,all-template-compile`（**没有** `clean-unpack/checksum-verify`） |
| `planFor(["dist/ai-skill/v1.0.0/checksums.json"])` | `clean-unpack,host-load,checksum-verify` |
| `planFor(["iOS/Sources/X.swift"])` / `planFor(["android/wisdom-ui/api/wisdom-ui.api"])` | 对应原深层（测试通过） |

结论：

1. GitHub 的 `pull_request` webhook 不携带变更文件列表，`pull_request.changed_files` 是数量；代码仅在它是数组时收集，因此**主触发器 PR 上路由退化为 baseline**。现有测试只调用 `planFor()`，没有覆盖事件解析，掩盖了这个问题。若要让 PR 路由生效，需要显式拉取 PR files API 或改为 push 侧计算。
2. 路由规则 `packaging-manifest` 匹配 `tools/ai-skill/(lib/package|cli)`，而实际打包器是 `tools/ai-skill/package.py`；该变更被 `builder-runtime` 捕获，导致打包层（干净解包/checksum/宿主加载）不被声明。

### 3.3 L2/L3：声明大于实现，release gate 实际不可运行

- **L2 native-depth**：代码只在 `nativeRequired=true` 时 `console.log` 分层名称并输出 notice，随后 `process.exit(0)`；**没有检查任何报告引用是否存在**，也没有失败路径。步骤名“校验原生门禁报告引用（存在性，不伪造结果）”与 04-M4 契约 §2 L2“本仓只校验报告引用存在”不一致。它确实做到了“不冒充通过”，但“存在性校验”未实现。
- **L3 release-gate**：步骤读取 `dist/ai-skill/manifest.json`；实际生成布局是 `dist/ai-skill/v1.0.0/...`，该文件不存在。仓内直接执行内联脚本：exit 1（`release manifest missing; abort`，E1）。
- 即使把真实包 manifest 放到该路径（/tmp 副本实测），schema 校验仍 exit 1：缺 `version/contents/versions/status/verification/reproducibility`，且有 schema 未知字段（E1）。release-gate 还引用 `m.status.releaseKind`、`m.sources.repositories[*].dirty`、`m.coverage.verification`，这些在真实包 manifest 中都不存在。
- 04-M4 契约 §2 L3 声称校验“checksums 与报告引用非死链”；workflow 脚本只做 schema + dirty + verified flags，**没有读取 checksums，也没有报告引用检查**。
- 因此没有证据表明 L3 曾在真实包上执行/通过；按当前脚本执行必失败。04-M4 验证报告只对 workflow 做了“结构 + 语法”检查，这一点本身是诚实的，但契约表的措辞（“校验 manifest 不变量 / checksums 与报告引用”）造成了夸大。

### 3.4 测试与审计质量

通过的部分（E1）：

- `m4-ci.test.js` 39/39 PASS；重跑后报告字节不变，truth fingerprint `2e3f71fc1471…`（前后一致）。
- 版本/证据/路径/route/负向 fixture 用例真实执行，不是空跑。
- 04-M4 验证报告记录的 4 job、3 段内联脚本、无自动提交均复核为真。

失效/覆盖不足的部分：

1. **死链审计失效（高，证据层面）**：`m4-ci.test.js:183` 的正则被过度转义，实际要求链接前出现字面反斜杠；对指向 `03-DEVELOPMENT-PLAN.md`、`04-M4-CI-Verification.md` 的 markdown 链接样例均返回 null。结果：92 个 md 中实际有 46 条 markdown 链接，测试报告 `0 external links / 14 md files audited` 并 PASS。**M4 验证报告的“0 死链”不是有效证据**（不过独立审计确认实际 0 死链，见 §6）。
2. **死链扫描范围不足**：测试只扫描 `AIOptimize` 与 `ai/skill` 一层子目录；`ai/skill/core/**`（37 份 catalog + 生成 dist）未进入审计。包内 164 个 md 也不在扫描范围。
3. **路径安全只测 helper**：6 个 path-safety 用例只调用 `safeRel()` 处理合成字符串，没有遍历真实 ZIP 条目/真实 manifest 引用；我们手工审计才覆盖了真实包（§2.3）。04-M4 契约 §5 所述“所有 manifest 引用、Provider adapters/capabilities/apiCards、runtime 脚本路径”检查未实现。
4. **check-no-mutation 的“沙箱”未实现**：04-M4 契约 §4 说在 `os.tmpdir()` 建沙箱；实际测试只在内存构造负例并前后比对指纹，没有创建沙箱。结论（未写真源）成立，但描述不准确。
5. **负向测试作用于 fixture，不作用于真实包**：`baseManifest()` 是手工构造的 schema-conformant manifest；真实包 manifest 不符合 schema，导致 dirty/release、verified evidence 等负向保证与真实产物脱节（见 §2.5）。
6. **报告陈旧**：04-M4 验证报告写 contract-selftest 17 项（现 19）、truth fingerprint `372add402ed5`（现 `2e3f71fc1471`）、dead-link 审计 11 个 md（现测试内部 14、全树 92）；§4 的 M0 schema 缺口（wisdomdesign dirty 未被 schema 拒绝）已被修复（contract-selftest 现在通过 `dirty wisdomdesign cannot be release (CONST)`），报告仍把它作为现存问题。属于过期断言，不是伪造。

### 3.5 CI 对 M4 出口的覆盖缺口

对照 `02-SKILL-BUILD-PIPELINE.md` §12.1 与 M4-4/M4-5：

| 要求 | CI 现状 |
| --- | --- |
| Core 提取 / Page Spec 检查 | L0 跑 contract-selftest + m4-ci，覆盖 |
| 运行时正反例 | **未跑**（`cli.js test` / `runtime.test.js` 不在 workflow） |
| 包结构、死链、路径安全 | m4-ci 的对应检查为 fixture/失效实现；**无真实包检查** |
| 可复现 `check` | **未跑** `cli.js check`；workflow 没有构建/比较步骤 |
| SKILL.md 常驻预算 | 仅在 `cli.js build` 内检查；CI 不构建，**未覆盖** |
| 打包器 / manifest 变更 → 干净解包、checksum | **无** Python/package.py/ZIP/checksums 步骤，也无 `dist-package` 用例 |
| 干净环境安装 / 宿主加载 | **无**；文档也明确未执行 |

因此 M4-5 的“分层”只在结构层成立；“check 不改真源、不自动提交”仍是模拟合同而非 CI 实际执行的 `cli.js check`。M4 出口“四类产物可复现、可校验、可按声明方式加载”目前只有“可生成 + 同输入重复打包一致 + 手工 ZIP 安全”被验证。

---

## 4. M5 复核（eval harness / 05 报告，E1）

### 4.1 readiness gate：5 个 blocker，CLI/PACKAGE 已消除

`node tools/ai-skill/eval/run.js --check-readiness` 实测（2026-11-22 10:13 CST）：**exit 2**，`ready=false`，blockers 恰好 5 个：

| blocker | detail 摘要 |
| --- | --- |
| `UNPINNED_MODEL` | `fixedConditions.parameters.model = "pin-before-M5; …"` |
| `UNPINNED_HOST` | `parameters.host = "pin-before-M5; D3 default is generic directory package; …"` |
| `UNPINNED_TOOLS` | `parameters.tools = "pin-before-M5; …"` |
| `NATIVE_CMD_UNPINNED_IOS` | `ios-snapshot-ui requiresPinning` |
| `NATIVE_CMD_UNPINNED_ANDROID` | `android-screenshot requiresPinning` |

无 `CLI_MISSING` / `PACKAGE_MISSING`；与 05-M5 §3 的“5 项阻塞”完全一致。golden-matrix 中 ios/android 的 `requiresPinning` 仍为 `true`，因此该阻塞是真实前置条件，不是文档造出来的。

### 4.2 24 单元、指标与反伪造

- `t11-post-t9.plan.json`：24 cells，全部 `status="not-executed"`，quality/repair/cost 全 null，failure 保留策略已写入 policy；blockers 5 个（E2）。
- 在 `/tmp/wd-eval-copy` 实测 `--dry-run --run-id review-dry`：exit 2，24 cells，5 blockers（E1）。
- `observation-report.json`：`status="observation-only"`；quality 7 + repair 2 + cost 6 = **15 项指标全部 value=null/status=not-executed**；`comparisons={A_vs_B:null,B_vs_C:null,A_vs_C:null,status:"not-executed"}`；`claims=[]`（E1 副本重生成结果相同）。
- `--results /tmp/wd-fake.json`：exit 2，拒绝写入（E1），副本中未生成 results 文件。
- `run.selftest.js`：16/16 PASS，exit 0（E1）。
- `run-manifest.json`：`status="not-executed"`、`reason="readiness-gate-blocked"`、runId `t11-post-t9`、8 tasks/3 arms、5 blockers；`inputHashes.tasks=e43b936f…586f`、`goldenMatrix=7999b24e…3ced` 与当前文件 SHA-256 一致（E1）。
- `templates/design-review.md` 8 维度全 not-executed、`templates/failure-ledger.json` `deleteFailures=false`，与 05 §4 一致（E2）。

### 4.3 05-M5 报告与 harness 当前输出对照

| 05 报告断言 | 复核结果 |
| --- | --- |
| readiness exit 2、5 blockers | **一致**（E1） |
| 24 个 task×arm 单元 not-executed | **一致**（E1/E2） |
| comparisons 全 null、claims=[]、指标全 null | **一致**（E1） |
| `--results` 拒绝写入、exit 2 | **一致**（E1，副本） |
| `run.selftest.js` 16 项通过 | **一致**（E1） |
| run-manifest 记录输入哈希与全部 blocker | **一致**（E1/E2） |
| design-review / failure-ledger 模板存在且未执行 | **一致**（E2） |
| “本轮没有调用任何模型、没有 Token/成本/编译/设计评分数据” | 未发现反证；无 results 文件，符合 observation-only |
| §4 表格第二行：`--dry-run --run-id t11-observation` 生成计划 | **文件真实存在但时间不对**：`t11-observation.plan.json` generatedAt=2026-11-21T10:29:51Z（18:29 CST），早于 t9 打包（18:40），blockers 为 **7 个**（含 CLI_MISSING/PACKAGE_MISSING），不是报告所处轮次的 5 个。t9 后的计划是 `t11-post-t9.plan.json`（10:48:14Z，5 blockers），报告未引用它。 |
| §6 步骤 2：“core-dev 交付 cli.js 与 dist/ai-skill 包” | **过期**：§3 已说 t9 完成、CLI/包已存在；步骤 2 仍写成未来动作。 |

**判定**：05-M5 的实质数据与 harness 当前输出一致，观察报告没有夸大为“评测结果”；但“本轮真实执行证据”混入了 t9 前的 `t11-observation.plan.json`，属于证据卫生问题（中低），会让审计者误以为该轮 dry-run 也看到 5 个 blocker。

### 4.4 harness 自身的边界（低）

- readiness 的 `PACKAGE_MISSING` 检查只判断 `dist/ai-skill` 是否存在，不校验包版本/哈希；本次复核开始时的陈旧包也能通过该检查。该设计不伪造结果，但“包已就绪”的语义弱于 05 报告读者的直觉。
- 写 run-manifest 发生在 `main()` 前段：`--results` 即使被拒，也会用当前 run-id 重写 `run-manifest.json`（`runId`/时间变化，status 仍 not-executed）。本次在副本中复现；不写指标，但与“拒绝写入”的直觉略有出入。

---

## 5. 治理复核（governance，E1+E2）

- `governance-selftest.js` 19 项 PASS（E1）：coverage L1–L5 顺序、37 semantic / 0 snapshot、R1–R5 排除、6 页面模式、web spec-only、6 类变更触发、阈值“不提前承诺”、dirty 隔离、final-acceptance 8 个 token 均通过。
- 治理 JSON 的 `status` 均为 `frozen-for-review`，final-acceptance 自述是“M6 治理建议稿”，**没有声称 M6 已执行**，这一点是诚实的。
- 但“当前状态”陈述已过期（与 M1–M4 已生成产物矛盾）：
  - `ai/skill/governance/final-acceptance.md:4`：“当前仓库只有 M0 契约稿与自检工具，没有任何生成包、原生编译/UI 报告、宿主加载报告或 M5 评测结果。”——生成包与 Provider 已存在（仅“原生报告、宿主加载、M5 结果”仍为真）。
  - 同文件 §6（86–90 行）仍写 M1/M2/M3/M4/M5 “未实施”“t2–t4/t5–t6/t7–t8/t9–t10/t11 尚未完成”——M1–M4 已有产物。
  - `ai/skill/governance/coverage-model.json:56,63–65`：`currentBaseline.note` 仍称“没有任何生成包或原生报告”，`unverified` 仍列“M1 Core 尚未生成语义卡 / M2/M3 Provider 尚未建立 / M4 包与 M5 评测尚未执行”。
- 影响：治理自检只校验结构/不许诺，不校验“当前状态”时效；这些过期行若被带入发布说明或最终报告，会造成“未实施”与“已生成”同时存在的矛盾（中低）。

---

## 6. 文档死链（独立复核，E1）

- 独立脚本扫描 `AIOptimize/**/*.md` + `ai/skill/**/*.md`（不含 `AIOptimize/review/` 下其他复核输出，共 92 个源文档）：46 条 markdown 链接，0 条外部链接，0 条死链；带 #anchor 的链接按 M0 约定只校验文件存在。
- `dist/ai-skill/v1.0.0` 内 164 个 md：0 条 markdown 链接（组件卡使用反引号路径追溯，不是链接），因此“包内死链”目前无样本。
- 结论：**AIOptimize 文档本身没有死链**；但 CI 的“0 死链”是失效正则造成的假通过（§3.4），不能作为证据。另：包内组件卡的 `docs/specs/…` / `contracts/…` 追溯锚点不在包内，属于“来源引用”而非可点击链接；如果发布要求包内可追溯，需要另行设计。

---

## 7. 过期断言 / 夸大清单

| 文件:行 | 文档断言 | 复核事实 | 严重度 |
| --- | --- | --- | --- |
| `AIOptimize/README.md:5,427` | 没有新增生成器/Provider/模板/CI/Skill 包；生成器、Provider、CI、正式包均未实施 | M1 Core、iOS/Android Provider、M4 四包、CI 文件均已在工作区存在（未提交） | 中 |
| `04-M4-CI-Compatibility-Contract.md:6` | 当前 `cli.js` 与 `dist/ai-skill` 尚未落地 | 两者均存在；`cli.js check` 实测 exit 0 | 低 |
| 同文件 :68 | 当前 `cli.js check` 不存在 | 已实现并实测通过 | 低 |
| 同文件 :84 | t9 产出后“只需新增 dist-package 用例组” | 未新增任何 `dist-package` 用例；真实包无自动校验 | 中 |
| 同文件 §2 L2 | 本仓只校验报告引用存在 | L2 只打印，不检查存在性 | 中 |
| 同文件 §2 L3 | 校验 checksums 与报告引用非死链 | 脚本未读取 checksums/报告，且路径不存在 | 中高 |
| `04-M4-CI-Verification.md:10` | contract-selftest 17 项 | 现 19 项（本报告实测） | 低 |
| 同文件 :23 | truth fingerprint `372add402ed5` | 现 `2e3f71fc1471…` | 低 |
| 同文件 :29 | dead-link-audit（11 md 文件、0 死链） | 测试内部 14 md、全树 92；正则失效，0 死链无证据 | 中 |
| 同文件 :35 | cli.js/dist 未落地，无 cli build/check/pack | 已落地；build/check 实测通过（无 pack 子命令） | 低 |
| 同文件 §4 | M0 schema 遗漏 wisdomdesign dirty，实测未拒绝 | schema 已补 wisdomdesign 且 contract-selftest 通过“dirty wisdomdesign cannot be release” | 低 |
| `05-M5-Evaluation-Report.md:37` | 本轮 dry-run 生成 t11-observation.plan.json | 该文件是 t9 前（18:29）产物，7 blockers；t9 后是 t11-post-t9.plan.json | 中低 |
| 同文件 :60 | 步骤 2 让 core-dev 交付 cli.js/dist | 已交付（报告 §3 自己已承认） | 低 |
| `ai/skill/governance/final-acceptance.md:4,86–90` | 当前无生成包/Provider/M4，M1–M5 未实施 | M1–M4 产物存在，M5 harness 存在但未执行真实评测 | 中 |
| `ai/skill/governance/coverage-model.json:56,63–65` | 无生成包/Provider，M4/M5 未执行 | 同上 | 中低 |
| `tools/ai-skill/tests/m4-ci.test.js:136` | detail 称 M0 schema allOf[0] 遗漏 wisdomdesign | schema 已覆盖；该断言文字过期（用例本身仍靠 guard 通过） | 低 |
| `02-SKILL-BUILD-PIPELINE.md:252–255` | dist 含 reports/build-report/verification-report/evaluation-report | 实际无 reports 目录 | 中低 |

另需注意：M4 验证报告的“dirty snapshot 不冒充 release”与“0 死链”均只在 fixture/失效实现中成立，不应作为真实产物已满足 M4-4 的证据（见 §3.4）。M4 验证报告明确声明“不是 M4 完整出口”，这一点本身没有夸大出口。

---

## 8. 建议（供 captain / 后续任务；本复核不实施）

**P0（在把 M4 标为完成/发布前必须处理）**

1. **release gate 与真实包对齐**：把 gate 指向 `dist/ai-skill/v1.0.0/*/manifest.json` 或新增顶层 manifest；统一 package manifest 与 `ai/skill/manifest/manifest.schema.json`（补 version/contents/versions/status/verification/reproducibility，sources 改为 repositories+design 结构），或明确废弃该 schema 并给 gate 一套真实可校验的规则；gate 要真正读取 `checksums.json` 并校验 ZIP。
2. **新增 dist-package 测试**（M4 契约 §6 已提出，至今未做）：解包四包，校验 ZIP 路径安全、固定元数据、逐文件 SHA-256（含 LICENSE-NOTICE 与 manifest 自哈希）、checksums、scope 隔离、SKILL 预算、evidence refs/死链；接入 CI，并在 CI 中执行两次 `package.py` 比对哈希 + `cli.js check`。
3. **重新生成交付 dist**：当前已由本复核重建并与当前源一致；后续任何 iOS/android provider 变更后必须重打包。manifest 增加可审计的 `contentHash`（至少平台载荷/打包输入），不要只靠 `dirty` 布尔值。

**P1（M4 出口与 CI 声明可信性）**

4. 修复 `route-changes.js` 的 PR 集成（用 PR files API 或只依赖 push 计算）；修正 packaging 规则以匹配 `tools/ai-skill/package.py`；为事件解析添加 `collectChangedPaths()` 测试。
5. L2 要么实现“报告引用存在性”检查，要么改名/改文档为“仅声明责任”；L3 要么实现，要么在契约中明确“未实现/不可运行”，避免“校验 checksums/报告”类夸大。
6. 修复 m4-ci 死链正则并扩大扫描到 `ai/skill/core/**`、dist 包内文档；把真实 ZIP/manifest 路径与引用纳入 path audit；给 `dead-link-audit` 添加“至少匹配 N 条链接”或已知样例自检，防止空跑通过。
7. 刷新过期文档与治理当前状态：04-M4 两份文档、05 §4/§6、README、final-acceptance、coverage-model；同时清理 m4-ci 测试中的过期说明文字。
8. manifest 完整性：在写完所有文件（含 LICENSE-NOTICE、包 manifest）之后再生成文件哈希表；区分“自哈希”与“不可自哈希”字段；统一 `files.count` 语义。

**P2（质量与证据卫生）**

9. 在 tools/ai-skill/README 中记录 `package.py` 的用法与产物目录；如按 02 §4.3 需要 `dist/.../reports/`，补充生成逻辑或修改设计文档。
10. 平台包追加 SKILL 后检查 6,000 字节预算并在 manifest 记录 residentBytes；平台包 build-info 改为平台 scope。
11. M5 `--results` 被拒时避免重写 run-manifest；readiness 增加包哈希/版本校验；05 报告的证据表改用 `t11-post-t9.plan.json` 并注明两个 plan 的时序。
12. 死链/anchor 校验：如果发布说明依赖 anchor，补充 heading slug 检查；当前 M0 约定只校验文件存在。

---

## 9. 分任务结论（供最终完成报告引用）

| 任务 | 复核结论 | 理由 |
| --- | --- | --- |
| t9 打包（M4-1/M4-2） | **部分完成** | 四包真实、scope 隔离、ZIP 安全、同输入两次哈希一致；但交付 dist 陈旧于最终源、逐文件 hash 不完整、manifest 不符合 M0 schema、无 dist-package/自动测试 |
| t10 CI（M4-4/M4-5） | **部分完成** | 4 层 job、无自动提交、39 项负向测试真实；PR 路由失效、L2 no-op、L3 不可运行、死链审计假通过、CI 未覆盖打包/复现/runtime/预算 |
| t11 M5 | **harness 完成；真实评测未开始（与声明一致）** | readiness 5 blockers、24 单元 not-executed、comparisons/claims 为空、反伪造 selftest 16/16；无 results、无模型调用；05 报告证据表混入 t9 前 plan |
| M6/governance | **建议稿状态；部分完成** | governance selftest 19 项通过、未提前承诺覆盖数；但“当前未实施”表述已过期 |
| 文档死链 | **通过（实际 0 死链）** | 92 md / 46 链接独立核验；CI 证据失效，需修复 |
| AIT 真实性总评 | **未发现伪造 M5 数据或伪造原生通过** | M5 所有未执行项均显式 not-executed；M4 文档对“未执行原生/宿主加载”有如实声明；问题集中在 M4 打包/CI 的完整性、契约一致性与过期断言 |

**是否阻塞最终“t1–t13 完成”结论**：M4 出口未闭环，建议最终报告把 t9/t10 降级为“部分完成/待修补”，并明确列出 §7 的过期断言；M5 按 observation-only 表述，不能写“已评测/已节省 Token”。本复核未修改任何实现，仅新增本报告并重建了 `dist`。

---

## 10. 附录：关键文件与哈希

### 10.1 重建后的生成物（E1）

- `dist/ai-skill/v1.0.0/checksums.json`：`c327c14f4020ee0e6ac134eb2e12f65e7625e71bc0f27c2c4f5184b22be91550`
- `dist/ai-skill/v1.0.0/packages/wisdom-page-core.zip`：`36d60cd89d6a9fdea1afc3ba8dc04e4acd0e0fd1813c4d451c458225cf8f0aa2`（65,501 bytes，50 entries）
- `dist/ai-skill/v1.0.0/packages/wisdom-page-ios.zip`：`9690a73409620f677328813d056b226110833a2df81e6703b76b6e1dfbce7858`（100,185 bytes，92 entries）
- `dist/ai-skill/v1.0.0/packages/wisdom-page-android.zip`：`f7744914d4ca44243831389c9be383c8a2f7c4cc170b7a024cf1c314d84f3bd7`（92,635 bytes，76 entries）
- `dist/ai-skill/v1.0.0/packages/wisdom-page-all.zip`：`d682d0e30888367287931130115e2b1ca0527542e88871b650cffee2c9782a63`（127,330 bytes，118 entries）

### 10.2 未改动的关键证据文件

| 文件 | SHA-256 | 状态 |
| --- | --- | --- |
| `tools/ai-skill/eval/run-manifest.json` | `8772a6f4bb15d008637e51a6c07c6660685448b231585ef1e2447592bce3ec3b` | 未改（写模式在 /tmp） |
| `tools/ai-skill/eval/results/observation-report.json` | `3969eb82076f7fda4c6c017dd139f2c313a291a75176827ee6166bdef1a8108f` | 未改 |
| `tools/ai-skill/eval/results/t11-observation.plan.json` | `7536a6c06a0e9e42ea401156672389295478b0449fed66be2b7d45b3d7106a4a` | 未改（t9 前产物） |
| `tools/ai-skill/eval/results/t11-post-t9.plan.json` | `7522c6e8c50d35e583c7b8d4958896ce0bb731e0d392f92f389106e8620ce753` | 未改（t9 后产物） |
| `tools/ai-skill/reports/m4-ci-result.json` | `4f8a878d7268ec76b55209a9e3bd3e66436d4fdbec8a22dfd8b20892a306cc5b` | 重跑后字节不变 |
| `tools/ai-skill/eval/results/selftest.plan.json` | `9182b77024adba6cdff145c94cb9e06fde58b24a091c7dcd2ecda3af909df53b` | 重跑改写 generatedAt |

### 10.3 关键结论对应的命令（复跑入口）

```bash
# 1) 打包确定性（两次比对 checksums）
python3 tools/ai-skill/package.py
cp dist/ai-skill/v1.0.0/checksums.json /tmp/run1.json
python3 tools/ai-skill/package.py
diff /tmp/run1.json dist/ai-skill/v1.0.0/checksums.json   # 期望无输出

# 2) 真实包 manifest schema
node -e 'const fs=require("fs");const {validateDocument}=require("./tools/ai-skill/lib/schema-lite.js");const s=require("./ai/skill/manifest/manifest.schema.json");for(const p of ["core","ios","android","all"])console.log(p,validateDocument(JSON.parse(fs.readFileSync("dist/ai-skill/v1.0.0/wisdom-page-"+p+"/manifest.json")),s).length)'

# 3) M4 CI / 契约 / 治理
node tools/ai-skill/tests/m4-ci.test.js
node tools/ai-skill/tests/contract-selftest.js
node tools/ai-skill/tests/governance-selftest.js
ruby tools/contracts-check.rb
bash tools/token-build/selftest.sh

# 4) M5 readiness / report / selftest（写模式建议在副本执行）
node tools/ai-skill/eval/run.js --check-readiness        # 期望 exit 2
node tools/ai-skill/eval/run.js --report                 # 期望 exit 0
node tools/ai-skill/eval/run.selftest.js                 # 期望 exit 0, 16 PASS
```

> 报告中的“通过/不通过”仅针对本报告列出的证据；未执行项（真实 AI 评测、iOS/Android 原生编译/快照/UI、宿主加载、发布批准）没有被本复核补做，也不应被任何报告补写为已执行。
