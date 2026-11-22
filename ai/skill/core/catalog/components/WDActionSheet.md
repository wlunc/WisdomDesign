<!-- GENERATED FILE - DO NOT EDIT. -->
<!-- Source: wisdomdesign design truth sources via tools/ai-skill/lib/extract-design.js. -->
<!-- Regenerate with: node tools/ai-skill/lib/extract-design.js | node tools/ai-skill/lib/generate-core-catalog.js --out <dir> -->
<!-- No platform API claims are included. -->

# WDActionSheet 语义卡

Component: `WDActionSheet`
Spec: `docs/specs/02-advanced.md` (number 27)
Contract: `contracts/WDActionSheet.yaml` (sha256 `9e21e96912a4859c39e782efe163e6693ae0b863698289ddba7715143bc49ab1`)

## 用途（来自正式规格 §1）

从一组操作里选一个，且这组操作**与当前位置强相关**。

- **用**：长按一条任务后的操作、分享方式选择、含删除的操作组
- **不要用**：只有 1–2 个操作（直接放按钮）；需要解释每个选项（用 `WDBottomSheet`）；选项需要输入

## 来源追溯

- `docs/specs/02-advanced.md:653`
- `docs/specs/02-advanced.md:655`
- `docs/specs/02-advanced.md:658`
- `docs/specs/02-advanced.md:657`
- `docs/specs/02-advanced.md:689`
- `docs/specs/02-advanced.md:693`
- `docs/specs/02-advanced.md:694`
- `docs/specs/02-advanced.md:695`
- `docs/specs/02-advanced.md:696`
- `docs/specs/02-advanced.md:704`
- `docs/specs/02-advanced.md:706`
- `docs/specs/02-advanced.md:707`
- `docs/specs/02-advanced.md:708`
- `docs/specs/02-advanced.md:723`
- `docs/specs/02-advanced.md:725`
- `docs/specs/02-advanced.md:726`
- `docs/specs/02-advanced.md:727`
- `docs/specs/02-advanced.md:728`

## 状态（来自正式规格 §5）

- 状态=出现; 视觉=从底部滑入; 动效=340ms `motion.spring.gentle`（`docs/specs/02-advanced.md:693`）
- 状态=按下; 视觉=该行 `fill.pressed`; 动效=100ms（`docs/specs/02-advanced.md:694`）
- 状态=破坏性; 视觉=文字 `status.danger`; 动效=—（`docs/specs/02-advanced.md:695`）
- 状态=关闭; 视觉=下滑淡出; 动效=240ms（`docs/specs/02-advanced.md:696`）

## 内容（来自正式规格 §7）

- 每项 ≤ 8 个汉字，动词开头（"复制链接"、"设为已完成"）（`docs/specs/02-advanced.md:706`）
- 危险操作写清后果（"删除任务"而不是"删除"）（`docs/specs/02-advanced.md:707`）
- 面板顶部可加一行标题说明操作对象（"整理储物间"），`type.footnote`，色 `text.secondary`（`docs/specs/02-advanced.md:708`）

## 无障碍（来自正式规格 §10）

- 角色为 `menu`（iOS 上为 action sheet），每项角色 `menuitem`（`docs/specs/02-advanced.md:725`）
- 破坏性项朗读包含后果（`docs/specs/02-advanced.md:726`）
- 出现时焦点进入列表，取消按钮可被独立到达（`docs/specs/02-advanced.md:727`）
- 行高 44 已满足触控热区（`docs/specs/02-advanced.md:728`）

## 契约摘要（来自 YAML）

- params: 6
- slots: title, message, items
- enums: WDActionSheetItem.Role

## 检索与组合 overlay（不得覆盖真源）

- searchAliases: none
- combinesWith: none
- pageRegions: none

## 平台说明

本卡不包含任何 Swift / Kotlin 平台 API 猜测。平台实现与证据只由对应 Provider 提供。
