<!-- GENERATED FILE - DO NOT EDIT. -->
<!-- Source: wisdomdesign design truth sources via tools/ai-skill/lib/extract-design.js. -->
<!-- Regenerate with: node tools/ai-skill/lib/extract-design.js | node tools/ai-skill/lib/generate-core-catalog.js --out <dir> -->
<!-- No platform API claims are included. -->

# WDActionSheet 语义卡

Component: `WDActionSheet`
Spec: `docs/specs/02-advanced.md` (number 27)
Contract: `contracts-digest.json#WDActionSheet` (source `contracts/WDActionSheet.yaml`, sha256 `9e21e96912a4859c39e782efe163e6693ae0b863698289ddba7715143bc49ab1`)

## 用途（来自正式规格 §1）

从一组操作里选一个，且这组操作**与当前位置强相关**。

- **用**：长按一条任务后的操作、分享方式选择、含删除的操作组
- **不要用**：只有 1–2 个操作（直接放按钮）；需要解释每个选项（用 `WDBottomSheet`）；选项需要输入

## 来源追溯

- `docs/specs/02-advanced.md:653,655,657,658,660,664,665,666,668,670,674,675,676,677,678,679,681,685,686,687,689,693,694,695,696,704,706,707,708,723,725,726,727,728`

## 设计者摘要

操作行高 44；行水平内距 16；取消胶囊高 48；与安全区间距 `space.3`（8）。

## 解剖（来自正式规格 §2）

- 段=遮罩; 说明=半透明，点击关闭（`docs/specs/02-advanced.md:664`）
- 段=操作列表; 说明=纵向，每项 44 高，图标可选（`docs/specs/02-advanced.md:665`）
- 段=取消; 说明=**独立的胶囊**，与操作列表分离，固定在最下（`docs/specs/02-advanced.md:666`）
- 取消按钮之所以独立，是为了让"取消"永远不会被误认为另一个操作。（`docs/specs/02-advanced.md:668`）

## 尺寸（来自正式规格 §3）

- 项=操作行高; 值=44（`docs/specs/02-advanced.md:674`）
- 项=行水平内距; 值=16（`docs/specs/02-advanced.md:675`）
- 项=列表圆角; 值=`radius.lg` 18（`radius.lg` = 18）（`docs/specs/02-advanced.md:676`）
- 项=取消胶囊高; 值=48（`docs/specs/02-advanced.md:677`）
- 项=与安全区间距; 值=`space.3`（8）（`docs/specs/02-advanced.md:678`）
- 项=操作列表与取消的间距; 值=`space.3`（8）（`docs/specs/02-advanced.md:679`）

## 变体（来自正式规格 §4）

- 变体=标准; 说明=全部为普通操作（`docs/specs/02-advanced.md:685`）
- 变体=含破坏性; 说明=破坏性操作单独成组，用 `status.danger`（`status.danger` = 浅 #B8564D / 深 #EDA79E）（`docs/specs/02-advanced.md:686`）
- 变体=带图标; 说明=每项前置 20pt 图标（`docs/specs/02-advanced.md:687`）

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

- searchAliases: 操作表, 操作菜单, 更多操作, 长按菜单, action sheet
- combinesWith: none
- pageRegions: overlay, collection-item

## 平台说明

本卡不包含任何 Swift / Kotlin 平台 API 猜测。平台实现与证据只由对应 Provider 提供。
