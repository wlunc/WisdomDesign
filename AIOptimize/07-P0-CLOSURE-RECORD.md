# P0 推进记录（M0 出口 + full CI + Android 原生编译）

> 日期：2026-11-22（Asia/Shanghai）
> 范围：P0-1（M0 出口记录）、P0-2（full CI `cli.js check` roots）、P0-3（Android 原生编译尝试）。
> 性质：对 [06-COMPLETION-REPORT.md](06-COMPLETION-REPORT.md) 的补充进度记录；06 报告仍是其快照日期的独立复核结论，本记录不回溯修改它。

## 1. P0-1：M0 出口已记录（closed）

- 裁决：**M0 出口 PASS（带记录性保留项）**，由 captain 基于 R1 复核、R8 修复、R7/R9/R11/R13 复验记录；详见 [m0/EXIT-RECORD.md](../ai/skill/m0/EXIT-RECORD.md)。
- 状态变更：`CONTRACT-STATUS.md`、`m0/README.md`、`truth-source-map.json`、`evaluation/golden-matrix.json`、`evaluation/tasks.json`、`decisions/D1-D10.md` 由 `frozen-for-review` 更新为 `implementation-ready`；治理文件仍保持 `frozen-for-review`。
- 保留项：无单独 M0 专项复评；实现先于出口记录的历史时序不回写；schema-lite 不是完整 JSON Schema 实现。
- 证据：contract-selftest 25 PASS；cli test 11/11；Page Spec 正例 0/反例 1；dist-package 119/119；governance 23 PASS。

## 2. P0-2：full CI `cli.js check` 已修复（closed）

- 根因：`check()` 临时重建时未传 `--ios-root/--android-root`，与 full build 的 build-info 不一致；workflow 也未传 roots。
- 修复：`cli.js check` 传入 roots；workflow 的 check 传递 `steps.scope.outputs.roots`。
- 证据：full `build→check` rc=0；core-only `build→check` rc=0；m4-ci 63/63；workflow YAML OK。

## 3. P0-3：Android 原生编译已打通（partial）

### 3.1 组件仓修复

经用户授权，修复 Android HEAD `3656d6f` 的既有编译失败（不更新 ABI 基线）：

- `WDAvatarGeometry`：改用 `WDType.*.toTextStyle()`，删除不存在的 `foundation.typography.WDTextStyle` 构造；
- `WDAvatarValue`：sealed class 构造器改 private，新增 `EmptyValue` 替代直接实例化；
- `WDAvatar/WDBadge/WDButton`：Compose 1.11 `BasicText` 不再接受 `Color` 参数，颜色并入 `TextStyle`；
- `WDButton/WDIconButton`：移除已不存在的 `foundation.ripple`，`indication = null`（按下态仍由交互源采集；视觉 ripple 待设计确认）；
- `WDBadgeGeometry`：`when` 增加 `null` 分支；
- `WDCheckbox/WDSwitch`：`WDSemantics.join` 参数改为非空列表拼接；补齐 `semantics`/`graphicsLayer`/`offset` 导入；
- `WDTextField`：改用兼容的 String 版 `BasicTextField`，保留 `decorationBox`/`maxLines`/`visualTransformation`，字符上限在 `onValueChange` 截断；
- `WDCard`：移除失效的 drawscope 导入，`ASPECT_RATIO` 改 `val`，`Dp.Zero` 改 `0.dp`，按下色在 composable 外捕获，新增 `wdElevation` 按 `WDElevationSpec` 分层近似阴影；
- `WDTouchTarget`：移除失效 `roundToPx` 导入；`WDMotionScale`：`MotionDurationScale` 改 `androidx.compose.ui`；
- 模板 `TaskListScreen.kt`：`WDListRow` 导入改为 `...WDListRow.WDListRow`，图标 lambda 提取为 `TaskLeadingIcon`；
- 新增最小 `:demo`（application + activity-compose 1.8.2 + 模板 sourceSet），`settings.gradle.kts`/版本目录/根插件同步。

### 3.2 实测证据

| 检查 | 命令 | 结果 |
| --- | --- | --- |
| 库编译 | `gradle -g .gradle-t6-home -Pkotlin.compiler.execution.strategy=in-process --offline :wisdom-ui:compileDebugKotlin` | BUILD SUCCESSFUL，exit 0 |
| demo 编译 | 同上 `:demo:assembleDebug` | BUILD SUCCESSFUL，exit 0 |
| 模板静态 | `node android/ai/skill-provider/tools/check-template.js` | 22/22 PASS |
| API 基线 | `:wisdom-ui:apiCheck` | **failed**：基线本身缺失 A-11/A-13 组件 API（既有问题，未更新基线） |
| 单测 | `:wisdom-ui:testDebugUnitTest` | **blocked**：既有签名测试含非法 Kotlin 转义（`\.`/`\d` 等），非本次修复引入 |
| UI 矩阵 | 截图/字体/IME/返回/TalkBack | **blocked**：AVD `Pixel_3a_API_34_extension_level_7_arm64-v8a` 在沙箱内反复报 `snapshot operation ... pending`，无法启动；未取得截图或 UI 断言 |

### 3.3 结论

- **M3 从 blocked 提升为 partial**：native compile 与黄金模板消费方编译已打通；
- 仍未闭合：UI/截图矩阵（AVD 沙箱阻断）、fontScale、IME、返回、TalkBack、真机、ABI 基线更新；
- 平台仓现有未提交修改（`git status`：~15 个组件/foundation 文件 + `demo/` + 构建配置）需 Android 所有者 review 后提交；ABI 基线未改。

## 4. dist 已按最新 Provider 重建（确定性成立）

两次 `package.js` checksums 一致：`36087f133d09048d4e060ae0c9f65e3fda672d3bfee42ed532d48ca170a5e6e1`。

| 包 | ZIP SHA-256 | 文件数 |
| --- | --- | --- |
| core | `ed3e0ede6774ac6ba3d061e3e7ffc54dc38bad30933f87dd505dc431d6f0c7bb` | 53 |
| ios | `1b1d970c03c0987626f32480a5b64367c9e270c6cbafbd5002317e688f848087` | 98 |
| android | `131a1d9eb116b4459b9f0ea7b1ab0b5d74083792cbb8e12c6e2a4109fd9dfec7` | 80 |
| all | `0d5fd5a216ddebb6ccf165dbe5639816017cfbfd0fa19fbd5ba7b0ec65f23dc2` | 125 |

> 更早的 `71014646…`、`1f5274af…` 等哈希对应更早快照；当前有效哈希以本表与 `dist/ai-skill/v1.0.0/checksums.json` 为准。

## 5. 仍未完成的 P0

| 项 | 状态 | 需要的条件 |
| --- | --- | --- |
| P0-3 Android 原生闭环 | **paused（用户决定）** | native compile 已过；平台尚未完成，暂停继续 UI 矩阵/ABI/fontScale/TalkBack/IME；Provider 保持 experimental/规划态 |
| P0-4 iOS UI 矩阵/library gate | blocked | 非 PTY/sandbox 环境 |
| P0-5 宿主加载 | not-run | 确定目标 AI 宿主 |
| P0-6 M5 真实评测 | not-run | pin 模型/宿主/工具/预算 |

## 6. 脚本语言统一为 JavaScript（2026-11-22）

- 迁移完成：`package.py` → `package.js`；`extract-design.rb` → `extract-design.js`；iOS `validate_provider.py`/`generate_api_cards.py` → `.js`；AIStarter `copy_template.py` → `.js`。
- 新增零依赖 `lib/simple-yaml.js`（契约 YAML 子集）与 `lib/zip.js`（确定性 ZIP），替代 Python zipfile/PyYAML/Ruby Psych。
- 新增 AI Skill 流水线内已无 `.py/.rb`；原仓既有 `token-build`/PWA Node 工具与 `contracts-check.rb` 不在本次统一范围。
- 回归：`cli.js test` 11/11、contract 25、m4-ci 63、dist-package 119/119、iOS validator 33 卡、两次 full 打包 checksums 一致。

## 7. 结论

- P0-1/P0-2 已关闭；P0-3 的 native compile 前置阻断已解除，但 M3 仍未达到完整出口。
- 06 报告的裁决 **B（存在阻断项）仍成立**：M2/M3/M4/M5/M6 出口未全部闭合。
- 不可声明“计划任务完成/双端闭环已验证/M5 已评测/宿主可加载”；可声明的技术预览范围见 06 报告 §0.3。
