# AI 消费层与 Skill 生成源目录

> 状态：已实施（M0 契约 + M1 Core + M2/M3 Provider + M4 打包/CI + M5 harness）。原生编译/UI 矩阵与真实 AI 评测未全部执行，状态以各产物与复跑证据为准，不以目录存在推断通过。

本目录的实施契约见 [Skill 生成流水线实施方案](../AIOptimize/02-SKILL-BUILD-PIPELINE.md)，阶段安排见 [开发计划](../AIOptimize/03-DEVELOPMENT-PLAN.md)。

## 边界

- `wisdomdesign/` 负责 Page Spec、跨端组件语义、Provider SPI、Skill 编排、查询、校验、打包与评测；
- iOS / Android 仓分别拥有真实 API、capability profile、原生模板和平台验证；
- 业务黄金页面属于消费方 App 或 AIStarter，不进入 WisdomUI 发布组件；
- 本目录未来只保存构建源与必要 overlay，不复制设计 Token、API 或组件视觉数值真源。

## 当前状态

- `skill/` 下已有 Page Schema、Provider SPI/API 卡 schema、包 manifest schema、37 语义卡、校验器与查询运行时、SKILL.md 模板与治理 JSON；
- `tools/ai-skill/` 提供提取/生成/构建/检查/打包/CI 工具，`node tools/ai-skill/cli.js test` 与 `python3 tools/ai-skill/package.py` + `node tools/ai-skill/tests/dist-package.test.js` 可复跑；
- `dist/ai-skill/v1.0.0` 下有 Core/iOS/Android/All 四包与 checksums（生成物，不作为提交证据）；
- 未执行：宿主加载、iOS/Android 快照/UI 矩阵、真机、M5 真实评测；原生编译状态以平台仓 `ai/skill-provider/verification.json` 为准（iOS consumer build 通过、Android blocked）。
- 入口与边界见 `AIOptimize/README.md`、`AIOptimize/02-SKILL-BUILD-PIPELINE.md` 与 `tools/ai-skill/README.md`。
