<!-- GENERATED FILE - DO NOT EDIT. -->
<!-- Source: wisdomdesign design truth sources via tools/ai-skill/lib/extract-design.js. -->
<!-- Regenerate with: node tools/ai-skill/lib/extract-design.js | node tools/ai-skill/lib/generate-core-catalog.js --out <dir> -->
<!-- No platform API claims are included. -->

# WDChip 语义卡

Component: `WDChip`
Spec: `docs/specs/01-basic.md` (number 10)
Contract: `contracts/WDChip.yaml` (sha256 `e39ea876f02aad39968c24a6be0a759135a9e82d365074a8bb934054410e7ca9`)

## 用途（来自正式规格 §1）

轻量标记与筛选。三种用法语义不同，**不要混在同一行**。


## 来源追溯

- `docs/specs/01-basic.md:935,937,943,966,970,971,972,973,982,984,985,986,1002,1004,1005,1006,1007,1008`

## 状态（来自正式规格 §5）

- 状态=默认; 视觉=见变体表; 动效=—（`docs/specs/01-basic.md:970`）
- 状态=按下; 视觉=缩放至 0.96; 动效=100ms（`docs/specs/01-basic.md:971`）
- 状态=选中; 视觉=换 surface 底 + 深色文字; 动效=200ms 底色与文字同步（`docs/specs/01-basic.md:972`）
- 状态=禁用; 视觉=40%; 动效=无（`docs/specs/01-basic.md:973`）

## 内容（来自正式规格 §7）

- 文字 2–6 个汉字（`docs/specs/01-basic.md:984`）
- 可删除芯片的内容必须是**具体值**（"妈妈"），不是类别（"成员"）（`docs/specs/01-basic.md:985`）
- 展示型芯片不要超过 3 个，超出的信息用文字表达（`docs/specs/01-basic.md:986`）

## 无障碍（来自正式规格 §10）

- 可选芯片角色为 `checkbox`（多选）或 `radio`（单选），朗读"已完成，已选中"（`docs/specs/01-basic.md:1004`）
- 删除键标签"移除筛选：妈妈"（`docs/specs/01-basic.md:1005`）
- 展示型芯片不作为焦点元素（`docs/specs/01-basic.md:1006`）
- 触控热区：可选 32 高需补到 44；删除键 28×28 需补到 44（`docs/specs/01-basic.md:1007`）
- 选中态不依赖颜色：已选芯片同时有底色变化和文字加粗（`docs/specs/01-basic.md:1008`）

## 契约摘要（来自 YAML）

- params: 6
- slots: label, leadingIcon
- enums: WDChipSize

## 检索与组合 overlay（不得覆盖真源）

- searchAliases: none
- combinesWith: none
- pageRegions: none

## 平台说明

本卡不包含任何 Swift / Kotlin 平台 API 猜测。平台实现与证据只由对应 Provider 提供。
