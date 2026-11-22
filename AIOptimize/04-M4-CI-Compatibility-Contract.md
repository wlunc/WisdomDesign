# M4 分层 CI、版本兼容与负向测试契约（m4-ci）

> 状态：**实施稿 / 由 qa-verifier（验证与评测）落地的 M4 测试资产**。
> 日期：2026-11-21。
> 依据：[开发计划 §7 M4](03-DEVELOPMENT-PLAN.md#7-m4跨端组装确定性打包与宿主验收)、[实施方案 §12 CI 与变更触发](02-SKILL-BUILD-PIPELINE.md#12-ci-与变更触发)、[M0 契约状态](../ai/skill/CONTRACT-STATUS.md)。
> **R8 修订（2026-11-22）**：`cli.js`、`dist/ai-skill/v1.0.0` 包与 checksums 已落地；本契约描述的门禁均由真实脚本执行（`ci/route-changes.js`、`ci/check-native-layers.js`、`ci/release-gate.js`、`tests/dist-package.test.js`），不再只停留在 fixture/静态层。
> **R12 修订（2026-11-22）**：所有门禁改为**单仓标准 checkout 可运行**——L0/L1/L2 与 `package-repro` 默认 core-only，不依赖同级 iOS/android 或预生成 catalog/dist；只有显式配置平台仓变量并 checkout（`--ios-root/--android-root`）时才跑 full 打包与严格原生证据校验。原生编译、快照/UI、宿主加载仍未执行，相关行保留如实声明。
> 边界：本契约与配套测试**只读真源、不写平台仓、不自动提交、不改设计真源**；不冒充可复现构建已跑、原生编译已跑或宿主已加载。

---

## 1. 结论先行

| 任务要求 | 本轮落地 | 未落地 / 待上游 |
| --- | --- | --- |
| PR / 变更范围 / 原生深度 / 发布门禁分层 | `wisdomdesign/.github/workflows/ai-skill-ci.yml` **5 个 job**（L0 / L1 / L2 / package-repro / L3）+ 路径过滤 | 真实 runner 上的平台原生 job 需平台 CI 自身配置；本仓 CI 只编排、打包与报告，不声明原生通过 |
| check 不改真源、不自动提交 | `m4-ci.test.js` 的 `check-no-mutation` 比对真源哈希；CI 实际执行 `cli.js check`；workflow 显式无 commit/push 步骤 | 仍缺宿主加载阶段的只读验证（未执行） |
| Token / Contract / Provider / 模板不兼容失败 | 四组负向用例（版本不兼容 / 证据自认证 / 证据升级缺编译 / 模板缺失） | 真实打包器拒绝后需把错误码回灌本测试 |
| dirty snapshot 不冒充 release | manifest schema 三仓 allOf 约束 + `dirty-release-negatives` 用例 + 真实包 `status.releaseKind=workspace-snapshot` | 已在真实四包复测（dist-package / release-gate） |
| 清理陈旧引用、死链与路径越界 | `dead-link-audit` 递归扫描 AIOptimize/** 与 ai/skill/**（含 core/catalog、生成 dist）；`dist-package.test.js` 复测包内链接、ZIP 路径与机器信息 | 包内组件卡的 `docs/specs/...` 是来源锚点而非链接，已在文档声明 |

---

## 2. 分层门禁

workflow 触发：`pull_request` 与 `push: main`，带 `paths-ignore` 过滤与 `workflow_dispatch` 手动入口。

| 层 | job | 触发 | 必过内容 | 明确不做 |
| --- | --- | --- | --- | --- |
| L0 契约结构 | `contract-structure` | 所有相关 PR | `contract-selftest.js` + `m4-ci.test.js` + contracts-check.rb + token selftest | 不编译、不加载宿主 |
| L1 范围路由 | `change-scope-routing` | 所有相关 PR | 执行 `tools/ai-skill/ci/route-changes.js` 输出 JSON，声明每个变更类需补跑哪层 | 不把文档 PR 标成原生已测 |
| L2 原生深度 | `native-depth` | 仅 iOS/Android Provider、API、模板、黄金页面变更 | `ci/check-native-layers.js`：每个必跑原生层必须在 `ai/skill/manifest/native-layers.json` 登记（owner/command/status/evidence）；单仓 checkout 只校验登记并标记平台证据 external-owned；提供 `--ios-root/--android-root`（或 full 模式）时才按平台仓 `verification.json` 的 JSON pointer 做严格校验 | 本 job 不跑 xcodebuild / gradle，不写平台仓，不声明原生通过 |
| L3 发布门禁 | `release-gate` | 仅 `workflow_dispatch` 且输入 `release=true`，且前面 job 全绿 | `ci/release-gate.js --dist dist/ai-skill/v1.0.0`：校验 artifact 中实际存在的包集（core-only 或 full）——manifest schema、contents.fileCount=实际、reportRef/checksumsRef 存在、zip/manifest/files.json 哈希、dirty→snapshot、verified→四 flag、checksums 与目录包集一致 | 默认不运行；没有显式批准不发布 |
| 打包 / 可复现层 | `package-repro` | 所有相关 PR / push | 默认 core-only：`cli.js build`+`check`、`package.py --platforms core` 连续两次 `checksums.json` 逐字节一致、`dist-package.test.js --platforms core`；配置平台仓变量并 checkout 时切 full（`--platforms core,ios,android` + `--ios-root/--android-root` + 严格 L2 证据） | 不执行宿主加载；平台原生命令不在此层 |

增量的 `route-changes.js` 在 `tools/ai-skill/ci/`，只读 GitHub event payload + `--paths-file` 文件列表，按 M0 契约的“变更→必跑”表输出需补跑的层。PR 事件本身不含文件列表（`pull_request.changed_files` 是数量），CI 用 `git diff --name-only origin/<base>...HEAD` 生成列表并加 `--require-paths`，空列表直接失败，不再退化为 baseline。pure-doc PR 只会得到 `nativeRequired: false` 与提醒，不会伪报原生测试。

---

## 3. 版本兼容负向矩阵

测试入口：`node wisdomdesign/tools/ai-skill/tests/m4-ci.test.js`，退出码 0=全过，1=有用例失败。

| id | 场景 | 预期 |
| --- | --- | --- |
| `token-incompatible` | manifest.versions.tokens 与 baseline tokenVersion 不一致 | 构建必须判 incompatible / fail-build，不得静默通过 |
| `contract-incompatible` | version.contracts 与 baseline 契约树版本不一致 | 同上 |
| `provider-incompatible` | Provider.schemaVersion 非 1.0 或 status.incompatible | 同上 |
| `template-incompatible` | versions.templates 与实际模板 manifest 版本不一致 / 模板缺失 | fail-with-guidance，错误建议不得出现 fabricate-api / bypass-test |
| `provider-self-certify` | declared=verified 但 evidenceRefs 为空 | schema 失败（MIN_ITEMS） |
| `api-card-upgrade-without-compile` | evidence=template-verified 但 compilation.executed=false | schema 失败（CONST） |
| `dirty-android-release` | Android dirty=true 且 releaseKind=release | schema 失败（CONST） |
| `dirty-ios-release` | iOS dirty=true 且 releaseKind=release | schema 失败（CONST） |
| `verified-without-evidence` | overall=verified 但 nativeCompile/runtimeMatrix/designReview/hostLoad 任一 false | schema 失败（CONST） |
| `stale-reference-in-manifest` | verification.reportRef / checksumsRef 指向不存在文件 | 引用解析检查失败 |
| `path-traversal-ref` | reportRef 含 `..` 或绝对路径 | 路径安全失败 |
| `unsupported-only-design` | Page Spec platforms.web.status=unsupported | 校验通过，但只允许设计结果，不生成 Web 代码 |

“构建失败”由 schema/兼容性判定函数的 assertInvalid 表达；`cli.js` 已实现并在 CI 中被实际执行（build/check/test），同一批 fixture 仍是唯一真源，未另立格式。F3 修复后，provider/api-card 的“省略证据字段”也作为负例覆盖。

---

## 4. check 不改真源

`m4-ci.test.js` 在 `os.tmpdir()` 下建沙箱：
1. 记录 wisdomdesign 真源集合（`ai/skill/**`、`contracts/WD*.yaml`、`tokens/wisdom.tokens.json`）的相对路径 + SHA-256；
2. 以只读方式加载 schema 与 fixture，在内存里构造负例；
3. 再次计算真源哈希并比对；若发生写入则用例失败；
4. workflow 中没有 `git commit` / `git push` / 生成物回写步骤。

`cli.js check` 已实现并在 CI 的 `package-repro` job 中实际执行（临时目录重建 + 逐字节比较），本测试的真源指纹是第二道只读观察。

---

## 5. 路径与死链审计

- Markdown 相对链接：递归扫描 `AIOptimize/**`、`ai/skill/**`（含 `core/catalog`）与 `dist/ai-skill/**`；抽取 `[]()` 链接，目标必须存在；带 `#anchor` 的链接只校验文件存在。审计必须看到至少 40 条内部链接，否则判失败（防止正则空跑假通过，R4 发现的 46 条真实链接现已全部计入）。
- 路径安全：所有 manifest 引用、Provider adapters/capabilities/apiCards、runtime 脚本路径必须是仓库相对 POSIX 路径；拒绝 `^/`、Windows 盘符、`(^|/)..(/|$)`、`\0`。
- 外部 `https?://` 链接视为数据，不作为流水线指令，本审计只记录数量不尝试下载。

本轮审计结果见 [M4 CI 验证报告](04-M4-CI-Verification.md) 与 `reports/m4-ci-result.json`（由测试脚本生成，位于 `wisdomdesign/tools/ai-skill/reports/`）。

---

## 6. 与上游包任务的接口

- `dist-package` 用例组已落地（`tools/ai-skill/tests/dist-package.test.js`）：从生成包内读取 manifest / files.json / checksums，审计 schema、文件计数、逐文件哈希、ZIP 元数据/CRC/路径安全、scope 隔离、包内 runtime 退出码、SKILL 预算与死引用，并已接入 CI `package-repro` job。
- 本契约的后续修改不得引入第二套 manifest 格式：`tools/ai-skill/lib/manifest.js` 是唯一生成器，`cli.js` 与 `package.py` 共用。
