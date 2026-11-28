<!-- GENERATED FILE - DO NOT EDIT. -->
<!-- Source: wisdomdesign design truth sources via tools/ai-skill/lib/extract-design.js. -->
<!-- Regenerate with: node tools/ai-skill/lib/extract-design.js | node tools/ai-skill/lib/generate-core-catalog.js --out <dir> -->
<!-- No platform API claims are included. -->

# WDSlider 语义卡

Component: `WDSlider`
Spec: `docs/specs/01-basic.md` (number 8)
Contract: `contracts-digest.json#WDSlider` (source `contracts/WDSlider.yaml`, sha256 `faa8517894c8ddef6dd9cec9e933a50ee9ef1cd588285872e7c1e1feff9fd11c`)

## 用途（来自正式规格 §1）

在连续或较大范围里取值，且**具体数值不如大致位置重要**。

- **用**：完成度、提醒提前量、音量、字号
- **不要用**：需要精确输入数值（用 `WDTextField`）；小范围整数增减（用 `WDStepper`）；二值（用 `WDSwitch`）

## 来源追溯

- `docs/specs/01-basic.md:747,749,751,752,754,756,758,762,763,764,765,766,768,772,773,774,776,780,781,782,783,791,793,794,795,812,814,815,816,817,818`

## 设计者摘要

轨道高 6；手柄 26（白色 + `elevation.1` + 1pt `border.hairline` 描边）；最小宽度 120；手柄与轨道端点的内缩 手柄半径 13，轨道两端各留 13；圆角 `radius.full`。

## 解剖（来自正式规格 §2）

- 轨道 + 已填充段 + 手柄 + 数值标签四段。轨道与填充用同一条 6pt 高的线，靠颜色区分。（`docs/specs/01-basic.md:756`）

## 尺寸（来自正式规格 §3）

- 项=轨道高; 值=6（`docs/specs/01-basic.md:762`）
- 项=手柄; 值=26（白色 + `elevation.1` + 1pt `border.hairline` 描边）（`elevation.1` = 0 1 2 #0A3C640A ; 0 6 16 #0A3C640F；`border.hairline` = 浅 #0A1B2414 / 深 #FFFFFF1A）（`docs/specs/01-basic.md:763`）
- 项=圆角; 值=`radius.full`（`radius.full` = 999）（`docs/specs/01-basic.md:764`）
- 项=最小宽度; 值=120（`docs/specs/01-basic.md:765`）
- 项=手柄与轨道端点的内缩; 值=手柄半径 13，轨道两端各留 13（`docs/specs/01-basic.md:766`）

## 变体（来自正式规格 §4）

- 变体=单值; 说明=默认（`docs/specs/01-basic.md:772`）
- 变体=带刻度; 说明=离散取值，步长按刻度（如提前 1 天 / 2 天 / 1 周），松手吸附（`docs/specs/01-basic.md:773`）
- 变体=范围; 说明=两个手柄，用于区间（如预算下限到上限）。两端手柄不允许交叉，最小间隔 = 1 步长（`docs/specs/01-basic.md:774`）

## 状态（来自正式规格 §5）

- 状态=默认; 视觉=轨道 `border.hairline-strong`，填充 `gradient.mid`; 动效=—（`docs/specs/01-basic.md:780`）
- 状态=拖拽; 视觉=手柄放大到 1.15，数值标签跟随手柄移动; 动效=100ms（`docs/specs/01-basic.md:781`）
- 状态=聚焦; 视觉=手柄外扩 3pt 光环; 动效=160ms（`docs/specs/01-basic.md:782`）
- 状态=禁用; 视觉=整体 45%，手柄变灰，不响应; 动效=无（`docs/specs/01-basic.md:783`）

## 内容（来自正式规格 §7）

- 数值格式固定：百分比带 `%`，时间带单位（"1 天前"），金额带货币符号（`docs/specs/01-basic.md:793`）
- 拖动过程中实时更新数值，**松手才算一次有效变更**（`docs/specs/01-basic.md:794`）
- 离散档位时显示档位名称而不是原始数字（`docs/specs/01-basic.md:795`）

## 无障碍（来自正式规格 §10）

- 角色为 `slider`，必须提供 `value` / `min` / `max`，可选 `step`（`docs/specs/01-basic.md:814`）
- 读屏朗读"完成度，62%，可调整"（`docs/specs/01-basic.md:815`）
- 支持读屏的增减手势（iOS 上滑下滑调整）（`docs/specs/01-basic.md:816`）
- 触控热区高度 ≥ 44（轨道视觉 6，热区向上向下各扩 19）（`docs/specs/01-basic.md:817`）
- 数值变化不做 `aria-live` 实时播报，只在松手后播报一次（`docs/specs/01-basic.md:818`）

## 契约摘要（来自 YAML）

- params: 5
- slots: label
- enums: none

## 检索与组合 overlay（不得覆盖真源）

- searchAliases: 滑块, 拖动条, 拖动取值, slider
- combinesWith: none
- pageRegions: form

## 平台说明

本卡不包含任何 Swift / Kotlin 平台 API 猜测。平台实现与证据只由对应 Provider 提供。
