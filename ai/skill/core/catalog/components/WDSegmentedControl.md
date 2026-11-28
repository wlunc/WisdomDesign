<!-- GENERATED FILE - DO NOT EDIT. -->
<!-- Source: wisdomdesign design truth sources via tools/ai-skill/lib/extract-design.js. -->
<!-- Regenerate with: node tools/ai-skill/lib/extract-design.js | node tools/ai-skill/lib/generate-core-catalog.js --out <dir> -->
<!-- No platform API claims are included. -->

# WDSegmentedControl 语义卡

Component: `WDSegmentedControl`
Spec: `docs/specs/02-advanced.md` (number 21)
Contract: `contracts-digest.json#WDSegmentedControl` (source `contracts/WDSegmentedControl.yaml`, sha256 `9cfe3787e7536810c2ef177e47a5cc60169949bb3948c0c8faf88e3a6666839b`)

## 用途（来自正式规格 §1）

2–5 个互斥选项之间切换，**切换即时生效，内容在同一页面内替换**。

- **用**：同一份数据的不同视图（今天 / 本周 / 全部）
- **不要用**：超过 5 项（用 `WDPicker`）；需要点保存才生效（用 `WDRadio`）；跳转到不同页面（用 `WDTabBar`）

## 来源追溯

- `docs/specs/02-advanced.md:13,15,17,18,20,22,26,27,28,30,34,35,36,37,38,40,44,45,47,49,53,54,55,56,64,66,67,68,89,91,92,93,94,95`

## 设计者摘要

容器高 38（内容 32 + 上下内边距 3）；单段最小宽 56；段水平内距 14；字号 13 · 500（选中 600）；圆角 `radius.full`。

## 解剖（来自正式规格 §2）

- 段=容器; 说明=胶囊，内边距 3，底 `surface.card` 或玻璃（`surface.card` = 浅 #FFFFFFF0 / 深 #132836D1）（`docs/specs/02-advanced.md:26`）
- 段=选中指示块; 说明=圆角胶囊，随选中项滑动；底色 `surface.card-solid` + `elevation.1`（`surface.card-solid` = 浅 #FFFFFF / 深 #0C212D；`elevation.1` = 0 1 2 #0A3C640A ; 0 6 16 #0A3C640F）（`docs/specs/02-advanced.md:27`）
- 段=各段; 说明=等宽，文字居中，竖向居中（`docs/specs/02-advanced.md:28`）

## 尺寸（来自正式规格 §3）

- 项=容器高; 值=38（内容 32 + 上下内边距 3）（`docs/specs/02-advanced.md:34`）
- 项=单段最小宽; 值=56（`docs/specs/02-advanced.md:35`）
- 项=段水平内距; 值=14（`docs/specs/02-advanced.md:36`）
- 项=字号; 值=13 · 500（选中 600）（`docs/specs/02-advanced.md:37`）
- 项=圆角; 值=`radius.full`（`radius.full` = 999）（`docs/specs/02-advanced.md:38`）

## 变体（来自正式规格 §4）

- 变体=玻璃; 容器底=`surface.glass` + `border.hairline`; 用在哪=浮在内容或图片之上（`surface.glass` = 浅 #FFFFFFB3 / 深 #0C202C9E；`border.hairline` = 浅 #0A1B2414 / 深 #FFFFFF1A）（`docs/specs/02-advanced.md:44`）
- 变体=实底; 容器底=`fill.field`; 用在哪=页面内常规位置（`fill.field` = 浅 #0A1B240D / 深 #FFFFFF12）（`docs/specs/02-advanced.md:45`）
- 2–5 段均可；段宽等分，不按文字长度分配。（`docs/specs/02-advanced.md:47`）

## 状态（来自正式规格 §5）

- 状态=未选; 视觉=文字 `text.secondary`; 动效=—（`docs/specs/02-advanced.md:53`）
- 状态=选中; 视觉=指示块滑到该段；文字 `text.primary` 600; 动效=指示块 280ms `motion.spring.snappy`；文字 160ms（`docs/specs/02-advanced.md:54`）
- 状态=按下; 视觉=该段文字临时降到 70% 不透明度; 动效=100ms（`docs/specs/02-advanced.md:55`）
- 状态=禁用; 视觉=整体 40%，不响应; 动效=无（`docs/specs/02-advanced.md:56`）

## 内容（来自正式规格 §7）

- 每段 2–4 个汉字，等长最佳（`docs/specs/02-advanced.md:66`）
- 段文字不用标点、不用换行（`docs/specs/02-advanced.md:67`）
- 同一组内句式一致（都是名词，或都是时间范围）（`docs/specs/02-advanced.md:68`）

## 无障碍（来自正式规格 §10）

- 容器角色为 `tablist`，每段角色为 `tab`，并标注"第 n 项，共 m 项"（`docs/specs/02-advanced.md:91`）
- 选中项标注 `aria-selected="true"`（`docs/specs/02-advanced.md:92`）
- 内容区角色为 `tabpanel`，与对应 tab 关联（`docs/specs/02-advanced.md:93`）
- 触控热区：单段高度 38 需补到 44（纵向向外扩 3）（`docs/specs/02-advanced.md:94`）
- 选中态不依赖颜色：指示块的位置与文字字重同时变化（`docs/specs/02-advanced.md:95`）

## 契约摘要（来自 YAML）

- params: 3
- slots: items
- enums: WDSegmentedControlStyle

## 检索与组合 overlay（不得覆盖真源）

- searchAliases: 分段控件, 分段, 视图切换, segmented control
- combinesWith: WDChip
- pageRegions: collection-header, toolbar

## 平台说明

本卡不包含任何 Swift / Kotlin 平台 API 猜测。平台实现与证据只由对应 Provider 提供。
