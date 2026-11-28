<!-- GENERATED FILE - DO NOT EDIT. -->
<!-- Source: wisdomdesign design truth sources via tools/ai-skill/lib/extract-design.js. -->
<!-- Regenerate with: node tools/ai-skill/lib/extract-design.js | node tools/ai-skill/lib/generate-core-catalog.js --out <dir> -->
<!-- No platform API claims are included. -->

# WDCard 语义卡

Component: `WDCard`
Spec: `docs/specs/01-basic.md` (number 17)
Contract: `contracts-digest.json#WDCard` (source `contracts/WDCard.yaml`, sha256 `6e12256c34c52689c625fff3172698dcae829f974d9621d5281dfa8fe5a36d1c`)

## 用途（来自正式规格 §1）

把一组相关内容圈在一起。**卡片是分组手段，不是装饰**。

- **用**：一组相关的信息、一张图上加一段文字、需要整体可点的内容块
- **不要用**：单个列表项（用 `WDListRow`）；只是为了"看起来有层次"而加卡片；卡片里再套卡片

## 来源追溯

- `docs/specs/01-basic.md:1557,1559,1561,1562,1564,1566,1568,1570,1574,1575,1576,1577,1578,1580,1582,1584,1588,1589,1590,1591,1592,1594,1595,1596,1597,1598,1602,1606,1607,1608,1609,1610,1612,1613,1615,1616,1618,1622,1623,1624,1625,1626,1628,1638,1640,1641,1642,1657,1659,1660,1661,1662`

## 设计者摘要

内边距 `space.5` **16（固定，所有变体一致）**；卡间距 `space.4` 12；分组间距 `space.7` 24；最小宽度 不设，由父级决定；圆角 `radius.xl` 24。

## 解剖（来自正式规格 §2）

- 容器 + 内边距 + 内容三段。内容可以是任意组合，但容器本身不带任何内置结构。（`docs/specs/01-basic.md:1568`）

## 尺寸（来自正式规格 §3）

- 项=内边距; 值=`space.5` **16（固定，所有变体一致）**（`space.5` = 16）（`docs/specs/01-basic.md:1574`）
- 项=圆角; 值=`radius.xl` 24（`radius.xl` = 24）（`docs/specs/01-basic.md:1575`）
- 项=卡间距; 值=`space.4` 12（`space.4` = 12）（`docs/specs/01-basic.md:1576`）
- 项=分组间距; 值=`space.7` 24（`space.7` = 24）（`docs/specs/01-basic.md:1577`）
- 项=最小宽度; 值=不设，由父级决定（`docs/specs/01-basic.md:1578`）
- 嵌套时内层圆角 = 外层圆角 − 内边距（24 − 16 = 8，即 `radius.xs`）。（`radius.xs` = 8）（`docs/specs/01-basic.md:1580`）
- #### `media` 的图片几何（A-13 定稿 2026-11-21）（`docs/specs/01-basic.md:1582`）
- `media` 的内边距 **16 只对文字区生效**；图片带是自己的盒子，**通栏**（左右与上边贴到卡片边缘）。（`docs/specs/01-basic.md:1584`）
- 项=图片宽高比; 值=**16:9（1.78）**; 令牌=`size.card-media.aspect-ratio`（`size.card-media.aspect-ratio` = 1.78）（`docs/specs/01-basic.md:1588`）
- 项=图片最小高; 值=**96**; 令牌=`size.card-media.min-height`（`size.card-media.min-height` = 96）（`docs/specs/01-basic.md:1589`）
- 项=图片带圆角; 值=上 = 卡片圆角 24，**下边不圆**; 令牌=`radius.xl`（`radius.xl` = 24）（`docs/specs/01-basic.md:1590`）
- 项=图片内边距; 值=**0**; 令牌=—（`docs/specs/01-basic.md:1591`）
- 项=文字区内边距; 值=**16**（`space.5`）; 令牌=—（`space.5` = 16）（`docs/specs/01-basic.md:1592`）
- 尺寸实算：卡片宽 343 → 图片带高 **193**；390 → 219；窄到 171 时按最小高 96 渲染、图片居中裁切；（`docs/specs/01-basic.md:1594`）
- **卡片宽 < 171 不建议用 `media`**（图片带会被最小高撑成"方图"，失去横幅感）；（`docs/specs/01-basic.md:1595`）
- 图片就绪用 **160ms 淡入**（`motion.duration.fast`）；加载中 / 失败一律 **`surface.card-sunken` 灰底**，**不出破图、不出图标**；（`motion.duration.fast` = 160；`surface.card-sunken` = 浅 #EDF6F9 / 深 #0A1E2A）（`docs/specs/01-basic.md:1596`）
- 图片带默认**不放文字**；确要放角标时须垫 25% `surface.card-solid`（`06-accessibility.md` §5.2 规则 5）；（`surface.card-solid` = 浅 #FFFFFF / 深 #0C212D）（`docs/specs/01-basic.md:1597`）
- 图片默认是**装饰**（`accessibilityHidden`）；图片本身是内容时由调用方给无障碍标签。（`docs/specs/01-basic.md:1598`）

## 变体（来自正式规格 §4）

- 变体=`elevated`（默认）; 背景=`surface.card`; 描边=`border.hairline`; 阴影=`elevation.1`; 用在哪=主要内容卡片（`surface.card` = 浅 #FFFFFFF0 / 深 #132836D1；`border.hairline` = 浅 #0A1B2414 / 深 #FFFFFF1A；`elevation.1` = 0 1 2 #0A3C640A ; 0 6 16 #0A3C640F）（`docs/specs/01-basic.md:1606`）
- 变体=`glass`; 背景=`surface.glass-strong`; 描边=`border.hairline`; 阴影=`elevation.1` + 背景模糊; 用在哪=**浮在内容或图片之上时**（`surface.glass-strong` = 浅 #FFFFFFDB / 深 #0C202CC7；`border.hairline` = 浅 #0A1B2414 / 深 #FFFFFF1A；`elevation.1` = 0 1 2 #0A3C640A ; 0 6 16 #0A3C640F）（`docs/specs/01-basic.md:1607`）
- 变体=`outline`; 背景=透明; 描边=`border.hairline`; 阴影=无; 用在哪=密集列表、设置项（`border.hairline` = 浅 #0A1B2414 / 深 #FFFFFF1A）（`docs/specs/01-basic.md:1608`）
- 变体=`sunken`; 背景=`surface.card-sunken`; 描边=无; 阴影=无; 用在哪=卡内嵌块、次级信息（`surface.card-sunken` = 浅 #EDF6F9 / 深 #0A1E2A）（`docs/specs/01-basic.md:1609`）
- 变体=`media`; 背景=`surface.card`; 描边=`border.hairline`; 阴影=`elevation.1`; 用在哪=顶部图片 + 文字区（`surface.card` = 浅 #FFFFFFF0 / 深 #132836D1；`border.hairline` = 浅 #0A1B2414 / 深 #FFFFFF1A；`elevation.1` = 0 1 2 #0A3C640A ; 0 6 16 #0A3C640F）（`docs/specs/01-basic.md:1610`）
- **只有 `glass` 带背景模糊**。其余变体一律实底——在同一个圆角上叠"半透明 + 描边 + 内高光 + 背景模糊"，（`docs/specs/01-basic.md:1612`）
- 浏览器在圆角处采样背景会产生一圈重影，这是肉眼可见的瑕疵。（`docs/specs/01-basic.md:1613`）
- `media` 与 `glass` **互斥**（图片带不做模糊）；与 `sunken` 也不组合（`sunken` 是卡内嵌块，`media` 是顶层卡）。（`docs/specs/01-basic.md:1615`）
- 新增 `media` 会破穷尽 `switch`，属**源级 breaking**（`F-20`），按 minor + Breaking 段发布。（`docs/specs/01-basic.md:1616`）

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

- searchAliases: 卡片, 内容卡, 分组容器, card
- combinesWith: none
- pageRegions: collection, overview

## 平台说明

本卡不包含任何 Swift / Kotlin 平台 API 猜测。平台实现与证据只由对应 Provider 提供。
