<!-- GENERATED FILE - DO NOT EDIT. -->
<!-- Source: wisdomdesign design truth sources via tools/ai-skill/lib/extract-design.js. -->
<!-- Regenerate with: node tools/ai-skill/lib/extract-design.js | node tools/ai-skill/lib/generate-core-catalog.js --out <dir> -->
<!-- No platform API claims are included. -->

# WDToast 语义卡

Component: `WDToast`
Spec: `docs/specs/02-advanced.md` (number 28)
Contract: `contracts-digest.json#WDToast` (source `contracts/WDToast.yaml`, sha256 `28d3736c731cd7348574f34790e782eee1fab552517eab852bd15b63e65d61ba`)

## 用途（来自正式规格 §1）

**非阻塞**的轻提示，告知"刚刚发生了一件事"。

- **用**：保存成功、已复制、已同步、任务已删除（带撤销）
- **不要用**：需要用户决策（用 `WDAlert`）；需要用户处理且不能错过的错误（用 `WDBanner`）；加载中（用进度组件）

## 来源追溯

- `docs/specs/02-advanced.md:754,756,758,759,761,763,765,767,771,772,773,774,775,776,778,782,783,784,785,787,791,792,793,794,795,803,805,806,807,825,827,828,829,830,831`

## 设计者摘要

高度 46（单行）；多行时自适应，最多 2 行；最小宽度 120；最大宽度 屏幕宽 − 2 × `space.6`（40）；水平内距 18；圆角 `radius.full`。

## 解剖（来自正式规格 §2）

- 玻璃胶囊 + 状态图标 + 文字 + 可选操作按钮。底部距安全区 `space.5`（16）。（`docs/specs/02-advanced.md:765`）

## 尺寸（来自正式规格 §3）

- 项=高度; 值=46（单行）；多行时自适应，最多 2 行（`docs/specs/02-advanced.md:771`）
- 项=最小宽度; 值=120（`docs/specs/02-advanced.md:772`）
- 项=最大宽度; 值=屏幕宽 − 2 × `space.6`（40）（`docs/specs/02-advanced.md:773`）
- 项=水平内距; 值=18（`docs/specs/02-advanced.md:774`）
- 项=圆角; 值=`radius.full`（`radius.full` = 999）（`docs/specs/02-advanced.md:775`）
- 项=图标; 值=16（`docs/specs/02-advanced.md:776`）

## 变体（来自正式规格 §4）

- 变体=成功; 图标=`check` + `text.brand`; 用在哪=保存、同步完成（`text.brand` = 浅 #1677B3 / 深 #7EC4CF）（`docs/specs/02-advanced.md:782`）
- 变体=信息; 图标=`info`; 用在哪=中性提示（`docs/specs/02-advanced.md:783`）
- 变体=失败; 图标=`x-circle` + `status.danger`; 用在哪=操作未成功，但可重试（`status.danger` = 浅 #B8564D / 深 #EDA79E）（`docs/specs/02-advanced.md:784`）
- 变体=带操作; 图标=右侧加一个文字按钮（"撤销"）; 用在哪=删除后撤销（`docs/specs/02-advanced.md:785`）

## 状态（来自正式规格 §5）

- 状态=出现; 时长=320ms 上移淡入（`docs/specs/02-advanced.md:791`）
- 状态=停留（纯提示）; 时长=3 秒（`docs/specs/02-advanced.md:792`）
- 状态=停留（带操作）; 时长=5 秒（`docs/specs/02-advanced.md:793`）
- 状态=消失; 时长=160ms 淡出（`docs/specs/02-advanced.md:794`）
- 状态=手指悬停; 时长=暂停计时（`docs/specs/02-advanced.md:795`）

## 内容（来自正式规格 §7）

- 一句话 ≤ 20 个汉字，说结果不说过程（"任务已保存"而不是"正在保存任务"）（`docs/specs/02-advanced.md:805`）
- 不用"成功！"这类只有情绪没有信息的文案（`docs/specs/02-advanced.md:806`）
- 带操作时按钮文案具体："撤销"而不是"好"（`docs/specs/02-advanced.md:807`）

## 无障碍（来自正式规格 §10）

- 成功 / 信息用 `aria-live="polite"`（`docs/specs/02-advanced.md:827`）
- 失败用 `role="alert"`，会被立即播报（`docs/specs/02-advanced.md:828`）
- 带操作时朗读"任务已删除，撤销，按钮"（`docs/specs/02-advanced.md:829`）
- Toast 出现**不抢焦点**——它是非阻塞提示（`docs/specs/02-advanced.md:830`）
- 文字与底色对比度 ≥ 4.5:1（玻璃底上必要时加底色托底）（`docs/specs/02-advanced.md:831`）

## 契约摘要（来自 YAML）

- params: 6
- slots: message, actions
- enums: WDToastVariant

## 检索与组合 overlay（不得覆盖真源）

- searchAliases: 轻提示, 提示条, 短暂提示, toast
- combinesWith: none
- pageRegions: overlay

## 平台说明

本卡不包含任何 Swift / Kotlin 平台 API 猜测。平台实现与证据只由对应 Provider 提供。
