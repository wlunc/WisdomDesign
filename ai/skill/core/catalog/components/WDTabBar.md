<!-- GENERATED FILE - DO NOT EDIT. -->
<!-- Source: wisdomdesign design truth sources via tools/ai-skill/lib/extract-design.js. -->
<!-- Regenerate with: node tools/ai-skill/lib/extract-design.js | node tools/ai-skill/lib/generate-core-catalog.js --out <dir> -->
<!-- No platform API claims are included. -->

# WDTabBar 语义卡

Component: `WDTabBar`
Spec: `docs/specs/02-advanced.md` (number 34)
Contract: `contracts-digest.json#WDTabBar` (source `contracts/WDTabBar.yaml`, sha256 `33ab6fbe23b55293c755168a9863f8b3e1b5988bbf2e614c19407e912ee63f43`)

## 用途（来自正式规格 §1）

顶层导航。在互不隶属的几个主区域之间切换。

- **用**：2–5 个平级的主区域
- **不要用**：超过 5 个（需要重新做信息架构）；二级页面（用 `WDNavigationBar`）；页面内的视图切换（用 `WDSegmentedControl`）

## 来源追溯

- `docs/specs/02-advanced.md:1356,1358,1360,1361,1363,1365,1367,1371,1372,1373,1374,1375,1376,1377,1379,1383,1384,1386,1390,1391,1392,1393,1401,1403,1404,1405,1421,1423,1424,1425,1426`

## 设计者摘要

高度 58；距左右边缘 `space.5`（16）；距底部安全区 `space.3`（8）；图标 22；圆角 `radius.full`。

## 解剖（来自正式规格 §2）

- 悬浮玻璃胶囊 + 若干项目（图标 + 标签 + 选中标记）。（`docs/specs/02-advanced.md:1365`）

## 尺寸（来自正式规格 §3）

- 项=高度; 值=58（`docs/specs/02-advanced.md:1371`）
- 项=距左右边缘; 值=`space.5`（16）（`docs/specs/02-advanced.md:1372`）
- 项=距底部安全区; 值=`space.3`（8）（`docs/specs/02-advanced.md:1373`）
- 项=图标; 值=22（`docs/specs/02-advanced.md:1374`）
- 项=标签; 值=10 · 500（选中 600）（`docs/specs/02-advanced.md:1375`）
- 项=圆角; 值=`radius.full`（`radius.full` = 999）（`docs/specs/02-advanced.md:1376`）
- 项=项目数; 值=2–5（`docs/specs/02-advanced.md:1377`）

## 变体（来自正式规格 §4）

- 变体=iOS 悬浮胶囊; 说明=默认，浮在内容之上，带 `elevation.2`（`elevation.2` = 0 2 6 #0A3C640F ; 0 14 32 #0A3C6417）（`docs/specs/02-advanced.md:1383`）
- 变体=Android 全宽; 说明=贴底全宽，`surface.glass-strong`，选中项用胶囊底（`surface.glass-strong` = 浅 #FFFFFFDB / 深 #0C202CC7）（`docs/specs/02-advanced.md:1384`）

## 状态（来自正式规格 §5）

- 状态=未选; 视觉=图标与标签 `text.tertiary`; 动效=—（`docs/specs/02-advanced.md:1390`）
- 状态=选中; 视觉=图标与标签 `text.brand`，标签加粗，下方 4pt 圆点; 动效=200ms（`docs/specs/02-advanced.md:1391`）
- 状态=按下; 视觉=图标缩放 0.94; 动效=100ms（`docs/specs/02-advanced.md:1392`）
- 状态=带角标; 视觉=图标右上角计数徽标; 动效=—（`docs/specs/02-advanced.md:1393`）

## 内容（来自正式规格 §7）

- 标签 ≤ 4 个汉字，用名词（"今天"、"家庭"）（`docs/specs/02-advanced.md:1403`）
- 不用图标代替标签（首次使用的用户认不出）（`docs/specs/02-advanced.md:1404`）
- 角标计数超 99 显示"99+"，为 0 时隐藏（`docs/specs/02-advanced.md:1405`）

## 无障碍（来自正式规格 §10）

- 容器角色为 `tablist`，每项角色 `tab`（`docs/specs/02-advanced.md:1423`）
- 朗读"第 n 项，共 m 项"，选中项标注 `aria-selected`（`docs/specs/02-advanced.md:1424`）
- 触控热区：单项宽度足够，高度 58 已满足（`docs/specs/02-advanced.md:1425`）
- 选中态不依赖颜色：同时有圆点与字重变化（`docs/specs/02-advanced.md:1426`）

## 契约摘要（来自 YAML）

- params: 2
- slots: items
- enums: none

## 检索与组合 overlay（不得覆盖真源）

- searchAliases: 标签栏, 底部导航, 底部标签, tab bar
- combinesWith: none
- pageRegions: tab

## 平台说明

本卡不包含任何 Swift / Kotlin 平台 API 猜测。平台实现与证据只由对应 Provider 提供。
