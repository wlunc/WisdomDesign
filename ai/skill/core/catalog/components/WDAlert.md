<!-- GENERATED FILE - DO NOT EDIT. -->
<!-- Source: wisdomdesign design truth sources via tools/ai-skill/lib/extract-design.rb. -->
<!-- Regenerate with: ruby tools/ai-skill/lib/extract-design.rb | node tools/ai-skill/lib/generate-core-catalog.js --out <dir> -->
<!-- No platform API claims are included. -->

# WDAlert 语义卡

Component: `WDAlert`
Spec: `docs/specs/02-advanced.md` (number 25)
Contract: `contracts/WDAlert.yaml` (sha256 `4c11e751e3b1f46f2b9b67963b95b01609c5ec1cebd89234725aa6facf8f2498`)

## 用途（来自正式规格 §1）

需要用户**立刻做决定**，且决定之前不能继续往下走。

- **用**：删除确认、放弃未保存的修改、权限被拒后引导去设置
- **不要用**：只是告知结果（用 `WDToast`）；可以撤销的操作（用撤销条）；收集输入（用 `WDBottomSheet`）；错误提示（用 `WDBanner`）

## 来源追溯

- `docs/specs/02-advanced.md:430`
- `docs/specs/02-advanced.md:432`
- `docs/specs/02-advanced.md:437`
- `docs/specs/02-advanced.md:434`
- `docs/specs/02-advanced.md:435`
- `docs/specs/02-advanced.md:469`
- `docs/specs/02-advanced.md:473`
- `docs/specs/02-advanced.md:474`
- `docs/specs/02-advanced.md:475`
- `docs/specs/02-advanced.md:483`
- `docs/specs/02-advanced.md:485`
- `docs/specs/02-advanced.md:486`
- `docs/specs/02-advanced.md:487`
- `docs/specs/02-advanced.md:488`
- `docs/specs/02-advanced.md:508`
- `docs/specs/02-advanced.md:510`
- `docs/specs/02-advanced.md:511`
- `docs/specs/02-advanced.md:512`
- `docs/specs/02-advanced.md:513`
- `docs/specs/02-advanced.md:514`

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

- searchAliases: none
- combinesWith: none
- pageRegions: none

## 平台说明

本卡不包含任何 Swift / Kotlin 平台 API 猜测。平台实现与证据只由对应 Provider 提供。
