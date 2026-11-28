<!-- GENERATED FILE - DO NOT EDIT. -->
<!-- Source: wisdomdesign design truth sources via tools/ai-skill/lib/extract-design.js. -->
<!-- Regenerate with: node tools/ai-skill/lib/extract-design.js | node tools/ai-skill/lib/generate-core-catalog.js --out <dir> -->
<!-- No platform API claims are included. -->

# WDBadge 语义卡

Component: `WDBadge`
Spec: `docs/specs/01-basic.md` (number 11)
Contract: `contracts-digest.json#WDBadge` (source `contracts/WDBadge.yaml`, sha256 `2c5e0c0ce26ad5d3568e100dab59d03efcb02f845b3b9042d37103b1c582f860`)

## 用途（来自正式规格 §1）

状态与计数的紧凑表达。**徽标不单独承载信息**，必须依附在主体上。

- **用**：任务状态（已完成 / 已逾期）、未读数、在线点
- **不要用**：作为主要信息的载体（状态应当同时有文字）；装饰性点缀

## 来源追溯

- `docs/specs/01-basic.md:1031,1033,1035,1036,1038,1040,1042,1046,1047,1048,1050,1052,1056,1057,1058,1059,1060,1061,1063,1065,1066,1074,1076,1077,1088,1090,1091,1092,1093`

## 设计者摘要

圆角 `radius.full`。

## 解剖（来自正式规格 §2）

- 胶囊底 + 图标（可选）+ 文字。计数型是纯数字，叠在宿主的右上角。（`docs/specs/01-basic.md:1040`）

## 尺寸（来自正式规格 §3）

- 形态=状态胶囊; 尺寸=高 24，水平内距 10; 字号=11 · 600; 圆角=`radius.full`（`radius.full` = 999）（`docs/specs/01-basic.md:1046`）
- 形态=圆点; 尺寸=7×7; 字号=—; 圆角=`radius.full`（`radius.full` = 999）（`docs/specs/01-basic.md:1047`）
- 形态=计数; 尺寸=高 20，最小宽 20; 字号=11 · 600 · 等宽; 圆角=`radius.full`（`radius.full` = 999）（`docs/specs/01-basic.md:1048`）
- 计数徽标相对宿主右上角偏移 -4 / -4，白色描边 2 与宿主分隔。（`docs/specs/01-basic.md:1050`）

## 变体（来自正式规格 §4）

- 变体=`shared`; 背景=`surface.tint`; 文字=`text.on-soft`; 用于=共享状态（`surface.tint` = 浅 #D9E9F3 / 深 #123348；`text.on-soft` = 浅 #123F5C / 深 #B0D5DF）（`docs/specs/01-basic.md:1056`）
- 变体=`schedule`; 背景=`gradient.mid`; 文字=白; 用于=时间点（`gradient.mid` = linear-gradient(135deg,#4FB0C8 0%,#1685A9 100%)）（`docs/specs/01-basic.md:1057`）
- 变体=`pending`; 背景=`surface.glass-strong`; 文字=`text.brand`; 用于=进行中（`surface.glass-strong` = 浅 #FFFFFFDB / 深 #0C202CC7；`text.brand` = 浅 #1677B3 / 深 #7EC4CF）（`docs/specs/01-basic.md:1058`）
- 变体=`success`; 背景=`status-soft.success`; 文字=`status.success`; 用于=已完成（`status-soft.success` = 浅 #E3F5EC / 深 #0D2E24；`status.success` = 浅 #2A7F5C / 深 #7FD3B4）（`docs/specs/01-basic.md:1059`）
- 变体=`warning`; 背景=`status-soft.warning`; 文字=`status.warning`; 用于=即将到期（`status-soft.warning` = 浅 #FFF4DC / 深 #33260E；`status.warning` = 浅 #97651F / 深 #EFC683）（`docs/specs/01-basic.md:1060`）
- 变体=`danger`; 背景=`status-soft.danger`; 文字=`status.danger`; 用于=已逾期（`status-soft.danger` = 浅 #FBE7E4 / 深 #3A211E；`status.danger` = 浅 #B8564D / 深 #EDA79E）（`docs/specs/01-basic.md:1061`）

## 状态（来自正式规格 §5）

- 徽标本身是展示元素，没有按下态。计数为 0 时**整体隐藏**，不留空位。（`docs/specs/01-basic.md:1065`）
- 计数超过 99 显示 `99+`。（`docs/specs/01-basic.md:1066`）

## 内容（来自正式规格 §7）

- 状态胶囊文字 ≤ 4 个汉字，用名词短语（"已逾期"而不是"这个任务已经超过截止时间了"）（`docs/specs/01-basic.md:1076`）
- 徽标文字不换行、不截断；放不下就说明这一处置放的信息过多（`docs/specs/01-basic.md:1077`）

## 无障碍（来自正式规格 §10）

- 徽标不进入无障碍焦点序列，作为宿主朗读内容的一部分（`docs/specs/01-basic.md:1090`）
- 宿主朗读为"提醒，3 条未读"而不是分成两个元素（`docs/specs/01-basic.md:1091`）
- 状态胶囊的颜色不是唯一信号：**图标形状必须不同**（对勾 / 三角 / 实心禁止）（`docs/specs/01-basic.md:1092`）
- 文字与底色对比度 ≥ 4.5:1（`docs/specs/01-basic.md:1093`）

## 契约摘要（来自 YAML）

- params: 3
- slots: label
- enums: WDBadgeVariant

## 检索与组合 overlay（不得覆盖真源）

- searchAliases: 徽标, 角标, 计数, 未读数, badge
- combinesWith: none
- pageRegions: toolbar, collection-item, tab

## 平台说明

本卡不包含任何 Swift / Kotlin 平台 API 猜测。平台实现与证据只由对应 Provider 提供。
