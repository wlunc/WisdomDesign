# 12 · 第二轮评审 · 架构师复核意见

> **这是第二轮评审（架构侧）。** 基线与唯一权威依据：[`11-conclusions.md`](11-conclusions.md)（定稿 **2026-10-03**）及其讨论稿 [`10-discussion.md`](10-discussion.md)。
> 评审人：架构师（iOS / Android 双端）。性质：**独立复核**——只写复核结果与新增内容，不复述第一轮已定论事项。
> 代码基线（本轮实际读取的提交）：iOS `316b75f`、android `524f5d6`、wisdomdesign `e495147`；工作区状态见 §1.4。
> 文中 `file:line` 均为本轮实测行号；命令与输出见 §1.2 / §1.3。

---

## 1. 复核范围与方法

### 1.1 读了什么

| 类别 | 对象 | 规模 |
| --- | --- | --- |
| 结论与过程 | `docs/10-discussion.md`（重点 §1 / §3 / §4.5 / §7 / §8）、`docs/11-conclusions.md` | 1235 + 222 行 |
| 规范 | `README.md`、`docs/03-platform-mapping.md`、`docs/04-architecture.md`、`docs/05-preview-and-theme.md`、`docs/06-accessibility.md`、`docs/01-foundation.md`、`docs/09-layout.md`、`docs/specs/README.md`、`docs/specs/03-patterns.md`、`docs/02-components.md` | 全文/定点 |
| 真源与生成器 | `tokens/wisdom.tokens.json`、`tools/token-build/build.js` | 504 行 |
| iOS 代码 | `iOS/Sources/WisdomUI/Foundation/WDTokenTypes.swift`、`WDColor+Hex.swift`、`Generated/WDTokens.swift`、`iOS/Package.swift`、`Tests/WisdomUITests/WDTokensTests.swift` | 全部源码（3 + 1 文件） |
| Android 代码 | `foundation/WDTheme.kt`、`foundation/WDGradient.kt`、`foundation/Generated/WDTokens.kt`、`api/wisdom-ui.api`、`src/test/.../WDTokensTest.kt`、`build.gradle.kts`/`settings.gradle.kts` | 全部源码（3 + 1 文件） |
| 设计产物 | `design/preview/wisdom-light.html`、`design/gallery/*.html`（3 份，定点核验 `--g-*` / `--wd-wash` / `opacity:.55`） | 定点 |

三端源码树实测：`iOS/Sources/WisdomUI/` 下**只有 `Foundation/`（含 `Generated/`）一个目录**，`android/wisdom-ui/src/main/kotlin/.../wisdom/` 下**只有 `foundation/`**——即当前 37 组件 + 5 配方的实现进度为 **0**（`find ... -type d` 输出）。这一点决定了 §3 的结论口径。

### 1.2 跑了什么（命令与真实输出）

| # | 命令 | 结果 |
| --- | --- | --- |
| 1 | `node wisdomdesign/tools/token-build/build.js --check` | `✓ iOS/…/WDTokens.swift` / `✓ android/…/WDTokens.kt`，**退出码 0** |
| 2 | 令牌叶子审计脚本（附录 B 口径；`$value` 递归统计 + 关键字过滤） | 叶子 **168** 个；`wash` / `status-text` / `scrim` / `navbar-large` **均 NOT FOUND**；`component` 仅命中 `motion.component.*`（10 个）；`color.named` **9** 个 |
| 3 | `xcrun swiftc -typecheck -sdk <iPhoneOS26.5.sdk> -target arm64-apple-ios17.0 -module-name WisdomUI`（4 个 Foundation 源文件） | **退出码 0**（iOS Foundation 当前确实能编译） |
| 4 | `swift build`（`iOS/`） | **未能执行**：SwiftPM 需要 `sandbox-exec`，本环境报 `sandbox-exec: sandbox_apply: Operation not permitted`；另 `~/Library/org.swift.swiftpm/*` 不可写 |
| 5 | `./gradlew --offline :wisdom-ui:apiCheck :wisdom-ui:compileDebugKotlin`（3 种方式：wrapper / 直连 gradle dist / `GRADLE_RO_DEP_CACHE`） | **未能执行**：wrapper 锁文件被拒（`~/.gradle/wrapper/.../gradle-8.14.5-bin.zip.lck: Operation not permitted`）；直连 dist 报 `Could not initialize native services`；RO 依赖缓存下插件元数据离线不可解析（`Plugin [id: 'com.android.library', version: '8.13.2'] was not found`）。**因此"Android 能编译 / apiCheck 通过"这一条本轮未取得直接证据**，只能静态比对（§1.4 第 3 行） |
| 6 | `javap`（Material3 依赖 jar `.evidence/classes.jar`） | `lightColorScheme/darkColorScheme` 当前重载 **48 个角色参数**，其默认值桥接取自 `androidx.compose.material3.tokens.ColorLightTokens` / `ColorDarkTokens`；`MaterialTheme(ColorScheme, Shapes, Typography, content)` |
| 7 | `git -C iOS/android/wisdomdesign status --porcelain` | iOS 0 行、android 0 行、wisdomdesign **3 行**（见 §1.4） |
| 8 | `find` 两端仓库 lint 配置（`.swiftlint*` / `detekt*` / `.editorconfig`）与 `.github` | **全部为空**（三仓库均无 `.github`） |

### 1.3 独立复算了什么

按 WCAG 2.1 相对亮度公式独立复算（脚本为附录 B 口径，未使用第一轮的数值缓存）：

| 复核对象 | 我的实测 | 与第一轮声称 |
| --- | --- | --- |
| `#4C8DAE`/`#123F5C`（B1 群青） | **3.03** | 吻合 |
| `#B0D5DF`/`#123F5C`（B1 湖水蓝） | **7.10** | 吻合 |
| `status.*` × `status-soft.*`（B2 四组） | 4.32 / 4.17 / 4.58 / 3.94 | 吻合 |
| `status-text.*` 四个候选（B2） | 5.73 / 5.89 / 5.41 / 5.44 | 吻合 |
| `#DCEEF4`/`#1677B3` vs `#FFFFFF`/`#1677B3`（B3） | **4.07** / **4.86** | 吻合 |
| `#4FB0C8`/白 vs `#3898B4`/白（B4） | **2.51** / **3.32** | 吻合 |
| `#5B7784`/`#F1F8FA`（B10 浅色） | **4.43** | 吻合 |
| `#5B7784`/`#BCE0E6`（B10 色晕最不利） | **3.38** | 吻合 |
| `#839EB0`/`#465F6C`、`#A4BCCB`/`#465F6C`（§8.2.1 深色端） | **2.40** / **3.42** | 吻合 |
| `#4C616D`/`#F1F8FA`（B10 裁定值） | **6.04** | 吻合 |

令牌关键数值独立读取（直接解析 `tokens/wisdom.tokens.json`，非引用文档）：`size.tabbar-height = 56`、`semantic.dark.text.on-fill = #DCEEF4`、`semantic.light.text.tertiary = #5B7784`、`semantic.dark.text.tertiary = #839EB0`、`gradient.mid = linear-gradient(135deg,#4FB0C8 0%,#1685A9 100%)` —— **与第一轮记载完全一致，§2 因此判定第一轮账目可信。**

### 1.4 基线状态核对（与经验事实的两处出入）

1. **"三个仓库工作区干净"不成立（需修正）**：`git -C wisdomdesign status --porcelain` 实测 3 行——
   ` M README.md`、`?? docs/10-discussion.md`、`?? docs/11-conclusions.md`。
   也就是说：**本轮的权威基线文件 `11-conclusions.md` 尚未进入版本控制**（`10-discussion.md` 同）。这不是文档洁癖问题——第二轮评审的"基线不可变"前提、以及"M0 一次冻结"要点的差异审计，都依赖这两份文件有提交号可指。**M0 开工前第一件事应是把 10 / 11 与 README 指针提交**（否则 §4.1 的出口条件无法用 `git diff` 证明"决议已落地"）。
2. **"工作区干净"对 iOS / android 成立**：两端均为 0 行，且两端最后一次提交都是 M1 令牌基础层（`316b75f` / `524f5d6`）——**第一轮决议至今零落地**，与 `11-conclusions §6` 的记载一致。
3. **`api/wisdom-ui.api` 无法在本环境重跑 `apiCheck`**（§1.2 第 5 行）。静态比对：`WDTokens.kt` 的 `WDColors` 构造参数 **27** 个与 `.api` 中 `WDColors` 的 27 个 getter（`api:4-30`）逐名对应，`WDSize`/`WDRadius`/`WDType` 亦一一对应，**未发现已提交的 `.api` 与源码不一致**；但"能通过 apiCheck"仍属未验证项（见 §6 与 §7）。

---

## 2. 对第一轮结论的复核

### 2.1 成立（本轮独立验证过的条目，不再复述理由）

| 条目 | 复核动作 | 判定 |
| --- | --- | --- |
| **B1** | 复算群青 3.03 / 湖水蓝 7.10（§1.3） | 成立 |
| **B2** | 复算四组 4.32/4.17/4.58/3.94 与四个候选 5.73/5.89/5.41/5.44 | 成立 |
| **B3** | 复算 4.07 vs 4.86；令牌 `semantic.dark.text.on-fill` 仍 `#DCEEF4`（tokens:123）；iOS 生成 `WDTokens.swift:20`、Android `WDTokens.kt:91` 同值 | 成立 |
| **B4** | 复算 2.51 / 3.32；`gradient.mid` 仍 `#4FB0C8` 起（tokens:49；`WDTokens.swift:96`、`WDTokens.kt:168/176`） | 成立 |
| **B5** | 令牌 56（`WDTokens.swift:160`、`WDTokens.kt:225`）vs `09-layout.md:18` 写 58、`:21` 留白算式 `82 = 58 + 8 + 16` | 成立（且缺口是 **2pt** 的跨仓库物理差） |
| **B6** | `WDTokenTypes.swift:18-20` 仍是 `.system(size: size, weight: weight)`；`:22-24` 仍是 `lineSpacing = lineHeight - size` | 成立 |
| **B7** | `03-platform-mapping.md` 仍为绿色品牌（`:41` `#2F7F63`、`:42` `#E0F0E8`、`:159` `Color(0xFF2F7F63)`）与旧路径（`:12-16` `ios/Sources/…`、`com/wisdom/ui/`） | 成立 |
| **B8** | 令牌文件确实**没有** `component.*`（仅有 `motion.component.*`，tokens:276）；`WDRadius.checkbox/fab`、`WDSize.checkbox` 是散落在其他命名空间的组件常量 | 成立 |
| **B9-1** | `color.named` 实测 **9** 个，`README.md:24` 写"十二个色" | 成立（但有第四处副本，见 §2.2-5） |
| **B9-6** | `05-preview-and-theme.md:36` 要求 `preview-cases/*.yaml` 作为契约；`wisdomdesign/docs/preview-cases` 不存在 | 成立 |
| **B10** | 复算 4.43 / 3.38 / 6.04；令牌仍是 `#5B7784` / `#839EB0` | 成立 |
| **§3.2 触控热区** | `06-accessibility` 的 iOS 44 / Android 48 与令牌单值 44 冲突 | 成立（但落地形态不成立，见 **B15**） |
| **§3.3 新增令牌清单** | 逐一在令牌文件里查找：`status-text` / `scrim` / `navbar-large` / `wash` 全部缺失 | 成立 |
| **§4.1 第 8 条（玻璃与 `06 §5.2` 调和）** | `06-accessibility.md:161` 仍是"文字必须落在 `surface.glass-strong`（82%+）上"；`01-foundation.md:284` 仍是"导航栏 62%、Tab 栏 62%、浮层 82%" | 成立 |
| **§4.1 第 7 条（净 alpha）** | `wisdom-light.html:1423` 仍是 `opacity:.55`；`:1380` `--wd-wash` 单份定义、`:1394` `#wd-board.wd-dark{color-scheme:dark}` 只切 `color-scheme` → 深色复用浅色色晕的根因仍在 | 成立 |
| **§8.4.1 账目生成化 / §8.4.2 M0 范围** | `build.js` 全文中**没有任何对比度、没有 `contrast.json`、没有画廊 CSS 输出**（504 行逐段核验） | 成立 |
| **§8.5 两条平台空白** | Android 侧 `WDTheme.kt:60-84` 只映射 10 个 M3 角色；iOS 侧自绘 Tab 与系统 chrome 的关系无任何代码/规格判定 | 成立（第一轮只给了方向，本轮给出可验证判定条件，见 §5） |

**结论：B1–B10 与 §3/§4 的主要判断，本轮逐条复核未发现"不成立"项。** 第一轮的账目质量可以被第二轮直接继承。

### 2.2 需修正（6 条：结论本身成立，但范围/口径/可执行性有问题）

| # | 修正对象 | 问题（证据） | 建议修正 |
| --- | --- | --- | --- |
| 1 | **§4.1 M0 出口条件缺一项：Android `.api` 更新** | `11-conclusions.md:136-146` 的 9 条出口条件里没有 `.api`；而 `§4.3` 把"公开 API 冻结"排在 M3（`:169`）。但 M0 的令牌增删会直接改动 `api/wisdom-ui.api:1-31`（`WDColors` 是 27 参 public 类，另有 118 个 `get*` 条目），`§4.4` 的执行顺序（`:177`）里虽有 `apiDump`，却没进出口条件 → **M0 可以被判定"通过"而 Android 仓库的 `apiCheck` 已经红**，红点会落到 M1 第一个 PR | 出口条件补第 10 条："`apiDump` 结果已提交，两端仓库 `apiCheck` 为绿"；并把"公开 API 冻结"的**首次**执行从 M3 提前到 M0（M3 只做"冻结后不得再变") |
| 2 | **§4.1 第 6 条与 §3.3 画廊定位自相矛盾** | `:143` 要求"画廊 `--g-*` 由生成器输出并纳入 `--check`"，`:88` 又定"画廊是阶段性评审产物，每批组件定稿时重生成、不承诺实时同步"。实测三份画廊 HTML 里 `--g-*` 引用 129 / 178 / 70 处、全为手写 → 纳入 `--check` 等于"每次令牌变更必须同时重生成三份 HTML"，与"不承诺实时同步"直接冲突 | 改为：生成器输出**独立的画廊变量块**（独立文件，整块覆盖），`--check` 只比对这一块；组件示例样式仍允许滞后 |
| 3 | **§4.2 第 3 条"两端能编译"不可执行** | 该条只有一句话，没有命令。实测 iOS `Package.swift:4-6` 只声明 `.iOS(.v17)`，且 Foundation 依赖 UIKit（`WDColor+Hex.swift:19` `UIColor`）→ 主机 `swift build` 不是有效验收命令；Android 侧仓库无本地可离线解析的插件元数据（§1.2 第 5 行） | 把命令写死：iOS `xcrun swiftc -typecheck -sdk $(xcrun --sdk iphoneos --show-sdk-path) -target arm64-apple-ios17.0 <sources>`（本轮实测退出码 0）或 `xcodebuild -destination 'generic/platform=iOS'`；Android `./gradlew --offline :wisdom-ui:compileDebugKotlin :wisdom-ui:apiCheck` |
| 4 | **§4.3 门禁"令牌生成一致 `node build.js --check`，每次 PR"在两端仓库不可执行** | `build.js:16-24` 把输入固定为 `wisdomdesign/tokens/wisdom.tokens.json`、输出固定为同级 `../iOS` `../android`，脚本本身只存在于设计仓库；而 `04-architecture.md:28` 承诺"平台仓库的 CI 只校验生成产物与提交一致，**不需要访问设计仓库**" → 两者互斥 | 门禁拆两处：设计仓库负责"生成一致"；平台仓库改成校验生成文件头记录的**令牌版本/哈希**（生成器顺带写入），或由设计仓库 CI 三个 checkout 一起校验 |
| 5 | **B9 的修正清单不完整（4 处，不是 3 处）** | `specs/README.md:38` 写"场景模式里 6 个是「配方」……只有 1 个是正式组件"，但**同一文件** `:36` 写"37 组件 + R1–R5 配方"，`03-patterns.md` 只有 R1–R5（5 个），`02-components.md:77` 也写"其余 5 个是配方" → `specs/README.md:38` 是唯一写"6"的地方且自相矛盾；另外 `build.js:171` 与 `:348` 硬编码了"定稿色卡的十二个色"注释，是 B9-1 的**代码副本**（改 README 与 `01 §3.1` 而不改生成器，"色卡数量"仍写不干净） | 把 `specs/README.md:38` 与 `build.js:171/348` 并入 B9 第一批修正；并把"口径 37+5"作为单一真源写进 `02-components.md`，其余位置引用 |
| 6 | **§3.3「新增 `component.*`」缺少归属规则** | 现状组件常量散在三处：`WDRadius.checkbox=9`、`WDRadius.fab=19`（`WDTokens.swift:139-140`、`WDTokens.kt:204-205`）、`WDSize.checkbox=26`，外加 `motion.component.*`（10 个，未生成）。直接新增 `component.*` 会形成四处并存 | M0 先定归属规则：几何/描边/热区等"组件常量"统一迁 `component.*`，`motion.component.*` 更名为 `motion` 下的一等分组或并入 `component.motion.*`，并明确"哪些允许逐组件覆盖" |

---

## 3. 架构级结论：M1 骨架能否承载 37 组件 + 5 配方

**一句话结论：能承载"令牌消费"，不能承载"组件 API 契约"。** 当前两端各只有 3 个手写源文件（Foundation），零组件、零 CI、零 lint、零截图基线；而 37 组件 + 5 配方要在 5 个里程碑里做出来，**决定返工量的不是组件数量，而是下列 8 个"现在不定就会 37×2 次返工"的形态**。

### 3.1 iOS 端

| # | 现在必须定的形态 | 现状与证据 | 若拖到 M2 之后的代价 |
| --- | --- | --- | --- |
| I1 | `WDTextStyle` 的**最终字段集**：缩放策略 + 行高比 + `letterSpacing` + 字族槽位 | `WDTokenTypes.swift:6-15` 只有 `size/lineHeight/weight`；`:18-20` `.system(size:)` 不缩放；`:22-24` 行高语义错误；`typography.overline` 定义了 `letterSpacing:"0.6"`（tokens:173）但结构体没有槽位、生成器也不读（**B14**） | 37 组件的文字全部经它，任一字段后加 = 生成器 + 全部组件改一遍 |
| I2 | 控件尺寸的**缩放形态** | `WDSize` 是静态 `CGFloat`（`WDTokens.swift:144-163`），`@ScaledMetric` 是 View 环境的属性、塞不进 enum 静态常量（§3.4.2 已指出）；而 AX3 / fontScale 1.3 是 M2 起的验收硬门槛 | 每个控件组件都要改高度取值方式 |
| I3 | **主题注入点**（字族/深色色温/宿主覆盖） | iOS 侧**没有任何 `EnvironmentKey`/`EnvironmentValues` 扩展**（`grep -rn 'EnvironmentKey\|EnvironmentValues' iOS/Sources` → NONE）；`WDColor`/`WDGradient` 是全局静态（`WDTokens.swift:8/78`），`04-architecture.md:74` 明确"无需主题对象" | A1（字体嵌入）与 A2（深色色温）在 iOS 上**没有实现路径**；而 Android 有 `CompositionLocal`（`WDTheme.kt:15-20`）→ 两端覆盖能力结构性不对称（**B20**） |
| I4 | 组件外观的暴露方式 | `04-architecture.md:77` 定"内部用系统 `Button` + 自定义 `ButtonStyle`，并把 style 暴露出去"，但变体命名（`WDButtonVariant`）、尺寸枚举、状态（pressed/disabled/loading/selected）在 `WDTokenTypes.swift` 里都没有契约层 | 37 个组件各写一套 style 命名，M3 公开 API 冻结时集中返工 |

### 3.2 Android 端

| # | 现在必须定的形态 | 现状与证据 | 返工代价 |
| --- | --- | --- | --- |
| A1 | **M3 角色映射清单**（哪些角色归 Wisdom，哪些允许 M3 自管） | `WDTheme.kt:60-84` 只给 10 个角色；`javap` 实测当前 M3 `lightColorScheme` 有 **48 个角色参数**，未指定者取 M3 自带 `ColorLightTokens`/`ColorDarkTokens`；`WDTheme.kt:46-49` 只传 `colorScheme`，未传 typography/shapes → **混用任何 M3 组件（`:288` 明确 M5 保留 M3 DatePicker）都会跳色跳字体**（**B19**） | 每批组件都会遇到"这个 M3 组件颜色不对"，最后集中补映射 = 全部截图基线重录 |
| A2 | 主题是否提供 **typography / shapes** | `WDTheme` 只提供 `colors` + `gradients`（`WDTheme.kt:23-29`）；`WDType`/`WDRadius` 是全局静态 → 宿主与 M3 组件都无法被主题化，A1 的中文字族更无处注入 | 同 I3：字体与圆角策略一变，组件全部受影响 |
| A3 | **动态取色开关**与 `WDColors` 的可构造性 | `wdLightColors`/`wdDarkColors` 是 `internal`（`WDTokens.kt:49/79`），宿主无法自建 `WDColors` → opt-in 动态取色必须由库提供工厂；`WDTheme` 的 object 与 composable 同名（`WDTheme.kt:23/36`），加参数只会改 composable 一侧 | 开放项 3 若拖到实现期，会以"宿主自选"的形式把跨端一致性破掉（§5.1） |
| A4 | 视觉尺寸 vs 命中尺寸的**命名分家** | `WDSize.controlSm = 32.dp`（`WDTokens.kt:210`）与 48dp 热区要求并存，§1.7.4 要求靠 `minimumInteractiveComponentSize` 补齐；当前令牌只有一个 `touchTargetMin`（`:213`，单值 44） | 每个可点组件都要各自处理补齐，且平台差异（44/48）无处表达（**B15**） |

### 3.3 两端共性（契约层，属"现在不定必返工"）

1. **文案注入形态**（`WDLocalization`：key + 参数 + 默认值）必须在 M1 定，且必须落在 Foundation——因为它是**公开 API 签名**的一部分，后加等于 37 组件签名全改（§3.5 / §8.4.4 已提出，本轮确认其"Foundation 层、M0/M1 边界"属性成立）。
2. **`component.*` 常量一次给全**（§2.2-6）：否则 M2–M5 的每个组件都会在两端各挑一个"看起来差不多"的值，然后进 lint 白名单，白名单越滚越大 = B8 复发。
3. **生成器对称性**：现状 iOS 生成 `elevation`、Android 完全不生成（**B13**）；`material.*`（6 个）与 `motion.component.*`（10 个）两端都不生成（**B11/B12**）。这三处不修，M2 的 Card/Button/Checkbox 一开始就得写裸值，与 §4.3 的"字面量 lint"门禁正面冲突。

---

## 4. 新增发现（B11 起，每条附 file:line 证据）

> 以下 11 条均为本轮新发现，均通过读源码/令牌/生成器得到，未依赖文档声称值。

**B11 `material.*` 令牌族（6 个）完全不被生成器消费，玻璃决策没有代码载体。**
`tokens/wisdom.tokens.json:252-259` 定义了 `ultraThin / thin / regular / thick / tinted / sheen`；`build.js` 全文**没有一处读取 `t.material`**（Swift `:150-302`、Kotlin `:306-468` 均无）；生成产物里也只有语义层的两份玻璃：`WDTokens.swift:14-15`（`0.702 / 0.549`、`0.859 / 0.780`）与 `WDTokens.kt:55-56`。
**连带（这是"同值多源"的新实例）**：`material.regular.fillDark = #0C20389E`（tokens:256）而 `semantic.dark.surface.glass = #0A1A288C`（tokens:115）——同一个"玻璃"在令牌文件里有两套深色值，而平台只实现后者。`§3.2` 裁定"玻璃取值以 `material.*` 令牌为准"、`§7.5` 又在争 70% vs 82%，但当前**平台上跑的是第三个数**。→ M0 必须先裁定玻璃的唯一真源，再决定 `material.*` 是否保留。

**B12 `motion.component.*`（10 个组件级动效令牌）不被生成。**
`tokens/wisdom.tokens.json:276` 起定义了 `press-scale 0.97 / checkbox-press 0.9 / checkbox-draw 260 / checkbox-glow 400 / switch-knob 300 / switch-track 260 / progress-easeout 3200 / toast-in 320 / list-stagger 20 / skeleton-shimmer 2200`；`build.js:284-298`（Swift）与 `:453-464`（Kotlin）只生成 `motion.duration.*` 与 `motion.spring.*`。而 M2 首批就是 Button/Checkbox/Switch，M4 是 Toast/Skeleton → 这 10 个值必然被写成裸数值，正好撞 §4.3 的字面量 lint。

**B13 `elevation.*` 只有 iOS 生成，Android 从缺；且深色阴影无令牌。**
`build.js:265-278` 只在 `buildSwift()` 里输出 `WDElevation`（`WDTokens.swift:182-200`），`buildKotlin()` 全文无 `t.elevation` 引用，`WDTokens.kt` 也无任何阴影声明，`api/wisdom-ui.api` 里没有 elevation 入口 → **Android 端 Card / FAB / 浮层的 e1–e3、brand 五档阴影没有任何令牌来源**。另外 `tokens:233` 的 `$description` 写"深色模式退化为黑阴影"，但 `build.js:271` 用 `swiftColorSingle` 生成**单值**颜色（`WDTokens.swift:186-199` 全为 `Color(wd:…)`，不随外观解析）→ 深色阴影策略既无令牌也无实现。

**B14 `typography.overline.letterSpacing = "0.6"` 定义了但两端都不生成，且 `WDTextStyle` 没有该槽位。**
`tokens:173` → `build.js:257-259`（Swift）与 `:444-446`（Kotlin）只取 `fontSize/lineHeight/fontWeight`；`WDTokenTypes.swift:6-15`、`WDTokens.kt:231` 均无 `letterSpacing`。同属"令牌存在但流不到实现"（与 B5/B8 同类，但发生在字阶层）。

**B15 `size.touch-target-min` 是单值 44，两端同值，与 §3.2「iOS ≥44 / Android ≥48」冲突；生成器 schema 无法表达平台差异。**
`tokens:210` `"touch-target-min": { "$value": "44" }` → `WDTokens.swift:148` `44`、`WDTokens.kt:213` `44.dp`；`build.js:237-247` / `:423-433` 对 `size` 分组一律"一值两端"，没有平台分支。这是 §3.2 决议**当前不可落地**的直接证据。

**B16 公开 API 里同名两义：`WDColor.textOnFill` / `textOnSoft`（浅深成对）与 `WDDerived.textOnFill` / `textOnSoft`（单值）。**
`WDTokens.swift:20`（`#0E3A55`/`#DCEEF4`）vs `:56-57`（仅 `#0E3A55`）；`WDTokens.kt:61` vs `:128-129`；`api:26-27` vs `:40-41`。B3 只改语义层，派生层会保持旧值 → "同一个语义名两个值"被写进公开 API，且深色下误用 `WDDerived.textOnFill` 会得到浅色深字。

**B17 原始/派生/中性层的常量被冻结为公开 API，"只用语义层"的纪律与 B1 的"群青降级"都无法用 API 面约束。**
`api:95-107`（`WDPalette`，含 `slate`=`#4C8DAE`）、`api:33-42`（`WDDerived`，含 `fillMid1`=`#4FB0C8`）、`api:78-93`（`WDNeutral`）；生成侧对应 `build.js:348-373`。B1 要"把群青降级为描边/图形专用色"、B4 要改 `#4FB0C8`，但它们是宿主可直接引用的公开常量 → 值改了名字没改，语义约束只能靠文档。建议：这些层改 `internal`（Kotlin）/ `@_spi` 或 package-private（Swift），或至少在 `.api` 里显式声明为"非承诺"。

**B18 `specs/README.md:38` 与同文件 `:36`、`02-components.md:77` 自相矛盾（口径 37+5 的第四个副本）。**
`specs/README.md:36` "37 组件 + R1–R5 配方"、`:38` "6 个是「配方」……只有 1 个是正式组件"、`02-components.md:77` "其余 5 个是配方"、`03-patterns.md` 仅 R1–R5（`:55/137/196/249/307`）。加上 `build.js:171/348` 硬编码"十二个色"，B9 的修正清单应从 3 处扩到 5 处（详见 §2.2-5）。

**B19 `WDTheme` 的 M3 桥接不完整：48 个 M3 角色只映射 10 个，其余取 Material 自带色；且未传 typography/shapes。**
`WDTheme.kt:60-71`（light）与 `:73-84`（dark）各只给 `primary / onPrimary / background / onBackground / surface / onSurface / surfaceVariant / onSurfaceVariant / outline / error` 10 个；`javap` 实测该重载 **48 参**、默认值桥接取自 `androidx.compose.material3.tokens.ColorLightTokens/ColorDarkTokens`；`WDTheme.kt:46-49` 只传 `colorScheme`，而 M3 `MaterialTheme(ColorScheme, Shapes, Typography, content)` → 混用的 M3 组件会用 M3 默认色、默认字体与默认圆角。**这条把开放项 3 的判定条件变成"今天即可静态判定、且必红"。**

**B20 两端覆盖能力不对称：Android 可注入（`CompositionLocal`），iOS 不可注入（无 `EnvironmentKey`）。**
`WDTheme.kt:15-20` 提供 `LocalWDColors` / `LocalWDGradients`；iOS 侧 `grep -rn 'EnvironmentKey\|EnvironmentValues' iOS/Sources` 返回空，颜色只有全局静态（`WDTokens.swift:8-75`），`04-architecture.md:74` 还把它写成设计优点。后果：A1 字族、A2 深色色温、宿主级令牌覆盖这三件事在 iOS 上没有实现入口；跨端"同一套令牌"的能力面对齐失败。

**B21 生成器硬编码跨仓库相对路径，与 `04-architecture` 的 CI 承诺矛盾，门禁不可按文档执行。**
`build.js:16-24`：`ROOT = ../..`、`TOKENS = ROOT/tokens/wisdom.tokens.json`、`OUT_ROOT = ../`、输出写死 `../iOS/...` 与 `../android/...`；而 `04-architecture.md:28` 写"平台仓库的 CI 只校验生成产物与提交一致，不需要访问设计仓库"。脚本本身也不在平台仓库里（`find iOS android -name build.js` 为空），故 §4.3 的"每次 PR 跑 `--check`"在两端仓库无法执行（详见 §2.2-4）。

---

## 5. 平台空白逐条裁定建议

### 5.1 开放项 3（`11-conclusions:187`）：Android Material You 动态取色顶掉品牌蓝

**第一步：问题比第一轮描述的更严重，而且今天就能判定。**
不只是"宿主套 `dynamicLightColorScheme()` 会覆盖品牌蓝"。实测（B19）：`WDTheme` 对 M3 的 48 个角色只给出 10 个，其余取 Material3 自带的 `ColorLightTokens`/`ColorDarkTokens`。也就是说——**宿主完全不接动态取色，跨端一致性此刻也已经不成立**：任何混用的 M3 组件（`03-platform-mapping.md:288` 明确 M5 保留 M3 `DatePicker`）都会渲染 Material 默认色调；`WDTheme` 也没传 typography/shapes，字体与圆角同样会跳。动态取色只是把这个洞扩大成"每台设备都不一样"。

**可验证判定条件（三条，前两条今天即可跑，均为 Android 单测）：**

| 编号 | 判定条件 | 今天的结果 |
| --- | --- | --- |
| **T1** | 在 `WDTheme { }` 内断言 `MaterialTheme.colorScheme` 的 48 个角色中，**凡被 Wisdom 组件或允许混用的 M3 组件读取的角色**，其值必须来自 Wisdom 令牌（反向白名单：不得等于 Material3 `ColorLightTokens`/`ColorDarkTokens` 的对应值） | **必红**：38 个角色未映射（`WDTheme.kt:60-84`） |
| **T2** | 在 `MaterialTheme(colorScheme = dynamicLightColorScheme(context)) { WDTheme { } }` 包裹下重复 T1，并要求 `WDTheme.colors.*` 逐值等于 Wisdom 语义色 | 需修完 T1 才有意义 |
| **T3** | 反向顺序 `WDTheme { MaterialTheme(dynamic…) { 演示组件 } }` 下，Wisdom 组件取色仍全部来自 `WDTheme.colors`（用 lint 或测试断言组件源码不出现 `MaterialTheme.colorScheme`） | 需 lint 规则（§4.3 已规划） |

**实现路径（建议采纳，二选一只能在 M1 前定）：**

- **推荐：默认不接入 + 补全映射。** ①`WDTheme(dynamicColor: Boolean = false)`，默认 `false`——与 `11-conclusions:217`"现在排进 M1 并指定负责人"的要求一致，落地为"明确不接入"这一支；②补全 T1 白名单里所有角色的映射（重点：`primaryContainer / secondary / secondaryContainer / tertiary / surfaceContainer* / surfaceTint / outlineVariant / inverseSurface` 等）；③把 M3 的 `typography`/`shapes` 一并由 `WDType`/`WDRadius` 桥接，否则"混用不跳色"只做了一半。
- **可选 opt-in：** `dynamicColor = true` 时以 `dynamicLightColorScheme(context)` 为基底，但**强制用 Wisdom 品牌角色覆盖** `primary/onPrimary/primaryContainer/onPrimaryContainer/surface/background`（跨端一致性只在品牌角色上保持），并在 KDoc 写明"开启后 37 组件的对比度账目不再保证"。
- **API 前置条件（属 §3 A3）：** `wdLightColors`/`wdDarkColors` 是 `internal`（`WDTokens.kt:49/79`），宿主无法自建 `WDColors` → 若选 opt-in，必须由库提供工厂（或公开只读实例），这个形态要在 M1 前定。

**裁定建议：默认不接入动态取色**（`dynamicColor=false`），并把"48 角色映射 + typography/shapes 桥接"补进 **M0 出口条件**。理由：37 组件的对比度账目、最不利背景断言（§4.1 第 2 条）与六态截图基线都建立在固定令牌上；动态取色让每台设备的合成色不同，断言在结构上无法验证。

### 5.2 开放项 4（`11-conclusions:188`）：iOS 26 系统 chrome 与自绘悬浮 Tab 栏

**第一步：先定基准值，否则两条路都缺参照。**
设计要求"悬浮 Tab 栏高 58 / 距左右 16 / 距底部 8"（`09-layout.md:18`），底部留白算式 `82 = 58 + 8 + 16`（`:21`）建立在其上；而令牌现在是 **56**（`WDTokens.swift:160`、`WDTokens.kt:225`）。**B5 的 56→58 必须与本节同批决策**，否则"系统档 vs 自绘档"连对照基准都没有。

**可验证判定条件（M1 用 iOS 26 SDK 在模拟器/真机跑一次判定表，Showcase 页记录 5 个数）：**

| 编号 | 判定项 | 通过条件 |
| --- | --- | --- |
| **D1** | 系统 Tab 栏**视觉高度**（`GeometryReader` / `onGeometryChange` 量测） | `56 ≤ h ≤ 60`（覆盖"高 58"） |
| **D2** | 系统几何：左右 inset / 距底部安全区 | `≈16` / `≈8` |
| **D3** | 标签字号可由令牌驱动为 `caption2` 11（`§3.2` 决议） | 可通过 Appearance 配置达成；若系统固定为更小字号 → **不通过** |
| **D4** | 选中/未选中色可由令牌驱动（含深色档 `text.tertiary` 达标值） | 可通过 tint/Appearance 达成 |
| **D5** | 系统栏的最小化/收缩行为是否与 `02 §34` 的验收项冲突 | 冲突项可被显式豁免并在规范里写明 |

**判定规则：D1–D4 全通过 → 走 A（复用系统 chrome）；任一项不通过 → 走 B（全版本自绘）。禁止"两套都上"。**

**实现路径：**
- **A：复用系统 chrome（倾向此路）。** 仅 iOS 26+ 用系统 Tab 栏 + 令牌配色；`02 §34` 的尺寸验收**拆两档**——"系统档：形态与系统一致 + 配色/字号符合令牌"；"自绘档（iOS 17–25 与 Android）：高 58 / 左右 16 / 底 8"。好处是保留系统级交互与无障碍，并少维护一套悬浮栏。
- **B：全版本自绘。** 需在 iOS 26+ 用 availability 分支屏蔽系统 chrome（`04-architecture.md:84` 已有 17–25 降级先例可循），并把"iOS 26 也不使用系统 Tab 栏"写进规范，避免后续被单独"优化"回去。
- **影响面与排期：** TabBar 本体在 M5（`11-conclusions:157`），但**决策必须在 M1 出**：M5 的"滚动收缩跟随进度"与底部留白 ≥82 都依赖 Tab 栏形态。若漂到 M5，导航/滚动收缩相关验收要连带返工。

**裁定建议：** M1 内完成 D1–D5 判定表（半天量测 + 半天记录），负责人随 M1 指定；未通过前，`02 §34` 的尺寸验收加注"暂按自绘档执行"。

---

## 6. 对 M0 出口条件与 12–13 周排期的复核意见

### 6.1 M0 = 1.5 周：**不可信（偏低）**，理由是 M0 实际包含 5 类不同性质的工作，其中 3 类是"第一次做"的基础设施

| 类别 | 具体内容 | 证据（现状=从零） | 可估性 |
| --- | --- | --- | --- |
| ① 令牌增删 | `status-text.*` / `component.*` / `scrim` / `size.navbar-large` / `wash` / `gradient.wash.*` / 语义色修正 | 全部 NOT FOUND（§1.2 第 2 行） | **可估**（数值工作） |
| ② 生成器改造 | 行高比；`material.*`（B11）、`motion.component.*`（B12）、`elevation` 平台对齐（B13）、`letterSpacing`（B14）、平台差异表达（B15）、画廊 CSS 块、`contrast-report.md` 输出 | `build.js` 504 行里 0 行断言、0 行报告、Kotlin 侧无 elevation/material/motion.component | **不可估**（新子系统） |
| ③ 断言框架 | alpha 合成 + 渐变逐色标 × 逐 alpha 档采样 + 自动取最不利（§8.2.3 要求算法化） | 两端测试文件里**没有任何对比度断言**（`WDTokensTests.swift` 4 个测试、`WDTokensTest.kt` 5 个测试，全部是阶梯单调/可解析类） | **不可估**，且算法本身要先定口径（浅色取最深色标 / 深色取最亮色标，`§8.2.3`） |
| ④ 文档重写 | `03-platform-mapping.md` 全文（314 行，绿色品牌/旧路径/`Wd*` 命名）→ 必须逐一对照两端生成产物核对 | `03-platform-mapping.md:41/42/159`、`:12-16` | **可估但被低估**：不是改文字，是重新对账 |
| ⑤ 两端 lint + CI | SwiftLint 自定义规则 / ktlint+detekt，命中裸 hex / 裸数值即失败；三仓库 CI | `find` 实测：**两端无任何 lint 配置、三仓库无 `.github`** | **不可估**（首次搭建，且要先定白名单） |

**因此 §4.1 的 9 条出口条件里，第 2、6、7 条依赖 ②③，第 9 条依赖 ②（`build.js:171/348` 也要改），而 §4.3 的"字面量 lint"与"账目生成化"本身就是从零新建。** 设计侧自估 6 天（§8.4.2）只覆盖了①与④的一部分；两端实现方还要跟着改②③⑤，且**这些工作没有归属人**（§4.2 只说"1 iOS + 1 Android + 0.5 设计"）——若由两端各自实现，会做出两份不同的断言实现，正是要防的账目漂移。

**复核意见（二选一，需队长裁定）：**
- **(a) 按 §8.4.2 削范围**：M0 = "改令牌 + 生成器 + 断言 + 文档"（①②③④），把 ⑤ 与"两端接入 `WDTextStyle` 落地"放 M1，M0 定 **2 周**；这与 `§3.5`"M0 只定形态"和 `§8.4.2`"确认冻结挪到 M1"完全自洽。
- **(b) 维持 9 条全做**：M0 定 **2–2.5 周**（①–⑤ 全做），且必须新增"平台差异表达 / material 唯一真源 / M3 角色映射"三项前置决策，否则出口条件自相矛盾（B11、B15、B19）。

**无论选哪支，"1.5 周"只有在把 ⑤ 与两端接入移出 M0 时才成立。**

### 6.2 M1 = 1 周：**偏紧**

M1 出口是"两端 Showcase 页 + 浅/深 × 常规/AX3 × LTR/RTL **六态**截图入库 + `WDTextStyle` 确认冻结"。其中：六态截图基线在两端都是从零搭（快照框架、基线目录、CI 接入），且 `§5 开放项 8`（`.lineSpacing` 换算 vs `NSParagraphStyle`）要在这 1 周内**实测出结论**——这是"先验证再冻结"的正确顺序（§8.4.2），但它与截图基建争同一周。建议 M1 = 1.5 周，或把"确认冻结 `WDTextStyle`"再往后挪到 M1 出口的后半段单独 gate。

### 6.3 M2–M5 各 2 周：**相对可信**，但有一个硬前置条件

有规格契约（`specs/01–03` 可勾选验收项）与两端并行先例，2 周/批的估时量级可接受。但**若 `component.*` 与 `motion.component.*` 没在 M0 一次给全（§2.2-6、B12），M2–M5 会进入"每个组件在两端各挑一个值 + 逐个进 lint 白名单"的循环**——这是把 12–13 周推到 16–18 周最现实的路径，且症状（两端视觉重量漂移）要到 M5 才集中爆发。`11-conclusions:93` 已把"37 规格 × 3 画廊各改多遍"列为要避免的事，本条是同一类风险在组件层的复现。

### 6.4 排期结论

- **M0 范围与工期必须同时改**：`1.5 周 + 9 条全做 + 新增令牌体系 + 断言框架 + 三仓库 CI` 这四项不可能同时成立。建议按 6.1(a) 削范围（M0 2 周），或 6.1(b) 显式追加 0.5–1 周。
- **总排期 12–13 周在 6.1(a) 路径下仍可达**（M0 增量由 M1 预研成果抵消的口径不变）；在 6.1(b) 路径下，总排期应改记 **13–14 周**。
- **必须在 M0 前补的两项管理动作**：①把 `10-discussion.md` / `11-conclusions.md` / README 指针**提交入库**（§1.4-1）——否则"决议已落地"没有可审计的 diff 基线；②为 §3.2 的"生成器/断言/CI"三块共享工作**指定唯一归属**，避免两端各自实现。

---

## 7. 未决问题

**必须在 M0 前有答案（阻塞项）**

1. **玻璃的唯一真源**：`material.*`（6 个，未生成，`fillDark #0C20389E`）与 `semantic.surface.glass*`（已生成，深色 `#0A1A288C`）两套值谁为准？`§3.2` 说以 `material.*` 为准，但平台跑的是语义层（B11）。相关：`06-accessibility.md:161` 的 82% 规则是否继续保留。
2. **平台差异令牌的表达方式**：`size.touch-target-min` 44 vs 48 是最小用例（B15）。方案候选：① DTCG `$extensions` 加 per-platform 值；② 拆成 `size.touch-target-min.ios/.android`；③ 平台侧各留一份覆盖表。三种对生成器与 `--check` 的影响不同，需先定。
3. **`WDColors` 字段名册冻结**：它是 27 参 public 类（`WDTokens.kt:19-47`、`api:1-31`），每加一个令牌都是公开 API 变更。M0 要在动手前把"新增后共几个字段、分几个命名空间"写死，否则 `apiDump` 会反复变。
4. **M3 角色映射清单**（B19）：48 个角色里，哪些归 Wisdom、哪些允许 M3 自管、哪些必须禁用（品牌相关）——这是开放项 3 的落地前置（§5.1 T1 白名单就是这张表）。
5. **iOS 主题注入点形态**（B20/I3）：A1 字族与 A2 深色色温在 iOS 上需要 `EnvironmentKey` 或等价机制；一旦引入，37 组件的取色/取字方式是否要统一改成环境读取，需在 M0 定。

**可以留到 M1 / 实现期（但需登记负责人）**

6. `motion.component.*` 的生成形态：10 个值里有比例（0.97）、时长（ms）、次数（list-stagger 20 是 ms 还是 count？）— 单位与两端命名规则要先定（B12）。
7. `elevation` 的平台对齐与深色阴影策略：Android 用 `Modifier.shadow` 的 `ambientColor/spotColor` 还是层叠 `Surface`；深色是否真的"退化为黑阴影"（现在既无令牌也无实现，B13）。
8. 视觉尺寸与命中尺寸的命名分家（A4）：是否需要 `component.hit-target.*` 与 `component.visual.*` 两组。
9. 画廊 `--g-*` 的 `--check` 粒度（§2.2-2）：整块文件 vs 白名单段。
10. iOS 26 Tab 栏判定表（§5.2 D1–D5）的执行人与设备（模拟器版本 / 真机型号）。
11. 三仓库 CI 的 `--check` 分发方式（§2.2-4 / B21）：生成文件头写令牌哈希，还是设计仓库单点校验三个 checkout。
12. `letterSpacing` 的落地范围（B14）：只有 `overline` 有值，还是完整字阶都要补？`WDTextStyle` 两端都要加槽位。
13. **未验证项声明**：本环境下 SwiftPM 与 Gradle 均被沙箱阻断（§1.2 第 4/5 行），因此"Android 能编译""`apiCheck` 通过"两条**本轮没有直接证据**；iOS Foundation 已用 `swiftc -typecheck -target arm64-apple-ios17.0` 实测通过（退出码 0）。建议 M0 出口把这两条命令写死（§2.2-3），由能跑 CI 的环境补证。

---

← 返回：[设计评审结论](11-conclusions.md) ｜ [讨论纪要](10-discussion.md) ｜ [组件规格索引](specs/README.md) ｜ [工程架构](04-architecture.md)
