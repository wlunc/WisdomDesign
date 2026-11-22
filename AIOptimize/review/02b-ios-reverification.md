# R7 独立复验报告：iOS Provider / AIStarter 修复（F1–F8）

> 复核人：contract-reviewer（独立复验；非 R6 实现者）
> 复核时间：2026-11-22 10:35–10:47（Asia/Shanghai）
> 复核对象：iOS/ai/skill-provider/**（provider.json、capabilities.json、verification.json、api-cards/**、validate_provider.js、generate_api_cards.js、SOURCES.json、SNAPSHOT.md、CI-INTEGRATION.md、FIXES-t6.md）与 iOS/AIStarter/**；只读对照 wisdomdesign 的 M0 schema-lite、catalog 与 dist。
> 只读边界：未修改任何实现、契约、平台源、generated 或 API 基线；只新增本报告。复跑 xcodebuild/typecheck 产生 iOS/.build 缓存（gitignored）和新 xcresult；未改 tracked 文件。
> 环境：Xcode 26.6 (17F113)，iphonesimulator 26.5 SDK，Swift 6.3.3；Python 3.10；Node v24.21.0；iOS HEAD 64539fe78d9a036a6e34cbfa01c72e4430c0e2b0；wisdomdesign HEAD b2c05d9。

## 0. 结论

**R7 verdict：pass（附 7 项非阻断剩余项，见 §5）。**

- R2 的 F1–F8 修复项均已独立复验成立：33/33 卡 schema-lite 0 违规；status 由 validate_provider.js 重算并可用负例证明会拒绝 verified 注入；typecheck 记录命令可从 cwd=. 原样运行 rc=0；所有卡片/证据引用可解析；快照 stale 与 dist 审计说明准确；UI 测试 target 配置与 Runner 构建成立；覆盖 10/37 已显式声明并与 catalog 交叉校验；iOS 源码/generated/API 无 tracked 改动。
- UI matrix 仍被沙箱 PTY 阻塞（exit 65，0 断言），library gate 仍 not-run；因此本报告不把任何 UI/原生/宿主项写成通过。
- 剩余问题主要是证据卫生与流水线待办：scaffold 命令含参数占位符、validator 未真实接入 CI（已登记豁免）、dist 仍为旧的 provider 快照等待 t8 重打包、少量文档时间/基线表述需收敛。它们不推翻 F1–F8 的修复结论。

## 1. 环境与工作区状态

- iOS：HEAD 64539fe；git status --porcelain -uall 仅 1 个 tracked 修改 .gitignore（mtime 2026-11-22 10:00:56，早于 R6，内容为删除 /AIStarter/、/ai/ 两行忽略项），57 个 untracked 文件全部位于 AIStarter/** 与 ai/skill-provider/**（R6 允许写入范围）。
- Sources/**、Tests/**、api/WisdomUI.api.json：git diff --stat 为空；api 文件 SHA-256 = 1d3be9d703f9ea54710905a6d90db2e9ef7c05b55ab8d8f529c9b2843b725348，与 HEAD blob 一致。
- 5 个基线 dirty 文件当前工作区内容与 HEAD blob 一致（逐文件 SHA-256 相同），未见 R6 或本次复验写入。
- 生成物 Sources/WisdomUI/Foundation/generated/WDIconName.swift 无 diff，SHA-256 = 0b2761c4d73ba7e3f5086e7e948e8944c23b9888cc44b97369052f182a6ff761，与 generator pin/SOURCES.json 一致。
- R6 的 .build 复跑缓存和本次新增的 xcresult 均属 gitignored 构建产物，不是实现改动。

## 2. 实际重跑命令与结果

### 2.1 Provider / 卡片 / 引用

| # | 命令 | 退出码 | 结果 |
| --- | --- | --- | --- |
| 1 | python3 iOS/ai/skill-provider/validate_provider.js | **0** | M2 iOS provider validation passed: 33 cards, recomputed status=experimental, snapshot=stale, coverage=10/37 |
| 2 | 用仓库 wisdomdesign/tools/ai-skill/lib/schema-lite.js + api-card.schema.json 校验 33 张真实卡 | **0** | cards=33，invalid=0；index==磁盘 33；iosLabel 出现 0 次；33/33 在 allowed limitations 中有 iOS label mapping |
| 3 | 同 schema-lite 校验 provider.json / capabilities.json | **0** | 两个对象均 0 错误 |
| 4 | 沙箱负例：给 WDButton.main 注入 iosLabel，跑 validate_provider | **1** | FAIL: WDButton.main.json schema: $: unknown property 'iosLabel' |
| 5 | 沙箱负例：provider.status.effective/declared 改成 verified | **1** | FAIL: provider.status.effective (verified) != recomputed (experimental) |
| 6 | 沙箱负例：卡片 sourceRef 改成 SOURCES.json#/baseline/doesNotExist | **1** | FAIL: JSON pointer does not resolve |
| 7 | 沙箱负例：evidenceRef 改成 verification.json#ios-minimal-compile | **1** | FAIL: verification ref is not a command id: ios-minimal-compile |
| 8 | 沙箱恢复原文件后重跑 validate_provider | **0** | 与 #1 相同；证明负例是规则命中而非脚本崩溃 |

引用审计脚本结果：33 张卡的 sourceRefs、provider.status.evidenceRefs、capabilities 全部 sourceRefs 共 0 个悬空；SOURCES.json 的 sourceRefs 键对应文件全部存在；活动 JSON 中没有 ios-minimal-compile（只有 FIXES-t6.md 的修复说明文本提到该历史 id）。

### 2.2 卡片可复现性

~~~bash
git -C iOS show c3c32f3:api/WisdomUI.api.json > /tmp/r7-api-baseline.json
python3 iOS/ai/skill-provider/api-cards/generate_api_cards.js --api /tmp/r7-api-baseline.json --out /tmp/r7-cards-baseline
# exit 0；api sha256=123136bdf1f5299d740e1e220c7973eb82914c5df53eb093053ac51469158c34
# 与仓库 33 张卡 + index.json 逐文件 SHA-256 相同（0 diff）

python3 iOS/ai/skill-provider/api-cards/generate_api_cards.js --api iOS/api/WisdomUI.api.json --out /tmp/r7-cards-head
# exit 1；public snapshot drift: api=1d3be9d7... icon=0b2761c4...
~~~

- baseline API 快照 SHA-256：123136bdf1f5299d740e1e220c7973eb82914c5df53eb093053ac51469158c34（c3c32f3）。
- 当前 API 快照 SHA-256：1d3be9d703f9ea54710905a6d90db2e9ef7c05b55ab8d8f529c9b2843b725348（HEAD 64539fe）。
- 重放产生的 33 张卡与 index.json 与仓库文件逐字节一致；SOURCES.json 不是生成器输出，未参与 diff（与 R6 的排除生成器脚本与 SOURCES.json 一致）。

### 2.3 消费方构建、typecheck、脚手架、UI 测试

| # | 命令 / 场景 | 退出码 | 结果 |
| --- | --- | --- | --- |
| 1 | verification.json #1 原文（cwd=.，Release generic simulator） | **0** | ** BUILD SUCCEEDED **；AIStarter.app 产出 |
| 2 | verification.json #2 原文（cwd=.，4 个源文件 swiftc typecheck） | **0** | 0 输出错误；4 个源文件通过 |
| 3 | 脚手架合法复制（隔离镜像：copy_template.js task-list Out/Copied.swift，父目录存在） | **0** | 复制成功；cmp 与模板逐字节相同（0） |
| 4 | 脚手架覆盖已存在目标 | **1** | refusing to overwrite existing file |
| 5 | 脚手架 ../Evil.swift | **1** | destination escapes workspace |
| 6 | 脚手架经 symlink 指向仓外 | **1** | destination escapes workspace，仓外无文件 |
| 7 | 非法 page id / 目标目录不存在 / 非法文件名 / 无参数 | **1 / 1 / 1 / 1** | 各自拒绝 |
| 8 | verification.json #3 字面命令（含 <workspace-relative-destination>） | **2** | bash 语法错误：syntax error near unexpected token newline（占位符不是可执行路径；见 §5 R7-R1） |
| 9 | verification.json #5 原文（cwd=.，CE28D919，UI-testing target） | **65** | 构建成功并产出 GoldenPageMatrixTests-Runner.app；运行期 Pseudo Terminal Setup Error / Operation not permitted；日志无 Test Case 行，0 UI 断言执行；新 xcresult：iOS/.build/dd-ai-starter-test/Logs/Test/Test-AIStarter-2026.11.22_10-38-31-+0800.xcresult |
| 10 | verification.json #4 Scripts/ci.sh pr（cwd=iOS） | 未运行 | status=not-run，exitCode=null；脚本存在且可执行（-rwxr-xr-x），未冒充通过 |

补充：UI 测试 Runner 产物 iOS/.build/dd-ai-starter-test/Build/Products/Release-iphonesimulator/GoldenPageMatrixTests-Runner.app 存在；新 xcresult 与 GoldenPageMatrixReport 记录的 10:31 尝试同类错误。

### 2.4 快照、dist、覆盖

- HEAD 64539fe / API 1d3be9d7；baseline c3c32f3 / API 123136bd；verification.snapshot 与 SOURCES.baseline 的值与实测一致。
- 当前 dist 的 wisdom-page-ios/manifest.json（mtime 2026-11-22 10:13:26）：
  - sources.ios.commit=64539fe，dirty=true；
  - 内嵌 platforms/ios/provider.json SHA-256=9f26ee666c6325aef30476a30257918e866d7eda1c3b19b0df9734a09453ce50，而当前源 provider.json=9ac92d77d5b1da3e62cbc3cfa09ef269752d12c6580f592f6c8afd2307a4333a（不同）；
  - coverage.ios.apiCardFiles=35，实际卡片 33（35 个 JSON 含 index.json/SOURCES.json）；
  - coverage.ios.status.evidenceRefs 仍含旧的 verification.json#ios-minimal-compile（dist 未重建的直接证据）。
- 覆盖：33 卡涉及 15 个 API 类型，其中 10 个是 catalog 组件（WDBanner、WDButton、WDEmptyState、WDFAB、WDFormRow、WDListRow、WDListSection、WDPullRefresh、WDSkeleton、WDTextField），5 个 Foundation 入口；剩余 27 个 catalog 组件无卡；verification.apiCardCoverage 与 capabilities.componentCoverage 均与脚本交叉结果一致。

## 3. F1–F8 逐项复验

| R2 finding | R6 修复声称 | 独立证据 | 结论 |
| --- | --- | --- | --- |
| F1 high：33/33 卡含 iosLabel，违反 additionalProperties=false | 移除 iosLabel，迁入 limitations；生成器不再输出；validator 做 schema 校验 | schema-lite 33/33 0 违规；iosLabel 0 次；负例注入 exit 1；生成器无 iosLabel 字面输出 | **PASS** |
| F2 medium：status 未由代码重算，computedAtBuild 无支撑；validator 未接 CI | derive_effective_status 重算并断言；CI 登记 exempt-registered | validate_provider exit 0 输出 recomputed experimental；负例 verified exit 1；statusComputation.derivedEffective 一致；CI-INTEGRATION.md + verification.ciIntegration；未实际接入 CI（豁免） | **PASS（附豁免说明）** |
| F3 medium：typecheck 路径根混用，按原文 rc=1 | 改 cwd=. 的根相对命令，实测 rc=0；统一 4 文件 | 原文命令 exit 0；README/verification 均为 4 文件 | **PASS** |
| F4 medium：33 卡 SOURCES.json#symbol 悬空；3 处 ios-minimal-compile 不存在 | 次引用改 SOURCES.json#/baseline/apiSnapshotSha256；3 处改 ios-minimal-typecheck；validator 加引用检查 | 33/33 sourceRefs 可解析；3 处 typecheck 引用存在；负例悬空 pointer/command 均 exit 1；活动 JSON 无 ios-minimal-compile | **PASS** |
| F5 low：GoldenPageMatrixReport/README 只记旧失败 | 补最终 CE28D919 PTY attempt（exit 65, 0 断言） | 报告 attempts[2] 含 CE28D919/exit 65/PTY/0 assertions/xcresult；README 同步；本次复跑也 exit 65 | **PASS** |
| F6 low：快照/HEAD 与 dist 元数据不同步 | 显式标 stale（c3c32f3/123136bd→64539fe/1d3be9d7）；重放基线；dist 只读审计 | 实测 HEAD/API/baseline 哈希一致；重放 diff 0；distAudit 各数与当前 dist 一致；dist 未重写 | **PASS（dist 仍旧，见 R7-R4）** |
| F7 low：GoldenPageMatrixTests 是 unit-test，无 TEST_TARGET_NAME/依赖 | 改 bundle.ui-testing + TEST_TARGET_NAME + app 依赖 | pbxproj 138 行 productType=ui-testing；336/359 行 TEST_TARGET_NAME=AIStarter；PBXTargetDependency 存在；Runner.app 产出；UI 仍 PTY blocked | **PASS** |
| F8 low：未声明卡覆盖 10/37 | verification.apiCardCoverage + capabilities.componentCoverage + validator 交叉校验 | 10/37、27 without、5 Foundation 均显式；validator 断言通过 | **PASS** |

## 4. t7 七项检查逐项

| # | 检查项 | 结论 | 说明 |
| --- | --- | --- | --- |
| 1 | 33 卡 schema-lite 0 违规 | **PASS** | cards=33 invalid=0；provider/capabilities 也 0 |
| 2 | status 由可执行代码重算（或 computedAtBuild=false），validator 接入 CI | **PASS（豁免）** | validator 可执行且负例证明重算；CI 未实际接线，按 t6 允许的明确登记豁免处理，见 CI-INTEGRATION.md / verification.ciIntegration |
| 3 | verification.json 每条命令按 cwd 可运行并给出真实退出码 | **PASS（附证据卫生项）** | #1/#2/#5 原文复跑真实 0/0/65；#4 如实 not-run；#3 是带 <workspace-relative-destination> 参数的模板，字面 exit 2，替代场景 6 类已逐项复验（见 R7-R1） |
| 4 | SOURCES.json 与 verification 引用无悬空 | **PASS** | 卡片/provider/capabilities 引用 0 悬空；SOURCES sourceRefs 文件均存在；无活动 ios-minimal-compile |
| 5 | 快照/HEAD 元数据与 dist manifest 一致性说明 | **PASS** | c3c32f3/123136bd→64539fe/1d3be9d7 实测一致；dist 旧 provider 审计值准确；dist 未重建是显式待办（R7-R4） |
| 6 | 卡片覆盖 10/37 已显式声明 | **PASS** | verification.apiCardCoverage、capabilities.componentCoverage、validator 三方一致 |
| 7 | iOS 源码/generated/API 基线零改动 | **PASS** | 仅 .gitignore 预存修改 + 允许的 untracked AIStarter/ai；Sources/Tests/api/generated 零 diff；5 个基线文件与 HEAD 一致 |

## 5. 仍存在项（非阻断）

### R7-R1（low）ios-scaffold-safety 的命令字段是参数模板，不能按字面直接运行

- 证据：verification.json#3 的 command 含 <workspace-relative-destination>；从 cwd=. 字面执行 exit 2（bash 语法错误）。其 status=passed/exitCode=0 只对应合法复制场景；覆盖/逃逸/非法输入等 5 类退出码只写在 evidence 文本里。
- 影响：读者无法从 verification.json 一条命令完整复现 6 类结果；与 t7 检查项 3 的可直接运行有差距。R6 只需记录具体示范命令（如 ... task-list Out/Copied.swift）或增加 scenario 结构；不改变 F1–F8 结论。
- 建议：把 command 改为可直接运行的一行，并在 evidence 中列 5 个负例的独立命令/退出码。

### R7-R2（low）validator 未真正接入 CI，computedAtBuild 仍由人工运行保证

- 证据：iOS/.github/workflows/ci.yml 与 wisdomdesign/.github/workflows/ai-skill-ci.yml 均无 validate_provider 调用；本次全仓 grep 0 命中。verification.ciIntegration=exempt-registered，CI-INTEGRATION.md 说明跨仓限制。package.js 仍直接读取 provider.json 的 status（当前 package.js 130 行附近），不调用 validator；因此打包器本身不强制重算。
- 影响：这一项按 t6 明确允许的登记豁免处理，可接受；但 computedAtBuild:true 在无人工运行 validator 的打包路径上仍不是自动保证。建议 t8/流水线负责人在重打包前运行 validator，或未来在跨仓 checkout 可用时接 CI。
- 判定：不影响 pass；属于流程残余风险。

### R7-R3（info）UI matrix 与 library gate 仍未验证

- UI：本次原文复跑 exit 65，Pseudo Terminal Setup Error，0 断言；Runner 可构建但无法启动。
- library gate：Scripts/ci.sh pr 仍为 not-run（脚本可执行，但未在本轮运行）。
- 影响：没有 UI/原生/真机/宿主通过结论；报告与 manifest 均未把它们写成 pass，属于如实声明。

### R7-R4（info，流水线待办）dist 仍内嵌旧 provider，等待重打包

- 当前 dist mtime 10:13:26；内嵌 provider hash 9f26ee66… vs 源 9ac92d77…；manifest sources.ios.commit=64539fe 与内嵌 c3c32f3 provider 不一致；apiCardFiles=35（实际 33）；dist 内仍含 #ios-minimal-compile。
- R6 的 verification.distAudit / SNAPSHOT 对此记录准确，且明确不重写 dist；修复动作属于 t8/流水线负责人在 re-baseline 后重打包，不是 R6 应在本轮完成的改动。
- 建议：t8 重打包后复跑本报告的 schema/引用/计数检查。

### R7-R5（low）两处表述需要收敛

- SNAPSHOT.md 第 49 行称 dist 是 09:57 打包时，但当前 dist manifest mtime 为 2026-11-22 10:13:26；时间口径需统一（不影响 commit/hash 值）。
- FIXES-t6.md 第 38 行称 5 个基线 dirty 文件哈希未变，但 baseline.json 没有逐文件 hash，无法证明与基线 dirty 内容逐字节相同；只能证明当前 worktree 与 HEAD 一致、R6 无越界写入（本报告 §1 已验证后者）。建议改为未被 R6 修改，当前与 HEAD 一致。

### R7-R6（low）validator 未断言实际 HEAD 与 distAudit

- validator 校验 snapshot.currentRepoHead 非空，但不与 git rev-parse HEAD 比对；也不校验 distAudit。当前值经人工核对正确（64539fe），建议补上实际 HEAD == currentRepoHead、dist 审计字段与实际 dist 一致的断言，减少未来漂移。

### R7-R7（low）statusComputation.computedAt 是静态记录

- validator 运行时只读，不刷新 computedAt；本次 10:35 复跑后文件仍是 10:34:00。它不是错误，但审计时不要把 computedAt 理解为本次验证时间；可增加 validator 运行时间戳写入报告机制。

## 6. 未验证项与限制

1. 未执行 Scripts/ci.sh pr 全量平台门禁；只确认脚本存在可执行、status 如实 not-run。
2. UI matrix 仍 blocked（exit 65）；未执行真机、宿主加载、独立设计评审、VoiceOver/对比度实测；本报告不据此判 UI/native 通过。
3. 未用第三方 JSON Schema 实现；卡片/provider/capabilities 用仓库 schema-lite + validator 子集双重校验（两者均通过）。
4. 未逐字节证明基线 dirty 5 文件内容；只证明当前工作区与 HEAD 一致且 R6 无越界写入；baseline 无逐文件 hash。
5. dist 会被 t8 并发重打包；本报告记录的是 2026-11-22 10:47 左右的 dist 状态（mtime 10:13:26）。若 t8 已重写 dist，需以新状态复跑 §2.4/§5 R7-R4。
6. 本次复跑更新了 iOS/.build 缓存和 xcresult（gitignored），未改 tracked 实现/API/generated。

## 7. 最终结论

- **F1–F8 修复：独立复验通过。** 未发现伪造的 schema 通过、status 自认证、typecheck 假成功、引用悬空、PTY 假 blocked 或覆盖虚报。
- **R7 verdict：pass。** 剩余项（R7-R1/R7-R2 为 low；R7-R3/R7-R4 为明确环境/流水线待办；R7-R5/R7-R6/R7-R7 为文档/审计卫生）不改变 F1–F8 结论，但应向最终报告原样披露，尤其不要把 UI matrix、library gate、宿主加载写成通过。
- 若 captain 把 verification.json 每条命令字面可执行和 validator 必须真实接入 CI 作为硬性 pass 条件，则 R7 应降级为 needs_revision，待修 R7-R1/R7-R2 后复验；本报告按 t6 已允许的 CI 豁免与场景化命令证据判 pass。

## 8. 审计索引

- 复跑日志：/tmp/r7-xcodebuild.log、/tmp/r7-typecheck.log、/tmp/r7-ui-matrix.log、/tmp/r7-neg*.out。
- 关键证据文件：iOS/ai/skill-provider/{provider.json, verification.json, capabilities.json, validate_provider.js, api-cards/index.json, api-cards/SOURCES.json, SNAPSHOT.md, CI-INTEGRATION.md, FIXES-t6.md}；iOS/AIStarter/{GoldenPageMatrixReport.json, README.md, AIStarter.xcodeproj/project.pbxproj}；wisdomdesign/ai/skill/provider/api-card.schema.json；wisdomdesign/tools/ai-skill/lib/schema-lite.js；wisdomdesign/dist/ai-skill/v1.0.0/wisdom-page-ios/manifest.json。
- 只读性：本报告是唯一写入；iOS tracked 变更仅预先存在的 .gitignore；Sources/Tests/api/generated 零 diff。
