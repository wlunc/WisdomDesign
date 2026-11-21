# AI 消费层与 Skill 生成源目录

> 状态：规划保留目录，尚未实施。

本目录的实施契约见 [Skill 生成流水线实施方案](../AIOptimize/02-SKILL-BUILD-PIPELINE.md)，阶段安排见 [开发计划](../AIOptimize/03-DEVELOPMENT-PLAN.md)。

## 边界

- `wisdomdesign/` 负责 Page Spec、跨端组件语义、Provider SPI、Skill 编排、查询、校验、打包与评测；
- iOS / Android 仓分别拥有真实 API、capability profile、原生模板和平台验证；
- 业务黄金页面属于消费方 App 或 AIStarter，不进入 WisdomUI 发布组件；
- 本目录未来只保存构建源与必要 overlay，不复制设计 Token、API 或组件视觉数值真源。

## 当前状态

尚未创建 `skill/`、Page Schema、Provider、运行时脚本或正式生成产物。本文件只是方案导航，不代表流水线已经可运行。
