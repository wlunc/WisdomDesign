# 04 · 工程架构

## 1. 仓库划分

三个独立仓库，本地放在同一个容器目录下：

```
WisdomDesign/                  ← 容器目录，本身不是 git 仓库
├── iOS/                       → github.com/wlunc/WisdomDesign-iOS
├── android/                   → github.com/wlunc/WisdomDesign-Android
└── wisdomdesign/              → github.com/wlunc/WisdomDesign（本仓库）
```

| 仓库 | 内容 | 分发方式 |
| --- | --- | --- |
| `wisdomdesign` | 设计令牌、规范文档、设计预览、令牌生成器 | 不发布产物，供生成器读取 |
| `WisdomDesign-iOS` | SwiftUI 组件库 `WisdomUI` | SPM，Git tag 版本 |
| `WisdomDesign-Android` | Compose 组件库 `wisdom-ui` | Maven Central |

**为什么不放一个仓库**：远程 SPM 依赖不支持子目录。
`PackageDescription` 只有 `package(url:from:)` / `package(path:)` 等签名，
`path:` 仅用于本地路径依赖，远程仓库必须把 `Package.swift` 放在根目录。
既然 iOS 目录必须自成仓库，Android 对称处理，设计资料独立成第三个仓库。

**代价与对策**：令牌跨仓库同步。对策是生成器 + 生成产物入库：
`wisdomdesign/tools/token-build` 读 `tokens/wisdom.tokens.json`，
输出到两个平台仓库的 `Foundation/Generated/`，生成文件一并提交。
平台仓库的 CI 只校验「生成产物与提交一致」，不需要访问设计仓库。

## 2. 组件分层

前三层是对外暴露的组件，第 0 层是它们的前提。

| 层 | 判断标准 | 数量 |
| --- | --- | --- |
| 0 · Foundation | 令牌、主题、修饰符、触觉、无障碍辅助，不算组件 | — |
| 1 · 基础组件 | 单一职责、无内部状态机、直接对应平台原生控件 | 20 |
| 2 · 高级组件 | 由基础组件组合，带状态机与交互流程 | 16 |
| 3 · 场景组件 | 带产品语义，需要业务上下文 | 7 |

### 基础组件 Primitives（20）

Button · IconButton · TextField · SearchField · Switch · Checkbox · Radio · Slider · Stepper · Chip · Badge · Avatar · AvatarStack · Divider · ProgressBar · ProgressRing · Card · ListRow · ListSection · Icon

### 高级组件 Composites（16）

SegmentedControl · Picker · DatePicker · FormRow · Alert · BottomSheet · ActionSheet · Toast · Banner · EmptyState · Skeleton · PullToRefresh · NavigationBar · TabBar · Toolbar · FAB

### 场景组件 Patterns（7）

TaskRow · MemberPicker · AssigneePicker · SharedBadge · StreakRing · ReminderChip · FamilySpaceCard

`docs/02-components.md` 的 A–F 是按功能分类，便于查阅；这里的四层是按依赖分类，便于排期。两者并存，实现顺序以本文为准。

## 3. 命名规范

**类型前缀统一 `WD`**，两端一致。Kotlin 里 `Button` 已被 Compose Material 占用，不加前缀必然冲突；Swift 虽然靠模块命名空间隔离，但 `Card`、`Badge` 这类通用名不加前缀会很痛。两端同名还让文档、设计稿、跨端沟通只需写一个名字。

| 场景 | 规则 | 示例 |
| --- | --- | --- |
| 组件与类型 | `WD` + 名词（UpperCamelCase） | `WDButton` `WDColor` `WDTheme` |
| 变体枚举 | `WD` + 组件 + `Variant` / `Size` / `State` | `WDButtonVariant` `WDButtonSize` |
| Swift 修饰符 | `.wd` 小写前缀 | `.wdCardStyle(.elevated)` |
| Compose 修饰符 | `.wd` 小写前缀 | `Modifier.wdCard(...)` |
| 令牌 | Swift 静态命名空间 / Compose 主题属性 | `WDColor.textPrimary` / `WDTheme.colors.textPrimary` |

前后缀大小写跟随语言惯例：类型用 `WD`，成员与修饰符用 `wd`，字母一致。

### 平台惯例差异

| 主题 | SwiftUI | Compose |
| --- | --- | --- |
| 外观表达 | 修饰符：`WDCard { }.wdCardStyle(.elevated)` | 参数：`WDCard(style = WDCardStyle.Elevated)` |
| 主题入口 | 无需主题对象，`Color` 自带深浅色 | `WDTheme { }`，对标 `MaterialTheme` |
| `Modifier` | 不适用 | 必选参数之后的第一个可选参数 |

SwiftUI 的 `WDButton` 内部用系统 `Button` + 自定义 `ButtonStyle` 实现，同时把 style 暴露出去，需要系统行为的人可以 `Button { }.buttonStyle(.wdFilled)`。

## 4. 版本与兼容

| 项 | 决定 |
| --- | --- |
| 最低版本 | iOS 17.0 / Android minSdk 24 |
| Liquid Glass | iOS 26+ 走 `glassEffect`，17–25 降级为材质 + 描边；Android 12+ 走背景模糊，以下降级为纯色 + 描边 |
| 版本策略 | 两端锁同一版本号，`v1.0.0` 的 tag 同时对应 SPM 与 Maven |
| API 稳定性 | Kotlin 开 `explicitApi()` + `binary-compatibility-validator`；Swift 只导出 `public` |

## 5. 分发

### iOS · SPM

```swift
.package(url: "https://github.com/wlunc/WisdomDesign-iOS.git", from: "1.0.0")

.target(
    name: "YourApp",
    dependencies: [.product(name: "WisdomUI", package: "WisdomDesign-iOS")]
)
```

仓库名 `WisdomDesign-iOS`，产品名 `WisdomUI`，这处错配最容易写错，README 里要写明。走源码分发而非 XCFramework——设计系统应该让使用方能读实现、能调试。

### Android · Maven Central

发布用 `com.vanniktech.maven.publish` 插件（sources/javadoc jar、签名、POM、Central Portal 都封装好了）。
`groupId` 用 `io.github.wlunc`——Sonatype 对 `io.github.<用户名>` 命名空间可以用 GitHub 仓库自动验证，不用买域名。

消费方用 version catalog：

```toml
[versions]
wisdom = "1.0.0"

[libraries]
wisdom-ui = { module = "io.github.wlunc.wisdom:wisdom-ui", version.ref = "wisdom" }
```

## 6. 令牌流水线

```
tokens/wisdom.tokens.json            唯一真源（DTCG）
        │
        │  tools/token-build/build.js
        │
        ├─→ ../iOS/Sources/WisdomUI/Foundation/Generated/WDTokens.swift
        └─→ ../android/wisdom-ui/src/main/kotlin/io/github/wlunc/wisdom/foundation/Generated/WDTokens.kt
```

```bash
node tools/token-build/build.js          # 生成
node tools/token-build/build.js --check  # 只校验，CI 用
```

生成规则：

- 颜色解析 `#RRGGBB` 与 `#RRGGBBAA`（RGBA 顺序），浅深两值都生成
- 尺寸类令牌一步到位生成 `CGFloat` / `Dp`
- 字号生成 `Font` / `TextStyle`
- 生成文件头写「请勿手改」，改动只从 JSON 出

## 7. 推进顺序

| 阶段 | 内容 | 交付 |
| --- | --- | --- |
| **M1（本次）** | 目录与三仓库、令牌生成器、Foundation、两端打包骨架 | 能拿到颜色字体圆角 |
| M2 | 基础组件 1 批：Button / IconButton / TextField / Switch / Checkbox / Card / ListRow / Icon | 覆盖 80% 界面 |
| M3 | 基础组件 2 批：Chip / Badge / Avatar / Divider / Progress / Slider / Stepper / Section | 基础层封板 |
| M4 | 高级组件 1 批：Alert / BottomSheet / Toast / Banner / EmptyState / Skeleton | 反馈与弹层 |
| M5 | 高级组件 2 批：导航与表单 | 导航与表单 |
| M6 | 场景组件 + 无障碍回归 + 截图基线 + 发 1.0 | 发布 |

贯穿始终的一条：**每个组件先改 `docs/02-components.md` 的规格，再两端同 PR 实现**。规格是契约，代码是两份实现，这是保证两端不跑偏的唯一办法。
