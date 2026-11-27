# 宿主加载证据（DSH filesystem skill）

> 记录人：captain
> 日期：2026-11-27（Asia/Shanghai）
> 性质：M4 出口条件「干净环境可加载，查询与脚手架可运行」的 **真实执行记录**，不是自行声明的标记。

## 1. 目标宿主

| 项 | 值 |
| --- | --- |
| 宿主 | DeepSeek Harness（DSH）filesystem skill provider |
| 发现根 | `$DSH_HOME/skills`（本机 `/Users/chenweilun/.dsh/skills`） |
| 加载实现 | `packages/skill/skill-filesystem`（`user-dsh` 源） |
| 安装方式 | 目录复制：`dist/ai-skill/v1.0.0/wisdom-page-all` → `~/.dsh/skills/wisdom-page` |
| 安装包 | `wisdom-page-all`，125 文件，684 KB |
| contentHash | `c8d638d29b3410a06d94f36c528a2c9c3aa15b2e1dd9aa39c639556546eea89f` |
| 包状态 | `workspace-snapshot` / `experimental` |

## 2. 前置修复（否则宿主会静默忽略）

1. **`SKILL.md` 缺少 YAML frontmatter**：DSH 的 `parseSkillFile` 要求首行为 `---` 且必须含 `name` 与 `description`，否则 `skill file ignored: missing YAML frontmatter`。原模板以 HTML 注释开头，已改为 frontmatter 开头。
2. **`name` 必须 kebab-case**：`/^[a-z0-9]+(?:-[a-z0-9]+)*$/`，取 `wisdom-page`。
3. **常驻预算**：加入 frontmatter 后 Core 5,723 B、all 5,916 B，仍 < 6,000 B 上限。

## 3. 执行证据

### 3.1 宿主发现并加载

```text
skill(name="wisdom-page")
→ name: wisdom-page
→ provider: filesystem
→ resourceBase: { kind: "directory", path: "~/.dsh/skills/wisdom-page" }
→ content bytes: 5581
```

会话技能目录已出现 `wisdom-page`（与 office 系列并列），说明是宿主真实发现，不是脚本模拟。

### 3.2 包内 runtime 在安装路径可运行

```bash
node ~/.dsh/skills/wisdom-page/runtime/get-component.js --id WDButton --json
# exit 0, found=true, card=components/WDButton.md

node ~/.dsh/skills/wisdom-page/runtime/validate-spec.js \
  --file ~/.dsh/skills/wisdom-page/page-spec/examples/task-list.valid.json --json
# exit 0, valid=true, structureValid=true, semanticValid=true
```

### 3.3 包资源完整性

| 资源 | 存在 |
| --- | --- |
| `SKILL.md` | ✅（frontmatter + body） |
| `catalog/catalog.md` + 37 张语义卡 | ✅ |
| `page-spec/schema.json` + `examples/` | ✅ |
| `runtime/{get-component,validate-spec}.js` | ✅ 可执行 |
| `platforms/ios/` | ✅ 33 张 API 卡 + provider + 模板 |
| `platforms/android/` | ✅ 17 张 API 卡 + provider + 模板 |
| `manifest.json` / `files.json` / `build-info.json` | ✅ |

## 4. 未覆盖的宿主能力

- **未验证**：宿主是否会自动在对话中调用该 Skill（本次是显式 `skill()` 加载 + 手动运行 runtime）；
- **未验证**：其他宿主（Claude Code、Cursor 等）的安装格式兼容性；
- **未验证**：包体积对宿主启动时间的影响。

因此本记录支持：**DSH 可安装、可发现、可加载、runtime 可运行**；不支持“所有宿主通用”。

## 5. 复现步骤

```bash
# 1. 重新生成（仓库内）
cd wisdomdesign
node tools/ai-skill/cli.js build
node tools/ai-skill/package.js

# 2. 安装到 DSH 全局技能目录
mkdir -p ~/.dsh/skills
rm -rf ~/.dsh/skills/wisdom-page
cp -R dist/ai-skill/v1.0.0/wisdom-page-all ~/.dsh/skills/wisdom-page

# 3. 校验
head -5 ~/.dsh/skills/wisdom-page/SKILL.md   # 首行必须是 ---
node ~/.dsh/skills/wisdom-page/runtime/get-component.js --id WDButton --json
node ~/.dsh/skills/wisdom-page/runtime/validate-spec.js \
  --file ~/.dsh/skills/wisdom-page/page-spec/examples/task-list.valid.json
```

## 6. 2026-11-27 升级（证据刷新 + 卡覆盖 + 包内脚手架）

| 项 | 升级前 | 升级后 |
| --- | --- | --- |
| iOS API 卡 | 33 张，10/37 组件 | **79 张，36/37 组件**（仅 WDAssigneePicker 无卡） |
| 覆盖的 overlay 修饰符 | 无 | `View.wdSheet` / `wdAlert` / `wdActionSheet` / `wdToast` |
| UI 矩阵 | 5 状态 × 2 字体 = 10 组，曾 blocked | **5 状态 × 2 字体 × 2 外观 = 20 组，全部通过** |
| library gate | not-run | **通过**（400/400 测试、API 零 diff、覆盖率门槛） |
| 包内脚手架 | 无（需手工 cp） | `platforms/ios/tools/scaffold.js` |
| 快照状态 | stale（钉在 c3c32f3） | **current**（重钉到 ce8f39d，Xcode 27.2） |
| 安装包 | 125 文件 / 684 KB | **172 文件 / 900 KB** |

端点验证（安装路径下）：

```bash
node ~/.dsh/skills/wisdom-page/runtime/get-component.js --id WDCard --json   # exit 0
node ~/.dsh/skills/wisdom-page/runtime/validate-spec.js \
  --file ~/.dsh/skills/wisdom-page/page-spec/examples/task-list.valid.json   # exit 0
node ~/.dsh/skills/wisdom-page/platforms/ios/tools/scaffold.js \
  --page task-list --workspace /tmp/x --as ProfileScreen.swift               # exit 0
```

## 7. 体积精简（2026-11-27）

先纠正一个统计口径：`du -sh` 报 900 KB 是按 4 KB 块计 172 个小文件；**真实字节是 478 KB**。

精简后：

| 项 | 前 | 后 | 变化 |
|---|---|---|---|
| all 包真实字节 | 478,378 | **357,846** | −120,532 (−25%) |
| all 包文件数 | 172 | **166** | −6 |
| all 包 ZIP | — | 184,721 | — |
| core 包 | — | 199,761 / 53 文件 | — |
| ios 包 | — | 309,158 / 141 文件 | — |
| android 包 | — | 248,481 / 78 文件 | — |
| SKILL.md（常驻） | 5,924 | 5,924 | 不变 |

两项改动：

1. **构建工具不再进包**（−90,576 B）
   `api-cards/generate_api_cards.js`、`validate_provider.js`、`tools/validate-provider.js`、`tools/check-template.js` 是生成与校验脚本，消费侧从不执行。白名单式排除（`PROVIDER_EXCLUDE`），保留 `tools/scaffold.js`。
2. **语义卡来源追溯去重**（−18,756 B）
   原格式每条 sourceRef 占一行（单卡最多 20+ 行），而结论条目本身已带 `path:line`。改为按文件分组、行号逗号连接：`docs/specs/01-basic.md:1557,1559,1561,...`。

**未做**（需要你确认后才动）：

- `catalog/manifest.json`（26 KB）里的 `sources` 45 条哈希：审计用，运行时不读；
- `files.json`（19 KB）逐文件哈希：发布校验用；
- 语义卡正文（100 KB）：设计阶段需要完整反例，压缩会削弱判断依据。

确定性：连续三次 `package.js` 产出相同 `checksums.json`（`0983ead7…`）。

## 8. 包身份分离（2026-11-27）

### 问题

四个包文件名不同，但 `SKILL.md` 的 `name` 全是 `wisdom-page`。宿主按名字建索引：同名会互相覆盖或按 rank 竞争，且从名字看不出这个包能不能写 Swift 代码。

### 修复

身份集中在 `tools/ai-skill/cli.js` 的 `SKILL_IDENTITY`；`package.js` 用同一份模板重新渲染，而不是追加段落。

| 包 | name | 常驻字节 | 文件 |
| --- | --- | --- | --- |
| core | `wisdom-page-design` | 5,796 | 53 |
| ios | `wisdom-page-ios` | 5,908 | 141 |
| android | `wisdom-page-android` | 5,923 | 78 |
| all | `wisdom-page` | 5,959 | 166 |

模板新增 `{{SKILL_NAME}}` / `{{SKILL_DESCRIPTION}}` / `{{SKILL_SCOPE}}` 占位符，正文首行声明 `**This package: …**`，让「只有设计语义」与「能写 SwiftUI」在文本层面可分辨。

### 回归

新增 `build.test.js` 断言：frontmatter 存在、name 为 kebab-case、必须声明 scope、不得残留模板占位符。

### 实际安装

```bash
node tools/ai-skill/package.js --platforms core,ios
rm -rf ~/.dsh/skills/wisdom-page
cp -R dist/ai-skill/v1.0.0/wisdom-page-ios ~/.dsh/skills/wisdom-page-ios
```

结果：`wisdom-page-ios`（141 文件 / 304,921 B）被 DSH 发现并加载，`resourceBase` 指向 `~/.dsh/skills/wisdom-page-ios`。旧的同名 `wisdom-page` 已移除，避免两个包竞争同一 rank。

## 9. 卸载


```bash
rm -rf ~/.dsh/skills/wisdom-page
```
