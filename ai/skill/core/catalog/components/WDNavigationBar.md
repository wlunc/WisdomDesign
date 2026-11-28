<!-- GENERATED FILE - DO NOT EDIT. -->
<!-- Source: wisdomdesign design truth sources via tools/ai-skill/lib/extract-design.js. -->
<!-- Regenerate with: node tools/ai-skill/lib/extract-design.js | node tools/ai-skill/lib/generate-core-catalog.js --out <dir> -->
<!-- No platform API claims are included. -->

# WDNavigationBar 语义卡

Component: `WDNavigationBar`
Spec: `docs/specs/02-advanced.md` (number 33)
Contract: `contracts-digest.json#WDNavigationBar` (source `contracts/WDNavigationBar.yaml`, sha256 `ed51c696550b86ecf1dffe2bbec9d43f4ca058bb645646e234e105783fd0a2e9`)

## 用途（来自正式规格 §1）

页面级导航容器：告诉用户"这是哪"，并提供返回与页面级操作。

- **用**：每个二级及以上页面
- **不要用**：Tab 内的一级页面加返回按钮（一级页面没有返回）；把页面内容塞进导航栏

## 来源追溯

- `docs/specs/02-advanced.md:1247,1249,1251,1252,1254,1258,1259,1260,1261,1263,1267,1268,1269,1271,1273,1277,1278,1279,1281,1285,1286,1287,1288,1297,1299,1300,1301,1321,1323,1324,1325,1326,1327`

## 设计者摘要

高度 44 / 56 / 96；必有 标题；可选 右侧操作。

## 解剖（来自正式规格 §2）

- 段=返回 / 关闭; 是否必有=条件; 说明=二级页必有；一级页没有（`docs/specs/02-advanced.md:1258`）
- 段=标题; 是否必有=必有; 说明=内联模式 `type.headline` 17 · 600，居中或左对齐（跟平台）（`type.headline` = 17/22 · 600）（`docs/specs/02-advanced.md:1259`）
- 段=右侧操作; 是否必有=可选; 说明=**最多 2 个**图标按钮，间距 `space.3`（8）（`docs/specs/02-advanced.md:1260`）
- 段=大标题; 是否必有=条件; 说明=大标题模式才有，`type.largeTitle` 34 · 700，左对齐（`type.largeTitle` = 34/41 · 700）（`docs/specs/02-advanced.md:1261`）

## 尺寸（来自正式规格 §3）

- 模式=内联（紧凑）; 高度=44; 组成=状态栏下的单行（`docs/specs/02-advanced.md:1267`）
- 模式=标准; 高度=56; 组成=单行 + 上下留白（`docs/specs/02-advanced.md:1268`）
- 模式=大标题; 高度=96; 组成=内联行 44 + 大标题区 52（`docs/specs/02-advanced.md:1269`）
- 图标按钮 32×32 视觉，热区 44×44。左右边距 `space.5`（16）。（`docs/specs/02-advanced.md:1271`）

## 变体（来自正式规格 §4）

- 变体=透明; 说明=页面顶部，内容未滚动时无底色（`docs/specs/02-advanced.md:1277`）
- 变体=玻璃; 说明=内容滚动到栏下方时切换为 `surface.glass` + `border.glass-top`（`surface.glass` = 浅 #FFFFFFB3 / 深 #0C202C9E；`border.glass-top` = 浅 #FFFFFFCC / 深 #FFFFFF29）（`docs/specs/02-advanced.md:1278`）
- 变体=大标题; 说明=标题独立成行，滚动时收缩为内联（`docs/specs/02-advanced.md:1279`）

## 状态（来自正式规格 §5）

- 状态=未滚动; 视觉=透明底，无分割线; 动效=—（`docs/specs/02-advanced.md:1285`）
- 状态=已滚动; 视觉=`surface.glass` + 底部 1pt `border.hairline`; 动效=240ms 交叉淡化（`docs/specs/02-advanced.md:1286`）
- 状态=大标题收缩; 视觉=大标题缩到内联标题的位置并降字号; 动效=`motion.spring.gentle`（`docs/specs/02-advanced.md:1287`）
- 状态=返回按下; 视觉=按钮缩放 0.97 + `fill.pressed`; 动效=100ms（`docs/specs/02-advanced.md:1288`）

## 内容（来自正式规格 §7）

- 标题 ≤ 8 个汉字，用页面名而不是动作名（"家庭"而不是"查看家庭"）（`docs/specs/02-advanced.md:1299`）
- 标题不用缩写、不用省略号；放不下时优先缩短文案（`docs/specs/02-advanced.md:1300`）
- 返回按钮**只显示箭头不显示文字**（除非空间充裕且需要指明来源页）（`docs/specs/02-advanced.md:1301`）

## 无障碍（来自正式规格 §10）

- 导航栏作为 `header` 语义，标题作为页面标题被首个朗读（`docs/specs/02-advanced.md:1323`）
- 返回按钮标签包含来源页名："返回家庭列表"（`docs/specs/02-advanced.md:1324`）
- 右侧图标按钮必须有独立标签（`docs/specs/02-advanced.md:1325`）
- 大标题收缩时读屏**仍能读到完整标题**，不能因为视觉收缩而丢失（`docs/specs/02-advanced.md:1326`）
- 触控热区 ≥ 44×44（`docs/specs/02-advanced.md:1327`）

## 契约摘要（来自 YAML）

- params: 6
- slots: title, leading, trailing
- enums: WDNavigationBarMode, WDNavigationBarStyle

## 检索与组合 overlay（不得覆盖真源）

- searchAliases: 导航栏, 顶部栏, 标题栏, 返回栏, navigation bar
- combinesWith: WDIconButton
- pageRegions: navigation

## 平台说明

本卡不包含任何 Swift / Kotlin 平台 API 猜测。平台实现与证据只由对应 Provider 提供。
