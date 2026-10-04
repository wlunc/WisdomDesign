# 18 · WisdomDesign v1.0 评审总览与开工决策（单文档）

> 整合日期 2026-10-03 ｜ 覆盖：第一轮评审（`10`/`11`）+ 第二轮评审（`12`–`17`）
> 角色：架构师（15+ 年移动端架构）· 设计师（多年移动端设计）· 研发Leader（10+ 年 iOS/Android）｜ 独立核验：交叉复核 × 2 + 代码取证 × 1
> 性质：**这是整个 v1.0 评审的单文档入口**。结论判定以 [`17-conclusions-round2.md`](17-conclusions-round2.md) 为权威；本文负责把两轮结论、全部阻塞项、产品裁定与 M0 开工方案收在一处。
> **一句话**：设计语言与规格成熟可执行（两轮账目零翻案），但**评审结论至今零落地**；现有 **27 条阻塞项 + 3 条管理/验证项**必须在 M0 一次冻结修完。**产品已裁定：M0 = 2.5 周，总排期 13–14 周，中文字体不嵌入，Tab 未选标签改 `text.secondary`。**

---

## 1. 项目状态快照（2026-10-03）

| 维度 | 状态 |
| --- | --- |
| 设计稿 / 设计规格 / 设计要求 | ✅ **已定稿**：`docs/01`–`09` 全文 + `specs/01–03`（37 组件 + 5 配方，12 节模板 + 可勾选验收项）+ 4 个可视化产物 |
| 令牌真源 | ✅ 结构正确（原始 / 派生 / 语义三层），168 个叶子；`build.js --check` **exit 0** |
| 两端代码 | ⚠️ **仅到 M1 Foundation**：两端各 3 个手写源文件、**零组件、零 CI、零 lint、零截图基线** |
| 评审结论落地 | ❌ **零落地**：第一轮 13 条设计侧决议只兑现 1 条；9 条 M0 出口只满足 1 条 |
| 仓库卫生 | ✅ 三项已修（见 §8）；⚠️ 第一轮结论曾长期未入库，现已入库 |
| 基线快照 | `iOS 316b75f` / `android 524f5d6` / `wisdomdesign e495147` |

---

## 2. 评审方式与可信度

第一轮是"查账"（设计方自查 + 三方互评）；第二轮换了方法：**先立可复算的证据基线，再让三方各自背书，最后用不采信任何一方的独立核验去打。**

| 环节 | 产出 |
| --- | --- |
| 队长前置核验 | 三仓 git 状态、令牌逐一解析、`--check`、源码取证 |
| 三方独立复核（互相不可见） | `12-review-architect.md` · `13-review-designer.md` · `14-review-techlead-round2.md` |
| 独立交叉复核（不采信被复核稿数字） | `12-review-architect-peer.md`（需修订）· `13-review-designer-peer.md`（需修订） |
| 代码级取证 | `15-review-evidence.md`（14 行证据表 / V1–V16 / 10 条证据边界） |

**可信度证据**：第一轮 B1–B10 在两轮、四份独立复算下**零翻案**；27 组对比度值逐位吻合；第一轮 11 条落地状态条目"全部可复现、无例外"；15 处 `file:line` 逐条核对 0 处不符。

**纪律的代价（说明本轮不是橡皮图章）**：

- 架构师有 **1 组数字不可复现**（`--g-*` 引用 129/178/70，8 种 grep 口径都复现不出）→ 判"需修订"；
- 设计师有 **4 处证据被推翻**，另有 3 条立场与第一轮决议/产品裁定冲突；
- 研发Leader有 **2 处被复算出不同值**（`caption2 −0.13pt` 实测 `+0.045pt`；色晕净 α 23/16/6 实测 27.4/18.6/14.8）。

---

## 3. 核心结论

### 3.1 三方一致（可直接开工的部分）

| 结论 | 说明 |
| --- | --- |
| **设计方向站得住** | 温和蓝 / Liquid Glass / 家庭工具调性在浅色端成立；六个风格特征都能落到具体规格；**深色端除外**（见 B24） |
| **规格可执行度高** | 12 节模板 + 可勾选验收项 + "不要用"反例，是能当开发契约的规格 |
| **令牌分层是真的分层** | `color.su.*` 只作中性阶、`derived.*` 只由色卡派生、界面只准用 `semantic.*` |
| **第一轮账目可继承** | B1–B10 与 §3/§4 主要判断零翻案 |
| **两端骨架能承载令牌消费** | 但**不能承载组件 API 契约** —— 8 个形态现在不定就要 37×2 次返工 |

### 3.2 三方一致认为不可行的

| 项 | 判定 |
| --- | --- |
| **M0 = 1.5 周** | 三方独立判断**均不可行** → 已裁定**方案 A：2.5 周** |
| **9 条 M0 出口条件** | 1 条已满足、1 条不可执行、1 条连目标文件都没有、缺 Android `.api` → 重写为十条 |
| **串行 16–18 周** | 偏乐观 → **21–23 周**（或 P0 缩到 20 项） |
| **9 条质量门禁** | 只有"令牌生成一致"能真跑，其余全为纸面 → 快照回归 / 字面量 lint / iOS API 冻结**移出 M0** |

### 3.3 队长独立复算更正的第一轮口径（4 条，最重要）

| # | 第一轮口径 | 更正 |
| --- | --- | --- |
| 1 | `text.tertiary` "已裁定 `#4C616D`，最严口径 4.61" | **算错了最不利方向**：色晕把底色**压暗**（群青 42% 后 L=0.565 vs canvas 0.927），而 tertiary 是深字 → 最不利背景是**最暗色标**，实测 **3.80:1 ❌**。"4.61"对应一个比 canvas 更亮的底，浅色色晕里不存在 → **该值回退待定，由断言算法给首个达标值** |
| 2 | 玻璃"以 `material.*` 令牌为准" | **玻璃真源有四个**（`semantic.dark.surface.glass #0A1A288C` / `material.regular.fillDark #0C20389E` / `01 §7.2` 正文 62·62·82% / 画廊 `--g-glass`），**平台上跑的不是裁定值**；`--g-scrim` 有产物无令牌 |
| 3 | 两端漂移"含行高模型不一致" | **物理不一致有三条**：行高语义相反（追加量 vs 总量）+ 渐变几何 + **`motion.spring.*` 两端各丢不同字段**（iOS 丢 `stiffness`、Android 丢 `response`，自然频率差 1.16–1.34×） |
| 4 | 色晕"66% → 42%" | 口径未写清：**删掉预览 `opacity:.55` 只写 42% 会比现状更浓**（L 0.716~0.788 vs 现状 0.805），与用户三次"再浅一点"**反向** |

### 3.4 最严重的单一发现：评审对象与评审结论已脱钩

第一轮 13 条设计侧决议**只落地 1 条**（色卡 9 个）。更严重的是三条证据链断裂：

1. **画廊文字色不来自任何令牌** —— 三份画廊引用 `--wd-text*` 等 5 类变量**共 30 处、定义 0 处、无 fallback**（定义只在 `preview:1352-1357`）→ 第一轮"画廊浅深并排逐屏核对"看到的颜色是浏览器回落值；
2. **画廊是第三真源且未进生成器** —— `build.js:474-477` 只有 2 个 target，4 个 HTML 的 `50/35/36/29` 条变量全为手写，已漂移（`--g-text3` 仍是 B10 修复前的旧值、`--g-glass` 取的是 `glass-strong` 的值）；
3. **两端行高语义相反** —— iOS 把设计行高当**追加量**（`WDTokenTypes.swift:22-24`），Android 交**总量**（`WDTheme.kt:54-58`）；且 iOS 公式在 ratio < 字体天然比值时**无解**（`caption2` 落到负值），而现有测试 `WDTokensTests.swift:15` 恰好把错误固化成绿灯。

---

## 4. 阻塞项总清单（B1–B27 + 管理项）

### 4.1 第一轮 B1–B10（继续有效）

| 编号 | 问题 | 处理 |
| --- | --- | --- |
| B1 | 对比度账目错误，群青等 3 处突破 4.5:1 | 按实测复算整列；群青降级为描边/图形专用色 |
| B2 | 四处浅色语义色在 `status-soft` 上不足 4.5:1 | 新增 `status-text.*`（成功 `#226A4C` / 信息 `#125F8F` / 警示 `#8A5A18` / 危险 `#9E4038`） |
| B3 | 深色 `text.on-fill` 仅 4.07:1 | 改纯白 `#FFFFFF`，画廊对齐 |
| B4 | `gradient.mid` 起点白标记仅 2.51:1 | 起点改 `#3898B4`（3.32:1） |
| B5 | 同值多源漂移（Tab 栏 56 vs 58） | Tab 栏按 **58** 改令牌；新增 `size.navbar-large=96`、`scrim` |
| B6 | iOS 字阶不缩放（＋行高模型错误） | 令牌改存**行高比**；M0 定 `WDTextStyle` 形态，M1 确认冻结 |
| B7 | `03-platform-mapping` 与 v1.0 无关 | 按 v1.0 重写或改为指针页 |
| B8 | 游离数值破坏"只用令牌"纪律 | 新增 `component.*`、`gradient.wash.*` |
| B9 | 文档 7 处自相矛盾 | 逐条修；口径修正为 **37 组件 + 5 配方** |
| B10 | `text.tertiary` 不达标 | **值回退待定**（见 §3.3-1）；深色侧随色晕一并修 |

### 4.2 第二轮 B11–B21（架构层）

| 编号 | 一句话 | 证据要点 |
| --- | --- | --- |
| B11 | `material.*`（6 个）完全不被生成器消费，玻璃决策没有代码载体 | `build.js` 全文无 `t.material` |
| B12 | `motion.component.*`（10 个）不被生成 | M2 首批 Button/Checkbox/Switch 必写裸值 |
| B13 | `elevation.*` 只有 iOS 生成，Android 从缺；深色阴影无令牌 | `build.js:265-278` 只在 `buildSwift()` 内 |
| B14 | `typography.overline.letterSpacing` 定义了但两端不生成、结构体无槽位 | 令牌存在但流不到实现 |
| B15 | `size.touch-target-min` 单值 44、无平台分支 → **"iOS ≥44 / Android ≥48"不可落地** | 需先扩展 schema |
| B16 | 公开 API 同名两义：`WDColor.textOnFill`（浅深成对）vs `WDDerived.textOnFill`（单值） | B3 只改语义层 → 深色误用派生层会得浅色深字 |
| B17 | 原始/派生/中性层常量被冻结为公开 API，"只用语义层"纪律无法用 API 面约束 | `api:95-107`（`WDPalette.slate`）等 |
| B18 | 口径"37+5"存在第四个副本 | `specs/README.md:36` vs `:38` vs `02-components.md:77` vs `03-patterns.md` |
| B19 | **M3 桥接只覆盖 10/48 角色**，其余回落 Material 紫系；且未传 typography/shapes | `javap` 实测 48 参；`SurfaceTint #6750A4` |
| B20 | 两端覆盖能力**结构性不对称**：Android 可注入、iOS 不可注入 | Android 有 `CompositionLocal`，iOS 无任何 `EnvironmentKey` |
| B21 | 生成器硬编码跨仓相对路径，与 `04-architecture` 的 CI 承诺矛盾 | `build.js:16-24` vs `04-architecture.md:28` |

### 4.3 第二轮 B22–B27（设计/材质/流程层，本轮新增）

| 编号 | 问题 | 处理 |
| --- | --- | --- |
| **B22** | **玻璃真源有四个**，平台上跑的不是第一轮裁定值 | M0 第 1 件事：裁定唯一真源 |
| **B23** | **浅色色晕净 alpha 口径未定**；删 `.55` 只写 42% 反而更浓 | 令牌写"生效 alpha"；删预览 `.55`/`.5`；数值由断言产出 |
| **B24** | **深色端整条文字色阶**在浅色玻璃卡上不达标（`tertiary`/`secondary`） | 与浅色端同批修；`secondary` 纳入（B10 漏项） |
| **B25** | `text.tertiary` 决议值在浅色色晕上 **3.80** | 由断言算法给首个达标值；不在文档先定数 |
| **B26** | 画廊 `--wd-*` **30 处引用 / 0 定义**；`--g-glass` 同名不同档；`--g-scrim` 有产物无令牌 | 生成器输出独立画廊变量块 |
| **B27** | M0 出口条件本身不可执行、缺 Android `.api` | 重写为十条（见 §6） |

### 4.4 管理项与证据项

| 编号 | 问题 | 状态 |
| --- | --- | --- |
| A-M1 | `specs/README.md` 组件索引结构性损坏（16 个高级组件插进三列表） | ✅ **已修** |
| A-M2 | android 误入库 1.9MB JVM 崩溃日志，`git status 干净`掩盖 | ✅ **已修**（`94fdebf`） |
| 基线未入库 | `10`/`11` 与 README 指针未提交 → 评审无可审计 diff 参照 | ✅ **已入库** |

---

## 5. 本届产品裁定（2026-10-03）

| # | 事项 | 裁定 | 取代/影响 |
| --- | --- | --- | --- |
| **P1** | Tab 栏未选标签用色 | **改用 `text.secondary`** | 采纳设计师立场，取代 `specs/02-advanced:1390/1375` 的 `text.tertiary` |
| **P2** | 中文字体 | **不嵌入** | **取代第一轮产品裁定 A1**；不再需要 `family.cjk` 令牌、字重缺档回落表、9MB 体积归属；**保留 CJK 行高比约束**与"数值走西文字族" |
| **P3** | M0 排期 | **方案 A：M0 = 2.5 周** | 总排期 **13–14 周**（含 1 周缓冲）；串行 **21–23 周** |
| **P4** | 三项管理动作 | **执行完毕** | 见 §4.4 |

---

## 6. M0 开工方案（方案 A，2.5 周）

### 6.1 前置条件（M0 第 1 天前必须关闭，全在设计侧）

1. **深色色晕**取值与派生源；
2. **玻璃唯一真源**（B22）与 `material.*` 去留；
3. **tint 配方**基准底与最终写法；
4. **色晕净 alpha**（B23）。

> 四项未关闭，M0 不开工。

### 6.2 M0 出口条件（十条）

1. `build.js --check` 通过（**已满足**）；
2. 令牌**一次改完**（清单见 §7.1）；
3. 对比度断言跑通，且**支持 alpha 合成 + 对色晕每个色标 × 每个 alpha 档采样自动取最不利**（**不预设方向**）；
4. **玻璃与色晕唯一真源已裁定并落地**；
5. `WDTextStyle` **形态冻结** + 生成器产出 `lineHeightRatio`（"确认冻结"挪 M1 出口）；
6. RTL 命名冻结（leading/trailing、图标镜像列）；
7. 画廊变量块由生成器输出并纳入 `--check`；**四个可视化产物全部在生成链路内**；
8. **`apiDump` 已提交，两端 `apiCheck` 为绿**（本轮新增）；
9. 两端编译，命令写死：iOS `xcodebuild -scheme WisdomUI -destination 'generic/platform=iOS' build`；Android `./gradlew --offline :wisdom-ui:compileDebugKotlin :wisdom-ui:apiCheck`；
10. 管理动作：基线已入库 ✅ / 崩溃日志已删 ✅ / 组件索引已修 ✅（已提前完成）。

### 6.3 关键路径与硬约束

```
D1 令牌一次改完
 ├─→ D2 生成器适配 ─→ (生成) I2 / A1 ─→ A3 apiDump
 │                      └→ I1 形态冻结 ─→ I4 度量测试
 ├─→ D3 对比度断言   ← 依赖 D1 的 wash 净 alpha + 玻璃档位裁定
 ├─→ D5 画廊去魔术数 ─→ D4 画廊生成 ─→ D7 CI
 └─→ D6 文档同步     ← 必须最后
```

1. **D1 一次做完**（否则 `--check` + `apiDump` + 37 规格 + 4 画廊各改两遍）；
2. **A3 紧跟 A1/A2**（`WDColors` 27 参 → 加 `status-text.*` 变 31 参，脱节则构建必红）；
3. **I1 不得晚于 M1 起点**（37 组件全部经过 `WDTextStyle`）。

### 6.4 里程碑

| 阶段 | 工期 | 出口条件 |
| --- | --- | --- |
| **M0 规范冻结** | **2.5 周** | §6.2 十条 |
| **M1 Foundation** | 1 周 | 两端 Showcase；浅/深 × 常规/AX3 × LTR/RTL 六态截图入库；`WDTextStyle` 确认冻结 |
| **M2 基础组件 1 批** | 2 周 | 8 个组件；验收清单全勾；AX3 / fontScale 1.3 不截断 |
| **M3 基础组件 2 批** | 2 周 | 基础层封板，公开 API 冻结 |
| **M4 反馈与弹层** | 2 周 | 焦点进出归还逐条验收 |
| **M5 导航与表单** | 2 周 | 滚动收缩跟随进度；Tab 栏底部留白 ≥82 |
| **M6 场景层与发布** | 1.5 周 | 无障碍回归 + 截图基线 + 双端同 tag `v1.0.0` |

**合计 13–14 周**（1 iOS + 1 Android + 0.5 设计评审）。

---

## 7. 落地清单（按仓库 / 角色）

### 7.1 设计仓库 `wisdomdesign/`（唯一真源，必须第一个动）

| 顺序 | 文件 | 改动 |
| --- | --- | --- |
| **D1** | `tokens/wisdom.tokens.json` | **一次改完**：`text.tertiary`（待定）/ `status-text.*` / 深色 `text.on-fill #FFFFFF` / `gradient.mid` 起点 `#3898B4` / `tabbar-height 58` / `size.navbar-large=96` / `scrim` / `component.*`（82·92·62 只存参数）/ `wash`（**写明生效 alpha**）+ `gradient.wash.light/dark` / `gradient.tint` / `lineHeightRatio`（并修 `caption2`）/ 色卡 `$description` 改 9 |
| D2 | `tools/token-build/build.js` | 吐 `lineHeightRatio` + `letterSpacing`；路径参数化（`--ios-out/--android-out`）；**新增画廊 target**；`Palette` 注释改 `${count}` |
| D3 | 新增 `tools/token-build/contrast.js` + `tokens/contrast.json` | 声明「前景 × 背景 × 场景 × 阈值」；alpha 合成 + **自动取最不利**；输出 `docs/contrast-report.md` |
| D4 | 新增 `tools/token-build/gallery.js` | 生成 4 个可视化产物的 `--g-*` / `--wd-*` 变量块 |
| D5 | 4 个 HTML（3 画廊 + 1 预览） | 写死值改 `var(--g-*)`；**补 `--wd-*` 定义**；Tab 高度 58 / 标签 11 · 500 / `--g-brand` 补 `light-dark()` / 补 `dir="rtl"` 渲染 |
| D6 | `01` / `02` / `03` / `04` / `05` / `06` / `README` / `specs/README` | 数字最终化后**最后改**：`06 §5.2` 改结果式、`01 §3.6` 净 alpha、`03` 重写、`04` 分层表、口径 37+5、色卡 9 |
| D7 | 新增 `.github/workflows/ci.yml` | `build.js --check && contrast.js --check && gallery.js --check` |

### 7.2 iOS 仓库 `WisdomDesign-iOS`

| 顺序 | 文件 | 改动 |
| --- | --- | --- |
| **I1** | `Foundation/WDTokenTypes.swift` | **冻结形态**：`WDTextStyle` 加 `lineHeightRatio`/`letterSpacing`；去掉 `lineSpacing` 计算属性；新增 `wdFont(_:)` ViewModifier（内部持 `@ScaledMetric`）；行高走 `NSParagraphStyle` 或 `ratio×size − 实测天然行高` |
| I2 | `Foundation/Generated/WDTokens.swift` | 生成物，不手改 |
| I3 | `Foundation/WDColor+Hex.swift` | 加 `Color → components` 解析（供断言读回） |
| I4 | `Tests/WisdomUITests/WDTokensTests.swift` | 行高**度量**测试、`caption2` 追加量非负、渐变几何端点、色对断言 |
| I5 | `Package.swift` | lint/format 插件会破坏"零依赖"现状 → 需裁定 |
| I6 | 新增 `.github/workflows/ci.yml` | `xcodebuild -destination 'generic/platform=iOS' build` + 模拟器测试 |

### 7.3 Android 仓库 `WisdomDesign-Android`

| 顺序 | 文件 | 改动 |
| --- | --- | --- |
| A1 | `foundation/Generated/WDTokens.kt` | 生成物，不手改 |
| A2 | `foundation/WDTheme.kt` | `toTextStyle()` 补 `letterSpacing` + `LineHeightStyle`（显式 `includeFontPadding=false`）；M3 桥接按 B19 补全或显式收窄（至少 `surfaceTint`/`outline`/`error`/`errorContainer`） |
| **A3** | `api/wisdom-ui.api` | `apiDump` 产物，**与 A1/A2 同一提交** |
| A4 | `src/test/.../WDTokensTest.kt` | 行高比 ≠ 1 的断言；组件尺寸与字号联动回归 |
| A5 | `build.gradle.kts` | ktlint/detekt（评估对"零依赖"影响）；确认 `apiCheck` 挂进 `check` |
| A6 | `gradle/libs.versions.toml` | 注释补全三条约束（含 **AGP ≥ 9.1.0**）；**不改版本** |
| A7 | 新增 `.github/workflows/ci.yml` | `./gradlew :wisdom-ui:apiCheck :wisdom-ui:assembleDebug :wisdom-ui:testDebugUnitTest` |

### 7.4 角色分工

| 角色 | 负责 |
| --- | --- |
| **设计师** | D1 的取值（含深色色晕 / tint 配方 / 净 alpha / 三级色映射 / CJK 行高比）；D5 与 D6 的设计侧内容；M0 收尾的浅/深 × LTR/RTL 四态并排评审 |
| **架构师** | D1 的结构、D2 / D3 / D4 / D7；两端平台空白裁定；`component.*` 归属规则 |
| **研发Leader** | I1–I6、A1–A7；行高模型两端统一；M3 桥接口径；门禁最小可跑版本 |
| 独立核验 | M0 出口逐条复算（沿用本轮"不采信被复核稿数字"的方法） |

---

## 8. 已完成的动作（P4）

| 动作 | 仓库 | 证据 |
| --- | --- | --- |
| `10`/`11` 与 README 目录指针入库 | `wisdomdesign` | 提交含 `docs/10-discussion.md`、`docs/11-conclusions.md`、README 指针 |
| 删 android 误入库崩溃日志 + 加 `.gitignore` 规则 | `android` | 提交 `94fdebf`；`hs_err_pid*.log` / `replay_pid*.log` 规则已加；HEAD 中 `.log` 计数 **0** |
| 修 `specs/README.md` 组件索引（A-M1） | `wisdomdesign` | 16 个高级组件（21–36）移出三列「场景配方」表，新增「高级组件索引（21–36）」；`:38` 的"6 个配方"改为 **5 个配方 + 1 个组件（37）**，并写明"37+5"为单一真源 |

---

## 9. 风险表

| 风险 | 影响 | 对策 |
| --- | --- | --- |
| **设计侧 4 项前置未关闭** | M0 全盘阻塞（断言无法写、令牌无法定值） | 定死"M0 第 1 天前关闭"，责任在设计侧 |
| 两端视觉「重量」漂移 | 跨端观感不一致 | 三条物理差（行高 / 渐变几何 / spring）M0–M1 统一公式；每批组件并排截图评审 |
| 深色端不达标（B24） | 深色模式整体不可用 | 与浅色端**同批**修，`secondary` 一并纳入；派生源与降浓两条路都要评估 |
| Liquid Glass 降级路径被忽略 | iOS 17–25 与 Android 全量走降级，成了"另一种设计" | M1 降级路径做默认，玻璃只做增强；降级版进截图基线 |
| 组件数量与人力不匹配（37+5） | 后期烂尾 | 先做 P0（20 项以内）；串行则改记 21–23 周 |
| 场景配方污染组件库 | 组件库被业务语义绑架 | 配方不进库（S4） |
| 画廊维护成本线性增长 | 50 组件后无人更新 | 画廊定位为阶段性产物 + 变量块生成化 |
| 20 条阻塞项分次修改 | 37 规格 × 4 画廊重复改动 | **D1 一次改完**是硬约束 |
| Android 动态取色 / iOS 26 chrome 漂到实现期 | 跨端一致性破掉 | 编入 M1 并指定负责人；B19 判定条件今天即可静态判定 |

---

## 10. 未决事项

### 10.1 待产品/用户裁定

1. **A2 深色 canvas 目标色值**（方向已定，值待定，与深色色晕同批）。
2. **撤群青是否升为新决议**（第一轮只写"降级为描边/图形专用色"）。
3. **跨仓 CI 拓扑**（`build.js` 要求三仓同级 checkout，由谁保证）。
4. **iOS 26 系统 chrome 与自绘悬浮 Tab 栏**（需真机验证；若不解决，`02 §34` 尺寸验收只约束自绘档）。
5. **`Package.swift` 是否允许加依赖**（lint 插件会破坏"零依赖"）。
6. **Android 是否 opt-in 动态取色**（默认不接入 + M0 补全映射为建议）。

### 10.2 待验证（有候选）

7. 深色端不达标数值（2.40/3.42 vs 2.84/4.03）→ M0 断言统一产出。
8. 色晕生效 alpha 与 42% 的最终换算 → M0 断言。
9. 玻璃唯一真源与 `material.*` 去留 → M0 第 1 件事。
10. iOS 行高比落地方式（`NSParagraphStyle` vs `ratio×size − 实测天然行高`）→ M1 实测。
11. tint 配方基准底与三级色映射表最终写法 → 设计侧补齐后进 M0。
12. `motion.spring.*` 两端参数子集统一方式。

### 10.3 本轮无法验证（不得默认成立）

真机 iOS 26 chrome 行为／真机渲染与字体嵌入体积／CJK 行高／Compose 运行时行高／**Android 编译与 `apiCheck`**／SwiftPM 与 Gradle 门禁／深色态渲染／Spring 曲线数值对比。其中构建类失败原因是**沙箱写权限被拒，非代码问题**，原始报错记录在 `15-review-evidence.md`。

---

## 11. 文档索引

| 文档 | 内容 |
| --- | --- |
| **`18-summary.md`（本文）** | **单文档入口：两轮结论 + 全部阻塞项 + 裁定 + M0 开工方案** |
| [`11-conclusions.md`](11-conclusions.md) | 第一轮权威结论（B1–B10、四项地基决策） |
| [`10-discussion.md`](10-discussion.md) | 第一轮讨论纪要（8 轮发言） |
| [`17-conclusions-round2.md`](17-conclusions-round2.md) | 第二轮权威结论（B22–B27、口径更正、M0 十条） |
| [`16-discussion-round2.md`](16-discussion-round2.md) | 第二轮讨论纪要（三方 + 交叉复核 + 队长复算） |
| `12` / `13` / `14`-review-* | 架构师 / 设计师 / 研发Leader 第二轮原始意见 |
| `12-peer` / `13-peer` / `15-review-*` | 独立交叉复核 × 2 + 代码级证据核验 |
| `01`–`09` + `specs/01–03` | 设计规范与 37 组件 + 5 配方规格（开发依据与验收标准） |

---

← 返回：[第二轮结论](17-conclusions-round2.md) ｜ [第一轮结论](11-conclusions.md) ｜ [工程架构](04-architecture.md) ｜ [无障碍规范](06-accessibility.md)
