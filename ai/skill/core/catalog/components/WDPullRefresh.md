<!-- GENERATED FILE - DO NOT EDIT. -->
<!-- Source: wisdomdesign design truth sources via tools/ai-skill/lib/extract-design.js. -->
<!-- Regenerate with: node tools/ai-skill/lib/extract-design.js | node tools/ai-skill/lib/generate-core-catalog.js --out <dir> -->
<!-- No platform API claims are included. -->

# WDPullRefresh 语义卡

Component: `WDPullRefresh`
Spec: `docs/specs/02-advanced.md` (number 32)
Contract: `contracts-digest.json#WDPullRefresh` (source `contracts/WDPullRefresh.yaml`, sha256 `1e64e60292370e9bbe806e8f5cc5460b316c83e5c788c6a26b4d31225ba40e19`)

## 用途（来自正式规格 §1）

用户主动请求刷新。**只用于内容会变化且用户有刷新动机的列表**。

- **用**：消息列表、家庭动态、协作任务
- **不要用**：静态内容（设置页）；实时推送已经覆盖的场景

## 来源追溯

- `docs/specs/02-advanced.md:1140,1142,1144,1145,1147,1149,1153,1154,1155,1156,1158,1162,1163,1164,1165,1166,1168,1172,1173,1175,1179,1180,1181,1182,1190,1192,1193,1194,1214,1216,1217,1218,1219`

## 设计者摘要

触发阈值 64（下拉超过此距离松手才刷新）；指示器直径 24；环线宽 2；指示器与首行间距 `space.4`（12）。

## 解剖（来自正式规格 §2）

- 下拉指示器 + 文字状态 + 刷新中的进度环。（`docs/specs/02-advanced.md:1149`）
- 阶段=下拉未达阈值; 显示=环从左到右画出进度，文字"下拉刷新"（`docs/specs/02-advanced.md:1153`）
- 阶段=达到阈值; 显示=环变成完整圆，文字"松开刷新"（`docs/specs/02-advanced.md:1154`）
- 阶段=刷新中; 显示=环旋转，文字"正在刷新"（`docs/specs/02-advanced.md:1155`）
- 阶段=完成; 显示=环收起，列表内容回到原位（`docs/specs/02-advanced.md:1156`）

## 尺寸（来自正式规格 §3）

- 项=触发阈值; 值=64（下拉超过此距离松手才刷新）（`docs/specs/02-advanced.md:1162`）
- 项=指示器直径; 值=24（`docs/specs/02-advanced.md:1163`）
- 项=环线宽; 值=2（`docs/specs/02-advanced.md:1164`）
- 项=指示器与首行间距; 值=`space.4`（12）（`docs/specs/02-advanced.md:1165`）
- 项=最大下拉距离; 值=120（超过后阻力显著增加）（`docs/specs/02-advanced.md:1166`）

## 变体（来自正式规格 §4）

- 变体=品牌进度; 说明=环用 `text.brand`，默认（`text.brand` = 浅 #1677B3 / 深 #7EC4CF）（`docs/specs/02-advanced.md:1172`）
- 变体=极简; 说明=只有环，没有文字（空间极紧时）（`docs/specs/02-advanced.md:1173`）

## 状态（来自正式规格 §5）

- 状态=空闲; 视觉=指示器隐藏在列表上方（`docs/specs/02-advanced.md:1179`）
- 状态=下拉中; 视觉=指示器跟随下拉距离显出，透明度 0 → 1（`docs/specs/02-advanced.md:1180`）
- 状态=刷新中; 视觉=指示器固定显示，环旋转（`docs/specs/02-advanced.md:1181`）
- 状态=完成; 视觉=160ms 后收起（`docs/specs/02-advanced.md:1182`）

## 内容（来自正式规格 §7）

- 文字三态固定为"下拉刷新 / 松开刷新 / 正在刷新"（`docs/specs/02-advanced.md:1192`）
- 不显示上一次刷新时间（那是 Banner 或页脚的职责）（`docs/specs/02-advanced.md:1193`）
- 刷新失败时收起指示器并弹 `WDToast`，不把错误文字挤在下拉区（`docs/specs/02-advanced.md:1194`）

## 无障碍（来自正式规格 §10）

- 提供"刷新"的自定义辅助操作，读屏用户不需要会下拉（`docs/specs/02-advanced.md:1216`）
- 刷新开始与结束各播报一次："正在刷新" / "刷新完成"（`docs/specs/02-advanced.md:1217`）
- 触觉在阈值处触发一次（`docs/specs/02-advanced.md:1218`）
- 减弱动态效果时，环不做旋转，改为静态进度（`docs/specs/02-advanced.md:1219`）

## 契约摘要（来自 YAML）

- params: 3
- slots: label
- enums: none

## 检索与组合 overlay（不得覆盖真源）

- searchAliases: 下拉刷新, 刷新, pull refresh
- combinesWith: none
- pageRegions: collection

## 平台说明

本卡不包含任何 Swift / Kotlin 平台 API 猜测。平台实现与证据只由对应 Provider 提供。
