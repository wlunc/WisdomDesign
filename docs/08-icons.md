# 08 · 图标规范

> 图标是界面里最容易被随手加、也最容易失控的元素。这份文档管两件事：
> **一个图标该怎么画与怎么用**，以及**新增一个图标要走什么流程**。

## 1. 来源

两端各用各家的图标库，靠**语义名称**对照，不逐像素对齐。

| 平台 | 图标库 | 说明 |
| --- | --- | --- |
| iOS | SF Symbols | 优先 `.rounded` 变体——圆润的笔画更贴"温和"的基调 |
| Android | Material Symbols Rounded | 必须用 Rounded 变体，不用 Outlined / Filled 混搭 |

**不引入第三方图标库**。两家的系统图标在笔画粗细、视觉重量上已经对齐，
混入第三方会让界面的"手感"不统一。

---

## 2. 尺寸与线宽

| 档 | 尺寸 | 线宽 | 用在哪 |
| --- | --- | --- | --- |
| `sm` | 16 | 1.6 | 行内文字旁、尾部、徽标 |
| `md` | 20 | 1.8 | 表单前缀、列表、工具栏 |
| `lg` | 24 | 2 | 导航栏、标签栏、按钮 |
| `xl` | 28 | 2.2 | 强调、空状态 |

规则：

- **同一层级内不混用档位**。一个列表里要么全 20，要么全 24
- 放大图标时线宽同步加粗，否则会显得虚——`sm → xl` 线宽从 1.6 到 2.2
- 图标尺寸锁死，**不随动态字体放大**（见 [`06-accessibility.md`](06-accessibility.md) §4.2）

### 2.1 图标底座

需要强调时给图标加底座，而不是把图标本身放大。

| 底座 | 尺寸 | 圆角 | 背景 | 图标 |
| --- | --- | --- | --- | --- |
| 浅底座（默认） | 34×34 | `radius.sm` 10 | `gradient.surface` | `text.on-soft` |
| 深底座 | 34×34 | `radius.sm` 10 | `gradient.mid` | 白 |
| 大底座 | 40×40 | `radius.lg` 18 | `gradient.surface` | `text.on-soft` |
| 圆形底座 | 56×56 | `radius.full` | `gradient.surface` | `text.on-soft`，图标 26 |

底座内的图标尺寸固定为 18（大底座 20，圆形底座 26）。

---

## 3. 颜色

| 场景 | 颜色 |
| --- | --- |
| 普通图标 | `text.primary` |
| 次要图标（尾部、占位） | `text.tertiary` |
| 品牌动作图标 | `text.brand` |
| 选中态（标签栏） | `text.brand` + 文字加粗 |
| 语义图标 | 对应 `status.*` |
| 禁用 | 所在元素整体 40%，图标不单独降透明度 |

图标与背景对比度 ≥ 3:1。**任何状态都不只用颜色区分图标含义**，形状必须不同（见 §7）。

---

## 4. 语义对照表

新增图标按下表的格式登记，两端名称必须同时补齐。

### 导航

| 语义 | SF Symbols | Material Symbols |
| --- | --- | --- |
| 首页 | `house.fill` | `home` |
| 日历 | `calendar` | `calendar_month` |
| 家庭 / 成员 | `person.2.fill` | `group` |
| 我的 | `person.fill` | `person` |
| 返回 | `chevron.left` | `arrow_back` |
| 关闭 | `xmark` | `close` |
| 更多 | `ellipsis` | `more_horiz` |

### 操作

| 语义 | SF Symbols | Material Symbols |
| --- | --- | --- |
| 新增 | `plus` | `add` |
| 编辑 | `pencil` | `edit` |
| 删除 | `trash` | `delete` |
| 分享 | `square.and.arrow.up` | `share` |
| 搜索 | `magnifyingglass` | `search` |
| 筛选 | `line.3.horizontal.decrease` | `filter_list` |
| 排序 | `arrow.up.arrow.down` | `swap_vert` |
| 复制 | `doc.on.doc` | `content_copy` |
| 撤销 | `arrow.uturn.backward` | `undo` |
| 重做 | `arrow.uturn.forward` | `redo` |
| 进入下一级 | `chevron.right` | `chevron_right` |
| 展开 | `chevron.down` | `expand_more` |

### 状态

| 语义 | SF Symbols | Material Symbols |
| --- | --- | --- |
| 已完成 | `checkmark.circle.fill` | `check_circle` |
| 未完成 | `circle` | `radio_button_unchecked` |
| 已逾期 | `exclamationmark.circle.fill` | `error` |
| 提醒 | `bell.fill` | `notifications` |
| 免打扰 | `bell.slash.fill` | `notifications_off` |
| 进行中 | `clock` | `schedule` |
| 已同步 | `arrow.triangle.2.circlepath` | `sync` |
| 离线 | `wifi.slash` | `wifi_off` |

### 表单

| 语义 | SF Symbols | Material Symbols |
| --- | --- | --- |
| 清除 | `xmark.circle.fill` | `cancel` |
| 显示密码 | `eye` | `visibility` |
| 隐藏密码 | `eye.slash` | `visibility_off` |
| 日期 | `calendar` | `calendar_month` |
| 时间 | `clock` | `schedule` |
| 未指派 | `person.crop.circle.badge.xmark` | `person_off` |

### 内容分类

| 语义 | SF Symbols | Material Symbols |
| --- | --- | --- |
| 任务 | `list.bullet` | `checklist` |
| 家务 | `sparkles` | `auto_awesome` |
| 采购 | `basket` | `shopping_basket` |
| 餐饮 | `fork.knife` | `restaurant` |
| 出行 | `car.fill` | `directions_car` |
| 健康 | `heart.fill` | `favorite` |
| 学习 | `book.fill` | `menu_book` |
| 宠物 | `pawprint.fill` | `pets` |
| 植物 | `leaf.fill` | `eco` |
| 账单 | `creditcard.fill` | `credit_card` |
| 照片 | `photo` | `photo` |

---

## 5. 新增一个图标的流程

**缺一端视为未完成**，不允许只加 iOS 或只加 Android。

1. 先在 §4 找有没有语义相同的——**同义不同图是最常见的冗余**
2. 两端各找到语义最接近的图标，截图并排比对视觉重量（笔画粗细、留白、圆角）
3. 视觉重量差太多时，宁可换一组更接近的，也不要强行配对
4. 按 §4 的格式登记进表格
5. 在画廊的 Icon 一节里补上样例（浅深两外观）
6. 检查三件事：在 16 / 20 / 24 / 28 四个尺寸下是否都清晰；有无文字时是否都可辨识；与已有图标是否容易混淆

### 视觉重量对照

两端图标"看起来一样重"的判定标准：

| 项 | 判定 |
| --- | --- |
| 外框占比 | 图标内容占画布的比例相差不超过 10% |
| 笔画粗细 | 在 24 尺寸下，视觉线宽相差不超过 0.3pt |
| 留白 | 视觉重心居中，不偏向某一侧 |

---

## 6. 用法规则

| 规则 | 说明 |
| --- | --- |
| 图标不单独承载操作 | 必须包在 `WDIconButton` 里，且带无障碍标签 |
| 图标不单独承载信息 | 状态必须同时有文字或形状差异 |
| 标签栏不用纯图标 | 首次使用的用户认不出，必须配文字 |
| 同一动作在全 App 用同一图标 | 删除就是 `trash`，不要在另一处用 `xmark` |
| 图标与文字间距 `space.3` | 8pt，不靠空格对齐 |
| 图标与容器边缘 ≥ `space.3` | 8pt |

---

## 7. 禁止用法

| 不要 | 原因 |
| --- | --- |
| 用颜色区分同一图标的两个含义 | 色盲用户无法区分 |
| 把图标拉伸出非等比尺寸 | 笔画粗细会变形 |
| 给图标加描边、阴影、渐变 | 系统图标是纯色笔画风格，加效果立刻廉价 |
| 自己画图标 | 除非系统图标库里确实没有，且需要双端同时新建 |
| 同一屏混用 Filled 与 Outlined | 视觉重量不一致 |
| 用图标替代文字标签 | 家庭场景里有老人和孩子 |
| 旋转图标表示状态变化 | 会让界面显得不安定 |

---

## 8. 验收清单

- [ ] 同一层级内图标尺寸统一，没有 20 与 24 混用
- [ ] 每个图标在 16 / 20 / 24 / 28 四个尺寸下都清晰
- [ ] 图标线宽随尺寸同步变化，没有"大而虚"的图标
- [ ] 新增图标两端都已登记，没有只做一端
- [ ] §4 表格里没有语义重复的两行
- [ ] 所有可点图标都在按钮内，且带无障碍标签
- [ ] 标签栏每个项目都有文字，不是纯图标
- [ ] 状态类图标靠形状区分，不只靠颜色
- [ ] 图标与相邻内容间距 ≥ 8pt
- [ ] 全 App 内同一动作使用同一图标
- [ ] 没有被拉伸、加描边或加阴影的图标
- [ ] 深浅两外观下图标对比度均 ≥ 3:1

---

← 返回：[设计基础](01-foundation.md) ｜ [无障碍规范](06-accessibility.md) ｜ [组件规格索引](specs/README.md)
