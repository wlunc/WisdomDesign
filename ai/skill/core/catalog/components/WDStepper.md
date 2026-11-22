<!-- GENERATED FILE - DO NOT EDIT. -->
<!-- Source: wisdomdesign design truth sources via tools/ai-skill/lib/extract-design.rb. -->
<!-- Regenerate with: ruby tools/ai-skill/lib/extract-design.rb | node tools/ai-skill/lib/generate-core-catalog.js --out <dir> -->
<!-- No platform API claims are included. -->

# WDStepper 语义卡

Component: `WDStepper`
Spec: `docs/specs/01-basic.md` (number 9)
Contract: `contracts/WDStepper.yaml` (sha256 `6b97e2e356b41faa3c27bfe36bf5b6b2b3324d684be7dfe10dc6e40e42f80179`)

## 用途（来自正式规格 §1）

小范围整数增减，取值精度比 Slider 高、输入成本比 TextField 低。

- **用**：数量（买几个）、人数、重复次数
- **不要用**：范围超过 20（用 `WDTextField`）；连续值（用 `WDSlider`）

## 来源追溯

- `docs/specs/01-basic.md:844`
- `docs/specs/01-basic.md:846`
- `docs/specs/01-basic.md:849`
- `docs/specs/01-basic.md:848`
- `docs/specs/01-basic.md:872`
- `docs/specs/01-basic.md:876`
- `docs/specs/01-basic.md:877`
- `docs/specs/01-basic.md:878`
- `docs/specs/01-basic.md:879`
- `docs/specs/01-basic.md:880`
- `docs/specs/01-basic.md:888`
- `docs/specs/01-basic.md:890`
- `docs/specs/01-basic.md:891`
- `docs/specs/01-basic.md:906`
- `docs/specs/01-basic.md:908`
- `docs/specs/01-basic.md:909`
- `docs/specs/01-basic.md:910`
- `docs/specs/01-basic.md:911`
- `docs/specs/01-basic.md:912`

## 状态（来自正式规格 §5）

- 状态=默认; 视觉=容器 `surface.glass-strong` + `border.hairline`；按钮符号 `text.brand`（`docs/specs/01-basic.md:876`）
- 状态=按下; 视觉=按钮区域 `fill.pressed`，`motion.duration.instant`（`docs/specs/01-basic.md:877`）
- 状态=到下限; 视觉=减号按钮禁用（40%），加号正常（`docs/specs/01-basic.md:878`）
- 状态=到上限; 视觉=加号按钮禁用，减号正常（`docs/specs/01-basic.md:879`）
- 状态=整体禁用; 视觉=全部 45%（`docs/specs/01-basic.md:880`）

## 内容（来自正式规格 §7）

- 数值用等宽数字，位数变化时容器宽度**可以**变化，但要给出 100ms 宽度过渡避免抖动（`docs/specs/01-basic.md:890`）
- 到边界时不做提示文字，按钮置灰即可（`docs/specs/01-basic.md:891`）

## 无障碍（来自正式规格 §10）

- 容器角色为 `adjustable`（iOS）/ `progressBar`-like 可调整控件（Android）（`docs/specs/01-basic.md:908`）
- 读屏朗读"数量，3，可调整"，并支持直接的增减手势（`docs/specs/01-basic.md:909`）
- **不要**把两个按钮分别独立暴露成焦点——会让读屏用户按多次才能改一个值（`docs/specs/01-basic.md:910`）
- 每个按钮仍需独立的无障碍标签"减少数量" / "增加数量"，供直接点击（`docs/specs/01-basic.md:911`）
- 触控热区 ≥ 44×44（标准档按钮宽 40，热区向外扩 2）（`docs/specs/01-basic.md:912`）

## 契约摘要（来自 YAML）

- params: 6
- slots: label
- enums: WDStepperSize

## 检索与组合 overlay（不得覆盖真源）

- searchAliases: none
- combinesWith: none
- pageRegions: none

## 平台说明

本卡不包含任何 Swift / Kotlin 平台 API 猜测。平台实现与证据只由对应 Provider 提供。
