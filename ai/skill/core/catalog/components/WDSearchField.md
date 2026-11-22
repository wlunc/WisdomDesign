<!-- GENERATED FILE - DO NOT EDIT. -->
<!-- Source: wisdomdesign design truth sources via tools/ai-skill/lib/extract-design.rb. -->
<!-- Regenerate with: ruby tools/ai-skill/lib/extract-design.rb | node tools/ai-skill/lib/generate-core-catalog.js --out <dir> -->
<!-- No platform API claims are included. -->

# WDSearchField 语义卡

Component: `WDSearchField`
Spec: `docs/specs/01-basic.md` (number 4)
Contract: `contracts/WDSearchField.yaml` (sha256 `f7faf3335575a4bd67f309a41ce93f4d450225ddd8486e84ab1af1fe29c33198`)

## 用途（来自正式规格 §1）

在一个已知集合里查找。**搜索的对象是已知的，筛选的对象是未知的**——这是它和 Chip 的分界。

- **用**：在任务、成员、历史记录里按关键词查找
- **不要用**：几个固定选项之间切换（用 `WDSegmentedControl` 或 `WDChip`）；跳转到别的页面

## 来源追溯

- `docs/specs/01-basic.md:336`
- `docs/specs/01-basic.md:338`
- `docs/specs/01-basic.md:341`
- `docs/specs/01-basic.md:340`
- `docs/specs/01-basic.md:370`
- `docs/specs/01-basic.md:374`
- `docs/specs/01-basic.md:375`
- `docs/specs/01-basic.md:376`
- `docs/specs/01-basic.md:377`
- `docs/specs/01-basic.md:378`
- `docs/specs/01-basic.md:386`
- `docs/specs/01-basic.md:388`
- `docs/specs/01-basic.md:389`
- `docs/specs/01-basic.md:390`
- `docs/specs/01-basic.md:411`
- `docs/specs/01-basic.md:413`
- `docs/specs/01-basic.md:414`
- `docs/specs/01-basic.md:415`
- `docs/specs/01-basic.md:416`
- `docs/specs/01-basic.md:417`

## 状态（来自正式规格 §5）

- 状态=空态（未聚焦）; 视觉=容器底 `surface.card`，占位符 `text.tertiary`; 动效=—（`docs/specs/01-basic.md:374`）
- 状态=聚焦; 视觉=描边换 `text.brand` 1.5pt + 18% 光环；取消按钮展开; 动效=160ms（`docs/specs/01-basic.md:375`）
- 状态=有值; 视觉=右侧出现清除按钮; 动效=160ms 淡入（`docs/specs/01-basic.md:376`）
- 状态=无结果; 视觉=容器保持正常；下方换成 `WDEmptyState`; 动效=—（`docs/specs/01-basic.md:377`）
- 状态=禁用; 视觉=整体 40%; 动效=无（`docs/specs/01-basic.md:378`）

## 内容（来自正式规格 §7）

- 占位符写清搜索范围：「搜索任务或成员」，不要只写「搜索」（`docs/specs/01-basic.md:388`）
- 输入 1 个字符即可开始搜，不需要最少字符数（`docs/specs/01-basic.md:389`）
- 无结果文案要给出下一步：「没找到"储物间"，换个词试试」（`docs/specs/01-basic.md:390`）

## 无障碍（来自正式规格 §10）

- 角色为 `searchbox`，朗读文本包含搜索范围（`docs/specs/01-basic.md:413`）
- 清除按钮标签「清除搜索内容」，取消按钮标签「取消搜索」（`docs/specs/01-basic.md:414`）
- 结果数量变化用 `aria-live="polite"` 播报，**不要播报每次按键**（`docs/specs/01-basic.md:415`）
- 前导图标标记为装饰（`docs/specs/01-basic.md:416`）
- 触控热区 ≥ 44×44；输入字号 ≥ 16（`docs/specs/01-basic.md:417`）

## 契约摘要（来自 YAML）

- params: 7
- slots: placeholder, leadingIcon, label
- enums: none

## 检索与组合 overlay（不得覆盖真源）

- searchAliases: 搜索框, 查询输入, filter input
- combinesWith: WDChip, WDSegmentedControl
- pageRegions: toolbar, collection-header

## 平台说明

本卡不包含任何 Swift / Kotlin 平台 API 猜测。平台实现与证据只由对应 Provider 提供。
