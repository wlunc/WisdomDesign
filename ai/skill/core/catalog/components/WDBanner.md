<!-- GENERATED FILE - DO NOT EDIT. -->
<!-- Source: wisdomdesign design truth sources via tools/ai-skill/lib/extract-design.js. -->
<!-- Regenerate with: node tools/ai-skill/lib/extract-design.js | node tools/ai-skill/lib/generate-core-catalog.js --out <dir> -->
<!-- No platform API claims are included. -->

# WDBanner 语义卡

Component: `WDBanner`
Spec: `docs/specs/02-advanced.md` (number 29)
Contract: `contracts-digest.json#WDBanner` (source `contracts/WDBanner.yaml`, sha256 `f44a6e955fe11421b9119d47ff0006fb102380f214e508a3b30af6e8fc2a1b00`)

## 用途（来自正式规格 §1）

**常驻**的页面级提示。需要用户看到、可能需要处理，但不阻断当前操作。

- **用**：权限被限制、网络不可用、试用期剩余天数、批量操作的部分失败
- **不要用**：一次性结果（用 `WDToast`）；需要立刻决策（用 `WDAlert`）；装饰性强调

## 来源追溯

- `docs/specs/02-advanced.md:858,860,862,863,865,867,871,872,873,874,876,880,881,882,883,884,886,890,891,892,893,895,897,901,902,903,911,913,914,915,930,932,933,934,935`

## 设计者摘要

最小高 44（单行）；内边距 12；图标与文案间距 `space.3`（8）；文案与操作间距 `space.3`（8）；圆角 `radius.lg` 18；必有 状态图标 / 文案；可选 操作按钮 / 关闭键。

## 解剖（来自正式规格 §2）

- 段=状态图标; 是否必有=必有; 说明=18pt，形状区分状态（对勾 / 信息 / 三角 / 实心禁止）（`docs/specs/02-advanced.md:871`）
- 段=文案; 是否必有=必有; 说明=`type.footnote` 13，最多 2 行（`type.footnote` = 13/18 · 400）（`docs/specs/02-advanced.md:872`）
- 段=操作按钮; 是否必有=可选; 说明=文字按钮，最多一个（`docs/specs/02-advanced.md:873`）
- 段=关闭键; 是否必有=可选; 说明=可关闭的提示才有（`docs/specs/02-advanced.md:874`）

## 尺寸（来自正式规格 §3）

- 项=最小高; 值=44（单行）（`docs/specs/02-advanced.md:880`）
- 项=内边距; 值=12（`docs/specs/02-advanced.md:881`）
- 项=圆角; 值=`radius.lg` 18（`radius.lg` = 18）（`docs/specs/02-advanced.md:882`）
- 项=图标与文案间距; 值=`space.3`（8）（`docs/specs/02-advanced.md:883`）
- 项=文案与操作间距; 值=`space.3`（8）（`docs/specs/02-advanced.md:884`）

## 变体（来自正式规格 §4）

- 变体=成功; 底色=`status-soft.success` 渐变; 文字与图标=`status.success`; 用在哪=同步完成（`status-soft.success` = 浅 #E3F5EC / 深 #0D2E24；`status.success` = 浅 #2A7F5C / 深 #7FD3B4）（`docs/specs/02-advanced.md:890`）
- 变体=信息; 底色=`status-soft.info` 渐变; 文字与图标=`status.info`; 用在哪=中性说明（`status-soft.info` = 浅 #E1F0F8 / 深 #0C2740；`status.info` = 浅 #1677B3 / 深 #8FC4E8）（`docs/specs/02-advanced.md:891`）
- 变体=警示; 底色=`status-soft.warning` 渐变; 文字与图标=`status.warning`; 用在哪=快到期、接近上限（`status-soft.warning` = 浅 #FFF4DC / 深 #33260E；`status.warning` = 浅 #97651F / 深 #EFC683）（`docs/specs/02-advanced.md:892`）
- 变体=错误; 底色=`status-soft.danger` 渐变 + 文字加粗; 文字与图标=`status.danger`; 用在哪=操作失败、需处理（`status-soft.danger` = 浅 #FBE7E4 / 深 #3A211E；`status.danger` = 浅 #B8564D / 深 #EDA79E）（`docs/specs/02-advanced.md:893`）
- 底色一律用**同色 20% 左右的渐变**，不用纯色块。（`docs/specs/02-advanced.md:895`）

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

- searchAliases: 横幅, 通知条, 常驻提示, banner
- combinesWith: none
- pageRegions: page-header, form

## 平台说明

本卡不包含任何 Swift / Kotlin 平台 API 猜测。平台实现与证据只由对应 Provider 提供。
