# 组件检索 overlay

本目录只补充**检索关键词**、**组合关系**、**页面区域建议**等正式规格没有的语义。

- 用途、反例、状态、内容、无障碍与验收结论只来自 `docs/specs/01-basic.md`、`02-advanced.md`、`03-patterns.md`。
- 参数、槽位、默认值与枚举只来自 `contracts/WD*.yaml` 与 `contracts/README.md`。
- 视觉数值只来自 `tokens/wisdom.tokens.json`；平台 API 只来自平台仓公开证据。
- overlay 不得覆盖上述真源；重复或冲突时必须删除 overlay 条目，而不是改真源。

每个覆盖文件为 JSON，文件名必须与 `contracts/WD*.yaml` 的组件名一致；未知组件在构建时失败。
