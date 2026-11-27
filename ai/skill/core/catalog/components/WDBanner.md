<!-- GENERATED FILE - DO NOT EDIT. -->
<!-- Source: wisdomdesign design truth sources via tools/ai-skill/lib/extract-design.js. -->
<!-- Regenerate with: node tools/ai-skill/lib/extract-design.js | node tools/ai-skill/lib/generate-core-catalog.js --out <dir> -->
<!-- No platform API claims are included. -->

# WDBanner 语义卡

Component: `WDBanner`
Spec: `docs/specs/02-advanced.md` (number 29)
Contract: `contracts/WDBanner.yaml` (sha256 `f44a6e955fe11421b9119d47ff0006fb102380f214e508a3b30af6e8fc2a1b00`)

## 用途（来自正式规格 §1）

**常驻**的页面级提示。需要用户看到、可能需要处理，但不阻断当前操作。

- **用**：权限被限制、网络不可用、试用期剩余天数、批量操作的部分失败
- **不要用**：一次性结果（用 `WDToast`）；需要立刻决策（用 `WDAlert`）；装饰性强调

## 来源追溯

- `docs/specs/02-advanced.md:858,860,862,863,865,897,901,902,903,911,913,914,915,930,932,933,934,935`

## 状态（来自正式规格 §5）

- 状态=常驻; 说明=直到条件解除才消失（如网络恢复）（`docs/specs/02-advanced.md:901`）
- 状态=可关闭; 说明=右上角有关闭键，关闭后本次会话不再出现（`docs/specs/02-advanced.md:902`）
- 状态=出现; 说明=240ms 淡入 + 8pt 下移，不循环（`docs/specs/02-advanced.md:903`）

## 内容（来自正式规格 §7）

- 一句话说清"发生了什么 + 需要做什么"："网络不可用，改动已暂存本地"（`docs/specs/02-advanced.md:913`）
- ≤ 40 个汉字，超过 2 行说明这条信息不该用 Banner 承载（`docs/specs/02-advanced.md:914`）
- 操作按钮文案具体："去设置"、"重试"，不用"知道了"（`docs/specs/02-advanced.md:915`）

## 无障碍（来自正式规格 §10）

- 信息 / 成功用 `role="status"`，警示 / 错误用 `role="alert"`（`docs/specs/02-advanced.md:932`）
- 错误态的图标与文字同时变化，不依赖颜色（`docs/specs/02-advanced.md:933`）
- 关闭键标签"关闭提示"，并按内容补充："关闭网络提示"（`docs/specs/02-advanced.md:934`）
- 不抢焦点；若在页面加载时就存在，随内容一起被朗读（`docs/specs/02-advanced.md:935`）

## 契约摘要（来自 YAML）

- params: 5
- slots: message, actions
- enums: WDBannerVariant

## 检索与组合 overlay（不得覆盖真源）

- searchAliases: none
- combinesWith: none
- pageRegions: none

## 平台说明

本卡不包含任何 Swift / Kotlin 平台 API 猜测。平台实现与证据只由对应 Provider 提供。
