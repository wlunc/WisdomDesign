# AI Skill 运行时工具

本目录是 Core Skill 的确定性运行时脚本；只读按需加载，不猜测平台 API。
本文件随包分发，命令按**包根目录**书写；在 wisdomdesign 源码仓中运行时给路径加 `ai/skill/` 前缀即可。

## validate_spec

```bash
node runtime/validate-spec.js --file page-spec/examples/task-list.valid.json --json
```

- 读取 `page-spec/schema.json` 执行结构校验，并补充 canonical 组件、空态、多主操作等语义规则。
- 错误对象固定为 `{ code, jsonPath, message, suggestion }`。
- 报告分开给出 `structureValid` 与 `semanticValid`（以及 `gates.structure` / `gates.semantics`）：结构通过只代表结构，原生编译、快照/UI、设计评审与宿主加载均为 `not-evaluated`。
- 退出码：0 通过；1 校验失败（结构或语义）；2 用法 / IO / JSON 解析错误。

## get_component

```bash
node runtime/get-component.js --id WDButton --json
node runtime/get-component.js --query 搜索 --limit 8 --json
```

- `--id` 做 canonical 精确查询，只返回一张语义卡摘要。
- `--query` 搜索用途、alias 与组合语义，默认最多 8 条，硬上限 20 条；返回 `totalCandidates` 与 `truncated`。
- 未知 ID 返回可操作建议与少量真实 sampleIds，不编造相近组件或平台 API。
- catalog / overlay / card 路径均检查边界，拒绝逃逸 Skill 包；默认 catalog 同时适配源码布局（`core/catalog`）与打包布局（`catalog`）。
- 退出码：0 命中；2 用法 / 路径错误；3 未找到。

测试（仅源码仓，不在包内）：`node tools/ai-skill/tests/runtime.test.js`。
