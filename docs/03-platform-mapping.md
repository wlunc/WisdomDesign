# 03 · 令牌到 SwiftUI / Compose 的映射

目标：**同一套令牌，两端各自写出地道的代码**。组件 API 不追求同名，但变体、状态、视觉重量必须一一对应。

## 1. 目录结构建议

```
WisdomDesign/
├── tokens/wisdom.tokens.json     唯一真源
├── tools/token-build/            JSON → Swift / Kotlin 生成器（v0.2）
├── ios/Sources/WisdomUI/
│   ├── Foundation/               WdColor / WdType / WdRadius / WdSpace / WdMotion / GlassSurface
│   └── Components/               Button / Card / ListRow / TabBar …
└── android/wisdom-ui/src/main/java/com/wisdom/ui/
    ├── foundation/               WdColors / WdTypography / WdShapes / WdMotion / glassSurface
    └── components/
```

## 2. 命名对照

| 概念 | 令牌 | SwiftUI | Compose |
| --- | --- | --- | --- |
| 主色 | `color.brand.600` | `WdColor.brand600` | `WdColors.brand600` |
| 页面底 | `semantic.bg.canvas` | `WdColor.canvas` | `WdTheme.colors.canvas` |
| 卡片面 | `semantic.surface.card` | `WdColor.surfaceCard` | `WdTheme.colors.surfaceCard` |
| 主文案 | `semantic.text.primary` | `WdColor.textPrimary` | `WdTheme.colors.textPrimary` |
| 圆角 | `radius.xl` | `WdRadius.xl` | `WdShapes.xl` |
| 间距 | `space.5` | `WdSpace.s5` | `WdSpace.s5` |
| 字阶 | `type.headline` | `WdType.headline` | `WdTheme.typography.headline` |
| 弹簧 | `motion.spring.gentle` | `WdMotion.gentle` | `WdMotion.gentle` |

## 3. SwiftUI 侧

### 3.1 基础层（生成产物，勿手改）

```swift
import SwiftUI

public enum WdColor {
    // 原始层
    public static let brand600 = Color("brand600")        // #2F7F63
    public static let brand100 = Color("brand100")        // #E0F0E8
    // 语义层（Color Asset 内配置 Any / Dark 两套外观）
    public static let canvas        = Color("canvas")
    public static let surfaceCard   = Color("surfaceCard")
    public static let textPrimary   = Color("textPrimary")
    public static let textSecondary = Color("textSecondary")
    public static let hairline      = Color("hairline")
    public static let glassTop      = Color("glassTop")
}

public enum WdRadius {
    public static let xs: CGFloat = 8,  sm: CGFloat = 10, md: CGFloat = 14
    public static let lg: CGFloat = 18, xl: CGFloat = 24, xxl: CGFloat = 32
}

public enum WdSpace {
    public static let s2: CGFloat = 4,  s3: CGFloat = 8,  s4: CGFloat = 12
    public static let s5: CGFloat = 16, s7: CGFloat = 24, s8: CGFloat = 32
}

public enum WdMotion {
    public static let gentle = Animation.spring(response: 0.40, dampingFraction: 0.85)
    public static let snappy = Animation.spring(response: 0.28, dampingFraction: 0.82)
    public static let bouncy = Animation.spring(response: 0.42, dampingFraction: 0.68)
}
```

### 3.2 玻璃容器

iOS 26 直接使用系统玻璃效果，低版本降级为 Material + 描边。

```swift
public struct WdGlass<Content: View>: View {
    var radius: CGFloat = WdRadius.xl
    var tint: Color = .white.opacity(0.72)
    @ViewBuilder var content: () -> Content

    private var shape: RoundedRectangle {
        RoundedRectangle(cornerRadius: radius, style: .continuous)   // 连续曲率
    }

    public var body: some View {
        if #available(iOS 26.0, *) {
            content()
                .glassEffect(.regular.tint(tint), in: .rect(cornerRadius: radius))
        } else {
            content()
                .background(.ultraThinMaterial, in: shape)            // 1 模糊
                .background(tint, in: shape)                          // 2 填充
                .overlay {                                            // 3 顶部高光
                    shape.strokeBorder(
                        LinearGradient(colors: [WdColor.glassTop, WdColor.hairline],
                                       startPoint: .top, endPoint: .bottom),
                        lineWidth: 1
                    )
                }
                .clipShape(shape)
        }
    }
}
```

### 3.3 组件示例

```swift
public struct WdButton: View {
    public enum Variant { case filled, tonal, glass, outline, plain, destructive }
    public enum Size: Int { case sm, md, lg
        var height: CGFloat { [32, 44, 52][rawValue] }
        var paddingX: CGFloat { [12, 16, 20][rawValue] }
    }

    var title: String
    var variant: Variant = .filled
    var size: Size = .md
    var isLoading = false
    var action: () -> Void

    public var body: some View {
        Button(action: action) {
            ZStack {
                Text(title).opacity(isLoading ? 0 : 1)
                if isLoading { ProgressView() }
            }
            .font(WdType.headline)
            .frame(minHeight: size.height)
            .padding(.horizontal, size.paddingX)
        }
        .buttonStyle(WdPressStyle())          // 缩放 0.97 + 亮度 96%
        .disabled(isLoading)
        .accessibilityLabel(isLoading ? "\(title)，处理中" : title)
    }
}
```

## 4. Compose 侧

### 4.1 基础层

```kotlin
// 生成产物，勿手改
@Immutable
data class WdColors(
    val canvas: Color,
    val surfaceCard: Color,
    val textPrimary: Color,
    val textSecondary: Color,
    val hairline: Color,
    val glassTop: Color,
    val brand600: Color,
    val brand100: Color,
)

internal val WdLightColors = WdColors(
    canvas = Color(0xFFF5F8F6), surfaceCard = Color(0xFFFFFFFF),
    textPrimary = Color(0xFF1B1F1D), textSecondary = Color(0xFF626C66),
    hairline = Color(0x141B1F1D), glassTop = Color(0x8CFFFFFF),
    brand600 = Color(0xFF2F7F63), brand100 = Color(0xFFE0F0E8),
)

internal val WdDarkColors = WdColors(
    canvas = Color(0xFF0F1211), surfaceCard = Color(0xFF1A1E1C),
    textPrimary = Color(0xFFEFF3F0), textSecondary = Color(0xFFA8B4AD),
    hairline = Color(0x1AFFFFFF), glassTop = Color(0x24FFFFFF),
    brand600 = Color(0xFF66B192), brand100 = Color(0xFF17332A),
)

val LocalWdColors = staticCompositionLocalOf { WdLightColors }

object WdTheme {
    val colors: WdColors @Composable @ReadOnlyComposable get() = LocalWdColors.current
}

object WdSpace { val s2 = 4.dp; val s3 = 8.dp; val s4 = 12.dp; val s5 = 16.dp; val s7 = 24.dp }

object WdShapes {
    val xs = RoundedCornerShape(10.dp)    // 令牌 8 + 2，补偿曲率差异
    val md = RoundedCornerShape(16.dp)    // 令牌 14 + 2
    val xl = RoundedCornerShape(26.dp)    // 令牌 24 + 2
    val xxl = RoundedCornerShape(34.dp)   // 令牌 32 + 2
}

object WdMotion {
    val gentle = spring<Float>(dampingRatio = 0.85f, stiffness = 380f)
    val snappy = spring<Float>(dampingRatio = 0.82f, stiffness = 900f)
    val bouncy = spring<Float>(dampingRatio = 0.68f, stiffness = 300f)
}

@Composable
fun WisdomTheme(darkTheme: Boolean = isSystemInDarkTheme(), content: @Composable () -> Unit) {
    CompositionLocalProvider(LocalWdColors provides if (darkTheme) WdDarkColors else WdLightColors) {
        MaterialTheme(
            colorScheme = if (darkTheme) wdDarkScheme else wdLightScheme,   // 供 M3 组件消费
            shapes = Shapes(small = WdShapes.xs, medium = WdShapes.md,
                            large = WdShapes.xl, extraLarge = WdShapes.xxl),
            typography = WdTypography,
            content = content,
        )
    }
}
```

### 4.2 玻璃容器

Compose **没有原生的背景模糊**（`Modifier.blur` 模糊的是自身内容，不是背后内容）。两条路线：

| 方案 | 做法 | 取舍 |
| --- | --- | --- |
| 推荐 | 引入 Haze 库（`dev.chrisbanes.haze`）做 backdrop blur | 效果接近原生，多一个依赖 |
| 降级 | 88% 不透明纯色 + 顶部高光描边 + hairline | 无依赖，通透感略低 |

```kotlin
fun Modifier.glassSurface(
    shape: Shape = WdShapes.xl,
    tint: Color = Color.White.copy(alpha = 0.72f),
): Modifier = this
    .clip(shape)
    .background(tint)                                  // 2 填充（用 Haze 时由 hazeEffect 提供模糊）
    .border(                                          // 3 顶部高光 + 外圈 hairline
        width = 1.dp,
        brush = Brush.verticalGradient(listOf(WdTheme.colors.glassTop, WdTheme.colors.hairline)),
        shape = shape,
    )
    .shadow(12.dp, shape, ambientColor = Color(0x0F101A14), spotColor = Color(0x0F101A14))
```

### 4.3 组件示例

```kotlin
enum class WdButtonVariant { Filled, Tonal, Glass, Outline, Plain, Destructive }
enum class WdButtonSize(val height: Dp, val paddingX: Dp) {
    Sm(32.dp, 12.dp), Md(44.dp, 16.dp), Lg(52.dp, 20.dp)
}

@Composable
fun WdButton(
    title: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    variant: WdButtonVariant = WdButtonVariant.Filled,
    size: WdButtonSize = WdButtonSize.Md,
    loading: Boolean = false,
) {
    val c = WdTheme.colors
    val (bg, fg) = when (variant) {
        WdButtonVariant.Filled      -> c.brand600 to Color.White
        WdButtonVariant.Tonal       -> c.brand100 to c.brand600
        WdButtonVariant.Glass       -> Color.Transparent to c.textPrimary
        WdButtonVariant.Outline     -> Color.Transparent to c.textPrimary
        WdButtonVariant.Plain       -> Color.Transparent to c.brand600
        WdButtonVariant.Destructive -> WdDanger to Color.White
    }
    Surface(
        onClick = onClick,
        enabled = !loading,
        shape = RoundedCornerShape(percent = 50),
        color = bg,
        contentColor = fg,
        border = if (variant == WdButtonVariant.Outline) BorderStroke(1.dp, c.hairline) else null,
        modifier = modifier
            .height(size.height)
            .semantics { contentDescription = if (loading) "$title，处理中" else title },
    ) {
        Row(
            Modifier.padding(horizontal = size.paddingX).fillMaxHeight(),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            if (loading) {
                CircularProgressIndicator(Modifier.size(18.dp), strokeWidth = 2.dp)
            } else {
                Text(title, style = WdTheme.typography.headline)
            }
        }
    }
}
```

## 5. 需要特别处理的差异

| 主题 | iOS | Android | 处理方式 |
| --- | --- | --- | --- |
| 连续圆角 | `.continuous` | 只有普通圆角 | Compose 数值 +2 补偿 |
| 背景模糊 | `.glassEffect` / Material | 需 Haze 或降级 | 抽象成 `glassSurface`，两端同一套调用 |
| 动态字体 | Dynamic Type（pt 缩放） | `fontScale`（sp） | 全部用相对字号，禁止固定行高裁切 |
| 返回 | 边缘右滑手势 + 返回按钮 | 预测式返回 + 返回箭头 | 交互各自原生，按钮视觉统一 |
| 触觉 | `UIImpactFeedbackGenerator` | `HapticFeedback` / `Vibrator` | 抽象成 `WdHaptic.light / success / warning` |
| 日期选择 | 滚轮 / 图形日历 | M3 DatePicker | 保留各自原生控件，只统一触发入口样式 |
| 图标 | SF Symbols | Material Symbols Rounded | 维护语义名称对照表，不逐像素对齐 |

## 6. 常用图标对照（节选）

| 语义 | SF Symbols | Material Symbols |
| --- | --- | --- |
| 首页 | `house.fill` | `home` |
| 成员 | `person.2.fill` | `group` |
| 日历 | `calendar` | `calendar_month` |
| 提醒 | `bell.fill` | `notifications` |
| 搜索 | `magnifyingglass` | `search` |
| 设置 | `gearshape.fill` | `settings` |
| 新增 | `plus` | `add` |
| 更多 | `ellipsis` | `more_horiz` |
| 进入 | `chevron.right` | `chevron_right` |
| 完成 | `checkmark.circle.fill` | `check_circle` |
| 删除 | `trash` | `delete` |

## 7. 新增组件的工作流

1. 先在 `docs/02-components.md` 写清结构、尺寸、状态、无障碍。
2. 缺的数值先进 `tokens/wisdom.tokens.json`，不在组件里写死。
3. 两端各实现一遍，SwiftUI Preview / Compose Preview 覆盖全部变体与状态。
4. 通过无障碍检查（动态字体 AX3、屏幕阅读器、对比度）。
5. 截图回归：浅色 / 深色 / 大字号三组快照进版本库。

