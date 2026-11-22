<!-- GENERATED FILE - DO NOT EDIT. -->
<!-- Source: wisdomdesign design truth sources via tools/ai-skill/lib/extract-design.rb. -->
<!-- Regenerate with: ruby tools/ai-skill/lib/extract-design.rb | node tools/ai-skill/lib/generate-core-catalog.js --out <dir> -->
<!-- No platform API claims are included. -->

# WDIconButton 语义卡

Component: `WDIconButton`
Spec: `docs/specs/01-basic.md` (number 2)
Contract: `contracts/WDIconButton.yaml` (sha256 `53b2b74751ff58236070246f167d36c36f88a9de5bde0820794f1d7cbafffbe1`)

## 用途（来自正式规格 §1）

纯图标的单一动作。空间紧张或动作含义无歧义时使用。

- **用**：导航栏的搜索/新增、工具条的撤销/重做、列表右侧的更多
- **不要用**：含义有歧义的图标；带文字的场合（用 `WDButton`）；破坏性操作（如删除，必须带文字说明）

## 来源追溯

- `docs/specs/01-basic.md:143`
- `docs/specs/01-basic.md:145`
- `docs/specs/01-basic.md:148`
- `docs/specs/01-basic.md:147`
- `docs/specs/01-basic.md:173`
- `docs/specs/01-basic.md:175`
- `docs/specs/01-basic.md:176`
- `docs/specs/01-basic.md:183`
- `docs/specs/01-basic.md:185`
- `docs/specs/01-basic.md:186`
- `docs/specs/01-basic.md:198`
- `docs/specs/01-basic.md:200`
- `docs/specs/01-basic.md:201`
- `docs/specs/01-basic.md:202`
- `docs/specs/01-basic.md:203`

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

- searchAliases: none
- combinesWith: none
- pageRegions: none

## 平台说明

本卡不包含任何 Swift / Kotlin 平台 API 猜测。平台实现与证据只由对应 Provider 提供。
