<!-- GENERATED FILE - DO NOT EDIT. -->
<!-- Source: wisdomdesign design truth sources via tools/ai-skill/lib/extract-design.js. -->
<!-- Regenerate with: node tools/ai-skill/lib/extract-design.js | node tools/ai-skill/lib/generate-core-catalog.js --out <dir> -->
<!-- No platform API claims are included. -->

# WDToast 语义卡

Component: `WDToast`
Spec: `docs/specs/02-advanced.md` (number 28)
Contract: `contracts/WDToast.yaml` (sha256 `28d3736c731cd7348574f34790e782eee1fab552517eab852bd15b63e65d61ba`)

## 用途（来自正式规格 §1）

**非阻塞**的轻提示，告知"刚刚发生了一件事"。

- **用**：保存成功、已复制、已同步、任务已删除（带撤销）
- **不要用**：需要用户决策（用 `WDAlert`）；需要用户处理且不能错过的错误（用 `WDBanner`）；加载中（用进度组件）

## 来源追溯

- `docs/specs/02-advanced.md:754`
- `docs/specs/02-advanced.md:756`
- `docs/specs/02-advanced.md:761`
- `docs/specs/02-advanced.md:758`
- `docs/specs/02-advanced.md:759`
- `docs/specs/02-advanced.md:787`
- `docs/specs/02-advanced.md:791`
- `docs/specs/02-advanced.md:792`
- `docs/specs/02-advanced.md:793`
- `docs/specs/02-advanced.md:794`
- `docs/specs/02-advanced.md:795`
- `docs/specs/02-advanced.md:803`
- `docs/specs/02-advanced.md:805`
- `docs/specs/02-advanced.md:806`
- `docs/specs/02-advanced.md:807`
- `docs/specs/02-advanced.md:825`
- `docs/specs/02-advanced.md:827`
- `docs/specs/02-advanced.md:828`
- `docs/specs/02-advanced.md:829`
- `docs/specs/02-advanced.md:830`
- `docs/specs/02-advanced.md:831`

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

- searchAliases: none
- combinesWith: none
- pageRegions: none

## 平台说明

本卡不包含任何 Swift / Kotlin 平台 API 猜测。平台实现与证据只由对应 Provider 提供。
