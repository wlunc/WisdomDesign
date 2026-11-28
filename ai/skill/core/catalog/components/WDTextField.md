<!-- GENERATED FILE - DO NOT EDIT. -->
<!-- Source: wisdomdesign design truth sources via tools/ai-skill/lib/extract-design.js. -->
<!-- Regenerate with: node tools/ai-skill/lib/extract-design.js | node tools/ai-skill/lib/generate-core-catalog.js --out <dir> -->
<!-- No platform API claims are included. -->

# WDTextField 语义卡

Component: `WDTextField`
Spec: `docs/specs/01-basic.md` (number 3)
Contract: `contracts-digest.json#WDTextField` (source `contracts/WDTextField.yaml`, sha256 `51d32379d3174ff47ecda45d537e72b10d86e2be0cd0bec30e59b7bc044c4163`)

## 用途（来自正式规格 §1）

单行文本输入。

- **用**：任务名称、成员名、金额、时间
- **不要用**：多行内容（用 TextArea）；选项选择（用 Picker / Radio）；布尔值（用 Switch）

## 来源追溯

- `docs/specs/01-basic.md:223,225,227,228,230,234,235,236,237,238,239,241,245,246,247,248,249,250,251,252,254,258,259,260,262,266,267,268,269,270,278,280,281,282,283,301,303,304,305,306,307`

## 设计者摘要

高度 **46**（固定，所有变体一致）；水平内距 12；前缀与输入区间距 `space.3` 8；后缀与输入区间距 `space.3` 8；圆角 `radius.md` 14；必有 字段标签 / 容器 / 输入区；可选 前缀 / 后缀。

## 解剖（来自正式规格 §2）

- 段=字段标签; 是否必有=必有; 说明=常驻在输入框上方，`type.footnote`，用 `text.secondary`（`type.footnote` = 13/18 · 400；`text.secondary` = 浅 #3E5764 / 深 #A4BCCB）（`docs/specs/01-basic.md:234`）
- 段=容器; 是否必有=必有; 说明=固定高度 46（`docs/specs/01-basic.md:235`）
- 段=前缀; 是否必有=可选; 说明=图标 17，或文字（货币符号），色 `text.tertiary`（`text.tertiary` = 浅 #4C616D / 深 #839EB0）（`docs/specs/01-basic.md:236`）
- 段=输入区; 是否必有=必有; 说明=`type.body`（17），占位符 `text.tertiary`（`text.tertiary` = 浅 #4C616D / 深 #839EB0）（`docs/specs/01-basic.md:237`）
- 段=后缀; 是否必有=可选; 说明=**最多一个**：单位 / 清除 / 显隐 / 计数 / 下拉（`docs/specs/01-basic.md:238`）
- 段=辅助文案; 是否必有=条件; 说明=错误时必有；常态可选。`type.footnote`（`type.footnote` = 13/18 · 400）（`docs/specs/01-basic.md:239`）

## 尺寸（来自正式规格 §3）

- 项=高度; 值=**46**（固定，所有变体一致）（`docs/specs/01-basic.md:245`）
- 项=圆角; 值=`radius.md` 14（`radius.md` = 14）（`docs/specs/01-basic.md:246`）
- 项=水平内距; 值=12（`docs/specs/01-basic.md:247`）
- 项=前缀与输入区间距; 值=`space.3` 8（`space.3` = 8）（`docs/specs/01-basic.md:248`）
- 项=后缀与输入区间距; 值=`space.3` 8（`space.3` = 8）（`docs/specs/01-basic.md:249`）
- 项=标签与容器间距; 值=`space.2` 4（`space.2` = 4）（`docs/specs/01-basic.md:250`）
- 项=辅助文案与容器间距; 值=`space.2` 4（`space.2` = 4）（`docs/specs/01-basic.md:251`）
- 项=最小宽度; 值=190（`docs/specs/01-basic.md:252`）

## 变体（来自正式规格 §4）

- 变体=`inset`（默认）; 背景=`fill.field`; 描边=无; 用在哪=表单内（`fill.field` = 浅 #0A1B240D / 深 #FFFFFF12）（`docs/specs/01-basic.md:258`）
- 变体=`outline`; 背景=透明; 描边=`border.hairline-strong`; 用在哪=白底卡片上，视觉更轻（`border.hairline-strong` = 浅 #0A1B2429 / 深 #FFFFFF2E）（`docs/specs/01-basic.md:259`）
- 变体=`glass`; 背景=`surface.glass-strong`; 描边=`border.hairline`; 用在哪=浮在图片或内容之上（`surface.glass-strong` = 浅 #FFFFFFDB / 深 #0C202CC7；`border.hairline` = 浅 #0A1B2414 / 深 #FFFFFF1A）（`docs/specs/01-basic.md:260`）

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

- searchAliases: 输入框, 文本输入, 文本框, 输入, text field
- combinesWith: none
- pageRegions: form, toolbar

## 平台说明

本卡不包含任何 Swift / Kotlin 平台 API 猜测。平台实现与证据只由对应 Provider 提供。
