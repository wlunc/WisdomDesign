<!-- GENERATED FILE - DO NOT EDIT. -->
<!-- Source: wisdomdesign design truth sources via tools/ai-skill/lib/extract-design.js. -->
<!-- Regenerate with: node tools/ai-skill/lib/extract-design.js | node tools/ai-skill/lib/generate-core-catalog.js --out <dir> -->
<!-- No platform API claims are included. -->

# WDBottomSheet 语义卡

Component: `WDBottomSheet`
Spec: `docs/specs/02-advanced.md` (number 26)
Contract: `contracts-digest.json#WDBottomSheet` (source `contracts/WDBottomSheet.yaml`, sha256 `c6182154130b662956f64bd280bb6c33afbcab72fd6fe066477485bc4e5c47f0`)

## 用途（来自正式规格 §1）

承接次级内容或表单，**不离开当前上下文**。

- **用**：新建任务、成员选择、筛选面板、详情预览
- **不要用**：必须完整专注的任务（用整页）；简单确认（用 `WDAlert`）；一组操作（用 `WDActionSheet`）

## 来源追溯

- `docs/specs/02-advanced.md:542,544,546,547,549,553,554,555,556,557,558,560,564,565,566,567,568,569,571,575,576,577,578,580,584,585,586,587,596,598,599,600,621,623,624,625,626,627`

## 设计者摘要

把手 36×5，距顶 8；头部高 56；内容左右内距 `space.5`（16）；底部操作区高 72（含安全区）；圆角 顶部两角 `radius.xxl` 32；必有 遮罩 / 面板 / 把手 / 内容；可选 头部 / 底部操作。

## 解剖（来自正式规格 §2）

- 段=遮罩; 是否必有=必有; 说明=半透明，点击关闭；可配置为不可关闭（`docs/specs/02-advanced.md:553`）
- 段=面板; 是否必有=必有; 说明=顶部两角 `radius.xxl` 32，底边贴合屏幕（`radius.xxl` = 32）（`docs/specs/02-advanced.md:554`）
- 段=把手; 是否必有=必有; 说明=36×5，`radius.full`，色 `border.hairline-strong`，距顶 8（`radius.full` = 999；`border.hairline-strong` = 浅 #0A1B2429 / 深 #FFFFFF2E）（`docs/specs/02-advanced.md:555`）
- 段=头部; 是否必有=可选; 说明=标题 `type.title3` + 右侧关闭按钮（`type.title3` = 20/25 · 600）（`docs/specs/02-advanced.md:556`）
- 段=内容; 是否必有=必有; 说明=可滚动区域（`docs/specs/02-advanced.md:557`）
- 段=底部操作; 是否必有=可选; 说明=固定不滚动，上方 1pt 分割线 + `space.5` 内距（`space.5` = 16）（`docs/specs/02-advanced.md:558`）

## 尺寸（来自正式规格 §3）

- 项=圆角; 值=顶部两角 `radius.xxl` 32（`radius.xxl` = 32）（`docs/specs/02-advanced.md:564`）
- 项=把手; 值=36×5，距顶 8（`docs/specs/02-advanced.md:565`）
- 项=头部高; 值=56（`docs/specs/02-advanced.md:566`）
- 项=内容左右内距; 值=`space.5`（16）（`docs/specs/02-advanced.md:567`）
- 项=底部操作区高; 值=72（含安全区）（`docs/specs/02-advanced.md:568`）
- 项=detents; 值=半屏 0.5 / 大 0.92（`docs/specs/02-advanced.md:569`）

## 变体（来自正式规格 §4）

- 变体=半屏; 说明=默认，detent 0.5（`docs/specs/02-advanced.md:575`）
- 变体=大; 说明=detent 0.92，用于长表单（`docs/specs/02-advanced.md:576`）
- 变体=可拉伸; 说明=在半屏与大之间可拖拽切换（`docs/specs/02-advanced.md:577`）
- 变体=不可关闭; 说明=遮罩不可点、禁用下拉（如强制更新）（`docs/specs/02-advanced.md:578`）

## 状态（来自正式规格 §5）

- 状态=出现; 视觉=遮罩淡入 160ms；面板从底部滑入 340ms; 动效=`motion.spring.gentle`（`docs/specs/02-advanced.md:584`）
- 状态=拖拽中; 视觉=面板跟随手指，遮罩透明度同步变化; 动效=实时（`docs/specs/02-advanced.md:585`）
- 状态=松手; 视觉=速度 ≥ 500pt/s 或位移超过 40% 时关闭，否则回弹; 动效=`motion.spring.snappy`（`docs/specs/02-advanced.md:586`）
- 状态=关闭; 视觉=面板下滑 240ms，遮罩淡出 160ms; 动效=—（`docs/specs/02-advanced.md:587`）

## 内容（来自正式规格 §7）

- 标题 ≤ 10 个汉字，说明这个面板在做什么（"新建任务"）（`docs/specs/02-advanced.md:598`）
- 内容过长时内部滚动，不把面板撑到全屏——需要全屏说明应该用整页（`docs/specs/02-advanced.md:599`）
- 底部操作区最多两个按钮，主操作在右（`docs/specs/02-advanced.md:600`）

## 无障碍（来自正式规格 §10）

- 出现时焦点进入面板并被限制在内（焦点陷阱）（`docs/specs/02-advanced.md:623`）
- 关闭后焦点归还触发元素（`docs/specs/02-advanced.md:624`）
- 提供"下滑关闭"的自定义辅助操作，不能只依赖手势（`docs/specs/02-advanced.md:625`）
- 关闭按钮标签"关闭"，并按面板标题补充上下文："关闭新建任务"（`docs/specs/02-advanced.md:626`）
- 把手标记为装饰，不进入无障碍树（`docs/specs/02-advanced.md:627`）

## 契约摘要（来自 YAML）

- params: 10
- slots: title, content, footer
- enums: WDBottomSheetDetent, WDBottomSheetDetents

## 检索与组合 overlay（不得覆盖真源）

- searchAliases: 底部弹层, 半屏面板, 抽屉, bottom sheet
- combinesWith: none
- pageRegions: overlay

## 平台说明

本卡不包含任何 Swift / Kotlin 平台 API 猜测。平台实现与证据只由对应 Provider 提供。
