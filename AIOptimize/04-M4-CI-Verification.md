# M4 CI / 版本兼容 / 负向测试验证报告（m4-ci）

> 由 qa-verifier（t10）产出。时间：2026-11-21（Asia/Shanghai）。
> **R8 修订（2026-11-22）**：按 R4 复核 F-系列与 R8 修复后的真实产物重跑并刷新数字。
> **R12 修订（2026-11-22）**：按 R9 复验要求补齐**单仓标准 checkout 可运行性**（无同级 iOS/android、无预生成 catalog/dist），刷新 04 两份文档与 fix record 的过期数字，并把 02 设计文档与实现对齐。本节所有数字来自最终一次 `m4-ci` / `governance` / `dist-package` 输出。
> 依据：[M4 CI 兼容性契约](04-M4-CI-Compatibility-Contract.md)、[开发计划 §7](03-DEVELOPMENT-PLAN.md#7-m4跨端组装确定性打包与宿主验收)、[实施方案 §12](02-SKILL-BUILD-PIPELINE.md#12-ci-与变更触发)、[R12 修复记录](FIXES-t12.md)。

## 1. 真实执行的命令与结果（最终一次，2026-11-22）

| 命令 | 退出码 | 结果 |
| --- | --- | --- |
| `node tools/ai-skill/tests/contract-selftest.js` | 0 | **25** 项 M0 契约正反例通过（含 F3 省略字段负例） |
| `node tools/ai-skill/tests/m4-ci.test.js` | 0 | **63** 项 M4 CI / 兼容 / 负向用例通过，0 失败；当前 truthFingerprint `c303ee83e3f5dda86af1b9869d3c19d18f34cee04ae946a934c5f40e1680c0ab` |
| `node tools/ai-skill/tests/governance-selftest.js` | 0 | **23** 项 M6 治理自检通过（含状态一致性断言） |
| `node tools/ai-skill/cli.js test` | 0 | M0 契约 + M1 目录 + M1 运行时 + M1 构建（含打包布局 runtime、超预算负例） |
| `node tools/ai-skill/cli.js build` + `check` | 0 / 0 | 52 文件；manifest schema-valid；check 与临时重建逐字节一致 |
| `node tools/ai-skill/package.js`（连续两次，full） | 0 / 0 | 四包 53/98/80/125 文件；两次 `checksums.json` 逐字节一致 |
| `node tools/ai-skill/tests/dist-package.test.js` | 0 | **119** 项四包审计通过（manifest schema / 计数 / 逐文件哈希 / ZIP / 包内 runtime / 预算 / 死引用 / 包集完整性） |
| `node tools/ai-skill/ci/release-gate.js` | 0 | 四包 candidate validated（workspace-snapshot） |
| `ruby tools/contracts-check.rb` | 0 | 37 组件契约真源门禁通过 |
| `bash tools/token-build/selftest.sh` | 0 | Token 生成器只读沙箱自测通过 |
| workflow 结构 + 脚本语法检查 | 0 | **5 个 job**（L0 / L1 / L2 / package-repro / L3）；L0/L1/L2 与 core-only 打包单仓可运行；full 打包需显式 checkout 平台仓；无自动提交步骤 |

死链审计（m4-ci 内部）：**269 个 md、47 条内部链接、6 条跨仓证据链接（0 dead、0 external）**。跨仓链接指 `AIOptimize/README.md` 等指向 `../../iOS/...` / `../../android/...` 的证据引用；平台仓存在时校验文件，单仓 checkout 记为 cross-repo/unverifiable，不计死链；其它越界路径仍判死。

## 2. M4 任务要求逐项结论（R12 修订后）

| 验收项 | 结论 | 证据 |
| --- | --- | --- |
| 分层 CI（PR / 变更范围 / 原生深度 / 发布门禁） | 已落地且**单仓可运行** | `.github/workflows/ai-skill-ci.yml` 5 job；`ci/route-changes.js`（PR 文件列表 + `--require-paths`）、`ci/check-native-layers.js`、`ci/release-gate.js`；route/event/native-layer 用例通过 |
| PR 变更路由 | 已修复 | `pull_request.changed_files` 是数量而非文件列表；CI 用 `git diff --name-only origin/<base>...HEAD` 生成 `--paths-file`，空列表 exit 2；REST `files[]`、push `commits[]` 亦有用例 |
| 单仓 checkout 可运行 | 已修复（R12） | 无同级 iOS/android、无预生成 catalog/dist 的 /tmp 干净副本实测：m4-ci 63/63、contract 25、governance OK、`cli.js test` 全过、`cli.js build/check` 0、`package.js --platforms core` 两次一致、`dist-package --platforms core` 32/32、release-gate 0；详见 §4 |
| check 不改真源、不自动提交 | 已落地 | `check-no-mutation` 指纹前后一致；CI 实际执行 `cli.js check`；workflow 无 commit/push 步骤 |
| Token / Contract / Provider / 模板不兼容失败 | 已落地（guard 层） | token/contract/provider-schema/manifest-schema/skill-version/template/provider-incompatible 用例通过 |
| dirty snapshot 不冒充 release | 已落地（schema + guard 双层） | 三仓 dirty+release 均被 schema 拒绝（`dirty-{wisdomdesign,ios,android}-release`）；Core-only 包只记录实际存在的来源，不伪造平台 commit |
| 缺失 API 卡 / 模板 / 脚本有明确错误 | 契约已定义 | provider.schema unsupportedBehavior + forbidden 四项；provider/api-card 证据省略负例通过（F3） |
| 不受支持平台只出设计结果 | 已落地 | unsupported-web-design-valid、cannot-claim-web-verified-in-spec 通过 |
| 错误报告不建议编造 / 绕过测试 | 已落地 | provider unsupportedBehavior.forbidden 四项强制；负例均断言不出现伪造建议 |
| 清理陈旧引用、死链与路径越界 | 已落地且单仓可运行 | 死链审计 269 md / 47 internal / 6 cross-repo / 0 dead；`dead-link-audit-not-empty` 用源文档下限（≥20 links、≥10 md）防止空跑；`dead-link-cross-repo-classification`、`dead-link-escape-rejected` 用例；包内死链由 dist-package 复测 |
| 构建报告可作为 CI artifact | 已落地 | workflow upload-artifact m4-ci-report / m4-change-plan / ai-skill-dist |

## 3. 证据边界（必须如实声明）

- 本报告验证的是**契约 / 静态门禁层 + 打包/可复现层**，不是 M4 的完整出口。
- `cli.js`、`dist/ai-skill/v1.0.0` 四包与 checksums 已生成并可自动审计；**未执行**干净环境安装与宿主加载。
- **没有**执行任何 iOS / Android 原生编译、快照、UI、ABI 或真机测试；`native-depth` 只校验登记与证据引用（单仓时平台证据 external-owned，不判死也不声称通过）。
- 真实包 manifest 符合 M0 `manifest.schema.json`（四包 0 错）；`files.json` 覆盖除 `manifest.json`/`files.json` 外全部文件（含 `LICENSE-NOTICE.txt`），这两个自指文件的哈希由 `checksums.json` 发布。
- 单仓 core-only 的 manifest 只有 `sources.repositories.wisdomdesign`（不伪造平台 commit）；平台包仍包含对应平台仓状态。

## 4. 单仓 /tmp 干净复现（R12，无平台仓、无生成物）

| 命令 | 退出码 | 结果 |
| --- | --- | --- |
| `node tools/ai-skill/tests/m4-ci.test.js` | 0 | 63 PASS / 0 FAIL；16 md / 47 internal / 6 cross-repo（6 unverifiable）/ 0 dead |
| `node tools/ai-skill/tests/contract-selftest.js` | 0 | 25 PASS |
| `node tools/ai-skill/tests/governance-selftest.js` | 0 | M6 GOVERNANCE SELFTEST OK |
| `node tools/ai-skill/cli.js test` | 0 | 契约 25 + 目录 8 + 运行时 12 + 构建 11 |
| `node tools/ai-skill/cli.js build` + `check` | 0 / 0 | 52 文件；manifest schema-valid；check OK |
| `node tools/ai-skill/package.js --platforms core` ×2 | 0 / 0 | core-only 53 文件；两次 checksums 逐字节一致 |
| `node tools/ai-skill/tests/dist-package.test.js --platforms core` | 0 | 32/32 |
| `node tools/ai-skill/ci/release-gate.js` | 0 | core-only candidate validated |
| `node tools/ai-skill/ci/check-native-layers.js --plan …` | 0 | 登记通过；平台证据 external-owned（不判死） |
| `node tools/ai-skill/package.js`（默认 full，无平台仓） | 1 | 明确提示平台来源缺失 + checkout / `--*-root` / `--platforms core` |

单仓 + 显式平台根（模拟 CI full）：`package.js --platforms core,ios,android --ios-root … --android-root …` 生成四包；dist-package 119/119；L2 `--strict-evidence` 全部指针解析。

## 5. 历史发现：M0 manifest schema 的 dirty→snapshot 约束（已修复，保留记录）

- 原现象（2026-11-21）：`allOf[0].if` 只检查 ios/android，遗漏 wisdomdesign，且条件分支缺 `required`。
- 现状：schema 三个仓库分支均含 `required:["dirty"]`；`sources.repositories.required` 在 R12 放宽为 `wisdomdesign`（平台包仍要求各自仓状态），Core-only 不再需要伪造平台 commit。`contract-selftest` 与 m4-ci 的 `dirty-*-release` 用例均通过。

## 6. 最终产物哈希（workspace full 打包，两次一致）

| 产物 | SHA-256 |
| --- | --- |
| checksums.json | `71014646857f25865d9dfe6988fd2dda7e9c3c40ef80ed29d4ed0d32f5ff5293` |
| wisdom-page-core.zip | `836fc86cc58c4121ebfb190fe21c66e0c5603e383936c5126e5b6a79cfe5ba8a` |
| wisdom-page-ios.zip | `364c2647c35e1e2e3099303483934513344e891168304e303ad816208df13c4a` |
| wisdom-page-android.zip | `99e3db4be7eb7d9fb555376ecfb5a9ae410fbe68a3d74fe0872d365634d11eb2` |
| wisdom-page-all.zip | `85ff8a30bbe648856a685302c12d0c7a159ddec222aefdccee4780e5a6ff04de` |

## 7. 写入边界（R12 修订）

R8/R12 修改：`.github/workflows/ai-skill-ci.yml`、`tools/ai-skill/{cli.js,package.js,lib/manifest.js,lib/write-manifest.js,ci/*,tests/*,README.md}`、`ai/skill/manifest/manifest.schema.json`、`AIOptimize/{02-SKILL-BUILD-PIPELINE,04-M4-CI-Verification,04-M4-CI-Compatibility-Contract,FIXES-t8,FIXES-t12}.md` 与测试生成的 `tools/ai-skill/reports/m4-ci-result.json`。未修改设计真源、iOS / Android 平台源码或 API/ABI 基线；iOS 既有未提交修改保持隔离。
