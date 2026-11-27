<!-- GENERATED FILE - DO NOT EDIT. -->
<!-- Source: wisdomdesign design truth sources via tools/ai-skill/lib/extract-design.js. -->
<!-- Regenerate with: node tools/ai-skill/lib/extract-design.js | node tools/ai-skill/lib/generate-core-catalog.js --out <dir> -->
<!-- No platform API claims are included. -->

# WDListSection 语义卡

Component: `WDListSection`
Spec: `docs/specs/01-basic.md` (number 19)
Contract: `contracts/WDListSection.yaml` (sha256 `46e730dbde13fb474b219a9747b6fa3a76829f9897555383ff77f264d9befef7`)

## 用途（来自正式规格 §1）

把列表项分组。**分组的边界靠间距和标题，不靠分割线**。

- **用**：同一页面有多组语义不同的内容（今天 / 本周）
- **不要用**：只有一组内容（直接用 `WDListRow` 列表）；分组内只有一项且不需要标题

## 来源追溯

- `docs/specs/01-basic.md:1802,1804,1806,1807,1837,1839,1848,1850,1851,1852,1866,1868,1869,1870,1871`

## 状态（来自正式规格 §5）

- 分组本身无状态。空分组**整个隐藏**（连标题一起），不要显示空标题。（`docs/specs/01-basic.md:1839`）

## 内容（来自正式规格 §7）

- 标题 ≤ 6 个汉字，用时间或类别名词（"今天"、"本周"、"家庭共享"）（`docs/specs/01-basic.md:1850`）
- 标题与页脚不用来放操作说明（`docs/specs/01-basic.md:1851`）
- 页脚一行，≤ 20 个汉字，写汇总而不写引导语（"共 2 项，已完成 1 项"而不是"点击查看更多"）（`docs/specs/01-basic.md:1852`）

## 无障碍（来自正式规格 §10）

- 分组标题作为 `header` 语义，读屏用户可快速跳转到分组（`docs/specs/01-basic.md:1868`）
- 读屏顺序：标题 → 标题右侧动作 → 组内各行 → 页脚（`docs/specs/01-basic.md:1869`）
- 页脚作为分组的补充说明朗读（`docs/specs/01-basic.md:1870`）
- 分组标题与背景对比度 ≥ 4.5:1（`docs/specs/01-basic.md:1871`）

## 契约摘要（来自 YAML）

- params: 6
- slots: header, items, footer
- enums: none

## 检索与组合 overlay（不得覆盖真源）

- searchAliases: none
- combinesWith: none
- pageRegions: none

## 平台说明

本卡不包含任何 Swift / Kotlin 平台 API 猜测。平台实现与证据只由对应 Provider 提供。
