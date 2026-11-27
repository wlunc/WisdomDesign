<!-- GENERATED FILE - DO NOT EDIT. -->
<!-- Source: wisdomdesign design truth sources via tools/ai-skill/lib/extract-design.js. -->
<!-- Regenerate with: node tools/ai-skill/lib/extract-design.js | node tools/ai-skill/lib/generate-core-catalog.js --out <dir> -->
<!-- No platform API claims are included. -->

# WDButton 语义卡

Component: `WDButton`
Spec: `docs/specs/01-basic.md` (number 1)
Contract: `contracts/WDButton.yaml` (sha256 `d24658c03c13ece3a9bb026e43a4385c1e121c6886d3073b5bf6617d3079176e`)

## 用途（来自正式规格 §1）

触发一个动作。是界面上唯一"会让事情发生"的基础组件。

- **用**：提交表单、确认操作、触发一个明确的动作
- **不要用**：导航到别的页面（用 `WDListRow` 或链接）；筛选（用 `WDChip`）；只有图标没有文字的场合（用 `WDIconButton`）
- **一屏一个主操作**。`filled` 变体每屏最多一个，其余操作降级为 `tonal` / `glass` / `plain`

## 来源追溯

- `docs/specs/01-basic.md:13,15,17,18,19,64,68,69,70,71,72,73,82,84,85,86,87,109,111,112,113,114,115,116`

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

- searchAliases: none
- combinesWith: none
- pageRegions: none

## 平台说明

本卡不包含任何 Swift / Kotlin 平台 API 猜测。平台实现与证据只由对应 Provider 提供。
