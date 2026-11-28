<!-- GENERATED FILE - DO NOT EDIT. -->
<!-- Source: wisdomdesign design truth sources via tools/ai-skill/lib/extract-design.js. -->
<!-- Regenerate with: node tools/ai-skill/lib/extract-design.js | node tools/ai-skill/lib/generate-core-catalog.js --out <dir> -->
<!-- No platform API claims are included. -->

# WDSkeleton 语义卡

Component: `WDSkeleton`
Spec: `docs/specs/02-advanced.md` (number 31)
Contract: `contracts-digest.json#WDSkeleton` (source `contracts/WDSkeleton.yaml`, sha256 `922227563e2566c6761a954b1130b9b58f547b780357ff97db96166a35bfcff9`)

## 用途（来自正式规格 §1）

内容加载中的占位，**保持布局稳定**，避免内容出现时页面跳动。

- **用**：首次加载列表、卡片、详情页
- **不要用**：加载时间可预期且很短（< 300ms）；加载失败（用 `WDEmptyState`）

## 来源追溯

- `docs/specs/02-advanced.md:1055,1057,1059,1060,1062,1064,1065,1067,1071,1072,1073,1074,1076,1080,1081,1082,1084,1086,1094,1096,1097,1112,1114,1115,1116,1117`

## 设计者摘要

灰色块 + 微光扫过。骨架的**形状必须和真实内容一致**——形状不一致的骨架比没有骨架更糟，。

## 解剖（来自正式规格 §2）

- 灰色块 + 微光扫过。骨架的**形状必须和真实内容一致**——形状不一致的骨架比没有骨架更糟，（`docs/specs/02-advanced.md:1064`）
- 因为它会误导用户对内容的预期。（`docs/specs/02-advanced.md:1065`）

## 尺寸（来自正式规格 §3）

- 形态=文本行; 规格=高 11，圆角 6，宽度按真实文本比例（70% / 45%）（`docs/specs/02-advanced.md:1071`）
- 形态=列表行; 规格=与 `WDListRow` 等高（44 / 60 / 76）（`docs/specs/02-advanced.md:1072`）
- 形态=卡片; 规格=与真实卡片同尺寸、同圆角、同内边距（`docs/specs/02-advanced.md:1073`）
- 形态=头像; 规格=圆形，直径同真实头像（`docs/specs/02-advanced.md:1074`）

## 变体（来自正式规格 §4）

- 变体=文本; 说明=3–4 行文本块（`docs/specs/02-advanced.md:1080`）
- 变体=列表; 说明=5–6 行列表项，前导圆形 + 两行文本（`docs/specs/02-advanced.md:1081`）
- 变体=卡片; 说明=卡片轮廓 + 卡内两行 + 一个按钮宽度的块（`docs/specs/02-advanced.md:1082`）

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

- searchAliases: 骨架屏, 占位, 加载占位, skeleton
- combinesWith: none
- pageRegions: page-body, collection

## 平台说明

本卡不包含任何 Swift / Kotlin 平台 API 猜测。平台实现与证据只由对应 Provider 提供。
