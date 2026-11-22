# WisdomDesign AI Skill 流水线 t1–t13 完成报告（独立复核汇总）

> 报告编号：R5（复核任务 t5）
> 出具：report-writer（独立复核汇总；非实现者）
> 时间：2026-11-22（Asia/Shanghai）
> 依据：R1–R4 四份独立复核报告、R6/R8/R10/R12 修复记录、R7/R9/R11/R13 四份独立复验报告；本报告另做只读抽查（哈希、HEAD、tracked 状态、产物字段），未重跑构建与测试。
> 只读边界：本报告只新增本文件；未修改实现、契约、测试、平台源码或生成物。
> 一句话结论：**存在阻断项（B）**。交付物真实存在、证据可审计、未发现伪造；但按开发计划 M0–M6 的出口定义，M0/M2/M3/M4/M5/M6 的出口均未闭合，不能判定“计划任务完成”。
> **后续更新（2026-11-22，Xcode 27.2）**：P0-1/P0-2/P0-4 已关闭；iOS library gate 400/400、API 零 diff、覆盖率门槛通过，GoldenPageMatrix 3/3 通过（5 状态 × 默认/AX3）。M2 自动矩阵已通过，但 light/dark、对比度、VoiceOver、真机与独立设计评审仍 not-run。本报告保留为快照；剩余阻断为 M3（用户暂停）、M4 宿主加载、M5 真实评测、M6 治理。详见 [07-P0-CLOSURE-RECORD.md](07-P0-CLOSURE-RECORD.md)。

---

## 0. 结论先行

### 0.1 总裁决

**裁决 B：存在阻断项。** 精确表述是：

1. **“证据可审计、未发现伪造”成立。** 四份复核与四份复验都实际重跑了关键命令并记录了退出码、哈希与产物；没有发现伪造的 M5 指标、伪造的原生/UI 通过、伪造的 ZIP 或 checksums（R4 §9、R7 §7、R11 §7、R13 §9）。
2. **“计划任务完成”不成立。** 13 个流水线任务都有真实产物，但按各里程碑出口：M5 真实评测尚未开始（5 个前置 blocker），M2 的 UI 矩阵 blocked、library gate not-run，M3 的原生编译 blocked（无消费方 App），M4 的宿主加载未执行，M0 的出口批准尚未记录，且 full CI 模式存在条件性阻断。
3. 因此最终报告**不得**写“t1–t13 全部完成”“双端原生闭环已验证”“M5 已评测/已节省 Token”“宿主可加载”“M0 已批准实施”。

### 0.2 五维判定

| 维度 | 判定 | 依据（可追溯） |
| --- | --- | --- |
| 证据真实性 | **通过（无伪造）** | R4 §9：未发现伪造 M5 数据/原生通过/ZIP/checksums；R7 §7、R11 §7、R13 §9 未发现伪造 schema 通过、假编译、假 blocked、覆盖虚报。 |
| 证据可审计性 | **通过（附保留项）** | 命令、退出码、SHA-256、JSON 字段均可追溯；保留项：原始交付 dist 已被多次重建（原值仅存 R4 §1.3/§2.2 记录），少数静态时间戳/历史审计字段未刷新。 |
| 任务交付完成度 | **高（13/13 有真实产物）** | 逐任务：7 项 verified、4 项 partial、1 项 blocked、1 项 not-run（§2.3）。 |
| 里程碑出口 | **未完成** | M0 未记录；M2 partial；M3 blocked；M4 partial；M5 not-run；M6 partial（§2.1、§4）。 |
| 发布/对外可用 | **不通过** | 宿主加载未执行；iOS UI 矩阵 exit 65、0 断言；Android 原生编译 blocked；M5 无结果数据；full CI 条件性阻断。 |

### 0.3 对外可写 / 不可写

| 可以声明（有证据） | 不可声明（无证据或已被否定） |
| --- | --- |
| Core Skill 包可确定性生成、可校验、可查询（源码布局与包内布局均通过）。 | “整个跨端系统已完成/已上线”。 |
| iOS 33 张 API 卡真实、可追溯到公开 API；Release 消费方构建 exit 0、typecheck exit 0。 | “iOS UI 矩阵通过”；“iOS 原生运行时已验证”。 |
| Android 17 张 API 卡真实（11 组件 + 6 基础入口）、模板静态检查 22/22。 | “Android 黄金模板已编译通过”；“M3 双端闭环完成”。 |
| 四包可确定性打包、manifest schema 0 错、checksums/逐文件哈希自洽、发布候选 gate 0。 | “Skill 已在宿主加载”；“干净环境安装验证通过”。 |
| M5 harness 的反伪造链路有效：readiness exit 2、24 单元 not-executed、claims=[]。 | “M5 评测完成”“Token 节省 X%”“比现状更准”。 |
| iOS/android 源码与 API/ABI 基线零改动（tracked diff 仅 iOS 既有 .gitignore）。 | “M0 契约已评审通过并可实施”。 |

### 0.4 关键事实（数字均来自下述复核命令）

1. **未发现伪造**：所有未执行项都显式记为 not-run/blocked；`--results` 伪造写入被 exit 2 拒绝（R4 §4.2、05 报告 §4）。
2. **iOS**：33 卡、33/33 通过仓库 schema-lite、provider status=experimental（重算）、snapshot=stale、覆盖 10/37；Release 构建 exit 0、typecheck exit 0；UI matrix exit 65（PTY，0 断言）（R7 §2）。
3. **Android**：17 卡（11+6）、17/17 schema 0 违规、26 spec-only、verified=[]；模板静态 22/22；native compile blocked（`:demo` 不存在、无 activity-compose）；runtimeMatrix 11 键 not-run（R11 §2）。
4. **M4**：四包最终 SHA-256 为 core 836fc86c…、ios 364c2647…、android 99e3db4b…、all 85ff8a30…，checksums 71014646…；dist-package 119/119、release-gate 0（R13 §5；本报告 §附录 B 复算一致）。
5. **M5**：readiness exit 2、5 个 blocker、24 个 task×arm 单元全部 not-executed、comparisons 全 null、claims=[]、selftest 16/16；没有调用任何模型（R4 §4、R13 §1）。
6. **M0**：契约自检 25 项通过、manifest schema 0 错；但 `CONTRACT-STATUS.md` 仍为 “frozen-for-review；未批准实施”，M0 出口没有独立复评记录（R1 §6.1、[CONTRACT-STATUS](../ai/skill/CONTRACT-STATUS.md)）。
7. **full CI 条件性阻断**：显式平台仓模式下 `cli.js build --ios-root … --android-root …` exit 0，但随后 `cli.js check` exit 1（build-info.json 差异），启用 full CI 前必须修（R13 §8 第 1 项）。
8. **边界合规**：iOS tracked diff 仅既有 `.gitignore`，`Sources/**`、`Tests/**`、`api/**`、generated 零 diff；Android tracked 为空、HEAD 3656d6f、ABI `06b24043…` 未变（R3 §5、R7 §1、R11 §2.4、R13 §7；本报告 §5 复核）。

---

## 1. 复核范围与方法

### 1.1 对象、任务与复核链

流水线任务 t1–t13 对应 M0–M6；本轮由四个独立复核（R1–R4）审查，发现问题后由修复任务（R6/R8/R10/R12）修复，再由**非修复者**独立复验（R7/R9/R11/R13）。

| 里程碑 | 流水线任务 | 首轮复核 | 修复 | 独立复验 |
| --- | --- | --- | --- | --- |
| M0 契约冻结 | t1；t13（manifest 契约缺口） | R1 | R8（契约侧 F1–F11） | R9/R13（测试与包级）；M0 专项复评未做 |
| M1 Core MVP | t2、t3、t4 | R1 | R8 | R9/R13 |
| M2 iOS 纵向切片 | t5、t6 | R2 | R6 | R7（pass） |
| M3 Android 纵向切片 | t7、t8 | R3 | R10 | R11（pass） |
| M4 打包/CI | t9、t10 | R4 | R8、R12 | R9（needs_revision）→ R13（pass） |
| M5 AI 对照评测 | t11 | R4 | R8（05/证据表刷新） | R9/R13（只读复核） |
| M6 治理 | t12 | R1（F6）、R4 | R8、R12 | R9/R13 |

复核人独立性：R1–R4 的复核人均非对应实现者；R7/R11 由 contract-reviewer 复验 ios-reviewer/android-reviewer 的修复；R13 由 pipeline-reviewer 复验 pipeline-fixer 的修复。R13 报告中明确“非 R12 实现者”。

修复与证据索引：[FIXES-t8.md](FIXES-t8.md)、[FIXES-t12.md](FIXES-t12.md)、[05-M5-Evaluation-Report.md](05-M5-Evaluation-Report.md)、[04-M4-CI-Verification.md](04-M4-CI-Verification.md)、[04-M4-CI-Compatibility-Contract.md](04-M4-CI-Compatibility-Contract.md)；计划与设计：[03-DEVELOPMENT-PLAN.md](03-DEVELOPMENT-PLAN.md)、[02-SKILL-BUILD-PIPELINE.md](02-SKILL-BUILD-PIPELINE.md)；关键契约：[manifest.schema.json](../ai/skill/manifest/manifest.schema.json)、[api-card.schema.json](../ai/skill/provider/api-card.schema.json)；生成物：[checksums.json](../dist/ai-skill/v1.0.0/checksums.json)。

### 1.2 方法

每项声称按同一顺序核验，复核报告中逐条留有命令与退出码：

1. **声称 → 定位实现**：在源码/生成物中找到对应文件与调用路径，避免只读文档。
2. **实际重跑**：能跑的命令重跑并记录 exit code；破坏性或写文件的动作放到 `/tmp` 沙箱副本（如 R4 的 eval 写模式、R11 的 android generator、R13 的单仓复现）。
3. **负例验证**：对“防伪造/防自认证”类断言注入反例（schema 注入 `iosLabel`/`verified`、悬空 JSON pointer、伪造 results、`../` 路径逃逸等），确认会非零退出。
4. **哈希与字节比对**：两次构建/打包逐文件 SHA-256 比对；卡片重放与仓库文件 `diff`；provider 源文件与 dist 内嵌文件比对。
5. **静态核验（E2）**：源码结构、schema 字段、文档状态与测试代码；与 E1（实际执行）分开标注。
6. **裁决**：只有命令/产物支持的范围才写“通过”；未执行项一律 not-run/blocked，不用构建通过替代 UI/原生/宿主通过。

### 1.3 环境

| 项 | 值 |
| --- | --- |
| 工作区 | `<workspace>`（wisdomdesign HEAD b2c05d9；iOS HEAD 64539fe；android HEAD 3656d6f） |
| OS / Node / Python / Ruby | macOS arm64；Node v24.21.0；Python 3.10.4；Ruby 3.0.0p0 |
| Xcode / Swift | Xcode 26.6 (17F113)；Swift 6.3.3；iphonesimulator 26.5 SDK；模拟器 CE28D919-7BEB-46B2-86A7-1D063E54303F |
| Android 构建 | Gradle 8.14.5（缓存发行版）；Compose foundation-layout 1.12.1 |
| 证据等级 | E1=实际执行并记录退出码/哈希；E2=源码或生成物静态核验；E3=仅文档声明（本报告不使用 E3 作通过依据） |
| 未覆盖 | 跨机器/跨 OS 确定性；第三方 JSON Schema 实现；真机；宿主；M5 真实模型调用 |

### 1.4 证据等级（里程碑/任务级）

| 等级 | 定义 | 本报告用法 |
| --- | --- | --- |
| **verified** | 独立复核者实际执行并通过，且有退出码/哈希/产物可复跑 | 里程碑出口“已证明” |
| **partial** | 交付物存在、部分证据成立，但出口条件有未闭合项 | 不得写“完成/已验证” |
| **blocked** | 因环境/前置条件（沙箱、缺依赖、缺消费方）无法执行，且已如实记录 | 不得写“通过”；可写“blocked 属实” |
| **not-run** | 未尝试执行/未开始（如 M5 真实评测、宿主加载、设计评审） | 不得写“通过” |

### 1.5 只读边界与写操作透明度

- 所有复核报告都声明“未修改实现/契约/测试/平台源码”；复核者新增的唯一内容写入是各自报告文件。
- 允许的生成物重跑：R4 与 R8/R12 按任务授权重建 `dist/ai-skill`（生成物，未跟踪）；R2/R7 重跑 xcodebuild 产生 `iOS/.build/**`（gitignored）；R3 重跑 android validator 后 26 个 provider 文件逐字节一致；R11 在 `/tmp` 沙箱运行 generator；R13 在 `/tmp` 复现单仓并重跑 `package.js` 两次（dist 哈希与 R12 一致）。
- **原始交付 dist 已被重建覆盖**，原始 ZIP 哈希与 manifest 关键字段仅存于 R4 §1.3/§2.2 的记录；最终 dist 与当前 HEAD/provider 一致（R13 §5；本报告 §附录 B 复算）。
- 本报告只新增 `wisdomdesign/AIOptimize/06-COMPLETION-REPORT.md` 一个文件。

---

## 2. M0–M6 交付矩阵与证据等级

### 2.1 总矩阵

| 里程碑 | 计划任务 | 主要交付物 | 关键实测证据 | 证据等级 | 出口判定 |
| --- | --- | --- | --- | --- | --- |
| **M0 契约冻结** | t1、t13 | Page Spec v1、Provider SPI、manifest schema、真源映射、baseline、D1–D10、golden-matrix/tasks/protocol | contract-selftest 25 PASS；37 组件五方等集；5 个 manifest 对冻结 schema 0 错；release-gate 0；validate-spec 0/1/2 | **partial** | **未通过**：R1 verdict=needs_revision，修复后无 M0 专项复评；`CONTRACT-STATUS` 仍 frozen-for-review；M0 出口未记录 |
| **M1 Core MVP** | t2、t3、t4 | 提取器、37 语义卡、Page Spec 校验器、get-component、SKILL.md、确定性 build/check | cli test 25+8+12+11 全过；check 52 files；两次 build 逐字节一致；dist-package 119/119；四包内 runtime 六类退出码正确 | **verified** | **通过**（按 M1 出口：37 映射完整、Core 工具测试通过；不含第三方 JSON Schema 全量校验） |
| **M2 iOS 切片** | t5、t6 | iOS Provider、33 张 API 卡、AIStarter 消费方、黄金页面模板、脚手架、iOS 包 | validate_provider 0（33 cards，status 重算 experimental，coverage 10/37）；33/33 schema 0 违规；Release build 0；typecheck 0；UI matrix 65（0 断言）；library gate not-run | **partial** | **未通过**：消费侧编译成立，但规定 UI 矩阵 blocked、library gate not-run；无宿主/真机/设计评审 |
| **M3 Android 切片** | t7、t8 | Android Provider、17 张 API 卡、Compose 黄金模板、模板 manifest | 17/17 schema 0 违规；validator WROTE 17；check-template 22/22；`:demo` not found exit 1；native compile blocked；runtimeMatrix 11 键 not-run | **blocked** | **未通过**：未达 example-compiled；无编译/截图/UI/TalkBack/IME/返回证据 |
| **M4 打包与宿主验收** | t9、t10 | 四类目录包、确定性 ZIP/checksums、files.json/build-info、dist-package 测试、5 层 CI、release-gate、native-layer 登记 | package.js ×2 checksums 71014646… 一致；dist-package 119/119；release-gate 0；L2 strict 7 层；m4-ci 63；单仓 core-only 32/32 | **partial** | **未通过**：打包/CI 主体成立；宿主加载未执行；full CI 模式 `cli.js check` 条件性失败 |
| **M5 AI 对照评测** | t11 | 固定任务集、三臂、readiness gate、run-manifest、observation report、设计评审模板 | readiness exit 2（5 blockers）；24 单元 not-executed；comparisons 全 null；claims=[]；`--results` 拒绝写入；selftest 16 | **not-run** | **未开始**：模型/宿主/工具/原生命令未 pin；无任何真实结果 |
| **M6 扩量与治理** | t12 | 覆盖模型、治理自检、变更触发、发布治理建议 | governance 23 PASS；coverage 设计语义 37、iOS discovered 10、Android discovered 11；04/05/README 状态刷新 | **partial** | **未通过**：仅 M2/M3 纵向切片覆盖；无扩量、趋势监控与发布批准；治理仍为建议稿 |

### 2.2 逐里程碑说明

**M0（partial）**：R1 实测契约文件齐全、19 项自检通过（后扩到 25）、Page Spec 正反例可执行、37 组件等集、manifest dirty/verified 约束可用。但 R1 判定 needs_revision：F2（冻结 manifest schema 未被实现消费、实际 manifest 15/26/24/24/25 个 schema 错误）、F3（provider/API 卡“省略证据字段”可绕过 verified）、F8（实现先于 M0 独立评审）等问题；F1/F2/F3/F4/F5/F6/F7/F9/F10/F11 已在 R8 修复并有测试/复跑证据（R9 §5、R13 §1、§4），F8 仍未闭合（M0 出口没有 captain 记录）。因此 M0 只能记“契约与修复证据基本成立，出口未闭合”。

**M1（verified）**：R1 曾发现打包态 `get-component.js` 不可用（F1，high）与 SKILL 死引用（F7）；R8 修复为“包内自适应 catalog + overlay 不逃逸”，R9/R13 用 dist-package 119 项与四包 runtime 退出码复核通过。语义卡行号（F4）与状态/内容/无障碍提取（F5）也已在 R8 修复并由 catalog 测试断言。M1 的“37 映射完整 + Core 工具测试通过”成立；保留项是没有第三方 JSON Schema 全量实现、预算依据为文档+断言（F9 已补）。

**M2（partial）**：iOS Provider 与 33 张卡真实、状态保守（experimental，未自认证 verified），但这只证明“发现级 API 卡 + 消费方编译/typecheck”；UI 矩阵在沙箱内 exit 65、0 断言（Pseudo Terminal Setup Error），library gate 未运行；snapshot 仍以 c3c32f3/123136bd 为基线并显式标 stale（当前 HEAD 64539fe/1d3be9d7）。因此 M2 出口“消费侧编译 + 规定测试”只完成前半。

**M3（blocked）**：17 张卡（11 组件 + 6 基础入口）与模板静态检查 22/22 成立；但 `:demo` 不存在、缺 activity-compose，native compile 无法执行；四状态/截图/字体/IME/返回/TalkBack 全部 not-run。R3 的 F-03（缺 systemBars import，编译必失败）已在 R10 修复并由 R11 验证，但“修复静态缺陷”不等于“编译通过”，M3 出口仍是 blocked。

**M4（partial）**：打包确定性、scope 隔离、ZIP 路径安全、manifest schema/文件计数/哈希、release-gate、dist-package 119/119、单仓 core-only 路径均已实测成立；但 D3 的宿主加载未执行，`coverage.verification.hostLoad=false`；full CI（显式平台仓）下 `cli.js check` 因未传 roots 而 exit 1，属于条件性阻断；core 包在显式根 full 模式的 provenance 只记 wisdomdesign（低风险完整性项）。

**M5（not-run）**：readiness exit 2 与 5 个 blocker 是**真实前置条件**（UNPINNED_MODEL/HOST/TOOLS、NATIVE_CMD_UNPINNED_IOS/ANDROID），不是文档造出来的；24 个 task×arm 单元全部 not-executed、15 项指标 null、comparisons null、claims=[]；`--results` 在 ready=false 时 exit 2、不写指标；selftest 16/16 断言这些性质。M5 的出口“结论可复算、无夸大收益”只能记“harness 就绪、真实评测未开始”。

**M6（partial）**：治理自检 23 项通过，覆盖模型/状态文档已刷新，`final-acceptance` 不再声称 M1–M5 未实施；但 M6 的“扩组件、扩页面模式、发布治理”没有实际执行，覆盖仍为 10/37 iOS、11/37 Android 的纵向切片，26/27 个组件为 spec-only；治理文档自身仍是 frozen-for-review。

### 2.3 流水线 t1–t13 逐任务结论

| 流水线任务 | 里程碑 | 交付/声称 | 独立结论 | 等级 |
| --- | --- | --- | --- | --- |
| t1 M0 契约冻结 | M0 | Page Spec/Provider/manifest/评测协议 | 契约与自检成立；M0 出口未批准 | **partial** |
| t2 M1-1/M1-2 提取与语义目录 | M1 | 37 组件、语义卡 | 37 等集、行号/状态/内容/无障碍已修复并测试 | **verified** |
| t3 M1-3/M1-4 校验器与查询器 | M1 | validate-spec、get-component | 源码与包内布局均通过；错误码矩阵正确 | **verified** |
| t4 M1-5/M1-6 薄 Skill 与确定性构建 | M1 | SKILL.md、build/check/test | 预算 5,389/6,000、死引用清除、两次构建一致 | **verified** |
| t5 M2 Provider/API 卡 | M2 | iOS 33 卡、status | 33/33 schema 0 违规；status 重算；未自认证 verified | **verified**（卡/Provider 层面） |
| t6 M2 黄金页面/脚手架/消费方 | M2 | AIStarter、模板、UI matrix | Release build 0、typecheck 0、脚手架安全；UI 矩阵 65 blocked | **partial** |
| t7 M3 Provider/API 卡 | M3 | Android 17 卡、status | 17/17 schema 0 违规；WROTE 17；26 spec-only | **verified**（卡/Provider 层面） |
| t8 M3 Compose 黄金页面与验证 | M3 | 模板、manifest、runtimeMatrix | 静态 22/22；native compile blocked；UI/截图/TalkBack not-run | **blocked** |
| t9 M4 四包与确定性打包 | M4 | core/ios/android/all + checksums | 最终哈希可复算；dist-package 119/119；release-gate 0 | **verified**（打包层面） |
| t10 M4 分层 CI/负向测试 | M4 | workflow、route、L2/L3、m4-ci | 单仓与三仓路径通过；full CI 模式 `check` 条件性失败 | **partial** |
| t11 M5 固定评测 | M5 | harness、readiness、报告 | 反伪造链路成立；真实评测未开始 | **not-run** |
| t12 M6 治理建议 | M6 | 治理、覆盖模型、CI 触发 | governance 23 PASS；扩量/趋势/发布未执行 | **partial** |
| t13 M0 manifest 契约缺口修复 | M0 | manifest schema/dirty+release | 5 个 manifest 0 错；release-gate 0；contract 25 PASS | **verified** |

统计：**verified 7、partial 4、blocked 1、not-run 1**（13 项）。

### 2.4 计数演进（证明修复真实发生）

| 指标 | R1/R4 首轮 | 最终（R9/R13） | 说明 |
| --- | --- | --- | --- |
| contract-selftest | 19 PASS | **25 PASS** | R8 增加 provider/API 卡条件约束与负例 |
| m4-ci 测试 | 39 PASS（R4） | **63 PASS** | R8/R12 增加路由/死链/L2/L3 用例 |
| governance-selftest | 19 PASS | **23 PASS** | R8 增加状态一致性断言 |
| dist-package | 不存在（R4 找不到） | **119/119**（full）/ **32/32**（core-only） | R8 新增，R12 扩展单仓 |
| 四包文件数 | 50/92/76/118 | **53/98/80/125** | LICENSE-NOTICE/files.json/build-info 纳入 |
| 死链审计 | 92 md/46 links（R4 独立审计） | **269 md/47 internal/6 cross-repo/0 dead**（workspace）；**16 md/47 internal/6 cross-repo/0 dead**（单仓） | R8 修正正则，R12 增加跨仓分类 |
| dist checksums | 4e887a3c…（原始交付，陈旧） | **71014646…**（最终） | R4 重建 → R8 重打包 → R12 最终态 |

---

## 3. 独立复核发现（含严重度与处置）

### 3.1 总览

| 复核 | 首轮裁决 | 编号 findings | high | medium | low | 处置 |
| --- | --- | --- | --- | --- | --- | --- |
| R1 契约/Core | needs_revision | 11（F1–F11） | 2 | 6 | 3 | R8 修复；F1/F2 由 R9/R13 复跑验证；F8 仍开放 |
| R2 iOS | needs_revision | 8（F1–F8） | 1 | 3 | 4 | R6 修复；R7 复验 pass（7 项剩余） |
| R3 Android | needs_revision | 14（F-01–F-14） | 1 | 5 | 8 | R10 修复；R11 复验 pass（6 项剩余） |
| R4 打包/CI/M5/治理 | M4 出口未闭环（未编号，16 项维度） | — | — | — | — | R8 修复；R9 needs_revision（3 项 blocking）；R12 修复；R13 pass（1 条件性阻断 + 4 剩余） |
| R7 iOS 复验 | pass | 7 项剩余 | 0 | 0 | 5 low + 2 info | 非阻断；见 §3.6 |
| R11 Android 复验 | pass | 6 项剩余 | 0 | 0 | 4 low + 2 info | 非阻断；见 §3.6 |
| R13 流水线复验 | pass | 4 项剩余（+1 条件性阻断） | 0 | 0 | 2 low + 1 info + 1 已知边界 | 条件性阻断见 §4 B10 |

### 3.2 R1（M0/M1）findings 与处置

| ID | 严重度 | 问题摘要 | 处置与独立证据 | 状态 |
| --- | --- | --- | --- | --- |
| F1 | **high** | 打包态 `get-component.js` 在 Core/M4 五包中 exit 2（默认 catalog 路径错误、overlay 逃逸） | R8 修复布局自适应与包内 overlay；R9 四包 runtime 六类退出码、R13 dist-package 119/119 | **已关闭** |
| F2 | **high** | 冻结 manifest schema 未被 builder 消费；实际 core/四包 manifest 15/26/24/24/25 个错误；fileCount/哈希缺口 | R8 新增单一 `lib/manifest.js` 并强制 schema 校验；R9/R13 五个 manifest 0 错、fileCount/LICENSE/自哈希自洽 | **已关闭** |
| F3 | medium | provider/api-card schema 允许“省略 evidenceRefs/compilation”绕过 verified | R8 增加条件约束与省略字段负例；contract-selftest 25 PASS（R9/R13 复跑） | **已关闭（测试层）** |
| F4 | medium | 语义卡 72/72 bullet、1 note 行号系统性错误 | R8 改绝对行号 + lineText；catalog 8 项测试通过（R13 复跑） | **已关闭（测试层）** |
| F5 | medium | M1-1 范围缩水：状态/内容/无障碍结论未提取 | R8 提取 §5/§7/§10 并加来源锚点；卡片含三段，测试断言（R13 复跑） | **已关闭（测试层）** |
| F6 | medium | 治理/README 状态过期，governance-selftest 检查不到 | R8 刷新 final-acceptance/coverage-model/README/04/05/CONTRACT-STATUS；governance 23 PASS | **已关闭** |
| F7 | medium | 包内 SKILL/runtime README 死引用 | R8 删除 source-map 句、改包相对路径、卡片链接退化文本；死链审计 0 dead（R9/R13） | **已关闭** |
| F8 | medium | 流程门禁：M1–M5 实现先于 M0 独立评审/批准 | 未关闭；`CONTRACT-STATUS.md` 仍 frozen-for-review；M0 无第二次评审/出口记录 | **开放（流程）** |
| F9 | low | 常驻预算 6,000 B 缺依据、溢出未测 | R8 增加预算测量表（Core 5,389/6,000）、build-info 字段与超预算负例；build 11 项测试通过 | **已关闭** |
| F10 | low | 自定义校验器子集；structureValid 与语义错误混淆 | R8 分离 structureValid/semanticValid 与 gates；runtime 语义-only 用例通过；仍未接第三方 JSON Schema | **已关闭（残余限制）** |
| F11 | low | M4 验证报告/测试注释过期（计数、fingerprint、死链） | R8 刷新 04 文档；R9 仍发现部分过期→R12 再修；R13 确认 04/FIXES/02 一致 | **已关闭（R12 后）** |

### 3.3 R2（iOS）findings 与处置（R7 复验）

| ID | 严重度 | 问题摘要 | 处置与独立证据（R7） | 状态 |
| --- | --- | --- | --- | --- |
| F1 | **high** | 33/33 卡含 `iosLabel`，违反 M0 `additionalProperties:false`；validator 只做子集校验 | 移除 iosLabel（迁入 limitations）、validator 加 schema 校验；33/33 0 违规，负例注入 exit 1 | **已关闭** |
| F2 | medium | status 未由构建器重算，`computedAtBuild` 无支撑；validator 未接 CI | validate_provider 重算并断言；负例 verified exit 1；CI 登记 exempt-registered | **已关闭（附 CI 豁免）** |
| F3 | medium | typecheck 命令路径根混用，按原文 rc=1 | 改 cwd=. 的根相对命令；原文 exit 0、4 文件 | **已关闭** |
| F4 | medium | 33/33 `SOURCES.json#symbol` 悬空；3 处 `#ios-minimal-compile` 不存在 | 改 JSON pointer/正确 command id；0 悬空，负例 exit 1 | **已关闭** |
| F5 | low | GoldenPageMatrixReport/README 只记旧失败 | 补最终 CE28D919 PTY attempt（exit 65、0 断言）；R7 复跑一致 | **已关闭** |
| F6 | low | 快照/HEAD 与 dist 元数据不同步；apiCardFiles 35≠33 | 显式 stale + 基线重放；R8 重打包后 dist provider=源（本报告抽查一致）；apiCardFiles 字段由新 manifest 生成器移除/改真实计数 | **已关闭（残余：distAudit 历史记录）** |
| F7 | low | UI 测试 target 是 unit-test、无 TEST_TARGET_NAME/依赖 | 改 bundle.ui-testing + TEST_TARGET_NAME + app 依赖；Runner.app 产出；仍 PTY blocked | **已关闭（结构）** |
| F8 | low | 未声明覆盖 10/37 | verification/capabilities 三方一致声明 10/37 + 5 Foundation | **已关闭** |

### 3.4 R3（Android）findings 与处置（R11 复验）

| ID | 严重度 | 问题摘要 | 处置与独立证据（R11） | 状态 |
| --- | --- | --- | --- | --- |
| F-03 | **high** | 模板未 import `androidx.compose.foundation.layout.systemBars`，编译必失败（kotlin 2.4.20 复现 unresolved reference） | R10 加 import 并同步 manifest（33 条）；R11 验证符号存在、22/22；native compile 仍 blocked | **已关闭（静态）** |
| F-01 | medium | “23 张卡”错误计数（validator 双计） | 修为 `componentNames.length`；R11 沙箱 WROTE 17；index/disk 17 一致 | **已关闭** |
| F-02 | medium | 最终源 verification.json 丢失模板静态/编译 blocked/runtimeMatrix（generator 覆盖） | validator 改 merge 保留手工证据；R11 注入/删除测试通过；四类字段恢复 | **已关闭（merge 语义）** |
| F-04 | medium | Content 态主操作 `onClick={}` 未接 onPrimaryAction | 接 createTask → onPrimaryAction + 播报 CREATED；无空 onClick；R11 静态核对 | **已关闭** |
| F-05 | medium | 播报与 page spec 不一致（恒定“加载中”、切选播“新建任务”） | 使用 page spec 原文“任务列表已加载/任务已创建”；R11 逐字核对 | **已关闭** |
| F-06 | medium | `capturedAt` 硬编码常量 | R11 实测 capturedAt 与 mtime 差 127ms；同 SOURCE_DATE_EPOCH 两次运行一致 | **已关闭** |
| F-07 | low | 6 个未使用 import | 已清理；check-template T06 通过 | **已关闭** |
| F-08 | low | WDHaptics sourceRef 锚点偏一行 | 改 L27（声明行）；R11 核对 | **已关闭** |
| F-09 | low | WDTextField 签名截断、WDSwitch/WDCheckbox 重载未说明 | 496 字 + 显式截断 limitation；重载写入 limitations | **已关闭** |
| F-10 | low | `componentCoverage` 混入 6 个 foundation 入口（合计 43） | 未拆分；index/verification/template manifest 已分开写 11+6；R11-R2 仍开放 | **开放（low）** |
| F-11 | low | templates/README 与交付状态矛盾 | README/生成器修复 | **已关闭** |
| F-12 | low | provider `dirty=false`（tracked-only）与 packaging dirty=true 语义不同 | 未统一；R11-R6 仍记录 | **开放（low）** |
| F-13 | low | ABI 交叉检测用 `Lio/` 前缀恒真、基线年龄未写明 | 改为 `io/github/…`；R11 确认；基线仍为 M0 97c9425（旧） | **已关闭（说明残余）** |
| F-14 | low | `status.computedAtBuild` 非计算值 | 实现 computeStatus 按 cards/template 推导；R11 确认 | **已关闭** |

### 3.5 R4（打包/CI/M5/治理）发现与处置

| 复核领域 | 首轮事实（R4） | 处置 | 复验证据（R9/R13） | 状态 |
| --- | --- | --- | --- | --- |
| 打包确定性 | 两次重跑四 ZIP 一致；但交付 dist 在复核开始时已陈旧（原始 a99b/e811/3af0/4624 ≠ 重建 36d6/9690/f774/d682；iOS manifest c3c32f3 vs HEAD 64539fe） | R8 按当前 HEAD/provider 重打包；R12 再终态打包 | 最终 836f/364c/99e3/85ff，两次一致（R13 §5；本报告复算） | **已关闭** |
| ZIP/路径安全 | 50/92/76/118 条目；无绝对路径/`..`/反斜杠/NUL/重复；固定元数据 | 保持并纳入 dist-package 测试 | 119/119（R13） | **已关闭** |
| 逐文件哈希/manifest | 缺 LICENSE-NOTICE；平台包 manifest 自哈希错误；4 个 manifest 对 M0 schema 26/24/24/25 错 | R8 单一 manifest 生成器 + schema 校验 + files.json/checksums | 5 个 manifest 0 错、fileCount/LICENSE/自哈希自洽（R9/R13） | **已关闭** |
| CI 结构/路由 | 4 job、无自动提交；PR 路由退化为 baseline；`package.js` 变更未命中 | R8 重写 5 层 CI + `--paths-file/--require-paths` | 单仓/三仓路由通过（R13） | **已关闭** |
| L2/L3 | L2 no-op；L3 路径不存在且真实 manifest schema 失败 | R8 新增 native-layers 7 层与 release-gate；R12 单仓适配 | L2 strict 7 层、release-gate 0（R13） | **已关闭** |
| 死链审计 | 正则失效（46 条真实链接匹配 0） | R8 修正正则+下限；R12 增加 internal/cross-repo/escape 分类 | workspace 269 md/47+6/0 dead；单仓 16 md/47+6/0 dead（R13） | **已关闭** |
| 单仓 CI 可运行性（R9 新增） | cli build/test/package/m4-ci 依赖同级平台仓与预生成 catalog，标准单仓 checkout 失败 | R12 增加根参数/自举/分类；默认 full 缺平台仓 exit 1 提示 | 单仓 core-only 全链路通过（R13 §1.2） | **已关闭（full 模式除外）** |
| M5 | readiness exit 2、5 blockers、24 not-executed、comparisons/claims 空、selftest 16；05 报告混入 t9 前 plan | R8 刷新 05 证据表为 `t11-post-t9.plan.json` | R9/R13 复核一致；真实评测仍未开始 | **已关闭（证据卫生）** |
| 治理/文档 | governance 19 PASS 但 final-acceptance/coverage-model 写 M1–M5 未实施；04/README 过期 | R8/R12 刷新；governance 23 | R13 确认 04/FIXES/02 一致 | **已关闭** |

### 3.6 复验轮剩余项（非阻断，需在最终报告中披露）

| ID | 严重度 | 剩余项 | 影响 |
| --- | --- | --- | --- |
| R1-F8 | medium（流程） | M0 出口批准未记录；`CONTRACT-STATUS` 仍 frozen-for-review | 不得写“M0 已批准”；需 captain 记录 |
| R7-R1 | low | iOS scaffold 的 verification command 含 `<workspace-relative-destination>` 占位符，字面执行 exit 2 | 6 类场景已替代复验；命令不能原样复制 |
| R7-R2 | low | iOS validator 未实际接入 CI（exempt-registered）；`package.js` 仍复制静态 status | 审计/打包路径不强制重算 |
| R7-R3 | info | iOS UI matrix blocked、library gate not-run | 无 UI/原生通过结论 |
| R7-R4 | info | R7 时 dist 仍为旧 provider（9f26 vs 9ac9、apiCardFiles 35） | 已由 R8 重打包解决；本报告抽查 dist provider=源；`verification.distAudit` 仍保留旧审计字段（low，证据卫生） |
| R7-R5 | low | SNAPSHOT 时间口径、FIXES-t6 dirty hash 表述 | 文档卫生 |
| R7-R6 | low | validator 未断言实际 HEAD==currentRepoHead、未校验 distAudit | 当前值人工核对正确 |
| R7-R7 | low | `statusComputation.computedAt` 是静态记录 | 不要理解为本次验证时间 |
| R11-R1 | low | android validator 仍是“生成+校验”一体，会写 provider/verification（merge 非只读） | 可能刷新 capturedAt；建议拆只读 |
| R11-R2 | low | `componentCoverage` 混入 6 个 foundation（17/43 口径） | 只读该字段的消费者可能误读 |
| R11-R3 | low | check-template T15 正则可能匹配声明而非调用点 | 检查强度不足 |
| R11-R4 | info | native compile/UI/真机仍 blocked/not-run | 无原生通过结论 |
| R11-R5 | info | dist 重建、Gradle wrapper 锁权限 | 已用缓存 Gradle 验证 blocked；dist 已重打包 |
| R11-R6 | low | verification.coverage 缺 verifiedComponents；dirty 语义；命令为描述性文本 | 证据卫生 |
| R13-1 | **条件性阻断** | full CI 模式 `cli.js check` 未传 roots → exit 1（build-info.json 差异） | core-only/三仓不受影响；启用 full 前必修 |
| R13-2 | low | full 显式根下 core manifest sources 只记 wisdomdesign | provenance 完整性 |
| R13-3 | info | 任务描述写 268 md，实际 269 | 最终报告不得引用 268 |
| R13-4 | low | `FIXES-t12.md:59`、`FIXES-t8.md:31` 仍写 44 internal，实际 47+6 | 旧计数，低风险 |

### 3.7 真实性判定

- **未发现伪造**：M5 所有未执行项显式 not-executed、`--results` 拒绝写入；原生/UI 均未写 passed；ZIP 与 checksums 每次都可用 SHA-256 复算；provider 状态未自认证 verified（iOS/Android 都是 experimental，且 iOS 由 validator 重算、负例可拒绝注入）。
- **发现过“子集校验冒充全量通过”与“过期证据”**：R2 的 33/33 卡 `iosLabel` 违反 schema，而 `validate_provider.js` 报 passed（只查 required）；R3 的 validator 报 “WROTE 23”（双计）；R1 的 manifest 声称与冻结 schema 脱节；R4 的交付 dist 陈旧、04 报告数字过期。这些是**证据质量/完整性缺陷，不是故意伪造**，并且都已在 R6/R8/R10/R12 修复，由 R7/R9/R11/R13 复验或测试覆盖。
- **教训**：本项目的主要风险不是“数据造假”，而是“构建/静态检查/子集校验通过被误读为原生、UI、宿主或评测通过”。本报告因此在第 4 节逐项列出未执行与阻塞项。

---

## 4. 未验证与阻塞项

### 4.1 清单

| ID | 项 | 状态 | 证据 | 影响/关闭条件 |
| --- | --- | --- | --- | --- |
| B1 | M5 模型未 pin（`pin-before-M5`） | **blocked** | readiness exit 2，UNPINNED_MODEL（R4 §4.1） | 评测无效；需 captain/评测负责人 pin 模型并批准成本 |
| B2 | M5 宿主未 pin（D3 通用目录包） | **blocked** | UNPINNED_HOST；无宿主 adapter | 无宿主加载/真实使用证据 |
| B3 | M5 工具/原生命令未 pin | **blocked** | UNPINNED_TOOLS、NATIVE_CMD_UNPINNED_IOS/ANDROID；golden-matrix requiresPinning=true | 对照条件不成立 |
| B4 | M5 24 个 task×arm 未执行 | **not-run** | 24 cells 全 not-executed；comparisons null；claims=[]（R4 §4.2） | 无质量/Token/修复数据；不得承诺收益 |
| B5 | iOS UI 矩阵（PTY 沙箱） | **blocked** | xcodebuild test exit 65；Pseudo Terminal Setup Error；0 断言；Runner.app 可构建（R2/R7） | UI 矩阵未通过；需真实 CI/设备执行 |
| B6 | iOS library gate `Scripts/ci.sh pr` | **not-run** | verification #4 status=not-run；脚本存在可执行（R7） | 平台全量门禁未跑 |
| B7 | Android 原生编译（缺消费方 App） | **blocked** | `:demo` not found exit 1；settings 仅 `:wisdom-ui`；无 activity-compose（R3/R11） | 模板未编译；M3 example-compiled 未达成 |
| B8 | Android 四状态/截图/字体/IME/返回/TalkBack | **not-run** | runtimeMatrix 11 键 not-run；verification.unverified（R11） | 无 Android UI/无障碍证据 |
| B9 | 宿主加载（干净环境安装/加载） | **not-run** | D3 仅声明通用目录包；manifest `hostLoad=false`；无加载测试（R4 §2/§9） | M4 出口“干净环境可加载”未达标 |
| B10 | full CI 模式 `cli.js check` | **条件性阻断** | `build --ios-root/--android-root` exit 0 后 `check` exit 1：build-info.json 差异（R13 §8.1） | 默认 core-only 不受影响；启用 full 前必修 |
| B11 | iOS 独立设计评审 | **not-run** | design-review 模板 8 维度全 not-executed；无评审记录（05 §4、R4） | 设计质量未验证 |
| B12 | iOS/android 真机、VoiceOver/TalkBack、对比度 | **not-run** | provider/manifest unverified 显式列出（R2/R3/R11） | 无障碍仅静态/未验证 |
| B13 | 跨机器/跨 OS 可复现 | **未验证** | 仅在当前 macOS/Node/Xcode/Gradle 环境验证（R1 §5、R13 §8.5） | 发布可复现性有环境边界 |
| B14 | 第三方 JSON Schema 全量校验 | **未执行** | 环境无 ajv/jsonschema；使用 schema-lite 子集（R1 §2.6、R7 §6） | 关键字覆盖有长期风险 |
| B15 | M0 出口评审记录 | **未记录** | R1 verdict=needs_revision；`CONTRACT-STATUS` frozen-for-review | 不得声称 M0 批准/可实施 |
| B16 | M6 扩量/趋势/发布治理 | **not-run** | 覆盖 10/37、11/37；governance 为建议稿（R4 §5、R13） | M6 出口未达 |

### 4.2 “构建通过”与“UI 矩阵通过”的区分

| 声称/事实 | 实际证据 | 只能写成 |
| --- | --- | --- |
| iOS 消费方构建 | xcodebuild Release exit 0，BUILD SUCCEEDED（R2 #6、R7 #1） | “构建通过” |
| iOS typecheck | 修正命令后 exit 0，4 个源文件（R7 #2） | “typecheck 通过（4 文件）” |
| iOS UI matrix | exit 65，PTY 错误，0 断言（R2 #14、R7 #9） | “blocked，未通过” |
| Android 模板静态检查 | check-template 22/22（R11 §2.3） | “静态检查通过” |
| Android 原生编译 | `:demo` not found，exit 1；无 activity-compose（R11 §2.3） | “blocked，未编译” |
| M4 四包/checksums | 两次打包哈希一致、dist-package 119/119（R13 §1.1） | “打包/校验通过” |
| 宿主加载 | 无执行、无报告（R4 §9、manifest hostLoad=false） | “未执行” |
| M5 harness | readiness exit 2、24 单元 not-executed、selftest 16（R4 §4） | “harness 就绪，无评测结果” |

### 4.3 各里程碑“还差什么”

- **M0**：captain 对 R1 + 修复的正式复评/出口记录；`CONTRACT-STATUS` 状态更新。
- **M1**：无阻断；可选补第三方 JSON Schema 校验与跨机器复现。
- **M2**：UI 矩阵在真实 CI/模拟器执行（有断言数）、library gate、真机/无障碍/设计评审。
- **M3**：新建最小消费方 `:demo`（+ activity-compose），完成 native compile、四状态截图/UI、IME/返回/TalkBack/fontScale。
- **M4**：干净环境宿主加载；full CI 模式 `check` 传 roots；core 包 provenance（显式根模式）。
- **M5**：pin 模型/宿主/工具/原生命令 → readiness exit 0 → 运行 24 单元 → 生成 results 与对照报告。
- **M6**：扩大组件/页面模式覆盖，建立趋势与发布审批。

---

## 5. 边界合规结论

### 5.1 iOS（dirty 未触碰）

- HEAD `64539fe78d9a036a6e34cbfa01c72e4430c0e2b0` 未变；`git status --porcelain -uno` 仅 1 个 tracked 修改 `.gitignore`（mtime 2026-11-22 10:00:56，早于所有复核/修复任务，内容为删除 `/AIStarter/`、`/ai/` 两行忽略项，不是代码）。
- `Sources/**`、`Tests/**`、`api/WisdomUI.api.json`、`Sources/WisdomUI/Foundation/generated/**` 零 tracked diff；API 工作区 SHA-256 `1d3be9d7…` 等于 HEAD blob（R2 §7、R7 §1、R13 §7；本报告复算一致）。
- 5 个基线 dirty 文件当前内容与 HEAD 一致（逐文件 SHA-256 相同，R2 §7、R7 §1）；只能证明“流水线/复核未写入 + 后续提交归属”，因 baseline 没有逐文件 dirty 内容留档，无法逐字节证明与 2026-11-21 基线 dirty 相同。
- iOS provider 交付物为 `ai/skill-provider/**` 与 `AIStarter/**` 的 untracked 文件（允许写入范围）；snapshot 以 c3c32f3/123136bd 为基线并显式标 stale，未把当前 HEAD 冒充为基线。

### 5.2 Android（ABI 零改动）

- HEAD `3656d6ff8ae83cfd07166dd7fe85db489ef61110` 与 `m0/baseline.json` 一致；`git status --porcelain -uno` 为空。
- ABI `wisdom-ui/api/wisdom-ui.api` SHA-256 `06b240434600c9d5586bb676db562a83b18b5a1cd22e4c6a2597826670b4e984` 在 R3 复核前后一致、R11 复核仍一致（本报告复算一致）。
- R3 按任务重跑 validator 时 26 个 provider 文件重写前后逐字节一致；R11 的生成/merge/幂等测试全部在 `/tmp` 完整沙箱进行，未写真实仓；provider 目录仍是 untracked。

### 5.3 wisdomdesign 与生成物

- `wisdomdesign` 的 tracked 修改只有 3 个文档：`AIOptimize/02-SKILL-BUILD-PIPELINE.md`、`AIOptimize/README.md`、`ai/README.md`（R8/R12 文档刷新）；实现与契约文件为 untracked 新交付，未发现对既有实现的越权改写。
- `dist/ai-skill` 是未跟踪生成物，被 R4/R8/R12 重建；最终 checksums 与 ZIP 哈希见附录 B，已由本报告复算；原始交付 ZIP 已不可取回，仅存哈希记录（可审计性保留项）。
- 打包后的四包与当前平台 provider 一致（iOS provider 源=dist `9ac92d77…`；Android `129764e5…`，本报告抽查），R7-R4 指出的旧 provider 问题已解决。

### 5.4 复核者写入透明

| 复核/修复 | 允许的写入 | 是否改动实现/平台源 |
| --- | --- | --- |
| R1/R2/R3/R4 | 各自 review 报告；R4 重建 dist（生成物） | 否 |
| R6/R10 | iOS/Android provider 交付物（允许范围） | 否（未改平台 tracked 源/ABI） |
| R7/R11 | 各自复验报告；R7 重跑 xcodebuild（gitignored） | 否 |
| R8/R12 | wisdomdesign 实现/文档、dist 重打包 | 否（未改平台源码/API/ABI） |
| R9/R13 | 各自复验报告；R9/R13 重跑 package.js（生成物） | 否 |
| R5（本报告） | 仅本文件 | 否 |

### 5.5 结论

**边界合规：通过。** 未发现 iOS 5 个既有 dirty 修改被触碰、Android ABI/源码被改写、或跨仓越权写入；平台仓 tracked diff 仅 iOS 既有 `.gitignore`。保留项是 baseline 缺少逐文件 dirty 哈希，无法做基线级逐字节回溯（R2 §7、R7 §1）。

---

## 6. 风险与后续建议

### 6.1 风险登记

| ID | 风险 | 等级 | 说明/缓解 |
| --- | --- | --- | --- |
| R-1 | “测试/构建全绿”被误读为原生、UI、宿主、评测通过 | **高** | 本报告 §4.2 明确区分；对外只引用逐项证据 |
| R-2 | M5 未 pin 即引用收益/质量结论 | **高** | readiness exit 2 是硬门禁；禁止任何百分比 |
| R-3 | 证据漂移：iOS snapshot stale、distAudit/时间戳静态、dist 多次重建 | 中 | 发布前按 SNAPSHOT/refresh 步骤重放并刷新审计字段；保留原始哈希记录 |
| R-4 | 校验器自证：schema-lite/validator 子集 + 测试验证自身断言 | 中 | 保留负例；引入第三方 JSON Schema；外部审计复跑 |
| R-5 | 单仓 core-only 绿、full CI 红 | 中 | 修 `cli.js check` 传 roots；CI 明确 core-only/full 两种模式 |
| R-6 | 流程门禁：实现先于 M0 批准，M0/M6 无出口记录 | 中 | captain 正式记录 verdict；CONTRACT-STATUS 更新 |
| R-7 | 覆盖缺口被高估：iOS 10/37、Android 11/37、26/27 spec-only | 中 | 发布材料写明覆盖与 spec-only；M6 扩量前不称“全组件” |
| R-8 | 平台包内 provider 证据引用为平台仓相对路径；本机路径豁免 | 低-中 | 已登记 package-exemptions；跨仓证据需宿主/CI 侧解析 |
| R-9 | 跨机器确定性、Gradle/Xcode 版本差异 | 低-中 | 固定工具链；CI 固定 GRADLE_USER_HOME；记录 SOURCE_DATE_EPOCH |
| R-10 | 文档计数再次过期（本报告新增 1 md/若干内链） | 低 | 本报告写入后重跑 m4-ci/04 数字；不得沿用旧值 |

### 6.2 行动清单

**P0（在写“完成/可发布”前必须做）**

1. **M0 出口**：由 captain 基于 R1 + R8 修复证据记录 verdict；若仍 needs_revision，则不得写“M0 批准”。（R1-F8）
2. **M5 前置**：pin 模型/宿主/工具与双端原生命令；`run.js --check-readiness` 必须 exit 0；随后执行 24 单元并产出 results/对照报告；在此之前保持 observation-only。
3. **原生闭环**：iOS UI 矩阵与 library gate 在真实 CI/设备执行并记录断言数；Android 新建最小消费方 `:demo`（含 activity-compose）完成 native compile 与四状态/无障碍矩阵。
4. **宿主加载**：在干净环境安装/加载通用目录包，记录查询与脚手架运行结果（M4 出口）。
5. **full CI**：让 `cli.js check` 传递 `--ios-root/--android-root`（或调整 workflow），使 full 模式也能 exit 0；否则正式声明 CI 只覆盖 core-only。
6. **禁止发布性表述**：未完成上述项前，不得对外称“流水线完成/已验证/已评测”。

**P1（发布前应处理）**

7. iOS validator 真正接入 CI（解除 exempt），`package.js` 调用 validator 而非复制静态 status；刷新 `verification.distAudit` 到当前 dist。
8. Android validator 拆“只读校验/生成器”，或在文档明确 generator+validator；`componentCoverage` 拆分 component/foundation；加强 T15 调用点检查。
9. 证据卫生：修 `FIXES-t12:59`/`FIXES-t8:31` 的 44 internal；统一 269 md 口径；SNAPSHOT 时间口径；`computedAt` 语义。
10. 引入第三方 JSON Schema 校验（或 meta-schema 校验），保留现有负例套件。
11. full 显式根下 core 包记录平台 provenance（若发布需要）。

**P2（M6/长期）**

12. 扩组件覆盖（iOS 27/Android 26 无卡组件）、扩页面模式、建立发布审批与趋势监控；更新 06 报告索引（本次受“只写报告”约束，未改 README）。
13. 建立跨机器复现基线（固定工具链与 SOURCE_DATE_EPOCH），把“发布可审计”纳入 CI。

### 6.3 判定翻转条件

当且仅当以下全部成立，才可把本报告裁决从“存在阻断项”改为“计划任务完成且证据可审计”：

- M0 出口有 captain 的明确 verdict 且 `CONTRACT-STATUS` 同步；
- M2 UI 矩阵在真实环境执行并有断言数、library gate 通过；
- M3 最小消费方编译通过且规定矩阵（四状态/截图/IME/返回/TalkBack）执行；
- M4 干净环境宿主加载通过；full CI 模式 `check` 通过（或正式限定 core-only 并写明）；
- M5 readiness exit 0、24 单元真实结果、对照报告无夸大；
- M6 覆盖扩展与发布治理有执行记录。

---

## 7. 总裁决

**存在阻断项（B）。**

- **不是“计划任务完成且证据可审计”的无条件通过。** 13 个流水线任务都有真实产物，证据链总体可审计，未发现伪造；但“任务有产物/测试通过”不等于“里程碑出口通过”。按开发计划 §1/§3–§9 的出口口径：M0 出口未记录（needs_revision 修复后无复评）、M2 partial、M3 blocked、M4 partial（宿主加载未执行）、M5 not-run（5 个前置 blocker）、M6 partial。
- **也不是“全盘失败/造假”。** 没有任何伪造证据；四份复核和四份复验都确认了真实构建、真实打包、真实卡片、真实反伪造 harness；主要问题是**未执行项（原生/UI/宿主/评测）**与**证据卫生/流程门禁**。
- **最终可审计结论**：截至本报告快照（2026-11-22），该流水线是“**交付物真实、证据可审计、但出口未闭合的进行中系统**”。可以发布“Core/M4 包与 harness 的技术预览”，不能发布“跨端闭环完成/已验证/已评测”。

> 本报告只汇总已实际执行的命令与结果；未引入任何未在复核/复验报告中出现的命令结论。R5 的只读抽查（哈希/HEAD/字段/链接清点）单列于附录 D。报告写入后新增 1 个 md 文档，若重跑 m4-ci 死链审计，md/链接计数会相应 +1/+N，不等同于既有“269 md/47 internal”口径失效（该口径对应写入前的树）。

---

## 附录 A · 关键命令与退出码（按报告）

| 来源 | 命令/检查 | 退出码 | 结果 |
| --- | --- | --- | --- |
| R1 | contract-selftest | 0 | 19 PASS（当时） |
| R1 | cli.js test | 0 | 42 PASS（当时） |
| R1 | cli.js check | 0 | 49 files match |
| R1 | build ×2 + 逐文件 SHA-256 diff | 0 | diff 为空 |
| R1 | validate-spec（正例/反例/IO 错） | 0/1/2 | 正例 valid、反例 code/jsonPath 匹配 |
| R1 | get-component（源码布局/未找到/用法） | 0/3/2 | 命中/不编造/拒绝 |
| R1 | get-component（打包布局） | **2** | 默认路径 ENOENT / overlay escape（F1） |
| R1 | 冻结 manifest schema 校验实际产物 | — | 15/26/24/24/25 错（F2） |
| R2 | validate_provider.js | 0 | 33 cards, status=experimental |
| R2 | schema-lite 校验 33 卡 | 0 | 33/33 ADDITIONAL_PROPERTY iosLabel（F1） |
| R2 | 基线卡片重放 vs 仓库 | 0 | diff rc=0；当前 HEAD 重放 1（防漂移） |
| R2 | xcodebuild Release | 0 | BUILD SUCCEEDED |
| R2 | typecheck 原文/修正 | 1/0 | 路径根错误；修正后 4 文件通过 |
| R2 | 脚手架合法/覆盖/逃逸 | 0/1/1 | 复制/拒绝/拒绝 |
| R2 | UI matrix | **65** | TEST FAILED，PTY，0 断言 |
| R3 | validate-provider.js | 0 | 22 PASS，WROTE 23（计数 bug） |
| R3 | 静态检查器（47 项） | 1 | 33 PASS / 14 FAIL |
| R3 | Kotlin 最小复现（缺/加 import） | 1/0 | unresolved reference / 通过 |
| R3 | javap WindowInsets | 0 | systemBars 为 static getter |
| R3 | git status / ABI sha256 | 0 | tracked 空；ABI 06b24043… |
| R4 | package.js ×2 | 0/0 | 四 ZIP 哈希一致（重建值） |
| R4 | m4-ci.test.js | 0 | 39 PASS（当时） |
| R4 | eval --check-readiness | 2 | ready=false，5 blockers |
| R4 | eval --dry-run（/tmp） | 2 | 24 cells，not-executed |
| R4 | eval --results fake（/tmp） | 2 | 拒绝写入 |
| R4 | eval run.selftest | 0 | 16 PASS |
| R4 | release-gate（旧路径） | 1 | manifest missing / schema invalid |
| R7 | validate_provider.js | 0 | 33 cards，recomputed experimental，stale，10/37 |
| R7 | schema-lite 33 卡 + provider/capabilities | 0 | 0 违规/0 错误 |
| R7 | 负例 iosLabel/verified/悬空 pointer/悬空 command | 1 | 全部拒绝 |
| R7 | 基线重放/当前 HEAD 重放 | 0/1 | 33 卡逐字节一致 / pin 拒绝 |
| R7 | Release build / typecheck / UI matrix | 0/0/65 | 构建/类型通过；UI blocked |
| R7 | library gate | 未运行 | status=not-run |
| R9 | dist-package.test.js | 0 | 118/118（当时） |
| R9 | m4-ci.test.js | 0 | 61 PASS（当时） |
| R9 | package.js ×2 | 0/0 | checksums 332ee1fc… 一致 |
| R9 | 干净单仓 cli build/test/package/m4-ci | 1 | 单仓不可运行（blocking） |
| R11 | schema-lite 17 卡 | 0 | 0 违规 |
| R11 | validator（/tmp）×2 | 0/0 | WROTE 17；27 文件逐字节一致 |
| R11 | check-template | 0 | 22/22 |
| R11 | Gradle `:demo:assembleRelease` | 1 | project 'demo' not found |
| R13 | dist-package.test.js | 0 | 119/119 |
| R13 | m4-ci.test.js | 0 | 63 PASS；269/47/6/0 dead |
| R13 | contract-selftest / governance | 0/0 | 25 PASS / 23 PASS |
| R13 | cli.js test / check | 0/0 | 25+8+12+11；52 files |
| R13 | package.js ×2 | 0/0 | checksums 71014646… 一致 |
| R13 | release-gate / native-layers strict | 0/0 | 四包 validated / 7 层 |
| R13 | 单仓 m4-ci / cli build / cli check / dist-package / release-gate | 0 | 63 / 52 files / 52 files / 32/32 / 0 |
| R13 | 单仓默认 full package.js | 1 | 清晰提示三种修复方式 |
| R13 | full 显式根 build → check | 0 → **1** | build-info.json 差异（条件性阻断） |

## 附录 B · 最终状态与哈希（R5 只读复算）

| 对象 | 值 |
| --- | --- |
| wisdomdesign HEAD | `b2c05d9`（tracked 修改仅 3 个文档；实现/契约/生成物为 untracked） |
| iOS HEAD / android HEAD | `64539fe78d9a036a6e34cbfa01c72e4430c0e2b0` / `3656d6ff8ae83cfd07166dd7fe85db489ef61110` |
| iOS API 快照 | `1d3be9d703f9ea54710905a6d90db2e9ef7c05b55ab8d8f529c9b2843b725348`（=HEAD blob） |
| Android ABI | `06b240434600c9d5586bb676db562a83b18b5a1cd22e4c6a2597826670b4e984`（=HEAD blob） |
| dist checksums.json | `71014646857f25865d9dfe6988fd2dda7e9c3c40ef80ed29d4ed0d32f5ff5293` |
| core.zip | `836fc86cc58c4121ebfb190fe21c66e0c5603e383936c5126e5b6a79cfe5ba8a` |
| ios.zip | `364c2647c35e1e2e3099303483934513344e891168304e303ad816208df13c4a` |
| android.zip | `99e3db4be7eb7d9fb555376ecfb5a9ae410fbe68a3d74fe0872d365634d11eb2` |
| all.zip | `85ff8a30bbe648856a685302c12d0c7a159ddec222aefdccee4780e5a6ff04de` |
| 四包 fileCount | 53 / 98 / 80 / 125 |
| 覆盖率（dist manifest） | core 37 spec-only；ios 10 experimental + 27 spec-only；android 11 experimental + 26 spec-only；all 18 + 19；verified 0/unsupported 0 |
| iOS provider 源 vs dist | 均 `9ac92d77d5b1da3e62cbc3cfa09ef269752d12c6580f592f6c8afd2307a4333a` |
| Android provider 源 vs dist | 均 `129764e575623705e1efc8c98495d705cde620e4b21ac3913e22394e11c68342` |
| m4-ci truthFingerprint | `c303ee83e3f5dda86af1b9869d3c19d18f34cee04ae946a934c5f40e1680c0ab`（R13/04；未在 R5 重跑） |

## 附录 C · 复核报告清单（本报告依据）

| 报告 | 行数 | SHA-256 | 裁决 |
| --- | --- | --- | --- |
| [01-contract-core.md](review/01-contract-core.md) | 380 | `f38672ed97208c384403593de02521d20f39b485d7fadde0bad890f8f2430f7f` | needs_revision |
| [02-ios.md](review/02-ios.md) | 263 | `c6612a80c5e258c727ae57fd4f0ef1f4e92a6d46c1fe2640aadecdb83911ba7d` | needs_revision |
| [03-android.md](review/03-android.md) | 491 | `d5ec53c91eb2a86fed516026e00d47f97c1dd591a5b1d71de35447743a4d5b9d` | needs_revision |
| [04-pipeline.md](review/04-pipeline.md) | 433 | `7ada47daca6f6b3ab604a48d9f9c19cb139c979d919f18c05eeb497b262b47f3` | M4 出口未闭环 |
| [02b-ios-reverification.md](review/02b-ios-reverification.md) | 168 | `a952226bf2a70b143f8f42ecb415c33d36a23edbe63109bef2eabf0b4edca48e` | pass |
| [03b-android-reverification.md](review/03b-android-reverification.md) | 150 | `08f7f57b519201d196f635a03e07d0125f61487817160d51dccfac7e99b145ef` | pass |
| [04b-pipeline-reverification.md](review/04b-pipeline-reverification.md) | 250 | `04cc145456fab70c9de36ee081f48e9314bd200d3591d97ee6c7299f0b94332a` | needs_revision |
| [04c-pipeline-reverification.md](review/04c-pipeline-reverification.md) | 141 | `e374457b7f816fdba4ed7a13a8138cd80ab844b28a576f97769ce2662ca8c8e3` | pass（1 条件性阻断） |

## 附录 D · R5 只读抽查记录（本报告执行）

本报告不重跑构建/测试，只做以下只读检查以确认“报告结论 vs 当前工作区”一致：

1. 在 `wisdomdesign/` 下运行 `shasum -a 256 dist/ai-skill/v1.0.0/checksums.json` → `71014646…`，与 R13 终态一致。
2. 在 `wisdomdesign/` 下运行 `shasum -a 256 dist/ai-skill/v1.0.0/packages/*.zip` → core `836fc86c…`、ios `364c2647…`、android `99e3db4b…`、all `85ff8a30…`，与 R13 §5 一致。
3. `git -C iOS rev-parse HEAD` → `64539fe…`；`git -C android rev-parse HEAD` → `3656d6f…`；`git -C wisdomdesign status --porcelain` → 3 个文档修改 + 未跟踪交付物。
4. `git -C iOS status --porcelain -uno` → 仅 `M .gitignore`；`git -C android status --porcelain -uno` → 空。
5. `shasum -a 256 iOS/api/WisdomUI.api.json android/wisdom-ui/api/wisdom-ui.api` → `1d3be9d7…` / `06b24043…`。
6. 读取 dist 四包 manifest：fileCount 53/98/80/125；core 与平台包 `sources.repositories` 含 wisdomdesign/ios/android（workspace full）；coverage 数字见附录 B。
7. 读取 iOS/Android provider 与 verification JSON：iOS `status.effective=experimental`、snapshot `stale`、`apiCardCoverage` 10/37；Android `runtimeMatrix` 11 键 not-run、`template-native-compile=blocked`。
8. `shasum -a 256` dist 内嵌 provider vs 平台源：iOS/Android 均逐字节相同。
9. `wc -l` + `shasum -a 256` 复核报告：行数与哈希见附录 C。
10. 本报告写入后，另用只读脚本核对本报告内所有相对链接目标存在。

## 附录 E · 本报告的局限

- 本报告不构成新的独立测试：未重跑 cli/package/eval/xcodebuild/Gradle；所有命令类结论均来自 R1–R4/R7/R9/R11/R13 的记录，R5 只做只读一致性抽查。
- 未覆盖：跨机器/跨 OS 复现、真机、宿主、M5 真实模型调用、第三方 JSON Schema 全量校验。
- `dist/` 是未跟踪生成物，历史上被 R4/R8/R12 重建；原始交付快照仅保留哈希，不能从仓库恢复。
- 本报告写入后新增 1 个 md 文件；若重跑 m4-ci 死链审计，md/内链计数会变化（预计 md +1、internal links 增加本报告内链数），不影响既有报告“写入前树”的计数结论。
- 本报告遵循“只写报告”边界：未更新 AIOptimize/README 的文档索引，未改动 04/FIXES/治理文件；这些属于 P2 文档卫生项。
