# 最终验收清单与未验证项清单

> 状态：M6 治理建议稿（判定口径），2026-11-22 按 R8 修复后的仓库事实刷新“当前状态”列。
> 本清单是“最终可发布”的判定口径，不是当前已通过的声明。当前仓库已有：M0 契约（`frozen-for-review`，独立复核 verdict=needs_revision，修复已提交复评）、M1 37 张语义卡 + 校验器 + 查询运行时、M2/M3 Provider 与 API 卡（原生编译/UI 矩阵仍 blocked / not-run）、M4 四包与 ZIP/checksums（可自动校验，宿主加载未执行）、M5 harness 与 observation-only 报告（真实评测未执行）。没有原生编译/UI 通过结论、没有宿主加载报告、没有 M5 真实评测数据。

## 1. 阶段评审必须回答（12 问）

每次阶段评审逐条记录答案与证据链接；无证据按“未验证/未执行”填写，不得留空或推测：

1. 本阶段输入真源和版本是什么？
2. 是否有 dirty 工作区，产物如何标识？
3. 哪些任务真实执行，退出码和证据在哪里？
4. 哪些只是静态检查？
5. 哪些原生编译、快照、UI、真机测试未执行？
6. 新增了多少 design / discovered / compiled / verified 覆盖？
7. 是否存在假组件、假 API、假平台支持？
8. 是否可复现构建，产物 hash 是否一致？
9. 生成包是否在实际宿主加载，而不只是目录存在？
10. 是否有人工设计评审，问题如何闭环？
11. 是否引入用户已有修改或跨仓污染？
12. 下一阶段入口是否全部满足？

## 2. 发布验收清单

### 构建与来源

- [ ] 输入 commit、dirty 和内容 hash 完整；iOS 5 个既有 dirty 文件隔离。
- [ ] Token、Contract、Provider 和模板版本兼容，manifest 声明范围可审计。
- [ ] 无未声明的手工修改生成物；生成文件可追溯到真源。
- [ ] 同输入可复现构建和打包，`check` 在临时目录重建且无差异。
- [ ] 无绝对路径、缓存、秘密、临时文件、机器名或时间戳。

### Core

- [ ] 37 组件与 R1–R5 边界正确；组件集合与 YAML 完全相等。
- [ ] 用途、反例与来源可追溯；旧 `02-components.md` / 画廊不进入生成目录。
- [ ] Page Spec 正反例通过；未知字段/组件、集合缺空态等反例按 code 失败。
- [ ] 查询结果有界且不编造；不存在组件返回可操作建议。
- [ ] 薄入口与按需加载有效；常驻预算有自动检查；无死链。

### 平台

- [ ] API 卡有真实来源和四级证据；未编译项不标 verified。
- [ ] 缺实现/缺映射不生成假代码；不支持能力有固定返回结构。
- [ ] 黄金页面在消费侧真实编译；iOS 用 `xcodebuild` + 模拟器，不用 `swift build/test`。
- [ ] 规定快照/UI 矩阵执行；浅深色、大字体、长短内容、键盘、返回、读屏分别报告。
- [ ] 未跑与真机项明确；Android `wisdomGate` 不可用时不得伪报。
- [ ] 设计负责人独立完成评审，问题闭环。

### Skill 与宿主

- [ ] Core / iOS / Android / All 包内容正确，All 复用而非第五份真源。
- [ ] ZIP 与 checksums 可校验；固定时间戳与文件顺序。
- [ ] 目标宿主实际加载；D3 未确认前只声明通用目录包已验证。
- [ ] 查询、API 卡、脚手架在安装后可运行；路径安全与不覆盖有反例。
- [ ] 不兼容/不受支持场景正确失败；dirty snapshot 不标 release。

### 评测与发布

- [ ] Baseline 与候选实验条件一致；模型/宿主/工具版本 pin 到 run-manifest。
- [ ] 原始 Token、工具、编译和 diff 可审计；失败样本不删除。
- [ ] 收益结论限定于实际样本；无样本不承诺节省比例。
- [ ] 所有 verified 状态有报告与 evidenceRefs；覆盖增长可分层复算。
- [ ] 发布说明含未验证项、升级方式、失效提示；发布动作显式批准。

## 3. 覆盖分层统计建议

按 `coverage-model.json` 的 L1–L5 独立统计：设计语义 → 平台 API 发现 → 最小编译 → 模板验证 → 快照/UI。每层分母按该层适用集合与平台实际实现统计，不预设全平台 37；R1–R5 不混入组件数。禁止以上一层通过代替下一层。每次报告附输入 commit/dirty/hash、报告引用与统计口径。

## 4. 后续扩展顺序建议

- 组件：P0 黄金切片组件 → P1 高频基础 → P2 反馈/导航 → P3 专用组件；逐层过 L1–L5。
- 页面模式：列表与筛选 → 表单/编辑 → 详情 → 概览 → 模态任务 → 空态/新手引导/失败恢复。
- 新平台：先确认真实实现与验证工具，再建 Provider/能力画像/API 适配/最小编译/模板/UI；无真实实现仅 spec-only。Web 当前只保留 SPI，不宣称代码生成。
- 每次模板新增均需消费侧编译、状态矩阵、设计评审与负向脚手架测试。

## 5. 变更触发与趋势监控

相关 PR 按 `release-governance.json#changeTriggers` 分层触发；发布候选跑完整固定任务集。质量、修复、成本指标与端到端 Token 公式见 `evaluation/tasks.json`；先建基线，再由 M4 后固定回归阈值，阈值变更需原因与批准人。模型/宿主/工具变化另起基线。

## 6. 当前未验证项清单（必须原样带入发布说明）

| 项 | 当前状态 | 原因 / 责任 |
| --- | --- | --- |
| M0 契约独立评审 | `frozen-for-review` → 独立复核 verdict=needs_revision，修复后待复评 | R1 复核报告 `AIOptimize/review/01-contract-core.md`；F1–F11 由 R8 修复（运行时布局、manifest 契约、证据条件约束等）；`CONTRACT-STATUS.md` 仍是评审稿，不由实现者自行批准 |
| M1 Core 生成器 / 37 语义卡 / 正式校验器 | 已实施并通过复跑（用途/反例/状态/内容/无障碍结论 + 逐行 sourceRefs；`node tools/ai-skill/cli.js test` 全绿） | 语义卡不再只覆盖 §1；行号由 `tests/core-catalog.test.js` 逐条回读断言；死引用与预算依据见 `tools/ai-skill/README.md` |
| M2 iOS Provider / API 卡 / 黄金页面 | Provider 与 33 张 API 卡已建立（10/37 组件 + 5 Foundation 入口）；原生编译通过；快照/UI 矩阵 blocked | 未跑通 `xcodebuild test`（PTY 沙箱 exit 65），无 UI 矩阵通过结论；证据见 `iOS/ai/skill-provider/verification.json` |
| M3 Android Provider / API 卡 / 黄金页面 | Provider 与 17 张 API 卡已建立（11 组件 + 6 Foundation 入口）；模板静态检查通过；原生编译 blocked | 缺 `:demo` consumer 模块与 `activity-compose` 依赖；Gradle/ABI/截图均未执行；证据见 `android/ai/skill-provider/verification.json` |
| M4 四类目录包 / ZIP / checksums / 宿主加载 | 四包 + ZIP + checksums 已生成，manifest schema 0 错、逐文件哈希/ZIP/包内 runtime 可自动校验；宿主加载未执行 | `package.js` + `tests/dist-package.test.js`；无干净环境加载报告（D3 仍只声明通用目录包） |
| M5 AI 对照评测 / 设计评审 | harness 完成，真实评测未开始（observation-only） | readiness 5 个 blocker（模型/宿主/工具未 pin、两端原生命令未 pin）；无 results、无 Token/diff/设计评分数据 |
| 真机 / 设备矩阵 | 未验证 | 各端负责人未执行；不得省略不写 |
| iOS 既有 5 个 dirty 文件 | 保持隔离 | 基线 `m0/baseline.json` 已记录；不覆盖、不混入构建输入 |
| M6 分层覆盖数值 | 部分采集 | L1 designSemantic=37；L2 discovered：iOS 10 / Android 11（catalog 组件口径）；L3–L5 计数为 0，不得写普遍百分比结论 |
| 阈值 / 回归基线 | 未建立 | 需先跑 M5 基线；M4 后按证据设置并说明原因 |
| 发布动作 | 未批准 | L3 release-gate 只校验候选包；发布不是默认命令隐式步骤，需显式批准 |

## 7. 完成定义提醒

最终完成不是“仓库出现 Skill 文件夹”，而是：真源变化后可自动、可复现生成兼容 Skill；AI 在实际宿主按需使用并分别生成原生页面；结构与原生测试可执行；能力缺口显式降级；质量与 Token 有真实对照数据；所有发布声明可审计。在此之前，只声明各阶段已证明范围。
