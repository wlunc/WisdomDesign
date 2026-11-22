# R11 独立复验报告：Android Provider / 黄金模板修复

> 复核人：contract-reviewer（独立复验；非 R10 实现者）
> 复核时间：2026-11-22 10:46–11:00（Asia/Shanghai）
> 复核对象：android/ai/skill-provider/**（provider.json、capabilities.json、verification.json、api/cards/**、templates/**、tools/validate-provider.js、tools/check-template.js）；只读对照 wisdomdesign 的 M0 schema-lite、page spec、golden matrix，以及 android 的 Kotlin 源/ABI/构建配置。
> 只读边界：未修改 Android tracked 源码、ABI 基线或 provider 交付物；未在真实仓运行会写文件的 generator；generator 的 merge/幂等测试在 /tmp 的完整 android 沙箱（HEAD + .git + provider 副本）中进行。只新增本报告。
> 环境：Node v24.21.0；Python 3.10；Gradle 8.14.5（直接调用缓存发行版）；android HEAD 3656d6ff8ae83cfd07166dd7fe85db489ef61110；wisdomdesign HEAD b2c05d9。

## 0. 结论

**R11 verdict：pass（附非阻断剩余项，见 §5）。**

- R10 的 F-01（17 卡计数/输出一致）、F-03（systemBars import + 模板静态检查）、F-02（verification 恢复 template evidence/runtimeMatrix/capturedAt）、F-04（Content 主操作）、F-05（page-spec 播报）、F-08（WDHaptics L27）等均已独立复验成立。
- 17 张卡均为 discovered；verified=[]、unsupported=0；26 个 catalog 组件 spec-only；37 = 11 + 26 完整覆盖。
- 黄金模板 22/22 静态检查通过；systemBars 已显式 import 且符号在本地 Compose foundation-layout 中存在；Content/Empty 共用同一 create 动作并播报 page-spec 原文；无 onClick={} 空实现。
- native compile 仍 blocked：:demo 不存在、无 activity-compose；直接 Gradle 验证 project 'demo' not found；没有把 blocked 写成 passed。
- Android tracked 源码/ABI 零改动：HEAD 3656d6f 未变，ABI SHA-256 06b24043… 未变，git status tracked 为空。
- 剩余问题为证据卫生/测试强度/流程项：validator 仍是“生成+校验”一体的写文件工具（采用 merge，保留手工证据；不是只读校验器）；componentCoverage 把 6 个 foundation 入口并入 experimental；check-template 的 T15 对“调用点接线”的正则偏宽；capturedAt 虽真实但取决于运行/环境。它们不推翻 F1–F8 的修复结论。

## 1. 环境与只读边界

- Android HEAD 3656d6f，与 wisdomdesign/ai/skill/m0/baseline.json 的 android commit 一致；tracked status 为空；全部 27 个 provider 文件位于 ai/skill-provider/ 且为 untracked。
- ABI：wisdom-ui/api/wisdom-ui.api SHA-256 = 06b240434600c9d5586bb676db562a83b18b5a1cd22e4c6a2597826670b4e984，与 R3 复核值一致；最近修改提交仍是 97c9425（2026-10-07）。
- 本次复跑产生的 Gradle/沙箱文件均在 /tmp 或 .gradle-t6-home（gitignored）；未写真实 provider、未改 tracked 文件。

## 2. 实际重跑命令与结果

### 2.1 卡片、schema、引用

| # | 命令 | 退出码 | 结果 |
| --- | --- | --- | --- |
| 1 | 仓库 schema-lite 校验 17 张 Android 卡 + provider/capabilities | **0** | 17 卡 invalid=0；provider/capabilities 0 错误 |
| 2 | 核对磁盘/index 卡数 | **0** | 18 个 JSON = 17 卡 + index.json；index 17 项与磁盘 17 张一一对应、无重复；index.coverage apiCards=17/componentCards=11/foundationEntryCards=6/specOnly=26/unsupported=0/verified=0 |
| 3 | 读取每张卡 evidence | **0** | 17/17 evidence=discovered；无 example-compiled/template-verified |
| 4 | 检查 WDHaptics 锚点 | **0** | sourceRef = WDHaptics.kt#L27，L27 正好是 public fun rememberWDHaptics 声明 |
| 5 | 检查 WDTextField 签名/limitations | **0** | signature 长度 496（schema max 500），limitations 明确写截断；无静默截断 |
| 6 | 检查 WDSwitch/WDCheckbox 重载说明 | **0** | limitations 分别记录额外 2/3 个 public 重载，主卡记录冻结签名 |

### 2.2 validator 生成/合并行为（/tmp 沙箱）

沙箱 = git archive android HEAD + 复制 .git + 复制 provider；未写真实仓。

| # | 命令 | 退出码 | 结果 |
| --- | --- | --- | --- |
| 1 | SOURCE_DATE_EPOCH=1700000000 node android/ai/skill-provider/tools/validate-provider.js | **0** | 末尾 WROTE 17 api cards；不再出现 23；schema PASS 覆盖 provider/caps/index/17 卡 |
| 2 | 同一 epoch 再跑一次 | **0** | 27 个 provider 文件逐文件 SHA-256 diff 为空（幂等） |
| 3 | 沙箱生成结果 vs 真实仓文件（忽略 verification.capturedAt） | — | 所有 JSON/文本逐字段一致；仅 capturedAt 不同。说明当前仓文件确实是该 validator + 当前输入生成的结果 |
| 4 | 注入 manual executed/notExecuted/unverified/runtimeMatrix 额外键与 provider.status.evidenceRefs 后重跑 | **0** | 全部手工条目/evidenceRef 保留（merge 语义成立） |
| 5 | 删除上述手工注入后重跑 | **0** | 手工条目全部消失；generated 条目保持 |
| 6 | 不设 SOURCE_DATE_EPOCH 重跑（沙箱） | **0** | capturedAt = 当前 UTC 时间（实测 2026-11-22T02:46:52.884Z，当前时间 02:46:52.945Z），不是硬编码 |

### 2.3 模板、导入、native blocked

| # | 命令 / 检查 | 退出码 | 结果 |
| --- | --- | --- | --- |
| 1 | node android/ai/skill-provider/tools/check-template.js --json | **0** | passed=true，22/22 checks，0 failures；announcements=[任务已创建, 任务列表已加载]；compile=blocked |
| 2 | 模板/ manifest imports 对比 | **0** | 模板 33 条 = manifest 33 条，集合相等；T05/T06/T07 通过 |
| 3 | systemBars 符号存在性 | **0** | 本地 Compose foundation-layout jar: WindowInsets_androidKt.getSystemBars(WindowInsets$Companion, Composer, int) 存在；模板第 17 行显式 import，第 104 行使用 |
| 4 | 直接 Gradle 验证 :demo（缓存发行版，避免 wrapper 锁） | **1** | Cannot locate tasks that match ':demo:assembleRelease' as project 'demo' not found；settings.gradle.kts 仅 include(:wisdom-ui)；无 activity-compose |
| 5 | 模板行为静态核对 | **0** | Content 调用 TaskContent(..., createTask)；createTask = announce(CREATED_ANNOUNCEMENT) + onPrimaryAction；EmptyContent(createTask)；LaunchedEffect(Content) announce(LOADED_ANNOUNCEMENT)；无 onClick={} |
| 6 | page spec 校验 | **0** | validate-spec valid=true；primaryAction=createTask；announcements 原文任务列表已加载 / 任务已创建；四状态 loading/content/empty/error |

### 2.4 覆盖、状态、capturedAt、tracked/ABI

- capabilities：experimental 17（11 个 catalog 组件 + 6 个 foundation 入口）、specOnly 26、verified []、unsupported []；26 specOnly 全在 37 catalog 内，与 experimental 不重叠；37 个 catalog 组件全部被 26 specOnly + 11 experimental 覆盖。
- index/verification/template manifest/provider.reason 均写 17 卡 = 11 + 6 与 26 spec-only/0 unsupported；provider.status.effective=declared=experimental，未冒充 verified。
- verification.runtimeMatrix 11 键全部 not-run；executed = source-abi-crosscheck(passed)、provider-schema-check(passed)、template-static-check(passed)、template-native-compile(blocked, exit=null)；notExecuted 4 项；unverified 11 项。
- verification.capturedAt = 2026-11-22T02:37:35.127Z；文件 mtime = 2026-11-22T02:37:35.000Z（+08 10:37:35），差 127ms，属真实运行时间，不是 R3 所述硬编码 2026-11-21T18:20:14+08:00。
- Android tracked：git status --porcelain --untracked-files=no 为空；HEAD 3656d6f 与 M0 baseline 一致；ABI hash 06b24043… 与 HEAD blob 一致；除 ai/skill-provider/ 外无 untracked。

## 3. R10 声称 vs 证据

| R10 声称 | 独立证据 | 结论 |
| --- | --- | --- |
| F-01：validator 修正双计，输出 WROTE 17；index/provider/manifest/verification 统一 17 = 11 + 6，26 spec-only、0 unsupported | 沙箱 validator exit0 输出 WROTE 17；index/disk 17；四份文件 coverage 字段均为 17/11/6/26/0；代码输出使用 componentNames.length | **PASS** |
| F-03：TaskListScreen.kt 增加 systemBars import，manifest imports 33 条同步；check-template 22/22 | 模板第 17 行 import、第 104 行使用；manifest 33；check-template 22/22；本地 Compose jar 有 getSystemBars；Gradle 直接验证 :demo 不存在 | **PASS** |
| F-02：validator 改 merge；verification 恢复 template-static-check passed、template-native-compile blocked、runtimeMatrix 11 键 not-run、capturedAt 真实 | 沙箱注入/删除测试证明手工条目保留/删除；当前 verification 四类字段齐全；capturedAt 与 mtime 差 127ms；同一 epoch 两次运行逐字节一致 | **PASS（附写文件语义说明）** |
| F-04：Content 态主操作接 onPrimaryAction，播报 CREATED_ANNOUNCEMENT，进入 Content 播报 LOADED_ANNOUNCEMENT，无 onClick={} | 模板 78-81、85-89、112、115、148、157 行；无空 onClick；check-template T15/T16 通过 | **PASS** |
| F-05：无障碍播报与 page spec 不一致 | 模板只调用 announce(CREATED_ANNOUNCEMENT) 与 announce(LOADED_ANNOUNCEMENT)，两常量与 page spec 逐字一致；CREATE_LABEL 只作按钮 accessibilityLabel，不再作为播报文本 | **PASS** |
| F-08：WDHaptics 锚点 L27 | API 卡 sourceRef #L27；源文件 L27 是声明 | **PASS** |
| R10 其他：6 个 unused import 清理、WDTextField 496 字 + limitation、WDSwitch/WDCheckbox 重载 limitations、README/ABI/status 修复 | check-template T06 无 unused；WDTextField 496 + limitation；WDSwitch/WDCheckbox limitations；abi 检测代码用 io/github/…；status.computeStatus 按 cards/tpl 推导 | **PASS** |

## 4. t11 六项检查

| # | 检查项 | 结论 | 说明 |
| --- | --- | --- | --- |
| 1 | 17 卡；validator 不重复计数、输出与实际一致 | **PASS** | WROTE 17；index/disk 17；无 23；卡文件与 index 一一对应 |
| 2 | 模板 imports/用法正确，或 native blocked 证据真实、原因准确 | **PASS** | systemBars 导入 + 符号存在；22/22；:demo/activity-compose 确实缺失；没有把 blocked 写成 passed |
| 3 | validator 不再覆盖 verification/provider；t8 真实证据恢复；capturedAt 真实 | **PASS（merge 语义）** | 仍会写回文件（生成+校验一体），但 merge 保留手工 executed/notExecuted/unverified/runtimeMatrix/status.evidenceRefs；当前 template evidence 齐全；capturedAt 真实 |
| 4 | Content 态 action、播报与 page spec 一致 | **PASS** | createTask 接到 onPrimaryAction；两条播报常量与 page spec 逐字一致；Content/Empty 共用同一 create 动作 |
| 5 | 17/17 discovered、verified=[]、26 spec-only/0 unsupported | **PASS** | 17 cards all discovered；capabilities/index verified []/0、unsupported 0、specOnly 26；26 个都是 catalog 组件 |
| 6 | Android tracked 源码/ABI 零改动 | **PASS** | tracked status 为空；HEAD 3656d6f；ABI 06b24043… 未变；仅 provider untracked |

## 5. 仍存在项（非阻断）

### R11-R1（low）validator 仍是“生成+校验”一体，会写 provider/verification（merge 不等于只读）

- 证据：validate-provider.js 每次运行写 api/cards/*、index.json、capabilities.json、provider.json、verification.json、tokens/README、templates/README；沙箱注入测试证明手工条目会被保留，但文件 mtime/capturedAt 会变化。
- 影响：R10 的“不再覆盖”应理解为“不再丢失手工证据（merge）”，不是“validator 只读”。若 CI/审计要求 validator 零写入，需要拆成只读 validator + 单独 generator；当前设计仍可能让一次误跑刷新 capturedAt。
- 建议：明确标注“generator+validator”运行方式；CI 用临时输出或先用 SOURCE_DATE_EPOCH 固定；长期拆只读校验。

### R11-R2（low）componentCoverage.experimental 混入 6 个 foundation 入口

- 证据：17 experimental 中有 11 个 catalog 组件 + 6 个 foundation（WDTheme/WDSemantics/WDHaptics/WDAnnouncer/WDLayout/WDMotionScale）；26 specOnly 全部是 catalog；集合合计 43，不是 37。
- 影响：index/verification/template manifest 已把 11 与 6 分开写，provider.reason 也写明；但只看 capabilities.componentCoverage 的消费者可能误读“17 个组件”。R3 F-10 曾提出；R10 未拆分。
- 建议：拆分 componentCoverage 与 foundationCoverage，或增加 note。

### R11-R3（low）check-template T15 的正则可能匹配函数定义而非调用点

- 证据：T15 正则 TaskContent(...onCreate|onPrimaryAction) 也会匹配 private fun TaskContent(... onCreate: ...) 的声明；仅靠 T15 不能证明调用点接线。本次人工核对当前模板确实把 createTask 传入 Content，且 EmptyContent(createTask)，所以当前模板行为正确。
- 影响：测试强度不足，未来改坏调用点可能仍通过 T15；属于检查器质量缺口，不是当前模板缺陷。
- 建议：改为检查 TaskContent 调用实参/命名参数，或增加 AST/括号级解析。

### R11-R4（info）native compile 与 UI 仍 blocked/not-run

- :demo 不存在、activity-compose 缺失；直接 Gradle 输出 project 'demo' not found；template-native-compile 保持 blocked；runtimeMatrix 11 键全 not-run；screenshot/TalkBack/IME/返回/fontScale 等未验证。
- 本报告不据此判 Android 原生/UI 通过；verification 和 provider 均如实标注。

### R11-R5（info，流水线/环境）dist 与 Gradle wrapper

- t8 并发重建 dist（本次观察 wisdom-page-android manifest mtime 2026-11-22 10:49:25，内容已在变化）；R10 的“dist 未重建”只描述其完成时点，不等于当前。
- 环境内 ./gradlew 被 wrapper 缓存锁权限挡住（FileNotFoundException .gradle/...zip.lck）；我用缓存 Gradle 发行版直接验证了 :demo 不存在。verification 记录的 ./gradlew 命令在正常环境可运行，但本沙箱无法原样复现 wrapper 入口。
- 建议：t8 重打包后复跑 17 卡/计数/模板静态检查；在 CI 用固定 GRADLE_USER_HOME。

### R11-R6（low）其他证据卫生

- verification.coverage 没有 verifiedComponents 字段（index 有 verifiedComponents:0）；五份文件口径中 verification 略少一项。
- provider.source.dirty=false 是 tracked-only 语义（provider 目录本身 untracked），与 package manifest 的 dirty=true 语义不同；R3 F-12 已指出，本轮未变。
- verification 的 source-abi-crosscheck command 是描述性文本（grep/read…），不是可执行命令；其 status=passed 依赖人工/脚本核对，建议结构化。

## 6. 未验证与限制

1. 未在真实 android 仓运行 validate-provider.js（它会写文件）；所有生成/merge/幂等测试在 /tmp 的完整 sandbox 中进行，并用“忽略 capturedAt 后与真实仓逐字段一致”证明当前源文件是同一 generator 输出。
2. 未执行 Kotlin 编译、Gradle 原生构建、截图/UI/真机/TalkBack；:demo 不存在、activity-compose 缺失，blocked 结论真实；未把 blocked 当通过。
3. 未用第三方 JSON Schema 实现；用仓库 schema-lite + validator 自带子集双重校验（均通过）。
4. 未验证 dist 当前内容（t8 并发重建中）；本报告不把 dist 当作 R10/R11 的通过证据。
5. 未逐项复验 R3 的其他 low finding（F-07/F-09/F-10/F-11/F-12/F-13/F-14），只验证 R10 声称修复范围与 t11 六项；其中 F-10/F-12 仍在 §5 记录为残余。

## 7. 最终结论

- **R10 修复：独立复验通过。** 17 卡、schema、计数、模板 import/行为、verification merge/capturedAt、page-spec 播报、tracked/ABI 零改动均成立；未发现伪造的 23 卡、假编译通过或丢失模板证据。
- **R11 verdict：pass。** 剩余项为 low/info：validator 仍写文件（merge）、componentCoverage 口径混合、T15 测试强度、dist/t8 并发、少量证据字段；不改变 F1–F8 修复结论。
- **边界**：Android 仍无 native compile/UI/真机/宿主证据；M3/M6 的出口不能由本报告判为通过。

## 8. 审计索引

- 沙箱：/tmp/r11-sandbox（android HEAD archive + .git + provider copy + wisdomdesign symlink）；未影响真实仓。
- 日志：/tmp/r11-validator*.out、/tmp/r11-template.json、/tmp/r11-gradle-demo3.log、/tmp/r11-compare.py。
- 关键文件：android/ai/skill-provider/{provider.json, capabilities.json, verification.json, api/cards/*, templates/task-list/*, tools/validate-provider.js, tools/check-template.js}；wisdomdesign/ai/skill/page-spec/examples/task-list.valid.json；android/wisdom-ui/api/wisdom-ui.api。
- 只读性：真实 Android tracked/ABI 零改动；本报告是唯一新增写入。
