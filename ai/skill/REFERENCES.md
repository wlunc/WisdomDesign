<!-- GENERATED FILE - DO NOT EDIT. -->
<!-- Source: wisdomdesign truth sources via tools/ai-skill/cli.js build. -->

# REFERENCES · 真源路径与冲突裁决（按需加载）

SKILL.md 只放路由；本文件放需要时才加载的路径清单与裁决顺序。

## 路径前缀

| 前缀 | 含义 | 能不能读 |
| --- | --- | --- |
| `package:` | 在本 skill 包内 | 能，直接用 |
| `source-repo:` | 只在 wisdomdesign 源码仓内 | 不能；这里给出它的角色和裁决优先级 |

## 路径清单

| 事实 | 真源 | 包内形态 |
| --- | --- | --- |
| 平台 API 签名 | 目标 Provider 包 | `package: platforms/<id>/api-cards/` |
| 参数 / 槽位 / 默认值 / 枚举 | `source-repo: contracts/WD*.yaml` | `package: catalog/contracts-digest.json`（去平台语法的派生视图） |
| 用途 / 反例 / 状态 / 内容 / 无障碍 | `source-repo: docs/specs/01-basic.md, 02-advanced.md, 03-patterns.md` | `package: catalog/components/WD*.md`（逐行 sourceRefs） |
| 视觉数值 | `source-repo: tokens/wisdom.tokens.json` | `package: tokens/wisdom.tokens.json`（逐字节副本，哈希锁定）+ `runtime/resolve-token.js` |
| 布局 / 无障碍 / 内容规则 | `source-repo: docs/09-layout.md, 06-accessibility.md, 07-content.md` | 摘要见各语义卡；规则原文仅在源码仓 |
| 页面结构契约 | `source-repo: ai/skill/page-spec/schema.json` | `package: page-spec/schema.json` |
| 扩展登记 | `source-repo: ai/skill/page-spec/extensions.json` | `package: page-spec/extensions.json` |

## 冲突裁决顺序

1. 平台真实 API / 签名：以 Provider 的已编译符号与源码证据为准，YAML 不得覆盖。
2. 参数 / 槽位 / 默认值 / 枚举：以 `contracts/WD*.yaml` 为准（包内用 digest，二者同源派生）。
3. 用途 / 反例 / 状态 / 内容：以 `docs/specs/*.md` 为准。
4. 视觉数值：以 `tokens/wisdom.tokens.json` 为准 —— 但**先确认该值已被断言覆盖**（`tools/token-build/build.js` 的对比度与渐变断言）；已知未裁定项见源码仓 `KNOWN_GRADIENT_EXCEPTIONS`，不要当作正确值照抄。
5. 布局 / 无障碍 / 内容规则：以 `docs/09`、`06`、`07` 为准。
6. 验证状态：以报告证据为准，不以后填的状态字段为准。

## 已知未裁定项（截至 2026-11-28）

| 项 | 现状 | 影响 |
| --- | --- | --- |
| `semantic.dark.text.on-fill` = `#DCEEF4` | 在 `gradient.fill` 起点 `#1677B3` 上 4.07:1，低于规格 §10 的 4.5 | 深色 filled 按钮的白色系文字；WCAG 大字 3:1 达标，内部 4.5 未达标。设计侧裁定前**不要**引用 gallery 的 `#FFFFFF` 当规范，也不要宣称已通过 |
| `design/gallery/**` | 已与令牌对账（0 漂移，1 例外），但仍是**手写**副本 | 视觉参考可以看，规范值一律用 `runtime/resolve-token.js` |

## 不要做的事

- 不要重抄令牌数值到 spec 或代码里；用 `runtime/resolve-token.js --path <token>`。
- 不要把 `design/gallery/**` 当规范源；它是展示物，且历史上落后令牌两轮。
- 不要用 `kind: "custom"` 绕开语义规则 —— 1.1 已删除该值；产品特有组合请走 `page-spec/extensions.json`。
