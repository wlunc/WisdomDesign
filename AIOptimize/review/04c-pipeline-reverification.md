# R13 独立复验报告：单仓 CI 与文档修复（R12）

> 复核人：pipeline-reviewer（独立复验；非 R12 实现者）
> 复核时间：2026-11-22 11:20–11:35（Asia/Shanghai）
> 复核对象：R12 对 R9 findings 的修复——`tools/ai-skill/lib/manifest.js`、`package.js`、`cli.js`、`m4-ci`、`.github/workflows/ai-skill-ci.yml`、04/02/FIXES 文档；对照 iOS/Android Provider 证据。
> 只读边界：未修改实现、契约、平台源码或 API/ABI 基线；只新增本报告。`package.js` 与测试产生的生成物在临时副本或本机多仓工作区重跑；干净单仓复现在 `/tmp/r13-root`，不触碰真实平台仓。

## 0. 结论

**R13 verdict：pass（按任务 7 项验收）。**

- 标准单仓 checkout（无同级 iOS/android、无预生成 catalog/dist）现在可跑：`cli.js build/test/check`、`package.js --platforms core`、L0 `m4-ci`、L1 route、L2 non-strict、core-only `dist-package` / release-gate 全部通过；缺平台仓时 `package.js` 默认 full 以清晰 exit 1 提示三种修复方式。
- `catalogIds` 已改为从 `contracts/WD*.yaml` 取 37 组件；干净 checkout 无 catalog 时 `cli.js build` 可直接自举。
- `m4-ci` 死链审计单仓 0 dead（16 md / 47 internal / 6 cross-repo unverifiable）；三仓 workspace 269 md / 47 internal / 6 cross-repo / 0 dead；63/63 PASS；`dead-link-audit-not-empty` 用源文档下限，不再依赖生成 dist。
- 04 文档当前值（m4-ci 63、governance 23、fingerprint `c303ee83…`、269 md/47/6、dist-package 119、5 job）与 FIXES-t8 的 R12 注一致；04 终止哈希与当前 dist 一致。02 §4.3/§11/§12.1/§16 与实现一致（无 reports/、CLI 无 pack/verify-templates/evaluate）。
- 三仓 workspace：package.js 两次 checksums `71014646…` 一致；dist-package 119/119；L2 strict 7 层；release-gate 0；两套验收路径均通过。
- 平台源码/API/ABI 零改动：iOS/android HEAD 未变；API/ABI 工作区 SHA-256 等于 HEAD blob；tracked diff 仅 iOS 既有 `.gitignore`。

**附 4 项非阻断剩余项**（详见第 8 节）：其中 **full CI 模式（显式平台仓）下 workflow 的 `cli.js check` 会失败**，启用 full 模式前必须修复；core-only 标准单仓、三仓 workspace 与任务 7 项验收不受影响。

## 1. 关键命令与退出码

### 1.1 本机三仓 workspace（E1）

| 命令 | 退出码 | 结果 |
| --- | --- | --- |
| `node tools/ai-skill/tests/dist-package.test.js` | 0 | 119 PASS / 0 FAIL |
| `node tools/ai-skill/tests/m4-ci.test.js` | 0 | 63 PASS / 0 FAIL；269 md / 47 internal / 6 cross-repo / 0 dead；fingerprint `c303ee83…` |
| `node tools/ai-skill/tests/contract-selftest.js` | 0 | 25 PASS |
| `node tools/ai-skill/tests/governance-selftest.js` | 0 | 23 PASS |
| `node tools/ai-skill/cli.js test` | 0 | M0 25 + catalog 8 + runtime 12 + build 11 |
| `node tools/ai-skill/cli.js check` | 0 | 52 files match reproducible rebuild |
| `node tools/ai-skill/package.js` ×2 | 0 / 0 | 四包 53/98/80/125；checksums 两次逐字节一致 `71014646…` |
| `node tools/ai-skill/ci/release-gate.js` | 0 | 四包 candidate validated |
| `node tools/ai-skill/ci/check-native-layers.js --plan <7> --strict-evidence` | 0 | 7 层登记，iOS/android evidence pointer 全部解析 |
| `node tools/ai-skill/eval/run.js --check-readiness` | 2 | 5 blockers（预期） |
| `node tools/ai-skill/eval/run.selftest.js`（/tmp） | 0 | 16 PASS |
| `ruby tools/contracts-check.rb` / `bash tools/token-build/selftest.sh` | 0 / 0 | 37 组件 / 26 PASS |

### 1.2 干净单仓 checkout（/tmp，无同级 iOS/android、无生成 catalog/dist）

| 命令 | 退出码 | 结果 |
| --- | --- | --- |
| `node tools/ai-skill/tests/m4-ci.test.js` | 0 | 63 PASS；16 md / 47 internal / 6 cross-repo（unverifiable）/ 0 dead |
| `node tools/ai-skill/tests/contract-selftest.js` | 0 | 25 PASS |
| `node tools/ai-skill/tests/governance-selftest.js` | 0 | 23 PASS |
| `node tools/ai-skill/cli.js test` | 0 | 25 + 8 + 12 + 11 全过；runtime 源码布局按需生成 catalog |
| `node tools/ai-skill/cli.js build`（无 catalog） | 0 | 52 files，manifest schema-valid |
| `node tools/ai-skill/cli.js check` | 0 | 52 files match |
| `node tools/ai-skill/package.js --platforms core` ×2 | 0 / 0 | 53 files；两次 checksums 一致 |
| `node tools/ai-skill/tests/dist-package.test.js --platforms core` | 0 | 32/32 |
| `node tools/ai-skill/ci/release-gate.js` | 0 | core-only candidate validated |
| `node tools/ai-skill/ci/check-native-layers.js --plan <native>`（不强校验） | 0 | 平台仓缺失记为 external-owned；不判死 |
| `node tools/ai-skill/package.js`（默认 full） | 1 | 清晰提示：sibling checkout / `--ios-root` / `--platforms core` |
| `node tools/ai-skill/ci/route-changes.js --paths-file … --require-paths` | 0 | 生成范围计划；空列表 exit 2 |

## 2. 单仓可运行性与错误语义

- 平台来源解析：`manifest.js.resolveRepoRoot` 顺序为显式 `--ios-root/--android-root` → `WISDOMDESIGN_*_ROOT` → 同级目录；不存在返回 `null`，`repoState` 不执行 git、不伪造 commit（源码确认与实测一致）。
- Core 构建只依赖设计真源：`catalogIds()` 读 `contracts/WD*.yaml`（37）；干净 checkout 无 `ai/skill/core/catalog` 时 `cli.js build` 仍 exit 0，manifest 52 files。
- Core-only manifest：`sources.repositories` 仅 `wisdomdesign`，schema 0 错；平台包（workspace full）包含 `wisdomdesign/ios/android`，schema 0 错。
- 默认 full 缺平台仓错误（实测 stderr）：
  `platform source for 'ios' is not available: expected sibling directory '.../iOS'. Checkout the iOS repo there, pass --ios-root <dir>, set WISDOMDESIGN_IOS_ROOT, or run with --platforms core (Core package only).`
  该语义包含三种修复方式，exit 1，不静默降级。
- L1 route：`--paths-file --require-paths` 正常；空文件 exit 2（避免 PR 退化为 baseline）；L2 单仓 non-strict exit 0，并明确平台证据 external-owned。

## 3. m4-ci 死链审计（单仓 + workspace）

- 干净单仓：**16 md / 47 internal / 6 cross-repo / 6 unverifiable / 0 dead**；`dead-link-audit-not-empty` 通过（下限 ≥20 links、≥10 md）。
- workspace：**269 md / 47 internal / 6 cross-repo / 0 dead**；63/63 PASS。
- 跨仓分类：`../../iOS/...`、`../../android/...` 在平台仓存在时校验文件；单仓时记 cross-repo/unverifiable，不计死链；其它越界（`../../../etc/passwd`）判 escape/dead；对应 `dead-link-cross-repo-classification`、`dead-link-escape-rejected` 用例通过。
- 当前 04 文档写 269 md；任务清单写的“268 md”是过期数字；04/FIXES/实际 m4-ci 输出三者一致为 269（见第 6 节）。这不构成 R12 的不一致，但最终报告不应引用 268。

## 4. manifest 与 catalog 自举

- 干净 checkout 无 catalog：`cli.js build` 52 files、`check` 52 files、`cli.js test` 全过；`catalogIds` 从 `contracts/WD*.yaml` 取得 37 个 ID。
- 单仓 core-only `package.js`：53 files、schema 0 errors、`sources.repositories = [wisdomdesign]`；dist-package 32/32；release-gate 0。
- 三仓 workspace：四包 manifest schema 0 错；`dist-package` 119/119；checksums/文件哈希自洽（R8 的 F2 已保持修复）。
- 平台包仍包含各自仓状态；Core-only 不伪造平台 commit（符合 R12 设计）。

## 5. 三仓 workspace 打包与 release

- package.js 两次：checksums `71014646857f25865d9dfe6988fd2dda7e9c3c40ef80ed29d4ed0d32f5ff5293`；四 ZIP 哈希与 04 §6 文档一致（core `836fc8…`、ios `364c26…`、android `99e3db…`、all `85ff8a…`）。
- dist-package 119/119；release-gate 四包 candidate validated（workspace-snapshot；dirty=wisdomdesign,ios,android）。
- L2 strict：7 层登记；iOS/Android evidence JSON pointer 全部解析；不声明原生通过。
- 两次打包逐字节一致；source commit/contentHash 与当前 repoState 一致（R8 机制保留）。

## 6. 04 / FIXES / 02 文档一致性

- `04-M4-CI-Verification.md`：m4-ci **63**、governance **23**、fingerprint **`c303ee83e3f5dda86af1b9869d3c19d18f34cee04ae946a934c5f40e1680c0ab`**、死链 **269 md / 47 internal / 6 cross-repo**、dist-package **119**、**5 个 job**；终止哈希与当前 dist 一致（第 7 节）。
- `FIXES-t8.md` R12 注使用同一 fingerprint `c303ee83…`，并注明 R8 历史值 `2eef9f…` 仅作历史；FIXES-t12 记录 R12 终态；三者一致。
- `04-M4-CI-Compatibility-Contract.md` 写 **5 个 job**（L0/L1/L2/package-repro/L3），并明确 core-only 默认 / full 显式 checkout；与 workflow 一致。
- `02-SKILL-BUILD-PIPELINE.md` §4.3 与 dist 实际布局一致（无 reports/，含 build-info.json/files.json/checksums.json）；§11 CLI 为实际 `build/check/test + package.js + eval/run.js`，不再列 pack/verify-templates/evaluate；§12.1/§16 同步。
- 任务清单称 04 为 268 md，实际终态为 269（含 R12 新增 FIXES-t12）；04/FIXES/实际输出一致为 269。该差异是任务描述过期，不是 R12 不一致。

## 7. 平台源码 / API / ABI 零改动

- iOS HEAD `64539fe78d9a036a6e34cbfa01c72e4430c0e2b0`、android HEAD `3656d6ff8ae83cfd07166dd7fe85db489ef61110`，与 R12 声明一致；Android tracked diff 为空；iOS tracked diff 仅既有 `.gitignore`（非源码/API）。
- iOS `api/WisdomUI.api.json` 工作区 SHA-256 `1d3be9d703f9ea54710905a6d90db2e9ef7c05b55ab8d8f529c9b2843b725348` = HEAD blob；android `wisdom-ui/api/wisdom-ui.api` `06b240434600c9d5586bb676db562a83b18b5a1cd22e4c6a2597826670b4e984` = HEAD blob。
- 平台 Provider 目录为 t6/t10 交付的 untracked 内容；本次与 R12 未写入平台 tracked 源/API/ABI。

## 8. 非阻断剩余项 / 条件性阻断

1. **full CI 模式（显式平台仓）下 `cli.js check` 失败**：干净单仓执行
   `node tools/ai-skill/cli.js build --ios-root <ws>/iOS --android-root <ws>/android`（exit 0）后，
   `node tools/ai-skill/cli.js check` exit 1：`content differs from reproducible rebuild: build-info.json`。
   原因：`cli.js check` 忽略 `args.iosRoot/androidRoot`，重建时按 sibling 解析平台来源；显式根不在 sibling 时 build-info inputs/sources 不同。workflow `package-repro` full 分支会先 build roots 再 check（无 roots），因此 full 模式启用的 CI 会失败。
   **这是条件性阻断**：默认 core-only 单仓与三仓 workspace 验收不受影响；启用 full 模式前应让 `check` 传递 roots（`renderInto(rebuilt, …, repoRoots)`）或调整 workflow。任务清单第 1 项只要求 core-only 单仓，故本项不改变 R13 的 7 项 pass；若团队要把 full CI 也作为验收，按 needs_revision 处理。
2. **full 显式根下 core manifest 只记 wisdomdesign**：`package.js --platforms core,ios,android --ios-root … --android-root …` 四包成功，但 core 包 `sources.repositories=[wisdomdesign]`（平台包分别含 ios/android）。若发布需要 core 包也记录平台 provenance，需在 `write_manifest` 对 core 传 roots；当前 release-gate/dist-package 不检查该字段，属于 provenance 完整性而非功能阻断。
3. **任务清单的 268 md 与终态 269 不一致**；以实际 m4-ci/04/FIXES 的 269 为准。
4. **FIXES 内部链接旧值**：`FIXES-t12.md:59` 与 `FIXES-t8.md:31` 写 R12 后“44 internal”，当前 m4-ci/04 为 **47 internal + 6 cross-repo**（`FIXES-t8.md` R12 注也是 47）。这是 fix record 的过期计数（fingerprint/其他终态值均已刷新），低风险，最终报告不应引用 44。
5. **已知边界**：原生编译/快照/UI/真机未执行（iOS PTY blocked、Android blocked）；host-load 未执行；M5 真实评测未执行（5 blockers、observation-only）；平台包 evidenceRefs 仍为平台仓相对路径；iOS CI-INTEGRATION.md 机器路径以 `package-exemptions` 登记；跨机器确定性未验证。

## 9. 结论与建议

- **R13 验收 7 项：全部通过**（单仓 core-only、catalog 自举、死链审计、04/FIXES、02、三仓 L2/package/release、平台零改动）。
- 建议在启用 workflow full 模式前修复剩余项 1（`cli.js check` 传 roots）；如团队要求 full 也进入当前验收，应把 R13 改为 needs_revision 直至该步通过。
- 本报告没有把任何原生/宿主/M5 项写成通过；未改实现，仅新增本报告，生成物重跑见第 1 节。

## 10. 复跑入口

```bash
# 干净单仓 /tmp 复现（无 ../iOS ../android，无 catalog/dist）
node tools/ai-skill/tests/m4-ci.test.js
node tools/ai-skill/cli.js build
node tools/ai-skill/cli.js check
node tools/ai-skill/cli.js test
node tools/ai-skill/package.js --platforms core   # 两次
node tools/ai-skill/tests/dist-package.test.js --platforms core
node tools/ai-skill/ci/release-gate.js
node tools/ai-skill/package.js                    # 期望 exit 1，清晰提示

# 三仓 workspace
node tools/ai-skill/tests/dist-package.test.js       # 119
node tools/ai-skill/package.js                     # 两次一致 71014646…
node tools/ai-skill/ci/release-gate.js
node tools/ai-skill/ci/check-native-layers.js --plan <7-native> --strict-evidence
node tools/ai-skill/tests/m4-ci.test.js               # 63 / 269 / 47 / 6
```

> 本报告中的 PASS 只覆盖命令实际执行到的项目；原生/宿主/M5/发布批准未执行。full CI 模式的 `cli.js check` 剩余项已在第 8 节如实列出。
