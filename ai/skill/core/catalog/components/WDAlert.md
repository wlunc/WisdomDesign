<!-- GENERATED FILE - DO NOT EDIT. -->
<!-- Source: wisdomdesign design truth sources via tools/ai-skill/lib/extract-design.js. -->
<!-- Regenerate with: node tools/ai-skill/lib/extract-design.js | node tools/ai-skill/lib/generate-core-catalog.js --out <dir> -->
<!-- No platform API claims are included. -->

# WDAlert 语义卡

Component: `WDAlert`
Spec: `docs/specs/02-advanced.md` (number 25)
Contract: `contracts-digest.json#WDAlert` (source `contracts/WDAlert.yaml`, sha256 `4c11e751e3b1f46f2b9b67963b95b01609c5ec1cebd89234725aa6facf8f2498`)

## 用途（来自正式规格 §1）

需要用户**立刻做决定**，且决定之前不能继续往下走。

- **用**：删除确认、放弃未保存的修改、权限被拒后引导去设置
- **不要用**：只是告知结果（用 `WDToast`）；可以撤销的操作（用撤销条）；收集输入（用 `WDBottomSheet`）；错误提示（用 `WDBanner`）

## 来源追溯

- `docs/specs/02-advanced.md:430,432,434,435,437,439,443,444,445,446,447,449,453,454,455,456,457,458,460,464,465,466,467,469,473,474,475,483,485,486,487,488,508,510,511,512,513,514`

## 设计者摘要

卡片宽 270（固定，不随内容变化）；标题区上下内距 16 / 6；正文区左右内距 16，下内距 14；按钮高 44；必有 遮罩 / 卡片 / 标题 / 按钮组；可选 正文。

## 解剖（来自正式规格 §2）

- 段=遮罩; 是否必有=必有; 说明=阻止与下层交互，底色为页面底色的 40% 黑（`docs/specs/02-advanced.md:443`）
- 段=卡片; 是否必有=必有; 说明=`surface.card-solid` + `elevation.3` + `radius.xl`（`surface.card-solid` = 浅 #FFFFFF / 深 #0C212D；`elevation.3` = 0 8 20 #0A3C6417 ; 0 28 56 #0A3C6421；`radius.xl` = 24）（`docs/specs/02-advanced.md:444`）
- 段=标题; 是否必有=必有; 说明=`type.headline` 17 · 600，居中（`type.headline` = 17/22 · 600）（`docs/specs/02-advanced.md:445`）
- 段=正文; 是否必有=可选; 说明=`type.footnote` 13，色 `text.secondary`，居中，最多 3 行（`type.footnote` = 13/18 · 400；`text.secondary` = 浅 #3E5764 / 深 #A4BCCB）（`docs/specs/02-advanced.md:446`）
- 段=按钮组; 是否必有=必有; 说明=横向等分；两按钮时中间用 1pt 分割线（`docs/specs/02-advanced.md:447`）

## 尺寸（来自正式规格 §3）

- 项=卡片宽; 值=270（固定，不随内容变化）（`docs/specs/02-advanced.md:453`）
- 项=卡片圆角; 值=`radius.xl` 24（`radius.xl` = 24）（`docs/specs/02-advanced.md:454`）
- 项=标题区上下内距; 值=16 / 6（`docs/specs/02-advanced.md:455`）
- 项=正文区左右内距; 值=16，下内距 14（`docs/specs/02-advanced.md:456`）
- 项=按钮高; 值=44（`docs/specs/02-advanced.md:457`）
- 项=按钮字号; 值=16（破坏性按钮用 `status.danger`）（`status.danger` = 浅 #B8564D / 深 #EDA79E）（`docs/specs/02-advanced.md:458`）

## 变体（来自正式规格 §4）

- 变体=双按钮; 按钮组=取消 + 确认，取消在左; 用在哪=默认（`docs/specs/02-advanced.md:464`）
- 变体=单按钮; 按钮组=只有一个"知道了"; 用在哪=纯告知但仍需阻断（`docs/specs/02-advanced.md:465`）
- 变体=危险; 按钮组=确认按钮用 danger 色; 用在哪=删除、清空等不可逆操作（`docs/specs/02-advanced.md:466`）
- 变体=带输入; 按钮组=卡片内嵌一个 `WDTextField`; 用在哪=需要输入名称才能继续（如重命名）（`docs/specs/02-advanced.md:467`）

## 状态（来自正式规格 §5）

- 状态=出现; 视觉=遮罩 160ms 淡入；卡片 240ms 从 0.92 缩放到 1 + 淡入（`docs/specs/02-advanced.md:473`）
- 状态=按钮按下; 视觉=按钮底色 `fill.pressed`（`docs/specs/02-advanced.md:474`）
- 状态=长文案; 视觉=正文超过 3 行时卡片内部滚动，卡片高度不超过屏幕的 60%（`docs/specs/02-advanced.md:475`）

## 内容（来自正式规格 §7）

- 标题 ≤ 12 个汉字，一句话说清要决定什么（"删除这条任务？"）（`docs/specs/02-advanced.md:485`）
- 正文 ≤ 60 个汉字，补充后果（"删除后无法恢复，其他成员也看不到了"）（`docs/specs/02-advanced.md:486`）
- 按钮文案用**动词**："删除"、"放弃修改"，不用"确定 / 取消"这种没有信息量的词（`docs/specs/02-advanced.md:487`）
- 取消按钮保留"取消"即可，它本身就是标准语义（`docs/specs/02-advanced.md:488`）

## 无障碍（来自正式规格 §10）

- 角色为 `alertdialog`，标题与正文自动朗读（`docs/specs/02-advanced.md:510`）
- 出现时**焦点移入卡片**，并限制在卡片内（焦点陷阱）（`docs/specs/02-advanced.md:511`）
- 关闭后焦点**归还到触发元素**（`docs/specs/02-advanced.md:512`）
- 破坏性按钮的朗读包含后果："删除，删除后无法恢复"（`docs/specs/02-advanced.md:513`）
- 按钮触控热区 ≥ 44（`docs/specs/02-advanced.md:514`）

## 契约摘要（来自 YAML）

- params: 6
- slots: title, message, actions
- enums: WDAlertAction.Role

## 检索与组合 overlay（不得覆盖真源）

- searchAliases: 弹窗, 对话框, 警告, 确认弹窗, alert, dialog
- combinesWith: none
- pageRegions: overlay

## 平台说明

本卡不包含任何 Swift / Kotlin 平台 API 猜测。平台实现与证据只由对应 Provider 提供。
