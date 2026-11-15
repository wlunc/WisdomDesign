# B1–B6 契约增量的跨端副本缺口审计（CROSS-END-SYNC）

> **性质**：**只读审计报告**。本轮**只新建本文件**，未修改任何 Android / iOS 文档，未运行 `git`，未提交。
> **审计对象**：`wisdomdesign/contracts/` 的 7 份契约（WDBadge / WDAvatar / WDCard / WDDivider / WDIconButton / WDSwitch / WDDatePicker）在 2026-11-15 的 B1–B6 增量。
> **被审副本**：`android/docs/SPEC.md` §2.10（`:1306`–`:1353`，37 行表）＋ `iOS/docs/SPEC.md` §2.10（`:885`–`:992`，37 组件矩阵）＋ 与之同源的 2 处 Android 次级副本（见 §6）。
> **未纳入判定**：C-15（`iOS/docs/DEV-PLAN.md` §5.3，`:473`–`:520`）、槽位表（Android §2.4 `:937`–`:971` / iOS §2.10 副表 `:903`–`:925`）、历史冻结记录（`M2-SIGNATURE-FREEZE.md`、`B1–B6-SIGNATURE-FREEZE.md`、`M2-EXIT-REPORT.md`、`CHANGELOG.md`、`api/WisdomUI.api.json`）。
> **设计真源**：契约 YAML 为唯一真源；`contracts/README.md` 已于 2026-11-15 随本轮落库；两端 §2.10 是**只读副本**，先改真源再同步副本。
> **证据时点**：2026-11-15，行号 = 当前工作区文件实测行号；引用一律"文件:行号 + 可 grep 锚点串"。
>
> **执行结果（2026-11-15）**：§2 的 14 处“必须改”已落地——iOS 提交 `ad27228`、Android 提交 `08d56d3`（仅文档，未动两仓历史冻结记录/C-15/槽位/签名）；#23 的 B6 Android 形态仍【待 android-lead 确认】，未写成已冻结/已实现。

---

## 1. 结论摘要

### 1.1 一句话结论

**B1–B6 的 7 件增量全部只落在"默认值 / 枚举 case / 新增参数"三处，没有任何受控值改名** ⇒ **C-15 与槽位表 0 改动**；需要改的副本只有 **Android §2.10（6 行 + 1 行待裁决）**、**iOS SPEC（§2.10 5 行 + §2.11 枚举声明 1 处）**、以及 **2 处 Android 次级枚举副本**。

### 1.2 需要改 / 不需要改

| 副本 | 位置 | 需要改？ | 理由 |
| --- | --- | --- | --- |
| **Android SPEC §2.10** | `android/docs/SPEC.md:1316,1319,1325,1326,1328,1331` | ✅ **必须改（6 行）** | B1–B5 的枚举 case 与默认值，本表是**唯一登记处**（"枚举 case 名以本表为准"，`:1310`） |
| **Android SPEC §2.10 #23** | `:1337` | ⚠️ **待裁决（1 行）** | B6 的 `range`/`showsClearButton`/`clearAccessibilityLabel` 与 Android 的 `DatePickerDialog` 载体（F41）冲突；见 §5-R1 |
| **iOS SPEC §2.10** | `iOS/docs/SPEC.md:939,945,946,948,957` | ✅ **必须改（5 行）** | "关键默认"列是 §2.10 唯一承载默认值的列（`:933` 列头），B1–B6 有 5 行新增"带默认值的参数" |
| **iOS SPEC §2.11** | `iOS/docs/SPEC.md:1000–1002,1018,1022` | ✅ **必须改（1 处 4 个落点）** | `WDCardStyle` 的代码块、Android 声明注释、枚举表、U2 断言字面量仍写 3 个 case；B3 已加 `sunken`，且测试已断言 4 个（`iOS/Tests/WisdomUITests/Components/WDCardTests.swift:35`） |
| **iOS SPEC §2.10 #02 / #17 默认列** | `:936`（`.plain`）、`:951`（`.elevated`） | ❌ 不改 | B4 只加 case、B3 只加 case，**默认值不变**；§2.10 无"枚举全量 case"列，case 集合不在本表承载 |
| **C-15（`iOS/docs/DEV-PLAN.md` §5.3）** | `:478`–`:516` | ❌ **不改** | `variant`/`size`/`style`/`description`/`range`/`showsClearButton`/`clearAccessibilityLabel` **都不是受控值**；#11/#12/#14 仍为 `—`，断言"37 行 diff = 0"（`:520`）继续成立 |
| **槽位表（两端）** | Android `:939`–`:961`、iOS `:903`–`:925` | ❌ 不改 | 7 件槽位与契约 `slots` 逐字一致：`WDBadge [label]`、`WDAvatar [icon,label]`、`WDCard [content]`、`WDDivider 无`、`WDIconButton [icon]`、`WDSwitch [label]`、`WDDatePicker [label]` |
| **Android §2.10 表头/引言** | `:1306`–`:1312` | ❌ 不改 | 仍成立："本表 = C-15 副本"、"枚举 case 名以本表为准"、"R3A-01 14 行改名" |
| **Android 次级枚举副本** | `android/AGENTS.md:279`、`android/docs/DEV-PLAN.md:467` | ✅ **必须改（2 处）** | "三枚举"冻结行仍写 `WDCardStyle{Elevated, Outlined, Glass}`；B3 加 `Sunken` 后与契约不一致 |

### 1.3 为什么"增量"落点如此集中

7 件契约的增量形态只有三类（逐行证据见 §2 的"契约行号"列）：

1. **纯新增枚举 case**：`WDCardStyle + sunken`（B3）、`WDIconButtonVariant + filled/tonal/glass/outline`（B4）→ 只影响"枚举 case"列或枚举声明处，**默认值不变**；
2. **新类型 + 新参数（带默认值）**：`WDBadgeVariant` + `variant`（B1）、`WDAvatarSize` + `size/isOnline/isDisabled`（B2）、`WDDividerStyle` + `style`（B3）、`WDSwitchSize` + `description/size`（B5）、`range/showsClearButton/clearAccessibilityLabel`（B6）→ 必须进"关键默认"列；
3. **零改名**：7 件的受控值名与槽位名**一个都没动** ⇒ C-15 / U3 不在本次同步范围。

> **受控值判定（供复核）**：受控值 = "由调用方 `Binding`/回调驱动的**状态参数**"（`loading`/`on`/`text`/`date`/`selection`…）。`variant`/`size`/`style` 是**外观档位**，`description`/`clearAccessibilityLabel` 是**文案**，`showsClearButton` 是**开关**，`range` 是**第二个值入口**（与 `date` 互斥，B6 契约 `:32` 注释）——**均不进 C-15**。

### 1.4 改动风险分级（先看这个再排期）

| 级 | 项 | 说明 |
| --- | --- | --- |
| **零风险** | Android §2.10 全部 6 行、Android 2 处次级副本 | Android 仓**尚无任何组件实现**（`android/wisdom-ui/src/main/kotlin/…` 只有 `foundation/generated/{WDTokens,WDIconName,WDTokensVersion}.kt` + `foundation/theme/WDTheme.kt` + `foundation/tokens/WDGradient.kt`）⇒ 纯"批前冻结"文本，**不触 ABI、不触 `api/wisdom-ui.api`** |
| **零风险** | iOS §2.10 5 行、§2.11 1 处 | iOS 实现已落地并已在 API 基线（`api/WisdomUI.api.json:1577` 已有 `WDCardStyle.sunken`）⇒ 纯文档追平实现 |
| **需裁决** | Android #23（B6） | 见 §5-R1，【待 android-lead 确认】 |
| **需契约 owner 澄清（不阻塞抄录）** | 2 处 YAML ↔ 变更请求口径差异 | 见 §5-R2 / R3（`WDBadge.variant` 默认、`WDDatePicker.range` 类型） |

---

## 2. 逐组件表（契约增量 → Android 现文 → 建议措辞 → iOS 是否需改）

> **读法**：Android 行号 = `android/docs/SPEC.md`；iOS 行号 = `iOS/docs/SPEC.md`；"契约行号" = `wisdomdesign/contracts/<组件>.yaml`。
> **建议措辞 = 可直接替换该单元格的文本**（保持原文风格：反引号包住参数与枚举、PascalCase case、中文顿号分隔）。
> **仅 7 行受影响**：`#02 / #05 / #11 / #12 / #14 / #17 / #23`（#01/#03/#04… 及其他 30 行不动）。

### 2.0 契约行号索引（先定位增量原文）

| 组件 | 契约增量原文（行号） |
| --- | --- |
| `WDBadge` | `WDBadge.yaml:17–20`（`variant`，`default: .shared`）、`:28`（`WDBadgeVariant: [shared, schedule, pending, success, warning, danger]`） |
| `WDAvatar` | `WDAvatar.yaml:13–16`（`size`，`default: .md`）、`:17–24`（`isOnline`/`isDisabled` = false）、`:29–32`（`default` 块）、`:36`（`WDAvatarSize: [xs, sm, md, lg, xl]`） |
| `WDCard` | `WDCard.yaml:23`（`WDCardStyle: [elevated, outlined, glass, sunken]`） |
| `WDDivider` | `WDDivider.yaml:9–12`（`style`，`default: .full`）、`:16–17`（`default.style: .full`）、`:20`（`WDDividerStyle: [full, inset]`） |
| `WDIconButton` | `WDIconButton.yaml:39`（`WDIconButtonVariant: [plain, filled, tonal, glass, outline]`）；参数与默认值**零变化**（`:11–29`） |
| `WDSwitch` | `WDSwitch.yaml:15–18`（`description: Text?`，`default: null`）、`:19–22`（`size: WDSwitchSize`，`default: .standard`）、`:31`（`WDSwitchSize: [standard, compact]`） |
| `WDDatePicker` | `WDDatePicker.yaml:32–35`（`range`，`default: null`）、`:36–39`（`showsClearButton`，`default: false`）、`:40–43`（`clearAccessibilityLabel`，`default: null`）、`:57`（`WDDatePickerMode` **不变**） |

### 2.1 `WDBadge`（#11；B1）

| 项 | 内容 |
| --- | --- |
| **契约增量** | 新枚举 `WDBadgeVariant` 六 case；新参数 `variant`（仅 `init(label:variant:)` 必填），既有重载语义默认 `.shared` |
| **Android 现文** | `:1325`：`\| 11 \| WDBadge \| — \| — \| max = 99；count = 0 隐藏 \| — \| U（无受控值） \| D \|`（枚举列与默认列都是 `—`） |
| **建议改为** | **关键默认列**：`max = 99`；`count = 0` 隐藏；`variant = Shared`（仅 `label + variant` 重载可传，既有重载等价 `Shared`）<br>**枚举 case 列**：`WDBadgeVariant{Shared, Schedule, Pending, Success, Warning, Danger}`<br>**U/F 列**：`U（无受控值；B1 六变体只增不改）` |
| **iOS SPEC §2.10 需改？** | ✅ `:945` 关键默认仍写 `4 汉字` ⇒ 建议改为 `variant = .shared`（既有重载）；`4 汉字` 作为状态胶囊文案策略保留 |
| **备注** | 六变体的**配色偏差**（schedule 改 `status.info` 实底等）属实现 / B1-SIGNATURE-FREEZE §2，**不进 §2.10** |

### 2.2 `WDAvatar`（#12；B2）

| 项 | 内容 |
| --- | --- |
| **契约增量** | 新枚举 `WDAvatarSize` 五档；新参数 `size`（新重载必填，既有重载语义默认 `.md`）、`isOnline = false`、`isDisabled = false` |
| **Android 现文** | `:1326`：`\| 12 \| WDAvatar \| — \| — \| 直径锁死（WDSize.avatarMd） \| — \| U（无受控值） \| D \|` |
| **建议改为** | **关键默认列**：`size = Md`（直径 `WDSize.avatarMd` = 32；五档映射 `avatarXs/Sm/Md/Lg/Xl` = 20/28/32/40/56；`avatarXxl`（72）**不在契约内**）、`isOnline = false`、`isDisabled = false`<br>**枚举 case 列**：`WDAvatarSize{Xs, Sm, Md, Lg, Xl}`<br>**U/F 列**：`U（无受控值；B2 五档只增不改；直径令牌两端同名（DIR-1 大小写））` |
| **iOS SPEC §2.10 需改？** | ✅ `:946` `直径锁死` ⇒ 建议改为 `size = .md`（五档 20/28/32/40/56）；`isOnline = false`；`isDisabled = false` |
| **证据** | 直径令牌两端同值：`android/…/generated/WDTokens.kt:244–249` 与 `iOS/…/generated/WDTokens.swift:167–172`（`avatarXs..Xxl`）；iOS 实现默认 `WDAvatar.swift:52–54`（`init(value:) → size: .md`） |

### 2.3 `WDCard`（#17；B3）

| 项 | 内容 |
| --- | --- |
| **契约增量** | `WDCardStyle` **追加 `sunken`**（第 4 个 case）；参数/默认值/槽位不变（默认仍 `.elevated`） |
| **Android 现文** | `:1331`：`\| 17 \| WDCard \| — \| — \| style = Elevated \| WDCardStyle{Elevated, Outlined, Glass} \| U（无受控值） \| D \|` |
| **建议改为** | **枚举 case 列**：`WDCardStyle{Elevated, Outlined, Glass, Sunken}`；**关键默认列** `style = Elevated` **保持不变**；U/F 列可补 `（B3 追加 Sunken = 源级 breaking）` |
| **iOS SPEC §2.10 需改？** | ❌ `:951` 的 `.elevated` **不改**（默认值不变；§2.10 无枚举列）<br>✅ **但 `iOS/docs/SPEC.md` §2.11 必须改（4 个落点）**：`:1001` 代码块 `case elevated, outlined, glass` → 补 `sunken`；`:1002` 注释 `{Elevated, Outlined, Glass}` → 补 `Sunken`；`:1018` 表行 case 列表与 Android 声明 → 各补 `sunken` / `Sunken`；`:1022` 断言字面量 `["elevated","outlined","glass"]` → `["elevated","outlined","glass","sunken"]` |
| **证据** | 实现已 4 case（`iOS/Sources/WisdomUI/Components/Primitives/WDCard/WDCard.swift:4`）、API 基线已含 `WDCardStyle.sunken`（`iOS/api/WisdomUI.api.json:1577`）、测试已断言 4 case（`iOS/Tests/WisdomUITests/Components/WDCardTests.swift:35`）⇒ §2.11 是**文档落后于实现+测试** |

### 2.4 `WDDivider`（#14；B3）

| 项 | 内容 |
| --- | --- |
| **契约增量** | 新枚举 `WDDividerStyle`（`full`/`inset`）；新参数 `style`，默认 `.full`；既有 `init()` 保留（`WDDivider.yaml:9`） |
| **Android 现文** | `:1328`：`\| 14 \| WDDivider \| — \| — \| 装饰：clearAndSetSemantics {}（不进树） \| — \| U（无受控值） \| D \|` |
| **建议改为** | **关键默认列**：`style = Full`；装饰语义不变（`clearAndSetSemantics {}`，不进树）<br>**枚举 case 列**：`WDDividerStyle{Full, Inset}`<br>**U/F 列**：`U（无受控值；B3 新增类型 + 重载 = 兼容）` |
| **iOS SPEC §2.10 需改？** | ✅ `:948` `装饰：accessibilityHidden` ⇒ 建议改为 `style = .full`（`inset` 左缩进 62）；`accessibilityHidden` 保留 |
| **待裁决** | `Inset` 的**缩进起点**不在契约内：iOS 实现取 62（设计 14），Android 等价 dp 未定 ⇒ 见 §5-R4【待 android-lead/设计】 |

### 2.5 `WDIconButton`（#02；B4）

| 项 | 内容 |
| --- | --- |
| **契约增量** | `WDIconButtonVariant` 追加 `filled`/`tonal`/`glass`/`outline`（`plain` 保留首位）；**参数与默认值零变化**（`variant = .plain`、`size = .md`、`isLoading = false`） |
| **Android 现文** | `:1316`：`\| 02 \| WDIconButton \| loading \| loading \| variant = Plain、enabled = true \| 复用 WDButtonVariant（子集：Plain/Filled/Glass） \| U（同上） \| D \|` |
| **建议改为** | **仅改枚举列**：`复用 WDButtonVariant（子集：Plain/Filled/Tonal/Glass/Outline；Destructive 不适用于图标按钮）`；关键默认列 `variant = Plain`、`enabled = true` **不动** |
| **iOS SPEC §2.10 需改？** | ❌ `:936` `.plain` **不改**（B4 无新参数、默认值不变）；`WDIconButtonVariant` 的 case 集合不在 §2.10/§2.11 承载 ⇒ iOS SPEC 侧**无同源冲突** |
| **纪律** | Android **不新增 `WDIconButtonVariant` 类型**（仍复用 `WDButtonVariant`），**只更新子集说明**——这是契约 `WDIconButton.yaml:39` 与 `WDButton.yaml` 的既定映射，不是新口径 |

### 2.6 `WDSwitch`（#05；B5）

| 项 | 内容 |
| --- | --- |
| **契约增量** | 新枚举 `WDSwitchSize`（`standard`/`compact`）；新参数 `description: Text? = null`、`size: WDSwitchSize = .standard`；既有 `init(isOn:label:)` 等价于 `size = .standard`、`description = nil`（`WDSwitch.yaml:26–28`） |
| **Android 现文** | `:1319`：`\| 05 \| WDSwitch \| on（← checked） \| on \| enabled = true \| — \| U（is 前缀 = F1；设计口径"布尔开关"） \| D \|` |
| **建议改为** | **关键默认列**：`enabled = true`、`description = null`、`size = Standard`（既有重载等价）<br>**枚举 case 列**：`WDSwitchSize{Standard, Compact}`<br>U/F 列保持 `U（is 前缀 = F1；设计口径"布尔开关"）`，可补 `；B5 描述位/尺寸档只增不改` |
| **iOS SPEC §2.10 需改？** | ✅ `:939` 关键默认为 `—` ⇒ 建议改为 `size = .standard`；`description = nil`（既有 `init(isOn:label:)` 等价） |
| **证据** | iOS 实现 `WDSwitch.swift:26–32`（既有重载 `description = nil` / `size = .standard`）、`:34–39`（新重载） |

### 2.7 `WDDatePicker`（#23；B6）——**唯一待裁决行**

| 项 | 内容 |
| --- | --- |
| **契约增量** | 新参数 `range: Binding<ClosedRange<Date>?> = null`（与 `date` 互斥）、`showsClearButton: Bool = false`、`clearAccessibilityLabel: Text? = null`；`WDDatePickerMode` **不变**（`WDDatePicker.yaml:57`） |
| **Android 现文** | `:1337`：`\| 23 \| WDDatePicker \| date（← value） \| date \| enabled = true、title = null \| — \| U（名词一致；载体 = F41） \| D + AL \|`；另 `:906` 的签名 = `WDDatePicker(date: Long?, onValueChange: (Long) -> Unit, …, title: String? = null)` |
| **建议改为（先落"受控值不变 + 载体=F41"两句；B6 三参数留待确认）** | **关键默认列**：`enabled = true`、`title = null`；**B6 增量【待 android-lead 确认】**：`range = null`（与 `date` 互斥）、`showsClearButton = false`、`clearAccessibilityLabel = null`<br>**U/F 列**：`U（名词一致；载体 = F41；B6 范围/清除的 Android 形态 = 待裁决）` |
| **iOS SPEC §2.10 需改？** | ✅ `:957` 关键默认为 `locale 由系统` ⇒ 建议改为 `mode = .date`（不变）；`range = nil`；`showsClearButton = false`；`clearAccessibilityLabel = nil`（`locale 由系统` 可保留）。**iOS 实现已落地**（`WDDatePicker.swift:60–80` 既有 date 重载、`:81–103` 单日期 + 清除、`:104–125` 范围重载）⇒ 纯文档追平 |
| **判定** | 见 §5-R1。**未确认前不得把 `range` 写成"已实现"或"已冻结"** |

### 2.8 逐行缺口计数

| 副本 | 缺口行/处 | 数量 |
| --- | --- | --- |
| `android/docs/SPEC.md` §2.10 | #02 :1316、#05 :1319、#11 :1325、#12 :1326、#14 :1328、#17 :1331、#23 :1337（待裁决） | **7** |
| `iOS/docs/SPEC.md` §2.10 | #05 :939、#11 :945、#12 :946、#14 :948、#23 :957 | **5** |
| `iOS/docs/SPEC.md` §2.11 | :1000–1002、:1018、:1022（同一枚举的 4 个落点，计 1 处） | **1** |
| `android/AGENTS.md` :279 | 三枚举冻结行 | **1** |
| `android/docs/DEV-PLAN.md` :467 | 三枚举冻结行（与 AGENTS :279 同文） | **1** |
| **合计** | | **15** |

> 15 = **14 处必须改**（Android §2.10 6 + iOS SPEC 6 + Android 次级 2）＋ **1 行待裁决**（Android #23）。**不含** C-15 / 槽位 / 表头 / 历史冻结记录（0 缺口）。

---

## 3. Android 命名规则（写进 §2.10 前先过这张表）

> **规则来源**：`android/docs/SPEC.md:1310`（"枚举 case 名以本表为准"）、`:1315` 的既有写法（`WDButtonVariant{Filled, Tonal, Glass, Outline, Plain, Destructive}`）、`WDBottomSheetDetent{Half, Large}` 等；契约比较键 = `name.lowercase()`（DIR-1，`iOS/docs/SPEC.md:1023`）。
> **一句话**：**Android 枚举 case = PascalCase（UpperCamel）；iOS rawValue = lowerCamel 小写；两端比较时归一化，任一端不得改字形。**

| 契约枚举（小写 canonical） | **Android 写法（PascalCase，必须照抄）** | 反例（禁止） |
| --- | --- | --- |
| `WDBadgeVariant` | `{Shared, Schedule, Pending, Success, Warning, Danger}` | `SHARED` / `shared` / `SharedBadge` |
| `WDAvatarSize` | `{Xs, Sm, Md, Lg, Xl}` | `XS` / `XL` / `MD` / `XSmall` |
| `WDSwitchSize` | `{Standard, Compact}` | `STANDARD` / `standard` |
| `WDDividerStyle` | `{Full, Inset}` | `FULL` / `full` / `Indent`（**名字是 Inset，不是 Indent**） |
| `WDCardStyle`（追加项） | `{Elevated, Outlined, Glass, Sunken}`（**`Sunken` 在末位**，与契约数组顺序一致） | `SUNKEN` / `sunken` / `Depressed` |
| `WDIconButtonVariant`（B4） | **不新建类型**：复用 `WDButtonVariant`，子集 = `{Plain, Filled, Tonal, Glass, Outline}` | `WDIconButtonVariant`（与 `WDButton` 双真源）/ `IconButtonVariant` |
| `WDDatePickerMode`（B6 明确不变） | `{Date, Time, DateAndTime}`（既有，不改） | `DateTime` / `datetime` |

**另外三条硬约束**（来自 Android 侧既有纪律，抄录时别踩）：

1. **枚举 = `String` 原始值 + `CaseIterable` + `Sendable`；新增 case = 源级 breaking**（`android/docs/SPEC.md:1300`「枚举新增 | 源级 breaking（消费方穷举）；库内 when 必须穷举」）⇒ B1/B2/B3/B4/B5 的 5 处新增 case 都要在 CHANGELOG 的 Breaking 段登记；
2. **不新增 `is` 前缀**：`isOnline`/`isDisabled` 是**iOS 契约名**（`WDAvatar.yaml:18,22`）；Android 侧按 F1 的既有惯例落 `online`/`disabled` 还是 `isOnline`/`isDisabled` **需在签名冻结时定**——**§2.10 只写默认值，不写参数名**，故本轮表格**不需要**为此改名（也**不得**顺手改 C-15）；
3. **默认值写法 = Kotlin 形（`= Standard` / `= false` / `= null`）**，与既有行 `variant = Plain`、`showsSeparator = true` 同形；**不要**抄 iOS 的 `.standard` 点号写法。

---

## 4. 明确"不要改"的项（避免顺手改多）

| # | 不要改 | 原因 / 证据 |
| --- | --- | --- |
| 1 | **C-15（`iOS/docs/DEV-PLAN.md` §5.3 :473–:520，37 行）** | `variant`/`size`/`style`/`description`/`range`/`showsClearButton`/`clearAccessibilityLabel` **都不是受控值**；#11/#12/#14 = `—` 仍正确；改动会破坏 §5.3:520 的"37 行 diff = 0（预期差异仅 #06）"断言 |
| 2 | **两端槽位表**（Android §2.4 :937–:971、iOS §2.10 副表 :903–:925） | 7 件的 `slots` 与契约逐字一致（含 `WDDivider = 无`）；B1–B6 **无槽位增删** |
| 3 | **Android §2.10 表头与三段引言**（:1306–:1312） | "C-15 副本"、"枚举 case 名以本表为准"、"R3A-01 的 14 行改名"三句仍然成立；本批**没有**第 15 个改名 |
| 4 | **Android §2.10 的"受控值（Android 名）"与"契约名"两列**（7 行） | 7 行里 6 行是 `—`，`WDSwitch = on`/`WDDatePicker = date` 不变 ⇒ B1–B6 零改名 |
| 5 | **`WDIconButton` 的 Android 枚举类型名** | 仍复用 `WDButtonVariant`（:1316 现文），**只改子集括注**；新建 `WDIconButtonVariant` 会制造双真源 |
| 6 | **iOS SPEC §2.10 #02（:936）与 #17（:951）的默认列** | B4 只加 case（默认 `.plain`）、B3 只加 case（默认 `.elevated`）⇒ 默认值列无需改；§2.10 **没有**枚举全量 case 列，case 集合由 §2.11（仅三枚举）与契约承载 |
| 7 | **`WDDatePickerMode` 的枚举表**（`WDDatePicker.yaml:57`、Android :1337 的 `—`） | B6 契约明写 `enums: {}`（`B6-CONTRACT-CHANGE-REQUEST.md:26`）⇒ 仍 `date / time / dateAndTime` |
| 8 | **Android §2.3:906 的 `WDDatePicker` 签名行** | 本轮 B6 未裁决前**不动签名**（`date: Long?` + `DatePickerDialog` = F41 既有裁决）；改签名 = 改 ABI 形状（Android 虽无实现，但会提前锁死载体） |
| 9 | **历史冻结/出口记录**：`iOS/docs/M2-SIGNATURE-FREEZE.md:110,180`、`B1–B6-SIGNATURE-FREEZE.md`、`M2-EXIT-REPORT.md`、`CHANGELOG.md`、`iOS/api/WisdomUI.api.json` | 它们是**时点快照**（如 M2 冻结时的 `WDCardStyle` 三 case），改了=篡改历史；§2.10/§2.11 是"当前生效副本"，只改后者 |
| 10 | **`contracts/*.yaml` 的 7 份文件** | B1–B6 已落库（各 CR 头行"状态：已落库 2026-11-15"）；本轮**只同步副本**。2 处**文本级**口径差异见 §5-R2/R3，由契约 owner 决定是否单开变更集 |
| 11 | **`android/AGENTS.md` 除 :279 之外的冻结行**（§6 #1–#21、#23–#25） | 行高/触控/槽位/玻璃/状态串等与本批无关 |
| 12 | **`iOS/docs/B1–B6-CONTRACT-CHANGE-REQUEST.md` 六份请求稿** | 是"请求/论证"记录，不是副本；契约已落库即完成使命，回改会造成第二真源 |

---

## 5. 风险 / 待裁决

### R1 · B6 的 `range`/`clear` 在 Android：是否已实现 / 是否进 Android SPEC ——【待 android-lead 确认】

**已确认的事实（可验证）**：

1. **Android 侧没有 `WDDatePicker` 实现**：`android/wisdom-ui/src/main/kotlin/io/github/wlunc/wisdom/` 下只有 `foundation/generated/{WDTokens,WDIconName,WDTokensVersion}.kt`、`foundation/theme/WDTheme.kt`、`foundation/tokens/WDGradient.kt`（`find android/wisdom-ui/src -name '*.kt'` 实测）⇒ **不存在"已实现 B6"的可能**，§2.10 #23 目前只是**冻结前的文本**。
2. **载体冲突**：Android 既有裁决 = `WDDatePicker` 包装 `android.app.DatePickerDialog`（`android/docs/SPEC.md:906`，F41 见 `:1968`）。平台 `DatePickerDialog` **只能选单日、无范围模式、无内置清除按钮** ⇒ B6 的 `range` 与 `showsClearButton` **无法在 F41 载体上直接落地**。
3. **范围选择会撞两条门禁**：Android 的 m3 收缩约束是"**全库 m3 import 计数 == 1**"（`android/AGENTS.md:191`（G1 命令的第三子断言）；`android/docs/SPEC.md:504`（G1 条））＋"公开签名不得出现 m3 类型"（G9 正向白名单）⇒ **`MaterialDatePicker`（范围选择）不可用**，只能自绘月历或新增依赖——两者都超出"同步文档"的范围，属**新设计与新裁决**。
4. **`showsClearButton` + `clearAccessibilityLabel` 单独看是可落地的**：零文案由调用方给标签（L-B，`android/AGENTS.md:275`），清除 = 把 `date` 置 `null`，不触 m3；**但** `range` 未定之前，把三个参数一起抄进 §2.10 会造成"表里已冻结、实现无载体"的失真。

**三个可选方案（供 android-lead 选，报告不替选）**：

| 方案 | 做法 | §2.10 #23 怎么写 | 代价 |
| --- | --- | --- | --- |
| A（推荐） | 只认 `showsClearButton`/`clearAccessibilityLabel` 为**与 range 解耦**的参数；`range` 登记为 F 项待裁 | 默认列写 `showsClearButton = false`、`clearAccessibilityLabel = null`；`range` 标注【待 android-lead 确认】 | 需确认契约是否允许"两端参数子集不同"（现有先例：F23 能力集差异、F41 载体差异） |
| B | 三参数全收，`range` 用自绘月历（与 iOS `.date` 同构） | 三参数全写进默认列 | 自绘月历 = 新组件级工作量；需设计给范围视觉（B6 CR :36 已记"范围中点视觉未实现"） |
| C | 三参数全不收，登记为 F 项 | #23 只保留现状 + `（B6 在 Android 不适用；范围 = F 项）` | 与"契约 params 必须两端可比"（U2）冲突，需在契约侧写例外 |

> **结论**：**§2.10 #23 本轮只写"待裁决"标记，不得写成已冻结/已实现**；裁决入口 = android-lead（载体与 m3 约束的冲突由他裁），执行时点 = **M5 批前签名冻结前**（`WDDatePicker` 属 M5，`android/docs/SPEC.md:2203`）。

### R2 · `WDBadge.variant` 的"默认值"两处口径不一致（契约 owner 澄清）

- 契约 `WDBadge.yaml:20` = `default: .shared`；`:18` 注释 = "既有重载保持无 variant"；`:24` 的 `default: {}` **未列 `variant`**；
- 变更请求 `iOS/docs/B1-CONTRACT-CHANGE-REQUEST.md:17` = `default: null`（"仅 `init(label:variant:)` 必填"）。
- **影响**：Android 行抄成 `variant = Shared` 还是 `variant = null` 会直接决定"既有重载等价哪一档"。
- **已解决（2026-11-15）**：B1 CR 已改为 `default: .shared`；按契约 `default: .shared` 抄 `variant = Shared`。同类：`WDAvatar.size` 按 `.md` / `Md` 抄（B2 CR 为语义默认说明，非笔误）。

### R3 · `WDDatePicker.range` 的类型文本疑似笔误（契约 owner 校正）

- 契约 `WDDatePicker.yaml:34` = `type: "Binding<ClosedRange<Date>?>"`；`B6-CONTRACT-CHANGE-REQUEST.md:14` = `ClosedRange<Date>?`（**缺 `Binding`**）；iOS 实现 = `range: Binding<ClosedRange<Date>?>`（`WDDatePicker.swift:81`）。
- **影响**：若 Android / 契约消费者按 CR 抄，会误判"range 是值参数而非受控值"——**这恰好会反过来污染 C-15 的判定**。
- **已解决（2026-11-15）**：B6 CR 已改为 `Binding<ClosedRange<Date>?>`，与 YAML/实现一致。

### R4 · `WDDividerStyle.Inset` 的缩进值不在契约内

- iOS 实现取 **62**（`WDDivider.swift` 头注释"内缩到文本区起点 62"，设计 14）；契约 `WDDivider.yaml:20` 只有 case，**无值**；Android 的等价 dp / 是否与 `WDListRow` 文本区对齐未定。
- **建议**：Android §2.10 的 #14 只写 `style = Full` 与枚举，**不写缩进数值**；数值待设计/Android 布局定（若两端不同，按 F 项登记，与 F51 同法）。

### R5 · `WDIconButton` 复用 `WDButtonVariant` 的语义风险（低）

- `WDButtonVariant.Tonal/Glass` 的配色是**按钮容器**口径；图标按钮 `tonal` = `surface.tint` 底 + `text.on-soft` 图标、`glass` = `surface.glass-strong` + hairline 描边（`WDIconButton.swift:10–20`）。**同名不同视觉**是既有设计（F48 分类差异口径），但 5 个 case 全量复用后，建议在签名冻结时确认是否需要 F 项补记；**本轮只改 §2.10 的子集括注**。

### R6 · iOS SPEC 与测试的"文档落后"已可判定（无争议）

- `iOS/docs/SPEC.md:1022` 的断言字面量写 3 个 case，而 `iOS/Tests/WisdomUITests/Components/WDCardTests.swift:35` 已断言 `[.elevated, .outlined, .glass, .sunken]` ⇒ **规格文本落后于测试**。这不是"待设计"，可直接回写（但仍须走 iOS 侧 §6 的 P 项登记流程，本轮不动）。

---

## 6. 次级副本清单（不是 §2.10，但同批必须一起改）

| 文件:行 | 现文（锚点串） | 建议改为 | 责任 |
| --- | --- | --- | --- |
| `android/AGENTS.md:279` | `\| 22 \| 三枚举（M2/M4 首批要用） \| WDCardStyle{Elevated, Outlined, Glass} … \|` | `WDCardStyle{Elevated, Outlined, Glass, Sunken}`（其余 `WDToastVariant`/`WDBannerVariant` 不变） | android-lead |
| `android/docs/DEV-PLAN.md:467` | 与上同文的 `\| 21 \| 三枚举（M2/M4 首批要用） \| … \|` | 同上（两处必须同批改，否则 freeze 行自相矛盾） | android-lead |
| `iOS/docs/SPEC.md:1000–1002 / 1018 / 1022` | `case elevated, outlined, glass` / `{Elevated, Outlined, Glass}` / `["elevated","outlined","glass"]` | 见 §2.3 的 4 个落点建议 | ios-lead |

> **为什么这两处 Android 副本也算缺口**：它们是 `WDCardStyle` 的**第二、第三份枚举文本**（`grep -rn 'WDCardStyle{Elevated' android/` 命中 3 处：AGENTS:279、DEV-PLAN:467、SPEC:1331），只改 §2.10 会让"冻结值清单"与"§2.10 副本"互相矛盾。

---

## 7. 建议执行顺序（可照做）

> 顺序原则：**先真源口径澄清 → 再契约副本（Android 冻结表优先，因为它卡 M2 批前冻结）→ 再 iOS 规格 → 最后次级副本与复核**。全程**不改 C-15 / 槽位 / 契约 YAML**。

| 步 | 动作 | 落点（文件:行） | 出口判据 |
| --- | --- | --- | --- |
| **0** | **口径澄清（不阻塞抄录）**：`WDBadge.variant` 取 `.shared`、`WDAvatar.size` 取 `.md`；`WDDatePicker.range` 以 `Binding<…>` 为准（R2/R3） | 契约 owner（报告 §5-R2/R3） | 口头/PR 记录即可；**不改 YAML** |
| **1** | **Android §2.10 无争议 6 行**：#02 子集（:1316）、#05（:1319）、#11（:1325）、#12（:1326）、#14（:1328）、#17（:1331） | `android/docs/SPEC.md` | 6 行按 §2 的建议措辞落地；`grep -c 'WDAvatarSize{Xs, Sm, Md, Lg, Xl}'` == 1 |
| **2** | **Android §2.10 #23**：先写"现状 + 【待 android-lead 确认】"，**不写 range 已冻结** | `android/docs/SPEC.md:1337` | 行内含 `【待 android-lead 确认】` 标记；无 `range =` 的冻结式表述 |
| **3** | **Android 次级枚举副本**：2 处加 `Sunken` | `android/AGENTS.md:279`、`android/docs/DEV-PLAN.md:467` | `grep -rn 'WDCardStyle{Elevated, Outlined, Glass}' android/` = **0 命中** |
| **4** | **iOS SPEC §2.11 追平实现**（先于 §2.10，因为它是枚举声明处） | `iOS/docs/SPEC.md:1001,1002,1018,1022` | `grep -c 'sunken' iOS/docs/SPEC.md` ≥ 4；§2.11 表与 `WDCardTests.swift:35` 一致 |
| **5** | **iOS SPEC §2.10 五行默认列**：#05（:939）、#11（:945）、#12（:946）、#14（:948）、#23（:957） | `iOS/docs/SPEC.md` | 5 行按 §2 建议落地；`grep -c 'WDAvatarSize\|WDSwitchSize\|WDDividerStyle' iOS/docs/SPEC.md` ≥ 3 |
| **6** | **B6 裁决回填**：android-lead 选 A/B/C 后，把 #23 的"待确认"替换为定稿；若选 A/C，同步在契约或 F 注册表登记"两端参数子集差异" | `android/docs/SPEC.md:1337` + `android/docs/SPEC.md` §4.1 F 表 | #23 无"待确认"字样；F 表有对应行（若需要） |
| **7** | **一致性复核（只读命令）** | 工作区根 | 全部 exit 0 / 命中数符合预期（见 §7.1） |

### 7.1 复核命令（改动后跑；本轮未执行）

```bash
# ① Android §2.10：新枚举都进了表，且没有残留旧形态
grep -n 'WDBadgeVariant{Shared'      android/docs/SPEC.md
grep -n 'WDAvatarSize{Xs, Sm, Md, Lg, Xl}' android/docs/SPEC.md
grep -n 'WDSwitchSize{Standard, Compact}'  android/docs/SPEC.md
grep -n 'WDDividerStyle{Full, Inset}'      android/docs/SPEC.md
grep -n 'WDCardStyle{Elevated, Outlined, Glass, Sunken}' android/docs/SPEC.md
grep -n '子集：Plain/Filled/Tonal/Glass/Outline' android/docs/SPEC.md

# ② 旧形态必须 0 命中（Android 全仓）
grep -rn 'WDCardStyle{Elevated, Outlined, Glass}' android/ ; echo "expect 0"
grep -rn '子集：Plain/Filled/Glass' android/ ; echo "expect 0"

# ③ iOS：sunken 已进 §2.11，且断言字面量 4 case
grep -c 'sunken' iOS/docs/SPEC.md
grep -n 'elevated","outlined","glass","sunken' iOS/docs/SPEC.md

# ④ 不改项未被误改（应仍为原值）
grep -n '11 | WDBadge'  iOS/docs/DEV-PLAN.md   # C-15 #11 仍为 —
grep -n '12 | WDAvatar' iOS/docs/DEV-PLAN.md   # C-15 #12 仍为 —
grep -n '14 | WDDivider' iOS/docs/DEV-PLAN.md  # C-15 #14 仍为 —

# ⑤ 槽位表未动（7 件）
grep -n 'WDDivider' android/docs/SPEC.md | sed -n '1,4p'
```

---

## 8. 附：本轮审计边界与自证

- **只读**：本轮只执行了 `read / grep / glob` 与若干只读 `ls / find / grep`，**未运行 `git`**，**未修改 Android / iOS 任何文件**，**未新建除本文件外的文件**。
- **行号时效**：行号为 2026-11-15 实测；引用同时给锚点串（如"三枚举（M2/M4 首批要用）"、"子集：Plain/Filled/Glass"），重排后按锚点 grep 即可。
- **未验证项**（不得写成结论）：
  1. Android `WDIconButton` 的 `Tonal/Outline` 视觉映射是否与 `WDButtonVariant` 同名档位一致 —— 【未验证】Android 无实现，无观感可比；
  2. B6 在 Android 的最终形态 —— 【待 android-lead 确认】；
  3. `WDDividerStyle.Inset` 的 Android 缩进值 —— 【未验证】设计与 Android 布局均未给值。
