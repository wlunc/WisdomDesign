<!-- GENERATED FILE - DO NOT EDIT. -->
<!-- Source: wisdomdesign design truth sources via tools/ai-skill/lib/extract-design.js. -->
<!-- Regenerate with: node tools/ai-skill/lib/extract-design.js | node tools/ai-skill/lib/generate-core-catalog.js --out <dir> -->
<!-- No platform API claims are included. -->

# WDAvatar 语义卡

Component: `WDAvatar`
Spec: `docs/specs/01-basic.md` (number 12)
Contract: `contracts/WDAvatar.yaml` (sha256 `28acd147633188be1f9a1b233f3129d1664ae9ec413f184496f1070b74e11866`)

## 用途（来自正式规格 §1）

代表一个人。在家庭协作场景里，头像是"这是谁的"最省空间的答案。

- **用**：成员标识、任务归属、评论作者
- **不要用**：代表团队或组织（用 Icon + 文字）；纯装饰

## 来源追溯

- `docs/specs/01-basic.md:1115`
- `docs/specs/01-basic.md:1117`
- `docs/specs/01-basic.md:1120`
- `docs/specs/01-basic.md:1119`
- `docs/specs/01-basic.md:1145`
- `docs/specs/01-basic.md:1149`
- `docs/specs/01-basic.md:1150`
- `docs/specs/01-basic.md:1151`
- `docs/specs/01-basic.md:1159`
- `docs/specs/01-basic.md:1161`
- `docs/specs/01-basic.md:1162`
- `docs/specs/01-basic.md:1163`
- `docs/specs/01-basic.md:1165`
- `docs/specs/01-basic.md:1167`
- `docs/specs/01-basic.md:1171`
- `docs/specs/01-basic.md:1172`
- `docs/specs/01-basic.md:1173`
- `docs/specs/01-basic.md:1174`
- `docs/specs/01-basic.md:1176`
- `docs/specs/01-basic.md:1177`
- `docs/specs/01-basic.md:1178`
- `docs/specs/01-basic.md:1179`
- `docs/specs/01-basic.md:1180`
- `docs/specs/01-basic.md:1194`
- `docs/specs/01-basic.md:1196`
- `docs/specs/01-basic.md:1197`
- `docs/specs/01-basic.md:1198`
- `docs/specs/01-basic.md:1199`

## 状态（来自正式规格 §5）

- 状态=在线; 视觉=状态点 `status.success`（`docs/specs/01-basic.md:1149`）
- 状态=离线; 视觉=无状态点（**不用灰色点**，避免和在线点混淆）（`docs/specs/01-basic.md:1150`）
- 状态=已停用成员; 视觉=头像整体 50% 并去饱和（四档底同时受影响，仍保留身份识别）（`docs/specs/01-basic.md:1151`）

## 内容（来自正式规格 §7）

- 首字取名字第一个字符；英文名取首字母大写（`docs/specs/01-basic.md:1161`）
- **同一个人的配色在任何页面都必须一致**——按成员 ID 固定，不按出现顺序分配（`docs/specs/01-basic.md:1162`）
- 照片缺失时不显示破图，退回文字头像（`docs/specs/01-basic.md:1163`）
- #### 四档配色（A-11 定稿 2026-11-21）（`docs/specs/01-basic.md:1165`）
- 四档是**一条单调递减的明度阶梯**，不是四个随手挑的颜色；首字色按档配对（每档一对 `fill` / `ink`）。（`docs/specs/01-basic.md:1167`）
- 档=1; 浅色 fill=`#B0D5DF`; 浅色 ink=`#0A1B24`; 深色 fill=`#97CBD8`; 深色 ink=`#0A1B24`（`docs/specs/01-basic.md:1171`）
- 档=2; 浅色 fill=`#7EC4CF`; 浅色 ink=`#0A1B24`; 深色 fill=`#6BBBC7`; 深色 ink=`#0A1B24`（`docs/specs/01-basic.md:1172`）
- 档=3; 浅色 fill=`#1A7BA3`; 浅色 ink=`#FFFFFF`; 深色 fill=`#4193B4`; 深色 ink=`#0A1B24`（`docs/specs/01-basic.md:1173`）
- 档=4; 浅色 fill=`#065279`; 浅色 ink=`#FFFFFF`; 深色 fill=`#356997`; 深色 ink=`#FFFFFF`（`docs/specs/01-basic.md:1174`）
- 每档首字对比度 **≥ 4.5:1**（最低 4.77:1），生成器 `assertMemberTones()` 逐档断言；（`docs/specs/01-basic.md:1176`）
- 相邻两档相对亮度差 **≥ 0.05**（四档必须肉眼可分），同由生成器断言；（`docs/specs/01-basic.md:1177`）
- **分配 = `FNV1a32(memberID) mod 4`**（成员 ID 的 UTF-8 字节做 FNV-1a，取 mod 4）。不用数组下标、不用出现顺序；**允许撞色**；（`docs/specs/01-basic.md:1178`）
- 四色刻意**不进 `semantic`**（U12 槽位冻结在 32），落在令牌 `member.{light,dark}.tone-N`；（`docs/specs/01-basic.md:1179`）
- 完整推导（含取样 fixture 与深色档抬亮理由）见 `../14-member-tones-media-tooltip.md` §1。（`docs/specs/01-basic.md:1180`）

## 无障碍（来自正式规格 §10）

- 朗读成员名，如"妈妈"；不朗读"头像"或首字（`docs/specs/01-basic.md:1196`）
- 首字 / 图标标记为装饰（`docs/specs/01-basic.md:1197`）
- 在线状态并入朗读："妈妈，在线"（`docs/specs/01-basic.md:1198`）
- 触控热区 ≥ 44×44（`sm` 及以下需向外扩热区）（`docs/specs/01-basic.md:1199`）

## 契约摘要（来自 YAML）

- params: 5
- slots: icon, label
- enums: WDAvatarSize, WDMemberTone

## 检索与组合 overlay（不得覆盖真源）

- searchAliases: none
- combinesWith: none
- pageRegions: none

## 平台说明

本卡不包含任何 Swift / Kotlin 平台 API 猜测。平台实现与证据只由对应 Provider 提供。
