<!-- GENERATED FILE - DO NOT EDIT. -->
<!-- Source: wisdomdesign design truth sources via tools/ai-skill/lib/extract-design.rb. -->
<!-- Regenerate with: ruby tools/ai-skill/lib/extract-design.rb | node tools/ai-skill/lib/generate-core-catalog.js --out <dir> -->
<!-- No platform API claims are included. -->

# WDNavigationBar 语义卡

Component: `WDNavigationBar`
Spec: `docs/specs/02-advanced.md` (number 33)
Contract: `contracts/WDNavigationBar.yaml` (sha256 `ed51c696550b86ecf1dffe2bbec9d43f4ca058bb645646e234e105783fd0a2e9`)

## 用途（来自正式规格 §1）

页面级导航容器：告诉用户"这是哪"，并提供返回与页面级操作。

- **用**：每个二级及以上页面
- **不要用**：Tab 内的一级页面加返回按钮（一级页面没有返回）；把页面内容塞进导航栏

## 来源追溯

- `docs/specs/02-advanced.md:1247`
- `docs/specs/02-advanced.md:1249`
- `docs/specs/02-advanced.md:1252`
- `docs/specs/02-advanced.md:1251`
- `docs/specs/02-advanced.md:1281`
- `docs/specs/02-advanced.md:1285`
- `docs/specs/02-advanced.md:1286`
- `docs/specs/02-advanced.md:1287`
- `docs/specs/02-advanced.md:1288`
- `docs/specs/02-advanced.md:1297`
- `docs/specs/02-advanced.md:1299`
- `docs/specs/02-advanced.md:1300`
- `docs/specs/02-advanced.md:1301`
- `docs/specs/02-advanced.md:1321`
- `docs/specs/02-advanced.md:1323`
- `docs/specs/02-advanced.md:1324`
- `docs/specs/02-advanced.md:1325`
- `docs/specs/02-advanced.md:1326`
- `docs/specs/02-advanced.md:1327`

## 状态（来自正式规格 §5）

- 状态=未滚动; 视觉=透明底，无分割线; 动效=—（`docs/specs/02-advanced.md:1285`）
- 状态=已滚动; 视觉=`surface.glass` + 底部 1pt `border.hairline`; 动效=240ms 交叉淡化（`docs/specs/02-advanced.md:1286`）
- 状态=大标题收缩; 视觉=大标题缩到内联标题的位置并降字号; 动效=`motion.spring.gentle`（`docs/specs/02-advanced.md:1287`）
- 状态=返回按下; 视觉=按钮缩放 0.97 + `fill.pressed`; 动效=100ms（`docs/specs/02-advanced.md:1288`）

## 内容（来自正式规格 §7）

- 标题 ≤ 8 个汉字，用页面名而不是动作名（"家庭"而不是"查看家庭"）（`docs/specs/02-advanced.md:1299`）
- 标题不用缩写、不用省略号；放不下时优先缩短文案（`docs/specs/02-advanced.md:1300`）
- 返回按钮**只显示箭头不显示文字**（除非空间充裕且需要指明来源页）（`docs/specs/02-advanced.md:1301`）

## 无障碍（来自正式规格 §10）

- 导航栏作为 `header` 语义，标题作为页面标题被首个朗读（`docs/specs/02-advanced.md:1323`）
- 返回按钮标签包含来源页名："返回家庭列表"（`docs/specs/02-advanced.md:1324`）
- 右侧图标按钮必须有独立标签（`docs/specs/02-advanced.md:1325`）
- 大标题收缩时读屏**仍能读到完整标题**，不能因为视觉收缩而丢失（`docs/specs/02-advanced.md:1326`）
- 触控热区 ≥ 44×44（`docs/specs/02-advanced.md:1327`）

## 契约摘要（来自 YAML）

- params: 6
- slots: title, leading, trailing
- enums: WDNavigationBarMode, WDNavigationBarStyle

## 检索与组合 overlay（不得覆盖真源）

- searchAliases: none
- combinesWith: none
- pageRegions: none

## 平台说明

本卡不包含任何 Swift / Kotlin 平台 API 猜测。平台实现与证据只由对应 Provider 提供。
