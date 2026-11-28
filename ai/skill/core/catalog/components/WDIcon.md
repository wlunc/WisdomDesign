<!-- GENERATED FILE - DO NOT EDIT. -->
<!-- Source: wisdomdesign design truth sources via tools/ai-skill/lib/extract-design.js. -->
<!-- Regenerate with: node tools/ai-skill/lib/extract-design.js | node tools/ai-skill/lib/generate-core-catalog.js --out <dir> -->
<!-- No platform API claims are included. -->

# WDIcon 语义卡

Component: `WDIcon`
Spec: `docs/specs/01-basic.md` (number 20)
Contract: `contracts-digest.json#WDIcon` (source `contracts/WDIcon.yaml`, sha256 `4ef8481cc9f267a6468668a455ef6b5f99e7b828b5e69930a7e160a9dfb7f634`)

## 用途（来自正式规格 §1）

表达概念或状态的最小图形单位。**图标不单独承载操作**。

- **用**：配合文字做视觉锚点；需要快速识别的位置（Tab 栏、列表前导）
- **不要用**：单独表达一个动作（必须包在 `WDIconButton` 里）；需要用颜色区分的状态（图标形状本身要能区分）

## 来源追溯

- `docs/specs/01-basic.md:1894,1896,1898,1899,1901,1903,1907,1908,1909,1910,1912,1916,1917,1918,1919,1921,1923,1925,1926,1928,1930,1931,1939,1943,1944,1945,1946,1947,1948,1949,1950,1951,1952,1953,1955,1966,1968,1969,1970,1971`

## 设计者摘要

图标 + 可选底座两段。

## 解剖（来自正式规格 §2）

- 图标 + 可选底座两段。（`docs/specs/01-basic.md:1903`）
- 底座=无; 尺寸=—; 圆角=—; 背景=—; 图标色=`currentColor`（`docs/specs/01-basic.md:1907`）
- 底座=浅底座（默认）; 尺寸=34×34; 圆角=`radius.sm`; 背景=`gradient.surface`; 图标色=`text.on-soft`（`radius.sm` = 10；`gradient.surface` = 浅 linear-gradient(135deg,#B0D5DF 0%,#7EC4CF 100%) / 深 linear-gradient(135deg,#123449 0%,#0F4055 100%)；`text.on-soft` = 浅 #123F5C / 深 #B0D5DF）（`docs/specs/01-basic.md:1908`）
- 底座=深底座; 尺寸=34×34; 圆角=`radius.sm`; 背景=`gradient.mid`; 图标色=白（`radius.sm` = 10；`gradient.mid` = linear-gradient(135deg,#4FB0C8 0%,#1685A9 100%)）（`docs/specs/01-basic.md:1909`）
- 底座=大底座; 尺寸=40×40; 圆角=`radius.lg`; 背景=`gradient.surface`; 图标色=`text.on-soft`（`radius.lg` = 18；`gradient.surface` = 浅 linear-gradient(135deg,#B0D5DF 0%,#7EC4CF 100%) / 深 linear-gradient(135deg,#123449 0%,#0F4055 100%)；`text.on-soft` = 浅 #123F5C / 深 #B0D5DF）（`docs/specs/01-basic.md:1910`）

## 尺寸（来自正式规格 §3）

- 档=`sm`; 尺寸=16; 用在哪=行内文字旁、尾部（`docs/specs/01-basic.md:1916`）
- 档=`md`; 尺寸=20; 用在哪=表单前缀、列表（`docs/specs/01-basic.md:1917`）
- 档=`lg`; 尺寸=24; 用在哪=导航栏、Tab 栏、工具栏（`docs/specs/01-basic.md:1918`）
- 档=`xl`; 尺寸=28; 用在哪=强调、空状态（`docs/specs/01-basic.md:1919`）
- 同一层级内不混用档位。描边粗细按尺寸匹配：24pt 图标线宽约 1.8–2。（`docs/specs/01-basic.md:1921`）

## 变体（来自正式规格 §4）

- 同一语义在两端各有一套：iOS 用 SF Symbols（优先 `.rounded` 变体），Android 用 Material Symbols Rounded。（`docs/specs/01-basic.md:1925`）
- 两端靠**语义名称**对照，不逐像素对齐。（`docs/specs/01-basic.md:1926`）

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

- searchAliases: 图标, 图形符号, icon
- combinesWith: none
- pageRegions: toolbar, collection-item

## 平台说明

本卡不包含任何 Swift / Kotlin 平台 API 猜测。平台实现与证据只由对应 Provider 提供。
