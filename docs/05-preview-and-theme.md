# 05 · 组件预览与主题

## 1. 预览要解决的是"谁看得到"

Xcode Preview 和 Android Studio Preview 都是开发者本机的东西，设计和产品看不到，也就谈不上人工审核。
所以预览分三层，后两层共用同一批 PNG，不维护两套。

| 层 | 给谁 | 载体 | 产出 |
| --- | --- | --- | --- |
| IDE Preview | 开发者 | Xcode `#Preview` / Compose `@Preview` | 不落盘 |
| 截图回归 | CI | swift-snapshot-testing / Compose Screenshot Testing | PNG 基线 |
| 规格画廊 | 设计 · 产品 | 静态 HTML | 浏览器可直接审 |

## 2. 规格画廊

`design/gallery/wisdom-components.html` 是基础层 20 个组件的规格画廊，自包含 HTML，可直接用浏览器打开。

每个组件一节，包含：

- **变体**：这个组件有哪几种外观，横向平铺便于比对
- **状态**：默认 / 按下 / 聚焦 / 禁用 / 加载 / 选中
- **尺寸**：sm / md / lg（有尺寸阶梯的组件）
- **动作**：一行文字说明每个交互会发生什么，审核的人不用猜状态是怎么来的

**浅色与深色并排**，同一份标记克隆成两列。深浅色的问题大多出在"只调了浅色"，
并排是最省事的发现方式。

画廊的样式直接照抄 `tokens/wisdom.tokens.json` 的色值（写在 `<style>` 顶部的 `--g-*` 变量里），
所以画廊本身就是令牌的一次落地验证：令牌改了，画廊跟着改，实现再对齐画廊。

> 高级组件 16 个与场景组件 7 个是第二批，结构相同。

## 3. 用例清单跨端共享

如果 iOS 展示 6 个变体、Android 展示 8 个，人工审核时无从比对。
所以用例名称是契约：`preview-cases/*.yaml` 定义每个组件要展示哪些用例，两端各自实现，CI 检查名称对齐。

```yaml
component: WDButton
cases:
  gallery: { axes: [filled, tonal, glass, outline, plain, destructive] }
  states:  { axes: [default, pressed, focused, disabled, loading] }
  sizes:   { axes: [sm, md, lg] }
  actions:
    - do: 点击
      then: 触发提交，按钮原地进入 loading，宽度不变
    - do: 长按
      then: 弹出上下文菜单
```

## 4. 主题

### 结构

一个主题包含**浅色与深色两套语义色**，再加与外观无关的字阶、圆角、阴影、动效：

```
tokens/wisdom.tokens.json
├── semantic.light   ← 浅色版
└── semantic.dark    ← 深色版
```

两端令牌都是这份 JSON 生成的，所以**换主题 = 改 token 后重新生成**，
不需要动任何组件代码。

### 注入

| | 机制 | 状态 |
| --- | --- | --- |
| Compose | `WDTheme { }` + `LocalWDColors` | M1 已完成 |
| SwiftUI | `WDTheme` 值 + Environment | **M2 待补** |

M1 的 SwiftUI 侧只有静态 `WDColor.textPrimary`，拿不到环境，换不了主题。
M2 要补上注入层，组件一律从环境取值，不再直接引用静态令牌。

设计上有一点必须讲清楚：**`Color` 保持动态（浅深自动切换）不变，主题换的是"哪一组动态色"**。
浅深逻辑留在它该在的地方（Color 内部），主题只负责换一组。

```swift
ContentView().wdTheme(.default)
WDCard { ... }.wdTheme(.holiday)   // 子树局部换主题
```

### 约束

- **浅深必须成对**：自定义主题只给浅色，深色模式上线才发现崩，生成器要直接报错
- **冲突时以浅色为准**：浅色是主交付，深色是配套。两者的取舍打架时，保留浅色的判断
- 间距与组件尺寸**不可主题化**：换间距会直接毁掉布局，它们不属于主题
