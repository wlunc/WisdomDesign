# 06 · 组件详细规格

> 本文是**开发的依据**与**验收的标准**。组件实现完成、且本文的验收清单全部勾选，才视为交付。
> 清单见 [`02-components.md`](02-components.md)，可视化见 [`design/gallery/wisdom-components.html`](../design/gallery/wisdom-components.html)。

## 规格模板

每个组件按下面 12 节写，缺一节不算完成。写规格时遵守两条：

- **写令牌名，不写色值**。色值只在 `tokens/wisdom.tokens.json` 里出现一次。
- **验收项可勾选**。写不成"是/否"的句子不是验收项。

| # | 章节 | 要回答的问题 |
| --- | --- | --- |
| 1 | 用途 | 什么时候用它，什么时候**不要**用它，替代方案是什么 |
| 2 | 解剖 | 由哪几段组成，每一段用什么令牌 |
| 3 | 尺寸 | 各档的高度 / 内距 / 字号 / 图标 / 圆角，精确到 pt |
| 4 | 变体 | 每个变体的背景 / 文字 / 描边 / 阴影，逐项对应令牌 |
| 5 | 状态 | 默认 / 按下 / 聚焦 / 禁用 / 加载 / 选中 / 错误，各自的视觉、动效、触觉 |
| 6 | 布局 | 与相邻元素的关系、是否全宽、最大宽度、换行规则 |
| 7 | 内容 | 字数上限、截断方式、空值、数字与单位格式 |
| 8 | 交互 | 点击 / 长按 / 滑动 / 拖拽 / 键盘分别发生什么 |
| 9 | 动效 | 时长与曲线，引用 `motion.*` 令牌 |
| 10 | 无障碍 | 朗读文本、角色、触控热区、动态字体、对比度 |
| 11 | 平台差异 | iOS 与 Android 各自怎么做 |
| 12 | 验收清单 | 可勾选的检查项 |

## 文件划分

规格按**层级**拆分，编号与[可视化画廊](../design/gallery/wisdom-components.html)一致：

| 文件 | 范围 | 状态 |
| --- | --- | --- |
| [`01-basic.md`](01-basic.md) | 01–20 基础组件 | ✅ |
| [`02-advanced.md`](02-advanced.md) | 21–36 高级组件 | ✅ |
| `03-patterns.md` | 37–43 场景组件 | ⏳ 待写 |

## 组件索引

| 编号 | 组件 | 优先级 | 规格 |
| --- | --- | --- | --- |
| 01 | Button | P0 | [01-basic.md](01-basic.md) |
| 02 | IconButton | P0 | [01-basic.md](01-basic.md) |
| 03 | TextField | P0 | [01-basic.md](01-basic.md) |
| 04 | SearchField | P0 | [01-basic.md](01-basic.md) |
| 05 | Switch | P0 | [01-basic.md](01-basic.md) |
| 06 | Checkbox | P0 | [01-basic.md](01-basic.md) |
| 07 | Radio | P1 | [01-basic.md](01-basic.md) |
| 08 | Slider | P0 | [01-basic.md](01-basic.md) |
| 09 | Stepper | P1 | [01-basic.md](01-basic.md) |
| 10 | Chip | P0 | [01-basic.md](01-basic.md) |
| 11 | Badge | P0 | [01-basic.md](01-basic.md) |
| 12 | Avatar | P0 | [01-basic.md](01-basic.md) |
| 13 | AvatarStack | P0 | [01-basic.md](01-basic.md) |
| 14 | Divider | P1 | [01-basic.md](01-basic.md) |
| 15 | ProgressBar | P0 | [01-basic.md](01-basic.md) |
| 16 | ProgressRing | P0 | [01-basic.md](01-basic.md) |
| 17 | Card | P0 | [01-basic.md](01-basic.md) |
| 18 | ListRow | P0 | [01-basic.md](01-basic.md) |
| 19 | ListSection | P0 | [01-basic.md](01-basic.md) |
| 20 | Icon | P0 | [01-basic.md](01-basic.md) |
| 21 | SegmentedControl | P0 | [02-advanced.md](02-advanced.md) |
| 22 | Picker | P1 | [02-advanced.md](02-advanced.md) |
| 23 | DatePicker | P1 | [02-advanced.md](02-advanced.md) |
| 24 | FormRow | P1 | [02-advanced.md](02-advanced.md) |
| 25 | Alert | P0 | [02-advanced.md](02-advanced.md) |
| 26 | BottomSheet | P0 | [02-advanced.md](02-advanced.md) |
| 27 | ActionSheet | P1 | [02-advanced.md](02-advanced.md) |
| 28 | Toast | P0 | [02-advanced.md](02-advanced.md) |
| 29 | Banner | P0 | [02-advanced.md](02-advanced.md) |
| 30 | EmptyState | P1 | [02-advanced.md](02-advanced.md) |
| 31 | Skeleton | P1 | [02-advanced.md](02-advanced.md) |
| 32 | PullToRefresh | P1 | [02-advanced.md](02-advanced.md) |
| 33 | NavigationBar | P0 | [02-advanced.md](02-advanced.md) |
| 34 | TabBar | P0 | [02-advanced.md](02-advanced.md) |
| 35 | Toolbar | P1 | [02-advanced.md](02-advanced.md) |
| 36 | FAB | P1 | [02-advanced.md](02-advanced.md) |

## 参考

- 清单与优先级：[`../02-components.md`](../02-components.md)
- 令牌真源：[`../../tokens/wisdom.tokens.json`](../../tokens/wisdom.tokens.json)
- 可视化画廊：[`../../design/gallery/wisdom-components.html`](../../design/gallery/wisdom-components.html)
- 工程架构与排期：[`../04-architecture.md`](../04-architecture.md)
