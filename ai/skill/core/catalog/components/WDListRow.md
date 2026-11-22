<!-- GENERATED FILE - DO NOT EDIT. -->
<!-- Source: wisdomdesign design truth sources via tools/ai-skill/lib/extract-design.rb. -->
<!-- Regenerate with: ruby tools/ai-skill/lib/extract-design.rb | node tools/ai-skill/lib/generate-core-catalog.js --out <dir> -->
<!-- No platform API claims are included. -->

# WDListRow 语义卡

Component: `WDListRow`
Spec: `docs/specs/01-basic.md` (number 18)
Contract: `contracts/WDListRow.yaml` (sha256 `a82d8d65e9f008a0adf8f82f91a35efede855b812fd790cd98586643c5badcd1`)

## 用途（来自正式规格 §1）

列表里的一行。承载"一条记录 + 一个动作"。

- **用**：设置项、任务项、成员项、任意可枚举的内容
- **不要用**：一行的内容超过三行文字（改用 `WDListSection` 里的卡片）；需要横向比较多个字段的场合（用 Table）

## 来源追溯

- `docs/specs/01-basic.md:1692`
- `docs/specs/01-basic.md:1694`
- `docs/specs/01-basic.md:1697`
- `docs/specs/01-basic.md:1696`
- `docs/specs/01-basic.md:1727`
- `docs/specs/01-basic.md:1731`
- `docs/specs/01-basic.md:1732`
- `docs/specs/01-basic.md:1733`
- `docs/specs/01-basic.md:1734`
- `docs/specs/01-basic.md:1748`
- `docs/specs/01-basic.md:1750`
- `docs/specs/01-basic.md:1751`
- `docs/specs/01-basic.md:1769`
- `docs/specs/01-basic.md:1771`
- `docs/specs/01-basic.md:1772`
- `docs/specs/01-basic.md:1773`
- `docs/specs/01-basic.md:1774`
- `docs/specs/01-basic.md:1775`

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

- searchAliases: none
- combinesWith: none
- pageRegions: none

## 平台说明

本卡不包含任何 Swift / Kotlin 平台 API 猜测。平台实现与证据只由对应 Provider 提供。
