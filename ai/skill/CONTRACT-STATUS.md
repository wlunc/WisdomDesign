# M0 契约状态（冻结评审稿）

> 状态：**M0 出口已记录 → implementation-ready（captain verdict，2026-11-22）**。仅代表 M0 契约可实施，不代表 M1–M6、原生/UI、M5 评测或发布通过。出口记录见 [`m0/EXIT-RECORD.md`](m0/EXIT-RECORD.md)。
> 依据：`AIOptimize/02-SKILL-BUILD-PIPELINE.md`、`AIOptimize/03-DEVELOPMENT-PLAN.md` §3。
> 复核与修复记录：独立复核报告 `AIOptimize/review/01-contract-core.md` verdict=needs_revision；F1–F11 的契约侧修复已落在 `ai/skill/**` 与 `tools/ai-skill/**`（runtime 布局、manifest 单一生成器与 schema 校验、provider/api-card 证据条件约束、语义卡行号与状态/内容/无障碍结论、死引用、预算依据、校验器结构/语义分离）。实现先于 M0 批准的历史时序如实保留；出口状态仍由 captain 按本文 §3 的门禁单独记录，实现者不自评通过。

## 1. 评审稿范围

| 契约 | 文件 | 冻结内容 |
| --- | --- | --- |
| Page Spec v1 | `page-spec/schema.json` + `examples/` | 平台中立最小结构；正反例；单平台任务可跳过 |
| Provider SPI v1 | `provider/*.schema.json` + `status-policy.md` | capabilities、API 证据等级、status 计算、不支持能力返回 |
| 包 manifest v1 | `manifest/manifest.schema.json` | 来源 commit / dirty / hash / 版本 / 状态 / coverage；可复现字段约束（R12：`wisdomdesign` 必填，平台仓仅在包包含平台载荷时要求） |
| 双端黄金矩阵 | `evaluation/golden-matrix.json` | 同一 Page Spec 的两端状态、平台交互、自动与人工验收责任 |
| 固定 AI 任务集 | `evaluation/tasks.json` + `protocol.md` | 8 个任务、三实验臂、指标与成本口径 |
| D1–D10 | `decisions/D1-D10.md` | 结论 / 默认执行项与非阻塞风险 |
| 真源映射 | `truth-source-map.json` | 每个字段唯一真源、冲突裁决、旧资料边界 |
| 基线 | `m0/baseline.json` | 三仓 commit / dirty / 内容哈希；iOS 已有修改隔离 |

## 2. 关键约束

- Page Spec 不含 Swift / Kotlin 类型，不承载平台 API，也不是运行时 UI 虚拟机。
- Provider 只能声明真实存在的能力；API 证据只分 `contract-only` / `discovered` / `example-compiled` / `template-verified`。
- `status` 是构建器按证据计算的派生字段，Provider 自填值只能作为输入声明，不能自我认证。
- 缺失能力返回结构固定为 `unsupported` / `spec-only` / `not-verified` / `incompatible`，禁止编造 API 或绕过测试。
- manifest 禁止时间戳、绝对路径、机器名和临时目录；dirty 输入只能标 `workspace-snapshot`。
- **R12 契约澄清（2026-11-22）**：`manifest.schema.json` 的 `sources.repositories` 必填项由三仓改为 `wisdomdesign`。单仓 checkout 的 Core-only 构建只记录实际存在的来源，不伪造平台 commit；包含平台载荷的包仍要求对应平台仓状态。此次放宽向后兼容既有三仓 manifest，由 `contract-selftest` 与 `dist-package` 覆盖。
- 双端验证命令来自现有构建系统；本次 M0 未执行原生编译、快照、UI 或真机验证。
- 所有生成物、平台仓和设计真源均不在本任务写入范围。

## 3. M0 出口（已记录）

**verdict：PASS（带记录性保留项）**，由 captain 于 2026-11-22 基于 R1 复核、R8 修复与 R7/R9/R11/R13 复验记录。M0 契约状态统一更新为 `implementation-ready`；治理文件仍保持 `frozen-for-review`，因为系统整体仍有 M2/M3/M4/M5 未完成项。

保留项：无单独 M0 专项复评；实现先于出口记录的历史时序不回写；零依赖 schema-lite 不是完整 JSON Schema 实现。详见 [`m0/EXIT-RECORD.md`](m0/EXIT-RECORD.md)。

## 4. 验证资产

`wisdomdesign/tools/ai-skill/tests/contract-selftest.js` 用于本契约稿的机器自检：
- 校验所有契约 JSON / schema 本身合法；
- 用零依赖的 `lib/schema-lite.js` 执行 v1 必需关键字子集；
- 正例必须全部通过，负例必须按预期失败；
- 检查正例不含平台类型，检查每个反例有 `expectedError`，检查真源和验证责任无悬空。

自检不等于完整 JSON Schema 实现，也不等于 M1 的正式校验器；正式实现需补完整 JSON Schema 测试与独立评审。
