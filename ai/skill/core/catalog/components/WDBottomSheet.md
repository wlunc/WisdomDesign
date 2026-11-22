<!-- GENERATED FILE - DO NOT EDIT. -->
<!-- Source: wisdomdesign design truth sources via tools/ai-skill/lib/extract-design.js. -->
<!-- Regenerate with: node tools/ai-skill/lib/extract-design.js | node tools/ai-skill/lib/generate-core-catalog.js --out <dir> -->
<!-- No platform API claims are included. -->

# WDBottomSheet 语义卡

Component: `WDBottomSheet`
Spec: `docs/specs/02-advanced.md` (number 26)
Contract: `contracts/WDBottomSheet.yaml` (sha256 `c6182154130b662956f64bd280bb6c33afbcab72fd6fe066477485bc4e5c47f0`)

## 用途（来自正式规格 §1）

承接次级内容或表单，**不离开当前上下文**。

- **用**：新建任务、成员选择、筛选面板、详情预览
- **不要用**：必须完整专注的任务（用整页）；简单确认（用 `WDAlert`）；一组操作（用 `WDActionSheet`）

## 来源追溯

- `docs/specs/02-advanced.md:542`
- `docs/specs/02-advanced.md:544`
- `docs/specs/02-advanced.md:547`
- `docs/specs/02-advanced.md:546`
- `docs/specs/02-advanced.md:580`
- `docs/specs/02-advanced.md:584`
- `docs/specs/02-advanced.md:585`
- `docs/specs/02-advanced.md:586`
- `docs/specs/02-advanced.md:587`
- `docs/specs/02-advanced.md:596`
- `docs/specs/02-advanced.md:598`
- `docs/specs/02-advanced.md:599`
- `docs/specs/02-advanced.md:600`
- `docs/specs/02-advanced.md:621`
- `docs/specs/02-advanced.md:623`
- `docs/specs/02-advanced.md:624`
- `docs/specs/02-advanced.md:625`
- `docs/specs/02-advanced.md:626`
- `docs/specs/02-advanced.md:627`

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

- searchAliases: none
- combinesWith: none
- pageRegions: none

## 平台说明

本卡不包含任何 Swift / Kotlin 平台 API 猜测。平台实现与证据只由对应 Provider 提供。
