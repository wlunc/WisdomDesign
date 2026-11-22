<!-- GENERATED FILE - DO NOT EDIT. -->
<!-- Source: wisdomdesign design truth sources via tools/ai-skill/lib/extract-design.rb. -->
<!-- Regenerate with: ruby tools/ai-skill/lib/extract-design.rb | node tools/ai-skill/lib/generate-core-catalog.js --out <dir> -->
<!-- No platform API claims are included. -->

# WDPicker 语义卡

Component: `WDPicker`
Spec: `docs/specs/02-advanced.md` (number 22)
Contract: `contracts/WDPicker.yaml` (sha256 `ab8df2a53a8bb110ab13f28a45ef28103f20835f5e3fa8e9cc2652c740d6a7e6`)

## 用途（来自正式规格 §1）

从 **5 个以上**的选项里选一个。

- **用**：分类、成员、频率、单位等选项较多的单选
- **不要用**：≤ 5 项（用 `WDSegmentedControl` 或 `WDRadio`）；多选（用 `WDCheckbox` 列表）；日期（用 `WDDatePicker`）

## 来源追溯

- `docs/specs/02-advanced.md:120`
- `docs/specs/02-advanced.md:122`
- `docs/specs/02-advanced.md:125`
- `docs/specs/02-advanced.md:124`
- `docs/specs/02-advanced.md:155`
- `docs/specs/02-advanced.md:159`
- `docs/specs/02-advanced.md:160`
- `docs/specs/02-advanced.md:161`
- `docs/specs/02-advanced.md:162`
- `docs/specs/02-advanced.md:163`
- `docs/specs/02-advanced.md:171`
- `docs/specs/02-advanced.md:173`
- `docs/specs/02-advanced.md:174`
- `docs/specs/02-advanced.md:175`
- `docs/specs/02-advanced.md:193`
- `docs/specs/02-advanced.md:195`
- `docs/specs/02-advanced.md:196`
- `docs/specs/02-advanced.md:197`
- `docs/specs/02-advanced.md:198`

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

- searchAliases: none
- combinesWith: none
- pageRegions: none

## 平台说明

本卡不包含任何 Swift / Kotlin 平台 API 猜测。平台实现与证据只由对应 Provider 提供。
