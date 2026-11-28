<!-- GENERATED FILE - DO NOT EDIT. -->
<!-- Source: wisdomdesign design truth sources via tools/ai-skill/lib/extract-design.js. -->
<!-- Regenerate with: node tools/ai-skill/lib/extract-design.js | node tools/ai-skill/lib/generate-core-catalog.js --out <dir> -->
<!-- No platform API claims are included. -->

# WDAssigneePicker 语义卡

Component: `WDAssigneePicker`
Spec: `docs/specs/03-patterns.md` (number 37)
Contract: `contracts-digest.json#WDAssigneePicker` (source `contracts/WDAssigneePicker.yaml`, sha256 `637def1210eb5678009b4f0f40d45b438e08eb21cf1106ccb6baa5e2cd012033`)

## 用途（来自正式规格 §1）

在一组人里指派负责人。

- **用**：任务指派、日程参与人、清单归属
- **不要用**：选择对象超过 20 人（用带搜索的 `WDBottomSheet`）；选择非人物实体（用 `WDPicker`）

## 来源追溯

- `docs/specs/03-patterns.md:379,381,383,384,386,388,392,393,394,395,396,398,402,403,404,405,406,407,409,413,414,415,416,418,422,423,424,425,426,435,437,438,439,456,458,459,460,461,462`

## 设计者摘要

头像 40；头像间距 `space.4`（12）；选中外环 2pt 描边 + 4 间隙（外径 52）；名字与头像间距 `space.2`（4）。

## 解剖（来自正式规格 §2）

- 头像横排 + 选中外环 + 可选"未指派"项 + 可选溢出项。（`docs/specs/03-patterns.md:388`）
- 段=头像; 说明=`WDAvatar`（40），居中（`docs/specs/03-patterns.md:392`）
- 段=选中外环; 说明=头像外描 2pt `text.brand`，与外径留 4 间隙（`text.brand` = 浅 #1677B3 / 深 #7EC4CF）（`docs/specs/03-patterns.md:393`）
- 段=名字; 说明=可选，`type.caption1`，≤ 4 个汉字，居中（`type.caption1` = 12/16 · 400）（`docs/specs/03-patterns.md:394`）
- 段=未指派项; 说明=虚线圈 + `user-x` 图标，语义是"暂时不指派"（`docs/specs/03-patterns.md:395`）
- 段=溢出项; 说明=第 6 个之后显示 `+n`，点击展开完整列表（`docs/specs/03-patterns.md:396`）

## 尺寸（来自正式规格 §3）

- 项=头像; 值=40（`docs/specs/03-patterns.md:402`）
- 项=头像间距; 值=`space.4`（12）（`docs/specs/03-patterns.md:403`）
- 项=选中外环; 值=2pt 描边 + 4 间隙（外径 52）（`docs/specs/03-patterns.md:404`）
- 项=名字与头像间距; 值=`space.2`（4）（`docs/specs/03-patterns.md:405`）
- 项=横向内边距; 值=`space.5`（16）（`docs/specs/03-patterns.md:406`）
- 项=最多直接显示; 值=6 个（含"未指派"）（`docs/specs/03-patterns.md:407`）

## 变体（来自正式规格 §4）

- 变体=单选（默认）; 说明=选中一个，再点另一个则切换（`docs/specs/03-patterns.md:413`）
- 变体=多选; 说明=可选中多个，用于"参与人"（`docs/specs/03-patterns.md:414`）
- 变体=带未指派; 说明=首位固定为"未指派"（`docs/specs/03-patterns.md:415`）
- 变体=紧凑; 说明=头像 32，不显示名字，用于列表行内（`docs/specs/03-patterns.md:416`）

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

- searchAliases: 负责人, 指派, 选择成员, 分配, assignee
- combinesWith: WDAvatar
- pageRegions: form, collection-header

## 平台说明

本卡不包含任何 Swift / Kotlin 平台 API 猜测。平台实现与证据只由对应 Provider 提供。
