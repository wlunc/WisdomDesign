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

## F. 家庭场景模式 Patterns

这一组是本库区别于通用组件库的部分，服务于"多人协作的家庭工具"。

| # | 模式 | 说明 | 优先级 |
| --- | --- | --- | --- |
| F1 | TaskRow | 勾选 + 标题 + 负责人头像 + 截止时间 | P0 |
| F2 | MemberAvatarStack | 家庭成员堆叠 + 溢出计数 | P0 |
| F3 | SharedBadge | "共享给全家 / 仅自己"状态标记 | P1 |
| F4 | StreakRing | 连续完成进度环 + 天数 | P1 |
| F5 | ReminderChip | 提醒时间选择胶囊 | P1 |
| F6 | FamilySpaceCard | 家庭空间入口卡（成员 + 概览） | P1 |
| F7 | AssigneePicker | 指派给谁（头像横排选择） | P1 |

---

# 关键组件规格

## Button

| 项 | 规格 |
| --- | --- |
| 尺寸 | sm 32 / md 44（默认）/ lg 52，高度含描边 |
| 水平内距 | sm 12 / md 16 / lg 20 |
| 圆角 | `radius.full`（胶囊）为默认；表单内可用 `radius.md` |
| 图标 | 16–20pt，与文字间距 8；仅图标时保持 44×44 |
| 状态 | 默认 / 按下（缩放 0.97 + `fill.pressed`）/ 禁用（40% 不透明度）/ 加载（原地替换文字为指示器，宽度不变）/ 聚焦（3pt 品牌色光环，外扩 2） |

| 变体 | 底 | 文字 | 使用场景 |
| --- | --- | --- | --- |
| filled | `gradient.fill` | `text.on-brand` | 每屏一个主操作 |
| tonal | `brand.100` | `text.brand` | 次级操作 |
| glass | `material.thin` | `text.primary` | 浮在图片/内容之上的操作 |
| outline | 透明 + hairline | `text.primary` | 中性操作 |
| plain | 透明 | `text.brand` | 行内操作、列表右侧 |
| destructive | `gradient` 红系 | 白 | 删除、退出、不可逆操作 |

filled 使用 `gradient.fill`（`#1A7F5E → #145C46`），配 `elevation.brand` 彩色投影。
渐变只在这个区间内变化，保证白字 ≥ 4.5:1；亮色渐变（`gradient.brand`）只能用于不承载文字的装饰元素。

无障碍：加载态保留原标签并追加"处理中"；禁用态用 `aria-disabled` 语义而非移除按钮。

## TextField

| 项 | 规格 |
| --- | --- |
| 高度 | 44（单行）/ 自适应（多行，最小 88） |
| 圆角 | `radius.md` |
| 内距 | 水平 14，垂直 12 |
| 结构 | 前缀图标（可选）/ 输入区 / 后缀（清除、单位、按钮） |
| 标签 | 浮层标签在聚焦或有内容时上移并缩至 `caption1`；不复用占位符当标签 |
| 状态 | 默认（`fill.field`）/ 聚焦（品牌 1.5pt 描边 + 12% 光环）/ 错误（danger 描边 + 下方 `footnote` 说明）/ 禁用（40%）/ 只读 |

平台差异：iOS 使用系统键盘与安全区避让；Android 使用 `ImeAction` 与 `WindowInsets.ime` 避让。

## Card

| 变体 | 规格 | 用途 |
| --- | --- | --- |
| elevated | 白底 + `elevation.1` + `radius.xl` | 主要内容卡片 |
| glass | `material.regular` + 顶部高光 + hairline | 浮在内容/图片上的卡片 |
| outline | 透明底 + hairline + 无阴影 | 密集列表、设置项 |
| sunken | `surface.card-sunken` 底 + 无阴影 | 卡内嵌块、次级信息 |
| media | 顶部图片（圆角 = 外圆角 − 内边距）+ 文字区 | 图文卡 |

内边距固定 16；卡内主标题 `headline`，副标题 `subheadline` 用 `text.secondary`，两者间距 4。

## ListRow

| 项 | 规格 |
| --- | --- |
| 高度 | 单行 44 / 双行 60 / 三行 76 |
| 内距 | 水平 16，垂直按行数自适应 |
| 结构 | [前导 28: 图标底座或头像] 8 [文本区 flex] 8 [尾部：值文本 / 徽标 / chevron] |
| 图标底座 | 28×28，`radius.xs`，底色 `brand.100`，图标 `text.brand` |
| 分隔线 | 从文本区左边开始内缩，`border.hairline`，末行不显示 |
| 状态 | 默认 / 按下（整行 `fill.pressed`）/ 选中（左侧 3pt 品牌条 + `brand.50` 底）/ 禁用 |

## TabBar（悬浮玻璃胶囊）

| 项 | 规格 |
| --- | --- |
| 形态 | 胶囊，距屏幕左右 16，距底部安全区 8 |
| 高度 | 56 |
| 材质 | `material.thin` + 顶部高光 + `elevation.2` |
| 项目 | 2–5 个，等宽；图标 24 + 标签 `caption2` |
| 选中态 | 图标变 `brand.600` + 文字加粗；选中项下有 4pt 圆点或胶囊高亮 |
| 滚动行为 | 向下滚动时收缩为无标签的胶囊；向上滚动立刻展开 |
| 无障碍 | 每个项目标注"第 n 项，共 m 项"，选中项标注"已选中" |

## NavigationBar

| 项 | 规格 |
| --- | --- |
| 高度 | 内联 44 / 标准 56 / 大标题 96（含 34pt 标题） |
| 材质 | 滚动时透明，内容滚到栏下时切换为 `material.thin` |
| 大标题 | 滚动时收缩为内联标题，用 `motion.spring.gentle` |
| 左侧 | 返回（圆形玻璃底 32×32）/ 关闭 |
| 右侧 | 最多 2 个图标按钮，间距 8 |
| 无障碍 | 大标题作为 header 语义；返回按钮标注"返回"并附带来源页名 |

## BottomSheet

| 项 | 规格 |
| --- | --- |
| 圆角 | `radius.2xl`（顶部两角） |
| 把手 | 36×5，`radius.full`，`su.300`，距顶 8 |
| detents | 半屏 0.5 / 大 0.92；默认半屏 |
| 材质 | `material.thick` 头部 + 不透明内容区 |
| 手势 | 下滑关闭，速度阈值 500pt/s；内容可滚动时先滚内容 |
| 无障碍 | 出现时焦点进入，关闭后归还；支持"下滑关闭"辅助功能操作 |

## Switch

| 项 | 规格 |
| --- | --- |
| 尺寸 | 51×31（标准）/ 40×24（紧凑） |
| 轨道 | 关：浅色 `su.300` / 深色 `su.800`；开：`brand.600`（深色用 `brand.500`） |
| 滑块 | 白色 + `elevation.1`，直径 = 轨道高 − 4 |
| 开启态 | 轨道改用 `gradient.fill` + `elevation.brand` 彩色投影 |
| 动效 | 滑块 300ms `cubic-bezier(.2,1.5,.45,1)`，轨道颜色 260ms |
| 触觉 | 状态切换时轻触觉 |

## Checkbox（v0.2 改版）

从"圆角方块 + 勾"改成**渐变填充 + 描边式勾 + 光晕**，这是当前最现代的形态。

| 项 | 规格 |
| --- | --- |
| 尺寸 | 26×26（标准）/ 22×22（紧凑），触控热区 44×44 |
| 圆角 | `radius.checkbox` = 9（约 35%，接近 squircle，不要用圆形） |
| 未选 | 1.5pt 描边 `border.hairline-strong` + `fill.field` 半透明底 |
| 已选 | `gradient.fill` 填充，无描边，`elevation.brand` 彩色投影，顶部 1pt 内高光 |
| 勾 | 2.2pt 白色描边，**用描边画出**而不是图标，`rotate(42°)` |
| 动画 | 勾从 `scale(.3) + opacity 0` 弹到 1，260ms `cubic-bezier(.2,1.6,.5,1)`；填充与投影 220ms 同步 |
| 光晕 | 选中的瞬间在勾选框外扩散一圈 `brand` 42% → 透明的径向光晕，400ms，只播一次 |
| 半选 | 同已选底，勾换成 12×2.4 的白色横杠 |
| 按下 | 缩放至 0.90，触觉轻震 |
| 禁用 | 整体 40% 不透明度，保留当前勾选状态 |

平台实现提示：

- SwiftUI：`ToggleStyle` 或自定义 `ButtonStyle`，勾用 `Path` + `.trim(to:)` 驱动 `strokeEnd` 做描边动画。
- Compose：`Checkbox` 自定义 `TriStateCheckbox` 外观，勾用 `Canvas` + `drawPath` 配 `animateFloatAsState`。
- 系统差异：iOS 用 `Canvas` 自定义；Android 若要贴 M3，可退回圆角方块但保留渐变与动画。

## Chip

| 项 | 规格 |
| --- | --- |
| 高度 | 28（紧凑）/ 32（标准） |
| 圆角 | `radius.full` |
| 内距 | 水平 12（带图标时左右 10/14） |
| 选中 | 底 `brand.600`，文字白 |
| 未选 | 底 `fill.field`，文字 `text.secondary` |
| 删除 | 尾部 16pt × 图标，点击区域 28×28 |

## InlineBanner / Toast

| 项 | 规格 |
| --- | --- |
| Banner | 圆角 `radius.lg`，内距 12，左侧 20pt 状态图标，右侧可放关闭 |
| Banner 底色 | 对应状态的浅底（如 success → `#E0F0E8`），文字用对应 600 号色 |
| Toast | 玻璃胶囊，最小高度 44，底部距安全区 16，停留 3s（可交互时 5s） |
| 动效 | 进入 240ms `gentle` 上移淡入，退出 160ms 淡出 |
| 无障碍 | Toast 用 `aria-live="polite"`，错误信息用 `role="alert"` |

## Avatar

| 项 | 规格 |
| --- | --- |
| 尺寸 | 20 / 28 / 32 / 40 / 56 / 72 |
| 形态 | 圆形 |
| 文字头像 | 取名字首字，底为品牌色 12–20% 透明度，文字为对应 600 号色 |
| 描边 | 白色 2pt（用于堆叠与深色背景） |
| 堆叠 | 重叠 30% 直径，最多 4 个，超出显示 `+n` |
| 状态 | 在线点 8pt，右下角，白色描边 2pt |

## Progress（含 StreakRing）

| 项 | 规格 |
| --- | --- |
| 线性 | 高 6，轨道 `fill.field`，进度 `gradient.brand`，圆角 `radius.full` |
| 环形 | 线宽 6–10，起点 12 点方向，顺时针，`conic-gradient` 或 `stroke-dashoffset` |
| 数值 | 环内用 `title2` 等宽数字 |
| 动画 | 3200ms `easeOutCubic` 增长，数字与之同步；不要用线性，也不要做无限循环 |
| 完成态 | 环变为 `gradient.brand`，触发一次 `spring.bouncy` 缩放 + 成功触觉 |
| 无障碍 | 读作"已完成 3 项，共 5 项，60%" |
