# Wisdom Design System

面向**工具类 App** 的移动端组件库。一套设计令牌，两端原生实现。

| 平台 | 技术 | 状态 |
| --- | --- | --- |
| iOS | SwiftUI | 设计定稿 v1.0 |
| Android | Jetpack Compose | 设计定稿 v1.0 |

## 设计基调

- **明亮** — 品牌色落在明亮蓝系，阴影带品牌色而非纯黑，页面底色是一层柔和色晕
- **清新** — 通透留白、轻量玻璃层、克制的彩色面积
- **自然** — 色相取自湖水与天光，中性色带青灰倾向，不用纯黑纯白
- **温和** — 大圆角、低对比阴影、柔和语义色，没有锐角硬边
- **家庭** — 亲和的语言、圆润的图标底座、成员与共享类场景组件
- **工具** — 密度可控、状态可预期、每个操作都有即时反馈

视觉语言参考 **iOS 26 的 Liquid Glass**：半透明材质 + 边缘高光 + 同心圆角 + 悬浮导航。
Android 端用 Material 3 Expressive 的对应能力做等效还原。

## 定稿色板 · 温和蓝

主色是天蓝 `#1677B3` 与湖蓝 `#B0D5DF`。十二个色按层位分两段：**浅段做背景，深段做组件**。

| 层 | 用色 | 组件填充 |
| --- | --- | --- |
| 浅色版 | 湖水蓝 `#B0D5DF` / 天青 `#7EC4CF` | `#8FCFDD → #63BAD2` 配深蓝字 `#0E3A55` |
| 深色版 | 深蓝底 `#0A1B2A` | `#1677B3 → #2A5CAA` 配白字 |

语义色全部降饱和：成功 `#2A7F5C` · 信息 `#1677B3` · 警示 `#97651F` · 危险 `#B8564D`。
按钮、开关、勾选、进度等控件一律用蓝，红黄只出现在语义提示里。

## 三个仓库

本仓库只管设计，组件实现分别在两个平台仓库里：

```
WisdomDesign/                  容器目录，本身不是 git 仓库
├── iOS/                       → github.com/wlunc/WisdomDesign-iOS      SPM
├── android/                   → github.com/wlunc/WisdomDesign-Android  Maven Central
└── wisdomdesign/              本仓库：设计令牌与规范
```

## 目录

```
wisdomdesign/
├── docs/
│   ├── 01-foundation.md        设计原则与基础（色彩/字体/间距/形状/材质/动效/无障碍）
│   ├── 02-components.md        组件清单与关键组件规格
│   ├── 03-platform-mapping.md  令牌到 SwiftUI / Compose 的落地映射
│   └── 04-architecture.md      工程架构：三仓库划分、组件分层、命名、分发
├── tokens/
│   └── wisdom.tokens.json      设计令牌唯一真源（DTCG 格式）
├── tools/
│   └── token-build/build.js    令牌生成器，输出到两个平台仓库
└── design/
    └── preview/
        └── wisdom-light.html   浅色版完整预览（自包含，可直接用浏览器打开）
```

## 生成令牌

```bash
node tools/token-build/build.js          # 生成到 ../iOS 与 ../android
node tools/token-build/build.js --check  # 只校验生成产物与提交是否一致
```

## 令牌流向

```
tokens/wisdom.tokens.json   ← 唯一真源，只在这里改数值
        │
        ├─→ build/swift  ──→ SwiftUI  Theme.swift + Colors.xcassets
        └─→ build/kotlin ──→ Compose  WdTheme.kt（ColorScheme / Shapes / Typography）
```

规则：**组件代码里不允许出现字面量色值、字号、圆角、间距**，只能用令牌生成的语义变量。
这一条是跨端一致性的唯一保障。

## 命名约定

| 层级 | 示例 | 说明 |
| --- | --- | --- |
| 原始层 `color.named.*` | `color.named.blue` | 定稿色卡的十二个色，只作对照 |
| 派生层 `color.derived.*` | `color.derived.text-on-fill` | 由色卡派生并验证过对比度 |
| 中性层 `color.su.*` | `color.su.900` | 青灰中性色阶 |
| 语义层 `semantic.*` | `semantic.text.secondary` | 界面只用这一层 |

## Roadmap

| 阶段 | 内容 |
| --- | --- |
| v0.1 | 设计基础 + 令牌 + 组件清单 + 关键组件规格 |
| v0.2 | 明亮化配色 + 渐变令牌 + 玻璃材质细化 + Checkbox 改版 + 动效规范 |
| **v1.0（当前）** | 温和蓝定稿：色板、语义色、两版分工写入令牌与规范 |
| v1.1 | 设计令牌编译器（JSON → Swift / Kotlin） |
| v1.2 | SwiftUI 组件实现 + SwiftUI Preview 画廊 |
| v1.3 | Compose 组件实现 + Compose Preview 画廊 |
| v1.4 | 无障碍与动态字体验证、深浅色回归 |
