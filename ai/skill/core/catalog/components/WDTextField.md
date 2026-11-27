<!-- GENERATED FILE - DO NOT EDIT. -->
<!-- Source: wisdomdesign design truth sources via tools/ai-skill/lib/extract-design.js. -->
<!-- Regenerate with: node tools/ai-skill/lib/extract-design.js | node tools/ai-skill/lib/generate-core-catalog.js --out <dir> -->
<!-- No platform API claims are included. -->

# WDTextField 语义卡

Component: `WDTextField`
Spec: `docs/specs/01-basic.md` (number 3)
Contract: `contracts/WDTextField.yaml` (sha256 `51d32379d3174ff47ecda45d537e72b10d86e2be0cd0bec30e59b7bc044c4163`)

## 用途（来自正式规格 §1）

单行文本输入。

- **用**：任务名称、成员名、金额、时间
- **不要用**：多行内容（用 TextArea）；选项选择（用 Picker / Radio）；布尔值（用 Switch）

## 来源追溯

- `docs/specs/01-basic.md:223,225,227,228,262,266,267,268,269,270,278,280,281,282,283,301,303,304,305,306,307`

## 状态（来自正式规格 §5）

- 状态=默认; 视觉=见变体表，标签 `text.secondary`; 动效=—（`docs/specs/01-basic.md:266`）
- 状态=聚焦; 视觉=描边换 `text.brand` 1.5pt + `text.brand` 18% 光环；标签可高亮; 动效=`motion.duration.fast` 160ms（`docs/specs/01-basic.md:267`）
- 状态=错误; 视觉=描边换 `status.danger`，下方辅助文案用 `status.danger`; 动效=同聚焦（`docs/specs/01-basic.md:268`）
- 状态=禁用; 视觉=整体 40%，不允许聚焦; 动效=无（`docs/specs/01-basic.md:269`）
- 状态=只读; 视觉=背景用 `surface.card-sunken`，文字用 `text.secondary`，可选中不可编辑; 动效=无（`docs/specs/01-basic.md:270`）

## 内容（来自正式规格 §7）

- 标签 2–8 个汉字，**必填，不允许只用占位符当标签**（`docs/specs/01-basic.md:280`）
- 占位符写示例而不是重复标签：标签"任务名称"，占位符"例如：整理储物间"（`docs/specs/01-basic.md:281`）
- 错误文案一句话说清"哪里错了 + 怎么改"："名称已被占用，换一个试试"（`docs/specs/01-basic.md:282`）
- 字数计数显示 `当前/上限`，接近上限时（≥90%）换 `status.warning`（`docs/specs/01-basic.md:283`）

## 无障碍（来自正式规格 §10）

- 字段标签与输入区必须关联，读屏先读标签再读内容（`docs/specs/01-basic.md:303`）
- 错误态读"任务名称，错误，名称已被占用"（`docs/specs/01-basic.md:304`）
- 后缀按钮各自有标签："清除内容"、"显示密码"、"选择单位"（`docs/specs/01-basic.md:305`）
- 输入字号不小于 16（避免 iOS 自动缩放），随动态字体放大时容器高度**同步增高，不裁切**（`docs/specs/01-basic.md:306`）
- 聚焦光环对比度 ≥ 3:1（`docs/specs/01-basic.md:307`）

## 契约摘要（来自 YAML）

- params: 6
- slots: label, prefix, accessory, helper
- enums: WDTextFieldVariant, WDTextFieldPrefix, WDTextFieldAccessory, WDTextFieldHelper

## 检索与组合 overlay（不得覆盖真源）

- searchAliases: none
- combinesWith: none
- pageRegions: none

## 平台说明

本卡不包含任何 Swift / Kotlin 平台 API 猜测。平台实现与证据只由对应 Provider 提供。
