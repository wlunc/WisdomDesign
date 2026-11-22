<!-- GENERATED FILE - DO NOT EDIT. -->
<!-- Source: wisdomdesign design truth sources via tools/ai-skill/lib/extract-design.js. -->
<!-- Regenerate with: node tools/ai-skill/lib/extract-design.js | node tools/ai-skill/lib/generate-core-catalog.js --out <dir> -->
<!-- No platform API claims are included. -->

# WDSkeleton 语义卡

Component: `WDSkeleton`
Spec: `docs/specs/02-advanced.md` (number 31)
Contract: `contracts/WDSkeleton.yaml` (sha256 `922227563e2566c6761a954b1130b9b58f547b780357ff97db96166a35bfcff9`)

## 用途（来自正式规格 §1）

内容加载中的占位，**保持布局稳定**，避免内容出现时页面跳动。

- **用**：首次加载列表、卡片、详情页
- **不要用**：加载时间可预期且很短（< 300ms）；加载失败（用 `WDEmptyState`）

## 来源追溯

- `docs/specs/02-advanced.md:1055`
- `docs/specs/02-advanced.md:1057`
- `docs/specs/02-advanced.md:1060`
- `docs/specs/02-advanced.md:1059`
- `docs/specs/02-advanced.md:1084`
- `docs/specs/02-advanced.md:1086`
- `docs/specs/02-advanced.md:1094`
- `docs/specs/02-advanced.md:1096`
- `docs/specs/02-advanced.md:1097`
- `docs/specs/02-advanced.md:1112`
- `docs/specs/02-advanced.md:1114`
- `docs/specs/02-advanced.md:1115`
- `docs/specs/02-advanced.md:1116`
- `docs/specs/02-advanced.md:1117`

## 状态（来自正式规格 §5）

- 只有一种状态（加载中）。加载完成后骨架**整块替换**为真实内容，不做逐块替换。（`docs/specs/02-advanced.md:1086`）

## 内容（来自正式规格 §7）

- 骨架内**不写任何文字**。写"加载中…"会让页面在加载完成时发生文本跳动。（`docs/specs/02-advanced.md:1096`）
- 需要说明进度时用 `WDProgressBar` 的不确定态。（`docs/specs/02-advanced.md:1097`）

## 无障碍（来自正式规格 §10）

- 骨架容器标注 `aria-busy="true"`（`docs/specs/02-advanced.md:1114`）
- 整个骨架区朗读**一次**"加载中"，不要每个灰块都朗读（`docs/specs/02-advanced.md:1115`）
- 加载完成后朗读"内容已加载"，并把焦点保持在原位置（`docs/specs/02-advanced.md:1116`）
- 灰块与背景对比度约 1.5:1 即可，不需要文字级对比度（它不是文字）（`docs/specs/02-advanced.md:1117`）

## 契约摘要（来自 YAML）

- params: 3
- slots: 无
- enums: WDSkeletonVariant

## 检索与组合 overlay（不得覆盖真源）

- searchAliases: none
- combinesWith: none
- pageRegions: none

## 平台说明

本卡不包含任何 Swift / Kotlin 平台 API 猜测。平台实现与证据只由对应 Provider 提供。
