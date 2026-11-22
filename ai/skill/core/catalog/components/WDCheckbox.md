<!-- GENERATED FILE - DO NOT EDIT. -->
<!-- Source: wisdomdesign design truth sources via tools/ai-skill/lib/extract-design.js. -->
<!-- Regenerate with: node tools/ai-skill/lib/extract-design.js | node tools/ai-skill/lib/generate-core-catalog.js --out <dir> -->
<!-- No platform API claims are included. -->

# WDCheckbox 语义卡

Component: `WDCheckbox`
Spec: `docs/specs/01-basic.md` (number 6)
Contract: `contracts/WDCheckbox.yaml` (sha256 `08d51fd1b73bd7f13f5e0c9dc95dfd69b168e2eea19d551e0f5bbb94b712e37e`)

## 用途（来自正式规格 §1）

多选，以及任务清单里的"完成"。

- **用**：多项可同时选中的列表、任务行的完成勾选
- **不要用**：单选项（用 Radio）；即时生效的开关（用 Switch）；筛选标签（用 Chip）

## 来源追溯

- `docs/specs/01-basic.md:547`
- `docs/specs/01-basic.md:549`
- `docs/specs/01-basic.md:552`
- `docs/specs/01-basic.md:551`
- `docs/specs/01-basic.md:581`
- `docs/specs/01-basic.md:585`
- `docs/specs/01-basic.md:586`
- `docs/specs/01-basic.md:587`
- `docs/specs/01-basic.md:588`
- `docs/specs/01-basic.md:589`
- `docs/specs/01-basic.md:590`
- `docs/specs/01-basic.md:598`
- `docs/specs/01-basic.md:600`
- `docs/specs/01-basic.md:601`
- `docs/specs/01-basic.md:602`
- `docs/specs/01-basic.md:622`
- `docs/specs/01-basic.md:624`
- `docs/specs/01-basic.md:625`
- `docs/specs/01-basic.md:626`
- `docs/specs/01-basic.md:627`
- `docs/specs/01-basic.md:628`
- `docs/specs/01-basic.md:629`

## 状态（来自正式规格 §5）

- 状态=未选; 视觉=描边 `border.hairline-strong` 1.5pt，底 `fill.field`; 动效=—; 触觉=—（`docs/specs/01-basic.md:585`）
- 状态=已选; 视觉=底 `gradient.mid`，无描边，顶部 1pt 内高光，`elevation.brand` 投影; 动效=勾 260ms 弹出，填充与投影同步 220ms; 触觉=轻（`docs/specs/01-basic.md:586`）
- 状态=半选; 视觉=同已选底，勾换成 12×2.4 的白色横杠; 动效=同已选; 触觉=轻（`docs/specs/01-basic.md:587`）
- 状态=按下; 视觉=缩放至 `motion.component.checkbox-press`（0.90）; 动效=`motion.duration.instant`; 触觉=轻（`docs/specs/01-basic.md:588`）
- 状态=禁用; 视觉=整体 40%，**保留当前勾选状态**; 动效=无; 触觉=无（`docs/specs/01-basic.md:589`）
- 状态=光晕; 视觉=选中瞬间外扩，`brand` 42% → 透明; 动效=`motion.component.checkbox-glow` 400ms; 触觉=—（`docs/specs/01-basic.md:590`）

## 内容（来自正式规格 §7）

- 标签 2–12 个汉字，名词短语或短句（`docs/specs/01-basic.md:600`）
- 不用问句（"是否共享？"），直接写状态（"共享给家人"）（`docs/specs/01-basic.md:601`）
- 任务行标题过长时截断，不换行（`docs/specs/01-basic.md:602`）

## 无障碍（来自正式规格 §10）

- 角色为 `checkbox`，状态为"已选中 / 未选中 / 部分选中"（`docs/specs/01-basic.md:624`）
- 任务行读"整理储物间，未完成，复选框"（`docs/specs/01-basic.md:625`）
- 勾选完成时给出触觉反馈，同时用 `aria-live` 播报"已完成"（`docs/specs/01-basic.md:626`）
- 热区 ≥ 44×44，方框视觉 26（`docs/specs/01-basic.md:627`）
- 选中态不依赖颜色：勾的**形状**是主要信号（`docs/specs/01-basic.md:628`）
- 动态字体放大时方框尺寸不变，只放大标签，行高同步增高（`docs/specs/01-basic.md:629`）

## 契约摘要（来自 YAML）

- params: 5
- slots: label
- enums: WDCheckboxSize

## 检索与组合 overlay（不得覆盖真源）

- searchAliases: none
- combinesWith: none
- pageRegions: none

## 平台说明

本卡不包含任何 Swift / Kotlin 平台 API 猜测。平台实现与证据只由对应 Provider 提供。
