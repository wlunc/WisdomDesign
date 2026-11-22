<!-- GENERATED FILE - DO NOT EDIT. -->
<!-- Source: wisdomdesign design truth sources via tools/ai-skill/lib/extract-design.js. -->
<!-- Regenerate with: node tools/ai-skill/lib/extract-design.js | node tools/ai-skill/lib/generate-core-catalog.js --out <dir> -->
<!-- No platform API claims are included. -->

# WDIcon 语义卡

Component: `WDIcon`
Spec: `docs/specs/01-basic.md` (number 20)
Contract: `contracts/WDIcon.yaml` (sha256 `4ef8481cc9f267a6468668a455ef6b5f99e7b828b5e69930a7e160a9dfb7f634`)

## 用途（来自正式规格 §1）

表达概念或状态的最小图形单位。**图标不单独承载操作**。

- **用**：配合文字做视觉锚点；需要快速识别的位置（Tab 栏、列表前导）
- **不要用**：单独表达一个动作（必须包在 `WDIconButton` 里）；需要用颜色区分的状态（图标形状本身要能区分）

## 来源追溯

- `docs/specs/01-basic.md:1894`
- `docs/specs/01-basic.md:1896`
- `docs/specs/01-basic.md:1899`
- `docs/specs/01-basic.md:1898`
- `docs/specs/01-basic.md:1928`
- `docs/specs/01-basic.md:1930`
- `docs/specs/01-basic.md:1931`
- `docs/specs/01-basic.md:1939`
- `docs/specs/01-basic.md:1943`
- `docs/specs/01-basic.md:1944`
- `docs/specs/01-basic.md:1945`
- `docs/specs/01-basic.md:1946`
- `docs/specs/01-basic.md:1947`
- `docs/specs/01-basic.md:1948`
- `docs/specs/01-basic.md:1949`
- `docs/specs/01-basic.md:1950`
- `docs/specs/01-basic.md:1951`
- `docs/specs/01-basic.md:1952`
- `docs/specs/01-basic.md:1953`
- `docs/specs/01-basic.md:1955`
- `docs/specs/01-basic.md:1966`
- `docs/specs/01-basic.md:1968`
- `docs/specs/01-basic.md:1969`
- `docs/specs/01-basic.md:1970`
- `docs/specs/01-basic.md:1971`

## 状态（来自正式规格 §5）

- 图标本身没有状态，状态由容器承担（按钮的按下/禁用、Tab 的选中）。（`docs/specs/01-basic.md:1930`）
- 唯一例外：Tab 栏选中态换 `text.brand` 并把标签加粗，**不换图标形状**。（`docs/specs/01-basic.md:1931`）

## 内容（来自正式规格 §7）

- 语义=首页; SF Symbols=`house.fill`; Material Symbols=`home`（`docs/specs/01-basic.md:1943`）
- 语义=成员; SF Symbols=`person.2.fill`; Material Symbols=`group`（`docs/specs/01-basic.md:1944`）
- 语义=日历; SF Symbols=`calendar`; Material Symbols=`calendar_month`（`docs/specs/01-basic.md:1945`）
- 语义=提醒; SF Symbols=`bell.fill`; Material Symbols=`notifications`（`docs/specs/01-basic.md:1946`）
- 语义=搜索; SF Symbols=`magnifyingglass`; Material Symbols=`search`（`docs/specs/01-basic.md:1947`）
- 语义=设置; SF Symbols=`gearshape.fill`; Material Symbols=`settings`（`docs/specs/01-basic.md:1948`）
- 语义=新增; SF Symbols=`plus`; Material Symbols=`add`（`docs/specs/01-basic.md:1949`）
- 语义=更多; SF Symbols=`ellipsis`; Material Symbols=`more_horiz`（`docs/specs/01-basic.md:1950`）
- 语义=进入; SF Symbols=`chevron.right`; Material Symbols=`chevron_right`（`docs/specs/01-basic.md:1951`）
- 语义=完成; SF Symbols=`checkmark.circle.fill`; Material Symbols=`check_circle`（`docs/specs/01-basic.md:1952`）
- 语义=删除; SF Symbols=`trash`; Material Symbols=`delete`（`docs/specs/01-basic.md:1953`）
- 新增图标必须同时补齐两端的名称，缺一个视为未完成。（`docs/specs/01-basic.md:1955`）

## 无障碍（来自正式规格 §10）

- 装饰性图标标记为隐藏，不进入无障碍树（`docs/specs/01-basic.md:1968`）
- 作为唯一视觉信息的图标（如状态点）必须有文字或无障标签（`docs/specs/01-basic.md:1969`）
- 图标与背景对比度 ≥ 3:1（`docs/specs/01-basic.md:1970`）
- 不依赖颜色区分图标含义，形状必须不同（`docs/specs/01-basic.md:1971`）

## 契约摘要（来自 YAML）

- params: 2
- slots: icon
- enums: WDIconSize

## 检索与组合 overlay（不得覆盖真源）

- searchAliases: none
- combinesWith: none
- pageRegions: none

## 平台说明

本卡不包含任何 Swift / Kotlin 平台 API 猜测。平台实现与证据只由对应 Provider 提供。
