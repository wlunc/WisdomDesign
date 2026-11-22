<!-- GENERATED FILE - DO NOT EDIT. -->
<!-- Source: wisdomdesign design truth sources via tools/ai-skill/lib/extract-design.rb. -->
<!-- Regenerate with: ruby tools/ai-skill/lib/extract-design.rb | node tools/ai-skill/lib/generate-core-catalog.js --out <dir> -->
<!-- No platform API claims are included. -->

# WDAssigneePicker 语义卡

Component: `WDAssigneePicker`
Spec: `docs/specs/03-patterns.md` (number 37)
Contract: `contracts/WDAssigneePicker.yaml` (sha256 `637def1210eb5678009b4f0f40d45b438e08eb21cf1106ccb6baa5e2cd012033`)

## 用途（来自正式规格 §1）

在一组人里指派负责人。

- **用**：任务指派、日程参与人、清单归属
- **不要用**：选择对象超过 20 人（用带搜索的 `WDBottomSheet`）；选择非人物实体（用 `WDPicker`）

## 来源追溯

- `docs/specs/03-patterns.md:379`
- `docs/specs/03-patterns.md:381`
- `docs/specs/03-patterns.md:384`
- `docs/specs/03-patterns.md:383`
- `docs/specs/03-patterns.md:418`
- `docs/specs/03-patterns.md:422`
- `docs/specs/03-patterns.md:423`
- `docs/specs/03-patterns.md:424`
- `docs/specs/03-patterns.md:425`
- `docs/specs/03-patterns.md:426`
- `docs/specs/03-patterns.md:435`
- `docs/specs/03-patterns.md:437`
- `docs/specs/03-patterns.md:438`
- `docs/specs/03-patterns.md:439`
- `docs/specs/03-patterns.md:456`
- `docs/specs/03-patterns.md:458`
- `docs/specs/03-patterns.md:459`
- `docs/specs/03-patterns.md:460`
- `docs/specs/03-patterns.md:461`
- `docs/specs/03-patterns.md:462`

## 状态（来自正式规格 §5）

- 状态=未选; 视觉=头像无变化; 动效=—（`docs/specs/03-patterns.md:422`）
- 状态=选中; 视觉=头像缩放 1.05，外描 2pt 品牌色环; 动效=200ms `motion.spring.bouncy`，环 160ms 淡入（`docs/specs/03-patterns.md:423`）
- 状态=按下; 视觉=头像缩放 0.94; 动效=100ms（`docs/specs/03-patterns.md:424`）
- 状态=禁用成员（已离开家庭）; 视觉=头像 40% 并去饱和，**仍可见但不可选**; 动效=无（`docs/specs/03-patterns.md:425`）
- 状态=整体禁用; 视觉=全部 40%; 动效=无（`docs/specs/03-patterns.md:426`）

## 内容（来自正式规格 §7）

- 名字 ≤ 4 个汉字，超出截断（`docs/specs/03-patterns.md:437`）
- 没有名字的成员只显示头像，不显示占位文字（`docs/specs/03-patterns.md:438`）
- 成员按"最近协作过"排序，不按字母——家庭场景里最近的人最可能是要选的人（`docs/specs/03-patterns.md:439`）

## 无障碍（来自正式规格 §10）

- 整组用 `radiogroup`（单选）或 `group`（多选）包裹，并给出组标签"指派给"（`docs/specs/03-patterns.md:458`）
- 每项朗读"妈妈，已选中，单选按钮，第 2 项，共 4 项"（`docs/specs/03-patterns.md:459`）
- 禁用的成员朗读"小李，已离开，不可选"（`docs/specs/03-patterns.md:460`）
- 头像的首字标记为装饰，不朗读（`docs/specs/03-patterns.md:461`）
- 触控热区 ≥ 44×44（头像视觉 40，热区补到 44）（`docs/specs/03-patterns.md:462`）

## 契约摘要（来自 YAML）

- params: 8
- slots: items, label
- enums: WDAssigneePickerSize

## 检索与组合 overlay（不得覆盖真源）

- searchAliases: none
- combinesWith: none
- pageRegions: none

## 平台说明

本卡不包含任何 Swift / Kotlin 平台 API 猜测。平台实现与证据只由对应 Provider 提供。
