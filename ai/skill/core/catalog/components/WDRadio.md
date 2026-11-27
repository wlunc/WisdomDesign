<!-- GENERATED FILE - DO NOT EDIT. -->
<!-- Source: wisdomdesign design truth sources via tools/ai-skill/lib/extract-design.js. -->
<!-- Regenerate with: node tools/ai-skill/lib/extract-design.js | node tools/ai-skill/lib/generate-core-catalog.js --out <dir> -->
<!-- No platform API claims are included. -->

# WDRadio 语义卡

Component: `WDRadio`
Spec: `docs/specs/01-basic.md` (number 7)
Contract: `contracts/WDRadio.yaml` (sha256 `d3961d208e652e194ccfa11b317f1647a4ddb2c8540a514386a9b1edd5e10ed0`)

## 用途（来自正式规格 §1）

在一组互斥选项里选一个，且**选中即生效**。

- **用**：2–5 个并列选项，且用户需要看到全部选项才能决定（仅自己 / 共享给全家）
- **不要用**：超过 5 个选项（改用 `WDPicker`）；需要点"保存"才生效（改用 `WDCheckbox`）；两个选项且语义相反（改用 `WDSwitch` 或 `WDSegmentedControl`）

## 来源追溯

- `docs/specs/01-basic.md:656,658,660,661,683,687,688,689,690,698,700,701,702,716,718,719,720,721,722`

## 状态（来自正式规格 §5）

- 状态=未选; 视觉=描边 `border.hairline-strong` 1.5pt，底 `fill.field`; 动效=—; 触觉=—（`docs/specs/01-basic.md:687`）
- 状态=已选; 视觉=底 `gradient.mid`，内圆点白色 `scale(1)`; 动效=内点 200ms 弹出，底 220ms; 触觉=轻（`docs/specs/01-basic.md:688`）
- 状态=按下; 视觉=缩放至 0.92; 动效=100ms; 触觉=轻（`docs/specs/01-basic.md:689`）
- 状态=禁用; 视觉=整体 40%，**保留选中状态**; 动效=无; 触觉=无（`docs/specs/01-basic.md:690`）

## 内容（来自正式规格 §7）

- 标签 2–10 个汉字，名词短语（`docs/specs/01-basic.md:700`）
- 同组内所有选项的句式保持一致（都是名词，或都是"动词 + 宾语"）（`docs/specs/01-basic.md:701`）
- 不要加"请选择"之类的引导语，选项本身就是引导（`docs/specs/01-basic.md:702`）

## 无障碍（来自正式规格 §10）

- 每个选项角色为 `radio`，**整组用 `radiogroup` 包裹并给出组标签**（如"可见范围"）（`docs/specs/01-basic.md:718`）
- 读屏朗读"仅自己可见，已选中，单选按钮，第 1 项，共 2 项"（`docs/specs/01-basic.md:719`）
- 方向键切换时即时播报新选项（`docs/specs/01-basic.md:720`）
- 触控热区 ≥ 44×44（`docs/specs/01-basic.md:721`）
- 选中态不依赖颜色：内圆点的**有无**是主要信号（`docs/specs/01-basic.md:722`）

## 契约摘要（来自 YAML）

- params: 4
- slots: label, options
- enums: WDRadioSize

## 检索与组合 overlay（不得覆盖真源）

- searchAliases: none
- combinesWith: none
- pageRegions: none

## 平台说明

本卡不包含任何 Swift / Kotlin 平台 API 猜测。平台实现与证据只由对应 Provider 提供。
