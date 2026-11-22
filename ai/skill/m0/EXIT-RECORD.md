# M0 出口记录（captain verdict）

> 记录人：captain（非实现者）
> 日期：2026-11-22（Asia/Shanghai）
> 依据：R1 独立复核（needs_revision）、R8 契约侧修复、R7/R9/R11/R13 修复复验、本轮出口复跑
> 性质：M0 契约冻结的出口裁决；不是 M1–M6 完成声明，也不是发布批准。

## 1. 裁决

**M0 出口：PASS（带记录性保留项）。**

M0 契约（Page Spec v1、Provider SPI、manifest v1、双端黄金矩阵、固定 AI 任务集、D1–D10、真源映射、基线）已具备进入实施的条件；CONTRACT-STATUS.md 与相关 M0 契约状态由 frozen-for-review 更新为 implementation-ready。

## 2. 出口证据（本轮复跑）

| 检查 | 命令 | 结果 |
| --- | --- | --- |
| 契约自检 | node tools/ai-skill/tests/contract-selftest.js | 25 PASS，exit 0 |
| M1 运行时/构建自测 | node tools/ai-skill/cli.js test | 11/11 PASS，exit 0 |
| Page Spec 正例 | validate-spec --file ai/skill/page-spec/examples/task-list.valid.json | exit 0 |
| Page Spec 反例 | validate-spec --file ai/skill/page-spec/examples/invalid-cases.json | exit 1（按预期拒绝） |
| 四包 manifest/哈希/运行时 | node tools/ai-skill/tests/dist-package.test.js | 119/119 PASS，exit 0 |
| full 模式构建/自检 | cli.js build/check --ios-root ../iOS --android-root ../android | 均 exit 0，52 文件一致 |
| core-only 构建/自检 | cli.js build/check | 均 exit 0，52 文件一致 |

依据链：R1 的 F1/F2/F3/F4/F5/F6/F7/F9/F10/F11 由 R8 修复；R7（iOS）、R11（Android）、R13（流水线）复验通过；R9 的 F11 文档残留由 R12 修复并经 R13 复验。详见 AIOptimize/review/*.md 与 AIOptimize/FIXES-t8.md、FIXES-t12.md。

## 3. 记录性保留项（不阻断 M0 出口，但必须随报告保留）

1. **无单独的 M0 专项复评**：本裁决由 captain 基于 R1 发现、R8 修复与 R9/R13 契约/包级复验作出；未再委托第五份 M0 专项复核。
2. **流程顺序偏离**：M1–M4 部分实现先于 M0 出口记录（R1-F8）。本记录关闭状态缺口，不回写历史时序。
3. **后续里程碑未完成**：M2 UI 矩阵 blocked、M3 native compile blocked、M4 宿主加载未执行、M5 真实评测 not-run；这些不属于 M0 出口条件，但阻止“计划任务完成/可发布”的表述。
4. **M0 自检边界**：零依赖 schema-lite 子集，不是完整 JSON Schema 实现；第三方 schema 校验仍属 P1。

## 4. 状态变更

- CONTRACT-STATUS.md：状态改为 implementation-ready，并注明仅 M0 契约可实施。
- truth-source-map.json、evaluation/golden-matrix.json、evaluation/tasks.json：status 改为 implementation-ready。
- m0/README.md、decisions/D1-D10.md：同步出口记录。
- 治理文件（governance/*）保持 frozen-for-review：它们描述当前系统整体状态，仍含未完成项，不能随 M0 一并解锁。
