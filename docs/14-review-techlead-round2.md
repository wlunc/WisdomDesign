# 14 · 第二轮评审：研发Leader 复核（实现路径 / 排期 / 工程门禁）

> 角色：研发Leader（10+ 年移动端，iOS + Android）｜性质：**第二轮独立复核**，供队长汇总
> 输入：[`10-discussion.md`](10-discussion.md) §3 / §7、[`11-conclusions.md`](11-conclusions.md) §4 / §5、`04-architecture.md`、`05-preview-and-theme.md` + 两端源码与生成物
> 写作纪律：**不复述第一轮结论**，只写「落地复核 + 新增发现 + 实现路径/排期/门禁判断」。所有判断挂 `file:line` 或命令输出；命令与输出见 [附录 A](#附录-a命令与输出)。

---

## 1. 复核范围与方法

### 1.1 只读输入

| 类别 | 对象 |
| --- | --- |
| 评审文档 | `10-discussion.md`（1235 行，重点 §3 / §4 / §7）、`11-conclusions.md`（222 行）、`04-architecture.md`、`05-preview-and-theme.md` |
| 令牌真源 | `wisdomdesign/tokens/wisdom.tokens.json`、`wisdomdesign/tools/token-build/build.js`（504 行） |
| iOS | `iOS/Package.swift`、`Foundation/WDTokenTypes.swift`、`Foundation/WDColor+Hex.swift`、`Generated/WDTokens.swift`（217 行）、`Tests/WisdomUITests/WDTokensTests.swift` |
| Android | `build.gradle.kts`、`wisdom-ui/build.gradle.kts`、`gradle/libs.versions.toml`、`settings.gradle.kts`、`foundation/WDTheme.kt`、`foundation/WDGradient.kt`、`Generated/WDTokens.kt`、`api/wisdom-ui.api`（207 行）、`src/test/.../WDTokensTest.kt` |
| 渲染对手件 | `design/gallery/wisdom-{components,advanced,patterns}.html`、`design/preview/wisdom-light.html` |
| 第三方二进制 | Gradle 缓存中的 `androidx.compose.ui:ui-android:1.11.4/1.12.1`、`androidx.compose.material3:material3-android:1.4.0` 的 `aar-metadata.properties` 与 `classes.jar`（只读解包） |

### 1.2 方法

1. **可执行验证**：`node tools/token-build/build.js --check`；`swift build`；`swiftc` 探针；`./gradlew --offline :wisdom-ui:apiCheck`。
2. **二进制取证**：对 AAR 读 `META-INF/com/android/build/gradle/aar-metadata.properties`（拿 `minCompileSdk` / `minAndroidGradlePluginVersion`）；用 `javap` 反查 `lightColorScheme$default` / `darkColorScheme$default` 的默认值来源与 `ColorLightTokens ← PaletteTokens` 的派生链。
3. **独立复算**：自己写 WCAG 相对亮度 + alpha 合成脚本，复算 M3 桥接的 12 组色对与行高偏差（不引用第一轮数字）。
4. **计数取证**：对画廊/源码做 `grep -w` 计数与 `file:line` 定位。

### 1.3 边界（先说清，避免误读）

- 本复核环境是**只读工作区沙箱**：`swift build` 因 `sandbox-exec: sandbox_apply: Operation not permitted` 失败；`./gradlew` 因 `~/.gradle/wrapper/dists/...zip.lck (Operation not permitted)` 失败；`aapt2` 无法反序列化 AAR 内的 proto manifest。
- 因此**凡是需要真实构建的结论，本文一律标「无法判定」**，并给出应在 CI 上执行的确切命令（§6.2）。本轮唯一真正跑通的工程门禁是令牌生成一致性（§2.3 #1）。

---

## 2. 第一轮工程结论的落地复核

判定口径：**已解决**＝载体存在且当前满足；**未解决**＝载体缺失或仍是旧值；**无法判定**＝需要本沙箱无法执行的构建/设备验证。

### 2.1 §3.4 行高模型 → **未解决**（并且比第一轮描述的多一层结构性障碍）

| 复核项 | 现状 | 判定 |
| --- | --- | --- |
| `WDTextStyle.font` 固定字号 | `iOS/.../WDTokenTypes.swift:18-20` 仍是 `.system(size: size, weight: weight)`；无 `@ScaledMetric`、无 `relativeTo` | 未解决 |
| `lineSpacing = max(0, lineHeight − size)` | `WDTokenTypes.swift:22-24` 原样 | 未解决 |
| 两端行高模型统一 | `WDTokenTypes.swift:29-33` 只有 `text(_:)`，走 `.lineSpacing`；`android/.../WDTheme.kt:54-58` 的 `toTextStyle()` 只给 `fontSize/lineHeight/fontWeight`，不给 `LineHeightStyle`、不给 `includeFontPadding` | 未解决 |
| 令牌吐行高比 | `build.js:257-259`（Swift）与 `build.js:444-446`（Kotlin）仍只输出绝对 `lineHeight`；`WDTokens.kt:234-245` 全是 `13.sp` 这类绝对值 | 未解决 |
| 度量测试 | `WDTokensTests.swift:7-17` 只有 `lineHeight >= size` 一条断言 —— **恰好测不到行高偏差**（见 E5） | 未解决 |

**新增判断（E5 摘要）**：`max(0, lineHeight − size)` 的偏差是 `≈ 0.1935 × size`，**与大字号成正比**：`body` +3.29pt（+15.0%），`largeTitle` +6.58pt（+16.0%）。更关键的是 **`caption2`（11/13，ratio 1.18）低于 SF Pro 的天然比值（20.29/17 ≈ 1.1935），正确追加量是 −0.13pt** —— 也就是说这一档在 SwiftUI 上**无法用 `.lineSpacing` 实现**（它只能加不能减）。第一轮只说「偏松 15%」，实际是「有一档方向相反、公式无解」。

### 2.2 §3.5 五条工程建议

| # | 建议 | 现状证据 | 判定 |
| --- | --- | --- | --- |
| 3.5.1 | 无障碍文案必须可注入 | `grep -riE 'WDLocalization\|localiz\|stringResource\|formatter' iOS/Sources android/wisdom-ui/src` **零命中**；`WDTextStyle` / `WDColors` / `WDTheme` 三个公开面上没有任何文案插槽 | **未解决**（连类型都还没有） |
| 3.5.2 | 令牌变更会撞 `apiCheck`，流程要固定 | 载体**已存在**：`android/build.gradle.kts:6` 挂了 BCV 插件、`:11-13` 开 `apiValidation`、`wisdom-ui/build.gradle.kts:31` 开 `explicitApi()`、`api/wisdom-ui.api` 已提交 207 行 | **流程未解决 / 可跑性无法判定**（本轮 `apiCheck` 跑不起来，见 §1.3） |
| 3.5.3 | RTL 落地要连画廊一起验 | 画廊与预览 4 个文件 **0 处 `dir=`、0 处 `rtl`**；方向词 `left`/`right` 合计 **48 / 46 处**（`components` 一个文件就是 12 / 15，第一轮只数了这一个文件） | **未解决**（连渲染路径都不存在） |
| 3.5.4 | 派生布局常量也令牌化 | 令牌里**没有** `component.*`（唯一的 `component` 是 `wisdom.tokens.json:276` 的 `motion.component.*` 动效常数）；且 `82 / 92 / 62` 在画廊 HTML 里**一次都没出现** → 这三个算式目前只活在文档里 | **未解决** |
| 3.5.5 | 小账（色卡 / Tab 高度 / 玻璃透明度） | `color.named` 仍是 **9** 个（`README.md:24,102`、`01-foundation.md:40` 仍写「十二个色」）；`WDTokens.kt:225` 仍是 `tabbarHeight = 56.dp` | **未解决** |

### 2.3 §4.2 九条 M0 出口条件（`11-conclusions.md:136-146`）

| # | 出口条件 | 证据 | 判定 |
| --- | --- | --- | --- |
| 1 | `build.js --check` 通过 | 本轮实测：`✓ iOS/...Generated/WDTokens.swift` / `✓ android/...Generated/WDTokens.kt`，`exit=0` | **已解决**（仅"当前快照一致"；M0 改令牌后需复跑） |
| 2 | 对比度断言（alpha 合成 + 自动取最不利背景） | 在 `iOS/Sources`、`android/wisdom-ui/src`、`wisdomdesign/tools`、`wisdomdesign/tokens` 检索 `contrast\|luminance\|wcag`：**全部 0 命中**；无 `contrast.json`、无断言脚本 | **未解决** |
| 3 | 两端能编译 | 两端都无 CI；`swift build` 结构上不可用（E6）；`gradlew` 在本沙箱被拒 | **无法判定**（且门禁定义本身要改） |
| 4 | `WDTextStyle` 定形态 + 生成器吐行高比 | 形态未动（`WDTokenTypes.swift:6-25`），生成器未动（`build.js:257-259`） | **未解决** |
| 5 | RTL 命名冻结 | 两端源码与令牌里没有任何 `leading/trailing` 命名；画廊无 RTL 渲染 | **未解决** |
| 6 | 画廊 `--g-*` 由生成器输出并纳入 `--check` | `build.js:474-477` 的 `targets` **只有 2 项**（两个 Generated 文件）；画廊里 `--g-*` 是**手写的 35 个定义**（`wisdom-components.html:1544-1580` 一带） | **未解决**（零载体） |
| 7 | 色晕令牌写清净 alpha + 深色版本 | 令牌里**没有** `wash`；唯一真源是 HTML：`preview/wisdom-light.html:1379-1382`（`--wd-wash`，两主题共用一份）+ `:1423`（`.wd-canvas-sheet::before{opacity:.55}`）；文档口径 `01-foundation.md:152-153` 为 `.66` | **未解决** |
| 8 | 玻璃档位与 `06 §5.2` 调和 | `06-accessibility.md:161` 仍是「文字必须落在 `surface.glass-strong`（82%+）上」；令牌 `material.regular.fillLight = #FFFFFFB3`（70%）未动 | **未解决** |
| 9 | 色卡数量与文档一致 | 见 §2.2 / 3.5.5；**额外**：`build.js:171` 与 `build.js:348` 把「定稿色卡的十二个色」写进了**生成产物**的注释里 | **未解决**（且比第一轮描述多一处载体，见 E3） |

---

## 3. 新增发现（E1–E15）

> 每条给：**问题 → 证据 → 影响 → 建议**。E1–E5 是「必须先改令牌/生成器」类，E6–E11 是「结构/桥接」类，E12–E15 是「工具链与几何」类。

### E1（高）画廊是**第三真源**，且它不在生成器覆盖范围内——现在就已经漂移

- **证据**
  - `build.js:474-477`：`targets = [[SWIFT_OUT, buildSwift(...)], [KOTLIN_OUT, buildKotlin(...)]]` —— 只有两个目标，**没有画廊**。
  - `wisdomdesign/design/gallery/wisdom-components.html` 里 `--g-*:` 的手写定义共 **35 个**（`1544-1580` 一带），例如 `1544:--g-brand:#1677B3`、`1559:--g-text3:light-dark(#5B7784,#839EB0)`、`1564:--g-glass-strong:light-dark(rgba(255,255,255,.88),...)`。
  - 已漂移的实例：`--g-glass-strong` 浅色写 `.88`，令牌 `semantic.light.surface.glass-strong = #FFFFFFDB` = **85.9%**；`--g-text3` 仍是 **B10 之前的旧值** `#5B7784`（决议 `#4C616D`）。
- **影响**：§4.2 的第 6 条出口不是「待实现」，而是**连目标文件都没进生成器**；M1 的截图基线若以画廊为对手件，会把 `.88`、旧 tertiary 一起固化成"设计的样子"。
- **建议**：在 `build.js` 里新增第三个 target（`design/gallery/*.html` + `preview/*.html` 中的 `/* @generated start/end */` 区块原地替换），并把 `--g-*` 的定义区改成生成物；在改之前先裁一次"谁是真源"（见 §7 未决 8）。

### E2（高）暗色画廊的品牌色没有 `light-dark()`，暗底上只有 3.52:1

- **证据**：`wisdom-components.html:1544` / `wisdom-advanced.html:1543` / `wisdom-patterns.html:1543` 均为裸值 `--g-brand:#1677B3`（**未包 `light-dark()`**），而 `:1821` 用它渲染 `.wd-tabbar .it.on{color:var(--g-brand)}`。令牌侧 `semantic.dark.text.brand = #7EC4CF`。合成复算：暗色 glass-strong 底 `#0C1D2D` 上，`#1677B3` → **3.52:1**，`#7EC4CF` → **8.69:1**。
- **影响**：这是一个**已经存在**的不达标（不是未来风险），而且落在"选中态 Tab 标签"上，M1 的暗色截图会把它拍进去。
- **建议**：把 `--g-brand` 纳入生成物（E1）；M0 的对比度断言语料里必须包含"画廊 CSS 变量合成后的结果"，而不只是令牌 hex。

### E3（中）「十二个色」不止在文档里，它被写进了生成器 → 改文档必须同时改生成器并重生成

- **证据**：`build.js:171`（Swift）与 `build.js:348`（Kotlin）都硬编码 `定稿色卡的十二个色`；`color.named` 实际 **9** 个（`$description` 除外）；产物里同样能看到该注释（`WDTokens.swift` / `WDTokens.kt` 的 `Palette` 段）。文档侧 `README.md:24,102`、`01-foundation.md:40` 仍写「十二个色」。
- **影响**：B9 第 1 条若"只改文档"，`--check` 会因为生成器注释变了而红（或反之，改了生成器忘了文档）；这正是 §4.4「一次令牌变更」纪律最容易漏的一环。
- **建议**：把"色卡 9 个"的表述做成生成器里的常量 `${count}` 而非字面量，一并重生成。

### E4（中）`letterSpacing` 令牌被生成器**静默丢弃**

- **证据**：令牌 `typography.overline.$value` 含 `"letterSpacing":"0.6"`；`build.js:256-259` / `443-446` 只读 `fontSize / lineHeight / fontWeight` 三个字段；两端类型都没有该能力（`WDTokenTypes.swift:6-15` 只有 size/lineHeight/weight；`api/wisdom-ui.api:161-175` 无 letterSpacing 成员）。
- **影响**：`overline` 的字距规格**没有任何落地路径**，而 CI 全绿。M0 一旦冻结 `WDTextStyle` 形态后再补，就要**再走一次 `apiDump` + 改 37 份规格**——正好是第一轮反复强调要避免的返工。
- **建议**：把 `letterSpacing` 与行高比**同批**并入 M0 的 `WDTextStyle` 形态（默认 `0`，避免每个字阶都要给值）。

### E5（高）行高公式在 ratio < 字体天然比值时**无解**，`caption2` 已经落到负值

- **证据**（本轮独立复算，用 `20.29/17 = 1.1935` 作为 SF Pro 天然比值，即第一轮给出的 body 实测）：

| 字阶 | size/lineHeight | ratio | 正确追加 | 现值 `max(0,lh−size)` | 实际行框 | 偏差 |
| --- | --- | --- | --- | --- | --- | --- |
| largeTitle | 34/41 | 1.206 | **+0.42** | 7 | 47.58 | +6.58（+16.0%） |
| title1 | 28/34 | 1.214 | +0.58 | 6 | 39.42 | +5.42（+15.9%） |
| headline / body | 17/22 | 1.294 | +1.71 | 5 | 25.29 | +3.29（+15.0%） |
| footnote | 13/18 | 1.385 | +2.48 | 5 | 20.52 | +2.52（+14.0%） |
| **caption2** | **11/13** | **1.182** | **−0.13** | 2 | 15.13 | +2.13（+16.4%） |

  现有测试只断言 `style.lineHeight >= style.size`（`WDTokensTests.swift:15`）——`13 >= 11` 恒真，**测不到本条**。
- **影响**：(a) 偏差与小字号/大字号**正相关**，而 §3.2 的三级色正是「靠字号承担层级」→ 字号越大行高越松，层级映射会被行高噪声干扰；(b) `caption2` 必须改**比值**或改**实现**，二选一，现在两者都没选。
- **建议**：M0 冻结形态时**同时**产出「实测天然行高表 + 每个字阶的追加量」并把 `caption2` 的 `lineHeight` 13→14（最小合规值 `⌈1.1935×11⌉ = 14`）或改走 `NSParagraphStyle.minimumLineHeight/maximumLineHeight`（§7.6.1 的 B 案）。任何一个都要有**度量测试**，不能只靠报告。

### E6（高）`swift build` 结构上**不是**可跑的 iOS 编译门禁

- **证据**
  - 探针：`swiftc -module-cache-path <局部> p.swift`（内容 `import UIKit`）→ `error: no such module 'UIKit'`，`exit=1`；同一 `swiftc` 编译 `import SwiftUI` → `exit=0`。（宿主 target 是 `arm64-apple-macosx26.0`。）
  - `iOS/Package.swift:6-8` 只声明 `.iOS(.v17)`，没有 `.macOS`；`WDColor+Hex.swift:19-27` 用 `UIColor { traits in ... }`。
  - `iOS/.build/` 只有 `.lock / artifacts / checkouts / repositories`，**没有编译产物目录** → 该仓库从未完成过一次本地构建。
- **影响**：§4.3 门禁表写的「iOS `swift build`」在执行层面是**纸面门禁**；M0 出口 3「两端能编译」的 iOS 半边没有可执行命令。
- **建议**：门禁改成 `xcodebuild -scheme WisdomUI -destination 'generic/platform=iOS' build`（macOS runner），测试改成 `xcodebuild test -destination 'platform=iOS Simulator,name=iPhone 17'`。若想保留 `swift build` 的快速反馈，需要引入 `ConditionalTarget`/独立 macOS 目标并把 UIColor 分支隔离——不建议为 M0 增加这个变数。

### E7（高）`sp` 自动缩放 vs `.system(size:)` 固定字号：同一份令牌两端实际字号不同，且**尺寸令牌是 dp 不随字号缩放**

- **证据**
  - Android 生成物：`WDTokens.kt:234-245` 是 `13.sp ~ 34.sp`；`api/wisdom-ui.api:161-175` 的 `WDTextStyle` 用 `TextUnit`。
  - 尺寸令牌是 **dp**：`WDTokens.kt:225` `tabbarHeight: Dp = 56.dp`、`:213` `touchTargetMin: Dp = 44.dp`。
  - iOS 是 `.system(size:)`（`WDTokenTypes.swift:18-20`），`lineHeight` 是裸 `CGFloat`。
  - 出口条件里两端被**当成等价**：`11-conclusions.md:154`（M2 出口）写「AX3 / fontScale 1.3 不截断」。
- **影响**：三条。
  1. Android 的 `11.sp` 会随 `fontScale` 放大，iOS 不会 → 同一张「AX3」截图在两端其实不是同一件事，M1 的**六态基线在 iOS 侧当下只能出 3 态**（浅/深 × LTR/RTL）。
  2. `fontScale 1.3` 时 Android 的 Tab 标签 11→14.3sp，而栏高 `56.dp` 不变 → 组件尺寸与文字**脱钩**，「不截断」不是靠字号治理就能过的。
  3. iOS 侧要算"AX3 等价"，必须为每个 WD 字阶指定 `relativeTo:` 的 `Font.TextStyle`（@ScaledMetric 的相对基准），而 iOS 的 Dynamic Type 曲线是按系统字阶非线性定义的 → **设计侧现在给不出"AX3 = 多少 pt"**（见 §7 未决 3）。
- **建议**：M0 出口 4 的交付物里增加**一张 iOS↔Android 的缩放对照表**（WD 字阶 → iOS `relativeTo` → AX3 实测 pt；Android → fontScale 1.3/2.0 实测 sp），并把 M2 出口改写为「各自平台口径下的 AX3 不截断」。

### E8（中）`WDTextStyle` 两端形态不对称，且生成器**自己的注释刚刚反对过 data class**

- **证据**：`build.js:328` 写着「不用 data class：27 个属性会顺带暴露 copy() 与 componentN()，不是我们想承诺的 API」——这是对 `WDColors` 的处理；但 `build.js:438` 对 `WDTextStyle` 用的是 `public data class`，于是 `api/wisdom-ui.api:164-168` 里 `component1/component2/copy/copy$default` **全部进了公开面**（还带 mangled 后缀 `-XSAIIZE`/`-C3pnCVY`）。
- **影响**：M0 加 `lineHeightRatio`（或 E4 的 `letterSpacing`）会同时改 **构造函数/属性/copy 的 mangled 签名**——API 快照的 diff 会比预期大得多；胶水代码（`copy-C3pnCVY$default`）一旦被宿主调用，签名变化就是二进制不兼容。
- **建议**：M0 先裁定 `WDTextStyle` 是否保留 `data` 语义（我倾向：**去掉 data**，与 `WDColors` 保持一致，只留构造 + 属性），再动字段；否则会改两遍。

### E9（高）Material 3 桥接只覆盖 10 / 48 个角色，其余取 **Material 基线（紫系）**

- **证据**
  - `WDTheme.kt:60-71`（light）与 `:73-84`（dark）各只传 10 个参数：`primary / onPrimary / background / onBackground / surface / onSurface / surfaceVariant / onSurfaceVariant / outline / error`。
  - 反编译证据：`material3-android:1.4.0` 的 `ColorSchemeKt.lightColorScheme-_VG5OTI$default` 与 `darkColorScheme-_VG5OTI$default` 里各有 **220 处** `ColorLightTokens` / `ColorDarkTokens` 引用 → **未传的参数全部回落到 Material 基线**；而 `ColorLightTokens` 的 `<clinit>` 逐项取自 `PaletteTokens.Primary40 / Secondary40 / Tertiary40 / Neutral* / Error*`（即 M3 基线紫/青系）。
- **影响**：注释写「Material 组件在和 Wisdom 组件混用时不会跳色」（`WDTheme.kt:32-34`），**这个承诺不成立**：
  - `surfaceTint` 未覆盖 → 任何带 `tonalElevation` 的 Material 3 `Surface` 会把基线紫混进品牌底（复算：8% 紫 `#6750A4` 落到白底 = `#F3F1F8`，肉眼可见的偏紫）；
  - `primaryContainer / secondary* / tertiary* / inverse* / outlineVariant` 全是基线 → Chip / SegmentedButton / Snackbar / NavigationBar 的容器色与 Wisdom 语义色打架；
  - `outlineVariant` 未覆盖 → Material 组件的分隔线**完全绕过** `border.hairline`。
- **建议**：二选一并在 M0 写下结论：(a) 补全 48 个角色（需要设计为每个 M3 角色指定语义色，属设计侧工作，建议**放到 M3 基础层封板时**做）；(b) `WDTheme` 明确标注"桥接范围 = 这 10 个角色，Material 容器的容器色不保证"，并把 `surfaceTint` 至少设成 `bgCanvas` 或品牌色，避免紫色渗透。

### E10（中）`outline = borderHairlineStrong` 是**alpha 发丝色**，合成后只有 1.40:1 / 1.77:1

- **证据**：`WDTheme.kt:69`（light）、`:82`（dark）；令牌 `semantic.light.border.hairline-strong = #0A1B2429`（alpha 41/255 = 0.161）、`semantic.dark.border.hairline-strong = #FFFFFF2E`（0.18）。复算：合成到 `#FFFFFF` → `#D8DADC`，对比度 **1.40:1**；合成到 `#0C2130` → `#384955`，**1.77:1**。
- **影响**：M3 的 `outline` 是**可见边框/焦点指示**角色，工程上按 3:1（WCAG 1.4.11 非文本对比）验收；1.4:1 等于"描边不可见"。另外 `onError` / `errorContainer` 未覆盖（E11）。
- **建议**：`outline` 取实色（如 `text.secondary` 或新增 `border.outline` 令牌），发丝色继续只走 Wisdom 自己的 hairline 路径。

### E11（中）`error = status.danger` 在浅色画布上 4.37:1

- **证据**：`WDTheme.kt:70` / `:83`；令牌 `semantic.light.status.danger = #B8564D`。复算：on `bg.canvas #F1F8FA` = **4.37**（< 4.5），on `#FFFFFF` = 4.69。`onError` 未覆盖 → 基线白（on `#B8564D` = 4.69）。深色侧 `#EDA79E` on `#0C2130` = 8.33 ✅。
- **影响**：M3 的 `error` 是**内容色**（错误文字），4.37 属于已突破 4.5 底线的一档，与 B2/B10 同类；而且它是"桥接引入的新使用场景"（令牌本身在 `status-soft` 上的问题已由 B2 处理，这里是**直接在 canvas 上**用）。
- **建议**：`error` 改指向 `status-text.danger`（`#9E4038`，B2 已定），或在 M0 断言语料里补上 `error on canvas` 这组。

### E12（中）画廊渲染出来的 Tab 栏与令牌/决议**三处不一致**，其中 blur 值令牌里根本不存在

- **证据**：`gallery/wisdom-components.html:1819` `wd-tabbar{...height:58px;...background:var(--g-glass-strong);border:1px solid var(--g-line);backdrop-filter:blur(20px)...}`；`:1820` `.wd-tabbar .it{...font-size:10px;font-weight:500;...}`。
  - 高度 **58px** vs 令牌 `WDTokens.kt:225` **56.dp**（决议为 58，即令牌未落地）；
  - 标签 **10px** vs 决议 §3.2「Tab 标签字号 `caption2` 11 · 500」；
  - `backdrop-filter: blur(20px)` vs 令牌 `material.*` 的 **14 / 22 / 30 / 44**（`wisdom.tokens.json` 的 `material.ultraThin/thin/regular/thick.blur`）→ **20 不在任何档位上**；
  - 背景用 `--g-glass-strong`（85.9%）vs 决议「Tab 栏走 `regular` 70%」。
- **影响**：这是"同值多源"的**第三个源**，且是**唯一被渲染、会被截图**的那个。E1 的生成化不解决它——生成化只会让 `--g-*` 一致，不会让 58/10/20 这些**写死在选择器里的**值一致。
- **建议**：把画廊里"写死在选择器里的数值"（高度、字号、模糊半径、内缩、留白）改为 `var(--g-*)` 引用，再让 `--g-*` 生成；这一步是 §4.2 出口 6 的**前置条件**，工作量应单列。

### E13（中）`compileSdk 36 / AGP 8.13.2 / BOM 2026.06.01` 现状**兼容**，但升级路径被 **AGP ≥ 9.1.0** 硬卡住（注释里漏写）

- **证据**（AAR 元数据，取自 Gradle 缓存）

| 构件 | `minCompileSdk` | `minAndroidGradlePluginVersion` |
| --- | --- | --- |
| `compose ui/foundation 1.11.4`（= BOM `2026.06.01`） | **35** | **8.6.0** |
| `compose ui/foundation 1.12.1`（= BOM `2026.09.00`） | **37** | **9.1.0** |
| `material3 1.4.0`（= BOM `2026.06.01` 映射值，见 BOM POM） | 35 | 8.6.0 |

  `android/gradle/libs.versions.toml:4-5` 的注释只写了「Compose 1.12 要求 compileSdk 37，而 AGP 8.13.2 的上限是 36」，**漏了更硬的一条：1.12 要求 AGP ≥ 9.1.0**。本机 SDK 平台只有 `android-33 / 34 / 36`（无 `android-37`）。缓存里同时存在 `BOM 2026.09.00` + `ui 1.12.1` → 说明这条升级**被尝试过并回退**。
- **影响**：M0 完全不需要动它（现网组合自洽：`compileSdk 36`、AGP 8.13.2、Gradle 8.14.5、Kotlin 2.4.20 与 compose-compiler 同版本）。但**"随手升 BOM"会连带 AGP 9 + Gradle 9 + 新 SDK 平台**，这是独立里程碑，不能夹在 M0/M1。
- **建议**：把 `libs.versions.toml:4-5` 的注释补全为三条约束（compileSdk 37 / AGP ≥ 9.1.0 / 需安装 android-37），并把「工具链升级」登记为 M6 之后的独立事项。

### E14（中）`minSdk 24` 与「玻璃四要素缺一不可」在语义上冲突

- **证据**：`android/wisdom-ui/build.gradle.kts:15` `minSdk = 24`；令牌 `material.$description`（`wisdom.tokens.json` 的 `material` 节点）原文：「玻璃 = 模糊 + 半透明填充 + 顶部高光 + 外圈细线。**四条缺一不可**」；`material.*` 各档只有 `blur / fillLight / fillDark`，**没有"无模糊降级"的档位**。
- **影响**：API 24–30（本仓库要支持的区间）上，`Modifier.blur` 依赖的 `RenderEffect` 是 API 31 才有的能力，模糊这条要素在低版本上不可得 → 要么"四要素"的定义在低版本不成立、要么组件需要分层渲染。令牌里没有任何降级 alpha，M1 的降级截图基线**现在没有可参照的数值**。
- **边界说明**：本沙箱无设备、无网络，**未能取得可引用的一句话结论**（`Modifier.blur` 在 API < 31 到底是 no-op 还是抛错，`javap` 里没找到 `RequiresApi` 注解）。所以我把它列为**必须验证**的项而不是已确认缺陷。
- **建议**：M0 出口里加一条可验证项：「在 API 30 设备（或 instrumented test）上渲染一次 `material.regular` 玻璃层，记录实际表现」，并据此或 `minSdk 24→31`、或新增 `material.*.fillNoBlur` 令牌。

### E15（中）两端渐变的**几何**不一致：Android 按 CSS 算渐变线长度，iOS 用归一化 UnitPoint

- **证据**：`android/.../WDGradient.kt:27-33`：`length = abs(size.width*dx) + abs(size.height*dy)`（这正是 CSS 渐变线长度公式），起始点 `center ± half`；`iOS/.../WDTokenTypes.swift:86-99`：只用 `UnitPoint`（0…1 归一化）算起点/终点，**没有渐变线长度概念**。
- **影响**：非方形尺寸上（Hero 卡、按钮、图标底板）两端角度与色停位置都会偏：例 375×120、135°，CSS 轴长 = `|375·sin135| + |120·cos135|` ≈ 350pt，而 iOS 走 unit 空间对角线 → 视觉角度与过渡位置都不同。这是「两端视觉重量漂移」里**可测量、可回归**的一部分（比"重量"这种形容词更适合做验收）。
- **建议**：iOS 侧改成与 Android 同构的实现（`GeometryReader` 或 `ShapeStyle` 里按尺寸算端点），并新增一条**度量测试**：固定 375×120、给定角度，断言两端端点坐标误差 < 0.5pt。

---

## 4. 实现路径与责任人建议

> 假设：`wisdomdesign` / `iOS` / `android` 是三个独立 git 仓库（已确认三仓各有 `.git`，各自 main 分支）。责任人按团队角色，不指具体人名。

### 4.1 设计仓库（`wisdomdesign/`）——**唯一真源，必须第一个动**

| 顺序 | 文件 | 改动 | 责任 |
| --- | --- | --- | --- |
| D1 | `tokens/wisdom.tokens.json` | **一次改完**：`text.tertiary→#4C616D`、新增 `status-text.{success,info,warning,danger}`、`text.on-fill(dark)→#FFFFFF`、`gradient.mid` 起点 `#3898B4`、`tabbar-height 56→58`、`size.navbar-large=96`、`scrim`、`component.*`（82/92/62 只存参数）、`wash`（**写明生效 alpha**）+ `gradient.wash.light/dark`、`semantic.*.gradient.tint`、`typography.*.lineHeightRatio`（并修 `caption2`）、`color.named` 的 `$description`（9 个）。**同一提交里做完**，避免 §4.4 反复触发生成与 apiDump | 设计师（值）+ 架构师（结构） |
| D2 | `tools/token-build/build.js` | 适配 D1：吐 `lineHeightRatio`+`letterSpacing`；`Palette` 注释改 `${count}`；把 `../iOS`、`../android` 两个硬编码路径参数化（`--ios-out/--android-out`，兼容三仓不同级 checkout）；新增**画廊 target** | 架构师 |
| D3 | 新增 `tools/token-build/contrast.js` + `tokens/contrast.json` | 声明「前景 × 背景 × 场景 × 阈值」；实现 alpha 合成 +「对色晕每个色标 × 每个 alpha 档采样、自动取与文字明度差最小者」；输出 `docs/contrast-report.md`；`--check` 模式 | 架构师（算法）+ 研发Leader（WCAG 口径复核） |
| D4 | 新增 `tools/token-build/gallery.js`（或并入 D2） | 生成 `design/gallery/*.html` 与 `design/preview/*.html` 里 `/* @generated start/end */` 区块的 `--g-*` | 架构师 |
| D5 | `design/gallery/wisdom-components.html`、`wisdom-advanced.html`、`wisdom-patterns.html`、`preview/wisdom-light.html` | **先把写死值改成 `var(--g-*)`**（Tab 高度 58 / 标签 10px / `blur(20px)` / `--g-brand` 补 `light-dark()` / 列表选中色条 / Divider 内缩）；再吃 D4 的生成区块；补一条 `dir="rtl"` 渲染 | 设计师 + 研发Leader |
| D6 | `docs/06-accessibility.md:161`、`docs/01-foundation.md:40,152-153`、`docs/02-components.md`、`docs/03-platform-mapping.md`、`docs/04-architecture.md`、`README.md:24,102` | 数字最终化后**最后改**（`06 §5.2` 改结果式、`01 §3.6` 净 alpha 口径、`03` 重写/指针页、`04` 分层表、口径 37+5、色卡 9） | 设计师 + 架构师 |
| D7 | 新增 `.github/workflows/ci.yml` | `node tools/token-build/build.js --check && node tools/token-build/contrast.js --check && node tools/token-build/gallery.js --check` | 架构师 |

### 4.2 iOS 仓库

| 顺序 | 文件 | 改动 | 责任 |
| --- | --- | --- | --- |
| I1 | `Sources/WisdomUI/Foundation/WDTokenTypes.swift` | **冻结形态**：`WDTextStyle` 加 `lineHeightRatio`、`letterSpacing`；去掉 `lineSpacing` 计算属性（E5/E6）；新增 `wdFont(_:)` ViewModifier（内部持 `@ScaledMetric`）；实现 `NSParagraphStyle` 或 `ratio×size − 实测天然行高` 二选一 | 研发Leader（iOS） |
| I2 | `Sources/WisdomUI/Foundation/Generated/WDTokens.swift` | 生成物，**不手改**（由 D2 产出） | 生成器 |
| I3 | `Sources/WisdomUI/Foundation/WDColor+Hex.swift` | 若对比度断言需要读回颜色 → 加 `Color → components` 的解析；若要 `wash` 渐变 → 可能需要动态 alpha 构造器 | 研发Leader（iOS） |
| I4 | `Tests/WisdomUITests/WDTokensTests.swift` | 增加：行高**度量**测试（打印/断言实际行框）、`caption2` 追加量非负、渐变几何端点（E15）、M3/语义色对断言（若断言不放在设计仓库） | 研发Leader（iOS） |
| I5 | `Package.swift` | 若采用 lint/format 插件需加依赖（注意：加依赖会破坏"零依赖"这一现状，需 M0 裁定） | 研发Leader（iOS） |
| I6 | 新增 `.github/workflows/ci.yml` | `xcodebuild -scheme WisdomUI -destination 'generic/platform=iOS' build` + `test -destination 'platform=iOS Simulator,...'` | 研发Leader（iOS） |

### 4.3 Android 仓库

| 顺序 | 文件 | 改动 | 责任 |
| --- | --- | --- | --- |
| A1 | `wisdom-ui/src/main/kotlin/.../foundation/Generated/WDTokens.kt` | 生成物，不手改 | 生成器 |
| A2 | `wisdom-ui/src/main/kotlin/.../foundation/WDTheme.kt` | `toTextStyle()` 补 `letterSpacing` + `LineHeightStyle`（并显式 `PlatformTextStyle(includeFontPadding=false)`）；M3 桥接按 E9 结论补全或显式收窄（至少 `surfaceTint`、`outline`、`error`、`errorContainer`） | 研发Leader（Android） |
| A3 | `wisdom-ui/api/wisdom-ui.api` | `apiDump` 产物，**与 A1/A2 同一提交** | 研发Leader（Android） |
| A4 | `wisdom-ui/src/test/kotlin/.../WDTokensTest.kt` | 补：字阶行高比 ≠ 1 的断言、`copy/componentN` 的存在性断言（若决定保留）、组件尺寸与字号联动的回归 | 研发Leader（Android） |
| A5 | `wisdom-ui/build.gradle.kts` | 若加 ktlint/detekt → 改这里（并评估对"第三方依赖为零"的影响）；确认 `apiCheck` 挂进 `check` 并被 CI 显式调用 | 研发Leader（Android） |
| A6 | `gradle/libs.versions.toml` | 注释补全三条约束（E13）；**不改版本** | 研发Leader（Android） |
| A7 | 新增 `.github/workflows/ci.yml` | `./gradlew :wisdom-ui:apiCheck :wisdom-ui:assembleDebug :wisdom-ui:testDebugUnitTest` | 研发Leader（Android） |

### 4.4 改动顺序与依赖（关键路径）

```
D1 令牌一次改完
 ├─→ D2 生成器适配 ─→ (生成) I2 / A1 ─→ A3 apiDump
 │                      └→ I1 形态冻结（依赖 I2 的字段名）─→ I4 度量测试
 ├─→ D3 对比度断言     ← 依赖 D1 的 wash 净 alpha + 玻璃档位裁定
 ├─→ D5 画廊去魔术数   ← 依赖 D1
 │      └→ D4 画廊生成 ─→ (回归) D7 CI
 └─→ D6 文档同步       ← 必须最后（依赖 D1/D3/D5 的最终数字）
```

**三条硬约束**

1. **D1 一次做完**：M0 里任何"先改语义色、下次再改 wash"的做法，都会让 `--check` + `apiDump` + 37 规格 + 4 个画廊各改两遍。
2. **A3 紧跟 A1/A2**：`WDColors` 现在是 27 参公开构造（`api/wisdom-ui.api:3` 的 27 个 `J`），新增 `status-text.*` 会变成 31 参 → 一旦 A1 落地而 A3 没跟上，`:wisdom-ui:build` 必红。
3. **I1 不能晚于 M1 起点**：37 个组件全部经过 `WDTextStyle`；形态晚一周，M2 的 20 个组件就要返工。

---

## 5. 排期复核

### 5.1 `M0 = 1.5 周`（`11-conclusions.md:152`）→ **判定：不可行**（按 §4.1 九条出口全量口径）

依据（每条都挂证据，不是感觉）：

| 证据 | 为什么吃掉工期 |
| --- | --- |
| 出口 6 零载体：`build.js:474-477` 只有 2 个 target；画廊侧 35 个手写 `--g-*` + 4 个文件 + 588 处引用 | 而且**不能只做 `--g-*`**：E12 的 58/10/20 是写死在选择器里的，必须先"去魔术数"再生成，属两次改动 |
| 出口 2 零载体：全仓 `contrast/luminance/wcag` **0 命中** | 断言要"自动取最不利背景"（§3.5 已定为算法），依赖**出口 7（wash 净 alpha）与出口 8（玻璃档位）先被裁定**——这两项至今是开放项（`11-conclusions.md:192-194`），而它们是**设计侧**的裁定 |
| 出口 4 结构改动：`WDTokenTypes.swift:6-25` 需换形态 + 新增 ViewModifier + 加度量测试；E5 还要求先有实测天然行高 | 而 `iOS/.build` 无产物、`swift build` 结构上不可用（E6）→ **这条链从未跑通过一次**，0.5 天的"预研"预算不够"定形态 + 度量" |
| 出口 1/3/9 + apiDump 的联动 | E3/E4/E8 说明这三处会**同时**触发重新生成与 apiDump；纪律（§4.4「一次令牌变更」）可执行，但必须与上面三项串行 |

**替代排期（二选一，我给推荐）**

- **方案 A（推荐）：M0 = 2.5 周**（两端各投 1 人 ≈ 10 人日 + 设计 0.5 人）。新增的 1 周用于：对比度断言实现（1.5 人日）、画廊去魔术数 + 生成化（2 人日）、iOS 形态 + 度量测试（2.5 人日）。
  **前置条件（否则 M0 第一周就会停）**：深色色晕色值、玻璃档位、tint 配方、净 alpha 口径这 4 项**必须在 M0 第 1 天前由设计侧关闭**（`11-conclusions.md:192-194` 现为"落地时才关"）。
- **方案 B（保 1.5 周，收缩范围）**：M0 只做「D1 令牌 + D2 生成器（行高比/letterSpacing）+ 两端形态冻结 + 对比度断言（**显式色对清单**，不做自动最不利采样）+ apiDump」；把「画廊生成化」「自动最不利采样」「玻璃/色晕调和」挪到 M1 前 0.5 周，M1 由 1 周 → 1.5 周。**总盘不变**。

> 我**不建议**保留"1.5 周 + 九条全量"：出口 2 与出口 6 的依赖（设计侧裁定）不在研发手里，等于把不可控项压在关键路径上。

### 5.2 `合计 12–13 周`（`11-conclusions.md:160`）→ **判定：有条件可行**

- **成立前提**（缺一不可）：① M0 按方案 A 或 B 调整；② 两端各 1 人**满投入**（不做其他产品需求）；③ **A1 中文字体嵌入不进 v1.0**（见 5.4）；
- **缓冲不足的量化**：12.5 周 = 62.5 人日 里，M6（1.5 周）要同时吃"无障碍回归 + 截图基线 + 双端同 tag 发布"，没有返工余量；而 M0 出口里**4 项依赖设计侧未裁定**、设计侧只有 0.5 人。建议在 12–13 周里显式留 **1 周缓冲**（把 M6 的 1.5 周写成"发布 + 缓冲"），否则第一个被牺牲的一定是截图基线。

### 5.3 `串行人力约 16–18 周`（`11-conclusions.md:160`）→ **判定：偏乐观，建议改为 21–23 周**

- 依据：并行口径是「1 iOS + 1 Android + 0.5 设计」，两端并行 12.5 周 ≈ **25 人周**。串行时**只有"共享工作"能省**：令牌/生成器（§4.1 D1–D4，约 3 人日）、设计评审与画廊（D5/D6，约 4 人日）、跨端对照评审（约 3 人日）≈ **10 人日 ≈ 2 人周**；而**组件实现、两端各自的组件测试/截图、公开面维护（apiDump/形态冻结）在串行时完全不省**，是逐端各做一遍。
  → 串行估算 ≈ 25 − 2 ≈ **23 人周**；16–18 周相当于假设"共享工作能省 7–9 人周"，与上面逐项相加的 2 人周差 3–4 倍。
- **若必须落在 16–18 周**：唯一可行路径是缩范围——`11-conclusions.md:642` 的风险对策已写「先做 P0（20 项以内）」。请把这条从"风险对策"升级为**口径**：v1.0 = 20 个 P0 组件 + 5 配方；否则 16–18 周不成立（我会在评审里反对按 37 组件承诺 16–18 周）。

### 5.4 被排期**漏掉**的独立工作流（第一轮没进关键路径）

| 项 | 为什么不是 0 人日 |
| --- | --- |
| **A1 中文字体嵌入**（`11-conclusions.md:185`） | 需要：字体选型 + 商用授权确认（MiSans / HarmonyOS Sans SC）+ 子集化工具链 + **9MB+ 体积由谁承担**的产物决策；iOS 侧 SPM 库不能自带 `Info.plist`，宿主必须声明字体文件 → **跨仓库交付契约**。建议单列里程碑或明确"v1.0 不嵌入"。 |
| **Android 动态取色**（`11-conclusions.md:187`） | 若宿主调 `dynamicLightColorScheme()`，`LocalWDColors` 与 M3 桥接会**分叉**（Wisdom 语义色不变、M3 变）。要么 M1 明确"不接入"，要么给出 opt-in 开关 + 一条断言。 |
| **iOS 26 chrome 与自绘 Tab 栏**（`11-conclusions.md:188`） | 需真机验证；影响 P0（Tab 尺寸验收口径）。这一项的时间成本在真机排期，不在编码。 |

---

## 6. 工程门禁复核

### 6.1 现状：哪些能在 M0 真跑，哪些只是纸面

| 门禁（`11-conclusions.md:164-173`） | 载体 | M0 能否真跑 | 证据 |
| --- | --- | --- | --- |
| 令牌生成一致 `--check` | `build.js` | ✅ **本轮实测通过**（exit 0，2 个文件 ✓） | 附录 A-1 |
| 对比度断言（alpha + 最不利） | **无** | ❌ 纸面 | `contrast/luminance/wcag` 0 命中 |
| 编译 | 无 CI | ⚠️ **两端都是纸面** | iOS：`swift build` 结构不可用（E6）；Android：本沙箱无法执行 `gradlew` |
| 公开 API 冻结（Android BCV） | 插件 + `api/wisdom-ui.api` | ⚠️ **半纸面**：载体齐全（`android/build.gradle.kts:6,11-13`、`wisdom-ui/build.gradle.kts:31`、207 行快照），但"`apiCheck` 是否真的挂在 `:wisdom-ui:build` 上"**本轮未验证**（命令跑不起来） | 附录 A-3 |
| 公开 API 冻结（iOS） | **无** | ❌ 纸面（且 `swift-api-digester` 需构建产物 → M3，与第一轮判断一致） | 无 CI、无 `.swiftinterface`、`.build` 无产物 |
| 快照回归 | **无** | ❌ 纸面（两端都没有截图/快照框架依赖） | `Package.swift` 零依赖；`libs.versions.toml` 无截图库 |
| 画廊与令牌一致 | **无** | ❌ 纸面 | E1 |
| 账目生成化 `contrast.json → docs/contrast-report.md` | **无** | ❌ 纸面 | E1/§2.3 #2 |
| 字面量 lint（SwiftLint / ktlint+detekt） | **无** | ❌ 纸面：**无任何 lint 配置文件**，且两端都未引入对应插件/依赖 | 全仓无 `.swiftlint.yml` / `detekt` / `.editorconfig`；`Package.swift` 零依赖 |

### 6.2 最小可跑版本（M0 目标，逐条给命令）

- **`wisdomdesign`（真源 + 断言 + 画廊，放这里最合理）**
  ```
  node tools/token-build/build.js   --check     # 已有
  node tools/token-build/contrast.js --check    # 新增（D3）
  node tools/token-build/gallery.js  --check    # 新增（D4）
  ```
  CI：ubuntu + node，无 Android/iOS 工具链依赖 → **最容易先跑起来，应作为 M0 第一个接入的门禁**。
- **`iOS`**：`xcodebuild -scheme WisdomUI -destination 'generic/platform=iOS' build`；测试 `xcodebuild test -destination 'platform=iOS Simulator,name=iPhone 17'`（macOS runner）。**不要**写 `swift build`。
- **`Android`**：`./gradlew :wisdom-ui:apiCheck :wisdom-ui:assembleDebug :wisdom-ui:testDebugUnitTest`（在 CI 里**显式列出** `apiCheck`，不要依赖"它挂在 build 上"这个未验证的假设）。
- **跨仓自动化**：`build.js:16-24` 的 `OUT_ROOT = path.resolve(ROOT, "..")` 要求三仓**同级 checkout**。CI 里用一次 checkout 三仓（或把生成物做成 PR 由 bot 提交）。这一条不定，出口 1/6 都无处落地（§7 未决 1）。

### 6.3 建议**移出** M0 的门禁（避免纸面门禁污染验收）

- 快照回归（浅/深 × 大字号 + RTL）→ M1（它本来就在 M1 出口里，不要同时写进 M0）。
- 字面量 lint → M1，且需要先裁定"是否接受给 iOS 库引入 SwiftLint 依赖"。
- iOS 公开 API 冻结 → M3（与第一轮一致）。
- 账目生成化（`docs/contrast-report.md`）→ 可以在 M0 先只做 `--check`（校验断言表与令牌一致），报告文件留 M1。

---

## 7. 未决问题（需要裁定，按最晚时间排序）

| # | 问题 | 需要谁定 | 最晚 |
| --- | --- | --- | --- |
| 1 | **跨仓 CI 拓扑**：`build.js` 的相对路径要求三仓同级 checkout；`--check` 在哪个仓库跑？生成物由谁提交？ | 队长 + 架构师 | M0 第 1 天 |
| 2 | **深色色晕 / 玻璃档位 / tint 配方 / 净 alpha 口径** 这 4 项从"落地时才关"提前到"开工前关闭"（否则 M0 出口 2/7/8 阻塞） | 设计师 | M0 第 1 天 |
| 3 | **iOS 每个 WD 字阶 `relativeTo` 哪个 `Font.TextStyle`**，AX3 的目标实测值是多少？（E7 的验收前提） | 设计师 + 研发Leader | M0 中 |
| 4 | `caption2` 行高：**改令牌比值 13→14** 还是 **改实现走 `NSParagraphStyle`**？（E5） | 研发Leader + 设计师 | M0 冻结形态前 |
| 5 | `WDTextStyle` 是否**去掉 data 语义**（对齐 `WDColors` 的处理）？`lineSpacing` 是否删除？（E8） | 研发Leader | M0 冻结形态前 |
| 6 | Material 3 桥接范围：**补全 48 角色**（设计侧工作）还是**显式收窄** + `surfaceTint` 兜底？（E9/E10/E11） | 架构师 + 设计师 | M0 |
| 7 | `minSdk`：保持 **24**（玻璃四要素缺"模糊"，需新增降级令牌）还是升 **31**？（E14，先做 API 30 实测） | 研发Leader + 用户 | M0 |
| 8 | **画廊的权威性**：M1 截图基线的对手件是画廊还是令牌？画廊是否降级为"纯生成产物、不含手写选择器数值"？（E1/E2/E12） | 设计师 + 架构师 | M0 |
| 9 | **A1 字体嵌入**是否进 v1.0？体积（9MB+）与授权由谁承担？（§5.4） | 用户 | M1 前 |
| 10 | E4 `letterSpacing` 的覆盖范围：只给 `overline`，还是全字阶可给（默认 0）？ | 设计师 | 与 #5 同批 |
| 11 | 「工具链升级」（AGP ≥ 9.1.0 / compileSdk 37 / Gradle 9）排在哪个里程碑？是否承诺 v1.0 内完成？ | 队长 + 研发Leader | M1 |

---

## 附录 A：命令与输出

**A-1 令牌生成一致性（唯一跑通的门禁）**
```
$ cd wisdomdesign && node tools/token-build/build.js --check
✓ iOS/Sources/WisdomUI/Foundation/Generated/WDTokens.swift
✓ android/wisdom-ui/src/main/kotlin/io/github/wlunc/wisdom/foundation/Generated/WDTokens.kt
$ echo $?
0
```

**A-2 iOS 编译门禁不可用（E6）**
```
$ swift build            # 在 iOS/ 下
error: 'ios': Invalid manifest ...
sandbox-exec: sandbox_apply: Operation not permitted

$ printf 'import UIKit\nlet c = UIColor.red\n' > p.swift && swiftc -module-cache-path ./.mc -o p p.swift
p.swift:1:8: error: no such module 'UIKit'
        `- error: no such module 'UIKit'
$ printf 'import SwiftUI\nlet x = 1\n' > q.swift && swiftc -module-cache-path ./.mc -o q q.swift
$ echo $?      # 0 —— SwiftUI 可用、UIKit 不可用，即宿主 macOS target 编译不了 WisdomUI
```

**A-3 Android CLI 在本沙箱不可用（§1.3）**
```
$ cd android && ./gradlew --offline :wisdom-ui:apiCheck
Exception in thread "main" java.io.FileNotFoundException:
  /Users/.../.gradle/wrapper/dists/gradle-8.14.5-bin/.../gradle-8.14.5-bin.zip.lck (Operation not permitted)
GRADLE_EXIT=1
```

**A-4 AAR 元数据（E13）**
```
$ unzip -p <cache>/androidx.compose.ui/ui-android/1.11.4/*/ui.aar META-INF/com/android/build/gradle/aar-metadata.properties
minCompileSdk=35
minAndroidGradlePluginVersion=8.6.0
$ unzip -p <cache>/androidx.compose.ui/ui-android/1.12.1/*/ui.aar META-INF/com/android/build/gradle/aar-metadata.properties
minCompileSdk=37
minAndroidGradlePluginVersion=9.1.0
$ ls ~/Library/Android/sdk/platforms
android-33  android-34  android-36
$ ls <cache>/androidx.compose/compose-bom
2026.06.01  2026.09.00
```

**A-5 Material 3 基线回落（E9）**
```
$ javap -c -p -cp classes.jar androidx.compose.material3.ColorSchemeKt | grep -c ColorLightTokens
220
$ javap -c -p -cp classes.jar androidx.compose.material3.ColorSchemeKt | grep -c ColorDarkTokens
220
$ javap -c -p -cp classes.jar androidx.compose.material3.tokens.ColorLightTokens | sed -n '/static {}/,+20p'
  10: getstatic  PaletteTokens.INSTANCE
  13: invokevirtual PaletteTokens."getNeutral98-0d7_KjU":()J
  16: putstatic  Background:J
  ...
  22: invokevirtual PaletteTokens."getError40-0d7_KjU":()J
```

**A-6 对比度与行高复算（E5/E2/E10/E11）**
```
light:  onPrimary/pimary            4.86      onBackground on canvas       16.36
        onSurfaceVariant             6.96      error(#B8564D) on canvas      4.37
        error on #FFFFFF             4.69      onError(基线白) on error      4.69
        outline(#0A1B2429→#D8DADC)   1.40
dark:   onPrimary #0A1B2A on #7EC4CF 8.88     outline(#FFFFFF2E→#384955)    1.77
画廊暗色 glass-strong 合成 #0C1D2D：--g-brand #1677B3 → 3.52 ；令牌 #7EC4CF → 8.69
8% 基线紫 #6750A4 on 白 → #F3F1F8
行高：body(17/22) 偏差 +3.29pt(+15.0%)；largeTitle(34/41) +6.58pt(+16.0%)；caption2(11/13) 正确追加 −0.13pt
```

**A-7 计数与缺失取证（E1/E4/E12/§2）**
```
$ grep -o -E '--g-[a-z0-9-]+:' gallery/wisdom-components.html | sort -u | wc -l
35
$ grep -n -o -E '--g-brand:[^;]{0,20}' gallery/*.html
gallery/wisdom-components.html:1544:--g-brand:#1677B3
gallery/wisdom-advanced.html:1543:--g-brand:#1677B3
gallery/wisdom-patterns.html:1543:--g-brand:#1677B3
$ grep -n -o -E 'wd-tabbar\{[^}]{0,160}' gallery/wisdom-components.html
1819:wd-tabbar{...height:58px;...background:var(--g-glass-strong);...backdrop-filter:blur(20px)...}
$ grep -c -o 'dir=' gallery/*.html preview/*.html        # 全部 0
$ grep -o -w left|right  计数： 48 / 46（4 个文件合计；components 单文件 12 / 15）
$ grep -rn -icE 'contrast|luminance|wcag' iOS/Sources android/wisdom-ui/src wisdomdesign/tools wisdomdesign/tokens
（全部 0）
$ grep -rn -iE 'WDLocalization|localiz|stringResource|formatter' iOS/Sources android/wisdom-ui/src
（无输出）
$ awk 'NR==3' android/wisdom-ui/api/wisdom-ui.api | tr -cd 'J' | wc -c
27      # WDColors 仍是 27 参公开构造
$ find iOS android wisdomdesign -maxdepth 2 -name '.github' -o -name '*.yml' -o -name '*.yaml'
（无输出 —— 三仓均无 CI 配置）
```

## 附录 B：本轮**无法判定**的清单（需在 CI / 真机上补）

| 项 | 需要的动作 |
| --- | --- |
| 出口 3「两端能编译」 | macOS runner 上 `xcodebuild ... build`；Android runner 上 `:wisdom-ui:assembleDebug` |
| `apiCheck` 是否挂在 `:wisdom-ui:build` 上 | Android runner 上跑 `:wisdom-ui:apiCheck` 与 `:wisdom-ui:build`，比较任务图 |
| `Modifier.blur` 在 API 24–30 的实际行为（E14） | API 30 设备或 instrumented test 渲染 `material.regular` 玻璃层 |
| M3 基线色的具体 hex（E9） | 有网络/设备时读 `ColorLightTokens` 各字段值（本轮只能证明"回落来源"） |
| iOS 各字阶的天然行高实测值（E5） | 模拟器上跑度量测试，输出 `UIFont`/`CTFont` 的 ascent+descent+leading |
| AX3 / fontScale 1.3 / 2.0 的截断回归（E7） | 两端各自的截图或布局断言 |
