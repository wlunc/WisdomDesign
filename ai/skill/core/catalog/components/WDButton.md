<!-- GENERATED FILE - DO NOT EDIT. -->
<!-- Source: wisdomdesign design truth sources via tools/ai-skill/lib/extract-design.js. -->
<!-- Regenerate with: node tools/ai-skill/lib/extract-design.js | node tools/ai-skill/lib/generate-core-catalog.js --out <dir> -->
<!-- No platform API claims are included. -->

# WDButton 语义卡

Component: `WDButton`
Spec: `docs/specs/01-basic.md` (number 1)
Contract: `contracts-digest.json#WDButton` (source `contracts/WDButton.yaml`, sha256 `d24658c03c13ece3a9bb026e43a4385c1e121c6886d3073b5bf6617d3079176e`)

## 用途（来自正式规格 §1）

触发一个动作。是界面上唯一"会让事情发生"的基础组件。

- **用**：提交表单、确认操作、触发一个明确的动作
- **不要用**：导航到别的页面（用 `WDListRow` 或链接）；筛选（用 `WDChip`）；只有图标没有文字的场合（用 `WDIconButton`）
- **一屏一个主操作**。`filled` 变体每屏最多一个，其余操作降级为 `tonal` / `glass` / `plain`

## 来源追溯

- `docs/specs/01-basic.md:13,15,17,18,19,21,25,26,27,28,29,31,33,37,38,39,41,42,44,48,49,50,51,52,53,55,56,64,68,69,70,71,72,73,82,84,85,86,87,109,111,112,113,114,115,116`

## 设计者摘要

高度 `sm` `size.control.sm` 32 / `md`（默认） `size.control.md` 44 / `lg` `size.control.lg` 52；圆角 `radius.full`；必有 容器 / 标签；可选 前置图标 / 后置图标。

## 解剖（来自正式规格 §2）

- 段=容器; 是否必有=必有; 说明=胶囊底 + 内边距，高度由尺寸档决定（`docs/specs/01-basic.md:25`）
- 段=前置图标; 是否必有=可选; 说明=`size.icon.sm`（16），与文字间距 `space.3`（8）（`docs/specs/01-basic.md:26`）
- 段=标签; 是否必有=必有; 说明=`type.headline`（17/22 · 600）（`docs/specs/01-basic.md:27`）
- 段=后置图标; 是否必有=可选; 说明=同前置，只用于"有方向"的动作（下一步、展开）（`docs/specs/01-basic.md:28`）
- 段=加载指示; 是否必有=条件; 说明=加载态替换标签，**容器宽度不变**（`docs/specs/01-basic.md:29`）
- 前置与后置图标不同时出现——同一个按钮只表达一个方向。（`docs/specs/01-basic.md:31`）

## 尺寸（来自正式规格 §3）

- 档=`sm`; 高度=`size.control.sm` 32; 水平内距=12; 字号=13; 图标=14; 圆角=`radius.full`; 最小宽度=—（`size.control.sm` = 32；`radius.full` = 999）（`docs/specs/01-basic.md:37`）
- 档=`md`（默认）; 高度=`size.control.md` 44; 水平内距=16; 字号=15; 图标=16; 圆角=`radius.full`; 最小宽度=—（`size.control.md` = 44；`radius.full` = 999）（`docs/specs/01-basic.md:38`）
- 档=`lg`; 高度=`size.control.lg` 52; 水平内距=20; 字号=16; 图标=20; 圆角=`radius.full`; 最小宽度=—（`size.control.lg` = 52；`radius.full` = 999）（`docs/specs/01-basic.md:39`）
- 表单内的按钮可改用 `radius.md`，与输入框的圆角对齐。（`radius.md` = 14）（`docs/specs/01-basic.md:41`）
- 只有图标的场合必须保持 `size.touch-target-min-ios`（44×44）的热区，视觉可以更小（Android 用 `size.touch-target-min-android`，48）。（`size.touch-target-min-android` = 48）（`docs/specs/01-basic.md:42`）

## 变体（来自正式规格 §4）

- 变体=`filled`; 背景=`gradient.fill`（浅深两端各自取值）; 文字=`text.on-fill`; 描边=无; 阴影=`elevation.brand`; 用在哪=唯一主操作（`gradient.fill` = 浅 linear-gradient(135deg,#8FCFDD 0%,#63BAD2 100%) / 深 linear-gradient(135deg,#1677B3 0%,#2A5CAA 100%)；`text.on-fill` = 浅 #0E3A55 / 深 #DCEEF4；`elevation.brand` = 0 6 16 #1677B32E）（`docs/specs/01-basic.md:48`）
- 变体=`tonal`; 背景=`gradient.surface`（画廊 01；浅深两端各自取值）; 文字=`text.on-soft`; 描边=无; 阴影=顶部 1px 内高光（`border.glass-top`）; 用在哪=次级操作（`gradient.surface` = 浅 linear-gradient(135deg,#B0D5DF 0%,#7EC4CF 100%) / 深 linear-gradient(135deg,#123449 0%,#0F4055 100%)；`text.on-soft` = 浅 #123F5C / 深 #B0D5DF；`border.glass-top` = 浅 #FFFFFFCC / 深 #FFFFFF29）（`docs/specs/01-basic.md:49`）
- 变体=`glass`; 背景=`surface.glass-strong`; 文字=`text.primary`; 描边=`border.hairline`; 阴影=`elevation.1`; 用在哪=浮在图片或内容之上（`surface.glass-strong` = 浅 #FFFFFFDB / 深 #0C202CC7；`text.primary` = 浅 #0A1B24 / 深 #E6F1F6；`border.hairline` = 浅 #0A1B2414 / 深 #FFFFFF1A；`elevation.1` = 0 1 2 #0A3C640A ; 0 6 16 #0A3C640F）（`docs/specs/01-basic.md:50`）
- 变体=`outline`; 背景=透明; 文字=`text.primary`; 描边=`border.hairline-strong`; 阴影=无; 用在哪=中性操作（`text.primary` = 浅 #0A1B24 / 深 #E6F1F6；`border.hairline-strong` = 浅 #0A1B2429 / 深 #FFFFFF2E）（`docs/specs/01-basic.md:51`）
- 变体=`plain`; 背景=透明; 文字=`text.brand`; 描边=无; 阴影=无; 用在哪=行内操作、列表右侧（`text.brand` = 浅 #1677B3 / 深 #7EC4CF）（`docs/specs/01-basic.md:52`）
- 变体=`destructive`; 背景=`gradient.destructive`; 文字=白; 描边=无; 阴影=`elevation.brand`; 用在哪=删除、退出等不可逆操作（`gradient.destructive` = linear-gradient(135deg,#B8564D 0%,#A94A42 100%)；`elevation.brand` = 0 6 16 #1677B32E）（`docs/specs/01-basic.md:53`）
- `filled` 的浅色端与深色端分别是 `derived.fill-light-1` / `derived.fill-light-2`，（`derived.fill-light-1` = #8FCFDD；`derived.fill-light-2` = #63BAD2）（`docs/specs/01-basic.md:55`）
- 配 `derived.text-on-fill` 对比度 5.4–6.9:1。**不允许把亮色渐变配白字**。（`derived.text-on-fill` = #0E3A55）（`docs/specs/01-basic.md:56`）

## 状态（来自正式规格 §5）

- 状态=默认; 视觉=见变体表; 动效=—; 触觉=—（`docs/specs/01-basic.md:68`）
- 状态=按下; 视觉=缩放至 `motion.component.press-scale`（0.97），亮度降到 96%; 动效=`motion.duration.instant` 100ms; 触觉=轻（`docs/specs/01-basic.md:69`）
- 状态=聚焦; 视觉=外扩 3pt 光环，`text.brand` 32% 透明; 动效=`motion.duration.fast`; 触觉=—（`docs/specs/01-basic.md:70`）
- 状态=禁用; 视觉=整体 40% 不透明度，去掉阴影; 动效=无; 触觉=不响应（`docs/specs/01-basic.md:71`）
- 状态=加载; 视觉=标签原位换成指示器，容器宽度**不变**；保留原标签供读屏; 动效=指示器持续旋转; 触觉=触发时轻（`docs/specs/01-basic.md:72`）
- 状态=悬停; 视觉=仅指针设备，亮度 98%; 动效=`motion.duration.instant`; 触觉=—（`docs/specs/01-basic.md:73`）

## 内容（来自正式规格 §7）

- 标签 2–6 个汉字，最多 12 个字符（`docs/specs/01-basic.md:84`）
- 动词开头，不用"确定/好的"这类无信息量的词；删除场景直接写"删除"（`docs/specs/01-basic.md:85`）
- 不用句号结尾（`docs/specs/01-basic.md:86`）
- 加载态文案由加载指示器承担，标签不改成"加载中"（`docs/specs/01-basic.md:87`）

## 无障碍（来自正式规格 §10）

- **标签即朗读文本**，不需要额外的 `aria-label`（`docs/specs/01-basic.md:111`）
- 加载态朗读"提交，处理中"，不是"加载中"（`docs/specs/01-basic.md:112`）
- 禁用态用 `aria-disabled` 语义而非移除元素，保证读屏能发现它（`docs/specs/01-basic.md:113`）
- 触控热区不小于 44×44，`sm` 档视觉 32 但热区补到 44（`docs/specs/01-basic.md:114`）
- 文字随动态字体放大，容器高度同步增高，**不裁切**（`docs/specs/01-basic.md:115`）
- 文字与背景对比度 ≥ 4.5:1；图形边界 ≥ 3:1（`docs/specs/01-basic.md:116`）

## 契约摘要（来自 YAML）

- params: 8
- slots: label, leadingIcon, trailingIcon
- enums: WDButtonVariant, WDButtonSize

## 检索与组合 overlay（不得覆盖真源）

- searchAliases: 按钮, 主按钮, 操作按钮, 提交按钮, button
- combinesWith: none
- pageRegions: actions, form, collection-item

## 平台说明

本卡不包含任何 Swift / Kotlin 平台 API 猜测。平台实现与证据只由对应 Provider 提供。
