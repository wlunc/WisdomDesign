# 02 · 组件清单与规格 v0.1

优先级：**P0** 首批实现（骨架）· **P1** 第二批（场景完整）· **P2** 后续（增强）

## A. 操作 Actions

| # | 组件 | 变体 | 优先级 |
| --- | --- | --- | --- |
| A1 | Button | filled / tonal / glass / outline / plain / destructive | P0 |
| A2 | IconButton | 圆形 / 圆角方 / 有无玻璃底 | P0 |
| A3 | FloatingActionButton | 圆形 / 玻璃胶囊（可展开） | P1 |
| A4 | Chip | 展示 / 可选 / 可删除 | P0 |
| A5 | SegmentedControl | 2–5 段，玻璃底 / 实底 | P0 |
| A6 | Link | 行内 / 整行 | P1 |
| A7 | ButtonGroup | 水平 / 垂直拼接 | P2 |

## B. 表单输入 Inputs

| # | 组件 | 变体 | 优先级 |
| --- | --- | --- | --- |
| B1 | TextField | inset / outline / glass | P0 |
| B2 | SearchField | 胶囊 / 带取消按钮 | P0 |
| B3 | SecureField | 带显隐切换 | P1 |
| B4 | TextArea | 自适应高度 + 计数 | P1 |
| B5 | Switch | 标准 / 带描述 | P0 |
| B6 | Checkbox | 渐变填充 + 描边勾 + 光晕；标准 / 半选 / 禁用 | P0 |
| B7 | Radio | 标准 | P1 |
| B8 | Slider | 单值 / 范围 / 带刻度 | P0 |
| B9 | Stepper | 水平 / 紧凑 | P1 |
| B10 | Picker | 菜单 / 滚轮 / 内联 | P1 |
| B11 | DateTimePicker | 日期 / 时间 / 范围 | P1 |
| B12 | OTPInput | 4–6 位 | P2 |

## C. 展示 Display

| # | 组件 | 变体 | 优先级 |
| --- | --- | --- | --- |
| C1 | Card | elevated / glass / outline / sunken / media | P0 |
| C2 | ListRow | 单行 / 双行 / 三行 / 带选择 | P0 |
| C3 | ListSection | 分组标题 + 卡片容器 | P0 |
| C4 | Avatar | 图片 / 文字 / 家庭成员组 | P0 |
| C5 | Badge | 圆点 / 计数 / 状态胶囊 | P0 |
| C6 | Divider | 全宽 / 内缩 | P1 |
| C7 | Progress | 线性 / 环形 / 分段 | P0 |
| C8 | Skeleton | 文本 / 卡片 / 列表 | P1 |
| C9 | EmptyState | 图标 + 标题 + 说明 + 操作 | P1 |
| C10 | StatTile | 数值 + 单位 + 趋势 | P1 |
| C11 | Chart | 折线 / 柱 / 环 | P2 |

## D. 导航与容器 Navigation

| # | 组件 | 变体 | 优先级 |
| --- | --- | --- | --- |
| D1 | NavigationBar | 大标题 / 内联标题，玻璃底，滚动收缩 | P0 |
| D2 | Toolbar | 顶部 / 底部 / 键盘上方 | P1 |
| D3 | TabBar | 悬浮玻璃胶囊（iOS 26 形态） | P0 |
| D4 | BackButton / CloseButton | 圆形玻璃底 | P0 |
| D5 | BottomSheet | detents（半屏 / 全屏）+ 把手 | P0 |
| D6 | Modal | 全屏覆盖 / 卡片式 | P1 |
| D7 | Alert | 标准 / 带输入 | P0 |
| D8 | ActionSheet | 操作列表 + 取消 | P1 |
| D9 | ContextMenu / Popover | 长按菜单 / 锚点浮层 | P2 |

## E. 反馈 Feedback

| # | 组件 | 变体 | 优先级 |
| --- | --- | --- | --- |
| E1 | Toast | 顶部浮出 / 底部浮出 | P0 |
| E2 | InlineBanner | info / success / warning / danger | P0 |
| E3 | PullToRefresh | 带品牌进度 | P1 |
| E4 | ConfirmDialog | 危险操作确认 | P1 |
| E5 | HapticFeedback | 触觉规范（非视觉组件） | P0 |
| E6 | LoadingOverlay | 遮罩 + 进度 | P1 |

## F. 场景模式 Patterns

服务于"多人协作的家庭工具"。**这一组里只有 1 个是组件，其余 5 个是配方**：

| # | 名称 | 类型 | 说明 | 优先级 |
| --- | --- | --- | --- | --- |
| R1 | TaskRow | 配方 | 勾选 + 标题 + 负责人 + 截止时间 | P0 |
| R2 | SharedBadge | 配方 | "共享给全家 / 仅自己"状态标记 | P1 |
| R3 | StreakRing | 配方 | 连续完成进度环 + 天数 | P1 |
| R4 | ReminderChip | 配方 | 提醒时间选择胶囊 | P1 |
| R5 | FamilySpaceCard | 配方 | 家庭空间入口卡 | P1 |
| 37 | AssigneePicker | **组件** | 指派给谁（头像横排选择） | P1 |

~~F2 MemberAvatarStack~~ 已由组件 13 `WDAvatarStack` 覆盖，删除。

配方是用已有组件拼出来的固定组合，不当组件承诺兼容性；提升为组件的三条标准见 [`specs/03-patterns.md`](specs/03-patterns.md)。

---

## 详细规格在哪

组件清单只回答「有哪些组件、什么优先级」。**每个组件的尺寸、变体、状态、交互、动效、无障碍与验收清单**
统一写在 [`specs/`](specs/README.md)，那份文档是开发的依据与验收的标准；本文不再重复规格，避免两处不一致。

| 文件 | 范围 |
| --- | --- |
| [`specs/README.md`](specs/README.md) | 规格模板、编写规则、组件索引 |
| [`specs/01-basic.md`](specs/01-basic.md) | 01–20 基础组件 |
| [`specs/02-advanced.md`](specs/02-advanced.md) | 21–36 高级组件 |
| `specs/03-patterns.md` | 37–43 场景组件（待写） |

可视化画廊：

| 文件 | 范围 |
| --- | --- |
| [`design/gallery/wisdom-components.html`](../design/gallery/wisdom-components.html) | 01–20 基础组件 |
| [`design/gallery/wisdom-advanced.html`](../design/gallery/wisdom-advanced.html) | 21–36 高级组件 |
