# R3 · Android Provider 与 Compose 黄金模板独立复核（t3）

> 复核任务：t3 / r3-android（WisdomDesign AI Skill 流水线 t1–t13 独立复核）
> 复核人：android-reviewer（独立复核；未参与 t7/t8 实现）
> 复核时间：2026-11-22 10:11–10:35（Asia/Shanghai）
> 环境：macOS；Node v24.21.0；android HEAD `3656d6ff8ae83cfd07166dd7fe85db489ef61110`（2026-11-21 16:22 +08）；wisdomdesign HEAD `b2c05d9`；Compose BOM `2026.06.01`（用本地 Gradle 缓存的 foundation-layout 1.12.1 核对 `WindowInsets` 的 ABI 形状）
> 边界：只读复核。**未修改 Android tracked 源码与 `wisdom-ui/api/wisdom-ui.api`**；唯一内容写入 = 本报告。按任务要求重跑了 `validate-provider.js`（生成器）：它原地重写 provider 文件，重写前后 26 个文件 sha256 逐字节一致（§9.4）。复核期间 R4 按任务授权重建了 `dist/ai-skill`（见 §4.3 与 `review/04-pipeline.md` §2.2）。

## 0. 结论先行

| # | 结论 | 判定 |
| --- | --- | --- |
| 1 | 受核对象总体判定 | **needs_revision（不能判 pass）**：1 high + 5 medium + 8 low（§6） |
| 2 | 23 张 API 卡？ | **不成立：实际 17 张 = 11 组件 + 6 基础入口**；根因是 validator 计数双计（§2.3） |
| 3 | API 卡与 Kotlin 公开声明/ABI 交叉证据 | 签名/调用形态检查全通过（11/11 组件签名、17/17 callShape 命名参数可回溯）；sourceRef 16/17（WDHaptics 锚点偏差）；**ABI 侧只有 `WDTheme` 1/17 可交叉**（组件 0/11、其余基础入口 0/5），已如实写限制（§2.1/§2.5） |
| 4 | provider status 是否 experimental 且未冒充 verified | **成立**：`effective=declared=experimental`；17/17 卡 `discovered`；`verified=[]`（§2.4） |
| 5 | 模板/manifest 的 templateId/imports/四状态/pageSpecRef 一致性 | **结构面通过**（templateId、targetPackage、编辑标记、39 imports 集合相等、四状态、pageSpecRef、spec 校验 exit 0）；**内容面有 defect**（§3） |
| 6 | verification.json 是否如实标注 native compile blocked、截图/字体/IME/返回/TalkBack not-run | **部分**：5 项 not-run 均如实列出；但**当前源文件没有记录"模板静态检查/模板编译 blocked/四状态 runtimeMatrix"**，且 `capturedAt` 是硬编码常量（§4，F-02/F-06） |
| 7 | 未实现组件是否标 spec-only/unsupported | **成立**：37 = 11 experimental + 26 spec-only + 0 unsupported + 0 verified；26 个 spec-only 在 Android 源码中确无实现（§2.4） |
| 8 | Android tracked 源码与 ABI 是否零改动 | **成立**：tracked status 为空、HEAD 未变、ABI sha256 复核前后一致、无近期构建产物（§5） |
| 9 | M3 Android 是否完成 | **partial / blocked，未达出口**：`apiEvidenceMinimum=example-compiled` 未满足；native compile blocked；截图/四状态/字体/IME/返回/TalkBack 全 not-run（§7） |

**给 R5 的一句话**：t7 可记为"Android Provider 与 17 张 API 卡完成（experimental、未编译）"，t8 可记为"Compose 黄金模板静态交付、编译 blocked 且含 1 条可复现的编译错误（F-03）"；**不得**写"Android M3 完成/已验证"，**计数必须用 17 而不是 23**。

---

## 1. 复核范围、方法与证据保全

### 1.1 复核对象

| 对象 | 路径 | 说明 |
| --- | --- | --- |
| Provider 描述 | `android/ai/skill-provider/provider.json` | schema 1.0；adapters/capabilities/apiCards/status/writeBoundary |
| 能力画像 | `android/ai/skill-provider/capabilities.json` | 8 个能力组 + componentCoverage |
| API 卡 | `android/ai/skill-provider/api/cards/{index.json,WD*.json}` | **17 张卡 + index**（磁盘核对） |
| 验证记录 | `android/ai/skill-provider/verification.json` | executed/notExecuted/unverified |
| 黄金模板 | `android/ai/skill-provider/templates/task-list/TaskListScreen.kt` | 154 行，Compose，public API only |
| 模板 manifest | `android/ai/skill-provider/templates/task-list.manifest.json` | 84 行 |
| 生成器 | `android/ai/skill-provider/tools/validate-provider.js` | 72 行（生成 + 校验一体） |
| 交叉真源（只读） | `android/wisdom-ui/src/main/kotlin/**`、`android/wisdom-ui/api/wisdom-ui.api`、`android/wisdom-ui/build.gradle.kts`、`android/gradle/libs.versions.toml`、`wisdomdesign/ai/skill/{provider,page-spec,evaluation,m0}/` | Kotlin 声明、ABI、构建配置、M0 契约、page spec、golden matrix |

### 1.2 本轮实际执行的命令与退出码（全部在本报告 §9 留有输出摘要）

| # | 命令 | 退出码 | 结果摘要 |
| --- | --- | --- | --- |
| C1 | `node android/ai/skill-provider/tools/validate-provider.js` | **0** | 22 条 `PASS`（2 条 baseline + 17 张卡 + index/capabilities/provider）；末尾 `WROTE 23 api cards`（**计数 bug**，实际 17，见 F-01） |
| C2 | `node wisdomdesign/ai/skill/runtime/validate-spec.js --file wisdomdesign/ai/skill/page-spec/examples/task-list.valid.json --json` | **0** | `valid=true`，`nativeCompile/snapshotUi/visualDesignReview/hostLoad = not-evaluated` |
| C3 | `node /tmp/r3-static-check.js`（本复核编写的只读检查器；47 项） | **1** | **33 PASS / 14 FAIL**；14 个 FAIL 均落到 §6 findings（不是脚本崩溃） |
| C4 | `git -C android status --porcelain --untracked-files=no` / `rev-parse HEAD` | 0 | 输出为空 / `3656d6f…` |
| C5 | `git -C android status --porcelain --untracked-files=all | grep -v '^?? ai/skill-provider/'` | 0 | 无输出（untracked 全部在 provider 目录内，26 个文件） |
| C6 | `shasum -a 256 android/wisdom-ui/api/wisdom-ui.api`（复核前后各一次） | 0 | 均为 `06b240434600c9d5586bb676db562a83b18b5a1cd22e4c6a2597826670b4e984` |
| C7 | `find android/ai/skill-provider -type f | sort | xargs shasum -a 256`（复核前后） | 0 | `diff` 为空：26 个文件逐字节一致 |
| C8 | `python3` 遍历 `android/ai/skill-provider/**/*.json` | 0 | 22 个 JSON 全部可解析 |
| C9 | Kotlin 最小复现（kotlin-compiler-embeddable 2.4.20）：companion 扩展属性必须显式 import | 1 / 0 | 缺 import → `unresolved reference 'systemBars'`；加 import → 0（§9.3） |
| C10 | `javap` 核对 foundation-layout 1.12.1 的 `WindowInsets` ABI 形状 | 0 | `systemBars` 是 `WindowInsets_androidKt` 里的 static getter（Companion 扩展），Companion 自身无成员（§3.2） |

> 说明：本报告**没有**执行 Gradle/native compile、截图、UI 或真机——这既是任务边界，也是基线条件所致（仓内无 `:demo`，且 `:wisdom-ui` 无 `activity-compose` 依赖）。因此本报告不对 native compile 给"通过"结论，只复核"未执行/blocked"记录的真实性与模板的可编译性。

### 1.3 证据保全

- C7 的 `sha256` 清单在复核开始与结束各存一份（`/tmp/t3-provider-before.sha256` / `/tmp/t3-provider-final.sha256`），`diff` 为空。
- C3 的检查器位于 `/tmp`（未提交、未写入仓库），其 47 项检查清单与失败项在 §9.2 逐项登记，可据此重写或人工复核。
- 复核开始时读到的 dist 旧快照（含模板验证条目）已被 R4 的重建覆盖；其可审计记录见 `review/04-pipeline.md` §2.2（旧 `platforms/android/verification.json` 哈希 `2ffe0d…`，现 `f122b1…`），与 §4.3 的结论一致。

### 1.4 本报告不覆盖

- 不覆盖 dist 打包/checksums/ZIP 安全（R4 范围；本报告只引用其 §2.2 的旧 dist 哈希作为交叉证据）。
- 不覆盖 iOS（R2）、Core/契约（R1）、M5 评测（R4）。
- 不覆盖设计评审与真机行为（本轮无设备、无消费方 App，均为 not-run）。

---

## 2. Provider 复核

### 2.1 17 张 API 卡清单与交叉证据（逐卡）

| # | 卡 | 类别 | 源码锚点（来源文件#行，脚本核对行内容） | evidence | ABI 基线内是否有该符号 |
| --- | --- | --- | --- | --- | --- |
| 1 | WDButton | 组件 | `components/primitives/WDButton/WDButton.kt#L56` | discovered | ❌ 无（组件 ABI 0 个） |
| 2 | WDIconButton | 组件 | `…/WDIconButton/WDIconButton.kt#L49` | discovered | ❌ |
| 3 | WDTextField | 组件 | `…/WDTextField/WDTextField.kt#L189` | discovered | ❌ |
| 4 | WDSwitch | 组件 | `…/WDSwitch/WDSwitch.kt#L95` | discovered | ❌ |
| 5 | WDCheckbox | 组件 | `…/WDCheckbox/WDCheckbox.kt#L76` | discovered | ❌ |
| 6 | WDBadge | 组件 | `…/WDBadge/WDBadge.kt#L32` | discovered | ❌ |
| 7 | WDAvatar | 组件 | `…/WDAvatar/WDAvatar.kt#L55` | discovered | ❌ |
| 8 | WDDivider | 组件 | `…/WDDivider/WDDivider.kt#L25` | discovered | ❌ |
| 9 | WDCard | 组件 | `…/WDCard/WDCard.kt#L112` | discovered | ❌ |
| 10 | WDListRow | 组件 | `…/WDListRow/WDListRow.kt#L90` | discovered | ❌ |
| 11 | WDIcon | 组件 | `…/WDIcon/WDIcon.kt#L27` | discovered | ❌ |
| 12 | WDTheme | 基础入口 | `foundation/theme/WDTheme.kt#L51` + ABI `#L202` | discovered | ✅ 有（仅 2 参重载；7 参重载不在基线） |
| 13 | WDSemantics | 基础入口 | `foundation/accessibility/WDSemantics.kt#L10` | discovered | ❌ |
| 14 | WDHaptics | 基础入口 | `foundation/accessibility/WDHaptics.kt#L26`（**锚点是 @Composable 行**，声明在 L27，F-08） | discovered | ❌ |
| 15 | WDAnnouncer | 基础入口 | `foundation/accessibility/WDAnnouncer.kt#L45`（`wdLiveRegion`） | discovered | ❌ |
| 16 | WDLayout | 基础入口 | `foundation/layout/WDLayout.kt#L19` | discovered | ❌ |
| 17 | WDMotionScale | 基础入口 | `foundation/theme/WDMotionScale.kt#L30` | discovered | ❌ |

核对结果（C3 脚本）：

- **11/11 组件卡的 `signature` 参数逐个能在同目录 Kotlin 源码的 `public fun <Component>(` 参数表中找到**；17/17 卡的 `callShape` 命名参数均能在源码/签名中找到（无"编造参数"）。
- 11 张组件卡的第二条 sourceRef 统一指向 `wisdom-ui/api/wisdom-ui.api#L194`（`WDTheme` 类锚点），note 明确写"component symbols not yet present"——**ABI 锚点不是该组件的符号**，只能证明"基线里没有组件"。该披露是诚实的，但把 `WDTheme` 类行当作组件卡的第二证据会削弱可读性（F-13，low）。
- 5 个基础入口卡（WDSemantics/WDHaptics/WDAnnouncer/WDLayout/WDMotionScale）都没有 ABI sourceRef，也没有"ABI 中不存在"的 limitations——与事实相符（ABI 里确实没有），但**与"ABI 交叉证据"的总体措辞存在强度差**（§2.5/F-13）。

### 2.2 签名与调用形态（已通过项 + 低严重度缺口）

| 检查 | 结果 |
| --- | --- |
| 11 组件卡签名参数 ⊆ 源码 `public fun <C>(` 参数表 | ✅ 11/11 |
| 17 卡 callShape 命名参数 ⊆ 源码签名/重载 | ✅ 17/17（`WDLayout` 的 `WDTheme(layout=…)` 对应 7 参重载，合法） |
| 组件卡限制写明"ABI 无组件符号、未编译" | ✅ 11/11 |
| WDSwitch/WDCheckbox canonicalParam（`on`/`checked`）与 AGENTS §6 #15 一致 | ✅ |
| 卡是否为每个 public 重载建卡 | ⚠️ 否：`WDSwitch` 有 2 个重载、`WDCheckbox` 有 3 个重载，各只有 1 张主卡（F-09，low） |
| 签名是否完整 | ⚠️ `WDTextField` 卡签名在 schema 的 500 字上限处被截断（尾部落到 `keyboardActions` 之后丢失，F-09，low） |

### 2.3 计数："23 张"从哪来、为什么错

| 事实 | 值 | 证据 |
| --- | --- | --- |
| 磁盘卡文件（不含 index） | **17** | `ls android/ai/skill-provider/api/cards/*.json` → 18，减 index.json |
| `index.json.cards` 条目 | **17** | 与 capabilities.componentCoverage.experimental 完全一致 |
| JSON 文件总数 | 22（17 卡 + index + provider + capabilities + verification + template manifest） | C8 |
| validator 结束行打印 | **23**（`WROTE 23 api cards`） | C1 输出 |
| t7 output / 任务 commandsRun | "23 张 API 卡（11 个组件 + 6 个基础入口；共 21 个 JSON 文件…）"、"generated 23 cards" | `.agent-teams/archive/wisdom-ai-skill/team.json` t7；`inbox/captain.jsonl` 2026-11-21 18:31 消息 |
| t8 output | "provider validator 通过（23 cards）" | 同上 t8 |
| 打包前 dist 的 verification.json | "…（23 cards written）"（旧哈希 `2ffe0d…`） | 复核开始时读取；R4 `review/04-pipeline.md` §2.2 记录旧哈希 |
| 当前 dist manifest | `apiCardFiles: 18`（把 index.json 也算成卡） | §4.3 |

**根因（可复现）**：`validate-provider.js`

```js
// L53：componentNames 已经包含 6 个 functionCards 的 component
const componentNames = Object.keys(sourceEvidence).concat(functionCards.map(x => x.component));
…
// L72：又加了一次 functionCards.length → 11+6 + 6 = 23
console.log('WROTE', componentNames.length + functionCards.length, 'api cards at', rel(cardsDir));
```

**结论**：t7 的"23 张"是 validator 控制台计数 bug 造成的**转发错误**，不是 17 张卡被伪造（卡本身真实存在且可溯源）。R3 任务描述里的"23 张 API 卡"应更正为 **17 张**；R5 报告不得沿用 23。

### 2.4 status / coverage / capabilities

**status（provider.json）**

- `status.effective = declared = experimental`（provider.json:21–23）；`reason` 明确说 "no example/template compile or native UI matrix was executed"；`evidenceRefs` 指向 index/capabilities/verification。
- 17/17 卡 `evidence=discovered`；`componentCoverage.verified=[]`；`unsupportedBehavior.forbidden` 含 `fabricate-api/fake-verified/bypass-test/cross-repo-write`。**未冒充 verified ✅**。
- ⚠️ `status.computedAtBuild: true` 实为 `validate-provider.js:63` 硬编码写出的常量（不是根据证据重算），取值保守（experimental）所以无冒充风险，但与 `status-policy.md`"effective 必须由构建器根据证据重算"的语义有差距（F-14，low）。

**componentCoverage（capabilities.json:158–207）**

| 集合 | 数量 | 与 37 组件目录的关系 |
| --- | --- | --- |
| specOnly | 26 | 26/26 均属于 37 组件目录，且源码无实现目录（逐项核对） |
| experimental | 17 | 其中 11/17 是 37 组件目录中的 M2 组件；另 **6 个是非组件 foundation API**（WDTheme/WDSemantics/WDHaptics/WDAnnouncer/WDLayout/WDMotionScale） |
| verified | 0 | 空 |
| unsupported | 0 | 空（不虚构"平台不支持"） |

> 37 = 11 + 26 的划分**完全覆盖且不重不漏**；额外 6 个 foundation API 被并入 componentCoverage.experimental，使总数看起来是 43，容易被组件查询误读为"43 个组件"（F-10，low）。**未实现组件是否标 spec-only/unsupported：已标 spec-only（26 个），未发现漏标或错标 unsupported。**

**capabilities 8 组（sourceRefs 全部行号可解析；仅列状态与 notVerified 要点）**

| 组 | status/evidence | 关键内容（均已对照源码/构建配置） |
| --- | --- | --- |
| runtime | supported/discovered | compileSdk 36、minSdk 24、AGP 8.13.2、Kotlin 2.4.20、BOM 2026.06.01、jvmTarget 17、namespace、artifact 均与 `build.gradle.kts`/`libs.versions.toml` 一致；notVerified: native compile/runtime |
| navigation | not-verified/contract-only | systemBack/predictiveBack = spec-only；源码 grep 证实库内无 `BackHandler`/`OnBackPressed` |
| layout | partial/discovered | WindowInsets 只有 Gradle 白名单任务、无公开组件 API；IME = spec-only（源码无 `imePadding`/`WindowInsets.ime`）；touchTarget=48dp（`WDTouchTarget.kt:21`） |
| typography | partial/discovered | fontScale 断点 1.3（`WDTokens.kt:393`）、`WDTextStyle.toTextStyle()`（`WDTextMetrics.kt:10`）；行盒/长文未验证 |
| input | partial/discovered | `WDTextField.kt:189` 状态提升；IME/键盘矩阵未验证 |
| accessibility | partial/discovered | `WDAnnouncer`（`View.announceForAccessibility`）、`WDHaptics`、`WDSemantics`；TalkBack 矩阵未验证 |
| rendering | partial/discovered | `WDEffectsBudget`、`WDTheme` budget 注入、`WDBadge` 渐变；Android 12+ glass 未验证；源码无 `WDGlass` 实现，与"no system blur capability resolution"一致 |
| verification | not-verified/contract-only | 列出 3 条本仓可用命令；native compile/单测/ABI drift/截图/consumer/design review 全标未验证 |

**结论**：能力画像"未实现即 spec-only/not-verified"的口径真实；没有把 IME/返回/TalkBack/玻璃的未执行写成 supported。

### 2.5 ABI 基线事实（为什么"ABI 交叉证据"只有 1/17）

- `android/wisdom-ui/api/wisdom-ui.api` 共 211 行；该文件最后一次随提交修改是 `97c9425`（2026-10-07，令牌/M0 文档提交）；当前 android HEAD 是 `3656d6f`（M2，2026-11-21），**M2 的 11 个组件与 icons/foundation 新 API 没有进 ABI 基线**（apiDump 未随 M2 提交）。
- 基线内容：12 个 generated token 类 + `WDTheme`（object）+ `WDThemeKt`（2 参 `WDTheme`）+ `WDGradientKt`。
- **组件符号 0 个**；17 张卡涉及的基础入口中，只有 `WDTheme` 在基线里；`WDSemantics/WDHaptics/WDAnnouncer/WDLayout/WDMotionScale/WDIconName/WDIconSet` 均不在基线。
- 因此：卡片 limitations 的"Component symbols are absent from the current ABI baseline"**为真**；但 `verification.json` 的 "ABI baseline checked for foundation symbols" 与 `provider.status.reason` 的 "…ABI baseline were cross-checked" 措辞偏宽——实际只有 `WDTheme` 1 张卡能对 ABI 交叉（F-13，low）。这不是伪造，但 R5 应写"source-primary, ABI 仅 WDTheme 可交叉"。

---

## 3. Compose 黄金模板与 manifest 一致性

### 3.1 结构一致性（通过项）

| 检查 | 结果 |
| --- | --- |
| `templateId` | manifest `ai-skill-android-task-list-v1`；模板头部注释含同值 ✅ |
| `targetPackage` vs 模板 `package` | `io.github.wlunc.wisdom.ai.skill.generated` ✅ |
| 编辑标记 | manifest 声明 `BUSINESS_EDIT_BEGIN/END`，模板 `// BUSINESS_EDIT_BEGIN…` / `// BUSINESS_EDIT_END` 均在 ✅ |
| imports 集合 | manifest 39 = 模板 39，集合完全相等（无缺、无多）✅ |
| 四状态 | manifest mapping 有 `state.loading/content/empty/error`；Kotlin enum 有四态；`when(state)` 四分支 ✅ |
| pageSpecRef | 指向 `wisdomdesign/ai/skill/page-spec/examples/task-list.valid.json`；该文件存在，`validate-spec.js` exit 0 / `valid=true` ✅ |
| spec 四状态/导航/区域 | spec states = loading/content/empty/error；navigation=tabRoot 有映射；`WDListSection/WDFAB` 属 spec-only 且模板不构造它们，替换方案有 mapping ✅（tabRoot 无 Tab 栏实现，见 F-05 说明） |
| 只使用公开 API | 模板只 import `io.github.wlunc.wisdom` 的 public 入口；无 internal；11 个组件 import 全部有卡 ✅ |
| 受限依赖 | 模板用 `androidx.activity.compose.BackHandler`；`:wisdom-ui` 无 `activity-compose` 依赖、仓内无 `:demo` → **编译 blocked 的声明为真**（但不止这一个原因，见 F-03） |

### 3.2 **F-03（high）：模板缺少 `systemBars` 导入，编译必失败**

`TaskListScreen.kt:91`：

```kotlin
.consumeWindowInsets(WindowInsets.systemBars)
```

模板的 import 列表里只有 `androidx.compose.foundation.layout.WindowInsets` 与 `consumeWindowInsets`，**没有 `androidx.compose.foundation.layout.systemBars`**。而 `systemBars` 在 Compose foundation-layout 里是 `WindowInsets.Companion` 的**扩展属性**：

- `javap` 核对（本地缓存 foundation-layout 1.12.1；1.11.4 形状相同）：`WindowInsets$Companion` 没有任何成员；`WindowInsets_androidKt` 中有 `public static final WindowInsets getSystemBars(WindowInsets$Companion, Composer, int)`。
- Kotlin 语言规则：companion 扩展属性必须被显式 import；仅 import 接收者类型不够。用 kotlin-compiler-embeddable 2.4.20 做最小复现（§9.3）：不 import → `error: unresolved reference 'systemBars'`（exit 1）；加 import → 通过（exit 0）。

**后果**：即使把 `activity-compose` 加入构建、并建出消费方 App，模板仍会在 `WindowInsets.systemBars` 处编译失败。`verification.json`（旧 dist 版本）把 blocked 原因写成"缺 activity-compose + 无 :demo"，**低估了阻塞原因**。模板的 "imports 集合相等" 自检只比较"manifest 列表 vs 模板 import 行"，**无法发现漏 import 的符号**——这是自检设计缺口。

### 3.3 行为层问题（模板内容）

| # | 问题 | 证据 | 严重度 |
| --- | --- | --- | --- |
| F-04 | **Content 态主操作未接线**：page spec `primaryAction=createTask`，但 Content 分支的 `WDIconButton` 是 `onClick = {}`，`TaskContent` 也没有接 `onPrimaryAction`；只有 Empty 态接了 | `TaskListScreen.kt:99`（`TaskContent(tasks, selectedIds)` 未传回调）、`:135`（`onClick = {}`）、`:103/:144` | medium |
| F-05 | **无障碍播报与 page spec 不一致**：spec announcements 是"任务列表已加载"/"任务已创建"，模板根节点恒定 `wdLiveRegion(stateDescription = "任务列表加载中")`，并在"切换任务选中"时播报 `CREATE_LABEL`（"新建任务"）；语义与场景不匹配 | `TaskListScreen.kt:94`、`:101`；page spec `accessibility.announcements` | medium |
| — | 模板的 `Text` 使用 material3 默认字体（未应用 WDType/WDTextStyle）；`page.navigation=tabRoot` 只映射到 BackHandler，没有 Tab 栏替代（`WDTabBar` 是 spec-only，映射已声明"no bottom-tab API is fabricated"），"底部不被 Tab 栏遮挡"无法验证 | `:23`、`:98`、`:118` 等；manifest mapping | 设计评审项（not-run，不单列 finding） |

### 3.4 两个自检脚本的差异

- t8 声称的"模板静态检查通过（templateId/编辑标记/imports 全等/四状态/pageSpecRef/unverified）"——我重写的检查器**复现了这些检查且全部通过**（§9.2）；说明 t8 的静态检查本身没造假，只是**覆盖不足**（漏符号级导入解析/漏主操作接线/漏播报一致性）。
- 我的 47 项检查中 14 项 FAIL，逐项映射见 §9.2；全部落到 §6 的 findings。

---

## 4. verification.json 真实性复核（任务指定项）

### 4.1 逐项核对（当前源文件 `android/ai/skill-provider/verification.json`，1948 B）

| 要求 | 当前记录 | 判定 |
| --- | --- | --- |
| native compile blocked | **未显式记录**。`notExecuted` 只有 `android-build`（理由："Provider task is read-only … does not run native compile"）与 `unverified: native compile`；没有"模板编译尝试 → blocked"条目，也没有 `exitCode/blocked` 状态 | ❌ 不构成"blocked"记录（F-02） |
| 截图 | `notExecuted: android-screenshot`（"No screenshot/UI matrix"）；`unverified: screenshot/UI matrix` | ✅ |
| 字体（fontScale） | `unverified: fontScale 1.3 runtime` | ✅ |
| IME | `unverified: IME overlay` | ✅ |
| 返回 | `unverified: predictive back`（system back 仅在 capabilities.navigation 标 spec-only） | ✅（预测式返回；系统返回见 capabilities） |
| TalkBack | `unverified: TalkBack focus order/labels` | ✅ |
| 四状态 runtimeMatrix | **无 `runtimeMatrix` 字段**（loading/content/empty/error 的 not-run 未记录） | ❌（F-02） |
| 模板静态检查 | **无该条目**（executed 只有 source-abi-crosscheck / provider-schema-check） | ❌（F-02） |
| 无伪造"通过" | executed 只有 source/schema 两条 passed，没有任何 compile/build/screenshot 的 passed | ✅ |
| 采集时间 | `capturedAt = 2026-11-21T18:20:14+08:00` | ❌ 硬编码（F-06） |

### 4.2 F-02：模板验证记录在最终源中丢失（medium）

证据链：

1. `validate-provider.js:66–67` 每次运行都用**硬编码对象**重写 `verification.json`（executed 只有 2 条、无模板条目）。
2. 复核开始时读到的 **打包前 dist** 的 `platforms/android/verification.json`（R4 记录旧哈希 `2ffe0d…`）含：
   - `template-static-check`（passed，evidence: "templateId present, BUSINESS_EDIT markers present, imports match manifest, four states present, pageSpecRef exists, unverified list non-empty (2026-11-21)."）
   - `template-native-compile`（**status: blocked**，exitCode null，evidence 说明 activity-compose/:demo 缺失）
   - `runtimeMatrix`（loading/content/empty/error/light/dark/fontScale135/keyboardOverlay/predictiveBack/talkBack/screenshot 全部 `not-run`）
   - `unverified` 首项为 "native compile of golden template"
3. 源 `verification.json` 的 mtime 是 **2026-11-21 18:48:38**（晚于 t8 模板文件 18:37/18:47、也晚于打包 18:40），内容 = validator 硬编码输出（当前哈希 `f122b1…`）；旧 dist 哈希 `2ffe0d…` 对应的是**含模板条目的版本**（R4 §2.2 哈希记录 + 本轮复核开始时读取内容）。
4. 结论：打包前 dist 的 verification.json（哈希 `2ffe0d…`）确实含有上述模板条目，因此 t8 的"已在 verification.json 如实记录 blocked"与当时（至少是打包时点）的工件一致；但当前源工件不成立——**18:48:38 的一次 validator 重跑覆盖掉了这些手工/模板证据**，此后任何重跑（包括本轮 C1）都会再次覆盖。**生成器与校验器合一是根因**。旧 dist 已被 R4 重建为当前源版本，包内模板证据只剩 package manifest 的 `nativeVerification: "template static-only; native compile blocked by missing consumer app/dependency"`（不足以替代逐项记录）。

### 4.3 dist 与 R4 交叉

- R4 记录：旧 dist android `verification.json` 哈希 `2ffe0d…` → 当前 `f122b1…`；文件 mtime 18:48:38 晚于 dist 18:40；结论"dist 是陈旧 dirty snapshot"。
- 本报告补充：旧 dist 的模板条目内容我在复核开始时读到（10:12 前后），与 R4 的哈希事实一致；重建后当前 dist 的 android verification 与源一致（1948 B，executed 仅 2 条），**模板的 blocked/runtimeMatrix 证据在包内消失**（只剩 package manifest 的一行声明）。R4 的 manifest schema 缺口（缺 `versions` 等）也会让 `versions.templates.android` 无法与 `templateId` 对齐——这属 R4 范围，但会削弱模板证据的可审计性。

### 4.4 F-06：capturedAt 硬编码

`verification.json:4` 的 `capturedAt` 与 `validate-provider.js:66` 的字符串完全一致；它在 2026-11-21 18:20:14 就被写死，**早于模板文件（18:37/18:47）与本轮重跑（10:14）**。这不是真实采集时间，属于证据时间戳失真（不影响"未执行"结论，但影响审计）。

---

## 5. Android tracked 源码与 ABI 零改动

| 检查 | 命令/证据 | 结果 |
| --- | --- | --- |
| tracked 变更 | `git -C android status --porcelain --untracked-files=no` | 空（0 行）✅ |
| HEAD | `git -C android rev-parse HEAD` | `3656d6ff8ae83cfd07166dd7fe85db489ef61110`（M2 提交；也是 `ai/skill/m0/baseline.json` 记录的 android commit，capturedAt 2026-11-21T18:13；未新增提交）✅ |
| ABI 基线 | `shasum -a 256 android/wisdom-ui/api/wisdom-ui.api` 复核前后 | 均 `06b24043…` ✅ |
| provider 文件 | 26 个文件 sha256 清单复核前后 `diff` | 空（validator 重写为幂等）✅ |
| 未跟踪文件 | `git -C android status --porcelain --untracked-files=all` | 全部 26 个在 `ai/skill-provider/` 内，无其它污染 ✅ |
| 近期构建 | `android/{build,wisdom-ui/build}` mtime | 2026-10-03/10-04（早于本轮，无 native compile 产物）✅ |
| 内容哈希 | `validate-provider.js` 断言 commit=baseline + clean worktree，输出 `clean hash 32c714a6fbf5` | 与 `provider.json.source.contentHash` 一致 ✅ |

**边界 nuance（F-12，low）**：provider 的 `source.dirty=false` 只表示 **tracked** 干净；provider 目录本身在 android 仓内是 **untracked**（26 个文件），所以 R4 的 package manifest 记录 `sources.android.dirty=true`。两者不矛盾，但"dirty"语义需要在报告里写清；此外 provider 的 `contentHash` 采用与 M0 `trackedContentHash` 不同的哈希表达式（t7 已披露），无法与 M0 基线哈希逐字对比。

---

## 6. Findings（按严重度）

### F-03（high）模板缺 `systemBars` 导入 → 编译必失败
- 文件：`android/ai/skill-provider/templates/task-list/TaskListScreen.kt:91`（imports 见同文件 6–44；manifest imports 见 `task-list.manifest.json:15–53`）
- 问题：`WindowInsets.systemBars` 是 companion 扩展属性，未 import `androidx.compose.foundation.layout.systemBars`；javap + kotlin 2.4.20 最小复现证实 `unresolved reference`。模板从未编译（blocked），静态"imports 集合相等"检查漏掉了漏导入。
- 所需修复：加 import 并同步 manifest imports；在模板静态检查中加入"符号级导入解析"（或最小编译例）；不得把 blocked 原因只写成 activity-compose/:demo。

### F-01（medium）"23 张 API 卡"为错误计数
- 文件：`android/ai/skill-provider/tools/validate-provider.js:53,72`；报告侧 `.agent-teams/archive/wisdom-ai-skill/team.json` t7/t8
- 问题：`componentNames` 已含 6 个 functionCards，L72 再加一次 → 23；实际 17。
- 所需修复：L72 改为 `componentNames.length`（或直接 `cards.length`）；R3/R5 报告更正为 17；dist manifest 的 `apiCardFiles` 不要包含 index.json。

### F-02（medium）模板验证记录在最终源 verification.json 中丢失
- 文件：`android/ai/skill-provider/verification.json`；根因 `tools/validate-provider.js:66–67`（生成器覆盖）
- 问题：当前源没有 template-static-check / template-native-compile blocked / runtimeMatrix；t8 的"已在 verification.json 如实记录 blocked"对当前工件不成立；旧 dist 快照（哈希 `2ffe0d…`）有这些字段，但 18:48:38 被 validator 覆盖。
- 所需修复：把"生成"与"校验"拆开（validator 只读/只校验，或 merge-only）；将模板验证条目作为受控补充文件（如 `verification.template.json`）并纳入打包；至少在 `verification.json` 重新写入 blocked + runtimeMatrix。

### F-04（medium）Content 态主操作未接线
- 文件：`android/ai/skill-provider/templates/task-list/TaskListScreen.kt:99,135`（`onPrimaryAction` 仅在 Empty 态 `:103/:144`）
- 问题：page spec `primaryAction=createTask` 在 Content 态点击无动作（`onClick = {}`）。
- 所需修复：`TaskContent` 增加 `onPrimaryAction` 并传给 `WDIconButton`；静态检查加"mapping 中声明的动作在每一适用状态有接线"。

### F-05（medium）无障碍播报与 page spec 不一致
- 文件：`TaskListScreen.kt:94,101`；`wisdomdesign/ai/skill/page-spec/examples/task-list.valid.json` announcements
- 问题：恒定 `stateDescription="任务列表加载中"`；选中切换播报"新建任务"（CREATE_LABEL），与 spec 的"任务列表已加载/任务已创建"不一致；TalkBack 未运行，无法用运行证据弥补。
- 所需修复：按 spec announcements 注入（由调用方传文案，库内零文案口径不变）；或把播报差异登记为显式 deviation 并列入 unverified。

### F-06（medium）`capturedAt` 是硬编码常量
- 文件：`verification.json:4`；`validate-provider.js:66`
- 问题：时间戳早于模板文件与本轮重跑，不是真实采集时间。
- 所需修复：运行时生成时间戳，或改名 `generatedByTemplateAt` 并注明非采集时间；若为确定性构建而固定时间戳，需在字段附近注明。

### F-07（low）模板 6 个未使用 import
- 文件：`TaskListScreen.kt:8,10,15,20,27,34`（`Box`/`Row`/`fillMaxWidth`/`width`/`remember`/`dp`）
- 问题：manifest imports 与模板 import 行"全等"只证明文本一致，不证明使用；Kotlin 仅告警不阻塞。
- 所需修复：删除未使用 import（并同步 manifest），或把"import 使用率"纳入静态检查。

### F-08（low）WDHaptics 卡 sourceRef 锚点不精确
- 文件：`api/cards/WDHaptics.json` sourceRefs；`WDHaptics.kt:26/27`
- 问题：锚点 `#L26` 是 `@Composable` 行，声明在 L27（validator 用 `@Composable` 当 needle）。
- 所需修复：函数卡 needle 改为实际函数名（`rememberWDHaptics`），重新生成。

### F-09（low）卡签名截断与重载覆盖不足
- 文件：`api/cards/WDTextField.json`（500 字上限截断）；`WDSwitch.kt:95`（2 重载）、`WDCheckbox.kt:76`（3 重载）
- 问题：WDTextField 卡签名尾部丢失；WDSwitch/WDCheckbox 各只有 1 张主卡（iOS 以多卡保留重载）。
- 所需修复：把签名上限改为 1000 或按参数表结构化；为重载补卡或写 limitations 列明。

### F-10（low）componentCoverage 混入非组件 foundation API
- 文件：`capabilities.json:187–206`
- 问题：17 experimental 中 6 个不是 37 组件目录成员，coverage 合计 43，易被组件查询误读。
- 所需修复：拆分 `componentCoverage` 与 `foundationCoverage`，或在字段中文档化"非组件入口"。

### F-11（low）templates/README 与交付状态矛盾
- 文件：`templates/README.md:3`（"no template is fabricated here"）；`validate-provider.js:71` 每次重写
- 问题：模板已存在，README 是过期生成内容。
- 所需修复：更新 README 或停止生成该文件；静态检查加"README 与目录内容一致性"。

### F-12（low）dirty/contentHash 语义与仓级状态不一致
- 文件：`provider.json:10–11`（`dirty=false`、`contentHash=32c714…`）；R4 package manifest `sources.android.dirty=true`
- 问题：provider 以 tracked-only 计算 clean，但目录在 android 仓内 untracked；M0 `trackedContentHash` 与本 provider 的表达式不同。
- 所需修复：在 provider.source 中分别记录 `trackedDirty`/`worktreeDirty` 与哈希表达式；打包 manifest 记录 `contentHash`（R4 已建议）。

### F-13（low）ABI 交叉证据的措辞与检测逻辑偏宽
- 文件：`verification.json:12–16`、`provider.json:24`；`validate-provider.js:50`（`if(!abiText.includes('Lio/…/components/'))`）
- 问题：ABI 实际只有 `WDTheme` 1 张卡可交叉；validator 的组件存在性判断用 `Lio/` 前缀，而 .api 文本无 `L` 前缀 → 该条件恒真（limitation 恒加），无法在 ABI 更新后自动识别；ABI 基线还是 M0 的旧基线（早于 M2），报告未写明其年龄。
- 所需修复：把条件改为 `io/github/…/components/`；在卡片/报告写明"ABI baseline = 97c9425 (M0)，M2 未 apiDump"。

### F-14（low）`status.computedAtBuild` 不是计算值
- 文件：`provider.json:21–30`；`validate-provider.js:63`
- 问题：effective 由脚本常量写出，非按 evidence 重算；与 status-policy"由构建器重算"有语义差距（取值保守，无冒充风险）。
- 所需修复：实现最小重算函数（按 card evidence/矩阵执行状态推导 effective），或把字段改为 `assertedAtBuild`。

---

## 7. 未验证与阻塞（R5 报告应原样引用）

| # | 项 | 状态 | 证据/责任 |
| --- | --- | --- | --- |
| B-1 | Android 最小调用例编译（M3-3） | **未交付/未执行**：仓内无 Android `:demo`/AIStarter/最小调用例；provider 无 `example-compiled` 卡 | golden matrix `apiEvidenceMinimum=example-compiled`；t7/t8 未产出该件 |
| B-2 | 黄金模板 native compile | **blocked**：缺 `activity-compose` 依赖、无 `:demo`，且模板另有 F-03 编译错误 | `verification.json` 旧 dist 条目 + 本轮静态核对 |
| B-3 | ABI drift 命令（`apiDump && git diff --exit-code`） | **未执行**：基线是 M0 的 `97c9425`，M2 未 apiDump | `verification.json.notExecuted` |
| B-4 | 四状态截图 / 浅深色 / 长短文 / UI 矩阵 | **not-run** | `manifest.unverified`、旧 dist runtimeMatrix |
| B-5 | fontScale 1.3 运行时 | **not-run** | `verification.json.unverified` |
| B-6 | IME / 键盘避让 | **not-run** | 同上 |
| B-7 | 系统返回 / 预测式返回 | **not-run**（capabilities 标 spec-only/not-verified） | capabilities.navigation |
| B-8 | TalkBack 焦点顺序与标签 | **not-run** | `verification.json.unverified` |
| B-9 | 独立设计评审 | **not-run** | `manifest.unverified` |
| B-10 | 宿主加载（R4） | **未执行** | R4 报告 §6 |

**M3 Android 出口结论**：t7/t8 的产物真实存在、状态诚实（experimental/not-run），但 M3 出口所需的"编译 + 规定矩阵 + 设计评审"没有闭合；应记为 **partial/blocked**，不得写成"完成/已验证"。

---

## 8. 对 R5 的建议表述

1. 计数：**17 张 API 卡（11 组件 + 6 基础入口）**；不要引用"23"。
2. t7：Provider/capabilities/verification 真实生成，17 卡均有 Kotlin sourceRef、11/11 组件签名可回溯、ABI 仅 `WDTheme` 可交叉；status=experimental；**未编译**；verification 的 blocked/runtimeMatrix 记录在最终源中丢失（F-02）。
3. t8：模板与 manifest 结构一致性成立（templateId/imports 集合/四状态/pageSpecRef），但存在 **F-03（编译错误）**、F-04（主操作未接线）、F-05（播报不一致）；template native compile blocked 且 blocked 原因不完整。
4. M3 Android 判定：**partial / blocked**；证据等级 = discovered（无 example-compiled/template-verified）。
5. 边界：Android tracked 源码与 ABI 零改动成立（本轮与 t7/t8 均成立）；provider 交付物在 android 仓内是 untracked，release-kind 判定应参考 R4 的 dirty 结论。
6. 风险：generator 与 validator 合一导致手工验证证据易被覆盖；模板静态检查覆盖不足会放过编译错误；这些是流程级风险，建议在 M6/后续修复。

---

## 9. 附录：命令输出与关键证据

### 9.1 C1 `validate-provider.js` 输出（2026-11-22 10:14 重跑）

```text
PASS source baseline commit and clean tracked worktree
PASS baseline Android 3656d6ff8ae83cfd07166dd7fe85db489ef61110 clean hash 32c714a6fbf5
PASS schema api-card WDButton
…（17 张卡逐张 PASS）…
PASS schema card index
PASS schema capabilities
PASS schema provider
WROTE 23 api cards at android/ai/skill-provider/api/cards
EXIT=0
```

（"WROTE 23" 是 F-01 的计数 bug；磁盘实际 17 张 + index。）

### 9.2 C3 静态检查器（47 项，33 PASS / 14 FAIL）

失败项 → finding 映射：

| 失败检查 | finding |
| --- | --- |
| WDHaptics sourceRef 行是 `@Composable` 而非声明 | F-08 |
| WDSwitch 2 / WDCheckbox 3 重载各 1 卡 | F-09 |
| WDTextField 卡签名 500 字截断 | F-09 |
| `WindowInsets.systemBars` 未导入 | **F-03** |
| manifest imports 中 6 个未被模板使用 | F-07 |
| Content 态未接 `onPrimaryAction` | F-04 |
| 模板存在 `onClick = {}` | F-04 |
| 播报文本不在 page spec announcements | F-05 |
| liveRegion 文案不在 page spec announcements | F-05 |
| verification 无 template static check | F-02 |
| verification 无 template compile blocked | F-02 |
| verification 无 runtimeMatrix | F-02 |
| `capturedAt` 硬编码 | F-06 |
| templates/README 与目录内容矛盾 | F-11 |

通过的 33 项覆盖：provider status/coverage/卡片数量与索引一致（17/17）、37 组件划分（11+26）、组件源码存在性、签名/调用参数可回溯、ABI 组件符号为 0、模板 package/templateId/标记/imports 集合/四状态/pageSpecRef/spec 校验/不可用组件不构造/公开 API/内部 API/组件卡覆盖/unverified 六关键词/verification 不伪造编译通过等。

### 9.3 Kotlin 复现：companion 扩展属性必须显式 import（kotlin-compiler 2.4.20）

```kotlin
// a.kt
package a
class A { companion object }
val A.Companion.systemBars: Int get() = 1

// b.kt（无 import a.systemBars）
package b
import a.A
fun f(): Int = A.systemBars          // → error: unresolved reference 'systemBars' (exit 1)

// c.kt（有 import a.systemBars）
package c
import a.A
import a.systemBars
fun f(): Int = A.systemBars          // → exit 0
```

Compose 侧对应的 javap 证据（foundation-layout 1.12.1）：

```text
WindowInsets$Companion: 无 systemBars 成员
WindowInsets_androidKt:
  public static final WindowInsets getSystemBars(WindowInsets$Companion, Composer, int)
```

### 9.4 哈希清单（关键文件）

| 对象 | sha256 |
| --- | --- |
| `android/wisdom-ui/api/wisdom-ui.api`（前后一致） | `06b240434600c9d5586bb676db562a83b18b5a1cd22e4c6a2597826670b4e984` |
| `provider.json` | `b8ea6759543502ef06a3997d641cef7657c46794340d3c465740ccee956e6694` |
| `capabilities.json` | `5bf59cca62364650f5991f0852dc875340eac5b68b1f7c7ca74aab99c6542af6` |
| `verification.json`（当前） | `f122b179a264a2b758feac48e9bdbad447769ef81ad47aadee282a6238104951` |
| `templates/task-list.manifest.json` | `a30a66895b94187667a32f783f3abe79834a483d5be3b887be14bb72f4d86e77` |
| `templates/task-list/TaskListScreen.kt` | `1dbfdd7294588fca7ac22ff2be9ef465df2099a010365acb6f38f16e78fac0e8` |
| `tools/validate-provider.js` | `e3bc33f59c779a51501afee2ea29ab318b98504967387ee21377b549f8dcc0a9` |
| provider 26 文件清单 | 复核前后 `diff` 为空（见 §1.2 C7） |

### 9.5 引用行号表（复核时以 grep/read 现查，非历史快照）

| 引用 | 内容 |
| --- | --- |
| `TaskListScreen.kt:91` | `.consumeWindowInsets(WindowInsets.systemBars)`（缺 systemBars 导入） |
| `TaskListScreen.kt:94` | `.wdLiveRegion(stateDescription = AISkillTaskListSeed.LOADING_LABEL)` |
| `TaskListScreen.kt:99` | `TaskContent(tasks, selectedIds) { … }`（未传 onPrimaryAction） |
| `TaskListScreen.kt:101` | `scope.launch { announcer.announce(CREATE_LABEL) }` |
| `TaskListScreen.kt:135` | `onClick = {}`（主操作空实现） |
| `validate-provider.js:53/72` | componentNames 包含 functionCards / WROTE 重复 +6 |
| `validate-provider.js:66–67` | verification.json 硬编码对象 + 覆盖写 |
| `validate-provider.js:71` | templates/README 每次覆盖写 |
| `verification.json:4` | `capturedAt` 硬编码 |
| `capabilities.json:158–207` | componentCoverage 四集合 |
| `provider.json:10–11,21–30` | dirty/contentHash/status |
| `api/cards/WDHaptics.json` | sourceRefs 锚点 `#L26` |
| `templates/README.md:3` | "no template is fabricated here" |

---

*本报告只写`wisdomdesign/AIOptimize/review/03-android.md`；未修改任何 Android tracked 源码、ABI 基线或 provider 交付物；未提交 git。报告中"通过/不通过"只针对列出的证据；所有 not-run/blocked 项均未被本报告补写为已执行。*
