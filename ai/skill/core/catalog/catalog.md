<!-- GENERATED FILE - DO NOT EDIT. -->
<!-- Source: wisdomdesign design truth sources via tools/ai-skill/lib/extract-design.js. -->
<!-- Regenerate with: node tools/ai-skill/lib/extract-design.js | node tools/ai-skill/lib/generate-core-catalog.js --out <dir> -->
<!-- No platform API claims are included. -->

# Wisdom Design 组件目录

用途与反例来自正式 specs §1，参数与槽位来自 contracts YAML；平台 API 不在本目录。

| ID | 用途摘要 | 检索关键词 | 来源 |
| --- | --- | --- | --- |
| `WDActionSheet` | 从一组操作里选一个，且这组操作**与当前位置强相关**。 | 操作表, 操作菜单, 更多操作, 长按菜单, action sheet | `docs/specs/02-advanced.md:653` |
| `WDAlert` | 需要用户**立刻做决定**，且决定之前不能继续往下走。 | 弹窗, 对话框, 警告, 确认弹窗, alert, dialog | `docs/specs/02-advanced.md:430` |
| `WDAssigneePicker` | 在一组人里指派负责人。 | 负责人, 指派, 选择成员, 分配, assignee | `docs/specs/03-patterns.md:379` |
| `WDAvatar` | 代表一个人。在家庭协作场景里，头像是"这是谁的"最省空间的答案。 | 头像, 成员头像, 用户头像, avatar | `docs/specs/01-basic.md:1115` |
| `WDAvatarStack` | 一眼看出"有多少人参与"。用于卡片头部、任务归属、共享状态。 | 头像组, 头像叠加, 参与者头像, avatar stack | `docs/specs/01-basic.md:1222` |
| `WDBadge` | 状态与计数的紧凑表达。**徽标不单独承载信息**，必须依附在主体上。 | 徽标, 角标, 计数, 未读数, badge | `docs/specs/01-basic.md:1031` |
| `WDBanner` | **常驻**的页面级提示。需要用户看到、可能需要处理，但不阻断当前操作。 | 横幅, 通知条, 常驻提示, banner | `docs/specs/02-advanced.md:858` |
| `WDBottomSheet` | 承接次级内容或表单，**不离开当前上下文**。 | 底部弹层, 半屏面板, 抽屉, bottom sheet | `docs/specs/02-advanced.md:542` |
| `WDButton` | 触发一个动作。是界面上唯一"会让事情发生"的基础组件。 | 按钮, 主按钮, 操作按钮, 提交按钮, button | `docs/specs/01-basic.md:13` |
| `WDCard` | 把一组相关内容圈在一起。**卡片是分组手段，不是装饰**。 | 卡片, 内容卡, 分组容器, card | `docs/specs/01-basic.md:1557` |
| `WDCheckbox` | 多选，以及任务清单里的"完成"。 | 复选框, 勾选框, 多选, 完成任务, checkbox | `docs/specs/01-basic.md:547` |
| `WDChip` | 轻量标记与筛选。三种用法语义不同，**不要混在同一行**。 | 标签, 胶囊, 筛选标签, 过滤, chip | `docs/specs/01-basic.md:935` |
| `WDDatePicker` | 选日期、时间或时间范围。 | 日期选择, 日历, 时间选择, 选日期, date picker | `docs/specs/02-advanced.md:225` |
| `WDDivider` | 分隔。**这是最后手段**——能用间距表达的，不要画线。 | 分割线, 分隔线, 横线, divider | `docs/specs/01-basic.md:1304` |
| `WDEmptyState` | 没有内容时，说明**为什么没有**以及**接下来能做什么**。 | 空状态, 空页面, 无内容, 空列表, empty state | `docs/specs/02-advanced.md:958` |
| `WDFAB` | 页面的**主操作**，悬浮在内容之上，滚动时保持可达。 | 悬浮按钮, 主操作按钮, floating action | `docs/specs/02-advanced.md:1576` |
| `WDFormRow` | 表单里的一行：一个标签配一个控件。**它定义的是排布与对齐，不是控件本身**。 | 表单行, 设置行, 表单项, form row | `docs/specs/02-advanced.md:331` |
| `WDIcon` | 表达概念或状态的最小图形单位。**图标不单独承载操作**。 | 图标, 图形符号, icon | `docs/specs/01-basic.md:1894` |
| `WDIconButton` | 纯图标的单一动作。空间紧张或动作含义无歧义时使用。 | 图标按钮, 纯图标按钮, icon button | `docs/specs/01-basic.md:143` |
| `WDListRow` | 列表里的一行。承载"一条记录 + 一个动作"。 | 列表行, 列表项, 条目, list row | `docs/specs/01-basic.md:1692` |
| `WDListSection` | 把列表项分组。**分组的边界靠间距和标题，不靠分割线**。 | 列表分组, 列表区, 分组列表, list section | `docs/specs/01-basic.md:1802` |
| `WDNavigationBar` | 页面级导航容器：告诉用户"这是哪"，并提供返回与页面级操作。 | 导航栏, 顶部栏, 标题栏, 返回栏, navigation bar | `docs/specs/02-advanced.md:1247` |
| `WDPicker` | 从 **5 个以上**的选项里选一个。 | 选择器, 滚轮选择, 下拉选择, picker | `docs/specs/02-advanced.md:120` |
| `WDProgressBar` | 线性进度。任务完成度、上传下载、多步骤流程。 | 进度条, 线性进度, progress bar | `docs/specs/01-basic.md:1371` |
| `WDProgressRing` | 环形进度。用于**需要强调的单一指标**，因为环比线占用更多视觉重量。 | 进度环, 环形进度, 圆环, progress ring | `docs/specs/01-basic.md:1465` |
| `WDPullRefresh` | 用户主动请求刷新。**只用于内容会变化且用户有刷新动机的列表**。 | 下拉刷新, 刷新, pull refresh | `docs/specs/02-advanced.md:1140` |
| `WDRadio` | 在一组互斥选项里选一个，且**选中即生效**。 | 单选框, 单选, 互斥选项, radio | `docs/specs/01-basic.md:656` |
| `WDSearchField` | 在一个已知集合里查找。**搜索的对象是已知的，筛选的对象是未知的**——这是它和 Chip 的分界。 | 搜索框, 查询输入, 搜索, filter input, search | `docs/specs/01-basic.md:336` |
| `WDSegmentedControl` | 2–5 个互斥选项之间切换，**切换即时生效，内容在同一页面内替换**。 | 分段控件, 分段, 视图切换, segmented control | `docs/specs/02-advanced.md:13` |
| `WDSkeleton` | 内容加载中的占位，**保持布局稳定**，避免内容出现时页面跳动。 | 骨架屏, 占位, 加载占位, skeleton | `docs/specs/02-advanced.md:1055` |
| `WDSlider` | 在连续或较大范围里取值，且**具体数值不如大致位置重要**。 | 滑块, 拖动条, 拖动取值, slider | `docs/specs/01-basic.md:747` |
| `WDStepper` | 小范围整数增减，取值精度比 Slider 高、输入成本比 TextField 低。 | 步进器, 数量增减, 加减, stepper | `docs/specs/01-basic.md:844` |
| `WDSwitch` | **即时生效**的布尔开关。拨动即写入，没有确认按钮。 | 开关, 拨动开关, toggle, switch | `docs/specs/01-basic.md:444` |
| `WDTabBar` | 顶层导航。在互不隶属的几个主区域之间切换。 | 标签栏, 底部导航, 底部标签, tab bar | `docs/specs/02-advanced.md:1356` |
| `WDTextField` | 单行文本输入。 | 输入框, 文本输入, 文本框, 输入, text field | `docs/specs/01-basic.md:223` |
| `WDToast` | **非阻塞**的轻提示，告知"刚刚发生了一件事"。 | 轻提示, 提示条, 短暂提示, toast | `docs/specs/02-advanced.md:754` |
| `WDToolbar` | 与**当前上下文**相关的一组操作。和 TabBar 的区别是：TabBar 切换区域，Toolbar 操作当前内容。 | 工具栏, 操作栏, 底部操作栏, toolbar | `docs/specs/02-advanced.md:1452` |

Count: 37 formal components; R1-R5 recipes are excluded.
