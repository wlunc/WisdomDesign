<!-- GENERATED FILE - DO NOT EDIT. -->
<!-- Source: wisdomdesign design truth sources via tools/ai-skill/lib/extract-design.rb. -->
<!-- Regenerate with: ruby tools/ai-skill/lib/extract-design.rb | node tools/ai-skill/lib/generate-core-catalog.js --out <dir> -->
<!-- No platform API claims are included. -->

# WDTabBar 语义卡

Component: `WDTabBar`
Spec: `docs/specs/02-advanced.md` (number 34)
Contract: `contracts/WDTabBar.yaml` (sha256 `33ab6fbe23b55293c755168a9863f8b3e1b5988bbf2e614c19407e912ee63f43`)

## 用途（来自正式规格 §1）

顶层导航。在互不隶属的几个主区域之间切换。

- **用**：2–5 个平级的主区域
- **不要用**：超过 5 个（需要重新做信息架构）；二级页面（用 `WDNavigationBar`）；页面内的视图切换（用 `WDSegmentedControl`）

## 来源追溯

- `docs/specs/02-advanced.md:1356`
- `docs/specs/02-advanced.md:1358`
- `docs/specs/02-advanced.md:1361`
- `docs/specs/02-advanced.md:1360`
- `docs/specs/02-advanced.md:1386`
- `docs/specs/02-advanced.md:1390`
- `docs/specs/02-advanced.md:1391`
- `docs/specs/02-advanced.md:1392`
- `docs/specs/02-advanced.md:1393`
- `docs/specs/02-advanced.md:1401`
- `docs/specs/02-advanced.md:1403`
- `docs/specs/02-advanced.md:1404`
- `docs/specs/02-advanced.md:1405`
- `docs/specs/02-advanced.md:1421`
- `docs/specs/02-advanced.md:1423`
- `docs/specs/02-advanced.md:1424`
- `docs/specs/02-advanced.md:1425`
- `docs/specs/02-advanced.md:1426`

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

- searchAliases: none
- combinesWith: none
- pageRegions: none

## 平台说明

本卡不包含任何 Swift / Kotlin 平台 API 猜测。平台实现与证据只由对应 Provider 提供。
