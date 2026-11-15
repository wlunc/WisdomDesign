# 契约真源（`contracts/*.yaml`）

> 状态：**M0-5 补齐**（2026-11-15 落库）。本目录 37 个 yaml 是三键契约（`params` / `slots` / `default`）+ `enums` 的唯一真源；本文件说明 schema、重载语义、注册表、槽位词表、变更流程与校验方式。
> 适用：设计仓 WisdomDesign；iOS / Android 仓按只读副本执行。

## 1. 目的与效力

- **真源**：每个组件一个 YAML，登记参数并集、槽位、既有 `init` 的语义默认与枚举全量 case。机器可读，供两端生成、比对与冻结。
- **效力**：`contracts/*.yaml` **高于** `iOS/docs/**`、`android/docs/**` 中的副本与冻结文档。副本只读；发现冲突时**先改 yaml，再同步副本**，不得在副本中先改。
- **与 C-15 的关系**：`params[].name` = C-15 canonical 名（受控值不带 is）；`params[].ios` = iOS 形参名。iOS 侧仅 #06 `WDCheckbox` 一处名词改名：契约 `checked` ↔ iOS `isChecked`；其余 36 行一致。C-15 权威副本见 iOS `DEV-PLAN.md` §5.3。
- **iOS 副本位置**：`iOS/docs/SPEC.md` §2.10（37 组件矩阵）与 §2.11；`DEV-PLAN.md` §5.3（C-15）、§8.1（槽位 vs 参数边界）；各 `M*-SIGNATURE-FREEZE.md`、`B*-CONTRACT-CHANGE-REQUEST.md` 记录当时签名与增量。
- **Android 副本位置**：`android/docs/SPEC.md` §2.10。
- **同目录非契约文件**：`icons.json`（44 条图标语义名）、`contrast.json`（对比度门槛/样本）以及审计报告 `CROSS-END-SYNC.md` 不属于本 schema，本文件不描述其字段。
- **不负责**：令牌值（tokens/）、视觉实现细节、组件内部状态机；这些以令牌真源与规格为准。

## 2. 文件格式（schema）

一个文件一个组件，文件名必须等于 `component`。最小骨架：

```yaml
component: WDExample
params:
  - name: presented        # canonical（C-15）
    ios: isPresented       # iOS 形参名
    type: "Binding<Bool>"
  - name: title
    ios: title
    type: "Text?"
    default: null
slots: [title]             # 无槽位时写 无
default:
  title: null
enums:
  WDExampleStyle: [plain, glass]
```

| 键 | 必填 | 类型 | 约定 |
| --- | --- | --- | --- |
| `component` | 是 | 字符串 | WD 前缀；全局唯一；与文件名（去掉 `.yaml`）逐字相同 |
| `params` | 是 | 数组 | **重载并集**；顺序 = 主/既有 `init` 在前，增量随后 |
| `params[].name` | 是 | 字符串 | C-15 canonical 名；YAML 1.1 保留字（如 `on`）必须加引号 |
| `params[].ios` | 是 | 字符串 | iOS 形参名，可与 name 不同（is 前缀或名词差异） |
| `params[].type` | 是 | 字符串 | Swift 形参类型原文：Text?、Binding<…>、[Element]、闭包、泛型 |
| `params[].default` | 否 | 标量/数组/对象 | 只登记**语义默认**；`null` 表示默认 nil；缺省 = 无默认值 |
| `slots` | 是 | 数组或 `无` | 只能取 §6 的 21 名；无槽位写 `无`，不得省略或写 `[]` |
| `default` | 否 | 映射 | 主/既有 `init` 的默认值集合；缺项 = 该参数无默认。键通常用 **iOS 形参名** |
| `enums` | 否 | 映射 | 枚举名 → 全量 case；无枚举写 `{}` |

写法约定：

- 可空用 `?`（`Text?`、`WDIconName?`、`(() -> Void)?`）；受控值用 `Binding<Bool>`。
- 数组 `[WDAlertAction]`；范围 `Binding<ClosedRange<Date>?>`；集合 `Set<Item.ID>`。
- 枚举**定义**里 case 不带点（`[filled, tonal]`）；**默认值**里带点（`default: .filled`）。带关联值的 case 用 Swift 记法：`fixed(WDBottomSheetDetent)`、`delete(title:onDelete:)`。
- 空数组写 `[]`，空映射写 `{}`；数值/区间原样（`0...1`、`3000`）。
- 默认值为对象时允许点路径（现有特例：`WDTextField` 的 `appearance.variant` 等）。
- `slots` 是**语义名**，不要求等于参数名（见 §6）。
- 注释用 #；增量与重载说明必须写行内注释（见 §3）。

## 3. 重载约定（B1–B6 的模型限制）

Swift 的多个 `init` 在编译期分离，而 YAML 只有一份 `params`，因此：

1. **`params` 是重载并集**，不是某一个 `init` 的完整签名。读单个 `init` 时必须结合行内注释与冻结文档。
2. **`default` 表示既有/主 `init` 的语义默认**，**不是**"所有参数在所有重载里都可省略"。例如 `WDAvatar.size` 的 `.md` 只说明 `init(value:)` 等价于 `size: .md`；新重载 `init(value:size:isOnline:isDisabled:)` 的 `size` 仍必填。
3. **新增重载的必填参数**：保留其在既有 `init` 中的语义默认（便于机器比对），并在 `name` 行注释"仅 `init(...)` 必填"；若该参数只在新增重载出现且无既有默认，则不写 `default`，注释写"无默认（overload）"。
4. **禁止**为了表达"重载必填"而删掉语义默认，或为了"看起来可省略"而编造默认值。
5. **同名不同型**的重载必须登记（例：`WDAssigneePicker.selection` 单选 `Binding<String?>`，多选重载为 `Binding<Set<String>>`）。
6. **互斥族**必须注明（例：`WDProgressBar` 的 `value` 与 `segments`/`completed`；`WDDatePicker` 的 `date` 与 `range`）。

| 组件 | 参数 | 登记的默认 | YAML 行内注释的含义 |
| --- | --- | --- | --- |
| `WDAvatar` | size | `.md` | 仅 `init(value:size:isOnline:isDisabled:)` 必填；既有 `init(value:)` 的语义默认 |
| `WDBadge` | variant | `.shared` | 仅 `init(label:variant:)` 必填；既有 `init` 无 variant |
| `WDDivider` | style | `.full` | 仅 `init(style:)`；既有 `init()` 仍为 `.full` |
| `WDDatePicker` | range | `null` | 仅范围重载；与 date 互斥 |
| `WDSwitch` | `description` / `size` | `null` / `.standard` | 既有 `init(isOn:label:)` 等价于 size = `.standard`、description = nil |
| `WDAlert` | content | 无 | 仅第二个重载提供；无默认（overload） |
| `WDListSection` | footer | 注解 | Footer == EmptyView 的重载 |
| `WDAssigneePicker` | selection | — | 单选/多选两个重载同名不同型 |

实现者读取顺序：① 看 `params` 并集；② 用注释/冻结文档切分重载；③ 用 `default` 判断既有 `init` 的等价默认；④ **不要仅凭 `default` 推断调用点可省略**。

## 4. 组件注册表（37）

共 **37** 个组件 / 37 个 YAML（1:1，文件名 = 组件名）；`params` 合计 **183** 条，槽位引用 69 处，无槽位组件 2 个（`WDDivider`、`WDSkeleton`）。排序 = 批次 + 字母。

| 批次 | 组件 | 契约文件 | `params` 数 | 槽位 | 枚举数 |
| --- | --- | --- | --- | --- | --- |
| M2 | `WDAvatar` | [`WDAvatar.yaml`](WDAvatar.yaml) | 4 | `icon`、`label` | 1 |
| M2 | `WDBadge` | [`WDBadge.yaml`](WDBadge.yaml) | 3 | `label` | 1 |
| M2 | `WDButton` | [`WDButton.yaml`](WDButton.yaml) | 8 | `label`、`leadingIcon`、`trailingIcon` | 2 |
| M2 | `WDCard` | [`WDCard.yaml`](WDCard.yaml) | 2 | `content` | 1 |
| M2 | `WDCheckbox` | [`WDCheckbox.yaml`](WDCheckbox.yaml) | 3 | `label` | 0 |
| M2 | `WDDivider` | [`WDDivider.yaml`](WDDivider.yaml) | 1 | **无** | 1 |
| M2 | `WDIcon` | [`WDIcon.yaml`](WDIcon.yaml) | 2 | `icon` | 1 |
| M2 | `WDIconButton` | [`WDIconButton.yaml`](WDIconButton.yaml) | 6 | `icon` | 2 |
| M2 | `WDListRow` | [`WDListRow.yaml`](WDListRow.yaml) | 8 | `title`、`subtitle`、`leading`、`trailing` | 3 |
| M2 | `WDSwitch` | [`WDSwitch.yaml`](WDSwitch.yaml) | 4 | `label` | 1 |
| M2 | `WDTextField` | [`WDTextField.yaml`](WDTextField.yaml) | 6 | `label`、`prefix`、`accessory`、`helper` | 4 |
| M3 | `WDListSection` | [`WDListSection.yaml`](WDListSection.yaml) | 6 | `header`、`items`、`footer` | 0 |
| M4 | `WDActionSheet` | [`WDActionSheet.yaml`](WDActionSheet.yaml) | 6 | `title`、`message`、`items` | 1 |
| M4 | `WDAlert` | [`WDAlert.yaml`](WDAlert.yaml) | 6 | `title`、`message`、`actions` | 1 |
| M4 | `WDBanner` | [`WDBanner.yaml`](WDBanner.yaml) | 5 | `message`、`actions` | 1 |
| M4 | `WDBottomSheet` | [`WDBottomSheet.yaml`](WDBottomSheet.yaml) | 10 | `title`、`content`、`footer` | 2 |
| M4 | `WDEmptyState` | [`WDEmptyState.yaml`](WDEmptyState.yaml) | 4 | `icon`、`title`、`message`、`actions` | 0 |
| M4 | `WDProgressBar` | [`WDProgressBar.yaml`](WDProgressBar.yaml) | 5 | `label`、`valueText` | 0 |
| M4 | `WDProgressRing` | [`WDProgressRing.yaml`](WDProgressRing.yaml) | 4 | `label`、`valueText` | 1 |
| M4 | `WDSkeleton` | [`WDSkeleton.yaml`](WDSkeleton.yaml) | 3 | **无** | 1 |
| M4 | `WDToast` | [`WDToast.yaml`](WDToast.yaml) | 6 | `message`、`actions` | 1 |
| M5 | `WDAvatarStack` | [`WDAvatarStack.yaml`](WDAvatarStack.yaml) | 3 | `items` | 1 |
| M5 | `WDChip` | [`WDChip.yaml`](WDChip.yaml) | 6 | `label`、`leadingIcon` | 1 |
| M5 | `WDDatePicker` | [`WDDatePicker.yaml`](WDDatePicker.yaml) | 9 | `label` | 1 |
| M5 | `WDFAB` | [`WDFAB.yaml`](WDFAB.yaml) | 6 | `icon`、`label` | 2 |
| M5 | `WDFormRow` | [`WDFormRow.yaml`](WDFormRow.yaml) | 6 | `label`、`control` | 1 |
| M5 | `WDNavigationBar` | [`WDNavigationBar.yaml`](WDNavigationBar.yaml) | 6 | `title`、`leading`、`trailing` | 2 |
| M5 | `WDPicker` | [`WDPicker.yaml`](WDPicker.yaml) | 5 | `label`、`options` | 1 |
| M5 | `WDPullRefresh` | [`WDPullRefresh.yaml`](WDPullRefresh.yaml) | 3 | `label` | 0 |
| M5 | `WDRadio` | [`WDRadio.yaml`](WDRadio.yaml) | 3 | `label`、`options` | 0 |
| M5 | `WDSearchField` | [`WDSearchField.yaml`](WDSearchField.yaml) | 7 | `placeholder`、`leadingIcon`、`label` | 0 |
| M5 | `WDSegmentedControl` | [`WDSegmentedControl.yaml`](WDSegmentedControl.yaml) | 3 | `items` | 1 |
| M5 | `WDSlider` | [`WDSlider.yaml`](WDSlider.yaml) | 5 | `label` | 0 |
| M5 | `WDStepper` | [`WDStepper.yaml`](WDStepper.yaml) | 6 | `label` | 1 |
| M5 | `WDTabBar` | [`WDTabBar.yaml`](WDTabBar.yaml) | 2 | `items` | 0 |
| M5 | `WDToolbar` | [`WDToolbar.yaml`](WDToolbar.yaml) | 3 | `items` | 0 |
| M6 | `WDAssigneePicker` | [`WDAssigneePicker.yaml`](WDAssigneePicker.yaml) | 8 | `items`、`label` | 1 |

> 类型名清单即上表 37 条；呈现家族另含 `WDBottomSheetDetent` / `WDBottomSheetDetents`（见 §5 枚举表）。**不得出现 `WDSheet*`**——`WDBottomSheet` / `WDActionSheet` 是唯一名。
> `params` 数是重载并集，不等于任一 `init` 的参数个数。

## 5. 枚举注册表（36）

由 Ruby `YAML.load_file` 读取全部 37 个 YAML 的 `enums` 段生成（2026-11-15）。共 **36 个唯一枚举名 / 37 次定义 / 116 条 case 行**（`WDButtonSize` 定义两次，去重后 113 条 case）。`enums` 段出现 37 次是因为 `WDButtonSize` 在 `WDButton.yaml` 与 `WDIconButton.yaml` 各登记一次，case 与顺序完全一致。

| 枚举名 | 全量 case | 所属组件 |
| --- | --- | --- |
| `WDActionSheetItem.Role` | `default`、`destructive`、`cancel` | `WDActionSheet` |
| `WDAlertAction.Role` | `default`、`cancel`、`destructive` | `WDAlert` |
| `WDAssigneePickerSize` | `standard`、`compact` | `WDAssigneePicker` |
| `WDAvatarSize` | `xs`、`sm`、`md`、`lg`、`xl` | `WDAvatar` |
| `WDAvatarStackSize` | `sm`、`md` | `WDAvatarStack` |
| `WDBadgeVariant` | `shared`、`schedule`、`pending`、`success`、`warning`、`danger` | `WDBadge` |
| `WDBannerVariant` | `info`、`warning`、`danger` | `WDBanner` |
| `WDBottomSheetDetent` | `half`、`large` | `WDBottomSheet` |
| `WDBottomSheetDetents` | `all`、`fixed(WDBottomSheetDetent)` | `WDBottomSheet` |
| `WDButtonSize` | `sm`、`md`、`lg` | `WDButton`、`WDIconButton`（**复用类型**） |
| `WDButtonVariant` | `filled`、`tonal`、`glass`、`outline`、`plain`、`destructive` | `WDButton` |
| `WDCardStyle` | `elevated`、`outlined`、`glass`、`sunken` | `WDCard` |
| `WDChipSize` | `standard`、`compact` | `WDChip` |
| `WDDatePickerMode` | `date`、`time`、`dateAndTime` | `WDDatePicker` |
| `WDDividerStyle` | `full`、`inset` | `WDDivider` |
| `WDFABShape` | `roundedSquare`、`circle` | `WDFAB` |
| `WDFABSize` | `small`、`standard`、`large` | `WDFAB` |
| `WDFormRowLayout` | `horizontal`、`vertical` | `WDFormRow` |
| `WDIconButtonVariant` | `plain`、`filled`、`tonal`、`glass`、`outline` | `WDIconButton` |
| `WDIconSize` | `sm`、`md`、`lg`、`xl` | `WDIcon` |
| `WDListRowLeading` | `none`、`icon(WDIconName)`、`avatar(WDAvatarValue)`、`checkbox`、`selectionIndicator` | `WDListRow` |
| `WDListRowSwipeAction` | `none`、``delete(title:onDelete:)`` | `WDListRow` |
| `WDListRowTrailing` | `none`、`value(Text)`、`badge(WDBadgeValue)`、`avatar(WDAvatarValue)`、`disclosure` | `WDListRow` |
| `WDNavigationBarMode` | `inline`、`standard`、`largeTitle` | `WDNavigationBar` |
| `WDNavigationBarStyle` | `transparent`、`glass` | `WDNavigationBar` |
| `WDPickerStyle` | `menu`、`wheel`、`inline` | `WDPicker` |
| `WDProgressRingSize` | `standard`、`compact` | `WDProgressRing` |
| `WDSegmentedControlStyle` | `glass`、`solid` | `WDSegmentedControl` |
| `WDSkeletonVariant` | `text`、`list`、`card` | `WDSkeleton` |
| `WDStepperSize` | `standard`、`compact` | `WDStepper` |
| `WDSwitchSize` | `standard`、`compact` | `WDSwitch` |
| `WDTextFieldAccessory` | `none`、`unit(Text)`、`clear(accessibilityLabel:)`、`reveal(hiddenAccessibilityLabel:shownAccessibilityLabel:)`、`count(current:limit:)` | `WDTextField` |
| `WDTextFieldHelper` | `none`、`hint(Text)`、`error(Text)` | `WDTextField` |
| `WDTextFieldPrefix` | `none`、`icon(WDIconName)`、`text(Text)` | `WDTextField` |
| `WDTextFieldVariant` | `inset`、`outline`、`glass` | `WDTextField` |
| `WDToastVariant` | `neutral`、`success`、`warning`、`danger` | `WDToast` |

说明：

- `WDActionSheetItem.Role` / `WDAlertAction.Role` 是嵌套在值类型里的枚举，点号是类型路径，不是组件名。
- 带关联值的 case（`fixed(...)`、`value(...)`、`delete(...)` 等）仍属同一枚举，不另计枚举数。
- 枚举 case 顺序 = 登记顺序；重复定义的枚举必须逐字同序，否则校验应报错。
- 改枚举 case = 源级兼容性变更（穷尽 switch），按 §7 走流程。

## 6. 槽位词表（21 名）

冻结依据：iOS `SPEC.md` §2.10（M0 冻结 21 名；`DEV-PLAN.md` §8.1 复述"只有词表内名字算槽位，其余为参数"）。只有下列名字算槽位（进 U3）；同名在两端可有不同 API 形态（F48：槽位 / 值参数 / 值数组），但**名字与读屏语义必须逐字一致**。分类计数：**17 槽位 + 3 值参数 + 1 值数组 = 21**。

| 名称 | 分类 | iOS 形态（摘要） |
| --- | --- | --- |
| content | 槽位 | `@ViewBuilder`（`WDCard`、`WDBottomSheet`） |
| header | 槽位 | `@ViewBuilder`（`WDListSection`） |
| footer | 槽位 | `@ViewBuilder`（`WDBottomSheet`、`WDListSection`） |
| leadingIcon | 槽位 | 值参数 `WDIconName?`（`WDButton`、`WDChip`、`WDSearchField`） |
| trailingIcon | 槽位 | 值参数 `WDIconName?`（`WDButton`） |
| leading | 槽位 | 值参数 `WDListRowLeading`（`WDListRow`、`WDNavigationBar`） |
| trailing | 槽位 | 值参数 `WDListRowTrailing`（`WDListRow`、`WDNavigationBar`） |
| title | 槽位 | 值参数 `Text?` 或组件而定 |
| message | 槽位 | 值参数 `Text`（`WDAlert`、`WDBanner`、`WDToast` 等） |
| actions | 槽位 | 值数组 `[WD…Action]`（`WDAlert`、`WDBanner`、`WDEmptyState`、`WDToast`） |
| items | 槽位 | 值数组 `[Identifiable]`（`WDPicker`、`WDTabBar` 等） |
| label | 槽位 | Text 或 `@ViewBuilder`（`WDButton<Label>`） |
| icon | 槽位 | 值参数 `WDIconName` |
| prefix | 槽位 | 值参数 `WDTextFieldPrefix` |
| accessory | 槽位 | 值参数 `WDTextFieldAccessory` |
| helper | 槽位 | 值参数 `WDTextFieldHelper` |
| control | 槽位 | `@ViewBuilder`（`WDFormRow`） |
| subtitle | 值参数 | 值参数 `Text?`（`WDListRow`） |
| valueText | 值参数 | 值参数 `Text`（`WDProgressBar`、`WDProgressRing`） |
| placeholder | 值参数 | 值参数 `Text?`（`WDSearchField`） |
| options | 值数组 | 值数组 `[WDPickerOption]` / `[WDRadioOption]`（`WDPicker`、`WDRadio`） |

约定：

- 逐组件映射看上表"槽位"列（即 SPEC §2.10 要求的 {组件 → 槽位名 | 无} 37 行表；与 21 名同源校验）。
- **无槽位显式写 `无`**：目前为 `WDDivider`、`WDSkeleton`。脚本应把 `无` 归一为空集合，不得当成名为"无"的槽位。
- `slots` 是语义名，允许与参数名不同：`WDBanner` / `WDEmptyState` / `WDToast` 的 `actions` 对应单数参数 `action`；`WDFAB` 的 `label` 对应 `accessibilityLabel`；`WDSearchField` 的 `label` 对应 `cancelLabel`；`WDAvatar` 的 `icon` / `label` 由 `WDAvatarValue` 承载。
- 新增槽位名 = 改 U3（需 android-lead + 架构师），先改 contracts，再同步两端。

## 7. 变更流程

顺序固定（跨仓写入零容忍）：

1. **改真源**：修改 `contracts/<Component>.yaml`；若涉及新增/改名/枚举增删，同步更新本 README 的注册表。
2. **分类兼容性**：新增带默认值参数或新增重载 = 源码/二进制兼容；新增枚举 case = 源级 breaking（穷尽 switch）；改名或受控值类型变更 = breaking，必须走 C-15/ADR。
3. **同步副本**：iOS `SPEC.md` §2.10、`DEV-PLAN.md` §5.3（受控值）、当批 `SIGNATURE-FREEZE.md` 或 B 文档；Android `android/docs/SPEC.md` §2.10。两端对设计仓只读——设计侧落库后通知两端同步。
4. **更新记录**：iOS `CHANGELOG.md`（如仓内要求）+ 本文件 §9 历史表；API 符号计数同步（B1–B6 期间 1246 → 1276）。
5. **跑校验**：`ruby tools/contracts-check.rb`（见 §8），并跑两端相关测试/快照。
6. **提交**：`yaml` 与 README 同批提交；禁止只改 README 不改 `yaml`。

B1–B6 已落库记录（六份 B 文档均在 `iOS/docs/`，状态"已落库"）：

| 批次 | 日期 | 契约文件 | 增量 | 兼容性 | API 符号 |
| --- | --- | --- | --- | --- | --- |
| B1 | 2026-11-15 | `WDBadge.yaml` | `WDBadgeVariant` + `init(label:variant:)` | 新增类型/重载，兼容 | 1246 → 1254 |
| B2 | 2026-11-15 | `WDAvatar.yaml` | `WDAvatarSize` + `init(value:size:isOnline:isDisabled:)` | 新增类型/重载，兼容 | 1254 → 1261 |
| B3 | 2026-11-15 | `WDCard.yaml`、`WDDivider.yaml` | `WDCardStyle.sunken`；`WDDividerStyle` + `init(style:)` | 新增 case（源级 breaking）+ 新增类型/重载 | 1261 → 1266 |
| B4 | 2026-11-15 | `WDIconButton.yaml` | `WDIconButtonVariant` 增 `filled` / `tonal` / `glass` / `outline` | 新增 case（源级 breaking） | 1266 → 1270 |
| B5 | 2026-11-15 | `WDSwitch.yaml` | `description` / `size` + `WDSwitchSize` | 新增类型/重载，兼容 | 1270 → 1274 |
| B6 | 2026-11-15 | `WDDatePicker.yaml` | `range` / `showsClearButton` / `clearAccessibilityLabel` | 两个新增重载，兼容 | 1274 → 1276 |

## 8. 校验

- 全量校验（已落库，2026-11-15）：在 `wisdomdesign/` 下执行 `ruby tools/contracts-check.rb`；在仓库根执行 `ruby wisdomdesign/tools/contracts-check.rb`。脚本仅依赖 Ruby 标准库，只读 YAML，不修改文件。
- 脚本检查范围：YAML 可解析且顶层为 Hash；`component` 非空、全局唯一，并与内置 37 个组件基线完全相等；`params` 每项含非空 `name`/`ios`/`type` 且文件内唯一；`slots` ∈ 21 名冻结词表或 `无`；`default` 为 Hash；`enums` 合法，同名共享枚举的 case 必须完全一致；最后输出文件/组件/枚举计数。当前输出：

```text
文件数: 37
组件数: 37
枚举数: 36
枚举定义处数: 37
共享枚举数: 1（WDButtonSize）
检查通过：全部字段校验成功。
```

- 脚本**不**校验 README 表格与 yaml 是否同步，也**不**检查 `default` 键 ⊆ `params`；这两项由本文件生成时的同源核对与人工审查覆盖。建议额外核对：`default` 键 ⊆ `params[].name`/`params[].ios`（现有特例见 §8.1）。
- 脚本缺失时的最小自检（同样读取真实 YAML）：

```ruby
# 在 wisdomdesign/ 下运行
require "yaml"
fs = Dir["contracts/*.yaml"]
abort "期望 37 个 yaml，实得 #{fs.size}" unless fs.size == 37
names = fs.map do |f|
  d = YAML.load_file(f)
  abort "#{f}: component 与文件名不一致" unless d["component"] == File.basename(f, ".yaml")
  abort "#{f}: 缺 slots 键" unless d.key?("slots")
  s = d["slots"]
  abort "#{f}: slots 既不是数组也不是 无" unless s == "无" || s.is_a?(Array)
  (d["enums"] || {}).each { |k, v| abort "#{f}: #{k} 非数组" unless v.is_a?(Array) }
  d["component"]
end
abort "组件名重复" unless names.uniq.size == 37
puts "OK: #{names.size} components"
```

- 手工核计数：组件 **37**、唯一枚举 **36**、槽位名 **21**。

### 8.1 已知偏差与读取注意（2026-11-15 审计）

| 项 | 现象 | 处理 |
| --- | --- | --- |
| 默认表键名 | `default` 用 iOS 名（`isLoading` / `isSelected` / `isOnline`），`params[].name` 用 canonical 名 | 既有约定；校验按 `ios` 列比对，不按 `name` |
| `WDBadge.default` | 参数 `variant` 有 `default: .shared`，但组件级 `default: {}` 未列 variant | 以 `params[].default` 为准；待下次 B 修正 `default` 表 |
| `slots` ≠ 参数名 | `actions` / `action`、`label` / `accessibilityLabel`、`icon` / `label`（`WDAvatarValue`） | 语义槽位，非错误；见 §6 |
| 非 Swift 字面量 | `WDListSection.default.footer` = "EmptyView（Footer == EmptyView 的重载）"；`WDTextField.default` 含 `appearance.*` 点路径 | 注释性值；机器校验需白名单 |
| 槽位词表出处 | 常见引用写作 "DEV-PLAN §2.10"；实际 21 名词表在 iOS `SPEC.md` §2.10，`DEV-PLAN.md` 在 §8.1 复述边界 | 以 SPEC §2.10 为准 |
| B1/B2 变更请求默认值 | B1 CR 写 `variant: null`、B2 CR 写 `size: null`；yaml 为 `default: .shared` / `.md` | 以 yaml 为准（既有重载语义默认）；CR 为笔误（`CROSS-END-SYNC.md` R2） |
| B6 `range` 类型 | B6 CR 写 `ClosedRange<Date>?`；yaml 为 `Binding<ClosedRange<Date>?>`，iOS 实现同 yaml | 以 yaml 为准（`CROSS-END-SYNC.md` R3） |

## 9. 变更历史

| 日期 | 变更 | 范围 | 记录 |
| --- | --- | --- | --- |
| 2026-11-12 | M2 / M3 / M4 契约回填 | M2 11 件、M3 1 件、M4 9 件 | 各 YAML header |
| 2026-11-13 | M5 契约回填 | 15 件 | 各 YAML header |
| 2026-11-14 | M6 与局部增量 | `WDAssigneePicker`、`WDProgressBar`、`WDPicker` 等 | 各 YAML header；用户裁决 |
| 2026-11-15 | **B1–B6 落库** | `WDBadge`、`WDAvatar`、`WDCard`/`WDDivider`、`WDIconButton`、`WDSwitch`、`WDDatePicker` | `iOS/docs/B1`–`B6` 六份 `*-CONTRACT-CHANGE-REQUEST.md`（均已落库） |
| 2026-11-15 | 本 README 落库（M0-5 补齐） | schema / 注册表 / 21 名 / 流程 / 校验 | 本文件 |

---

<!-- END README -->
