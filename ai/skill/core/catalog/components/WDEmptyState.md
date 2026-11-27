<!-- GENERATED FILE - DO NOT EDIT. -->
<!-- Source: wisdomdesign design truth sources via tools/ai-skill/lib/extract-design.js. -->
<!-- Regenerate with: node tools/ai-skill/lib/extract-design.js | node tools/ai-skill/lib/generate-core-catalog.js --out <dir> -->
<!-- No platform API claims are included. -->

# WDEmptyState 语义卡

Component: `WDEmptyState`
Spec: `docs/specs/02-advanced.md` (number 30)
Contract: `contracts/WDEmptyState.yaml` (sha256 `4d4e0cab2875a5a484210f19f4d4597449032cbfdf65d861bda39eab215bd43e`)

## 用途（来自正式规格 §1）

没有内容时，说明**为什么没有**以及**接下来能做什么**。

- **用**：首次进入列表、搜索无结果、权限受限、加载失败
- **不要用**：内容还在加载（用 `WDSkeleton`）；内容确实为空但用户不关心（直接留白）

## 来源追溯

- `docs/specs/02-advanced.md:958,960,962,963,997,999,1007,1009,1010,1011,1012,1026,1028,1029,1030,1031`

## 状态（来自正式规格 §5）

- 空状态本身无状态。加载失败的变体可以重复触发"重试"，重试期间按钮进入加载态。（`docs/specs/02-advanced.md:999`）

## 内容（来自正式规格 §7）

- 标题 ≤ 12 个汉字，陈述事实（"还没有任务"）（`docs/specs/02-advanced.md:1009`）
- 说明 ≤ 40 个汉字，给出原因或下一步，**不写"这里什么都没有"这类废话**（`docs/specs/02-advanced.md:1010`）
- 操作文案是动词短语，且与标题呼应（`docs/specs/02-advanced.md:1011`）
- 搜索无结果时，标题里带上用户输入的关键词，让用户确认搜的是什么（`docs/specs/02-advanced.md:1012`）

## 无障碍（来自正式规格 §10）

- 作为一组朗读：标题 → 说明 → 操作（`docs/specs/02-advanced.md:1028`）
- 图标底座标记为装饰（`docs/specs/02-advanced.md:1029`）
- 读屏用户进入空页面时，标题应能被首个朗读到（`docs/specs/02-advanced.md:1030`）
- 文字对比度 ≥ 4.5:1，说明文字用 `text.secondary` 已满足（`docs/specs/02-advanced.md:1031`）

## 契约摘要（来自 YAML）

- params: 4
- slots: icon, title, message, actions
- enums: none

## 检索与组合 overlay（不得覆盖真源）

- searchAliases: none
- combinesWith: none
- pageRegions: none

## 平台说明

本卡不包含任何 Swift / Kotlin 平台 API 猜测。平台实现与证据只由对应 Provider 提供。
