<!-- GENERATED FILE - DO NOT EDIT. -->
<!-- Source: wisdomdesign design truth sources via tools/ai-skill/lib/extract-design.rb. -->
<!-- Regenerate with: ruby tools/ai-skill/lib/extract-design.rb | node tools/ai-skill/lib/generate-core-catalog.js --out <dir> -->
<!-- No platform API claims are included. -->

# Wisdom Design 组件目录

用途与反例来自正式 specs §1，参数与槽位来自 contracts YAML；平台 API 不在本目录。

| ID | 用途摘要 | 检索关键词 | 来源 |
| --- | --- | --- | --- |
| `WDActionSheet` | 从一组操作里选一个，且这组操作**与当前位置强相关**。 | - | `docs/specs/02-advanced.md:653` |
| `WDAlert` | 需要用户**立刻做决定**，且决定之前不能继续往下走。 | - | `docs/specs/02-advanced.md:430` |
| `WDAssigneePicker` | 在一组人里指派负责人。 | - | `docs/specs/03-patterns.md:379` |
| `WDAvatar` | 代表一个人。在家庭协作场景里，头像是"这是谁的"最省空间的答案。 | - | `docs/specs/01-basic.md:1115` |
| `WDAvatarStack` | 一眼看出"有多少人参与"。用于卡片头部、任务归属、共享状态。 | - | `docs/specs/01-basic.md:1222` |
| `WDBadge` | 状态与计数的紧凑表达。**徽标不单独承载信息**，必须依附在主体上。 | - | `docs/specs/01-basic.md:1031` |
| `WDBanner` | **常驻**的页面级提示。需要用户看到、可能需要处理，但不阻断当前操作。 | - | `docs/specs/02-advanced.md:858` |
| `WDBottomSheet` | 承接次级内容或表单，**不离开当前上下文**。 | - | `docs/specs/02-advanced.md:542` |
| `WDButton` | 触发一个动作。是界面上唯一"会让事情发生"的基础组件。 | - | `docs/specs/01-basic.md:13` |
| `WDCard` | 把一组相关内容圈在一起。**卡片是分组手段，不是装饰**。 | - | `docs/specs/01-basic.md:1557` |
| `WDCheckbox` | 多选，以及任务清单里的"完成"。 | - | `docs/specs/01-basic.md:547` |
| `WDChip` | 轻量标记与筛选。三种用法语义不同，**不要混在同一行**。 | - | `docs/specs/01-basic.md:935` |
| `WDDatePicker` | 选日期、时间或时间范围。 | - | `docs/specs/02-advanced.md:225` |
| `WDDivider` | 分隔。**这是最后手段**——能用间距表达的，不要画线。 | - | `docs/specs/01-basic.md:1304` |
| `WDEmptyState` | 没有内容时，说明**为什么没有**以及**接下来能做什么**。 | - | `docs/specs/02-advanced.md:958` |
| `WDFAB` | 页面的**主操作**，悬浮在内容之上，滚动时保持可达。 | - | `docs/specs/02-advanced.md:1576` |
| `WDFormRow` | 表单里的一行：一个标签配一个控件。**它定义的是排布与对齐，不是控件本身**。 | - | `docs/specs/02-advanced.md:331` |
| `WDIcon` | 表达概念或状态的最小图形单位。**图标不单独承载操作**。 | - | `docs/specs/01-basic.md:1894` |
| `WDIconButton` | 纯图标的单一动作。空间紧张或动作含义无歧义时使用。 | - | `docs/specs/01-basic.md:143` |
| `WDListRow` | 列表里的一行。承载"一条记录 + 一个动作"。 | - | `docs/specs/01-basic.md:1692` |
| `WDListSection` | 把列表项分组。**分组的边界靠间距和标题，不靠分割线**。 | - | `docs/specs/01-basic.md:1802` |
| `WDNavigationBar` | 页面级导航容器：告诉用户"这是哪"，并提供返回与页面级操作。 | - | `docs/specs/02-advanced.md:1247` |
| `WDPicker` | 从 **5 个以上**的选项里选一个。 | - | `docs/specs/02-advanced.md:120` |
| `WDProgressBar` | 线性进度。任务完成度、上传下载、多步骤流程。 | - | `docs/specs/01-basic.md:1371` |
| `WDProgressRing` | 环形进度。用于**需要强调的单一指标**，因为环比线占用更多视觉重量。 | - | `docs/specs/01-basic.md:1465` |
| `WDPullRefresh` | 用户主动请求刷新。**只用于内容会变化且用户有刷新动机的列表**。 | - | `docs/specs/02-advanced.md:1140` |
| `WDRadio` | 在一组互斥选项里选一个，且**选中即生效**。 | - | `docs/specs/01-basic.md:656` |
| `WDSearchField` | 在一个已知集合里查找。**搜索的对象是已知的，筛选的对象是未知的**——这是它和 Chip 的分界。 | 搜索框, 查询输入, filter input | `docs/specs/01-basic.md:336` |
| `WDSegmentedControl` | 2–5 个互斥选项之间切换，**切换即时生效，内容在同一页面内替换**。 | - | `docs/specs/02-advanced.md:13` |
| `WDSkeleton` | 内容加载中的占位，**保持布局稳定**，避免内容出现时页面跳动。 | - | `docs/specs/02-advanced.md:1055` |
| `WDSlider` | 在连续或较大范围里取值，且**具体数值不如大致位置重要**。 | - | `docs/specs/01-basic.md:747` |
| `WDStepper` | 小范围整数增减，取值精度比 Slider 高、输入成本比 TextField 低。 | - | `docs/specs/01-basic.md:844` |
| `WDSwitch` | **即时生效**的布尔开关。拨动即写入，没有确认按钮。 | - | `docs/specs/01-basic.md:444` |
| `WDTabBar` | 顶层导航。在互不隶属的几个主区域之间切换。 | - | `docs/specs/02-advanced.md:1356` |
| `WDTextField` | 单行文本输入。 | - | `docs/specs/01-basic.md:223` |
| `WDToast` | **非阻塞**的轻提示，告知"刚刚发生了一件事"。 | - | `docs/specs/02-advanced.md:754` |
| `WDToolbar` | 与**当前上下文**相关的一组操作。和 TabBar 的区别是：TabBar 切换区域，Toolbar 操作当前内容。 | - | `docs/specs/02-advanced.md:1452` |

Count: 37 formal components; R1-R5 recipes are excluded.
