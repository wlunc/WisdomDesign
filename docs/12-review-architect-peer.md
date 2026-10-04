# 12-P · 第二轮评审 · 对《架构师复核意见》的独立交叉复核

> 复核人：**独立核验工程师**（不采信被复核文档的任何结论、任何数字）
> 复核对象：[`12-review-architect.md`](12-review-architect.md)（284 行）
> 复核规则：本文出现的每个数字都是我**本会话重跑命令 / 重读源码 / 自写脚本**得到的；被复核文档的数字只作为"被审对象"出现，**不作为证据**。
> 基线快照（我实测 `git rev-parse` / `git status`，**2026-10-04 13:07 CST**）：iOS `316b75f`、android `524f5d6`、wisdomdesign `e495147`；`git status --porcelain` → iOS **0 行**、android **0 行**、wisdomdesign **6 行**（` M README.md` + 5 个未入库文档）。
> 环境限制（我实测复现，结论与架构师一致）：SwiftPM 与 Gradle 在本会话沙箱下均无法运行，详见 §4「无法验证项清单」。
> 复算脚本口径：WCAG 2.1 相对亮度（sRGB 线性化 + 0.2126/0.7152/0.0722），全表见附录 A。

---

## 1. 逐条判定表

判定取值：**成立** / **部分成立** / **不成立** / **无法验证**。「证据」列全部是可复跑的命令或 file:line。

### 1.1 §1 复核范围与方法（架构师 §1.2 / §1.3 / §1.4）

| 编号 | 架构师声称 | 我的判定 | 独立证据 |
| --- | --- | --- | --- |
| §1.2-1 | `node build.js --check` 通过、退出码 0 | **成立** | `node wisdomdesign/tools/token-build/build.js --check` → 2 行 `✓`，`EXIT=0` |
| §1.2-2 | 令牌叶子 168；`wash`/`status-text`/`scrim`/`navbar-large` 均缺失；`component` 仅命中 `motion.component.*`(10)；`color.named` = 9 | **成立** | 自写递归 `$value` 统计：总叶子 **168**；`wash`/`status-text`/`scrim`/`navbar-large` 命中 **0**；含 `component` 的叶子 **10**（全部在 `motion.component.*`）；`color.named` = **9** |
| §1.2-3 | `xcrun swiftc -typecheck -target arm64-apple-ios17.0` 退出码 0 | **成立（但命令不完整）** | 原样执行 → `EXIT=1`（`error opening '.../clang/ModuleCache/...swiftmodule' for output: Operation not permitted`）；加 `-module-cache-path <可写目录>` 后 → **`EXIT=0`**。见 §2-C2 |
| §1.2-4 | `swift build` 不可执行（sandbox-exec / `org.swift.swiftpm` 不可写） | **成立** | 复现：`sandbox-exec: sandbox_apply: Operation not permitted`，另有 3 条 `.../Library/org.swift.swiftpm... not accessible or not writable`。另：即使换 `CLANG_MODULE_CACHE_PATH` 也仍在 **manifest 编译**阶段失败 |
| §1.2-5 | Gradle 三条路均不可执行 | **成立** | ① `./gradlew --offline :wisdom-ui:apiCheck` → `gradle-8.14.5-bin.zip.lck (Operation not permitted)`，exit 1；② 直连已解压 dist → `Could not initialize native services / Failed to load native library 'libnative-platform.dylib'`，exit 1。第二、三条（`GRADLE_RO_DEP_CACHE`、插件元数据离线不可解析）我未重跑，归入 §4 未验证 |
| §1.2-6 | `javap`：`lightColorScheme/darkColorScheme` 48 参、默认值取自 M3 `ColorLightTokens/ColorDarkTokens`；`MaterialTheme(ColorScheme, Shapes, Typography, content)` | **成立（并被我加强）** | 从 BOM 解析出的 `material3-android:1.4.0` AAR 解出 `classes.jar`：`javap` 显示 `lightColorScheme-_VG5OTI` 有 **48** 个 `long` 形参；`javap -c` 的 `$default` 里 `ColorLightTokens` 引用 **141** 处（dark 侧 `ColorDarkTokens` 141 处）。**补强**：同文件还有 36 参与 29 参两个重载，均带 `kotlin.Deprecated(level=HIDDEN, "Maintained for binary compatibility…")`，只有 48 参那个非 deprecate → 只有它会被 Kotlin 源码解析到。见 §2-C3 |
| §1.2-7 | 工作区：iOS 0 行、android 0 行、wisdomdesign 3 行 | **部分成立（结论不变）** | 我第一次 `git status` 实测 wisdomdesign **4 行**、复核结束时 **6 行**（`12-review-architect.md`、`13-review-designer.md`、`14-review-techlead-round2.md` 均为本会话并发产出）。**架构师当时 3 行的记录无法回溯验证，但"10/11 未入库"这一实质结论我完全复现**：`docs/10-discussion.md`、`docs/11-conclusions.md` 至今仍是 `??` |
| §1.2-8 | 三仓库无任何 lint 配置、无 `.github` | **成立** | `find`（`.swiftlint*`/`detekt*`/`.editorconfig`/`.github`/`*.yml`）在三仓库**零命中**；`ls -d iOS/.github android/.github wisdomdesign/.github` 三者均 No such file |
| §1.3 | 10 组对比度复算全部吻合 | **成立** | 我独立复算 **27 个**对比度值（含架构师 §1.3 的 10 组 + §8 的 17 个），**逐个吻合，无一例外**，见附录 A |
| §1.4-1 | 工作区不干净，M0 前应先提交 10/11 与 README 指针 | **成立（且比声称更严重）** | 见 §3-A-M2：android 仓库的基线提交里**已被提交**了 2 个 JVM 崩溃日志，而 `git status` 干净 → "工作区干净"这一检查方法本身会漏掉已入库垃圾 |
| §1.4-2 | iOS/android 零落地、最后一次提交都是 M1 令牌层 | **成立** | `git -C android log --oneline -3` 顶端 `524f5d6 refactor(tokens): 渐变归位到 semantic…`；两端 `status --porcelain` 均 0 行 |
| §1.4-3 | `.api` 与源码静态比对一致（27 参 ↔ 27 getter） | **成立** | 自写计数：`wisdom-ui.api:3` 构造器 `J` 计数 = **27**；`api:4-30` 的 `WDColors` getter = **27**；全文件 `fun get*` = **120**（架构师写作"118 个 `get*` 条目"，我数不出这个数，按其"另有 118"的表述无法复现，属低severity措辞问题） |

### 1.2 §2.1 对第一轮结论的复核

| 编号 | 我的判定 | 独立证据（我重跑命中的位置） |
| --- | --- | --- |
| B1–B4 | **成立** | 对比度复算吻合（附录 A）；`tokens:123` `semantic.dark.text.on-fill = #DCEEF4`；`tokens:49` `gradient.mid = linear-gradient(135deg,#4FB0C8 …)`；生成产物同步值：`WDTokens.swift:20/96`、`WDTokens.kt:91/168` |
| B5 | **成立** | `tokens:226` `tabbar-height = "56"`；生成侧 `WDTokens.swift:160` `56`、`WDTokens.kt:225` `56.dp`；`09-layout.md:18` 「高 58」、`:21` 算式 `82 = 58 + 8 + 16` |
| B6 | **成立** | `WDTokenTypes.swift:18-20` 仍是 `.system(size: size, weight: weight)`；`:22-24` 仍是 `max(0, lineHeight - size)` |
| B7 | **成立** | `03-platform-mapping.md:41/42/159` 仍为 `#2F7F63`/`#E0F0E8`；`:12-16` 仍是 `ios/Sources/…` 与 `com/wisdom/ui/` 旧布局 |
| B8 | **成立** | 令牌文件中 `component` 只有 `motion.component.*`（10 个）；`WDRadius.checkbox/fab`（`WDTokens.swift:139-140`、`WDTokens.kt:204-205`）与 `WDSize.checkbox`（`:149`/`:214`）散在其他命名空间 |
| B9-1 / B9-6 | **成立（清单仍不足，见 A-M9）** | `color.named` = 9（我实测）而 `README.md:24` 写「十二个色」；`05-preview-and-theme.md:36` 要求 `preview-cases/*.yaml`，`wisdomdesign/docs/preview-cases` 不存在 |
| B10 | **成立** | 复算 `#5B7784/#F1F8FA = 4.43`、`#839EB0/#465F6C = 2.40`、`#4C616D/#F1F8FA = 6.04`；令牌仍是 `#5B7784`（`tokens:71`）/`#839EB0`（`tokens:121`） |
| §3.2 触控热区 | **成立（但现状零落地）** | `06-accessibility.md:26` 「iOS 44pt / Android 48dp」、`:239` 同；`tokens:210` `touch-target-min = "44"`、`WDTokens.kt:213` `44.dp`。**边界条件**：全仓库 grep `touchTargetMin` 只命中 2 处**生成定义本身**（`WDTokens.swift:148`、`WDTokens.kt:213`），零消费者 → 冲突目前是规格级、不是代码级，见 §2-C4 |
| §3.3 新增令牌 | **成立** | `status-text`/`scrim`/`navbar-large`/`wash` 在 168 个叶子里命中 0 |
| §4.1 第 7/8 条 | **成立** | `wisdom-light.html:1423` 仍是 `opacity:.55`；`:1380` `--wd-wash:` 单份定义（硬编码 `color-mix(...#B0D5DF 66%...)`），`:1394` `#wd-board.wd-dark{color-scheme:dark}` 只切 `color-scheme`；`06-accessibility.md:161` 仍是 `glass-strong`（82%+）；`01-foundation.md:284` 仍是「导航栏 62%、Tab 栏 62%、浮层 82%」 |
| §8.4.1 / §8.4.2 | **成立** | `build.js` 504 行全文无 `contrast`、无 `contrast.json`、无画廊 CSS 输出（我对该文件逐行读完） |
| §8.5 两条平台空白 | **成立** | Android 侧 `WDTheme.kt:60-71`（light）/`:73-84`（dark）各只给 **10** 个角色；iOS 侧 `grep -rn 'EnvironmentKey\|EnvironmentValues' iOS/Sources` → **NONE** |

**§2.1 复核结论：我确认架构师"B1–B10 与 §3/§4 主要判断本轮无'不成立'项"这一判断。** 第一轮账目确实可继承。

### 1.3 §2.2 需修正 6 条

| 编号 | 修正对象 | 我的判定 | 独立证据与我的差异 |
| --- | --- | --- | --- |
| §2.2-1 | M0 出口条件缺 Android `.api` 更新；冻结首次执行应提前到 M0 | **成立** | 机制逐条核实：`android/build.gradle.kts` 应用 `alias(libs.plugins.binary.compatibility)` 且 `apiValidation { validationDisabled = false }`；`wisdom-ui/build.gradle.kts` 开 `explicitApi()`；`WDColors` 是 public 27 参类（`WDTokens.kt:19-47`）；`11-conclusions.md:138-146` 的 9 条出口条件确无 `.api`，而 `:169` 把「公开 API 冻结」排在 M3、`:177` 执行顺序里虽有 `apiDump` 但未进出口条件 → 静态推演必然成立。**但范围要扩**：M0 变更会改的公开 API 不止 `WDColors`，见 §3-A-M6 |
| §2.2-2 | §4.1-6 与 §3.3-画廊定位「互斥」 | **部分成立（措辞过强）** | 两处引文我逐字命中（`11-conclusions.md:143` / `:88`）。但"互斥"不成立：三份画廊的 `--g-*` **各自集中在单选择器下的一个连续块**——`#wd-gallery`（`wisdom-components.html` 定义 35 行，1544–1578）、`#wd-gal2`（36 行，1543–1578）、`#wd-gal3`（29 行，1543–1571）→ 只把这一块交给生成器即可，机制上可解。这是**范围未定义**，不是硬冲突。见 §2-C1 |
| §2.2-3 | 「两端能编译」不可执行 | **部分成立** | `11-conclusions.md:140` 该条确只有一句话；但**同一文档 `:168` 已给出命令**（iOS `swift build` / `xcodebuild`，Android `:wisdom-ui:assembleDebug`）→ "没有命令"不成立，真正缺陷是**命令不合规**：`swift build` 在本环境连 manifest 都编不过（我实测），而架构师建议写死的 `xcrun swiftc -typecheck …` 原样执行也会 exit 1（缺 `-module-cache-path`）。见 §2-C2 |
| §2.2-4 | §4.3 门禁在两端仓库不可执行，与 `04-architecture.md:28` 矛盾 | **成立** | `build.js:16-24` 把 `ROOT`/`TOKENS`/`OUT_ROOT` 与两个输出路径全部写死为设计仓库相对路径；`04-architecture.md:28` 原文「平台仓库的 CI 只校验「生成产物与提交一致」，不需要访问设计仓库」；`find iOS android -name build.js` 为空 |
| §2.2-5 | B9 修正清单不止 3 处 | **部分成立（架构师仍漏 1 处）** | 架构师补的 4 处我全部复核命中（`specs/README.md:38`、`specs/README.md:36`、`02-components.md:77`、`build.js:171/348`）。但 `specs/03-patterns.md:11` 也写「7 个场景模式…其余 **6** 个」，与裁定口径「37 组件 + 5 配方」冲突，且它是**配方规格本体的开篇**。见 §3-A-M9 |
| §2.2-6 | §3.3 新增 `component.*` 缺归属规则 | **成立** | 现状组件常量确散在三处：`WDRadius.checkbox = 9`、`WDRadius.fab = 19`（`WDTokens.swift:139-140`、`WDTokens.kt:204-205`）、`WDSize.checkbox = 26`（`:149`/`:214`），外加 10 个未生成的 `motion.component.*` |

### 1.4 §3 架构级结论

| 编号 | 我的判定 | 独立证据 |
| --- | --- | --- |
| I1 `WDTextStyle` 字段集 | **成立** | `WDTokenTypes.swift:6-15` 只有 `size/lineHeight/weight`；`tokens:173` `overline` 带 `letterSpacing:"0.6"` 而生成器两端都不读它（`build.js:257-259`、`:444-446` 只取 fontSize/lineHeight/fontWeight）→ 槽位确实缺失 |
| I2 控件尺寸缩放形态 | **成立** | `WDTokens.swift:144-163` 全是静态 `CGFloat`；`WDTextStyle.font` 是 `Font` 而非 `@ScaledMetric` 可承载的形态 |
| I3 iOS 主题注入点 | **成立** | `grep -rn 'EnvironmentKey\|EnvironmentValues' iOS/Sources` → 空；`WDTokens.swift:8/78` 是全局静态命名空间；`04-architecture.md:74` 原文「无需主题对象，`Color` 自带深浅色」 |
| I4 组件外观暴露方式 | **成立** | `04-architecture.md:77` 承诺「内部用系统 `Button` + 自定义 `ButtonStyle`，同时把 style 暴露出去」；两端 `Foundation` 内无任何变体/尺寸/状态枚举 |
| A1 M3 角色映射清单 | **成立（并被我加强）** | 见 B19/C3。另 `03-platform-mapping.md:288` 确写「日期选择 … 保留各自原生控件」且 Android 列写 `M3 DatePicker` |
| A2 主题是否提供 typography/shapes | **成立** | `WDTheme.kt:23-29` 只有 `colors`/`gradients`；`:46-49` 只传 `colorScheme`；`WDType`/`WDRadius` 是全局 `object` |
| A3 动态取色与 `WDColors` 可构造性 | **成立** | `WDTokens.kt:49`/`:79` `internal val wdLightColors`/`wdDarkColors` 实测为 `internal`（`.api` 中确实没有它们）；`WDTheme.kt:23` object 与 `:36` composable 同名 |
| A4 视觉/命中尺寸命名分家 | **部分成立** | `WDSize.controlSm = 32.dp`（`WDTokens.kt:210`）与 `touchTargetMin = 44.dp`（`:213`）并存、`10-discussion.md:246` 要求靠 `minimumInteractiveComponentSize`/`sizeIn` 补到 48dp —— 事实层面成立；但「现在不定就会 37×2 次返工」被高估：`touchTargetMin` 目前零消费者（两端 grep 仅命中生成定义），返工面是"未来 37 个组件各自处理"，不是"已有 37 处待改" |
| §3.3-1 文案注入 | **成立** | `10-discussion.md:1128`（§8.4.4）与 `:553`（§3.5.1）确已提出，且明确"决定 37 个组件的 API 形态" |
| §3.3-2 `component.*` 一次给全 | **成立** | 同 §2.2-6 |
| §3.3-3 生成器对称性 | **部分成立** | `elevation`/`material`/`motion.component` 的不对称我全部复现（B11/B12/B13）。**但漏了一族**：`typography.family.*`（2 个令牌）两端都不生成，见 §3-A-M3；`motion.spring.*` 则是"两端都生成、但消费的参数集不同"，见 §3-A-M4 |

### 1.5 §4 新增发现 B11–B21（覆盖 11/11）

| 编号 | 我的判定 | 独立证据（全部我重跑/重读得到） |
| --- | --- | --- |
| **B11** `material.*` 不被生成 | **成立（边界需收窄）** | `grep -n "material\|elevation\|component" build.js` 的**全部**命中只有 2 行：`:267`（`t.elevation`）与 `:328`（注释里的 `componentN`）→ `t.material` 确实一次都没被读；`tokens:252-259` 定义 6 个；产物里只有 `WDTokens.swift:14-15` 与 `WDTokens.kt:55-56`。深色两套值实测：`tokens:256` `regular.fillDark = #0C20389E`（RGB 12,32,56，α=158/255=0.620）vs `tokens:115` `semantic.dark.surface.glass = #0A1A288C`（RGB 10,26,40，α=140/255=0.549）→ **两套深色值成立**。**边界条件（架构师未写）**：浅色端 `material.regular.fillLight = #FFFFFFB3` 与 `semantic.light.surface.glass = #FFFFFFB3` **完全同值**，`material.thick.fillLight = #FFFFFFDB` 与 `glass-strong = #FFFFFFDB` 亦同值 → "同值多源"在浅色端是**假性冲突**，只有深色端是真冲突 |
| **B12** `motion.component.*` 不被生成 | **成立** | `tokens:276-287` 实测 10 个叶子；`build.js:284-287`/`:290-297`（Swift）与 `:453-456`/`:458-463`（Kotlin）只遍历 `t.motion.duration` 与 `t.motion.spring`；产物 `WDTokens.swift:203-217`、`WDTokens.kt:249-259` 中确实无这 10 个值 |
| **B13** `elevation` 只 iOS 生成 | **成立** | `build.js:265-278` 的 `WDElevation` 只在 `buildSwift()` 内；`buildKotlin()` 全文无 `t.elevation`（该函数 `:306-468` 我逐行读过）；`WDTokens.kt` 全文无阴影声明（259 行逐行读过）；`wisdom-ui.api` 中无 elevation 类（15 个公开类我逐个列出，无阴影类型）。`:271` 用 `swiftColorSingle` → `WDTokens.swift:186-199` 全为单值 `Color(wd:…)`，不随外观解析 |
| **B14** `overline.letterSpacing` 流失 | **成立** | `tokens:173` 有 `"letterSpacing": "0.6"`；`build.js:257-259` / `:444-446` 只取三个字段；`WDTokenTypes.swift:6-15`、`WDTokens.kt:231` 的结构确无该槽位。**补充**：全文件只有 `overline` 一个字阶带 `letterSpacing`（我遍历 `t.typography` 确认），所以 §7-12「是否完整字阶都要补」这一问是真实的开放项 |
| **B15** `touch-target-min` 单值 44 | **成立（含边界条件）** | `tokens:210` = `"44"`；`WDTokens.swift:148` = 44、`WDTokens.kt:213` = 44.dp；`build.js:237-247`/`:423-433` 对 `size` 分组一律"一值两端"，无平台分支（我对 `t.size` 的 8 个键逐个走了一遍生成路径）。**边界条件**：该令牌两端零消费者 → 当前是规格不可落地，不是既有代码不可修，见 §2-C4 |
| **B16** 同名两义 | **成立** | `WDTokens.swift:20` `textOnFill = Color(wdLight: 0x0E3A55, dark: 0xDCEEF4)` vs `:56-57` `WDColor.Derived.textOnSoft/textOnFill` 为单值 `0x123F5C`/`0x0E3A55`；`WDTokens.kt:61` vs `:128-129` 同构；`wisdom-ui.api:26-27` vs `:40-41` 同名成对出现。**补充**：iOS 侧因嵌套类型，误用形态是 `WDColor.Derived.textOnFill`（读起来更像"官方派生色"），比 Kotlin 侧更易踩 |
| **B17** 原始/派生层被冻成公开 API | **成立** | `wisdom-ui.api:95-107`（`WDPalette`，含 `getSlate`）、`:33-42`（`WDDerived`，含 `getFillMid1`）、`:78-93`（`WDNeutral`）均为 `public`；生成侧 `build.js:348-373` 无任何可见性降级；两端均无 lint 阻止宿主直接引用 |
| **B18** `specs/README.md:38` 与其他副本矛盾 | **部分成立** | `:36`（「37 组件 + R1–R5 配方」）与 `:38`（「6 个是「配方」…只有 1 个是正式组件」）我逐行确认；`02-components.md:77`（「只有 1 个是组件，其余 5 个是配方」）确认；`03-patterns.md` 只到 R1–R5（标题行 55/137/196/249/307）确认。**但"`:38` 是唯一写 6 的地方"不成立**：`specs/03-patterns.md:11` 同样写「其余 **6** 个」。见 §3-A-M9 |
| **B19** `WDTheme` 只映射 10/48 角色 | **成立（我给出更强证据）** | `WDTheme.kt:60-71` 与 `:73-84` 各 10 个命名参数（我逐个计数）；M3 1.4.0 的 48 参重载 + 非 deprecate 唯一性 + 默认值来自 `ColorLightTokens/ColorDarkTokens`（见 §2-C3）；`:46-49` 只传 `colorScheme`。**遗留**：架构师说的"必红"是静态推论，我没有运行环境实测，见 §4 |
| **B20** 两端覆盖能力不对称 | **成立** | `WDTheme.kt:15-16`/`:19-20` 提供 `LocalWDColors`/`LocalWDGradients`；`grep -rn 'EnvironmentKey\|EnvironmentValues' iOS/Sources` → **NONE**；`WDTokens.swift:8`（`enum WDColor`）与 `:78`（`enum WDGradient`）都是全局静态 |
| **B21** 生成器硬编码跨仓库路径 | **成立** | `build.js:16-24` 逐行确认；`04-architecture.md:28` 原文确认；`find iOS android -name build.js` 为空 |

### 1.6 §5 平台空白判定条件

| 编号 | 我的判定 | 说明 |
| --- | --- | --- |
| T1（反向白名单断言） | **部分成立** | 其"必红"的**静态前提**成立（38 个角色未映射：48 − 10，我实测两侧数字）；但断言本身**无法执行**（Gradle 不可用），"必红"是推论而非实测。判定条件写法本身可用 |
| T2 / T3 | **无法验证** | T2 依赖 T1 修完后才有意义（架构师自己也写了）；T3 依赖尚不存在的 lint 规则（`build.js` 无 lint、三仓库无 lint 配置） |
| D1–D5（iOS 26 Tab 栏） | **无法验证** | 需 iOS 26 真机/模拟器量测，本会话无此环境；其中 D3「系统字号可由令牌驱动为 `caption2` 11」在 iOS 26 系统 chrome 上是否可配，我没有任何可查证的材料。架构师把"未通过前 `02 §34` 暂按自绘档执行"作为兜底，方向正确 |
| §5.2 基准值需与 B5 同批 | **成立** | `tokens:226` = 56 与 `09-layout.md:18` = 58 的 2pt 物理差我复现；`09-layout.md:21` 的算式确建立在其上 |

### 1.7 §6 排期与出口条件复核

| 编号 | 我的判定 | 说明 |
| --- | --- | --- |
| §6.1「M0 = 1.5 周不可信」的**事实依据** | **成立** | 我逐条复现：`build.js` 504 行内 0 处断言/报告/画廊输出；两端测试只有 `WDTokensTests.swift` **4** 个 `@Test`、`WDTokensTest.kt` **5** 个 `@Test`，全部是阶梯单调/可解析类，**无任何对比度断言**；三仓库 0 lint、0 `.github` —— ②③⑤ 从零这一判断有据 |
| §6.1「不可信」这一**结论本身** | **部分成立 / 不可测** | 工期合理性属估价判断，无客观判据；但"1.5 周 + 9 条全做 + 新增令牌体系 + 断言框架 + 三仓库 CI 四项不可能同时成立"这一逻辑推论我认可（互斥项均可核实）。**我的补充**：架构师 (a)(b) 两支方案都未计入 §3 的 A-M1/A-M2 两条修订工作量 |
| §6.2「M1 = 1 周偏紧」 | **部分成立 / 不可测** | 六态截图基线从零这一事实成立（两端无任何截图/快照产物，`find` 零命中）；"偏紧"是估价 |
| §6.3「M2–M5 各 2 周相对可信」 | **部分成立 / 不可测** | 有规格契约（`specs/01-basic.md` 1941 行、`02-advanced.md` 1642 行、`03-patterns.md` 492 行，每组件 12 节模板）这一事实成立 |
| §6.4 排期结论 | **不可测（判断项）** | 与 §6.1 同源 |
| §7 未决问题 1–13 | **12 条成立、1 条需扩** | 1（玻璃唯一真源）实测值冲突成立；2（平台差异表达）成立；3（`WDColors` 字段名册）**需扩**：`WDGradients` 5 参 public 构造器同样会被 M0 打穿，见 A-M6；4–12 我逐条找到对应证据（如 12：`letterSpacing` 确实只有 `overline` 有值）；13（未验证项声明）**成立**，我逐条复现了它的环境结论 |

---

## 2. 反驳、边界条件与补强（每条均附反例或更强证据）

### C1（反驳 §2.2-2）：画廊 `--g-*` 与「不承诺实时同步」不是互斥，是**范围未定义**

- 反例（我实测）：三份画廊的 `--g-*` 定义各自集中在**一个选择器下的一个连续块**——
  `wisdom-components.html`：`#wd-gallery{` 下的 35 行定义（1544–1578）；
  `wisdom-advanced.html`：`#wd-gal2{` 下的 36 行（1543–1578）；
  `wisdom-patterns.html`：`#wd-gal3{` 下的 29 行（1543–1571）。
- 也就是说，把"这一块"整块交给生成器、组件示例样式继续滞后，**机制上不需要任何重构**，两句话可以同时成立。`11-conclusions.md:143`（`--g-*` 进 `--check`）与 `:88`（画廊是阶段性产物、不承诺实时同步）**并未互斥**，只是没写"`--check` 管哪一段"。
- 判定：架构师的**建议是对的**（独立变量块整块覆盖），但把它写成"直接冲突/自相矛盾"会误导队长去改决议本身。建议措辞降级为"**范围未定义，需在 M0 明确 `--check` 只覆盖 `--g-*` 定义块**"。

### C2（反驳 §2.2-3 的一半）：§4.3 **已有**验收命令；真正的缺陷是命令在本环境**不合规**，而架构师给的替代命令也不合规

- 反例 1：`11-conclusions.md:140` 那条确实没写命令，但**同一文档 `:168`** 写明了「iOS `swift build` / `xcodebuild`；Android `:wisdom-ui:assembleDebug`」。所以"没有命令"不成立。
- 反例 2（更强，附我实测）：架构师在 `:99` 建议"把命令写死"为
  `xcrun swiftc -typecheck -sdk $(xcrun --sdk iphoneos --show-sdk-path) -target arm64-apple-ios17.0 <sources>`。
  我**原样执行**该形式 → `EXIT=1`：
  `error opening '/var/folders/…/clang/ModuleCache/Swift-….swiftmodule' for output: … Operation not permitted`。
  追加 `-module-cache-path <可写目录>` 后 → `EXIT=0`。
  即：架构师推荐写死的命令**在本环境自身不可执行**；它自己在 §1.2 第 3 行能拿到 exit 0，必然用了别的方式（且文档未记录），复现者按文档抄会失败。
- 判定：结论方向（把命令写死、并给出 iOS 可执行替代）成立；**必须修订**：命令补 `-module-cache-path`（或明确"C 扩展/模块缓存需可写"这一前置），并把"iOS 上 `swift build` 不是有效验收命令"与"本沙箱下 `swift build` 根本跑不到那一步"分开陈述——后者我无法验证，见 §4。

### C3（补强 B19）：我可以把"48 角色、默认值来自 M3 自带色"从"实测到一个重载"加强为"**唯一可解析的重载**"

- 我做的额外工作（架构师没做）：把 `ColorSchemeKt` 的**全部** 6 个 `light/darkColorScheme` 重载列出并查注解：
  - `lightColorScheme-_VG5OTI`：**48** 个 `long` — **无 `Deprecated`**；
  - `lightColorScheme-C-Xl9yA`：36 个 — `kotlin.Deprecated(message="Maintained for binary compatibility. Use overload with additional Fixed roles instead", level=HIDDEN)`；
  - `lightColorScheme-G1PFc-w`：29 个 — `kotlin.Deprecated(… "Use overload with additional surface roles instead", level=HIDDEN)`；
  - `darkColorScheme-*` 三者同构。
- 因为 36/29 参两个是 `DeprecationLevel.HIDDEN`（Kotlin 源码**不可见**），`WDTheme.kt:47` 的 `lightColorScheme(primary = …, …)` 只能解析到 48 参重载 → "未指定的 38 个角色取 M3 自带 `ColorLightTokens`"从"观察到"升级为"唯一可能"。
- 附带确认了架构师用的 jar 版本是对的：`androidx.compose:compose-bom:2026.06.01` 的 POM 把 `material3` 钉在 **1.4.0**、`ui`/`ui-graphics` 钉在 **1.11.4**，与本地缓存里的 `material3-android/1.4.0` 一致（所以 `javap` 对象不是"随手找的一个版本"）。
- 顺带排除了一个假线索（避免误报）：`WDGradient.kt:34` 用的 `LinearGradientShader` 在 1.11.4 与 1.12.1 里**都没有** `ExperimentalGraphicsApi` 注解（该符号在 `ShaderKt` 的常量池里出现 0 次）→ **不会**因缺 opt-in 而编译失败。这条不能作为"Android 编译必红"的证据。

### C4（补强 + 边界条件 B15/A4）：B15 的结论成立，但"冲突"目前是**规格级**，且 Android 侧另有内建兜底

- 我的实测：两端 grep `touchTargetMin` 的命中**只有生成定义本身**（`WDTokens.swift:148`、`WDTokens.kt:213`），没有任何消费者。所以"§3.2 决议当前不可落地"成立，但它**不是**"现有实现与规格冲突"。
- 边界条件：`10-discussion.md:246` 明确 Android 侧靠 `minimumInteractiveComponentSize`/`sizeIn` 补到 48dp——也就是说 Android 的 48dp 要求主要落在 **M3 组件的内建最小交互尺寸**上，而**自绘组件**才必须显式处理。因此"生成器无法表达平台差异"这件事的真实影响面是：**自绘可点组件**（且主要影响 iOS 侧，因为 iOS 没有等价内建机制）。
- 建议：B15 的严重度不应写成"两端都不可落地"，而应写成"令牌层无法表达，缺口集中在自绘组件；平台内建机制只兜住一半"。这会让 M0 的方案选择（DTCG `$extensions` / 拆 `.ios/.android` / 平台覆盖表）有一个更清楚的成本判据。

### C5（补强 §1.3）：被复核文档的**物证质量**高于其自述——我把它的复算面扩大了 2.7 倍仍然全吻合

- 架构师自述复算了 10 组；我独立复算了 **27 个**值（10 组 + 深色色晕三档 + 深色玻璃三档 + 深色色晕候选三档 + `#4C616D` 候选组），**全部吻合到小数点后两位**（附录 A）。
- 我还额外复算了**令牌文件自己 `$description` 里声称的值**（架构师完全没查这一类）：`gradient.destructive`「白字 4.7–5.6」实测 4.69 / 5.61；浅色 `gradient.fill`「配 `text.on-fill` 深字 5.4–6.9」实测 5.40 / 6.92；深色 `gradient.fill`「白字 4.9–6.7」实测 4.86 / 6.54；`derived.fill-light-2`「配 `#0E3A55` 深字 5.4」实测 5.40。
  → **这些描述也全部站得住**（4.86 四舍五入为 4.9）。这是一条**独立于架构师**的正面证据：第一轮账目不仅复算吻合，其就地描述也无虚标。

---

## 3. 遗漏项（架构师未覆盖的架构风险）

### A-M1（高）`specs/README.md` 的组件索引**结构性损坏**：16 个高级组件被插进了「场景配方」表

- 证据（我逐行读完该文件 102 行）：组件索引表从 `:43` 开始，但只列到 `:64`（组件 20），`:65` 直接跳到组件 37；随后 `:67` 起是 `### 场景配方` + 三列表头 `| 编号 | 配方 | 说明 |`（`:71`）+ R1–R5（`:73-77`），紧接着 **`:78-93` 却是四列的组件行**：
  `| 21 | SegmentedControl | P0 | [02-advanced.md](02-advanced.md) |` … 一直到 `| 36 | FAB | P1 | … |`。
- 后果：① 组件索引**缺失 21–36 共 16 个组件**（而 `specs/02-advanced.md` 1642 行里这 16 个规格一个不少，我按 `# 21 ·` … `# 36 ·` 逐个确认存在）；② 表列数 3 vs 4 混排，渲染必然错位；③ 任何人按 `specs/README.md` 核对"36 个组件是否交付"都会漏掉 16 个。
- 为什么这条重要：架构师在同一个文件里只抓到了 `:38` 的**措辞**问题（"6 个配方"），而这里的**结构**问题会直接破坏 M0 出口条件 9「色卡数量与文档描述一致」所属的"文档一致"类工作，也会让 `02-components.md` → `specs/*` 的追溯链断裂。B7/B9 的清单里没有任何一条覆盖它。

### A-M2（高）android 仓库的基线提交里**已被提交**了 1.9 MB JVM 崩溃日志，而"工作区干净"的检查方法看不见它

- 证据：`git -C android ls-files` 命中 `hs_err_pid9500.log` 与 `replay_pid9500.log`；`git -C android log --oneline -1 -- <两个文件>` 二者都指向 **`524f5d6`**——也就是**本次评审的 android 基线提交**。文件大小实测：`hs_err_pid9500.log` **133 KB**、`replay_pid9500.log` **1.87 MB**。
- 内容实证：`hs_err_pid9500.log` 开头为 `A fatal error has been detected by the Java Runtime Environment: Internal Error (assembler_aarch64.hpp:267) … Field too big for insn … JRE version: 17.0.11+7 … bsd-aarch64`。
- 为什么这条正中要害：架构师 §1.4 用 `git status --porcelain` 判定"iOS/android 工作区干净 → 第一轮决议零落地"，这个推论**没错**，但它同时**掩盖**了这两条：android 仓库共 **21** 个受控文件，其中 2 个（约 10%）是崩溃转储。任何"M0 前建立可审计基线"的动作都应先删掉它们，否则 `v1.0.0` 的仓库里会带着 Java 崩溃日志发布。
- 建议：并入 §6.4「M0 前必须补的管理动作」，与"提交 10/11/README 指针"同一批做；并把 `hs_err_pid*.log` / `replay_pid*.log` 加进 `android/.gitignore`（现有 `.gitignore` 共 8 条，实测不含这两类，`git check-ignore` 对二者不命中）。

### A-M3（中）`typography.family.*`（2 个令牌）两端都不生成 —— 而它正是 A1「嵌入中文字体」的直接依赖

- 证据：`tokens:158-161` 定义 `family.sans`/`family.rounded`；`build.js:255`（Swift）与 `:442`（Kotlin）都写着 `if (k.startsWith("$") || k === "family") continue;`；我对两端产物 grep `SF Pro\|Roboto\|MiSans\|family` → **零命中**。
- 为什么是遗漏而非已知项：B11/B12/B13/B14 把"令牌存在但流不到实现"的清单列到 `material.*`(6)、`motion.component.*`(10)、`elevation`(4+品牌)、`overline.letterSpacing`(1)，**唯独漏了这一族**；而 `11-conclusions.md:30` 的 A1 是**已裁定**的（"采用嵌入"），`10-discussion.md:1145` 又建议改成"组件库零字体 + 产品层可选增强"，`10-discussion.md:231` 还要求 iOS 用 `Font.custom("", size:, relativeTo:)`。**字族令牌不生成 = A1 的两条路都没有代码载体**，这与架构师自己给 I1 定的"字族槽位"议题是同一件事的两半。
- 建议：并入 I1（`WDTextStyle` 最终字段集）与 §7-5（iOS 主题注入点），并明确 `family.*` 是"进生成器"还是"显式声明为文档性令牌（不生成、不进 `--check`）"。

### A-M4（中）`motion.spring.*` 两端消费**不同的参数子集**，同一令牌在两端跑出两种弹簧

- 证据：`tokens:272-274` 每个 spring 给**三个**参数（response / dampingFraction / stiffness）；`build.js:293-296`（iOS）只输出 `Animation.spring(response:, dampingFraction:)`——**丢掉 stiffness**；`build.js:458-463`（Kotlin）只输出 `spring<Float>(dampingRatio =, stiffness =)`——**丢掉 response**。
- 量级（自算）：按 SwiftUI `ω = 2π/response`、Compose `ω = √stiffness` 换算自然频率——
  `gentle`：15.71 vs 19.49（差 **1.24×**）；`snappy`：22.44 vs 30.00（差 **1.34×**）；`bouncy`：14.96 vs 17.32（差 **1.16×**）。
- 后果：`10-discussion.md:640`（§4.4 合并风险表的"两端视觉「重量」漂移"行）与 `:261-270`（§1.8 质量门禁）都建立在"同一套令牌"的前提上，但动效是**结构性不一致**的：两端都"有值"，`--check` 也是绿的，只有并排演示才看得出来——正是第一轮反复要防的"两端视觉重量漂移"在时间轴上的复现。架构师 §7-6 只把钱提到了 `motion.component.*` 的单位问题，没提 `motion.spring.*` 的参数集问题。
- 建议：M0 定"spring 的单一真源参数集"（要么令牌改存 `(dampingRatio, frequency)`，要么两端各自从同两个参数推导），并补一条断言：两端生成值的 `ω` 差不超过 5%。

### A-M5（中）Kotlin `WDTextStyle` 是 `public data class`，与生成器自己写下的设计原则**正面矛盾**，且会在 M0 变成 API 破坏

- 证据：`build.js:328` 的注释原文「不用 data class：27 个属性会顺带暴露 copy() 与 componentN()，不是我们想承诺的 API」；而**同一个文件** `:438` 却是 `public data class WDTextStyle(val size: TextUnit, val lineHeight: TextUnit, val weight: FontWeight)`；产物 `WDTokens.kt:231` 同；`.api:161-175` 实测暴露 `component1/component2/component3` + `copy` + `copy$default` + `equals/hashCode/toString`。
- 为什么必须在 M0 前处理：`WDTextStyle` 正是 M0/M1 要**加字段**的类型（I1 的缩放策略/行高比/`letterSpacing`/字族槽位，B14，`10-discussion.md:970`）。`data class` 的 `copy()` 是公开 API 的一部分，**每加一个字段 = 一次公开 API 破坏 + 一次 `apiDump`**；而 iOS 侧 `WDTextStyle` 是手写 `struct`（`WDTokenTypes.swift:6-15`），加字段只是源码级变化。两端 API 纪律因此天然不同步（并与 A-M8 叠加）。
- 建议：M0 把 `WDTextStyle` 从 `data class` 降为 `@Immutable class`（与 `WDColors` 的处理保持一致），或显式承认并冻结 `copy()` 的演进规则。

### A-M6（中）M0 会打穿的公开 API **不止 `WDColors`**：`WDGradients` 的 5 参构造器必然变化

- 证据：`build.js:386-389` 生成 `public class WDGradients(` + 每个渐变一个构造参数（当前 5 个）；`.api:55-63` 实测构造器 `(WDGradientSpec;WDGradientSpec;WDGradientSpec;WDGradientSpec;WDGradientSpec;)V` + 5 个 getter。而 `11-conclusions.md:85` 要求 M0 新增 `gradient.wash.light / dark` 与 `semantic.*.gradient.tint` → `collectGradients()`（`build.js:120-139`）会多出至少 1–3 个条目 → **`WDGradients` 构造器签名必变**。
- 架构师 §7-3 只写「`WDColors` 字段名册冻结」，§2.2-1 也只提 `.api`；把"公开 API 冻结前置"的范围写成只有 `WDColors`，会让 M0 的 `apiDump` 反复返工。
- 顺带（同一处）：`build.js:127` 直接 `dark[name].$value` 解引用，若 M0 只加 `semantic.light.gradient.wash` 而忘了 dark 对应项，生成器会以 `TypeError` 崩溃——而不是给出可读的令牌错误。建议加一条"浅深 gradient 键集必须一致"的显式断言。
- 建议：§7-3 改写为「`WDColors` + `WDGradients` + `WDTextStyle` 三类公开容器的字段名册一次冻结」。

### A-M7（中）跨端**类型名**不一致：iOS 是 `WDColor.Palette/Derived/Neutral` 嵌套类型，Android 是顶层 `WDPalette/WDDerived/WDNeutral`

- 证据：`WDTokens.swift:38`（`public enum Palette`，嵌在 `WDColor` 内）、`:51`（`Derived`）、`:61`（`Neutral`）；`WDTokens.kt:110`（`public object WDPalette`）、`:123`（`WDDerived`）、`:133`（`WDNeutral`）；`.api:95/33/78` 亦为顶层类。
- 冲突文档：`04-architecture.md:57`「**类型前缀统一 `WD`**，两端一致」、`:61-62` 的命名表，以及"两端同名还让文档、设计稿、跨端沟通只需写一个名字"。这三个令牌容器在**类型层**就不满足该承诺（Kotlin 侧无法写出 `WDColor.Palette.slate`）。
- 叠加 B16 后更糟：iOS 侧同一文件里同时存在 `WDColor.textOnFill`（成对）与 `WDColor.Derived.textOnFill`（单值），前缀更长、更像"官方值"，误用概率高于 Kotlin 侧。
- 建议：把 §3.3-2（`component.*` 归属规则）扩为"**令牌命名空间的两端映射表**"，与 B16/B17 同批裁定。

### A-M8（中低）iOS 侧**没有任何公开 API 基线**，§2.2-1 的"冻结提前到 M0"只对 Android 生效

- 证据：`find iOS -not -path '*/.git/*' \( -name '*.api.json' -o -name '*baseline*' -o -name '*.swiftinterface' \)` → **零命中**；`iOS/Package.swift:9-11` 直接以 `products: [.library(name: "WisdomUI", …)]` 导出整个模块；仓库里没有任何 digester 配置。
- 对照：Android 侧有 `wisdom-ui/api/wisdom-ui.api`（207 行）+ `apiValidation{validationDisabled=false}`，门禁闭环。
- 后果：架构师 §2.2-1 建议"M0 就把'公开 API 冻结'首次执行"，但 iOS 侧**无基线可更新**：M0 加令牌时 Android 会红、iOS 不会红，于是 M0 之后两端 API 纪律结构性不对称，`04-architecture.md:86`「Swift 只导出 `public`」被当作保障，实际没有任何可审计物。
- 建议：§2.2-1 的修订项补一句——M0 同时为 iOS 建立 API 基线（`swift-api-digester` 基线入库，或至少把 `-emit-module-interface` 产物入库）。

### A-M9（中低）B9 的"口径 37+5"仍有**第 6 处副本**：`specs/03-patterns.md:11`

- 证据：`specs/03-patterns.md:11` 原文「7 个场景模式里，只有 `AssigneePicker` 是真正独立的控件，其余 **6** 个都是**用已有组件拼出来的固定组合**」；紧随其后的 `:13-21` 表格自己就删掉了一条（`~~MemberAvatarStack~~`），实际剩 5 个配方 + 1 个组件。裁定口径是 `11-conclusions.md:48` 的「37 组件 + 5 配方」。
- 架构师 B18 把 `specs/README.md:38` 指为"唯一写 6 的地方"，但 `03-patterns.md:11`（**配方规格本体的开篇句**）同样写 6，且它比 README 更接近工作流入口（`specs/README.md` 只是索引）。因此"B9 第一批修正"应含 **6** 处而不是 5 处。
- 建议：把口径"37 组件 + R1–R5 配方"写进 `02-components.md` 作为单一真源，其余位置改为引用；`03-patterns.md:11` 的句子里删掉"6"这个数字。

### A-M10（低）`specs/README.md:1` 标题编号 `# 06 · 组件详细规格` 与 `06-accessibility.md` **编号冲突**

- 证据：`docs/01…11` 的标题分别是 `# 01 · 设计基础`、`# 02 · 组件清单与规格 v0.1`、`# 03 · 令牌到 SwiftUI / Compose 的映射`、`# 04 · 工程架构`、`# 05 · 组件预览与主题`、`# 06 · 无障碍规范`、`# 07 · 内容与文案规范`、`# 08 · 图标规范`、`# 09 · 布局与响应式规范`、`# 10/11 …`；而 `specs/README.md:1` 自报 **`# 06 ·`**。同一个编号 06 指向两份不同文档。
- 后果：`04-architecture.md:53` 用 `docs/02-components.md` + `docs/specs` 双轨引用；任何按编号索引进来的读者会在 `06-accessibility.md`（无障碍验收硬门槛）与 `specs/README.md`（开发依据）之间撞号。B9 的"文档 7 处自相矛盾"清单未含此项。
- 建议：并入 B9，改为 `# 组件详细规格` 或改成与目录一致的编号。

---

## 4. 无法验证项清单（明确标注，不默认成立）

| 项 | 为什么无法验证 |
| --- | --- |
| **Android 能编译 / `apiCheck` 通过** | `./gradlew` 因 wrapper `.lck` 被拒（`Operation not permitted`）；直连已解压 dist 因 `Could not initialize native services`（`libnative-platform.dylib`）失败。我**未能**让 Gradle 起任何一次构建。因此我只能给出**静态**结论：`.api` 与源码的 27/27 比对一致（§1.1 §1.4-3），以及"令牌增删必改 `WDColors`/`WDGradients`/`WDTextStyle` 三类公开容器"的**机制**推演。**架构师自己声明的"本轮未取得直接证据"我确认成立且有复现证据。** |
| **iOS 主机 `swift build` 是否因平台声明/UIKit 失败** | 该命令在**编译 `Package.swift` 清单**阶段就被沙箱阻断（`sandbox-exec: sandbox_apply: Operation not permitted`，以及 `~/Library/org.swift.swiftpm*` 不可写），**根本走不到目标编译**。因此"因为只声明 `.iOS(.v17)` 且依赖 UIKit 所以主机 `swift build` 无效"这条我只能给静态证据（`Package.swift:4-8` 只有 `.iOS(.v17)`；`WDColor+Hex.swift:19` 用 `UIColor`），**没有实测**。另注：架构师把 `.iOS(.v17)` 记在 `Package.swift:4-6`，实际在 **`:7`**（`:4-8` 是 `Package` 声明整体）。 |
| **T1/T2/T3 断言"必红"** | 需要可运行的 Android 测试环境（同上，Gradle 不可用）。"38 个角色未映射（48−10）"是**静态实测**，"断言会红"是**推论**。 |
| **D1–D5（iOS 26 系统 Tab 栏量测）** | 需 iOS 26 真机/模拟器实际量测视觉高度、inset、字号可配性；本会话无此环境，也无任何可查证材料。 |
| **架构师 §2.2-2 的 `--g-*` 计数（129 / 178 / 70）** | **我用 8 种 grep 口径都复现不出这三个数**：三份画廊的 `var(--g-…)` 引用数分别为 **241 / 173 / 71**（`grep -o 'var(--g-[a-zA-Z0-9-]*'`），`--g-*` 全出现次数分别为 **276 / 210 / 102**（`grep -o -- '--g-[a-zA-Z0-9-]*'`），定义行数分别为 **35 / 36 / 29**。129/178/70 既不匹配任何一种，也不匹配任何两种的组合（178 夹在 173 与 210 之间）。**该组数字无法复现**；定性结论（"`--g-*` 全为手写、未被生成器产出"）我另行验证成立（`build.js` 无画廊 CSS 输出）。 |
| **§1.2-5 的另两条尝试（`GRADLE_RO_DEP_CACHE`、插件元数据离线不可解析）** | 我未重跑；已复现的两条（wrapper 锁 + native services）足以支持"本环境跑不了 Gradle"的判定。 |
| **§6 各里程碑工期是否"可信/偏紧"** | 估价判断，无客观判据。我只验证其**事实依据**（从零的工作类别、测试现状、lint/CI 现状）与**逻辑推论**（四项互斥）成立。 |
| **B19 的"任何混用 M3 组件都会跳色跳字"** | 我验证了机制（48 参中 38 个取 M3 默认色 + 未传 typography/shapes），但"混用即跳色"的可见后果需运行渲染才能确认。 |
| **§1.2-7 架构师当时看到的是"3 行"** | 时点性证据，无法回溯。我自己的快照是 4→6 行（并发产出 12/13/14）。实质结论（10/11 未入库）我完全复现。 |

---

## 5. 结论

### 5.1 判定

**需修订**（有条件通过）：**该文档可以作为第二轮讨论稿的架构侧输入，但必须先完成下列 5 项修订。** 修订性质是"补全 + 措辞 + 命令合规"，**不涉及推翻任何主结论**。

理由摘要：

1. **可继承的部分很硬**：B1–B10 与 §3/§4 的主要判断我逐条重跑命中；架构师自述复算的 10 组对比度，我扩大到 **27 个值**并加入"令牌自行声称值"一类，**全部吻合**（附录 A）；B11/B12/B13/B14/B15/B16/B17/B18/B19/B20/B21 的 file:line 我逐条重跑命中（§1.5）。§2.1「第一轮账目可继承」我确认。
2. **有一组数字无法复现**（§2.2-2 的 `--g-*` 计数），直接违反第二轮自己的"数字必须可复算"纪律——这正是本轮评审最该守住的东西，不能放行。
3. **有两处措辞把"可调和"写成"互斥/不可执行"**（C1/C2），会让队长误以为要动决议本身。
4. **架构师给出的"可执行命令"自身在本环境不可执行**（C2），若不修，M0 出口条件会把一个跑不通的命令写进 CI。
5. **漏了 10 条架构风险**，其中 **A-M1（specs 索引损坏 16 个组件）** 与 **A-M2（已提交的 1.9 MB JVM 崩溃日志）** 直接落在"M0 文档一致 / 基线可审计"的出口条件上，属于必须先补的。

### 5.2 必须修订项清单（R1–R5）

| # | 必须修订 | 位置 | 完成判据 |
| --- | --- | --- | --- |
| **R1** | 删除或重算 `--g-*` 的"129 / 178 / 70"计数 | §2.2-2 表格、§4-B18 相关表述 | 换成可复现口径（例如"三份画廊的 `--g-*` 定义各自在一个选择器下的连续块内，共 35/36/29 行，全部手写"），或标为"未复现" |
| **R2** | 修正命令与行号：`swiftc -typecheck` 补 `-module-cache-path`；`.iOS(.v17)` 行号改为 `Package.swift:7`；iOS 基线快照改用与本文一致的口径 | §1.1 / §1.2-3 / §2.2-3 / §2.2-5 引用的行号 | 命令**原样粘贴可执行**（我实测：含 `-module-cache-path` → exit 0） |
| **R3** | 把"互斥""不可执行"降级为准确表述 | §2.2-2（改为"`--check` 覆盖范围未定义"）、§2.2-3（改为"§4.1 该条无命令，§4.3 的命令不合规/`swift build` 非有效验收"） | 与 `11-conclusions.md:143/:88`、`:168` 的原意一致，不暗示需改决议 |
| **R4** | 补入两条高severity遗漏项 | §1.4 / §7 / §6.4 | ① A-M1：`specs/README.md:71-93` 组件索引损坏、21–36 缺失，需并入 B9（文档一致性）第一批修正；② A-M2：`android/hs_err_pid9500.log`+`replay_pid9500.log`（`524f5d6` 提交，1.9 MB）需移出版本控制并补 `.gitignore`，并入"§6.4 两项管理动作" |
| **R5** | 把其余 8 条遗漏项并入对应章节 | §3（I1/§3.3-3）、§7（未决问题）、§6 | A-M3→I1 字族令牌不生成；A-M4→§3.3-3 与 §7 新增"spring 参数集单一真源"；A-M5→§7 新增"`WDTextStyle` 去 `data class`"；A-M6→§7-3 扩为三类公开容器；A-M7→§3.3-2 扩为"令牌命名空间两端映射表"；A-M8→§2.2-1 补 iOS API 基线；A-M9→§2.2-5 由 5 处改为 6 处；A-M10→并入 B9 |

### 5.3 给队长的两句话

1. 架构师的 **B1–B21 证据链我一条都没打翻**，可以放心把它作为架构侧输入；需要的是**打补丁**（R1–R5），不是重做。
2. 本轮真正的"新增净风险"来自 §3 的 A-M1/A-M2：一个是**文档结构**坏（组件索引丢 16 个组件），一个是**版本控制基线**坏（已提交 JVM 崩溃日志）。这两条都不需要架构判断，但都会在 M0"一次冻结"时变成审计障碍，建议**先修它们再谈工期**。

---

## 附录 A · 我的独立复算全表（WCAG 2.1 相对亮度）

口径：`L = 0.2126·R + 0.7152·G + 0.0722·B`（sRGB 线性化），`CR = (L_hi+0.05)/(L_lo+0.05)`。全部由我本会话自写脚本计算，未引用任何文档数值。

| 前景 / 背景 | 我的实测 | 架构师声称 | 结论 |
| --- | --- | --- | --- |
| `#4C8DAE` / `#123F5C` | 3.03 | 3.03 | 吻合 |
| `#B0D5DF` / `#123F5C` | 7.10 | 7.10 | 吻合 |
| `#2A7F5C` / `#E3F5EC` | 4.32 | 4.32 | 吻合 |
| `#1677B3` / `#E1F0F8` | 4.17 | 4.17 | 吻合 |
| `#97651F` / `#FFF4DC` | 4.58 | 4.58 | 吻合 |
| `#B8564D` / `#FBE7E4` | 3.94 | 3.94 | 吻合 |
| `#226A4C` / `#E3F5EC` | 5.73 | 5.73 | 吻合 |
| `#125F8F` / `#E1F0F8` | 5.89 | 5.89 | 吻合 |
| `#8A5A18` / `#FFF4DC` | 5.41 | 5.41 | 吻合 |
| `#9E4038` / `#FBE7E4` | 5.44 | 5.44 | 吻合 |
| `#DCEEF4` / `#1677B3` | 4.07 | 4.07 | 吻合 |
| `#FFFFFF` / `#1677B3` | 4.86 | 4.86 | 吻合 |
| `#FFFFFF` / `#4FB0C8` | 2.51 | 2.51 | 吻合 |
| `#FFFFFF` / `#3898B4` | 3.32 | 3.32 | 吻合 |
| `#5B7784` / `#F1F8FA` | 4.43 | 4.43 | 吻合 |
| `#5B7784` / `#BCE0E6` | 3.38 | 3.38 | 吻合 |
| `#839EB0` / `#465F6C` | 2.40 | 2.40 | 吻合 |
| `#A4BCCB` / `#465F6C` | 3.42 | 3.42 | 吻合 |
| `#4C616D` / `#F1F8FA` | 6.04 | 6.04 | 吻合 |
| `#E6F1F6` / `#465F6C` | 5.87 | 5.87 | 吻合 |
| `#E6F1F6` / `#0D2435` | 13.84 | 13.84 | 吻合 |
| `#A4BCCB` / `#0D2435` | 8.05 | 8.05 | 吻合 |
| `#839EB0` / `#0D2435` | 5.66 | 5.66 | 吻合 |
| `#E6F1F6` / `#253947` | 10.42 | 10.42 | 吻合 |
| `#A4BCCB` / `#253947` | 6.06 | 6.06 | 吻合 |
| `#839EB0` / `#253947` | 4.26 | 4.26 | 吻合 |
| `#839EB0` / `#0B1F2E` | 5.99 | 5.99 | 吻合 |
| **以下为架构师未查、我新增** | | 令牌文件 `$description` 声称 | |
| `#FFFFFF` / `#B8564D` | 4.69 | 「白字 4.7–5.6」 | 成立 |
| `#FFFFFF` / `#A94A42` | 5.61 | 「白字 4.7–5.6」 | 成立 |
| `#0E3A55` / `#8FCFDD` | 6.92 | 「深字 5.4–6.9」 | 成立 |
| `#0E3A55` / `#63BAD2` | 5.40 | 「深字 5.4–6.9」/「5.4」 | 成立 |
| `#FFFFFF` / `#1677B3`（深色 gradient.fill 起点） | 4.86 | 「白字 4.9–6.7」 | 成立（四舍五入） |
| `#FFFFFF` / `#2A5CAA`（深色 gradient.fill 终点） | 6.54 | 「白字 4.9–6.7」 | 成立 |
| `#123F5C` / `#B0D5DF` | 7.10 | —（decisions §3.1 只写 4.61 最严口径） | 参考 |
| `#123F5C` / `#7EC4CF` | 5.65 | — | 参考 |
| `#B0D5DF` / `#123449` | 8.33 | — | 参考 |
| `#B0D5DF` / `#0F4055` | 7.12 | — | 参考 |

**复算总结：27/27 与架构师声称吻合；10/10 与令牌自行声称吻合。**

---

← 返回：[架构师复核意见](12-review-architect.md) ｜ [设计评审结论](11-conclusions.md) ｜ [讨论纪要](10-discussion.md)
