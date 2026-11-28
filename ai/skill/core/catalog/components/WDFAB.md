<!-- GENERATED FILE - DO NOT EDIT. -->
<!-- Source: wisdomdesign design truth sources via tools/ai-skill/lib/extract-design.js. -->
<!-- Regenerate with: node tools/ai-skill/lib/extract-design.js | node tools/ai-skill/lib/generate-core-catalog.js --out <dir> -->
<!-- No platform API claims are included. -->

# WDFAB 语义卡

Component: `WDFAB`
Spec: `docs/specs/02-advanced.md` (number 36)
Contract: `contracts-digest.json#WDFAB` (source `contracts/WDFAB.yaml`, sha256 `7a7d3989af4b1f62b8039cac36e56201164167d8db2b97aaf5eccdd30797231c`)

## 用途（来自正式规格 §1）

页面的**主操作**，悬浮在内容之上，滚动时保持可达。

- **用**：新建任务、记一笔、添加成员——一屏一个的创建类动作
- **不要用**：每屏已经有一个 `filled` 按钮（重复了主操作）；破坏性操作；多个并列动作（用 Toolbar）

## 来源追溯

- `docs/specs/02-advanced.md:1576,1578,1580,1581,1583,1585,1587,1591,1592,1593,1595,1599,1600,1601,1603,1607,1608,1609,1610,1611,1620,1622,1623,1624,1644,1646,1647,1648,1649,1650`

## 设计者摘要

圆角 `radius.fab` 19。

## 解剖（来自正式规格 §2）

- 容器 + 图标（+ 展开后的一组子操作）。（`docs/specs/02-advanced.md:1585`）

## 尺寸（来自正式规格 §3）

- 档=标准; 尺寸=56×56; 圆角=`radius.fab` 19; 图标=24（`radius.fab` = 19）（`docs/specs/02-advanced.md:1591`）
- 档=大; 尺寸=64×64; 圆角=22; 图标=28（`docs/specs/02-advanced.md:1592`）
- 档=小; 尺寸=40×40; 圆角=14; 图标=20（`docs/specs/02-advanced.md:1593`）

## 变体（来自正式规格 §4）

- 变体=圆角方（默认）; 说明=区别于圆形，和卡片体系更协调（`docs/specs/02-advanced.md:1599`）
- 变体=圆形; 说明=与系统规范一致时使用（`docs/specs/02-advanced.md:1600`）
- 变体=可展开; 说明=点击展开 2–4 个子操作，图标旋转 45° 变关闭（`docs/specs/02-advanced.md:1601`）

## 状态（来自正式规格 §5）

- 状态=默认; 视觉=`gradient.fill`（浅深两端各自取值）+ `elevation.brand`; 动效=—（`docs/specs/02-advanced.md:1607`）
- 状态=按下; 视觉=缩放 0.95; 动效=100ms（`docs/specs/02-advanced.md:1608`）
- 状态=滚动; 视觉=向下滚动时缩小到 40 并降低不透明度；向上滚动恢复; 动效=`motion.spring.gentle`（`docs/specs/02-advanced.md:1609`）
- 状态=展开; 视觉=图标旋转 45°，子操作逐个出现; 动效=240ms，错峰 40ms（`docs/specs/02-advanced.md:1610`）
- 状态=禁用; 视觉=40%; 动效=无（`docs/specs/02-advanced.md:1611`）

## 内容（来自正式规格 §7）

- 图标必须配无障碍标签；展开态的子操作用"图标 + 文字"而不是纯图标（`docs/specs/02-advanced.md:1622`）
- 一个页面最多一个 FAB（`docs/specs/02-advanced.md:1623`）
- 展开态最多 4 个子操作，超过说明该用整页（`docs/specs/02-advanced.md:1624`）

## 无障碍（来自正式规格 §10）

- 标签写动作："新建任务"（`docs/specs/02-advanced.md:1646`）
- 展开态作为一个组朗读，子操作各自可聚焦（`docs/specs/02-advanced.md:1647`）
- 子操作展开时焦点移入第一个子操作（`docs/specs/02-advanced.md:1648`）
- 触控热区：标准 56 已满足；小号 40 需向外扩到 44（`docs/specs/02-advanced.md:1649`）
- 与 Tab 栏共存时，两者不重叠且都可点（`docs/specs/02-advanced.md:1650`）

## 契约摘要（来自 YAML）

- params: 6
- slots: icon, label
- enums: WDFABSize, WDFABShape

## 检索与组合 overlay（不得覆盖真源）

- searchAliases: 悬浮按钮, 主操作按钮, floating action
- combinesWith: none
- pageRegions: overlay

## 平台说明

本卡不包含任何 Swift / Kotlin 平台 API 猜测。平台实现与证据只由对应 Provider 提供。
