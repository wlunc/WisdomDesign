# AI Skill 运行时工具

本目录是 Core Skill 的确定性运行时脚本；只读按需加载，不猜测平台 API。
本文件随包分发，命令按**包根目录**书写；在 wisdomdesign 源码仓中运行时给路径加 `ai/skill/` 前缀即可。

## validate_spec

```bash
node runtime/validate-spec.js --file page-spec/examples/task-list.valid.json --json
```

- 读取 `page-spec/schema.json` 执行结构校验，并补充语义规则（1.1）：emphasis 由 `variant` + 契约默认值推导（一屏最多一个 primary）、`variant` 必须存在于契约枚举、`primaryAction` 必须被某 region 的 `action` 承接、`tabRoot` 不得用 `WDNavigationBar`、`extension.id` 必须已登记。
- 错误对象固定为 `{ code, jsonPath, message, suggestion }`；另有 `warnings` 通道（如 `PROPOSED_EXTENSION`、`STATE_INCOMPLETE`），**warning 不阻断**，但会打印出来供评审。
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

## resolve_token

```bash
node runtime/resolve-token.js --path text.tertiary
node runtime/resolve-token.js --path text.on-fill --scheme dark --json
```

- 读包内 `tokens/wisdom.tokens.json`，解析一个 DTCG 叶子路径，返回 `value` / `description` / `source` / 令牌文件 `sha256`。
- 无 scheme 的简写（`text.tertiary`）按 `semantic.light.*` 解析；`type.*` 映射到 `typography.*`，`derived.*` 映射到 `color.derived.*`。
- 解析不到返回 `found:false`，提示「不要自造数值」，绝不猜相近令牌。
- 路径只允许点分令牌名，`..` 等一律用法错误。
- 退出码：0 命中；2 用法 / 路径错误；3 未找到。

## render_spec

```bash
node runtime/render-spec.js --file page-spec/examples/task-list.valid.json --out preview.html
node runtime/render-spec.js --file my-spec.json --scheme dark --out preview-dark.html
```

- 输出**单文件、无外部依赖、无脚本**的 HTML 结构预览：按 region 布局，标出 component / kind / variant / action，并列出 states。
- **所有视觉数值在运行时从 `tokens/wisdom.tokens.json` 派生**（语义色槽、间距、圆角、字阶、阴影各生成一条 CSS 变量）。包内没有第二份配色，因此不存在「预览与令牌不一致」这种漂移。
- 输出确定性：同一 spec 逐字节相同，无时间戳、无绝对路径，可直接进 CI diff。
- 报表的 `gates` 与 `validate_spec` 口径一致：`structure=passed`，而 `nativeCompile / snapshotUi / visualDesignReview / hostLoad` 全部 `not-evaluated`。页面顶部横幅同样写明「结构预览，非最终视觉」。
- 退出码：0 成功；2 用法 / IO / JSON 解析错误。

测试（仅源码仓，不在包内）：`node tools/ai-skill/tests/runtime.test.js`。
