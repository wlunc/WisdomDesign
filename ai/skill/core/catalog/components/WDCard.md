<!-- GENERATED FILE - DO NOT EDIT. -->
<!-- Source: wisdomdesign design truth sources via tools/ai-skill/lib/extract-design.js. -->
<!-- Regenerate with: node tools/ai-skill/lib/extract-design.js | node tools/ai-skill/lib/generate-core-catalog.js --out <dir> -->
<!-- No platform API claims are included. -->

# WDCard 语义卡

Component: `WDCard`
Spec: `docs/specs/01-basic.md` (number 17)
Contract: `contracts/WDCard.yaml` (sha256 `6e12256c34c52689c625fff3172698dcae829f974d9621d5281dfa8fe5a36d1c`)

## 用途（来自正式规格 §1）

把一组相关内容圈在一起。**卡片是分组手段，不是装饰**。

- **用**：一组相关的信息、一张图上加一段文字、需要整体可点的内容块
- **不要用**：单个列表项（用 `WDListRow`）；只是为了"看起来有层次"而加卡片；卡片里再套卡片

## 来源追溯

- `docs/specs/01-basic.md:1557`
- `docs/specs/01-basic.md:1559`
- `docs/specs/01-basic.md:1564`
- `docs/specs/01-basic.md:1561`
- `docs/specs/01-basic.md:1562`
- `docs/specs/01-basic.md:1618`
- `docs/specs/01-basic.md:1622`
- `docs/specs/01-basic.md:1623`
- `docs/specs/01-basic.md:1624`
- `docs/specs/01-basic.md:1625`
- `docs/specs/01-basic.md:1626`
- `docs/specs/01-basic.md:1628`
- `docs/specs/01-basic.md:1638`
- `docs/specs/01-basic.md:1640`
- `docs/specs/01-basic.md:1641`
- `docs/specs/01-basic.md:1642`
- `docs/specs/01-basic.md:1657`
- `docs/specs/01-basic.md:1659`
- `docs/specs/01-basic.md:1660`
- `docs/specs/01-basic.md:1661`
- `docs/specs/01-basic.md:1662`

## 状态（来自正式规格 §5）

- 状态=静态; 视觉=见变体表（`docs/specs/01-basic.md:1622`）
- 状态=可点 · 按下; 视觉=整卡亮度降到 96%，`motion.duration.instant`（`media` 卡的图片一起压暗）（`docs/specs/01-basic.md:1623`）
- 状态=可点 · 禁用; 视觉=整体 40%（`docs/specs/01-basic.md:1624`）
- 状态=`media` · 图片加载中 / 失败; 视觉=`surface.card-sunken` 灰底，无骨架、无微光、不出破图（`docs/specs/01-basic.md:1625`）
- 状态=`media` · 图片就绪; 视觉=160ms 淡入（`motion.duration.fast`），不用缩放（`docs/specs/01-basic.md:1626`）
- 卡片默认**不可点**。只有整卡确实是一个动作时才加按下反馈，且这种情况下不应再在卡内放箭头。（`docs/specs/01-basic.md:1628`）

## 内容（来自正式规格 §7）

- 一张卡表达一件事。卡内出现两个不相关的主题就应该拆成两张（`docs/specs/01-basic.md:1640`）
- 标题一行，最多 20 个汉字，超出截断（`docs/specs/01-basic.md:1641`）
- 正文最多三行，超出截断并在末尾加省略号（`docs/specs/01-basic.md:1642`）

## 无障碍（来自正式规格 §10）

- 静态卡不进入无障碍焦点序列，内容逐项朗读（`docs/specs/01-basic.md:1659`）
- 可点卡作为整体朗读，角色为 `button`，朗读文本由卡内标题提供（`docs/specs/01-basic.md:1660`）
- 卡内不要出现嵌套的可点区域（整卡可点时）（`docs/specs/01-basic.md:1661`）
- 文字与卡片底色的对比度 ≥ 4.5:1；`outline` 变体描边与背景对比度 ≥ 3:1（`docs/specs/01-basic.md:1662`）

## 契约摘要（来自 YAML）

- params: 4
- slots: content
- enums: WDCardStyle

## 检索与组合 overlay（不得覆盖真源）

- searchAliases: none
- combinesWith: none
- pageRegions: none

## 平台说明

本卡不包含任何 Swift / Kotlin 平台 API 猜测。平台实现与证据只由对应 Provider 提供。
