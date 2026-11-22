# R2 · iOS Provider 与 AIStarter 独立复核

> 复核任务：t2 / r2-ios（WisdomDesign AI Skill 流水线 t1–t13 独立复核）
> 复核者：ios-reviewer（只读复核；未改 iOS 源码、generated 或 API 基线）
> 复核时间：2026-11-22 10:11–10:26（Asia/Shanghai）
> 环境：Xcode 26.6 (17F113)，Swift 6.3.3，iOS 26.5 / iOS 17.5 Simulator（CE28D919-7BEB-46B2-86A7-1D063E54303F）
> 结论：**needs_revision**（核心运行证据可复现；但 M0 卡片 schema 符合性、status 证据计算、证据引用与命令可复现性存在需修正项，见 §5）

## 0. 一句话结论

t5（iOS Provider）与 t6（AIStarter / 消费侧验证）**不是伪造证据**：Release 消费方构建、swiftc typecheck、脚手架安全与 UI matrix blocked 四项关键声明均已被本轮独立复跑证实（含退出码）；provider 也没有自认证 `verified`。但交付物存在 **1 个 high（33/33 API 卡违反 M0 冻结 schema）** 与 **3 个 medium（status 未由构建器计算、typecheck 记录命令不可运行、证据引用悬空）**，因此不能判为 pass。

---

## 1. 复核项与结论一览

| # | 复核项 | 独立复核结论 | 等级 |
| --- | --- | --- | --- |
| 1 | 33 张 API 卡数量 / 索引 / 文件一致 | 33 张，index 与磁盘完全一致；磁盘另有 index.json + SOURCES.json | ✅ 通过 |
| 2 | 每张卡可追溯到公开 `api/WisdomUI.api.json` | 33/33 主引用（symbol）可解析、signature 与当前快照逐字相等；**33/33 次引用 `SOURCES.json#<symbol>` 悬空** | ⚠️ 部分（F4） |
| 3 | 卡片符合 M0 `api-card.schema.json` | **33/33 违反**（`additionalProperties:false` 不允许 `iosLabel`；仓库内 schema-lite 已实测复现） | ❌ high（F1） |
| 4 | 卡片生成可复现 | 对 `provider.json` 声明的基线快照（c3c32f3）重放：**逐字节一致**（33 卡，diff rc=0）；对当前 HEAD 快照：**rc=1 拒绝生成**（api 快照 hash 已变） | ⚠️ 部分（F6） |
| 5 | provider status 由证据计算 | **未实现**：没有任何构建器代码重算 `status.effective`；`computedAtBuild:true` 是手写 JSON；打包器仅复制该字段 | ❌ medium（F2） |
| 6 | provider 未自认证 `verified` | `declared=effective=experimental`；`validate_provider.py` 强制 `effective != verified`；全仓未见 iOS `verified` 声明 | ✅ 通过（但校验未接入 CI） |
| 7 | AIStarter Release xcodebuild 可复现成功 | 用 verification.json 记录命令复跑：**BUILD SUCCEEDED，exit 0**；`AIStarter.app` + 3 个 .o 重新生成 | ✅ 通过 |
| 8 | swiftc typecheck | 记录命令**按原文不可运行**（路径根混用，rc=1）；修正路径后 exit 0 | ⚠️ 命令不可复现（F3） |
| 9 | 脚手架拒绝覆盖 / 路径逃逸 / 合法复制 | 覆盖 rc=1；`../` 与 `../../` rc=1；symlink 逃逸 rc=1；非法 page id / 缺目录 / 非法文件名 / 无参数 rc=1；合法复制 rc=0 且内容逐字节相同 | ✅ 通过 |
| 10 | UI matrix blocked 如实标注 | 按记录命令复跑：**TEST FAILED，exit 65，Pseudo Terminal Setup Error，0 断言执行**（与 t6 的 xcresult 一致）；provider 未把它写成通过 | ✅ 通过（报告文件过期见 F5） |
| 11 | 5 个原有 dirty 源文件未被本次工作改动 | 按可获得的证据（写边界、mtime、提交归属、工作区状态）**未发现 AI Skill 流水线写入**；但这 5 个文件已被随后（09:56）的 iOS 组件提交 64539fe 收编，provider 的 dirty 快照已不对应当前 HEAD | ✅ 对 AI Skill 工作成立；⚠️ 快照过期（F6） |
| 12 | 证据等级与结论匹配 | 状态 `experimental` 与 `discovered` 卡片 + blocked UI matrix 匹配；但 `computedAtBuild` 与 `apiEvidenceMinimum` 的语义需要澄清 | ⚠️ 部分（F2/F8） |

---

## 2. 复核环境与只读边界

- 工作区：`<workspace>`；iOS 仓 `iOS/`（git HEAD `64539fe78d9a036a6e34cbfa01c72e4430c0e2b0`，2026-11-22 09:56:28 +0800）。
- 只读边界：本轮**只写** `wisdomdesign/AIOptimize/review/02-ios.md` 一个文件；未修改 iOS 源码、`Sources/WisdomUI/Foundation/generated/**`、`api/WisdomUI.api.json`、`ai/` 与 `AIStarter/` 任何交付物。
- 复跑会产生 `iOS/.build/**` 构建缓存（gitignored，非源码）；另在路径命令测试中生成的临时目录 `iOS/iOS/.build/module-cache` 已由复核者清理。复核前后 `git status` 的 tracked 变更始终只有 `.gitignore`（见 §7）。
- 复核开始前 iOS 工作区已有一处非本轮改动：`.gitignore` 于 10:00:56 被修改（移除了 `/AIStarter/`、`/ai/` 两行忽略项），使 AI 交付物在 `git status` 中显示为 untracked。该修改早于本轮任务（10:11），**不是本轮复核所为**。

---

## 3. 重跑命令与退出码（核心证据）

> 所有命令均在 `<workspace>` 执行，除特别注明 cwd 外。`EXIT` 为命令真实退出码。

| # | 命令（摘要） | 退出码 | 结果 |
| --- | --- | --- | --- |
| 1 | `python3 iOS/ai/skill-provider/validate_provider.py` | **0** | `M2 iOS provider validation passed: 33 cards, status=experimental` |
| 2 | node + 仓库内 `schema-lite.js` 校验 33 张真实卡 | 0 | **33/33 报 `ADDITIONAL_PROPERTY: unknown property iosLabel`**；provider/capabilities 均为 0 错误 |
| 3 | 去掉 `iosLabel` 后再用 schema-lite 校验 | 0 | **0 张仍不合法**（证明唯一违反项就是 `iosLabel`） |
| 4 | 在镜像目录重放 `generate_api_cards.py`（输入 = `c3c32f3:api/WisdomUI.api.json`，sha256 123136bd…） | **0** | `wrote 33 API cards`；与仓库卡逐字节 `diff -r` **rc=0** |
| 5 | 同一生成器 + 当前 `api/WisdomUI.api.json`（sha256 1d3be9d7…） | **1** | `public snapshot drift: api=1d3be9d7… icon=0b2761c4…`（防漂移 pin 拒绝） |
| 6 | verification.json #1：Release xcodebuild（`-destination 'generic/platform=iOS Simulator' -derivedDataPath iOS/.build/dd-ai-starter-rel`） | **0** | `** BUILD SUCCEEDED **`；`AIStarter.app` 与 `AIStarterApp.o/APIMinimalExample.o/TaskListView.o` 均重新生成（10:15） |
| 7 | verification.json #2 原文命令（cwd=工作区根） | **1** | `error opening input file 'AIStarter/AIStarter/…'`（路径根错误） |
| 8 | verification.json #2 原文命令（cwd=iOS） | **1** | `no such module 'WisdomUI'`（`-I iOS/.build/…` 在 iOS 下解析为 `iOS/iOS/.build`） |
| 9 | 修正路径后的 typecheck（cwd=iOS，`-I .build/dd-ai-starter-rel/Build/Products/Release-iphonesimulator`） | **0** | 4 个源文件（AIStarterApp/ContentView/APIMinimalExample/TaskListView）通过 |
| 10 | 脚手架合法复制（镜像树，`copy_template.py task-list Out/Copied`） | **0** | 复制成功；`cmp` 与模板 **rc=0**（逐字节相同） |
| 11 | 脚手架覆盖已有文件 | **1** | `refusing to overwrite existing file` |
| 12 | 脚手架 `../Evil` / `../../Evil` / symlink 跳出 | **1 / 1 / 1** | 均 `destination escapes workspace`；未写出目标文件 |
| 13 | 非法 page id / 目标目录不存在 / 非法文件名 / 无参数 | **1 / 1 / 1 / 1** | 各自拒绝 |
| 14 | verification.json #5：UI matrix `xcodebuild test`（CE28D919） | **65** | 构建成功，test runner 启动失败：`Pseudo Terminal Setup Error … Operation not permitted`，`** TEST FAILED **`；新 xcresult：`iOS/.build/dd-ai-starter-test/Logs/Test/Test-AIStarter-2026.11.22_10-15-50-+0800.xcresult` |
| 15 | 旧证据 `iOS/.build/ai-starter-t6.xcresult`（2026-11-21 18:45:29–18:46:35） | — | buildResult=succeeded；errors 恰为 Pseudo Terminal Setup Error + xctest runner 启动失败；destination=CE28D919（iPhone 15 Pro, iOS 17.5） |
| 16 | `git show c3c32f3:api/WisdomUI.api.json \| shasum -a 256` | 0 | `123136bd…`，与生成器 pin、SOURCES.json、baseline 一致 |
| 17 | 当前 `shasum -a 256 iOS/api/WisdomUI.api.json` | 0 | `1d3be9d7…`（HEAD 64539fe，已变） |

---

## 4. 逐项核验

### 4.1 33 张 API 卡：数量、索引、溯源、可复现性

**数量与索引**
- 磁盘 `iOS/ai/skill-provider/api-cards/` 共 35 个 JSON = **33 张卡** + `index.json` + `SOURCES.json`；`index.json` 的 33 项与磁盘 33 张卡**完全一致、无重复**。
- 卡片覆盖 15 个 API 类型（其中 10 个是 37 组件目录中的组件：WDBanner/WDButton/WDEmptyState/WDFAB/WDFormRow/WDListRow/WDListSection/WDPullRefresh/WDSkeleton/WDTextField；另 5 个是 Foundation 公开入口：WDTheme/WDTextStyle/WDSemantics/WDGlass/WDEffectsBudget）。

**主溯源：通过**
- `validate_provider.py` exit 0：每张卡的 `symbol` 必须存在于 `api/WisdomUI.api.json`，且至少有 `access == public` 声明；卡内 `signature` 以 ` | ` 拆分后必须与快照中的 `decl` 逐条**字符串相等**。33/33 通过（对**当前** API 快照同样通过）。
- 生成器对 33 张卡的主引用写为 `api/WisdomUI.api.json#<symbol>`，可解析。

**次溯源：33/33 悬空（F4）**
- 每张卡的第 2 条 `sourceRefs` 为 `ai/skill-provider/api-cards/SOURCES.json#<symbol>`；但 `SOURCES.json` 只有 7 个顶层键（schemaVersion/platform/generatedAt/policy/baseline/sourceRefs/driftPolicy），**没有任何 symbol 级条目**。脚本实测 33/33 片段无法解析。
- 另有 3 处证据引用 `ai/skill-provider/verification.json#ios-minimal-compile`（[provider.json](iOS/ai/skill-provider/provider.json:35) 1 处，[capabilities.json](iOS/ai/skill-provider/capabilities.json:11)、[capabilities.json](iOS/ai/skill-provider/capabilities.json:74) 各 1 处），而 verification.json 的 5 个 command id 中没有 `ios-minimal-compile`（实际是 `ios-minimal-typecheck` / `ios-consumer-xcodebuild-release`）。`validate_provider.py` 不校验引用可解析性，因此未发现。

**M0 schema 符合性：33/33 失败（F1，high）**
- 冻结 schema [api-card.schema.json](wisdomdesign/ai/skill/provider/api-card.schema.json:6) 明确 `additionalProperties: false`，properties 中**没有 `iosLabel`**；生成器 [generate_api_cards.py](iOS/ai/skill-provider/api-cards/generate_api_cards.py:68) 却给每张卡写入 `iosLabel`。
- 用仓库自身的 [schema-lite.js](wisdomdesign/tools/ai-skill/lib/schema-lite.js:63)（支持 `additionalProperties:false`）校验真实卡：**33/33 报 `ADDITIONAL_PROPERTY unknown property iosLabel`**；删除该字段后 33/33 通过，说明这是唯一违反项。
- [validate_provider.py](iOS/ai/skill-provider/validate_provider.py:44) 只做了 `required` 键、字段非空、symbol/signature 的自定义检查，没有调用 schema-lite / 完整 JSON Schema，所以其 “passed” 是**子集校验**，不能支撑 “卡片符合 M0 契约” 的结论。
- 修复路径二选一（均需契约所有者确认）：① 走 M0 契约变更，在 schema 中正式增加受控的 `iosLabel` 字段；② 从卡中去掉该字段（iOS 标签信息已有 `signature`/`callShape`），并把 `validate_provider.py` 改为对每张卡执行 schema-lite 校验。

**可复现性**
- 在隔离镜像中用**同一生成器代码**、输入 `git show c3c32f3:api/WisdomUI.api.json`（sha256 123136bd…，与 pin 相符）重放：exit 0，33 张卡与仓库现有卡**逐字节一致**（`diff -r` rc=0）。→ 卡片内容确实由该快照确定性生成，非手改。
- 但当前 HEAD 的 `api/WisdomUI.api.json` 已是 1d3be9d7…（随 64539fe 变更）；用当前快照重放生成器 exit 1（`public snapshot drift`）。即：**快照级可复现成立，当前仓状态级不可复现**（F6）。`SOURCES.json` 也如实记录 baseline apiSnapshotSha256=123136bd…，不属于伪造。

### 4.2 provider status：结论保守正确，但“由证据计算”未实现

- [provider.json](iOS/ai/skill-provider/provider.json:28)：`declared=experimental`，`effective=experimental`，`reason` 说明 “Public symbols discovered and a minimal consumer example compiled; runtime matrix not executed”。该结论与 §4.1/§4.6 的实际证据**匹配**：卡片 33/33 是 `discovered` 级，消费者构建仅证明 golden page 用到的调用形态编译通过，UI/快照矩阵 blocked，达不到 `template-verified`。因此 `experimental` 是正确且保守的，**没有自认证 verified**。
- 但 [status-policy.md](wisdomdesign/ai/skill/provider/status-policy.md:20) 要求 `status.effective` 必须由构建器根据证据重算；全仓检索结果：**没有任何构建器代码读取 verification.json/capabilities 计算 status**。唯一的消费者是 [package.py](wisdomdesign/tools/ai-skill/package.py:128)，它只 `read_json(provider.json).get("status")` 并原样写入 manifest；[validate_provider.py](iOS/ai/skill-provider/validate_provider.py:24) 只断言 `effective in STATUS 且 != verified`。因此 [provider.json](iOS/ai/skill-provider/provider.json:37) 的 `"computedAtBuild": true` 是**手写声明，无代码支撑**（F2）。
- `validate_provider.py` 未接入任何 CI：iOS `.github/workflows/ci.yml`、wisdomdesign `.github/workflows/ai-skill-ci.yml` 均无调用；只在 dist 包的 manifest 哈希表中出现（作为被复制文件）。因此 “final validation passed” 目前是**人工一次性运行**，不可持续审计。

### 4.3 AIStarter Release xcodebuild：复现成功

- 按 [verification.json](iOS/ai/skill-provider/verification.json:9) 记录的同一条命令复跑（Xcode 26.6，iPhoneSimulator 26.5 SDK，`CODE_SIGNING_ALLOWED=NO`）：**exit 0 / BUILD SUCCEEDED**。
- 产物与证据描述相符：`iOS/.build/dd-ai-starter-rel/Build/Products/Release-iphonesimulator/AIStarter.app`，arm64 与 x86_64 的 `AIStarterApp.o`、`APIMinimalExample.o`、`TaskListView.o` 均在 10:15 重新生成；构建过程重新编译了 WisdomUI Release（说明不是“空增量”复用旧产物）。
- 小瑕疵（非本轮核心）：[capabilities.json](iOS/ai/skill-provider/capabilities.json:22) 与 [README.md](iOS/AIStarter/README.md:11) 引用的命令是 `-destination generic/platform=iOS`（真机 SDK），但保留的构建产物只有 `Release-iphonesimulator` / `Debug-iphonesimulator`，没有 `Release-iphoneos`；实际取证命令是 simulator generic。建议统一文案，避免读者误解为真机编译已跑。

### 4.4 swiftc typecheck：结论真，记录命令假

- [verification.json](iOS/ai/skill-provider/verification.json:17) 的命令把源文件写成 `AIStarter/AIStarter/*.swift`（iOS 仓内相对），却把模块搜索路径写成 `iOS/.build/...`（工作区根相对）——**两个根混用**：
  - cwd=工作区根：源文件不存在，rc=1；
  - cwd=iOS：源码存在，但 `-I iOS/.build/...` 解析为 `iOS/iOS/.build/...`，`no such module 'WisdomUI'`，rc=1；
  - 修正为 cwd=iOS + `-I .build/dd-ai-starter-rel/Build/Products/Release-iphonesimulator`：**rc=0**，4 个源文件通过。
- 因此 typecheck 结论本身**成立**，但记录的命令不能原样复现（F3）。另有三处口径不一致：README 说检查 3 个文件，verification 命令列 4 个，t6 任务输出说 5 个源文件；建议统一为实际执行的 4 个。

### 4.5 脚手架安全：全部通过（含额外边界）

对 [copy_template.py](iOS/AIStarter/AIStarter/copy_template.py:17) 在隔离镜像（保留脚本/模板相对路径，避免写入 iOS 仓）执行：

| 用例 | 结果 |
| --- | --- |
| 合法复制 `task-list Out/Copied` | **rc=0**；与模板 `cmp` 逐字节相同 |
| 重复复制同一目标（覆盖） | **rc=1**，`refusing to overwrite existing file` |
| `task-list ../Evil` / `../../Evil` | **rc=1**，`destination escapes workspace` |
| 目标目录是指向仓外的 symlink | **rc=1**，`destination escapes workspace`；仓外未产生文件 |
| 非法 page id / 目标目录不存在 / 非法文件名 / 无参数 | 均 **rc=1** |
| 在真实仓库内测试覆盖与逃逸（只触发拒绝、不写入） | 分别 rc=1 / rc=1 |

结论：**默认拒绝覆盖、路径逃逸拒绝、合法复制**三项均成立。说明：该工具是“白名单 + 路径校验 + 逐字节复制”，并**不做**流水线方案 §9.3 所说的“受控标识符替换”；`AIStarter/Generated/TaskListView.swift` 与模板完全相同（仍叫 `AISkillTaskListView`），应用内的 `AIStarter/AIStarter/TaskListView.swift` 只是模板改了一个 struct 名（另无尾换行）。README 对“copy_template.py 仅复制”的描述是准确的，故不列为缺陷，仅提示与方案措辞存在差距。

### 4.6 verification.json 与 UI matrix：blocked 为真，周边文档过期

- **blocked 属实**：按 [verification.json](iOS/ai/skill-provider/verification.json:41) 的命令复跑（Release、CE28D919、`-only-testing:GoldenPageMatrixTests`）：构建成功、测试宿主启动失败，`** TEST FAILED **`，**exit 65**，错误为 `Pseudo Terminal Setup Error` / `xctest … Failed to install or launch the test runner … Operation not permitted`，0 个 UI 断言执行。该失败模式与 t6 留下的 `ai-starter-t6.xcresult`（2026-11-21 18:45:29–18:46:35，buildResult=succeeded，device=CE28D919）**完全一致**。因此 “UI matrix blocked、未冒充通过” 的声明可信。
- `runtimeMatrix` 的 loading/content/empty/error/AX3/shortText/longText = `blocked-sandbox-pseudo-terminal`；light/dark/systemBack/safeAreaTab/keyboardScroll/voiceOver = `not-run`；`unverified` 列出 UI matrix、device run、host load、design review、iOS 26 glass、contrast/VoiceOver——与“只做了构建+typecheck”的事实一致，未发现把未验证项写成通过。
- **证据链过期（F5）**：[GoldenPageMatrixReport.json](iOS/AIStarter/GoldenPageMatrixReport.json:6) 记录的是 18:39–18:40 的**两次构建失败**（Debug PreviewsMacros 插件、Release `_main` undefined），模拟器为 iPhone Air `711BF16D…`（iOS 26.5），**不包含** 18:45 最终那次 test-runner 启动失败（CE28D919）；[README.md](iOS/AIStarter/README.md:14) 同样只写到两次 BUILD FAILED。verification.json 却引用最终 PTY 失败。三份文档各说一段，虽然结论（blocked / 0 executed）不矛盾，但报告文件不是最终证据的准确索引。
- **配置疑点（F7）**：`GoldenPageMatrixTests` target 的 `productType = com.apple.product-type.bundle.unit-test`（[project.pbxproj](iOS/AIStarter/AIStarter.xcodeproj/project.pbxproj:127)），没有 `TEST_HOST` / `TEST_TARGET_NAME`，也没有对 AIStarter app 的 target dependency；而测试代码使用 `XCUIApplication`（UI 测试 API）。因此即使沙箱允许 PTY，该 target 能否作为 UI 测试运行也存在结构性疑问。blocked 结论仍诚实（未执行），但“唯一原因是沙箱”这一归因未被证明。

### 4.7 5 个原有 dirty 源文件与基线

基线清单来自 [baseline.json](wisdomdesign/ai/skill/m0/baseline.json:21)：
1. `Sources/WisdomUI/Components/Composites/WDToolbar/WDToolbar.swift`
2. `Sources/WisdomUI/Components/Composites/WDToolbar/WDToolbarTooltip.swift`
3. `Sources/WisdomUI/Components/Primitives/WDAvatar/WDAvatar.swift`
4. `Sources/WisdomUI/Components/Primitives/WDCard/WDCard.swift`
5. `Tests/WisdomUITests/Components/WDCardTests.swift`

复核证据：
- **工作区状态**：`git status --porcelain -uall` 中 `Sources/**`、`Tests/**`、`api/**` 均无变更；tracked diff 只有 `.gitignore`（见 §7）。5 个文件与 HEAD 完全一致。
- **提交归属**：基线 commit 是 `c3c32f3`（2026-11-21 17:22:59）；之后唯一提交是 `64539fe`（2026-11-22 09:56:28，A-11/A-13/A-14 组件收口），其文件清单**正好包含这 5 个文件**（外加 .gitignore/CHANGELOG/.review-temp/API/测试等），说明这 5 个 dirty 编辑后来被 iOS 组件工作流提交，而非 AI Skill 流水线。
- **时间线**：AI Skill 归档任务 t5/t6/t9 的更新时间止于 2026-11-21 18:30–18:47；AI 交付物 mtime 为 18:20–18:46。5 个文件中 4 个的 mtime 为 11-21 17:56–18:01（早于基线捕获 18:13 与 AI 工作）；`WDToolbarTooltip.swift` mtime 为 11-22 09:14:57（晚于 AI 工作结束，早于 64539fe 09:56），只能由 iOS 组件工作流解释。
- **写边界**：[provider.json](iOS/ai/skill-provider/provider.json:51) 声明 AI 交付物允许写入范围仅 `iOS/ai/skill-provider/**`、`iOS/AIStarter/**`；生成器/校验器均只读 `api/WisdomUI.api.json` 与 `WDIconName.swift`，无写这些源文件的代码路径。
- **结论**：按现有证据，**没有发现 AI Skill 流水线改动这 5 个文件**；但“dirty 隔离”只描述 2026-11-21 18:13 的基线快照，当前 HEAD 已 clean 且包含这些内容，provider.json 的 `dirty=true`/`dirtyFiles` 已不能作为当前仓状态说明（F6）。
- 局限：baseline 只记录整仓 `trackedContentHash`（2b5313…）而无逐文件 hash，且该 hash 的生成脚本未随 M0 落库，故无法在本轮**逐字节**证明 5 个文件与基线 dirty 内容相同；只能证明“本轮/流水线未写入 + 后续提交归属”。

### 4.8 证据等级与结论匹配度

| 对象 | 声称等级 | 实际证据 | 匹配性 |
| --- | --- | --- | --- |
| 33 张 API 卡 | `discovered` | 公开符号快照逐字比对通过；无逐卡编译 | ✅ 匹配（index `evidenceMinimum=discovered` 正确） |
| provider 状态 | `experimental` | 消费者 Release 构建通过；UI matrix blocked；设计评审未做 | ✅ 结论正确、保守 |
| `status.computedAtBuild` | `true` | 无构建器重算代码，静态 JSON | ❌ 不匹配（F2） |
| `verification.apiEvidenceMinimum` | `example-compiled` | golden-matrix 对该字段的语义是“黄金页面 API 使用最低证据”；消费者工程编译覆盖了 golden page 的调用形态；但 33 张卡本身仍是 `discovered` | ⚠️ 语义不清（建议注明“golden page 级”而非“逐卡级”） |
| AIStarter Release build | `passed / exit 0` | 独立复跑 exit 0 + 产物 | ✅ 匹配 |
| AIStarter typecheck | `passed / exit 0` | 修正路径后 exit 0；记录命令 rc=1 | ⚠️ 结论真、命令不可复现（F3） |
| UI matrix | `blocked` | 独立复跑 exit 65、PTY 错误、0 断言 | ✅ 匹配（但报告文件过期 F5） |
| ios-library-gate | `not-run` | 未执行 `Scripts/ci.sh pr`，未声称通过 | ✅ 诚实 |

补充覆盖事实：33 张卡覆盖 **10/37** 个目录组件（+5 个 Foundation 入口）；其余 27 个组件无 API 卡。这是 M2 纵向切片的合理范围，但 `verification.json`/`capabilities.json` 的未验证清单未显式写“组件 API 覆盖 10/37”，建议补充，避免读者高估覆盖（F8，观察项）。

---

## 5. Findings（需修正）

| ID | 严重度 | 问题 | 必要修复 |
| --- | --- | --- | --- |
| **IOS-R2-F1** | **high** | 33/33 API 卡违反 M0 冻结 [api-card.schema.json](wisdomdesign/ai/skill/provider/api-card.schema.json:6) 的 `additionalProperties:false`：每张卡多出 `iosLabel`；仓库内 schema-lite 实测 33/33 `ADDITIONAL_PROPERTY`。而 [validate_provider.py](iOS/ai/skill-provider/validate_provider.py:44) 只查 required 键，未做 schema 校验，导致 “final validation passed” 是子集结论。 | 二选一：① 走 M0 契约变更，在 schema 正式增加受控字段（并同步 provider/消费方）；② 从 [generate_api_cards.py](iOS/ai/skill-provider/api-cards/generate_api_cards.py:68) 删除 `iosLabel` 并重生成 33 卡。无论哪种，`validate_provider.py` 必须对每张卡执行 schema-lite/完整 JSON Schema，且断言 `index.cards == 磁盘卡文件 == 33`（现为 `count >= 30`，[validate_provider.py](iOS/ai/skill-provider/validate_provider.py:54)）。 |
| **IOS-R2-F2** | **medium** | provider status 并非“由证据计算”：无构建器代码重算 `effective`；[package.py](wisdomdesign/tools/ai-skill/package.py:128) 仅复制；`computedAtBuild: true`（[provider.json](iOS/ai/skill-provider/provider.json:37)）无支撑。`validate_provider.py` 也未接入任何 CI，是一次性人工校验。 | ① 实现构建期重算（至少按 `verification.json` 的 passed/blocked/not-run 与卡片 evidence 推导 experimental/verified 门槛），或把 `computedAtBuild` 改为 false/去除并如实写“authored snapshot”；② 将 `validate_provider.py` 接入 iOS 或 wisdomdesign CI，记录命令与退出码。 |
| **IOS-R2-F3** | **medium** | [verification.json](iOS/ai/skill-provider/verification.json:17) 的 `ios-minimal-typecheck` 命令把 iOS 仓相对路径与工作区相对 `-I` 混用，按原文从任一 cwd 都 rc=1（源文件不存在 / no such module）；只有修正路径后才 exit 0。且 README/任务输出对源文件数（3/4/5）说法不一。 | 记录**可原样复制**的命令（明确 cwd、统一路径根），并附实际退出码；统一源文件计数为 4。 |
| **IOS-R2-F4** | **medium** | 证据引用悬空：33/33 张卡的 `SOURCES.json#<symbol>` 片段在 SOURCES.json 中不存在；3 处 `verification.json#ios-minimal-compile` 指向不存在的 command id（应为 `ios-minimal-typecheck`/`ios-consumer-xcodebuild-release`）。 | 修正 [generate_api_cards.py](iOS/ai/skill-provider/api-cards/generate_api_cards.py:70) 的次引用（指向真正的锚点或删除），修正 provider/capabilities 的 evidenceRefs；在 validator 中增加“引用文件存在且片段可解析”的检查。 |
| **IOS-R2-F5** | **low** | [GoldenPageMatrixReport.json](iOS/AIStarter/GoldenPageMatrixReport.json:11) 与 [README.md](iOS/AIStarter/README.md:14) 只记录最终修复前的两次构建失败（iPhone Air 711BF16D / PreviewsMacros / `_main`），未记录 18:45 最终 test-runner PTY 失败（CE28D919）；与 [verification.json](iOS/ai/skill-provider/verification.json:41) 的 blocked 证据不是同一次尝试。 | 用最终 attempt 更新报告/README（命令、模拟器 UDID、xcresult 路径、错误、0 断言），或把历史两次失败明确标为“修复前”。 |
| **IOS-R2-F6** | **low** | provider 快照/打包元数据与当前仓不同步：provider 记录 `c3c32f3` + dirty=true，而 HEAD 为 `64539fe` 且 clean；API 快照 123136bd…→1d3be9d7…，生成器对当前快照直接 exit 1；dist 的 iOS manifest 记录 sources.ios.commit=64539fe 却内嵌 c3c32f3 的 provider；manifest `apiCardFiles=35` 把 index/SOURCES 计成卡（实际 33）。 | 在 provider 中显式区分“快照 commit”与“打包输入 commit”，或在打包时校验两者一致；API 变化时 bump pin 并重生成；修正 `apiCardFiles` 计数为 33（或改为 `apiCardJsonFiles` 并注包含 index/SOURCES）。 |
| **IOS-R2-F7** | **low** | `GoldenPageMatrixTests` 是 `bundle.unit-test`（[project.pbxproj](iOS/AIStarter/AIStarter.xcodeproj/project.pbxproj:127)），无 `TEST_HOST`/`TEST_TARGET_NAME`，无 app target 依赖，却使用 `XCUIApplication`；即使 PTY 可用，UI 矩阵能否运行仍存疑。 | 将测试 target 改为 UI testing bundle（或明确以逻辑测试方式覆盖可覆盖部分），补 `TEST_TARGET_NAME`/依赖；若继续 blocked，把“结构性未验证”与“沙箱 blocked”分开记录。 |
| **IOS-R2-F8** | **low** | API 卡只覆盖 10/37 目录组件（+5 Foundation 入口），`verification.json`/`capabilities.json` 未显式声明该覆盖比例。 | 在未验证/覆盖节补一行“组件 API 卡覆盖 10/37（M2 纵向切片范围）”。 |

---

## 6. 未验证与局限（本轮明确未做）

- 未运行 `Scripts/ci.sh pr`（iOS 库级门禁）：verification.json 已如实标 `not-run`，本轮沿用并**不把它当成通过**；它属于平台仓自有门禁，需要真机/模拟器长跑。
- 未做真机运行、宿主加载、独立设计评审、VoiceOver/对比度实测、iOS 26 玻璃运行矩阵——这些均与声明一致，仍为未验证。
- UI matrix 仍 blocked（exit 65）；本轮虽复现，但不构成 UI 通过证据。
- 未对 33 张卡的 `callShape` 逐条做编译验证（卡片证据等级本就是 `discovered`，不应按 `example-compiled` 宣传）。
- 未逐字节证明 5 个 dirty 文件与基线内容相同（baseline 没有逐文件 hash）；只能证明写边界、mtime、提交归属与当前工作区状态。

## 7. 复核边界与工作区状态声明

- 本轮**唯一写入的文件**：`wisdomdesign/AIOptimize/review/02-ios.md`。
- 复核结束复核时 iOS 工作区：
  - HEAD = `64539fe78d9a036a6e34cbfa01c72e4430c0e2b0`；
  - tracked 变更：仅 `.gitignore`（3 行忽略项被移除，早于本轮，mtime 10:00:56）；
  - untracked：`AIStarter/**`、`ai/skill-provider/**`（即被复核的交付物）；
  - `Sources/**`、`Tests/**`、`api/WisdomUI.api.json` **零 diff**。
- 关键哈希（复核后）：
  - `api/WisdomUI.api.json` = `1d3be9d703f9ea54710905a6d90db2e9ef7c05b55ab8d8f529c9b2843b725348`
  - `Sources/WisdomUI/Foundation/generated/WDIconName.swift` = `0b2761c4d73ba7e3f5086e7e948e8944c23b9888cc44b97369052f182a6ff761`
  - 5 个基线 dirty 文件（当前 HEAD 内容）：
    - WDToolbar.swift `742c3e91844e3c55c31777bdddc5a0f7344682ed337653b3e41710ffe1e2a711`
    - WDToolbarTooltip.swift `4497fd37ade642a73a2c0b2da480effc2e5c4b39661cf2eb1dd320c5317be670`
    - WDAvatar.swift `56f73e6f958b57ac9c821f29ef8b8a618bfe01fad589160fb444c2b33bae2380`
    - WDCard.swift `c57f28aa6d1225d9303d4635b0d76e560e9581ad803dbb3b4d451b10605c7839`
    - WDCardTests.swift `689bef0c9f48e65184e67f5bd71aaa083777c54f51e9824af4d90bc2083528e9`
- 复跑产生的 `iOS/.build/**` 缓存（gitignored）有更新；另清理了路径测试误建的 `iOS/iOS/.build/module-cache` 临时目录。

## Appendix A · 复现命令（可直接复制）

```bash
cd <workspace>

# 1) provider 校验（33 cards, status=experimental）
python3 iOS/ai/skill-provider/validate_provider.py

# 2) 用仓库 schema-lite 校验真实卡（会报 33 个 ADDITIONAL_PROPERTY: iosLabel）
node -e '
const fs=require("fs"),path=require("path");
const {validateDocument}=require("./wisdomdesign/tools/ai-skill/lib/schema-lite.js");
const s=JSON.parse(fs.readFileSync("wisdomdesign/ai/skill/provider/api-card.schema.json","utf8"));
const d="iOS/ai/skill-provider/api-cards";
const idx=JSON.parse(fs.readFileSync(path.join(d,"index.json"),"utf8"));
for(const f of idx.cards){const e=validateDocument(JSON.parse(fs.readFileSync(path.join(d,f),"utf8")),s);if(e.length)console.log(f,JSON.stringify(e));}
'

# 3) Release 构建（verification.json #1）
CFFIXED_USER_HOME=$PWD/iOS/.build/home \
xcodebuild build -project iOS/AIStarter/AIStarter.xcodeproj -scheme AIStarter \
  -configuration Release -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath iOS/.build/dd-ai-starter-rel CODE_SIGNING_ALLOWED=NO

# 4) typecheck（修正路径后的实际可运行形态；原文命令 rc=1）
cd iOS
xcrun swiftc -typecheck -swift-version 6 -target arm64-apple-ios17.0-simulator \
  -sdk "$(xcrun --sdk iphonesimulator --show-sdk-path)" \
  -module-cache-path .build/module-cache \
  -I .build/dd-ai-starter-rel/Build/Products/Release-iphonesimulator \
  AIStarter/AIStarter/AIStarterApp.swift AIStarter/AIStarter/ContentView.swift \
  AIStarter/AIStarter/APIMinimalExample.swift AIStarter/AIStarter/TaskListView.swift
cd ..

# 5) UI matrix（blocked：exit 65，Pseudo Terminal Setup Error）
CFFIXED_USER_HOME=$PWD/iOS/.build/home \
xcodebuild test -project iOS/AIStarter/AIStarter.xcodeproj -scheme AIStarter \
  -configuration Release -destination 'platform=iOS Simulator,id=CE28D919-7BEB-46B2-86A7-1D063E54303F' \
  -derivedDataPath iOS/.build/dd-ai-starter-test \
  -only-testing:GoldenPageMatrixTests CODE_SIGNING_ALLOWED=NO
```

## Appendix B · 关键证据文件

- Provider 入口：[provider.json](iOS/ai/skill-provider/provider.json)、[capabilities.json](iOS/ai/skill-provider/capabilities.json)、[verification.json](iOS/ai/skill-provider/verification.json)
- 卡片与生成器：[index.json](iOS/ai/skill-provider/api-cards/index.json)、[generate_api_cards.py](iOS/ai/skill-provider/api-cards/generate_api_cards.py)、[SOURCES.json](iOS/ai/skill-provider/api-cards/SOURCES.json)
- 校验器：[validate_provider.py](iOS/ai/skill-provider/validate_provider.py)
- 消费方：[AIStarterApp.swift](iOS/AIStarter/AIStarter/AIStarterApp.swift)、[TaskListView.swift](iOS/AIStarter/AIStarter/TaskListView.swift)、[APIMinimalExample.swift](iOS/AIStarter/AIStarter/APIMinimalExample.swift)
- 脚手架与测试：[copy_template.py](iOS/AIStarter/AIStarter/copy_template.py)、[GoldenPageMatrixTests.swift](iOS/AIStarter/GoldenPageMatrixTests/GoldenPageMatrixTests.swift)、[GoldenPageMatrixReport.json](iOS/AIStarter/GoldenPageMatrixReport.json)
- 契约：[api-card.schema.json](wisdomdesign/ai/skill/provider/api-card.schema.json)、[status-policy.md](wisdomdesign/ai/skill/provider/status-policy.md)、[baseline.json](wisdomdesign/ai/skill/m0/baseline.json)、[golden-matrix.json](wisdomdesign/ai/skill/evaluation/golden-matrix.json)
- 旧 UI 结果：`iOS/.build/ai-starter-t6.xcresult`（PTY 错误可复现）；本轮：`iOS/.build/dd-ai-starter-test/Logs/Test/Test-AIStarter-2026.11.22_10-15-50-+0800.xcresult`
