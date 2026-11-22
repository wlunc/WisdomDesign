<!-- GENERATED FILE - DO NOT EDIT. -->
<!-- Source: wisdomdesign design truth sources via tools/ai-skill/lib/extract-design.rb. -->
<!-- Regenerate with: ruby tools/ai-skill/lib/extract-design.rb | node tools/ai-skill/lib/generate-core-catalog.js --out <dir> -->
<!-- No platform API claims are included. -->

# WDSegmentedControl 语义卡

Component: `WDSegmentedControl`
Spec: `docs/specs/02-advanced.md` (number 21)
Contract: `contracts/WDSegmentedControl.yaml` (sha256 `9cfe3787e7536810c2ef177e47a5cc60169949bb3948c0c8faf88e3a6666839b`)

## 用途（来自正式规格 §1）

2–5 个互斥选项之间切换，**切换即时生效，内容在同一页面内替换**。

- **用**：同一份数据的不同视图（今天 / 本周 / 全部）
- **不要用**：超过 5 项（用 `WDPicker`）；需要点保存才生效（用 `WDRadio`）；跳转到不同页面（用 `WDTabBar`）

## 来源追溯

- `docs/specs/02-advanced.md:13`
- `docs/specs/02-advanced.md:15`
- `docs/specs/02-advanced.md:20`
- `docs/specs/02-advanced.md:17`
- `docs/specs/02-advanced.md:18`
- `docs/specs/02-advanced.md:49`
- `docs/specs/02-advanced.md:53`
- `docs/specs/02-advanced.md:54`
- `docs/specs/02-advanced.md:55`
- `docs/specs/02-advanced.md:56`
- `docs/specs/02-advanced.md:64`
- `docs/specs/02-advanced.md:66`
- `docs/specs/02-advanced.md:67`
- `docs/specs/02-advanced.md:68`
- `docs/specs/02-advanced.md:89`
- `docs/specs/02-advanced.md:91`
- `docs/specs/02-advanced.md:92`
- `docs/specs/02-advanced.md:93`
- `docs/specs/02-advanced.md:94`
- `docs/specs/02-advanced.md:95`

## 状态（来自正式规格 §5）

- 状态=未选; 视觉=文字 `text.secondary`; 动效=—（`docs/specs/02-advanced.md:53`）
- 状态=选中; 视觉=指示块滑到该段；文字 `text.primary` 600; 动效=指示块 280ms `motion.spring.snappy`；文字 160ms（`docs/specs/02-advanced.md:54`）
- 状态=按下; 视觉=该段文字临时降到 70% 不透明度; 动效=100ms（`docs/specs/02-advanced.md:55`）
- 状态=禁用; 视觉=整体 40%，不响应; 动效=无（`docs/specs/02-advanced.md:56`）

## 内容（来自正式规格 §7）

- 每段 2–4 个汉字，等长最佳（`docs/specs/02-advanced.md:66`）
- 段文字不用标点、不用换行（`docs/specs/02-advanced.md:67`）
- 同一组内句式一致（都是名词，或都是时间范围）（`docs/specs/02-advanced.md:68`）

## 无障碍（来自正式规格 §10）

- 容器角色为 `tablist`，每段角色为 `tab`，并标注"第 n 项，共 m 项"（`docs/specs/02-advanced.md:91`）
- 选中项标注 `aria-selected="true"`（`docs/specs/02-advanced.md:92`）
- 内容区角色为 `tabpanel`，与对应 tab 关联（`docs/specs/02-advanced.md:93`）
- 触控热区：单段高度 38 需补到 44（纵向向外扩 3）（`docs/specs/02-advanced.md:94`）
- 选中态不依赖颜色：指示块的位置与文字字重同时变化（`docs/specs/02-advanced.md:95`）

## 契约摘要（来自 YAML）

- params: 3
- slots: items
- enums: WDSegmentedControlStyle

## 检索与组合 overlay（不得覆盖真源）

- searchAliases: none
- combinesWith: none
- pageRegions: none

## 平台说明

本卡不包含任何 Swift / Kotlin 平台 API 猜测。平台实现与证据只由对应 Provider 提供。
