<!-- GENERATED FILE - DO NOT EDIT. -->
<!-- Source: wisdomdesign design truth sources via tools/ai-skill/lib/extract-design.js. -->
<!-- Regenerate with: node tools/ai-skill/lib/extract-design.js | node tools/ai-skill/lib/generate-core-catalog.js --out <dir> -->
<!-- No platform API claims are included. -->

# WDPicker 语义卡

Component: `WDPicker`
Spec: `docs/specs/02-advanced.md` (number 22)
Contract: `contracts-digest.json#WDPicker` (source `contracts/WDPicker.yaml`, sha256 `ab8df2a53a8bb110ab13f28a45ef28103f20835f5e3fa8e9cc2652c740d6a7e6`)

## 用途（来自正式规格 §1）

从 **5 个以上**的选项里选一个。

- **用**：分类、成员、频率、单位等选项较多的单选
- **不要用**：≤ 5 项（用 `WDSegmentedControl` 或 `WDRadio`）；多选（用 `WDCheckbox` 列表）；日期（用 `WDDatePicker`）

## 来源追溯

- `docs/specs/02-advanced.md:120,122,124,125,127,131,132,133,135,139,140,141,142,143,145,149,150,151,153,155,159,160,161,162,163,171,173,174,175,193,195,196,197,198`

## 设计者摘要

触发入口高 44；选项行高 44；弹出层最小宽 180，最大宽 = 屏幕宽 − 32；选项水平内距 14；圆角 `radius.md` 14。

## 解剖（来自正式规格 §2）

- 段=触发入口; 说明=一行，左侧标签，右侧当前值 + `chevron-down`（`docs/specs/02-advanced.md:131`）
- 段=弹出层; 说明=选项列表，可滚动，当前项打勾（`docs/specs/02-advanced.md:132`）
- 段=遮罩; 说明=点击关闭（不提交）（`docs/specs/02-advanced.md:133`）

## 尺寸（来自正式规格 §3）

- 项=触发入口高; 值=44（`docs/specs/02-advanced.md:139`）
- 项=选项行高; 值=44（`docs/specs/02-advanced.md:140`）
- 项=弹出层最小宽; 值=180，最大宽 = 屏幕宽 − 32（`docs/specs/02-advanced.md:141`）
- 项=圆角; 值=`radius.md` 14（`radius.md` = 14）（`docs/specs/02-advanced.md:142`）
- 项=选项水平内距; 值=14（`docs/specs/02-advanced.md:143`）

## 变体（来自正式规格 §4）

- 形态=菜单; 说明=从触发入口下方展开; 用在哪=选项 ≤ 10（`docs/specs/02-advanced.md:149`）
- 形态=滚轮; 说明=底部弹出滚轮; 用在哪=选项多且需要快速滚动（`docs/specs/02-advanced.md:150`）
- 形态=内联; 说明=直接平铺在页面里; 用在哪=选项 ≤ 8 且表单需要一眼看全（`docs/specs/02-advanced.md:151`）
- 同一表单里只用一种形态。（`docs/specs/02-advanced.md:153`）

## 状态（来自正式规格 §5）

- 状态=默认; 视觉=值为 `text.primary`，箭头 `text.tertiary`; 动效=—（`docs/specs/02-advanced.md:159`）
- 状态=未选; 视觉=显示"请选择"，色 `text.tertiary`; 动效=—（`docs/specs/02-advanced.md:160`）
- 状态=展开; 视觉=弹出层淡入 + 从触发入口方向缩放 0.96 → 1; 动效=240ms `motion.spring.gentle`（`docs/specs/02-advanced.md:161`）
- 状态=已选; 视觉=当前项左侧打勾，其余等高占位; 动效=—（`docs/specs/02-advanced.md:162`）
- 状态=禁用; 视觉=整体 40%; 动效=无（`docs/specs/02-advanced.md:163`）

## 内容（来自正式规格 §7）

- 选项文字 2–8 个汉字，左对齐（`docs/specs/02-advanced.md:173`）
- 支持分组标题（`type.overline`），分组内选项缩进 `space.5`（`docs/specs/02-advanced.md:174`）
- 当前值超长时截断，不换行（`docs/specs/02-advanced.md:175`）

## 无障碍（来自正式规格 §10）

- 触发入口角色为 `button`，朗读"分类，当前值：家务，展开选择"（`docs/specs/02-advanced.md:195`）
- 弹出层角色为 `listbox`，选项角色为 `option`，当前项标注 `aria-selected`（`docs/specs/02-advanced.md:196`）
- 展开后焦点进入弹出层，`Esc` 关闭后焦点回到触发入口（`docs/specs/02-advanced.md:197`）
- 触控热区 ≥ 44（`docs/specs/02-advanced.md:198`）

## 契约摘要（来自 YAML）

- params: 5
- slots: label, options
- enums: WDPickerStyle

## 检索与组合 overlay（不得覆盖真源）

- searchAliases: 选择器, 滚轮选择, 下拉选择, picker
- combinesWith: none
- pageRegions: form

## 平台说明

本卡不包含任何 Swift / Kotlin 平台 API 猜测。平台实现与证据只由对应 Provider 提供。
