<!-- GENERATED FILE - DO NOT EDIT. -->
<!-- Source: wisdomdesign design truth sources via tools/ai-skill/lib/extract-design.js. -->
<!-- Regenerate with: node tools/ai-skill/lib/extract-design.js | node tools/ai-skill/lib/generate-core-catalog.js --out <dir> -->
<!-- No platform API claims are included. -->

# WDListRow 语义卡

Component: `WDListRow`
Spec: `docs/specs/01-basic.md` (number 18)
Contract: `contracts-digest.json#WDListRow` (source `contracts/WDListRow.yaml`, sha256 `a82d8d65e9f008a0adf8f82f91a35efede855b812fd790cd98586643c5badcd1`)

## 用途（来自正式规格 §1）

列表里的一行。承载"一条记录 + 一个动作"。

- **用**：设置项、任务项、成员项、任意可枚举的内容
- **不要用**：一行的内容超过三行文字（改用 `WDListSection` 里的卡片）；需要横向比较多个字段的场合（用 Table）

## 来源追溯

- `docs/specs/01-basic.md:1692,1694,1696,1697,1699,1703,1704,1705,1706,1708,1712,1713,1714,1716,1718,1722,1723,1724,1725,1727,1731,1732,1733,1734,1748,1750,1751,1769,1771,1772,1773,1774,1775`

## 设计者摘要

高度 单行 44 / 双行 60 / 三行 76；必有 文本区；可选 前导 / 尾部。

## 解剖（来自正式规格 §2）

- 段=前导; 是否必有=可选; 说明=图标底座 34×34（`radius.sm`）或头像，或勾选框（`radius.sm` = 10）（`docs/specs/01-basic.md:1703`）
- 段=文本区; 是否必有=必有; 说明=标题 `type.subheadline`；副标题 `type.caption1` 用 `text.secondary`（`type.subheadline` = 15/20 · 400；`type.caption1` = 12/16 · 400；`text.secondary` = 浅 #3E5764 / 深 #A4BCCB）（`docs/specs/01-basic.md:1704`）
- 段=尾部; 是否必有=可选; 说明=值文本 / 徽标 / 头像 / 箭头，**最多一个**（`docs/specs/01-basic.md:1705`）
- 段=分隔线; 是否必有=条件; 说明=从文本区起始内缩，末行不显示（`docs/specs/01-basic.md:1706`）

## 尺寸（来自正式规格 §3）

- 行数=单行; 行高=44（`docs/specs/01-basic.md:1712`）
- 行数=双行; 行高=60（`docs/specs/01-basic.md:1713`）
- 行数=三行; 行高=76（`docs/specs/01-basic.md:1714`）
- 水平内距 16（首尾一致）；各段间距 `space.4`（12）；分隔线左内缩 = 16 + 34 + 12 = 62。（`docs/specs/01-basic.md:1716`）

## 变体（来自正式规格 §4）

- 变体=单行 / 双行 / 三行; 说明=按内容量选择，不为了"好看"加副标题（`docs/specs/01-basic.md:1722`）
- 变体=带选择; 说明=选中时左侧 3pt 品牌色条 + `brand` 8% 透明底（`docs/specs/01-basic.md:1723`）
- 变体=带勾选; 说明=前导换成 `WDCheckbox`，任务行形态（`docs/specs/01-basic.md:1724`）
- 变体=禁用; 说明=整体 40%，不响应（`docs/specs/01-basic.md:1725`）

## 状态（来自正式规格 §5）

- 状态=默认; 视觉=透明底; 动效=—（`docs/specs/01-basic.md:1731`）
- 状态=按下; 视觉=整行 `fill.pressed`; 动效=`motion.duration.instant` 100ms（`docs/specs/01-basic.md:1732`）
- 状态=选中; 视觉=左侧 3pt 品牌条 + 浅底; 动效=`motion.duration.fast` 160ms（`docs/specs/01-basic.md:1733`）
- 状态=禁用; 视觉=整体 40%; 动效=无（`docs/specs/01-basic.md:1734`）

## 内容（来自正式规格 §7）

- 长按进入多选：顶部显示"已选 n 项"，底部换成「取消 / 删除」工具条，行前导换成勾选框。（`docs/specs/01-basic.md:1750`）
- 批量删除同样给撤销，一次撤销恢复整批。退出多选时清空选择。（`docs/specs/01-basic.md:1751`）

## 无障碍（来自正式规格 §10）

- 整行作为一个元素朗读："整理储物间，18:00 前，未完成，按钮"（`docs/specs/01-basic.md:1771`）
- 前导图标标记为装饰；头像朗读成员名（`docs/specs/01-basic.md:1772`）
- 分隔线不进入无障碍树（`docs/specs/01-basic.md:1773`）
- 触控热区 = 整行高度，任意档位均 ≥ 44（`docs/specs/01-basic.md:1774`）
- 提供"删除"自定义操作，左滑只是快捷方式（`docs/specs/01-basic.md:1775`）

## 契约摘要（来自 YAML）

- params: 8
- slots: title, subtitle, leading, trailing
- enums: WDListRowLeading, WDListRowTrailing, WDListRowSwipeAction

## 检索与组合 overlay（不得覆盖真源）

- searchAliases: 列表行, 列表项, 条目, list row
- combinesWith: WDCheckbox, WDAvatar, WDChip
- pageRegions: collection-item

## 平台说明

本卡不包含任何 Swift / Kotlin 平台 API 猜测。平台实现与证据只由对应 Provider 提供。
