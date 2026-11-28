<!-- GENERATED FILE - DO NOT EDIT. -->
<!-- Source: wisdomdesign design truth sources via tools/ai-skill/lib/extract-design.js. -->
<!-- Regenerate with: node tools/ai-skill/lib/extract-design.js | node tools/ai-skill/lib/generate-core-catalog.js --out <dir> -->
<!-- No platform API claims are included. -->

# WDEmptyState 语义卡

Component: `WDEmptyState`
Spec: `docs/specs/02-advanced.md` (number 30)
Contract: `contracts-digest.json#WDEmptyState` (source `contracts/WDEmptyState.yaml`, sha256 `4d4e0cab2875a5a484210f19f4d4597449032cbfdf65d861bda39eab215bd43e`)

## 用途（来自正式规格 §1）

没有内容时，说明**为什么没有**以及**接下来能做什么**。

- **用**：首次进入列表、搜索无结果、权限受限、加载失败
- **不要用**：内容还在加载（用 `WDSkeleton`）；内容确实为空但用户不关心（直接留白）

## 来源追溯

- `docs/specs/02-advanced.md:958,960,962,963,965,967,971,972,973,974,976,980,981,982,983,984,986,990,991,992,993,995,997,999,1007,1009,1010,1011,1012,1026,1028,1029,1030,1031`

## 设计者摘要

底座 56×56；底座与标题间距 `space.4`（12）；标题与说明间距 `space.2`（4）；说明与操作间距 `space.5`（16）。

## 解剖（来自正式规格 §2）

- 圆形图标底座 + 标题 + 说明 + 一个主操作。四段都可选，但至少要有标题。（`docs/specs/02-advanced.md:967`）
- 段=图标底座; 规格=56×56 圆形，`gradient.surface` 底 + `text.on-soft` 图标 26（`gradient.surface` = 浅 linear-gradient(135deg,#B0D5DF 0%,#7EC4CF 100%) / 深 linear-gradient(135deg,#123449 0%,#0F4055 100%)；`text.on-soft` = 浅 #123F5C / 深 #B0D5DF）（`docs/specs/02-advanced.md:971`）
- 段=标题; 规格=`type.headline` 17 · 600（`type.headline` = 17/22 · 600）（`docs/specs/02-advanced.md:972`）
- 段=说明; 规格=`type.subheadline` 15，`text.secondary`，最多 2 行，居中（`type.subheadline` = 15/20 · 400；`text.secondary` = 浅 #3E5764 / 深 #A4BCCB）（`docs/specs/02-advanced.md:973`）
- 段=主操作; 规格=`WDButton` filled 或 tonal，最多一个（`docs/specs/02-advanced.md:974`）

## 尺寸（来自正式规格 §3）

- 项=底座; 值=56×56（`docs/specs/02-advanced.md:980`）
- 项=底座与标题间距; 值=`space.4`（12）（`docs/specs/02-advanced.md:981`）
- 项=标题与说明间距; 值=`space.2`（4）（`docs/specs/02-advanced.md:982`）
- 项=说明与操作间距; 值=`space.5`（16）（`docs/specs/02-advanced.md:983`）
- 项=文本最大宽; 值=32 个汉字宽（约 240）（`docs/specs/02-advanced.md:984`）

## 变体（来自正式规格 §4）

- 变体=首次空; 标题示例="还没有任务"; 操作="新建第一个任务"（`docs/specs/02-advanced.md:990`）
- 变体=搜索无结果; 标题示例="没找到"储物间""; 操作="清除筛选"（`docs/specs/02-advanced.md:991`）
- 变体=权限受限; 标题示例="需要通知权限"; 操作="去设置"（`docs/specs/02-advanced.md:992`）
- 变体=加载失败; 标题示例="加载失败"; 操作="重试"（`docs/specs/02-advanced.md:993`）
- 四种的差别不在视觉，而在**文案与操作**，配色保持一致。（`docs/specs/02-advanced.md:995`）

## 状态（来自正式规格 §5）

- 空状态本身无状态。加载失败的变体可以重复触发"重试"，重试期间按钮进入加载态。（`docs/specs/02-advanced.md:999`）

## 内容（来自正式规格 §7）

- 标题 ≤ 12 个汉字，陈述事实（"还没有任务"）（`docs/specs/02-advanced.md:1009`）
- 说明 ≤ 40 个汉字，给出原因或下一步，**不写"这里什么都没有"这类废话**（`docs/specs/02-advanced.md:1010`）
- 操作文案是动词短语，且与标题呼应（`docs/specs/02-advanced.md:1011`）
- 搜索无结果时，标题里带上用户输入的关键词，让用户确认搜的是什么（`docs/specs/02-advanced.md:1012`）

## 无障碍（来自正式规格 §10）

- 作为一组朗读：标题 → 说明 → 操作（`docs/specs/02-advanced.md:1028`）
- 图标底座标记为装饰（`docs/specs/02-advanced.md:1029`）
- 读屏用户进入空页面时，标题应能被首个朗读到（`docs/specs/02-advanced.md:1030`）
- 文字对比度 ≥ 4.5:1，说明文字用 `text.secondary` 已满足（`docs/specs/02-advanced.md:1031`）

## 契约摘要（来自 YAML）

- params: 4
- slots: icon, title, message, actions
- enums: none

## 检索与组合 overlay（不得覆盖真源）

- searchAliases: 空状态, 空页面, 无内容, 空列表, empty state
- combinesWith: none
- pageRegions: page-body

## 平台说明

本卡不包含任何 Swift / Kotlin 平台 API 猜测。平台实现与证据只由对应 Provider 提供。
