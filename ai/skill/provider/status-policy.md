# Provider 证据与状态计算 v1

## API 证据等级（只允四级）

| 等级 | 证据 | 允许用途 |
| --- | --- | --- |
| `contract-only` | 只有 YAML / specs 语义 | 只做设计描述，不返回可编译 API |
| `discovered` | 公开源码 / ABI 发现 | 可辅助选择，必须提示未编译 |
| `example-compiled` | 最小调用例真实编译通过 | 仅限该调用形态 |
| `template-verified` | 原生模板 + 规定测试矩阵通过 | 可作为首选示例 |

## status 由证据计算

- `verified`：所有规定状态的模板编译通过，且快照 / UI 矩阵按平台要求执行，人工设计评审问题闭环；不得由 Provider 自填获得。
- `experimental`：存在平台实现与真实 API，但只有 `discovered` 或 `example-compiled` 证据，或规定矩阵未跑全。
- `spec-only`：设计语义存在、平台无实现 / 无映射 / 无验证；只返回设计信息，不生成代码。
- `unsupported`：平台明确不支持该能力；返回固定不支持结构。
- `incompatible`：Token / Contract / Provider / 模板版本不兼容；构建失败。

Provider 文件中的 `status.declared` 只是意图输入；`status.effective` 必须由构建器根据证据重算并记录 `evidenceRefs`。任何 `verified` 无报告引用都视为契约违规。

## 不支持能力返回

固定返回 `{ code, capability, status, reason, suggestion }`，`status` 取 `unsupported` / `spec-only` / `not-verified` / `incompatible`。禁止 `fabricate-api`、`fake-verified`、`bypass-test`、`cross-repo-write`。

## 路径与命令边界

- Provider 默认只读平台仓；适配器不得隐式跨仓写入。
- iOS 门禁只使用 `xcodebuild` + 模拟器流程，不使用 `swift build` / `swift test`。
- Android 使用本仓现成 Gradle 任务；`wisdomGate` 尚未成为可用门禁时不得声称已跑。
- 所有命令、SDK / 目标、退出码与未验证项进入验证报告。
