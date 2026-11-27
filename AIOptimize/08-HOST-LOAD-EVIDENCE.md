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

## 6. 卸载

```bash
rm -rf ~/.dsh/skills/wisdom-page
```
