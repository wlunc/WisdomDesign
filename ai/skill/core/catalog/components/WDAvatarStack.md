<!-- GENERATED FILE - DO NOT EDIT. -->
<!-- Source: wisdomdesign design truth sources via tools/ai-skill/lib/extract-design.js. -->
<!-- Regenerate with: node tools/ai-skill/lib/extract-design.js | node tools/ai-skill/lib/generate-core-catalog.js --out <dir> -->
<!-- No platform API claims are included. -->

# WDAvatarStack 语义卡

Component: `WDAvatarStack`
Spec: `docs/specs/01-basic.md` (number 13)
Contract: `contracts/WDAvatarStack.yaml` (sha256 `b39f848469f2f4f0bcd9731e977908ee2cbe77f515191e6ea435063dc5c403fc`)

## 用途（来自正式规格 §1）

一眼看出"有多少人参与"。用于卡片头部、任务归属、共享状态。

- **用**：成员数 2 人及以上
- **不要用**：1 个人（直接用 `WDAvatar`）；需要精确知道每个人是谁（用完整列表）

## 来源追溯

- `docs/specs/01-basic.md:1222,1224,1226,1227,1249,1251,1259,1261,1262,1263,1277,1279,1280,1281`

## 状态（来自正式规格 §5）

- 堆叠本身无状态。成员变动时（新增/离开）用 240ms 淡入淡出，不重排已有位置。（`docs/specs/01-basic.md:1251`）

## 内容（来自正式规格 §7）

- `+n` 中的 n = 总人数 − 已显示数（`docs/specs/01-basic.md:1261`）
- 少于 2 人不使用堆叠（`docs/specs/01-basic.md:1262`）
- 溢出项用 `text.secondary` 而不是某个成员的配色（`docs/specs/01-basic.md:1263`）

## 无障碍（来自正式规格 §10）

- 作为**一个**元素朗读："家庭成员 6 人：我、妈妈、爸爸、妹妹，另有 2 人"（`docs/specs/01-basic.md:1279`）
- 不逐个朗读每个头像，否则读屏用户要听 6 遍才能往下走（`docs/specs/01-basic.md:1280`）
- 触控热区 ≥ 44×44（堆叠整体）（`docs/specs/01-basic.md:1281`）

## 契约摘要（来自 YAML）

- params: 3
- slots: items
- enums: WDAvatarStackSize

## 检索与组合 overlay（不得覆盖真源）

- searchAliases: none
- combinesWith: none
- pageRegions: none

## 平台说明

本卡不包含任何 Swift / Kotlin 平台 API 猜测。平台实现与证据只由对应 Provider 提供。
