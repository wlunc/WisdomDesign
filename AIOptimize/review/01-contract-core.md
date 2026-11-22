# R1 复核报告：M0 契约与 M1 Core

> 复核人：contract-reviewer（独立复核；非 M0/M1 实现者）
> 复核时间：2026-11-22 10:11–10:26（Asia/Shanghai）
> 复核对象：wisdomdesign/ai/skill 下的 page-spec、provider、manifest、decisions、truth-source-map.json、m0/baseline.json、core/catalog、core/dist、runtime、SKILL.md.template、governance；tools/ai-skill 下的 cli.js、lib、tests（contract-selftest、core-catalog、runtime、build、governance-selftest）；以及 dist/ai-skill 的打包态运行时（只作契约落地交叉检查，M4 细节归 R4）。
> 只读边界：本次复核未修改任何实现、契约、测试或平台仓文件；除本报告外未新增/修改仓库文件。
> 环境：macOS arm64；node v24.21.0；ruby 3.0.0p0；未安装 Python jsonschema 与 Node ajv（因此无法用第三方 JSON Schema 实现独立验证）。
> 三仓状态：wisdomdesign HEAD b2c05d9（与 m0/baseline.json 记录一致；ai/skill、tools/ai-skill、dist/ai-skill、.github 为未跟踪交付物）；iOS HEAD 64539fe（baseline 记录的 c3c32f3 是其祖先）；android HEAD 3656d6f（与 baseline 一致；仅 ai/ 未跟踪）。

## 0. 结论先行

**R1 结论：needs_revision（有条件的部分通过）。**

- **M0 契约**：文件齐全、19 项契约自检通过，Page Spec 正反例与语义规则可执行；但 M0-2 的“Provider 不能自填 verified 绕过证据”和 M0-4 的 manifest 冻结契约没有被实现/打包器真正消费，M0 出口不能按“评审通过”记录。
- **M1 Core**：源码目录下的提取、37 组件等集、语义卡、Page Spec 校验器、Core 查询运行时、可复现 build/check/test 全部实测通过（42 项测试通过，check 49 文件一致，两次构建逐字节一致）。但**打包态**的 Core/M4 包中 get-component.js 不可用（exit 2），另有 SKILL 死引用与 M1-1 范围缩水；若 M1 出口按“Core Skill 目录包可用”理解，则不能判 pass。
- **构建/结构通过不等于原生编译、快照/UI、宿主加载通过**：本报告没有执行 xcodebuild、Gradle、快照/UI、真机或宿主加载；平台包状态仍为 experimental，manifest 也标 platformApiLoaded=false。M5 的“无样本不承诺收益”未改变。

关键实测数字：

| 项目 | 结果 |
| --- | --- |
| node tools/ai-skill/tests/contract-selftest.js | exit 0，19 个 PASS |
| node tools/ai-skill/cli.js test | exit 0，42 个 PASS（contract 19 + catalog 7 + runtime 9 + build 7） |
| node tools/ai-skill/cli.js check | exit 0，49 files match reproducible rebuild |
| 两次独立 build + 与官方 dist 比较 | 逐文件 SHA-256 列表完全一致（diff 空） |
| 官方 dist 在测试/重建前后 | 逐文件 SHA-256 列表一致（e99ff5fe5ce1df69d7673054af87201b559fc530e109cffbf152dab3be223428） |
| 37 组件等集 | contracts/*.yaml = catalog = 37 张卡 = page-spec enum = extract = 37 |
| validate-spec 退出码 | 正例 0；反例 1；JSON/IO/用法 2 |
| get-component（源码布局） | 命中 0；未找到 3；路径逃逸/限值/用法 2 |
| get-component（打包布局） | **exit 2（默认路径 ENOENT；显式 --catalog 则 overlay path escapes）** |
| governance-selftest | exit 0，19 个 PASS（但见 F6：检查不到过期状态） |
| core build manifest 与 M4 四包 manifest 对冻结 manifest.schema | 15/26/24/24/25 个错误（见 F2） |

## 1. 复核方法与命令

本次复核遵循“声称 -> 找到实现 -> 实际重跑 -> 记录退出码 -> 判断不一致”的顺序。关键命令如下（均在 wisdomdesign/ 下执行）：

~~~bash
node tools/ai-skill/tests/contract-selftest.js          # exit 0
node tools/ai-skill/tests/core-catalog.test.js          # exit 0, 7/7
node tools/ai-skill/tests/runtime.test.js               # exit 0, 9/9
node tools/ai-skill/tests/build.test.js                 # exit 0, 7/7
node tools/ai-skill/cli.js test                         # exit 0, 42 PASS
node tools/ai-skill/cli.js check                        # exit 0, 49 files
node tools/ai-skill/tests/governance-selftest.js        # exit 0, 19 PASS
node tools/ai-skill/tests/m4-ci.test.js                 # exit 0, 39 PASS（相邻证据，非本轮主审）
ruby tools/contracts-check.rb                           # exit 0，37 组件
bash tools/token-build/selftest.sh                      # exit 0, PASS=26 FAIL=0
~~~

确定性/边界命令：

~~~bash
node tools/ai-skill/cli.js build --out /tmp/wd-build-a --allow-outside-root   # exit 0
node tools/ai-skill/cli.js build --out /tmp/wd-build-b --allow-outside-root   # exit 0
# 对两个输出树分别做 find . -type f | sort | xargs shasum -a 256，diff 为空
# 同一列表再与 ai/skill/core/dist/wisdom-page-core 比较，diff 为空
node tools/ai-skill/cli.js build --out /tmp/wd-escape                          # exit 1，拒绝
node tools/ai-skill/cli.js check --out ai/skill/core/dist/nonexistent          # exit 1，拒绝
node tools/ai-skill/cli.js                                                     # exit 2，usage
~~~

Page Spec / 查询器退出码矩阵（源码布局）：

~~~bash
node ai/skill/runtime/validate-spec.js --file ai/skill/page-spec/examples/task-list.valid.json --json   # 0
node ai/skill/runtime/validate-spec.js --file ai/skill/page-spec/examples/settings-form.valid.json      # 0
# 6 个 invalid-cases 逐条写临时文件后运行：全部 exit 1，且 code/jsonPath 与 expectedError 一致：
#   UNKNOWN_COMPONENT /regions/0/component
#   COLLECTION_MISSING_EMPTY /states
#   NO_PRIMARY_ACTION /page/primaryAction
#   UNKNOWN_FIELD /page/unexpected
#   PLATFORM_TYPE_LEAK /regions/0/component
#   INVALID_SCHEMA_VERSION /schemaVersion
printf '{not json' > /tmp/broken.json
node ai/skill/runtime/validate-spec.js --file /tmp/broken.json --json   # 2，readError=JSON parse failed
node ai/skill/runtime/validate-spec.js --file /tmp/does-not-exist.json # 2，ENOENT
node ai/skill/runtime/get-component.js --id WDButton --json            # 0，mode=exact found=true returned=1
node ai/skill/runtime/get-component.js --query 搜索 --limit 2 --json   # 0，totalCandidates=4 returned=2 truncated=true
node ai/skill/runtime/get-component.js --id WDFake --json              # 3，found=false，无伪造候选
node ai/skill/runtime/get-component.js --query button --limit 99       # 2，limit must be 1-20
node ai/skill/runtime/get-component.js --id WDButton --catalog contracts --json # 2，catalog path escapes
~~~

打包态运行时（关键）：

~~~bash
cd ai/skill/core/dist/wisdom-page-core
node runtime/validate-spec.js --file page-spec/examples/task-list.valid.json --json
# exit 0，valid=true（校验器在包内可用）

node runtime/get-component.js --id WDButton --json
# exit 2；get_component failed: ENOENT: no such file or directory,
# open '.../wisdom-page-core/core/catalog/manifest.json'

node runtime/get-component.js --id WDButton --catalog catalog --json
# exit 2；get_component failed: overlay path escapes Skill package

# M4 包同样：dist/ai-skill/v1.0.0/wisdom-page-core 的 runtime/get-component.js
# 与 Core 包该文件 SHA-256 完全相同（1bacce3b...），同样 exit 2。
~~~

只读性证明：官方 dist 在运行 cli.js test（内部会 build --out 官方 dist）前后，49 个文件的逐文件 SHA-256 列表哈希均为 e99ff5fe5ce1df69d7673054af87201b559fc530e109cffbf152dab3be223428；本次结束后再次核对仍为同一值。git status 未出现已跟踪文件改动（仍只有原有未跟踪交付目录）。因此本次重跑没有改变任何实现或生成物内容。

## 2. M0 逐项核对（声称 vs 证据）

图例：PASS=声称有实现且实测成立；PARTIAL=部分成立/约束未闭环；FAIL=实测不成立；NOT CHECKED=不在本轮授权范围。

### 2.1 M0-1 Page Spec v1（ai/skill/page-spec）

| 计划验收项 | 证据 | 结论 |
| --- | --- | --- |
| JSON Schema 可验证 | schema.json 可 JSON.parse；schema-lite 与正式校验器均可驱动；但环境无标准 JSON Schema 实现，未用第三方 validator 验证 meta-schema/完整关键字 | PARTIAL（工具已验证，标准验证未做） |
| 至少一个正例/完整状态页通过 | task-list.valid.json、settings-form.valid.json：正式校验器 exit 0，valid=true；gates.nativeCompile/snapshotUi/visualDesignReview/hostLoad 全为 not-evaluated | PASS |
| 未知组件/无主操作/多主操作/集合缺空态反例 | invalid-cases 6 条全部 exit 1 且 code/jsonPath 匹配；多主操作由 runtime.test 临时构例覆盖 | PASS |
| 不包含 Swift/Kotlin 类型 | schema 无平台类型；component 为 37 个 WD ID enum；platform-type-leak 反例得到 PLATFORM_TYPE_LEAK | PASS |
| 明确单平台任务可跳过 Page Spec | 只在 schema 的 platforms 描述里有一句话（“A single-platform task may omit Page Spec entirely”）；SKILL 路由与测试没有对应规则 | PARTIAL（仅文字说明，未机器化/未测试） |
| schema 版本与 Skill/Token/组件库版本分离 | schemaVersion const=1.0；未与 token/skill 版本耦合 | PASS |

额外实测：schema 的 37 个 component enum 与 contracts/*.yaml 完全一致；root 与各数据对象 additionalProperties=false（条件子 schema 除外）。

### 2.2 M0-2 Provider SPI v1（ai/skill/provider）

| 计划验收项 | 证据 | 结论 |
| --- | --- | --- |
| iOS/Android capability 字段可表达 | capabilities.schema.json 有 8 个必需 group、platform enum；provider.schema.json 覆盖 source/adapters/status/unsupportedBehavior | PASS（契约层；真实平台实例归 R2/R3） |
| API 证据只四级 | 三个 schema 与 status-policy.md 均为 contract-only/discovered/example-compiled/template-verified | PASS |
| Provider 无法自填 verified 绕过证据 | **不完全成立**：effective=verified 且 evidenceRefs 省略时 schema 返回 []；evidenceRefs=['no-such-report.json'] 也返回 []；computedAtBuild 可省略；只有 evidenceRefs=[] 才触发 MIN_ITEMS。contract-selftest 只测了空数组，未测省略 | PARTIAL/FAIL（schema 约束不闭环） |
| 不支持能力有明确返回结构 | status-policy.md 用文字固定 { code, capability, status, reason, suggestion }，但没有对应 schema/实例/测试 | PARTIAL（只有文字契约） |
| 路径与命令不隐式跨仓写入 | status-policy.md 有文字边界；provider.schema 的 writeBoundary 两个只读字段是可选而非必需；无测试强制 | PARTIAL（契约层文字，未机器化） |

可复现实测（schema-lite）：

~~~text
provider effective=verified, evidenceRefs OMITTED  -> []（通过，未被拒绝）
provider effective=verified, evidenceRefs=[]       -> MIN_ITEMS
provider effective=verified, evidenceRefs=[nonexistent] -> []（通过）
api-card template-verified, compilation OMITTED    -> []（通过）
api-card template-verified, compilation.executed=false -> CONST
~~~

另：api-card.schema.json 的根 $id 为 https://json-schema.org/draft/2020-12/schema#api-card，把元 schema URI 当作自身 $id，属于低风险契约卫生问题。

### 2.3 M0-3 真源映射与 37 组件（ai/skill/truth-source-map.json、core/catalog）

- **37 等集成立**：contracts/*.yaml 37 个；catalog manifest 37；catalog/components 37 张卡；page-spec enum 37；extract-design.rb 输出 37；specNumber 1–37 无重复。四者与 YAML 集合完全相等（脚本比对，无差集）。
- **R1–R5 按配方处理**：03-patterns.md 有 5 个 R 配方；extractor counts.formalRecipes=5；catalog.md 明确 “R1-R5 recipes are excluded”。
- **旧资料边界**：extract 的 policy.excluded 包含 design/gallery/** 与 docs/02-components.md；生成目录中没有 gallery 内容（manifest 仅作为 excluded 文本出现）。
- **来源可追溯**：catalog manifest 的 purposeSource 都是正确的 “### 1. 用途” 行；但每张卡里的逐条 bullet/note 行号系统性错误（见 F4）。
- **契约 hash**：37 个 contract 的 sha256 与 manifest 记录全部一致（脚本比对 0 不匹配）。
- **唯一真源/冲突裁决**：truth-source-map 文档齐备；但 M1 输出没有把“状态/内容/无障碍结论”真正提取出来（见 F5）。

### 2.4 M0-4 包 manifest（ai/skill/manifest/manifest.schema.json）

| 计划验收项 | 证据 | 结论 |
| --- | --- | --- |
| Core/iOS/Android/All 包边界 | schema package enum 四值；dist/ai-skill/v1.0.0 实际四包 | PASS（边界存在） |
| manifest 含来源 commit/dirty/hash/版本/状态/coverage | schema 定义了 version/contents/sources/versions/status/coverage/verification/reproducibility；但实际 cli 产出的 core manifest 和 package.js 的 M4 manifest 均不符合该 schema（15/26/24/24/25 个错误，缺 version/contents/sources.repositories/versions/status/verification/reproducibility 等）；package.js 自行定义另一套字段且没有任何 schema 校验 | **PARTIAL/FAIL（契约与实现脱节，见 F2）** |
| 不包含时间戳/绝对路径 | 实际 core/M4 manifest 与 build-info grep 未发现 2026-xx-xx 日期、/Users/、/var/folders；schema 通过 additionalProperties=false 限制未知顶层字段 | PASS（值层面仍靠 builder 自律） |
| 状态与证据关系有测试用例 | 当前 schema 对 wisdomdesign/ios/android dirty+release 均返回 CONST（我实测三种仓库都拒绝）；overall=verified 缺 4 类 verification 也拒绝；但 provider/api-card 证据洞未覆盖 | PARTIAL（manifest 覆盖较好；provider/API 卡见 F3） |
| 首版宿主加载格式已确认或明确通用包 | decisions D3 明确先通用目录包、hostLoad=false 直到干净环境验证；实际未执行宿主加载 | PASS（按“明确先做通用包”满足） |

另实测：该冻结 manifest schema 只被 contract-fixtures.test.js 与 m4-ci.test.js 用于“合成 fixture”，没有任何 builder 读取它；实际生成物从未被该 schema 校验（见 F2）。

### 2.5 M0-7 基线与变更边界

- m0/baseline.json 记录的 commit：wisdomdesign b2c05d9、android 3656d6f 与当前 HEAD 一致；iOS 记录 c3c32f3 是当前 HEAD 64539fe 的祖先，baseline 的 5 个 dirty 文件在 64539fe 中已被 iOS 所有者提交（不是 Skill 流水线写入）。作为 2026-11-21T18:13 的时间点快照，commit/dirty 元数据与历史一致。
- **内容哈希可复现性**：我发现 baseline 的 captureMethod 未写全公式，但反向推导并验证了方法：对每条 “相对路径 + NUL + 文件 SHA-256 十六进制” 行按路径排序、以 LF 连接，再对整体取 SHA-256。用该法：
  - android trackedContentHash = 1614a84b...（90 个 tracked 文件）**精确匹配**；
  - contractTreeHash = cb06e63f...（37 个 YAML）**精确匹配**；
  - specTreeHash = f13f74a3...（docs/specs 下 4 个 md，含 README）**精确匹配**；
  - iOS trackedContentHash 无法重建（baseline 的 dirty 内容没有在仓库中留档；最终提交内容与抓取时可能不同），只能验证 commit/dirty 元数据。**建议把 captureMethod 写清并给脚本**，否则审计者无法自证。
- 变更边界：extractor/generator/cli 代码只读设计真源与 overlay，写入仅限指定 out 或官方 dist；未发现写 iOS/android 的代码路径。平台仓实际是否被改动由 R2/R3 负责。
- 流程门禁：CONTRACT-STATUS.md 仍写 “待独立评审；未批准实施”“只有独立评审 verdict=pass 后才能标记 implementation-ready”；D1 也要求全量实施另行批准；而 M1–M4 产物与 M5 harness/观察报告已经生成（M5 真实评测未执行）。计划 §4 要求 “M0 出口通过” 才进入 M1。当前没有 M0 评审通过记录。属流程/证据门禁问题（F8），需要在最终完成报告中显式处理。

### 2.6 contract-selftest

- 运行 exit 0，19 个 PASS；覆盖 Page Spec 2 正例 + 6 反例、Provider 2、capabilities 2、api-card 2、manifest 5。
- 该自检用零依赖 schema-lite 子集，页面反例的正式校验器行为由 runtime.test 另测；两项结果一致。
- 局限（文档已披露，但仍是证据边界）：不是完整 JSON Schema 实现；provider/api-card 的“省略关键证据字段”路径没有被测到（F3）。

## 3. M1 逐项核对

### 3.1 M1-1 只读设计提取器

| 验收项 | 证据 | 结论 |
| --- | --- | --- |
| Ruby 标准库/Psych 读 YAML，不手写解析器 | extract-design.rb require yaml，使用 YAML.safe_load；无自写 YAML 解析 | PASS |
| 37 组件与 YAML 完全相等 | extract counts 37/37/37/5；与 contracts 集合脚本比对相等 | PASS |
| ID/用途/反例/状态/来源可追溯 | purpose summary/bullets/sourceRefs 生成；但 (a) 状态/内容/无障碍结论没有进入输出；(b) bullet/note 行号错误（F4/F5） | PARTIAL |
| 缺章节/重复 ID/未知引用失败 | core-catalog.test 7/7：duplicate/missing section/missing counterexample/unknown overlay/unknown combination 全按预期非零 | PASS |
| 不读取 HTML 画廊 | 只读 docs/specs、contracts、tokens、overlay；policy.excluded 有 gallery | PASS |
| 非法输入非零退出 | 上述反例均 exit != 0；extract 失败 stderr 有中文诊断 | PASS |

### 3.2 M1-2 组件目录与语义卡

- catalog.md 37 行短行全量扫描；37 张独立 components/WD*.md；每张卡都有 用途/来源追溯/契约摘要/overlay/平台说明 五段。
- 用途/反例来自 specs §1；契约只给 params 数、slots、enums，不给平台 API；overlay 仅 searchAliases/combinesWith/pageRegions（extractor 白名单限制）。
- 生成确定性：core-catalog.test 两次生成逐文件 SHA-256 相同，39 个文件（37 卡 + catalog.md + manifest.json）。
- 卡内无平台 API：grep @escaping/Binding</ViewBuilder/UIFont/Modifier./.swift/.kt 均为 0；测试也断言。
- **缺口**：来源追溯的逐条行号错误（F4）；M1-1 声称的状态/内容/无障碍结论未进入卡（F5）。

### 3.3 M1-3 Page Spec 校验器（runtime/validate-spec.js）

- 2 个正例 exit 0，gates.structure=passed，其余 gate=not-evaluated，notice 明确“不证明原生编译/快照/视觉/宿主”。
- 6 个反例逐条 exit 1，code/jsonPath/message/suggestion 齐全且与 expectedError 一致（见 §1）。
- malformed JSON / 文件不存在 / 无参数 / 未知参数均 exit 2；用法错误与校验失败分离。
- 集合缺空态：both schema contains 与 semantic 规则可触发 COLLECTION_MISSING_EMPTY。
- **低风险问题**：buildReport 的 structureValid 直接等于 overall valid（validate-spec.js:167），所以只有语义错误（如集合缺空态）时也报 structureValid=false；字段命名/语义容易让调用方误以为结构失败。见 F10。

### 3.4 M1-4 Core 查询运行时（runtime/get-component.js）

| 验收项 | 源码布局 | 打包布局（ai/skill/core/dist 与 dist/ai-skill/v1.0.0） |
| --- | --- | --- |
| canonical 精确查询 | PASS（WDButton -> 1 张摘要） | **FAIL（exit 2）** |
| 关键词查询有上限 | PASS（默认 8、硬上限 20；搜索 -> 4 候选/返回 2/truncated） | **FAIL（exit 2）** |
| 未找到不编造 | PASS（exit 3，suggestions + 真实 sampleIds） | **FAIL（exit 2）** |
| 默认不整份输出 | PASS（只返回摘要/候选） | FAIL |
| 输入路径不逃逸 Skill 包 | PASS（--catalog contracts -> exit 2） | 包内无有效默认路径，显式 --catalog catalog 又触发 overlay 逃逸判断 |
| 人/机可读 | PASS（--json 与人类摘要） | FAIL |

根因（代码级）：get-component.js:7 的 DEFAULT_CATALOG 固定为 SKILL_ROOT/core/catalog，这是源码仓布局（ai/skill/core/catalog），但生成包把 catalog 放在包根；get-component.js:44-50 的 overlay 解析又以 path.dirname(path.dirname(SKILL_ROOT)) 为基准，在包布局会解析到包外的 ai/skill/component-overlays 并报 “overlay path escapes Skill package”。测试只在源码布局运行（runtime.test.js:9 的 SKILL_ROOT），build.test.js 只检查包内容，不执行包内 runtime，所以未暴露。见 F1（高）。

### 3.5 M1-5 薄 Core Skill、预算与引用

- SKILL.md.template 有三模式路由（Design/Single Platform/Cross Platform），Core 不加载平台 API；禁读清单（gallery、02-components、历史叙事、平台内部符号）与来源优先级明确；停止条件 5 类；按需加载规则明确。
- 生成 SKILL.md 5106 bytes（实际 wc -c = 5106），manifest.build.residentBytes=5106，budget=6000；build 超预算会 exit 1（代码检查存在）；build.test 断言 residentBytes <= budget。
- **预算值依据不足**：6000 是 cli.js:15 的硬编码常量；仓库内没有“实测 + 宿主约束”的记录（README 只给了 2k–6k 的提案区间）；预算溢出路径没有测试。M1-5 要求“预算值由实测与宿主约束确定”，目前只有自动检查，没有依据证据（F9）。
- **死引用**：生成包 SKILL.md:29 写 “Full conflict resolution is in the source map.”，但核心包与 M4 包都没有 truth-source-map.json；runtime/README.md 是源码仓路径写法（ai/skill/runtime/...、tools/ai-skill/tests/...），在包内不可执行；SKILL.md 的来源优先级还引用了 contracts/、docs/、tokens/（包内未携带，若被当作按需引用即为死链）。M1-5 的“所有按需引用无死链”不能判 PASS（F7）。

### 3.6 M1-6 确定性构建与反漂移（cli.js build/check/test）

| 验收项 | 证据 | 结论 |
| --- | --- | --- |
| build/check/test 可执行 | 三条命令均 exit 0；test 汇总 “test OK: M0 contracts + M1 catalog + M1 runtime + M1 build” | PASS |
| check 在临时目录重建比较，不覆盖正式产物 | check OK: 49 files；官方 dist 前后逐文件 hash 列表不变 | PASS |
| 同输入连续两次构建一致 | 两个 /tmp 输出树逐文件 SHA-256 diff 为空；且与官方 dist 相同 | PASS |
| 生成文件带 banner 与来源 | 所有 .md 有 GENERATED banner；.js 有 use strict；JSON 有 generatedBy/banner；无未解析 {{TOKEN}} | PASS |
| 无绝对路径/机器信息/缓存/临时文件 | build.test 对 dist 全文件断言 + 我 grep 未发现 /Users/、/var/folders、CRLF、时间戳；check 未产生临时残留 | PASS |
| 非法输出路径被拒绝 | build --out /tmp/...（无 --allow-outside-root）exit 1；check 指向不存在包 exit 1；usage exit 2 | PASS |

## 4. 发现（findings）

### F1（high）打包态 Core/M4 的 get-component.js 完全不可用

- **现象**：在 ai/skill/core/dist/wisdom-page-core 和 dist/ai-skill/v1.0.0/wisdom-page-core 中运行 node runtime/get-component.js --id WDButton --json 均 exit 2：默认路径找 <包>/core/catalog/manifest.json（ENOENT）；显式 --catalog catalog 又因 WDSearchField overlay 解析到包外而报 “overlay path escapes Skill package”。
- **范围**：5 个包（core 生成包 + M4 的 core/ios/android/all）内该文件 SHA-256 完全相同（1bacce3b...），因此全部受影响；validate-spec 在包内正常（exit 0），只有查询器路径假设错误。
- **影响**：M1-4 “Core 查询运行时”和 M1-5 SKILL.md 的按需查询指令在交付包内不可执行；M4 宿主加载后的查询验收也会失败。现有测试只覆盖源码布局，未发现该问题。
- **建议修复**：让 runtime 同时适配两种布局（优先 <root>/catalog，回退 <root>/core/catalog）；overlay 查找以包内 catalog 为根或把 searchAliases 内联进 manifest；增加“从构建出的包内执行 runtime.test 关键用例”的测试，并在 M4 包上复跑。
- **影响判断**：这是本轮最实质的“声称可用但证据不支持”项。

### F2（high）M0-4 冻结的 manifest schema 未被实现消费，实际包 manifest 不符合冻结契约且计数/哈希自洽性有缺口

- **证据 1**：冻结 schema 只被 tests/contract-fixtures.test.js 与 tests/m4-ci.test.js 用于合成 fixture；没有任何 builder/package 代码读取它。
- **证据 2**：用该 schema 校验实际产物：ai/skill/core/dist/wisdom-page-core/manifest.json 15 个错误；dist/ai-skill/v1.0.0/{core,ios,andoid,all} 分别 26/24/24/25 个错误；缺 version/contents/sources.repositories/versions/status/verification/reproducibility 等顶层字段。
- **证据 3**：package.js:81-90 自行定义 platformScope/generatedBy/residentEntry/sources/coverage/files，且不读取/不校验 manifest.schema.json；M4 CI 契约 §6 要求的 dist-package 用例组尚未加入（m4-ci.test.js 39 项中没有 dist/package 项）。
- **证据 4（完整性）**：core 包 files.count=49 但实际 50 个文件，hashes 缺 LICENSE-NOTICE.txt 与 manifest.json；ios/android/all 包 hashes 缺 LICENSE-NOTICE.txt，且 files.sha256[manifest.json] 是写入新 manifest 之前的旧 hash（stale self-hash）。这些是 M4 打包细节，归 R4 深查，但已足以说明“manifest 字段/哈希完整”的声称不能直接成立。
- **建议修复**：明确唯一权威 manifest schema；要么让 package.js/cli 产出并按 schema 校验（含 dirty→workspace-snapshot、verified→四 flags、文件清单），要么正式废止/升级 M0 schema 并同步文档/测试；新增从 dist 包读取并校验 manifest 的测试。
- **影响**：M0-4 出口和 M4 包验收都不能按“manifest 契约已冻结并落地”记录。

### F3（medium）Provider / API 卡 schema 允许“省略证据字段”绕过 verified 约束

- **证据**：effective=verified + evidenceRefs 省略 -> schema-lite 返回 []；evidenceRefs=['no-such-report.json'] -> []；computedAtBuild 省略 -> []；api-card evidence=template-verified + compilation 省略 -> []；只有 evidenceRefs=[] 或 compilation.executed=false 才被拒。contract-selftest 和 m4-ci.test 只覆盖后两种形状。
- **影响**：M0-2 “Provider 无法靠自填 verified 绕过证据”只在“填了空数组/填了 false”时成立；省略即绕过。真实构建器是否另行强制不在本仓代码中（平台侧由 R2/R3 验证），但冻结契约本身未闭环。
- **建议修复**：用 if/then/required 条件：status.effective/declared=verified 时强制 evidenceRefs 非空且 computedAtBuild=true；evidence=template-verified/example-compiled 时强制 compilation 存在且 executed=true；为“省略字段”增加反例测试。

### F4（medium）语义卡“来源追溯”的 72/72 条反例行号与 1 条 note 行号系统性错误

- **证据**：我解析 extract 输出并逐条读取被引用行：全部 72 个 bullet sourceRef、1 个 note sourceRef 指向的行不含对应文本；其中 37 条指向空行。示例 WDButton：卡片来源写 docs/specs/01-basic.md:12 与 :14（空行），实际 “用” 在 17 行、“不要用” 在 18 行、note 在 19 行。根因：extract-design.rb 在计算 bullet/note 行号时用 heading_offset + body_offset，漏加 §1 在 section 内的起始偏移（首/末行用了 heading_offset + start/finish 是对的）。
- **影响**：M1-1 “用途、反例、状态和来源可追溯”在该粒度不成立；AI/人按行号回查会跳到错误位置。内容本身来自 specs，未发现语义错配。
- **建议修复**：bullet/note 使用绝对行号（body 元组的 absolute_index + 1，或 heading_offset + start + offset）；新增测试断言每条 sourceRef 指向的行包含 bullet 文本前缀；重建 37 张卡。

### F5（medium）M1-1 范围缩水：状态/内容/无障碍结论没有真正提取，只校验了章节存在

- **证据**：extract 输出每个组件只有 id/specNumber/specName/purpose/contract/overlay/sourceRefs；rules 只有 path/sha256/lineCount/requiredHeadings，没有布局/无障碍/内容“结论”；语义卡也没有 state/content/a11y 段落。M1-1 明文范围包含“布局 / 无障碍 / 内容结论”，验收包含“状态可追溯”。
- **影响**：Core Skill 能回答组件用途/反例，但无法从 Core 包直接获得状态、内容、无障碍结论；M1-1 的声称比实现宽。
- **建议修复**：要么扩展 extractor/catalog 提取这些结论并做来源锚点，要么在计划/验收中明确“M1 只提取 §1，其余规则仅做 hash/章节门禁”，并同步 CONTRACT-STATUS/README，避免“已提取”的歧义。

### F6（medium）治理/状态文档过期，且 governance-selftest 检查不到

- **证据**：
  - ai/skill/governance/final-acceptance.md:4 “当前仓库只有 M0 契约稿与自检工具，没有任何生成包…”，86-90 行仍写 M1 未实施、M4 未实施、M5 未开始；实际 M1 37 卡/M1 运行时/M4 四包/M5 harness 已存在。
  - ai/skill/governance/coverage-model.json:56-66 仍写 “M1 Core 尚未生成语义卡”“M4 包与 M5 评测尚未执行”，而 M1 卡已生成。
  - ai/README.md:3/16 仍写 “尚未实施/尚未创建 skill/Page Schema/运行时”。
  - AIOptimize/README.md:3-6/427 仍写“没有新增生成器/CI/Skill 包”。
  - governance-selftest.js exit 0（19 PASS），但只断言 layer 顺序、designSemantic=37、snapshotUi=0、token 存在等；不校验这些“当前状态”行是否与仓库事实一致。
- **影响**：如果最终报告直接引用这些治理文档，会把“未实施”当现状，或反之把自检 PASS 当治理状态有效。它们至少应标注“M0 时点快照”或更新。
- **建议修复**：更新/归档过期状态；governance-selftest 增加“状态声明与仓库事实一致”的断言（例如 M1 卡存在则不得写未实施）。

### F7（medium）打包产物存在可执行死引用，M1-5 “按需引用无死链”未完全满足

- **证据**：core/M4 包内 SKILL.md:29 指向 “source map”，但包内无 truth-source-map.json（find 无结果）；runtime/README.md:7-9/27/29 仍是源码仓命令（ai/skill/runtime/...、tools/ai-skill/tests/...），在包内路径不存在；SKILL.md 的来源优先级引用 contracts/、docs/、tokens/（包内未携带）。SKILL.md 自身的 Load on demand 四项（page-spec、catalog、runtime）在包内存在。
- **影响**：M1-5 声称“所有按需引用无死链”只能对 SKILL.md 的加载清单成立；包内文档与 source map 引用不成立，宿主按文档操作会失败。
- **建议修复**：将 truth-source-map 复制进包或删除该句；把 runtime/README 改成包相对路径；对包内所有 md 的相对引用做存在性测试（t10 的死链审计目前只覆盖 AIOptimize 与 ai/skill 源目录，不覆盖 dist 包）。

### F8（medium）流程门禁：M1–M4 实现与 M5 harness 先于 M0 独立评审/批准

- **证据**：CONTRACT-STATUS.md:30-32 明确 frozen-for-review、只有 independent verdict=pass 才能 implementation-ready；decisions D1 同义；计划 §4 M1 入口要求 M0 出口通过。实际 t2–t11 的实现/证据已生成，而 M0 评审在本次复核前没有通过记录；final-acceptance 自己也把“M0 契约独立评审”标为“未通过”。
- **影响**：这是流程证据链问题：即使代码可复核，M0 出口的“评审通过”状态未建立；最终报告需要明确“代码可复核”不等于“阶段门禁已通过”。
- **建议修复**：把本 R1 报告作为 M0 独立评审输入，由 captain 明确记录 verdict 与批准范围；更新 CONTRACT-STATUS/decisions 状态；最终报告保留“实现先于批准”的时序说明。

### F9（low）常驻预算 6000 bytes 缺少“实测 + 宿主约束”依据，溢出路径未测

- **证据**：cli.js:15 硬编码 6000；build 在 >budget 时 exit 1（cli.js:114）；SKILL.md 实际 5106；仓库无预算测量记录；README 只给 2k–6k 提案区间；build.test 只断言 <=，没有构造超预算模板的测试。
- **影响**：M1-5 的自动检查成立，但“预算值由实测与宿主约束确定”的证据不存在。
- **建议修复**：记录一次宿主/模型入口约束测量与取整理由；补一个超预算负例（用临时模板副本，不改正式模板）。

### F10（low）正式校验器仍是手写子集；无标准 JSON Schema 验证，structureValid 与语义错误混淆

- **证据**：validate-spec.js 实现 type/enum/const/required/additionalProperties/items/allOf/oneOf/if-then 等子集；未实现 not/patternProperties 等；环境没有 ajv/jsonschema，无法独立验证 schema 的 meta-schema 合法性；buildReport:167 的 structureValid = !readError && errors.length===0，导致只有语义错误（如 COLLECTION_MISSING_EMPTY）时 structureValid=false、gates.structure=failed。
- **影响**：契约自检和正式校验器都是自定义子集，存在关键字被忽略的长期风险；报告字段可能误导“结构失败”。
- **建议修复**：CI 增加标准 JSON Schema validator（或至少 schema meta-schema 校验）；增加独立 structureValid/semanticValid 字段；把已知限制写入验收边界。

### F11（low）M4 验证报告与测试注释有已被修复的过期断言；测试计数与实际不一致

- **证据**：AIOptimize/04-M4-CI-Verification.md:39-45 称 manifest schema 的 allOf 遗漏 wisdomdesign、不能稳定拒绝 dirty+release；当前 schema 已分三仓并在三仓 dirty+release 时均返回 CONST（我实测）。m4-ci.test.js:136 仍有 “M0 schema allOf[0] omits wisdomdesign” 的注释。该报告称 contract-selftest 17 项，实际 19 项。
- **影响**：报告与当前证据矛盾；如果在最终报告引用会传播过期结论。M4 细节归 R4，但建议同步修订或标注历史。
- **建议修复**：更新报告/注释；用测试实际输出生成计数；把“已由后续版本修复”写清。

## 5. 未验证项与限制

1. 未执行任何原生编译、快照/UI、真机、TalkBack/VoiceOver 或宿主加载；本报告不对这些作任何“通过”判断。平台 Provider 与原生证据归 R2/R3；M4 打包/ZIP/CI/M5 归 R4。
2. 未用第三方 JSON Schema validator；schema 的完整 draft 2020-12 合法性、以及自定义校验器与标准实现的一致性未验证（仅验证了冻结 schema 用到的关键字子集）。
3. iOS baseline 的 trackedContentHash 无法重建（dirty 内容未留档），只验证了 commit 与 dirty 文件元数据；android/contracts/specs 的 baseline hash 已用推导方法精确复现。
4. M0-5 黄金矩阵、M0-6 评测协议（evaluation/*）不在本任务列出的复核范围，未做逐条判断；M5 harness 由 R4 复核。
5. 未做跨操作系统/跨机器确定性；本次只在当前 macOS/node 24.21.0/ruby 3.0.0p0 上验证。
6. 运行 cli.js test 会按设计重建官方 dist；已验证内容不变（见 §1），但 mtime 会变化，这是测试副作用，不是实现改动。

## 6. 最终结论与建议

### 6.1 对 M0 的判定

- **契约文件/自检层面：通过**（Page Spec 正反例、37 等集、provider/manifest schema 的 JSON 合法性与主要正反例均成立）。
- **契约闭环层面：不通过**：M0-2 的 verified 证据约束可被“省略字段”绕过；M0-4 的 manifest schema 与实际 cli/M4 manifest 完全脱节；M0 出口没有独立评审记录（F2/F3/F8）。
- 建议 M0 在最终报告中的状态写为 **“契约稿存在且大部分自检通过；M0 出口未闭合（needs_revision）”**，不要写“M0 评审通过”。

### 6.2 对 M1 的判定

- **源码工具链层面：通过**：提取、37 等集、目录/语义卡、Page Spec 校验器、查询器（源码布局）、build/check/test 确定性全部实测成立；42 项测试、0 失败；check 49 文件一致；两次构建逐字节一致。
- **交付包可用层面：不通过**：打包态 get-component 不可用（F1）；SKILL 有死引用（F7）；M1-1 状态/内容/无障碍结论未落盘（F5）。
- 建议 M1 在最终报告中的状态写为 **“源码级通过、交付包级 needs_revision（安装/宿主查询前必须修复 F1/F7）”**；不要以“测试全过”推导“M1 完成”。

### 6.3 建议的修复优先级

| 优先级 | 动作 | 负责建议 |
| --- | --- | --- |
| P0 | 修复 get-component 布局适配（默认 catalog + overlay 解析），增加包内 runtime 测试，重建 core 与 M4 四包 | core/M4 实现者 + R4 复测 |
| P0 | 明确 manifest 权威 schema 并让 builder 校验；修复 M4 manifest 文件计数/hash 覆盖；补 dist-package 测试 | 架构/打包 + R4 |
| P1 | provider/api-card 条件约束 + 省略字段反例 | 契约所有者 + R2/R3 |
| P1 | 修复语义卡 bullet/note 行号并重建 37 卡 | M1 实现者 + R1 复测 |
| P1 | 修复/标注过期治理与文档状态，governance-selftest 增加状态一致性断言 | M6/治理 + R4 |
| P1 | 处理 M0 流程门禁记录（独立评审 verdict、CONTRACT-STATUS 更新） | captain |
| P2 | 补预算依据/超预算测试、标准 JSON Schema 校验、死链审计覆盖 dist、清理死代码 | 各 owner |

### 6.4 边界声明

本报告只证明“我实际运行并记录的命令”对应的范围；不把 cli.js test 的通过等同于原生编译/UI 矩阵/宿主加载通过。M5 的“无样本不承诺节省比例”仍成立；M4 的“干净环境加载”没有执行。另：本轮复核没有修改实现；官方 dist 内容在重建前后一致；唯一新增文件是本报告。

## 7. 附录：审计索引

- 复核用的命令输出与临时文件位于 /tmp（wd-build-a/b、final-*.out、extract.json 等），不进入仓库。
- 关键源码位置：
  - cli.js:15（budget 6000）、cli.js:114（预算检查）、cli.js:143（未使用 catalogManifest）、cli.js:157-176（check 逻辑）
  - runtime/get-component.js:7（默认 catalog）、:44-50（overlay 路径）、:145-156（退出码）
  - runtime/validate-spec.js:149-170（validate/buildReport）、:167（structureValid）
  - lib/extract-design.rb:102-170（用途/行号）、:129-140（重复 when 死代码）、:188-203（章节检查）
  - lib/generate-core-catalog.js:56（硬编码 37）、:82-117（卡渲染）
  - manifest/manifest.schema.json:510-611（allOf dirty/verified 约束）
  - provider/provider.schema.json:120-169（status/evidenceRefs 可选）
  - provider/api-card.schema.json:3（错误 $id）、:70-106（compilation 条件不完整）
  - tools/ai-skill/package.js:81-90（自定义 manifest）、:171-181（manifest 覆盖顺序）、:189-195（checksums）
  - tools/ai-skill/tests/runtime.test.js:9（只测源码 SKILL_ROOT）、build.test.js:12/33（只 build 不执行包内 runtime）
- 关键证据文件：
  - ai/skill/CONTRACT-STATUS.md（frozen-for-review）
  - ai/skill/m0/baseline.json（commit/dirty/hash）
  - ai/skill/governance/final-acceptance.md、coverage-model.json（过期状态）
  - ai/skill/core/catalog/manifest.json（37 组件与 source hash）
  - ai/skill/core/dist/wisdom-page-core/manifest.json（49 files、5106/6000）
  - dist/ai-skill/v1.0.0/*/manifest.json 与 SKILL.md
- 被审实现未改动；dist 前后摘要：e99ff5fe5ce1df69d7673054af87201b559fc530e109cffbf152dab3be223428。
