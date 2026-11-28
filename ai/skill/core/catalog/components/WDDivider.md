<!-- GENERATED FILE - DO NOT EDIT. -->
<!-- Source: wisdomdesign design truth sources via tools/ai-skill/lib/extract-design.js. -->
<!-- Regenerate with: node tools/ai-skill/lib/extract-design.js | node tools/ai-skill/lib/generate-core-catalog.js --out <dir> -->
<!-- No platform API claims are included. -->

# WDDivider 语义卡

Component: `WDDivider`
Spec: `docs/specs/01-basic.md` (number 14)
Contract: `contracts-digest.json#WDDivider` (source `contracts/WDDivider.yaml`, sha256 `3505f4ae6ecd91c75c710f3d953d569d65235c2aa3fb74ffc96c0d4e48e7ba9a`)

## 用途（来自正式规格 §1）

分隔。**这是最后手段**——能用间距表达的，不要画线。

- **用**：列表行之间、两个语义不同的区块之间
- **不要用**：卡片与卡片之间（用 `space.4` 间距）；分组标题与内容之间（用间距）；装饰性分隔

## 来源追溯

- `docs/specs/01-basic.md:1304,1306,1308,1309,1311,1313,1315,1319,1320,1322,1324,1326,1328,1336,1338,1348,1350`

## 设计者摘要

一条 1pt 的线，无圆角。

## 解剖（来自正式规格 §2）

- 一条 1pt 的线，无圆角。（`docs/specs/01-basic.md:1313`）

## 尺寸（来自正式规格 §3）

- 变体=全宽; 起点=容器左边缘; 终点=容器右边缘（`docs/specs/01-basic.md:1319`）
- 变体=内缩; 起点=文本区起始（16 + 34 + 12 = 62）; 终点=容器右边缘（`docs/specs/01-basic.md:1320`）

## 变体（来自正式规格 §4）

- 全宽 / 内缩两种。列表行之间用内缩，卡片内部整体分区用全宽。（`docs/specs/01-basic.md:1324`）

## 状态（来自正式规格 §5）

- 无状态。颜色固定 `border.hairline`，不随选中或按下变化。（`docs/specs/01-basic.md:1328`）

## 内容（来自正式规格 §7）

- 分割线不带文字。需要标签的分隔请用分组标题（`WDListSection`）。（`docs/specs/01-basic.md:1338`）

## 无障碍（来自正式规格 §10）

- 不进入无障碍树；分组语义由 `WDListSection` 的标题承担，不由分割线承担。（`docs/specs/01-basic.md:1350`）

## 契约摘要（来自 YAML）

- params: 1
- slots: 无
- enums: WDDividerStyle

## 检索与组合 overlay（不得覆盖真源）

- searchAliases: 分割线, 分隔线, 横线, divider
- combinesWith: none
- pageRegions: collection, form

## 平台说明

本卡不包含任何 Swift / Kotlin 平台 API 猜测。平台实现与证据只由对应 Provider 提供。
