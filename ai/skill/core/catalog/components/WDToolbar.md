<!-- GENERATED FILE - DO NOT EDIT. -->
<!-- Source: wisdomdesign design truth sources via tools/ai-skill/lib/extract-design.js. -->
<!-- Regenerate with: node tools/ai-skill/lib/extract-design.js | node tools/ai-skill/lib/generate-core-catalog.js --out <dir> -->
<!-- No platform API claims are included. -->

# WDToolbar 语义卡

Component: `WDToolbar`
Spec: `docs/specs/02-advanced.md` (number 35)
Contract: `contracts/WDToolbar.yaml` (sha256 `73b58dc7c76142ede662be365ce2662fb47c1bdb906b5c5002ab4378b479fa8f`)

## 用途（来自正式规格 §1）

与**当前上下文**相关的一组操作。和 TabBar 的区别是：TabBar 切换区域，Toolbar 操作当前内容。

- **用**：编辑器（撤销/重做/格式）、画布（缩放/对齐）、多选状态下的批量操作
- **不要用**：页面级导航（用 `WDNavigationBar`）；主区域切换（用 `WDTabBar`）；少于 2 个操作

## 来源追溯

- `docs/specs/02-advanced.md:1452,1454,1456,1457,1482,1486,1487,1488,1489,1498,1500,1501,1502,1541,1543,1544,1545,1546,1547,1548`

## 状态（来自正式规格 §5）

- 状态=默认; 视觉=`surface.glass-strong` + `border.hairline` + `elevation.1`（`docs/specs/02-advanced.md:1486`）
- 状态=按钮按下; 视觉=按钮缩放 0.94 + `fill.pressed`（`docs/specs/02-advanced.md:1487`）
- 状态=按钮选中; 视觉=按钮底 `gradient.mid` + 白色图标（`docs/specs/02-advanced.md:1488`）
- 状态=按钮禁用; 视觉=40%，不响应（`docs/specs/02-advanced.md:1489`）

## 内容（来自正式规格 §7）

- 最多 7 个操作，超过时把低频操作收进"更多"（`docs/specs/02-advanced.md:1500`）
- 图标必须语义明确，含义模糊的图标要配短文字（`docs/specs/02-advanced.md:1501`）
- 破坏性操作不放进 Toolbar（容易误触）（`docs/specs/02-advanced.md:1502`）

## 无障碍（来自正式规格 §10）

- 每个图标按钮必须有标签，长按提示是补充不是替代（`docs/specs/02-advanced.md:1543`）
- 整条工具栏有分组标签（如"编辑工具"）（`docs/specs/02-advanced.md:1544`）
- 按钮的选中 / 禁用状态要能被读出（`docs/specs/02-advanced.md:1545`）
- 触控热区 ≥ 44×44（按钮视觉 36，热区向外扩 4）（`docs/specs/02-advanced.md:1546`）
- 长按提示 `accessibilityHidden`，不进无障碍树、不重复播报（`docs/specs/02-advanced.md:1547`）
- 功能在**点击**路径上必须可达（长按只是辅助路径，不能是唯一入口）（`docs/specs/02-advanced.md:1548`）

## 契约摘要（来自 YAML）

- params: 4
- slots: items
- enums: none

## 检索与组合 overlay（不得覆盖真源）

- searchAliases: none
- combinesWith: none
- pageRegions: none

## 平台说明

本卡不包含任何 Swift / Kotlin 平台 API 猜测。平台实现与证据只由对应 Provider 提供。
