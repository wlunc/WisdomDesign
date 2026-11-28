<!-- GENERATED FILE - DO NOT EDIT. -->
<!-- Source: wisdomdesign design truth sources via tools/ai-skill/lib/extract-design.js. -->
<!-- Regenerate with: node tools/ai-skill/lib/extract-design.js | node tools/ai-skill/lib/generate-core-catalog.js --out <dir> -->
<!-- No platform API claims are included. -->

# WDIconButton 语义卡

Component: `WDIconButton`
Spec: `docs/specs/01-basic.md` (number 2)
Contract: `contracts-digest.json#WDIconButton` (source `contracts/WDIconButton.yaml`, sha256 `53b2b74751ff58236070246f167d36c36f88a9de5bde0820794f1d7cbafffbe1`)

## 用途（来自正式规格 §1）

纯图标的单一动作。空间紧张或动作含义无歧义时使用。

- **用**：导航栏的搜索/新增、工具条的撤销/重做、列表右侧的更多
- **不要用**：含义有歧义的图标；带文字的场合（用 `WDButton`）；破坏性操作（如删除，必须带文字说明）

## 来源追溯

- `docs/specs/01-basic.md:143,145,147,148,150,152,154,158,159,161,163,167,168,169,170,171,173,175,176,183,185,186,198,200,201,202,203`

## 设计者摘要

圆角 `radius.full` 或 `radius.sm`。

## 解剖（来自正式规格 §2）

- 容器 + 图标两段。没有标签，**语义完全由无障碍标签提供**。（`docs/specs/01-basic.md:152`）

## 尺寸（来自正式规格 §3）

- 档=`sm`; 视觉尺寸=32×32; 热区=44×44; 图标=`size.icon.sm/md` 16–20; 圆角=`radius.full` 或 `radius.sm`（`radius.full` = 999；`radius.sm` = 10）（`docs/specs/01-basic.md:158`）
- 档=`md`（默认）; 视觉尺寸=44×44; 热区=44×44; 图标=`size.icon.lg` 24; 圆角=`radius.full` 或 `radius.sm`（`size.icon.lg` = 24；`radius.full` = 999；`radius.sm` = 10）（`docs/specs/01-basic.md:159`）
- `sm` 档视觉 32，热区必须补到 44——通过加大点击区域而不是放大图标，用负内边距或 `contentShape` 实现。（`docs/specs/01-basic.md:161`）

## 变体（来自正式规格 §4）

- 变体=`filled`; 背景=`gradient.mid`; 图标色=白; 描边=无; 用在哪=强调动作（`gradient.mid` = linear-gradient(135deg,#4FB0C8 0%,#1685A9 100%)）（`docs/specs/01-basic.md:167`）
- 变体=`tonal`; 背景=`surface.tint`; 图标色=`text.on-soft`; 描边=无; 用在哪=次级动作（`surface.tint` = 浅 #D9E9F3 / 深 #123348；`text.on-soft` = 浅 #123F5C / 深 #B0D5DF）（`docs/specs/01-basic.md:168`）
- 变体=`glass`; 背景=`surface.glass-strong`; 图标色=`text.primary`; 描边=`border.hairline`; 用在哪=浮在内容之上（导航栏）（`surface.glass-strong` = 浅 #FFFFFFDB / 深 #0C202CC7；`text.primary` = 浅 #0A1B24 / 深 #E6F1F6；`border.hairline` = 浅 #0A1B2414 / 深 #FFFFFF1A）（`docs/specs/01-basic.md:169`）
- 变体=`outline`; 背景=透明; 图标色=`text.primary`; 描边=`border.hairline-strong`; 用在哪=中性动作（`text.primary` = 浅 #0A1B24 / 深 #E6F1F6；`border.hairline-strong` = 浅 #0A1B2429 / 深 #FFFFFF2E）（`docs/specs/01-basic.md:170`）
- 变体=`plain`; 背景=透明; 图标色=`text.brand`; 描边=无; 用在哪=行内动作（`text.brand` = 浅 #1677B3 / 深 #7EC4CF）（`docs/specs/01-basic.md:171`）

## 状态（来自正式规格 §5）

- 与 Button 一致：默认 / 按下（缩放 0.97）/ 聚焦（3pt 光环）/ 禁用（40%）。（`docs/specs/01-basic.md:175`）
- 图标按钮**没有加载态**——加载状态下应当换成 `WDButton` 或骨架。（`docs/specs/01-basic.md:176`）

## 内容（来自正式规格 §7）

- 必须提供无障碍标签，写**动作**而不是图标名：写"搜索"不写"放大镜"（`docs/specs/01-basic.md:185`）
- 图标不配文字时不做视觉截断，图标本身保持完整（`docs/specs/01-basic.md:186`）

## 无障碍（来自正式规格 §10）

- 必须有 `aria-label` / `accessibilityLabel`，否则读屏只能读出"按钮"（`docs/specs/01-basic.md:200`）
- 角色为 `button`，图标本身标记为装饰（`docs/specs/01-basic.md:201`）
- 热区 ≥ 44×44（`docs/specs/01-basic.md:202`）
- 图标与背景对比度 ≥ 3:1（`docs/specs/01-basic.md:203`）

## 契约摘要（来自 YAML）

- params: 7
- slots: icon
- enums: WDIconButtonVariant, WDIconButtonShape, WDButtonSize

## 检索与组合 overlay（不得覆盖真源）

- searchAliases: 图标按钮, 纯图标按钮, icon button
- combinesWith: WDIcon
- pageRegions: toolbar, navigation, actions

## 平台说明

本卡不包含任何 Swift / Kotlin 平台 API 猜测。平台实现与证据只由对应 Provider 提供。
