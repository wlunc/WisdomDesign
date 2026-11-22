# M5 固定 AI 任务对照评测 —— 观察报告（t11）

> 由 qa-verifier 产出。时间：2026-11-21（Asia/Shanghai）。
> 依据：[M5 评测协议（冻结稿）](../ai/skill/evaluation/protocol.md)、[固定任务集](../ai/skill/evaluation/tasks.json)、[双端黄金矩阵](../ai/skill/evaluation/golden-matrix.json)、[开发计划 §8 M5](03-DEVELOPMENT-PLAN.md#8-m5真实-ai-对照评测与设计验收)。
> **状态：observation-only（观察报告）。本轮没有调用任何模型、没有生成页面、没有原生编译，也没有任何 Token / 成本 / 编译 / 设计评分数据。**

## 1. 结论先行

按 M0 冻结协议 §5「真实评测前所有结果字段必须为空或 `not-executed`」与本任务「样本不足只出观察值，不承诺固定节省比例」，本轮**不提供任何 A/B/C 优劣结论或节省百分比**。当前**不满足对照实验的有效性前提**（模型/宿主/工具未 pin、Skill 包未构建、双端原生验证命令未 pin），任何数字都会是伪造。产出物是一套**可运行的评测 harness + readiness gate + 证据模板**，一旦前置齐备即可按同协议执行真实三臂对照。

## 2. 冻结任务集与三臂（已就绪，未运行）

- 8 个固定任务 T01–T08：任务列表页、设置表单页、带空态/错误态详情页、同 Page Spec 双端、过期组件名/不存在 API、不支持平台/能力、已有页面局部修改、长文案/大字体/键盘边界。
- 三实验臂 A（现有资料）/ B（精简规则文档）/ C（生成 Skill）；共 **8×3=24 个 task×arm 单元**。
- 固定条件：temperature=0、topP=1、maxRepairRounds=2、生成超时 30min/任务、平台验证超时 45min/任务、失败重试 0、seed 可支持则固定否则 null；同模型/参数/需求/宿主/工程基线/验证命令/超时/重试上限。
- 无效运行条件（拒绝）：A/B/C 条件不一致、模型或参数中途变化、删除失败样本、以静态 lint 替代原生验证、样本不足却给普遍百分比结论。

## 3. readiness gate：5 个阻塞项（真实评测不得开始）

> 2026-11-21 更新：t9 完成后 `cli.js` 与 `dist/ai-skill/v1.0.0` 四类包已生成，原 `CLI_MISSING`/`PACKAGE_MISSING` 已消除；剩余 5 项如下。

| blocker | 说明 | 责任方 |
| --- | --- | --- |
| `UNPINNED_MODEL` | `tasks.json#parameters.model = pin-before-M5` | 评测负责人 + captain（需成本预算批准） |
| `UNPINNED_HOST` | `parameters.host = pin-before-M5`（D3 默认通用目录包，尚无宿主 adapter） | 评测负责人 |
| `UNPINNED_TOOLS` | `parameters.tools = pin-before-M5`（Skill 包 hash / CLI / 原生工具链版本未锁定） | core-dev + 平台负责人 |
| `NATIVE_CMD_UNPINNED_IOS` | golden-matrix 中 iOS snapshot/UI 命令 `requiresPinning=true` | ios-dev（t5/t6） |
| `NATIVE_CMD_UNPINNED_ANDROID` | Android screenshot 命令 `requiresPinning=true` | android-dev（t7/t8） |

> 每次真实评测开跑前必须重新执行 `node tools/ai-skill/eval/run.js --check-readiness`（exit 0 才通过）；模型/host/tools 三者任一变化使该轮对照无效。

## 4. 本轮可运行资产与真实执行证据

| 命令 | 退出码 | 结果 |
| --- | --- | --- |
| `node tools/ai-skill/eval/run.js --check-readiness` | 2 | ready=false，报告上述 5 个 blocker（exit 2 = 前置不满足，防伪造） |
| `node tools/ai-skill/eval/run.js --dry-run --run-id t11-post-t9` | 2 | 生成 24 个 `not-executed` 单元计划（`t11-post-t9.plan.json`，5 个 blocker），指标全 null |
| `node tools/ai-skill/eval/run.js --results <fake> ` | 2 | **拒绝**写入伪造结果（readiness 未通过） |
| `node tools/ai-skill/eval/run.js --report` | 0 | observation-report.json：status=observation-only，comparisons 全 null，claims=[] |
| `node tools/ai-skill/eval/run.selftest.js` | 0 | 16 项反伪造断言全部通过 |

机器证据：
- `tools/ai-skill/eval/results/observation-report.json`：status=`observation-only`，quality/repair/cost 全部 `{value:null,status:"not-executed"}`，`A_vs_B/B_vs_C/A_vs_C=null`，`claims=[]`。
- `tools/ai-skill/eval/results/t11-post-t9.plan.json`：24 单元全部 `not-executed`，failure 保留策略写入 policy，5 个 blocker（t9 后口径）。
  说明：同目录 `t11-observation.plan.json` 是 t9 打包**之前**（2026-11-21T10:29Z）的旧计划，含 7 个 blocker（含 CLI_MISSING/PACKAGE_MISSING）；本轮证据以 `t11-post-t9.plan.json` 为准，两者时序不可混用。
- `tools/ai-skill/eval/run-manifest.json`：`status=not-executed`，`reason=readiness-gate-blocked`，记录 tasks/golden-matrix 输入哈希与全部 blocker。
- `tools/ai-skill/eval/templates/design-review.md`：8 维度人工评审模板（评审人不得为实现者，当前全 not-executed）。
- `tools/ai-skill/eval/templates/failure-ledger.json`：`deleteFailures=false`，失败样本必留字段定义。

## 5. 反伪造设计（harness 如何保证不编造）

1. **readiness gate**：model/host/tools 含占位符（`pin-before-M5` 等）或 cli/包缺失或原生命令未 pin → `ready=false`。
2. **结果拒收**：`--results` 在 `ready=false` 时直接 exit 2，不写任何指标。
3. **单元全覆盖校验**：真实结果必须恰好覆盖 24 个 task:arm 单元，缺失或多余即 exit 3；不允许删除失败样本后重新提交。
4. **观察报告零声明**：指标 null、comparisons null、claims 空数组；selftest 逐项断言这些性质。
5. **证据责任人分层**：编译/快照/UI 由平台负责人提供、设计评分由非实现者独立完成、宿主加载由 QA 验证（见 golden-matrix#verificationResponsibilities）；harness 不代替任何一层。

## 6. 真实评测执行步骤（供后续就绪后一键启动）

1. 由 captain / 评测负责人把 `tasks.json#fixedConditions.parameters` 中 model/host/tools 改为实际 pin 值（记录 id、revision、hash、费用可得性）。
2. 确认 `cli.js` 与 `dist/ai-skill/v1.0.0` 四包由当前 HEAD 重建（R8 已重打包，`checksums.json` 记录包哈希），并把包 hash 写入 `parameters.tools`；ios-dev/android-dev pin 原生 snapshot/screenshot 命令。
3. `node tools/ai-skill/eval/run.js --check-readiness` → exit 0。
4. 为每个 task×arm 用真实 adapter 产出 24 单元测量（Token/缓存、工具调用、编译退出码与日志、快照/UI、最终 diff、设计评审、失败台账），汇总为 results.json。
5. `node tools/ai-skill/eval/run.js --results results.json --run-id <id>` 记录；`--report` 出对照报告；样本不足仍只写观察值。

## 7. 写入边界

本任务只新增 `tools/ai-skill/eval/**` 与本报告 `AIOptimize/05-M5-Evaluation-Report.md`。未修改 M0 冻结契约（tasks.json / protocol.md / golden-matrix.json 仅只读引用）、未改设计真源、未触碰平台仓或 iOS 既有 dirty 修改；未产生任何模型费用。
