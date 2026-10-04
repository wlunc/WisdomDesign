# 15 · 第二轮代码级证据核验报告（令牌 / 生成器 / 两端源码 / 设计产物）

> **本文定位**：第二轮评审（wisdomdesign-v1-review / t6 `code-evidence`）的**证据核验稿**。
> 只登记**本机可复跑的实测值**（命令 + 原始输出），不写设计结论、不写架构结论、不做排期判断；
> 每一条都需要 `file:line` 或命令行出处。
> **基线**：`docs/11-conclusions.md`（2026-10-03，第一轮决议清单）。本文不把同批其他复核稿当作证据来源，
> 只在 §3.2 中记录「我复算不出同值」的条目，并附我自己的复现方法与结果。
> **取材范围**（逐项取证，未跳步）：
> `tokens/wisdom.tokens.json`、`tools/token-build/build.js`、
> `iOS/Sources/WisdomUI/Foundation/**`（含 `Generated/`）与 `iOS/Tests/**`、
> `android/wisdom-ui/src/main/kotlin/io/github/wlunc/wisdom/foundation/**`、
> `android/wisdom-ui/src/test/**`、`android/wisdom-ui/api/wisdom-ui.api`、
> `design/preview/wisdom-light.html`、`design/gallery/wisdom-*.html`。

---

## 1. 方法与执行环境

### 1.1 执行环境（实测）

| 项 | 实测值 | 复现命令 |
| --- | --- | --- |
| 操作系统 | macOS 26.6.2（Build 25G83）· arm64 | `sw_vers` / `uname -m` |
| Node | v24.21.0 | `node -v` |
| Swift 工具链 | Apple Swift 6.3.3（swift-driver 1.148.6） | `swift --version` |
| iOS SDK（typecheck 用） | `/Applications/Xcode.app/.../iPhoneOS26.5.sdk` | `xcrun --sdk iphoneos --show-sdk-path` |
| JDK / javap | Java 17.0.11 LTS | `java -version` / `javap -p` |
| 浏览器（像素量测） | Google Chrome 154.0.8037.97（headless=old） | `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --version` |
| 工作区位置 | 三个**独立** git 仓库：`wisdomdesign/`、`iOS/`、`android/` | `git -C <repo> rev-parse --show-toplevel` |

三个仓库的基线与工作区状态（本节所有取证都在此状态上完成）：

```
$ for d in wisdomdesign iOS android; do echo "--- $d"; git -C $d status --porcelain; done
--- wisdomdesign
 M README.md
?? docs/10-discussion.md
?? docs/11-conclusions.md
?? docs/12-review-architect-peer.md
?? docs/12-review-architect.md
?? docs/13-review-designer-peer.md
?? docs/13-review-designer.md
?? docs/14-review-techlead-round2.md
--- iOS          （输出 0 行）
--- android      （输出 0 行）
```

### 1.2 命令清单（本文所有数字的来源）

| # | 命令 | 目的 | 结果 |
| --- | --- | --- | --- |
| 1 | `node wisdomdesign/tools/token-build/build.js --check` | 令牌生成一致性门禁 | 2 行 `✓`，**exit 0** |
| 2 | `grep -c "<关键词>" wisdomdesign/tokens/wisdom.tokens.json` | 令牌存在性 | `wash`=0 / `status-text`=0 / `scrim`=0 / `navbar-large`=0 / `lineHeightRatio`=0 / `letterSpacing`=1 / `component`=1（仅 `motion.component`） |
| 3 | Node 脚本遍历 JSON（`$value` 叶子计数，跳过 `$` 开头键） | 令牌叶子总数与分组 | **168** 个叶子：color 27 / gradient 3 / semantic 58 / typography 14 / space 10 / radius 9 / size 18 / elevation 5 / material 6 / motion 18 |
| 4 | `grep -oE "t\.[a-zA-Z.]+" tools/token-build/build.js \| sort \| uniq -c` | 生成器实际读取的令牌组 | 只读 `semantic.light/dark`、`gradient`、`color.named/derived/su`、`typography`、`space`、`radius`、`size`、`elevation`、`motion.duration/spring`；**`material` 0 命中、`motion.component` 0 命中** |
| 5 | `grep -cE "^\s*--(g|wd)-[a-z0-9-]+:" <html>` | 设计产物手写变量条数 | 预览 `--wd-*` **50**；组件画廊 35；高级画廊 36；配方画廊 29（`--g-*`） |
| 6 | `grep -nE "\b(82\|92\|62)\b" tools/token-build/build.js` | 派生布局常量能力 | **0 命中** |
| 7 | `xcrun swiftc -typecheck -target arm64-apple-ios17.0 -sdk $SDK -module-cache-path /tmp/mc <3 个 Foundation 源文件>` | iOS 侧类型检查 | 无输出，**exit 0**（`echo $?` 实测，非管道退出码） |
| 8 | `swift build`（`iOS/`） | 真实构建 | **失败**：`error opening '.../ModuleCache/PackageDescription-*.swiftmodule' for output: Operation not permitted`（写权限，不是代码问题） |
| 9 | `./gradlew --offline :wisdom-ui:apiCheck`（`android/`） | Android 构建 / api 门禁 | **失败**：`java.io.FileNotFoundException: ~/.gradle/wrapper/dists/gradle-8.14.5-bin/.../gradle-8.14.5-bin.zip.lck (Operation not permitted)` |
| 10 | `javap -p -classpath <material3-api.jar> androidx.compose.material3.ColorSchemeKt` | M3 角色数量 | `lightColorScheme` 最新重载 **48 个 `long` 参数**；`ColorSchemeKt` 全文 `ColorLightTokens` 命中 **220** 次；`lightColorScheme…$default` 方法体内引用 **47** 个 `ColorLightTokens.getXxx()` |
| 11 | 反射读 `ColorLightTokens` / `PaletteTokens` 静态字段（JDK 17 + material3-api.jar + ui-graphics classes.jar + kotlin-stdlib） | M3 默认色实测 | `Secondary`=`0xFF625B71…`、`Tertiary`=`0xFF7D5260…`、`SurfaceTint`=`0xFF6750A4…`、`SurfaceVariant`=`0xFFE7E0EC…`、`Outline`=`0xFF79747E…`、`Error`=`0xFFB3261E…`、`Surface`=`0xFFFEF7FF…`（`long` 高 32 位即 ARGB） |
| 12 | CoreText 量测（`NSFont.systemFont(ofSize:)` → `CTFontGetAscent/Descent/Leading`） | 系统字体的天然行高 | 见附录 A；自然比值恒为 **1.17773** |
| 13 | headless Chrome 渲染 + PNG 逐像素解码（见 §1.3） | 色晕净 α 与玻璃浓度 | 见 §4 V16 |

### 1.3 两条非标准取证的完整做法（供复现者照做）

**(a) 设计产物的令牌对账脚本**
`design/*.html` 每个文件都是「宿主外壳 + `data-srcdoc` 内层文档」结构，令牌变量写在 `#wd-board{…}` / `#wd-gal*{…}` 块里。
做法：①用正则取出 `data-srcdoc="…"` 并按 `&lt; &gt; &quot; &#x27; &amp;` 反转义，得到可直接渲染的内层文档；
②逐行匹配 `^\s*(--[a-z0-9-]+)\s*:\s*(.+?);`，把值解析成 `{hex, alpha}`（支持 `rgba()`、`#RRGGBBAA`、`light-dark(a,b)`）；
③把每个值同时与「浅色令牌表」「深色令牌表」比对（先按 hex 相同、再比 α 差值）。
判定口径：hex 相同且 |Δα| ≤ 0.0005 记为可对齐；否则记为漂移或"无令牌"。
**注意**：对账只看 CSS 声明，不看浏览器合成结果——合成结果见 (b)。

**(b) 色晕与玻璃的像素量测**
```bash
# 1) 取内层文档（去掉宿主外壳与仓库里那个 unpkg 外链脚本，CSP/网络在离线环境会挂住 --screenshot）
#    预览内层文档 → /tmp/wdev/inner-light.html
# 2) 用 headless Chrome 截图（死代理让外链立刻失败，避免 Chrome 等待网络）
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=old --disable-gpu --no-sandbox \
  --no-first-run --disable-extensions --proxy-server=127.0.0.1:9 --user-data-dir=/tmp/wdev/cp \
  --virtual-time-budget=6000 --hide-scrollbars --screenshot=/tmp/wdev/light800.png \
  --window-size=800,4600 file:///tmp/wdev/inner-light.html
# 3) 用 zlib 手写 PNG 解码（IHDR/IDAT + 5 种 filter），逐像素取 RGB
```
几何基准（`--window-size=800,4600`，用 `--dump-dom` 注入脚本读 `getBoundingClientRect()` 实测）：
`#wd-board` 0,0 800×4017；`.wd-canvas-sheet` **x=20 y=736 w=760 h=703**；`.wd-elev-row` x=39 y=1315 w=722 h=105。
点 (400,737) 相对 sheet 为 (380,1)，与 `(380,0)` 等价。
**标定实验**：另建最小 harness，把 `preview/wisdom-light.html:1380-1383` 的 `--wd-wash` 定义**原样字符串复制**到
760×703 的 `#s::before` 上（底色 `#F1F8FA`），分别用 `opacity:.55` / `opacity:1` / 「66% 换成 42% 且 `.55`」渲三份。
实测 `opacity:.55` 的 harness 在点 (380,0) 得 `rgb(228,242,245)`，与真预览内层文档同点 `rgb(228,241,245)` **逐通道一致（±1）**，
说明 harness 忠实复现了预览的合成，元素 `opacity` 确实生效。

### 1.4 本环境**无法执行**的命令（原始报错，如实记录）

| 命令 | 原始报错（截断） | 影响 |
| --- | --- | --- |
| `swift build` | `error opening '…/C/clang/ModuleCache/PackageDescription-….swiftmodule' for output: Operation not permitted` → `failed to build module 'PackageDescription'` | 「iOS 能编译」只能退化为 `swiftc -typecheck`（命令 7） |
| `./gradlew --offline :wisdom-ui:apiCheck` | `java.io.FileNotFoundException: ~/.gradle/wrapper/dists/…/gradle-8.14.5-bin.zip.lck (Operation not permitted)` | 「Android 能编译」「apiCheck 通过」**零证据** |
| 真机 / 模拟器运行 | 本机无可用运行目标（无 `simctl` 设备启动权限，未尝试） | iOS 运行时行为（chrome / Liquid Glass / 字体）全部无法验证，见 §5 |

---

## 2. 证据表

> 判定列只描述**证据事实**（落地 / 未落地 / 复现 / 无法判定），不含处置意见。
> 「第一轮预期值」全部取自 `docs/11-conclusions.md` 的明文条目，已在第一列标注行号。

| 声明（file:line 出处） | 第一轮预期值 | 本次实测值 | 判定 |
| --- | --- | --- | --- |
| `text.tertiary` 取值 · 令牌 `tokens/wisdom.tokens.json:71,121`；决议 `docs/11-conclusions.md:49,59` | 浅/深统一改为 `#4C616D` | 浅 `#5B7784`、深 `#839EB0`（两端生成产物同值：`WDTokens.swift:18`、`WDTokens.kt:59,89`） | **未落地** |
| `gradient.mid` 起点 · `tokens/wisdom.tokens.json:49`；决议 `docs/11-conclusions.md:43,60` | `#3898B4` | `linear-gradient(135deg,#4FB0C8 0%,#1685A9 100%)`（设计产物 `gallery/wisdom-components.html:1548` 与令牌完全一致） | **未落地** |
| 深色 `text.on-fill` · `tokens/wisdom.tokens.json:123`；决议 `docs/11-conclusions.md:42,61` | `#FFFFFF` | `#DCEEF4`（`WDTokens.swift:20`、`WDTokens.kt:91`）；画廊 `gallery/wisdom-components.html:1546` 已写 `light-dark(#0E3A55,#FFFFFF)` | **未落地，且画廊与令牌互相矛盾** |
| 新增令牌 `status-text.* / component.* / size.navbar-large / scrim / wash / gradient.wash.* / semantic.*.gradient.tint` · `docs/11-conclusions.md:85`；令牌全表 | 7 类新增 | 168 个叶子里：`wash` 0、`status-text` 0、`scrim` 0、`navbar-large` 0、`lineHeightRatio` 0；`component` 仅命中 `motion.component.*`（10 个，第一轮指的是**常量版** `component.*`）；`tint` 仅命中 `material.tinted` | **未落地** |
| Tab 栏高度 · 令牌 `tokens/wisdom.tokens.json:226`；决议 `docs/11-conclusions.md:74` | 58 | 令牌 56（`WDTokens.swift:160` / `WDTokens.kt:225` 均 56）；**设计产物实测 58**：`preview/wisdom-light.html:1628`、`gallery/wisdom-components.html:1819`、`gallery/wisdom-advanced.html:1768`、`docs/09-layout.md:18,21` | **未落地，且一值四源分两派** |
| 行高模型改为「行高比」 · 生成器 `build.js:258,445`；决议 `docs/11-conclusions.md:45,84` | 令牌存 `lineHeightRatio` | 令牌仍存绝对值 `lineHeight`（`tokens/wisdom.tokens.json:162-173`）；生成器两处都把 `lineHeight` 直传（Swift `build.js:258`、Kotlin `build.js:445`）；两端 `WDTextStyle` 都只有 `size/lineHeight/weight` 三字段 | **未落地** |
| 派生布局常量 82/92/62 由生成器算 · `build.js` 全文；决议 `docs/11-conclusions.md:86` | 生成器产出 | 生成器 `\b(82\|92\|62)\b` **0 命中**，无任何比值/派生计算；`docs/09-layout.md:17,21` 仍手写 82（92、62 在该文件 `\b` 词边界搜索 **0 命中**） | **未落地** |
| 画廊 `--g-*` 改为生成产物并纳入 `--check` · `build.js:474-477`；决议 `docs/11-conclusions.md:87` | 4 个可视化产物进生成链路 | `main()` 的 `targets` 数组只有 2 项（Swift、Kotlin）；4 个 HTML 中的 **50 / 35 / 36 / 29** 条令牌变量全部手写，`--check` 只比这 2 个文件 | **未落地** |
| 预览 wash 浓度与透明度 · `preview/wisdom-light.html:1380-1383,1423`；决议 `docs/11-conclusions.md:65,209` | 66% → **42%** | 声明三档 `#B0D5DF 66% / #7EC4CF 46% / #4C8DAE 18%`，元素 `opacity:.55`（`elev-row::before` 为 `.5`）；深色端**没有**独立定义（`--wd-wash` 未包 `light-dark()`）；像素实测见 §4 V16 | **未落地** |
| 两端 `WDTextStyle` 实际实现 · `iOS/Sources/WisdomUI/Foundation/WDTokenTypes.swift:6-25`；`android/…/WDTheme.kt:54-58` | M0「定形态」 | iOS：`lineSpacing = max(0, lineHeight - size)`（`:22-24`）——把「总行高」当「追加量」用；Android：`toTextStyle()` 把 `lineHeight` 原值交给 Compose（`:54-58`）——当「总行高」用。**同一令牌两端语义相反** | **形态分歧（实测）** |
| 两端 `WDTheme` 实际实现 · `android/…/WDTheme.kt:23-51,60-84` | 主题桥接 M3 | `WDTheme(colors=…)` 只映射 10 个角色（light `:60-71`：primary/onPrimary/background/onBackground/surface/onSurface/surfaceVariant/onSurfaceVariant/outline/error；dark `:73-84` 同 10 个）；`lightColorScheme` 共 **48** 个参数（javap 实测），其余 **38 个回落 `ColorLightTokens` 参考色板**（实测 `Secondary=#625B71`、`Tertiary=#7D5260`、`SurfaceTint=#6750A4`） | **现状（实测）** |
| `api/wisdom-ui.api` 现状 · `android/wisdom-ui/api/wisdom-ui.api:1-207` | M0 出口需 `apiDump` 同步 | 207 行、**15** 个 `public final class`（含 2 个文件外观 `WDGradientKt`/`WDThemeKt`）；`WDColors` **27** 个 getter；原始层被冻结为公开 API：`WDPalette` 9 + `WDDerived` 6 + `WDNeutral` 12 = **27** 个 getter；**无**任何 elevation / material / letterSpacing 符号 | 符号与现有源码一一对应；**是否与当前源码逐字节一致无法判定**（需 Gradle，§1.4） |
| 生成器输出能力：行高比 / `component.*` / 派生布局常量 / `--g-*` · `build.js:120-139,150-302,306-468,474-477` | 四项都要支持 | 四项**全部不支持**：①无比值计算；②`t.motion.component` 从不被读取；③无任何派生常量代码；④无 CSS/HTML writer，`targets` 只有 2 项 | **未落地** |
| `--check` 门禁 · `build.js:479-501` | 通过（exit 0） | 实测两文件全 `✓`，`echo $?` = **0**；跑完 `git status --porcelain` 未新增改动（生成产物与令牌完全一致） | **复现成功** |

（表注 1）「未落地」只表示**令牌/生成产物里找不到第一轮决议的值**，不代表该决议本身正确与否。
（表注 2）表中所有「实测值」都可以用 §1.2 的命令 1–6、10、11 直接复得；像素类见 §1.3。

---

## 3. 第一轮结论中经实测**无法复现**的条目

### 3.1 对第一轮（`docs/11-conclusions.md`）：**无**

逐条核对了第一轮可核验的落地状态条目，全部成立，没有例外：

- §6「令牌中尚不存在 `wash` / `status-text` / `navbar-large` / `scrim` / 常量版 `component.*`」（`:207`）→ 复现（命令 2，168 叶子全表）。
- §6「预览 HTML 仍是 `.wd-canvas-sheet::before { opacity:.55 }`」（`:209`）→ 复现（`preview/wisdom-light.html:1423`，浏览器 `getComputedStyle(…,'::before').opacity` = `"0.55"`，见 §1.3b）。
- §6「`06 §5.2` 仍是"82%+"」（`:208`）→ 复现（`docs/06-accessibility.md:161`）。
- §6「`01 §3.6` 仍是 `.66`」（`:208`）→ 复现（`docs/01-foundation.md:153` 写 `rgba(176,213,223,.66)`）。
- §6「`03-platform-mapping` 仍是旧版（绿色 `#2F7F63` / `WdColor`）」（`:210`）→ 复现（该文件 `#2F7F63`/`WdColor` 共 16 行命中）。
- §1 色卡数量「9 个」（`:64`）→ 复现（`tokens/wisdom.tokens.json:7-18` 恰 9 个：lake/mist/slate/cyan/blue/indigo/navy/navy-deep/abyss）。

### 3.2 对同批复核稿中出现的数值：**2 条复算不出同值**

这两条不是我需要采信的证据，只是「我按各自口径独立算过、结果不同」的记录，附我的方法与结果：

| 待核数值（出处） | 对方口径 | 我的复现方法与实测 | 结论 |
| --- | --- | --- | --- |
| `caption2`（11/13）「正确追加量 **−0.13pt**」「公式无解」（`docs/14-review-techlead-round2.md:50,119`） | 隐含取 SF Pro 天然行高比 **1.1935**（=20.29/17）→ 11×1.1935=13.13 → 13−13.13=−0.13 | 用 CoreText 逐档量测系统字体真实度量（附录 A）：比值在 11/12/13/15/16/17/20/22/28/34pt **恒为 1.17773**；11pt 天然行高 **12.9551** → 需要追加 **+0.045pt**（正数，`.lineSpacing` 可用） | **不同值**；同时**无法判定**谁更接近 iOS 真机（见 §5 边界 4） |
| 色晕净 α「**23/16/6**」（`docs/13-review-designer.md:503,532`） | 「生效 alpha」 | ①按「声明 α × 元素 opacity」口径：66/46/18 × .55 = **36.3 / 25.3 / 9.9**；②按像素反解（§1.3b、§4 V16）：**27.4 / 18.6 / 14.8** | **两组数都不等于 23/16/6**；给定声明值我推不出这一组 |

### 3.3 检索方法（便于下一位复核者重查）

- 令牌侧：`grep -c "<关键词>" wisdomdesign/tokens/wisdom.tokens.json`，再用 `$value` 叶子遍历脚本确认（命令 2、3）。
- 生成产物侧：`grep -n "<符号名>" iOS/Sources/WisdomUI/Foundation/Generated/WDTokens.swift android/.../Generated/WDTokens.kt`。
- 设计产物侧：`grep -n -- "--wd-<名字>\|--g-<名字>" wisdomdesign/design/preview/*.html wisdomdesign/design/gallery/*.html`。
- 文档侧：`grep -rn "<数值>" wisdomdesign/docs/`（**注意**：BSD grep 的 `.` 是通配符，查 `4.5` 这类数字必须写成 `4\.5` 或加 `-E`，否则会把 `0x2C4250` 里的 `425` 也命中——本文所有计数已改用转义/`-E`）。

---

## 4. 本次新发现的数值型问题（V1 起）

> 全部为**同一事实多源取值不一致**或**声明值与实测值不一致**，每条给出 file:line、实测值、复现命令。

**V1 · Tab 栏高度：一值四源、分两派（56 vs 58 vs 74）**
令牌 `size.tabbar-height = 56`（`tokens/wisdom.tokens.json:226`）→ 两端生成 56（`WDTokens.swift:160`、`WDTokens.kt:225`）；
设计产物是 **58**（`preview/wisdom-light.html:1628` `.wd-tab-ios{height:58px}`、`gallery/wisdom-components.html:1819`、`gallery/wisdom-advanced.html:1768`）；
规范文档也是 **58**（`docs/09-layout.md:18`、`:21` 算式 `82 = 58 + 8 + 16`）；
另有 Android 风格栏 **74**（`preview/wisdom-light.html:1633` `.wd-tab-and{height:74px}`、`gallery/wisdom-advanced.html:1773`）。
复现：`grep -n "height:5[0-9]px\|height:74px" design/preview/wisdom-light.html design/gallery/*.html`。

**V2 · 玻璃「结果式」四源取值：82 / 85.88 / 86 / 88**
`docs/06-accessibility.md:161` 写「`surface.glass-strong`（**82%+**）」；令牌 `semantic.light.surface.glass-strong = #FFFFFFDB` → α = 219/255 = **85.88%**（`tokens/wisdom.tokens.json:66`）；
画廊写 **.88**（`gallery/wisdom-components.html:1564`）；预览写 **.86**（`preview/wisdom-light.html:1363`）。
复现：`grep -n -- "--wd-glass-strong\|--g-glass-strong" design/preview/wisdom-light.html design/gallery/*.html`。

**V3 · `surface.glass` 浅色：预览 .68 vs 令牌 70.20% vs 画廊 .70**
令牌 α = 179/255 = **70.20%**（`tokens/wisdom.tokens.json:65`）；预览 `rgba(255,255,255,.68)`（`preview/wisdom-light.html:1362`，Δ = **−2.20pp**）；
画廊 `rgba(255,255,255,.70)`（`gallery/wisdom-components.html:1563`，Δ = −0.20pp）。
复现：`grep -n -- "--wd-glass:" design/preview/wisdom-light.html`。

**V4 · 同名变量不同值：配方画廊的 `--g-glass` 取的是 glass-strong 的数值**
`gallery/wisdom-patterns.html:1561` `--g-glass:light-dark(rgba(255,255,255,.88),…)`，而组件/高级画廊的 `--g-glass` 是 `.70`。
即同一个 `--g-glass` 在三个画廊里承载了两个不同档位。复现：`grep -n -- "--g-glass:" design/gallery/*.html`。

**V5 · 预览 `--wd-sunken` 既换了色也换了 α**
`preview/wisdom-light.html:1354`：`--wd-sunken:light-dark(rgba(232,244,248,.74),rgba(10,26,40,.6))`。
令牌 `semantic.light.surface.card-sunken = #EDF6F9`（不透明，`tokens/wisdom.tokens.json:64`）；预览用的 `#E8F4F8` **不是任何令牌值**，且叠了 74% α。
画廊同项写的是令牌原值 `#EDF6F9`（`gallery/wisdom-components.html:1556`）。

**V6 · 设计产物里有令牌没有的东西：`--g-scrim`**
`gallery/wisdom-advanced.html:1571`：`--g-scrim:light-dark(rgba(10,27,36,.28),rgba(0,0,0,.5))`；令牌 168 叶子里 `scrim` **0 命中**（第一轮 §3.3 要求新增）。
即：设计产物已经落地了一个待建令牌，令牌侧还没有它。

**V7 · 画廊 `--g-brand` 未做浅深配对**
`gallery/wisdom-components.html:1544`、`gallery/wisdom-advanced.html:1543`、`gallery/wisdom-patterns.html:1543` 均为 `--g-brand:#1677B3;`（无 `light-dark()`），
而令牌深色 `semantic.dark.text.brand = #7EC4CF`（`tokens/wisdom.tokens.json:125`）。深色底下画廊仍用浅色品牌蓝。
复现：`grep -n -- "--g-brand:" design/gallery/*.html`。

**V8 · `--g-on-fill` 深色 = `#FFFFFF`，与令牌深色 `text.on-fill` 不一致**
`gallery/wisdom-components.html:1546` = `light-dark(#0E3A55,#FFFFFF)`；令牌 `tokens/wisdom.tokens.json:123` = `#DCEEF4`。
即设计产物已按 B3 改了、令牌没改（V 表 §2 第 3 行同源证据）。

**V9 · 深色阴影是纯黑硬编码，令牌里没有深色阴影值**
画廊 `--g-sh1/2/3`、`--g-sh-brand` 深色档全部是 `rgba(0,0,0,.3/.32/.34/.42/.38/.48)`（`gallery/wisdom-components.html:1573-1575`、`gallery/wisdom-advanced.html:1572-1575`）；
令牌 `elevation.*` 只有品牌色 `#0A3C64xx` 五档（`tokens/wisdom.tokens.json:235-249`），无深色变体。
复现：`grep -no "rgba(0,0,0,\.[0-9]*)" design/gallery/wisdom-components.html | sort -u`。

**V10 · `material.*` 的四档 blur（14/22/30/44）在设计产物里没有对应**
令牌 `material.ultraThin/thin/regular/thick` 的 `blur` = 14/22/30/44（`tokens/wisdom.tokens.json:254-257`）；
预览只有一个 `--wd-blur:22px`（`preview/wisdom-light.html:1390`），材质演示四档共用同一个 `var(--wd-blur)`（`:1452`、`:1455-1458`），
导航按钮与 Tab 栏另写 `16px/20px/26px`（`:1611`、`:1633`、`:1628`）。四个 token blur 值里只有 22 出现在预览中。
复现：`grep -rno "blur(1[0-9]px)\|blur(2[0-9]px)\|blur(3[0-9]px)\|blur(4[0-9]px)" design/preview/wisdom-light.html`。

**V11 · 同一个 spring 令牌，两端生成时丢的是**不同**字段**
令牌三个 spring 各存 `response / dampingFraction / stiffness`（`tokens/wisdom.tokens.json:272-274`）；
Swift 生成 `Animation.spring(response:dampingFraction:)`——**丢 stiffness**（`build.js:295`）；
Kotlin 生成 `spring(dampingRatio = …, stiffness = …)`——**丢 response**（`build.js:462`）。
即 `WDMotion.Spring.gentle` 与 `WDMotion.springGentle` 不是同一条曲线。
复现：`grep -n "Animation.spring\|SpringSpec<Float> = spring" tools/token-build/build.js`。

**V12 · iOS 行高模型使实际行高比令牌高 1.96–6.04pt（相对令牌行高 +12.8%~+15.0%）**
`WDTokenTypes.swift:22-24` `lineSpacing = max(0, lineHeight - size)`；实际行高 = 系统天然行高 + 该追加量。
CoreText 实测（附录 A）：`body`（17/22）实际 **25.0215pt**（令牌 22，**+3.02pt / +13.7%**）；`largeTitle`（34/41）实际 **47.0430pt**（令牌 41，**+6.04pt / +14.7%**）；
`caption2`（11/13）实际 **14.9551pt**（令牌 13，**+1.96pt / +15.0%**）；12 档全表在附录 A。
同时 Android 侧 `WDTheme.kt:56` 把 `lineHeight` 原值 22/41/13 交给 Compose → **同一档两端相差 3.02 / 6.04 / 1.96pt**。
复现：`swiftc` 编译附录 A 的 12 行 CoreText 程序。

**V13 · `WDTheme` 的 M3 桥接只覆盖 48 个角色中的 10 个，其余 38 个回落 M3 参考色板**
javap 实测 `lightColorScheme` 最新重载 **48 个 `long` 参数**；`WDTheme.kt:60-71` 传 10 个具名参数。
反射实测 `ColorLightTokens` 默认值：`Secondary` = `#625B71`、`Tertiary` = `#7D5260`、`SurfaceTint` = `#6750A4`、`SurfaceVariant` = `#E7E0EC`、`Outline` = `#79747E`、`Error` = `#B3261E`、`Surface` = `#FEF7FF`。
复现：命令 10、11（§1.2）。**这是数值事实，不是结论**：品牌蓝 `#1677B3` 之外的 38 个角色实际取的是紫/粉色系。

**V14 · 令牌叶子的生成覆盖率：Swift 150/167、Kotlin 145/167（见附录 B 的分组口径）**
两端都不生成：`material.*` **6** 个、`motion.component.*` **10** 个、`typography.family` **1** 个；
Kotlin 另外不生成 `elevation.*` **5** 个（`build.js:267-277` 只在 `buildSwift` 里）。
`typography` 字段级：`overline.letterSpacing = "0.6"`（`tokens/wisdom.tokens.json:173`）在两端生成产物里出现 **0** 次（`grep -c letterSpacing` = 0 / 0）。
复现：附录 B 的覆盖脚本。

**V15 · 两端测试把「行高模型错误」固化成了绿灯，且没有对比度断言**
`iOS/Tests/WisdomUITests/WDTokensTests.swift:7-17` 与 `android/.../WDTokensTest.kt:27-40` 都断言 `lineHeight >= size`——这条断言对 V12 的偏差**完全不敏感**（token 恒大于 size）；
两处字阶列表都只列 **11 档**，漏 `overline`（`WDType.overline` 未进测试）；
两个仓库里 `contrast|WCAG|luminance` 关键词 **0 命中**（`grep -rniE "contrast" --include=*.swift --include=*.kt --include=*.kts --include=*.js`，排除 `.agent-teams/`）。
iOS 测试 4 条、Android 测试 5 条。

**V16 · 预览色晕的实测合成结果（含把 66% 换成 42% 的对照）**
声明：`#B0D5DF 66% / #7EC4CF 46% / #4C8DAE 18%`，元素 `opacity:.55`（`preview/wisdom-light.html:1380-1383`、`:1423`；浏览器 `getComputedStyle` 把 `color-mix` 解析为 `color(srgb … / 0.66 / 0.46 / 0.18)`，实测确认）。
底色 `#F1F8FA`。sheet 内像素实测（`--window-size=800,4600`，sheet 相对坐标）：

| 采样点（sheet 相对） | 现况像素 RGB | 按主导色 `#B0D5DF` 反解的等效 α | 把 66% 换成 42% 后像素 RGB | 换后等效 α |
| --- | --- | --- | --- | --- |
| (0, 0) 左上 | `(223,238,243)` | **27.4%** | `(230,242,245)` | 17.5% |
| (380, 0) 顶中 | `(228,242,245)` | **18.6%** | `(232,244,246)` | 13.4% |
| (759, 702) 右下 | `(233,242,246)` | **14.8%** | `(233,242,246)` | 14.8%（该点由第三档 `#4C8DAE 18%` 主导，未受影响） |

反解口径：`α ≈ (Base_ch − Pixel_ch) / (Base_ch − Stop0_ch)`，三通道取均值（三通道单独算出的 α 互相吻合到 0.001 以内，故该式自洽）。
**注意**：这是「按主导色单色反解」的等效 α，不解释为令牌里该写的数值；径向渐变在空间上连续衰减，任何单点 α 都只是采样值。

---

## 5. 证据边界（现有手段**无法**验证的结论，明确标注）

1. **iOS 26 系统 chrome 与自绘悬浮 Tab 栏的关系**：本环境无真机、无可用模拟器运行时。所有相关主张（是否复用系统 chrome、
   `liquid-glass` 系统层的实际尺寸/材质叠加）**只能靠真机截图量测**，本稿 0 证据。
2. **真机渲染与视觉量测**：本文的像素量测全部来自 `headless Chrome`（桌面引擎 + 非 Retina 缩放 +
   字体回退到 macOS 系统字体），**不能**代表 iOS/Android 真机渲染。颜色因 sRGB 直算偏差很小，但字体度量、模糊核、圆角抗锯齿都不同。
3. **字体嵌入体积与 CJK 行高**：`MiSans / HarmonyOS Sans SC` 未入库（仓库里无任何字体文件），
   9MB+ 体积、子集化收益、CJK 行高比只能等字体落地后实测；本稿只验证了「令牌里 `typography.family` 两端都不生成」（V14）。
4. **iOS 真机行高**：附录 A 是 **macOS** 上 `NSFont.systemFont` 的 CoreText 度量（自然比值 1.17773）。
   iOS 的 SF Pro 度量表、以及 SwiftUI `lineSpacing` 在**首行**与**多行**上的确切叠加语义，本稿**未验证**；
   因此 V12 的「两端相差 6.04pt」与 §3.2 对 `−0.13pt` 的复算**都是度量学结论**，须以真机/模拟器实测收口。
5. **Android 运行时行为**：`lineHeight` 在 Compose 中的实际行高（是否受 `includeFontPadding`、`fontScale` 影响）、
   `WDLinearGradientBrush` 在真实尺寸下与 CSS 渐变的等效性，本环境无编译/运行能力，**未验证**。
6. **「两端能编译」与「apiCheck 通过」**：`swift build` 与 `./gradlew` 在本环境因写权限失败（§1.4 原始报错）。
   iOS 侧只有 `swiftc -typecheck -target arm64-apple-ios17.0` 的 exit 0（命令 7）；**Android 侧零编译证据**；
   `api/wisdom-ui.api` 只能核对「符号存在」，**无法判定是否与当前源码逐字节一致**（需 `apiDump`）。
7. **Spring 曲线的实际差异**：V11 只证明「两端生成时丢的字段不同」，
   `Animation.spring(response:dampingFraction:)` 与 `spring(dampingRatio,stiffness)` 两条曲线差多少（位移/时间曲线），**未做数值对比**。
8. **深色态渲染**：除色晕的取值核查（V16，`--wd-wash` 未包 `light-dark()`）外，
   4 个设计产物的深色态**未逐一渲染量测**（`light-dark()` 的解析、深色玻璃/阴影/描边在深色底上的合成都没有像素证据）。
9. **对比度**：本文**不提供任何对比度断言结果**（属于其他角色的范围）；只提供「仓库里没有对比度断言代码 / 配置」这一检索事实（V15）。
10. **沙箱与工作区**：所有临时脚本、harness、截图、模块缓存都在 `/tmp/wdev/`（未入库、未提交）；
    取证跑完后三个仓库的改动与 §1.1 基线一致（`iOS`/`android` 各 0 行，`wisdomdesign` 仍为 1 改 + 7 未跟踪）。
    本文自身是 `wisdomdesign` 仓库里的**新增一个未跟踪文件**。

---

## 附录 A · 系统字体行高实测（CoreText）

程序（`swiftc -O` 编译后运行；度量随机器/系统版本变化，下方为本机实测值）：

```swift
import Foundation; import CoreText; import AppKit
for (n, s, lh) in [("largeTitle",34.0,41.0),("title1",28,34),("title2",22,28),("title3",20,25),
                   ("headline",17,22),("body",17,22),("callout",16,21),("subheadline",15,20),
                   ("footnote",13,18),("caption1",12,16),("caption2",11,13),("overline",12,16)] {
  let ct = NSFont.systemFont(ofSize: CGFloat(s)) as CTFont
  let sys = CTFontGetAscent(ct) + CTFontGetDescent(ct) + CTFontGetLeading(ct)
  let spacing = max(0, CGFloat(lh) - CGFloat(s))          // 现有 iOS 实现 WDTokenTypes.swift:23
  print(n, s, lh, sys, sys/s, spacing, sys + spacing, sys - CGFloat(s))
}
```

| 档位 | 字号 | 令牌 LH | 系统天然行高 | 天然比 | iOS `lineSpacing` | iOS 实际行高 | 实际 − 令牌 | Android LH |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| largeTitle | 34 | 41 | 40.0430 | 1.17773 | 7 | **47.0430** | **+6.0430** | 41 |
| title1 | 28 | 34 | 32.9766 | 1.17773 | 6 | **38.9766** | +4.9766 | 34 |
| title2 | 22 | 28 | 25.9102 | 1.17773 | 6 | **31.9102** | +3.9102 | 28 |
| title3 | 20 | 25 | 23.5547 | 1.17773 | 5 | **28.5547** | +3.5547 | 25 |
| headline | 17 | 22 | 20.0215 | 1.17773 | 5 | **25.0215** | +3.0215 | 22 |
| body | 17 | 22 | 20.0215 | 1.17773 | 5 | **25.0215** | +3.0215 | 22 |
| callout | 16 | 21 | 18.8438 | 1.17774 | 5 | **23.8438** | +2.8438 | 21 |
| subheadline | 15 | 20 | 17.6660 | 1.17773 | 5 | **22.6660** | +2.6660 | 20 |
| footnote | 13 | 18 | 15.3105 | 1.17773 | 5 | **20.3105** | +2.3105 | 18 |
| caption1 | 12 | 16 | 14.1328 | 1.17773 | 4 | **18.1328** | +2.1328 | 16 |
| caption2 | 11 | 13 | 12.9551 | 1.17774 | 2 | **14.9551** | +1.9551 | 13 |
| overline | 12 | 16 | 14.1328 | 1.17773 | 4 | **18.1328** | +2.1328 | 16 |

（`CTFontGetLeading` 在这 12 档上均为 0，故天然行高 = ascent + descent。）

## 附录 B · 令牌叶子 → 生成产物覆盖

口径：把令牌叶子按生成器的命名规则（`camel(group,key)`、`space.<k>→s<k>`、`su`、`e0/e1/e2/e3/brand`、
`motion.duration→Duration.<k>` / `duration<K>`、`motion.spring→Spring.<k>` / `spring<K>`）展开成期望符号名，
再用 `(?:static (?:let|val)|const val|public val|public const val)\s+<name>\b` 在两端生成产物里查。
`semantic.light/dark.gradient.{surface,fill}` 的期望名按 `WDGradient.surface/fill`、`WDGradients.surface/fill` 计。

| 组 | 叶子数 | Swift 生成 | Kotlin 生成 |
| --- | --- | --- | --- |
| semantic 颜色 | 54 | 54 | 54 |
| semantic 渐变 | 4 | 4 | 4 |
| color.named / derived / su | 9 / 6 / 12 | 9 / 6 / 12 | 9 / 6 / 12 |
| space / radius / size | 10 / 9 / 18 | 10 / 9 / 18 | 10 / 9 / 18 |
| typography（12 档） | 12 | 12 | 12 |
| typography.family | 1 | **0** | **0** |
| gradient（顶层 3 条） | 3 | 3 | 3 |
| elevation | 5 | 5 | **0** |
| material | 6 | **0** | **0** |
| motion.duration | 5 | 5 | 5 |
| motion.spring | 3 | 3 | 3 |
| motion.component | 10 | **0** | **0** |
| **合计** | **167**（+ `typography.family` 合并计入） | **150** | **145** |

另有字段级丢失：`typography.overline.letterSpacing = 0.6`（`tokens/wisdom.tokens.json:173`）在两端产物中出现 **0** 次。

## 附录 C · 脚本要点（本文用到的非平凡脚本）

1. **叶子遍历**：递归 JSON，遇到含 `$value` 的对象即记为一个叶子（键以 `$` 开头的一律跳过），路径用 `.` 连接。
2. **覆盖检查**：见附录 B 口径；命名规则直接抄 `build.js:74-84`（`lowerFirst/upperFirst/camel`）。
3. **CSS 令牌对账**：见 §1.3(a)。
4. **像素量测**：见 §1.3(b)；PNG 解码用 Python `zlib` 手工实现（IHDR/IDAT/PLTE/IEND + filter 0–4），
   只处理非隔行、8-bit、channels ∈ {3,4}。

---

← 返回：[第一轮结论清单](11-conclusions.md) ｜ [设计基础](01-foundation.md) ｜ [架构](04-architecture.md) ｜ [组件规格索引](specs/README.md)
