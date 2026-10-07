#!/usr/bin/env node
/**
 * 设计令牌生成器（M0-2）
 *
 *   node tools/token-build/build.js                        生成并写入两端（默认全部 scheme）
 *   node tools/token-build/build.js --check                只校验产物与提交是否一致（CI 用；重跑零 diff）
 *   node tools/token-build/build.js --platforms=ios        只处理一端（两端并行迁移时免互相阻塞）
 *   node tools/token-build/build.js --schemes             显式要求全部 scheme（与默认同）
 *   node tools/token-build/build.js --schemes=light,dark  只产出指定 scheme 的每套常量
 *   node tools/token-build/build.js --emit-manifest        额外产出 dist/tokens.manifest.json（跨仓自证）
 *   node tools/token-build/build.js --platforms=none --emit-manifest   只产出设计仓 manifest，不碰两端
 *   node tools/token-build/build.js --help
 *
 * 输入：tokens/wisdom.tokens.json（DTCG；`$version` = 变更集标识）
 * 输出（**被选中**平台的生成物目录必须**已存在**，缺失即 exit 1 —— 生成器不代建、不代改名）：
 *   ../iOS/Sources/WisdomUI/Foundation/generated/{WDTokens.swift, WDTokensVersion.swift, WDColorSlots.swift}
 *   ../android/wisdom-ui/src/main/kotlin/io/github/wlunc/wisdom/foundation/generated/{WDTokens.kt, WDTokensVersion.kt}
 *   dist/tokens.manifest.json（--emit-manifest；设计仓自有产物）
 *
 * 本文件承担的自证与守卫（任一失败即非零退出，绝不静默）：
 *   ① banner（生成物第 3 行）`tokens v<version> · sha256:<sha12>` —— Android G7 / iOS U14 的解析源
 *   ② `WDTokensVersion`（version + sha256/sha12 + schemes + colorSlotCount）
 *   ③ 槽位计数断言 == 32（U12）；scheme 维度与 `semantic` 组键集合一致、槽位顺序跨 scheme 一致
 *   ④ 弹簧 canonical 校验：`motion.spring.*` 键集合必须恰为 {response, dampingRatio}；stiffness 由 μ 派生
 *   ⑤ M0-1 冻结值断言（行高单值键 / 触控双键 / duration.reduced / WDComponent 12 键 / state.* / letterSpacing）
 *   ⑥ 对比度断言（最不利口径：正文 4.5:1、禁用态 3:1）
 *   ⑦ 玻璃配对（B22）与 tint 配方（13-tint）守卫（沿用）
 *
 * 缺字段策略：**数值**缺字段/非法 → emit 0 并在 stderr 报警（不静默）；
 *   颜色是身份字段，缺/非法 → 直接失败（不置 0）。
 *
 * 幂等：`--check` 与写入模式共用同一份内存产物；重跑内容逐字节相同。
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "../..");
const OUT_ROOT = path.resolve(ROOT, "..");
const TOKENS = path.join(ROOT, "tokens/wisdom.tokens.json");

const GENERATOR = "wisdomdesign/tools/token-build/build.js";

/**
 * M0-2 起两端生成物目录统一为**小写** `generated/`：
 *   · android §3.1.2a / §7.1-M0-2：`foundation/generated/`（包名 `…foundation.generated`）
 *   · iOS：与生成器改造同批（t3 口径），`Foundation/generated/`
 * 旧的大写 `Generated/` 由各端「纯移动」迁移提交处理；**生成器不代建、不代改名**。
 */
const IOS_GENERATED = path.join(OUT_ROOT, "iOS/Sources/WisdomUI/Foundation/generated");
const ANDROID_GENERATED = path.join(
  OUT_ROOT,
  "android/wisdom-ui/src/main/kotlin/io/github/wlunc/wisdom/foundation/generated",
);
const ANDROID_PACKAGE = "io.github.wlunc.wisdom.foundation.generated";
const MANIFEST_OUT = path.join(ROOT, "dist/tokens.manifest.json");

/** 弹簧 canonical 的 μ（质量因子）；逐令牌锁 μ 时只改这里（token 描述里有同一口径）。 */
const SPRING_MU = 1.0;

/** U12 槽位数（M0-1 冻结）。 */
const COLOR_SLOT_COUNT = 32;

// ---------------------------------------------------------------- 输出与失败

const warnings = [];

/** 缺字段/非法数值：emit 0 并报警（不静默；同一条只报一次——两端产物共用同一次构造）。 */
function warn(message) {
  if (warnings.includes(message)) return;
  warnings.push(message);
  console.error(`! ${message}`);
}

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

// ---------------------------------------------------------------- 基础工具

/** #RGB / #RRGGBB / #RRGGBBAA -> {r,g,b,a} 0-255 */
function parseHex(value) {
  const hex = String(value).trim().replace(/^#/, "");
  if (![3, 6, 8].includes(hex.length)) throw new Error(`unsupported colour: ${value}`);
  const step = hex.length === 3 ? 1 : 2;
  const parts = [];
  for (let i = 0; i < hex.length; i += step) {
    const chunk = hex.slice(i, i + step);
    parts.push(parseInt(step === 1 ? chunk + chunk : chunk, 16));
  }
  const [r, g, b, a = 255] = parts;
  return { r, g, b, a };
}

const sw0 = (n) => n.toString(16).toUpperCase().padStart(2, "0");

/** Swift: 拆出 0xRRGGBB 与 alpha */
function swiftHex(value) {
  const { r, g, b, a } = parseHex(value);
  return { hex: `0x${[r, g, b].map(sw0).join("")}`, alpha: a / 255 };
}

/** Swift: 单值颜色表达式 */
function swiftColorSingle(value) {
  const { hex, alpha } = swiftHex(value);
  return alpha === 1 ? `Color(wd: ${hex})` : `Color(wd: ${hex}, alpha: ${alpha.toFixed(3)})`;
}

/** Swift: 浅深成对的颜色表达式 */
function swiftColorPair(lightValue, darkValue) {
  const l = swiftHex(lightValue);
  const d = swiftHex(darkValue);
  const la = l.alpha === 1 ? "" : `, lightAlpha: ${l.alpha.toFixed(3)}`;
  const da = d.alpha === 1 ? "" : `, darkAlpha: ${d.alpha.toFixed(3)}`;
  return `Color(wdLight: ${l.hex}${la}, dark: ${d.hex}${da})`;
}

/** Kotlin: Color(0xAARRGGBB) */
function kotlinColor(value) {
  const { r, g, b, a } = parseHex(value);
  return `Color(0x${[a, r, g, b].map(sw0).join("")})`;
}

const lowerFirst = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const upperFirst = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/** bg + canvas -> bgCanvas；status-soft + success -> statusSoftSuccess */
function camel(group, key) {
  return `${group} ${key}`
    .split(/[-_ ]/)
    .filter(Boolean)
    .map((part, i) => (i === 0 ? lowerFirst(part) : upperFirst(part)))
    .join("");
}

/** 数字字面量：原值直出（0.06 -> 0.06；98 -> 98） */
function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? String(n) : "0";
}

/** Kotlin Float 字面量：`0.06f` / `98f` */
function floatLit(value) {
  return `${num(value)}f`;
}

// ---------------------------------------------------------------- 缺字段读取

/** 数值字段：缺/非法 → 0 + 报警 */
function numField(obj, key, pathStr) {
  const raw = obj === undefined || obj === null ? undefined : obj[key];
  if (raw === undefined || raw === null) {
    warn(`缺字段 ${pathStr}.${key} → emit 0`);
    return 0;
  }
  const n = Number(raw);
  if (!Number.isFinite(n)) {
    warn(`非法字段 ${pathStr}.${key} = ${JSON.stringify(raw)} → emit 0`);
    return 0;
  }
  return n;
}

/** 颜色字段：缺/非法 → 失败（身份字段不允许静默置 0） */
function colorField(obj, key, pathStr) {
  const raw = obj === undefined || obj === null ? undefined : obj[key];
  return validateColor(raw, pathStr);
}

/** 颜色字面量校验（`#RGB`/`#RRGGBB`/`#RRGGBBAA`） */
function validateColor(raw, pathStr) {
  if (typeof raw !== "string" || !/^#?[0-9A-Fa-f]{3}([0-9A-Fa-f]{3}|[0-9A-Fa-f]{5})?$/.test(raw.trim())) {
    fail(`缺/非法颜色字段 ${pathStr} = ${JSON.stringify(raw)}（颜色是身份字段，不置 0；请补令牌）`);
  }
  return raw.trim();
}

/** "fontWeight": 600 -> Swift .semibold / Kotlin FontWeight.SemiBold */
const SWIFT_WEIGHT = { 400: ".regular", 500: ".medium", 600: ".semibold", 700: ".bold" };
const KOTLIN_WEIGHT = {
  400: "FontWeight.Normal",
  500: "FontWeight.Medium",
  600: "FontWeight.SemiBold",
  700: "FontWeight.Bold",
};

/** 字重：缺/非法 → 400（报警） */
function weightField(obj, pathStr) {
  const raw = obj === undefined || obj === null ? undefined : obj.fontWeight;
  if (raw === undefined || raw === null) {
    warn(`缺字段 ${pathStr}.fontWeight → 回落 400/regular`);
    return 400;
  }
  const n = Number(raw);
  if (!SWIFT_WEIGHT[n]) {
    warn(`非法字段 ${pathStr}.fontWeight = ${JSON.stringify(raw)} → 回落 400/regular`);
    return 400;
  }
  return n;
}

/** `$type` 逐级继承：dimension -> Dp/CGFloat，number -> Float/CGFloat，缺省按 dimension */
function typeAt(root, segments) {
  let node = root;
  let type;
  for (const seg of segments) {
    if (node === undefined || node === null) break;
    if (node.$type) type = node.$type;
    node = node[seg];
  }
  if (node && node.$type) type = node.$type;
  return type ?? "dimension";
}

/** linear-gradient(135deg,#A 0%,#B 100%) -> { angle, stops:[{hex,pos}] } */
function parseLinearGradient(value) {
  const body = value.slice(value.indexOf("(") + 1, value.lastIndexOf(")"));
  const parts = body.split(",").map((p) => p.trim());
  let angle = 180;
  if (/^-?\d+(\.\d+)?deg$/.test(parts[0])) angle = parseFloat(parts.shift());
  const stops = parts.map((p) => {
    const [hex, pos] = p.split(/\s+/);
    return { hex, pos: pos ? parseFloat(pos) : null };
  });
  stops.forEach((s, i) => {
    if (s.pos === null) s.pos = (i / Math.max(1, stops.length - 1)) * 100;
  });
  return { angle, stops };
}

/**
 * 汇总渐变定义（按全部 scheme 取，保证任何 `--schemes` 子集都能解析到明/暗方案）。
 * semantic.<scheme>.gradient 下的随 scheme 取值；顶层 gradient 下的各 scheme 同值。
 */
function collectGradients(t, schemes) {
  const out = [];
  const perScheme = {};
  for (const scheme of schemes) perScheme[scheme.name] = t.semantic[scheme.name].gradient ?? {};
  const first = perScheme[schemes[0].name];
  for (const [name, token] of Object.entries(first)) {
    if (name.startsWith("$")) continue;
    if (token === undefined || token.$value === undefined) {
      fail(`渐变 semantic.${schemes[0].name}.gradient.${name} 缺 $value（首套是各套的基准，不能缺）`);
    }
    const stops = {};
    for (const scheme of schemes) {
      const raw = perScheme[scheme.name][name];
      if (!raw || raw.$value === undefined) {
        warn(`缺字段 semantic.${scheme.name}.gradient.${name} → 该套用首套 stop 顶替`);
        stops[scheme.name] = parseLinearGradient(token.$value);
        continue;
      }
      stops[scheme.name] = parseLinearGradient(raw.$value);
    }
    const reference = stops[schemes[0].name].stops.length;
    for (const scheme of schemes) {
      if (stops[scheme.name].stops.length !== reference) {
        fail(`渐变 ${name} 的 stop 数量在 scheme ${scheme.name} 与 ${schemes[0].name} 之间不一致`);
      }
    }
    out.push({ name, angle: stops[schemes[0].name].angle, perScheme: stops });
  }
  for (const [name, token] of Object.entries(t.gradient)) {
    if (name.startsWith("$")) continue;
    const parsed = parseLinearGradient(token.$value);
    const stops = {};
    for (const scheme of schemes) stops[scheme.name] = parsed;
    out.push({ name, angle: parsed.angle, perScheme: stops });
  }
  return out;
}

/** 同一位置两端色值相同就用单值颜色，不同就用成对颜色 */
function swiftStopColor(lightHex, darkHex) {
  return lightHex.toUpperCase() === darkHex.toUpperCase()
    ? swiftColorSingle(lightHex)
    : swiftColorPair(lightHex, darkHex);
}

// ---------------------------------------------------------------- scheme 维度

/**
 * 读出 `schemes` 维度并校验（M0-1 冻结项）：
 *   ① 与 semantic 的子键集合一致（无悬空、无缺套）
 *   ② 每条含 {appearance, semantic, isDefault}，semantic 指向 semantic.<同名>
 *   ③ 恰一个 isDefault；scheme 名不得为 `default`（与生成常量 `WDColorValues.default` 冲突）
 */
function readSchemes(t) {
  const group = t.schemes ?? {};
  const names = Object.keys(group).filter((k) => !k.startsWith("$"));
  if (names.length === 0) fail("令牌缺少 schemes 维度（M0-1 冻结项）");
  const semanticNames = Object.keys(t.semantic).filter((k) => !k.startsWith("$"));
  const same = names.length === semanticNames.length && names.every((x) => semanticNames.includes(x));
  if (!same) {
    fail(`schemes 与 semantic 的键集合不一致：schemes=[${names}] semantic=[${semanticNames}]`);
  }
  const schemes = names.map((name) => {
    const meta = group[name].$value;
    if (!meta || typeof meta !== "object") fail(`schemes.${name} 缺少 $value 元数据`);
    if (meta.semantic !== `semantic.${name}`) fail(`schemes.${name}.semantic 必须指向 semantic.${name}`);
    if (meta.appearance !== "light" && meta.appearance !== "dark") {
      fail(`schemes.${name}.appearance 必须是 light / dark，实际 = ${JSON.stringify(meta.appearance)}`);
    }
    if (camel("", name) === "default") fail(`scheme 名 "${name}" 与生成常量 default 冲突，请改名`);
    return { name, appearance: meta.appearance, isDefault: meta.isDefault === true };
  });
  const defaults = schemes.filter((s) => s.isDefault);
  if (defaults.length !== 1) fail(`schemes 必须恰有一个 isDefault，实际 ${defaults.length} 个`);
  return schemes;
}

/** 解析 `--schemes` 选择；未知 scheme 名 → exit 1 */
function selectSchemes(all, requested) {
  if (requested === null) return all;
  const wanted = requested
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (wanted.length === 0) return all;
  const unknown = wanted.filter((name) => !all.some((s) => s.name === name));
  if (unknown.length > 0) {
    fail(`--schemes 含未知 scheme：${unknown.join(", ")}；已声明 = ${all.map((s) => s.name).join(", ")}`);
  }
  return all.filter((s) => wanted.includes(s.name));
}

// ---------------------------------------------------------------- 守卫

/**
 * B22 守卫：semantic 层的玻璃两档必须与 material 配方层逐位相同。
 * 玻璃一旦出现第二个数值来源，深浅两端就会各自漂移（见 docs/12-b22-glass.md）。
 * 要改玻璃，只改 material 配方层；要换配对，先在文档里重裁。
 */
function assertGlassPairing(t) {
  const surface = (theme, key) => t.semantic[theme].surface[key].$value;
  const pairs = [
    ["semantic.light.surface.glass", surface("light", "glass"), "material.regular.fillLight", t.material.regular.$value.fillLight],
    ["semantic.dark.surface.glass", surface("dark", "glass"), "material.regular.fillDark", t.material.regular.$value.fillDark],
    ["semantic.light.surface.glass-strong", surface("light", "glass-strong"), "material.thick.fillLight", t.material.thick.$value.fillLight],
    ["semantic.dark.surface.glass-strong", surface("dark", "glass-strong"), "material.thick.fillDark", t.material.thick.$value.fillDark],
  ];
  for (const [aName, a, bName, b] of pairs) {
    if (String(a).toUpperCase() !== String(b).toUpperCase()) {
      throw new Error(
        `B22 玻璃配对不一致：${aName} = ${a}，但 ${bName} = ${b}。\n` +
          `玻璃的数值真源是 material 配方层，semantic 层不得自持一套值（docs/12-b22-glass.md §3）。`,
      );
    }
  }
}

/**
 * tint 守卫：`surface.tint` 必须等于「品牌蓝 16% 叠在 surface.card 上」
 * （surface.card 自身先合成到 bg.canvas）。配方是唯一真源，hex 是算出来的结果。
 * 要调浓淡只改 TINT_PERCENT，然后重跑生成器（见 docs/13-tint.md）。
 */
function assertTintRecipe(t) {
  const BRAND = "#1677B3";
  const TINT_PERCENT = 0.16;
  const toHex = (rgb) => "#" + rgb.map((v) => v.toString(16).toUpperCase().padStart(2, "0")).join("");

  for (const theme of ["light", "dark"]) {
    const card = parseHex(t.semantic[theme].surface.card.$value);
    const canvas = parseHex(t.semantic[theme].bg.canvas.$value);
    // 中间量保持浮点，避免两次取整把结果推偏 1/255
    const cardAlpha = card.a / 255;
    const cardRgb = [card.r, card.g, card.b].map(
      (v, i) => v * cardAlpha + [canvas.r, canvas.g, canvas.b][i] * (1 - cardAlpha),
    );
    const brand = parseHex(BRAND);
    const expected = toHex(
      [brand.r, brand.g, brand.b].map((v, i) => Math.round(v * TINT_PERCENT + cardRgb[i] * (1 - TINT_PERCENT))),
    );
    const actual = String(t.semantic[theme].surface.tint.$value).toUpperCase().slice(0, 7);
    if (expected !== actual) {
      throw new Error(
        `tint 配方不成立：semantic.${theme}.surface.tint = ${actual}，\n` +
          `但按「品牌蓝 ${TINT_PERCENT * 100}% 叠 surface.card」应为 ${expected}（docs/13-tint.md §2）。`,
      );
    }
  }
}

/** 弹簧 canonical：`motion.spring.*` 的键集合必须恰为 {response, dampingRatio}（M0-1 / D6）。 */
function assertSpringKeys(t) {
  const springs = Object.entries(t.motion.spring).filter(([k]) => !k.startsWith("$"));
  if (springs.length === 0) throw new Error("motion.spring 为空：弹簧 canonical 缺失");
  for (const [name, token] of springs) {
    const keys = Object.keys(token.$value ?? {}).sort();
    if (keys.join(",") !== "dampingRatio,response") {
      throw new Error(
        `motion.spring.${name} 的键集合必须恰为 {response, dampingRatio}，实际 = {${keys.join(", ")}}。\n` +
          `stiffness 由 μ=${SPRING_MU} 派生（stiffness = μ·(2π/response)²），令牌里不得出现。`,
      );
    }
  }
}

/**
 * U12 槽位断言：每套 scheme 的非渐变叶子恰为 32；各套的**有序**槽位列表完全一致
 * （Swift 的命名参数必须按声明顺序给出，因此顺序也必须跨 scheme 相同）。
 */
function assertSlotCount(t, schemes) {
  const slots = (name) =>
    Object.entries(t.semantic[name])
      .filter(([g]) => !g.startsWith("$") && g !== "gradient")
      .flatMap(([g, group]) =>
        Object.entries(group)
          .filter(([k]) => !k.startsWith("$"))
          .map(([k]) => `${g}.${k}`),
      );
  const reference = slots(schemes[0].name);
  if (reference.length !== COLOR_SLOT_COUNT) {
    throw new Error(
      `U12 槽位计数断言失败：semantic.${schemes[0].name} 的非渐变叶子 = ${reference.length}，应为 ${COLOR_SLOT_COUNT}`,
    );
  }
  for (const scheme of schemes) {
    const actual = slots(scheme.name);
    if (actual.length !== COLOR_SLOT_COUNT) {
      throw new Error(`U12 槽位计数断言失败：semantic.${scheme.name} 的非渐变叶子 = ${actual.length}`);
    }
    if (actual.join(",") !== reference.join(",")) {
      throw new Error(
        `scheme ${scheme.name} 的槽位集合/顺序与 ${schemes[0].name} 不一致（顺序必须一致：Swift 命名参数按声明顺序传）`,
      );
    }
  }
  return reference;
}

/** M0-1 冻结值断言：键形与取值一旦二次变更，生成器先红（冻结窗口只开一次）。 */
function assertFrozenTokens(t) {
  const eq = (pathStr, actual, expected) => {
    if (String(actual) !== String(expected)) {
      throw new Error(
        `M0-1 冻结值被改动：${pathStr} = ${JSON.stringify(actual)}，应为 ${JSON.stringify(expected)}`,
      );
    }
  };
  if (typeof t.$version !== "string" || !/^\d+(\.\d+)*$/.test(t.$version)) {
    throw new Error(`tokens.$version 缺失或非点分数字（banner 正则要求 [\\d.]+）：${JSON.stringify(t.$version)}`);
  }
  eq("size.row-height.comfortable", t.size["row-height"].comfortable.$value, 60);
  eq("size.row-height.compact", t.size["row-height"].compact.$value, 44);
  eq("size.touch-target-min-ios", t.size["touch-target-min-ios"].$value, 44);
  eq("size.touch-target-min-android", t.size["touch-target-min-android"].$value, 48);
  if (t.size["touch-target-min"] !== undefined) {
    throw new Error("size.touch-target-min 是已删除的过渡单键（U8：一次性改名、不留过渡键）");
  }
  eq("motion.duration.reduced", t.motion.duration.reduced.$value, 150);
  eq("motion.component.press-overlay-alpha", t.motion.component["press-overlay-alpha"].$value, 0.06);
  eq("motion.component.layout-break-font-scale", t.motion.component["layout-break-font-scale"].$value, 1.3);
  const componentKeys = Object.keys(t.motion.component).filter((k) => !k.startsWith("$"));
  if (componentKeys.length !== 12) {
    throw new Error(`WDComponent 出口必须恰为 12 键（AR-61），motion.component 实际 ${componentKeys.length} 键`);
  }
  for (const key of componentKeys) {
    if (!COMPONENT_NAMES[key]) {
      throw new Error(`motion.component.${key} 没有出口名（新增键必须先冻结名表，见 COMPONENT_NAMES）`);
    }
  }
  eq("state.hover.brightness", t.state.hover.brightness.$value, 98);
  eq("state.pressed.brightness", t.state.pressed.brightness.$value, 96);
  eq("state.focus.ring-width", t.state.focus["ring-width"].$value, 3);
  eq("state.focus.ring-alpha", t.state.focus["ring-alpha"].$value, 32);
  eq("state.disabled.alpha", t.state.disabled.alpha.$value, 40);
  const stateLeaves = [];
  for (const [group, value] of Object.entries(t.state)) {
    if (group.startsWith("$")) continue;
    for (const key of Object.keys(value)) {
      if (!key.startsWith("$")) stateLeaves.push(`${group}.${key}`);
    }
  }
  const stateNames = Object.keys(STATE_NAMES);
  if (stateLeaves.join(",") !== stateNames.join(",")) {
    throw new Error(`state.* 叶子与出口名表不一致：state=[${stateLeaves}] 名表=[${stateNames}]（新增键先冻结出口名）`);
  }
  for (const [name, token] of Object.entries(t.typography)) {
    if (name.startsWith("$") || name === "family") continue;
    // 注：letterSpacing 的存在性**不**在此断言 —— 它正是「缺字段 emit 0（不静默）」的用例；
    // M0-1 冻结的是「只有 overline 非 0」，由令牌数据自证（生成器按缺字段回落 0 并报警）。
    if (token.$value === undefined) throw new Error(`typography.${name}.$value 缺失`);
  }
}

// ---------------------------------------------------------------- 对比度断言

const lin = (c) => {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
};
const relLum = (hex) => {
  const { r, g, b } = parseHex(hex);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};
const contrast = (a, b) => {
  const la = relLum(a);
  const lb = relLum(b);
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
};

/**
 * 对比度断言（最不利口径，DF-04）：正文 4.5:1、禁用态 3:1（不豁免）。
 * 背景集合 = 令牌里**不透明**的表面（alpha 表面如 surface.card / glass 由各自文档实算，不在此列）。
 */
function assertContrast(t, schemes) {
  const requirements = [
    ["text.primary", 4.5],
    ["text.secondary", 4.5],
    ["text.tertiary", 4.5],
    ["text.disabled", 3.0],
  ];
  const surfaces = ["bg.canvas", "bg.grouped", "surface.card-solid", "surface.card-sunken", "surface.tint"];
  const readSlot = (scheme, dotted) => {
    const [group, key] = dotted.split(".");
    const token = t.semantic[scheme][group]?.[key];
    if (!token || token.$value === undefined) fail(`对比度断言取不到 semantic.${scheme}.${dotted}`);
    return token.$value;
  };
  for (const scheme of schemes) {
    for (const [slot, floor] of requirements) {
      const fg = readSlot(scheme.name, slot);
      let worst = { ratio: Infinity, surface: null };
      for (const surface of surfaces) {
        const ratio = contrast(fg, readSlot(scheme.name, surface));
        if (ratio < worst.ratio) worst = { ratio, surface };
      }
      if (worst.ratio < floor) {
        throw new Error(
          `对比度断言失败：semantic.${scheme.name}.${slot} = ${fg} 在 ${worst.surface} 上仅 ${worst.ratio.toFixed(2)}:1，` +
            `低于 ${floor}:1（最不利口径 DF-04；禁用态色槽不豁免）`,
        );
      }
      console.log(
        `✓ 对比度 ${scheme.name}.${slot} = ${worst.ratio.toFixed(2)}:1（最不利 ${worst.surface}；下限 ${floor}:1）`,
      );
    }
  }
}

// ---------------------------------------------------------------- 产物骨架

function banner(comment) {
  return [
    `// 本文件由 ${GENERATOR} 生成，请勿手改。`,
    `// 修改请编辑 wisdomdesign/tokens/wisdom.tokens.json 后重新生成。`,
    `// tokens v${comment.version} · sha256:${comment.sha12}`,
    "",
  ];
}

/** 语义色叶子（排除 gradient 组）；顺序 = 令牌书写顺序，跨 scheme 一致（assertSlotCount 保证）。 */
function colorSlots(t, schemeName) {
  const out = [];
  for (const [group, value] of Object.entries(t.semantic[schemeName])) {
    if (group.startsWith("$") || group === "gradient") continue;
    for (const [key, token] of Object.entries(value)) {
      if (key.startsWith("$")) continue;
      out.push({ slot: `${group}.${key}`, name: camel(group, key), value: token.$value });
    }
  }
  return out;
}

/** size 叶子（按平台裁剪触控双键）；`$type: number` → 无单位（Float / CGFloat） */
function sizeLeaves(t, platform) {
  const out = [];
  const walk = (node, segments) => {
    for (const [key, value] of Object.entries(node)) {
      if (key.startsWith("$")) continue;
      const segs = [...segments, key];
      if (key.startsWith("touch-target-min-")) {
        // U8：每端只生成本端常量，名字统一为 touchTargetMin
        if (key !== `touch-target-min-${platform}`) continue;
        out.push({
          name: "touchTargetMin",
          value: numField(value, "$value", `size.${segs.join(".")}`),
          type: "dimension",
        });
        continue;
      }
      if (value && typeof value === "object" && "$value" in value) {
        out.push({
          name: camel("", segs.join(" ")),
          value: numField(value, "$value", `size.${segs.join(".")}`),
          type: typeAt(t.size, segs),
        });
      } else if (value && typeof value === "object" && Object.keys(value).some((k) => !k.startsWith("$"))) {
        walk(value, segs);
      } else if (value && typeof value === "object") {
        // 只剩 `$` 元数据的对象 = 缺 `$value` 的叶子：emit 0 并报警（不静默丢键）
        out.push({
          name: camel("", segs.join(" ")),
          value: numField(value, "$value", `size.${segs.join(".")}`),
          type: typeAt(t.size, segs),
        });
      }
    }
  };
  walk(t.size, []);
  return out;
}

/** motion.component -> WDComponent 出口名表（AR-61 的 12 键） */
const COMPONENT_NAMES = {
  "press-scale": ["pressScale", "Float"],
  "press-overlay-alpha": ["pressOverlayAlpha", "Float"],
  "checkbox-press": ["checkboxPressScale", "Float"],
  "checkbox-draw": ["checkboxDrawMillis", "Int"],
  "checkbox-glow": ["checkboxGlowMillis", "Int"],
  "switch-knob": ["switchKnobMillis", "Int"],
  "switch-track": ["switchTrackMillis", "Int"],
  "progress-easeout": ["progressEaseOutMillis", "Int"],
  "toast-in": ["toastInMillis", "Int"],
  "list-stagger": ["listStaggerMillis", "Int"],
  "skeleton-shimmer": ["skeletonShimmerMillis", "Int"],
  "layout-break-font-scale": ["layoutBreakFontScale", "Float"],
};

/** state.* -> WDState 出口名表 */
const STATE_NAMES = {
  "hover.brightness": ["hoverBrightness", "Float"],
  "pressed.brightness": ["pressedBrightness", "Float"],
  "focus.ring-width": ["focusRingWidth", "Dp"],
  "focus.ring-alpha": ["focusRingAlpha", "Float"],
  "disabled.alpha": ["disabledAlpha", "Float"],
};

// ---------------------------------------------------------------- Swift 产物

function buildSwiftTokens(t, ctx) {
  const L = [...banner(ctx), "import SwiftUI", ""];

  const light = t.semantic[ctx.lightScheme];
  const dark = t.semantic[ctx.darkScheme];
  L.push("/// 语义色。界面只允许引用这一层。");
  L.push(`/// 浅深成对：明色方案 = ${ctx.lightScheme}，暗色方案 = ${ctx.darkScheme}（schemes 维度）。`);
  L.push("public enum WDColor {");
  for (const { slot, name, value } of colorSlots(t, ctx.lightScheme)) {
    const [group, key] = slot.split(".");
    const lightValue = validateColor(value, `semantic.${ctx.lightScheme}.${slot}`);
    const darkValue = validateColor(dark[group]?.[key]?.$value, `semantic.${ctx.darkScheme}.${slot}`);
    L.push(`    public static let ${name} = ${swiftColorPair(lightValue, darkValue)}`);
  }
  L.push("");
  L.push("    /// 定稿色卡的十二个色，只作对照，界面不直接用。");
  L.push("    public enum Palette {");
  for (const [name, token] of Object.entries(t.color.named)) {
    if (name.startsWith("$")) continue;
    L.push(`        public static let ${camel("", name)} = ${swiftColorSingle(token.$value)}`);
  }
  L.push("    }");
  L.push("");
  L.push("    /// 由色卡派生、经验证对比度的填充与文字色。");
  L.push("    public enum Derived {");
  for (const [name, token] of Object.entries(t.color.derived)) {
    if (name.startsWith("$")) continue;
    L.push(`        public static let ${camel("", name)} = ${swiftColorSingle(token.$value)}`);
  }
  L.push("    }");
  L.push("");
  L.push("    /// 中性色阶。");
  L.push("    public enum Neutral {");
  for (const [name, token] of Object.entries(t.color.su)) {
    if (name.startsWith("$")) continue;
    L.push(`        public static let su${name} = ${swiftColorSingle(token.$value)}`);
  }
  L.push("    }");
  L.push("}");
  L.push("");

  // 渐变：SwiftUI 侧合并成一条「深浅成对」的渐变色，随外观自动解析
  L.push("/// 渐变。stop 本身是浅深成对的动态色，所以一条令牌即可覆盖两种外观。");
  L.push("/// 注：>2 套 scheme 的静态渐变色值随 M1 的主题类型扩展（M0-1 只冻结 light/dark）。");
  L.push("public enum WDGradient {");
  for (const g of collectGradients(t, ctx.allSchemes)) {
    L.push(`    public static let ${camel("", g.name)} = WDGradientSpec(`);
    L.push(`        angleDegrees: ${g.angle},`);
    L.push(`        stops: [`);
    const lightStops = g.perScheme[ctx.lightScheme].stops;
    const darkStops = g.perScheme[ctx.darkScheme].stops;
    lightStops.forEach((s, i) => {
      const darkStop = darkStops[i];
      L.push(
        `            (color: ${swiftStopColor(s.hex, darkStop.hex)}, location: ${(s.pos / 100).toFixed(2)})${i === lightStops.length - 1 ? "" : ","}`,
      );
    });
    L.push(`        ]`);
    L.push(`    )`);
  }
  L.push("}");
  L.push("");

  L.push("/// 间距，基准 4pt。");
  L.push("public enum WDSpacing {");
  for (const [k, v] of Object.entries(t.space)) {
    if (k.startsWith("$")) continue;
    L.push(`    public static let s${k}: CGFloat = ${numField(v, "$value", `space.${k}`)}`);
  }
  L.push("}");
  L.push("");

  L.push("/// 圆角阶梯。");
  L.push("public enum WDRadius {");
  for (const [k, v] of Object.entries(t.radius)) {
    if (k.startsWith("$")) continue;
    L.push(`    public static let ${camel("", k)}: CGFloat = ${numField(v, "$value", `radius.${k}`)}`);
  }
  L.push("}");
  L.push("");

  L.push("/// 组件尺寸。U8：触控只生成本端常量（iOS 44）。");
  L.push("public enum WDSize {");
  for (const leaf of sizeLeaves(t, "ios")) {
    L.push(`    public static let ${leaf.name}: CGFloat = ${num(leaf.value)}`);
  }
  L.push("}");
  L.push("");

  L.push("/// 字阶。size 与 lineHeight 分开给，行高比由设计决定，不交给系统默认。");
  L.push("/// WDTextStyle 由手写层提供（4 存储字段 + internal init，I-M0-h）；本文件只 emit 常量。");
  L.push("public enum WDType {");
  for (const [k, v] of Object.entries(t.typography)) {
    if (k.startsWith("$") || k === "family") continue;
    const path = `typography.${k}`;
    const size = numField(v.$value, "fontSize", path);
    const height = numField(v.$value, "lineHeight", path);
    const letterSpacing = numField(v.$value, "letterSpacing", path);
    const weight = SWIFT_WEIGHT[weightField(v.$value, path)];
    L.push(
      `    public static let ${camel("", k)} = WDTextStyle(size: ${size}, lineHeight: ${height}, weight: ${weight}, letterSpacing: ${letterSpacing})`,
    );
  }
  L.push("}");
  L.push("");

  L.push("/// 高度。每层阴影按顺序叠加，禁止单层重阴影。出口档位 e0/e1/e2/e3/brand。");
  L.push("public enum WDElevation {");
  for (const [k, v] of Object.entries(t.elevation)) {
    if (k.startsWith("$")) continue;
    const layers = (v.$value.layers || []).map((l) => {
      const color = colorField(l, "color", `elevation.${k}.layer(color=${l.color})`);
      return `        .init(x: ${numField(l, "x", `elevation.${k}`)}, y: ${numField(l, "y", `elevation.${k}`)}, blur: ${numField(l, "blur", `elevation.${k}`)}, color: ${swiftColorSingle(color)})`;
    });
    const name = k === "0" ? "e0" : k === "brand" ? "brand" : `e${k}`;
    L.push(`    public static let ${name}: [WDShadowLayer] = [`);
    L.push(...layers.map((l, i) => (i === layers.length - 1 ? l : `${l},`)));
    L.push("    ]");
  }
  L.push("}");
  L.push("");

  L.push("/// 动效。进场慢、出场快；位移越长时长越长。");
  L.push("/// 弹簧 canonical = response + dampingRatio；iOS 映射 SwiftUI 的 dampingFraction，**不生成 stiffness**。");
  L.push("public enum WDMotion {");
  L.push("    public enum Duration {");
  for (const [k, v] of Object.entries(t.motion.duration)) {
    if (k.startsWith("$")) continue;
    L.push(
      `        public static let ${camel("", k)}: Double = ${(numField(v, "$value", `motion.duration.${k}`) / 1000).toFixed(2)}`,
    );
  }
  L.push("    }");
  L.push("");
  L.push("    public enum Spring {");
  for (const [k, v] of Object.entries(t.motion.spring)) {
    if (k.startsWith("$")) continue;
    const response = numField(v.$value, "response", `motion.spring.${k}`);
    const damping = numField(v.$value, "dampingRatio", `motion.spring.${k}`);
    L.push(
      `        public static let ${camel("", k)} = Animation.spring(response: ${response}, dampingFraction: ${damping})`,
    );
  }
  L.push("    }");
  L.push("}");
  L.push("");

  L.push("/// 交互状态视觉值（U6 / F45）。百分数按 0–100 原样给，使用时除 100；ring-width 单位 pt。");
  L.push("public enum WDState {");
  for (const [key] of Object.entries(STATE_NAMES)) {
    const [group, leaf] = key.split(".");
    const value = numField(t.state?.[group]?.[leaf], "$value", `state.${key}`);
    L.push(`    public static let ${camel(group, leaf)}: CGFloat = ${num(value)}`);
  }
  L.push("}");

  return `${L.join("\n")}\n`;
}

function buildSwiftColorSlots(t, ctx) {
  const L = [
    ...banner(ctx),
    "import SwiftUI",
    "",
    `/// 语义色槽位（U12 = ${ctx.slotCount} 个，含 \`text.disabled\`）· 每套 scheme 一组值（M0-1 \`schemes\` 维度）。`,
    "///",
    "/// 手写层契约（I-M0-h，`Foundation/Theme/WDColorValues.swift`）：",
    "///   ① `WDColorValues` 提供 `internal init(<以下命名参数，顺序与本文件一致>)`；",
    "///   ② `WDColorSlot.allCases` 的 case 顺序与本文件槽位顺序一致（计数断言 = 生成器 `--check`）；",
    "///   ③ `public init(_ patch: WDColorOverrides)` 的缺省值取 `WDColorValues.default`。",
    "extension WDColorValues {",
    `    /// 已生成的 scheme 清单（M0-1 schemes 维度；运行时只能在这些 scheme 之间切换）。`,
    `    public static let wdSchemeNames: [String] = [${ctx.schemes.map((s) => `"${s.name}"`).join(", ")}]`,
    `    /// 默认 scheme（schemes.<name>.isDefault == true）。`,
    `    public static let wdDefaultScheme: String = "${ctx.defaultScheme}"`,
    "",
  ];
  for (const scheme of ctx.schemes) {
    const values = colorSlots(t, scheme.name).map(({ slot, name, value }) => ({
      name,
      value: validateColor(value, `semantic.${scheme.name}.${slot}`),
    }));
    L.push(`    /// scheme \`${scheme.name}\`（appearance = ${scheme.appearance}）的 ${values.length} 个槽位值。`);
    L.push(`    public static let ${camel("", scheme.name)}: WDColorValues = WDColorValues(`);
    values.forEach(({ name, value }, i) => {
      L.push(`        ${name}: ${swiftColorSingle(value)}${i === values.length - 1 ? "" : ","}`);
    });
    L.push("    )");
    L.push("");
  }
  L.push(`    /// 默认主题槽位值（= \`${ctx.defaultScheme}\`）。`);
  L.push(`    public static let \`default\`: WDColorValues = ${camel("", ctx.defaultScheme)}`);
  L.push("}");
  return `${L.join("\n")}\n`;
}

function buildSwiftVersion(t, ctx) {
  const L = [
    ...banner(ctx),
    "",
    "/// 令牌变更集自证（G7 / U14）：banner（生成物第 3 行）与 dist/tokens.manifest.json 同值。",
    "/// `sha256` = 令牌源文件（tokens/wisdom.tokens.json）字节的 SHA-256；`sha12` = 其前 12 位。",
    "/// iOS SPEC §1.5.4 写的 `WDTokensVersion.hash` 即本文件的 `sha12`（同一值的文档别名）。",
    "public enum WDTokensVersion {",
    `    public static let version: String = "${ctx.version}"`,
    `    public static let sha256: String = "${ctx.sha256}"`,
    `    public static let sha12: String = "${ctx.sha12}"`,
    "    /// 已生成的 scheme 清单（M0-1 schemes 维度）。",
    `    public static let schemes: [String] = [${ctx.schemes.map((s) => `"${s.name}"`).join(", ")}]`,
    "    /// 默认 scheme（schemes.<name>.isDefault == true）。",
    `    public static let defaultScheme: String = "${ctx.defaultScheme}"`,
    "    /// U12 语义色槽位数（生成器 --check 断言 == 32）。",
    `    public static let colorSlotCount: Int = ${ctx.slotCount}`,
    "}",
  ];
  return `${L.join("\n")}\n`;
}

// ---------------------------------------------------------------- Kotlin 产物

function buildKotlinTokens(t, ctx) {
  const slotNames = colorSlots(t, ctx.schemes[0].name).map((s) => s.name);
  const L = [...banner(ctx), `package ${ANDROID_PACKAGE}`, ""];
  L.push("import androidx.compose.animation.core.SpringSpec");
  L.push("import androidx.compose.animation.core.spring");
  L.push("import androidx.compose.runtime.Immutable");
  L.push("import androidx.compose.ui.graphics.Color");
  L.push("import androidx.compose.ui.text.font.FontWeight");
  L.push("import androidx.compose.ui.unit.Dp");
  L.push("import androidx.compose.ui.unit.TextUnit");
  L.push("import androidx.compose.ui.unit.dp");
  L.push("import androidx.compose.ui.unit.sp");
  L.push("");

  L.push(`/** 语义色。界面只允许引用这一层。U12 = ${ctx.slotCount} 槽位。 */`);
  // 不用 data class：32 个属性会顺带暴露 copy() 与 componentN()，不是我们想承诺的 API
  L.push("@Immutable");
  L.push("public class WDColors internal constructor(");
  slotNames.forEach((name) => L.push(`    public val ${name}: Color,`));
  L.push(")");
  L.push("");

  for (const scheme of ctx.schemes) {
    const values = colorSlots(t, scheme.name);
    L.push(`/** scheme ${scheme.name}（appearance = ${scheme.appearance}）。 */`);
    L.push(`internal val wd${upperFirst(camel("", scheme.name))}Colors: WDColors = WDColors(`);
    values.forEach(({ slot, name, value }) => {
      L.push(`    ${name} = ${kotlinColor(validateColor(value, `semantic.${scheme.name}.${slot}`))},`);
    });
    L.push(")");
    L.push("");
  }

  L.push("/** 定稿色卡的十二个色，只作对照，界面不直接用。 */");
  L.push("public object WDPalette {");
  for (const [name, token] of Object.entries(t.color.named)) {
    if (name.startsWith("$")) continue;
    L.push(`    public val ${camel("", name)}: Color = ${kotlinColor(token.$value)}`);
  }
  L.push("}");
  L.push("");

  L.push("/** 由色卡派生、经验证对比度的填充与文字色。 */");
  L.push("public object WDDerived {");
  for (const [name, token] of Object.entries(t.color.derived)) {
    if (name.startsWith("$")) continue;
    L.push(`    public val ${camel("", name)}: Color = ${kotlinColor(token.$value)}`);
  }
  L.push("}");
  L.push("");

  L.push("/** 中性色阶。 */");
  L.push("public object WDNeutral {");
  for (const [name, token] of Object.entries(t.color.su)) {
    if (name.startsWith("$")) continue;
    L.push(`    public val su${name}: Color = ${kotlinColor(token.$value)}`);
  }
  L.push("}");
  L.push("");

  // 渐变（F33：WDGradientSpec 保留公开构造器）
  L.push("/** 渐变。用 stops 描述，角度沿用 CSS 口径。F33：WDGradientSpec 保留公开构造器。 */");
  L.push("@Immutable");
  L.push("public class WDGradientSpec(");
  L.push("    public val angleDegrees: Float,");
  L.push("    public val stops: List<Pair<Color, Float>>,");
  L.push(")");
  L.push("");

  const gradients = collectGradients(t, ctx.allSchemes);
  L.push("/** 当前主题下的全部渐变。Compose 不做浅深自动解析，所以每套 scheme 各出一套。 */");
  L.push("@Immutable");
  L.push("public class WDGradients internal constructor(");
  gradients.forEach((g) => L.push(`    public val ${camel("", g.name)}: WDGradientSpec,`));
  L.push(")");
  L.push("");

  for (const scheme of ctx.schemes) {
    L.push(`/** scheme ${scheme.name} 的渐变。 */`);
    L.push(`internal val wd${upperFirst(camel("", scheme.name))}Gradients: WDGradients = WDGradients(`);
    gradients.forEach((g) => {
      const stops = g.perScheme[scheme.name].stops
        .map((s) => `${kotlinColor(s.hex)} to ${(s.pos / 100).toFixed(2)}f`)
        .join(", ");
      L.push(`    ${camel("", g.name)} = WDGradientSpec(${g.angle}f, listOf(${stops})),`);
    });
    L.push(")");
    L.push("");
  }

  L.push("/** 间距，基准 4dp。 */");
  L.push("public object WDSpacing {");
  for (const [k, v] of Object.entries(t.space)) {
    if (k.startsWith("$")) continue;
    L.push(`    public val s${k}: Dp = ${numField(v, "$value", `space.${k}`)}.dp`);
  }
  L.push("}");
  L.push("");

  L.push("/** 圆角阶梯。 */");
  L.push("public object WDRadius {");
  for (const [k, v] of Object.entries(t.radius)) {
    if (k.startsWith("$")) continue;
    L.push(`    public val ${camel("", k)}: Dp = ${numField(v, "$value", `radius.${k}`)}.dp`);
  }
  L.push("}");
  L.push("");

  L.push("/** 组件尺寸。U8：触控只生成本端常量（Android 48）；`$type: number` 的键无单位（Float）。 */");
  L.push("public object WDSize {");
  for (const leaf of sizeLeaves(t, "android")) {
    if (leaf.type === "number") {
      L.push(`    public val ${leaf.name}: Float = ${floatLit(leaf.value)}`);
    } else {
      L.push(`    public val ${leaf.name}: Dp = ${num(leaf.value)}.dp`);
    }
  }
  L.push("}");
  L.push("");

  L.push("/** 字阶。size 与 lineHeight 分开给，行高比由设计决定，不交给系统默认。 */");
  L.push("@Immutable");
  L.push("public class WDTextStyle internal constructor(");
  L.push("    public val size: TextUnit,");
  L.push("    public val lineHeight: TextUnit,");
  L.push("    public val weight: FontWeight,");
  L.push("    public val letterSpacing: TextUnit,");
  L.push(") {");
  L.push("    /** 派生只读：真源是绝对行盒高，比值不单独存令牌（TYP-1）。 */");
  L.push("    public val lineHeightRatio: Float get() = if (size.value == 0f) 0f else lineHeight.value / size.value");
  L.push("");
  L.push("    override fun equals(other: Any?): Boolean =");
  L.push("        other is WDTextStyle &&");
  L.push("            other.size == size &&");
  L.push("            other.lineHeight == lineHeight &&");
  L.push("            other.weight == weight &&");
  L.push("            other.letterSpacing == letterSpacing");
  L.push("");
  L.push("    override fun hashCode(): Int {");
  L.push("        var result = size.hashCode()");
  L.push("        result = 31 * result + lineHeight.hashCode()");
  L.push("        result = 31 * result + weight.hashCode()");
  L.push("        result = 31 * result + letterSpacing.hashCode()");
  L.push("        return result");
  L.push("    }");
  L.push("");
  L.push("    override fun toString(): String =");
  L.push(
    '        "WDTextStyle(size=$size, lineHeight=$lineHeight, weight=$weight, letterSpacing=$letterSpacing)"',
  );
  L.push("}");
  L.push("");
  L.push("public object WDType {");
  for (const [k, v] of Object.entries(t.typography)) {
    if (k.startsWith("$") || k === "family") continue;
    const path = `typography.${k}`;
    const size = numField(v.$value, "fontSize", path);
    const height = numField(v.$value, "lineHeight", path);
    const letterSpacing = numField(v.$value, "letterSpacing", path);
    const weight = KOTLIN_WEIGHT[weightField(v.$value, path)];
    L.push(
      `    public val ${camel("", k)}: WDTextStyle = WDTextStyle(${size}.sp, ${height}.sp, ${weight}, ${letterSpacing}.sp)`,
    );
  }
  L.push("}");
  L.push("");

  // 阴影出口（AR-74 / LR-19 / LR-27）
  L.push("/** 高度。每层阴影按顺序叠加，禁止单层重阴影。出口档位 level0…level3 + brand（近似映射见 F43）。 */");
  L.push("@Immutable");
  L.push("public class WDElevationLayer internal constructor(");
  L.push("    public val x: Dp,");
  L.push("    public val y: Dp,");
  L.push("    public val blur: Dp,");
  L.push("    public val color: Color,");
  L.push(")");
  L.push("");
  L.push("@Immutable");
  L.push("public class WDElevationSpec internal constructor(");
  L.push("    public val layers: List<WDElevationLayer>,");
  L.push(")");
  L.push("");
  L.push("public object WDElevation {");
  for (const [k, v] of Object.entries(t.elevation)) {
    if (k.startsWith("$")) continue;
    const name = k === "brand" ? "brand" : `level${k}`;
    const layers = (v.$value.layers || []).map((l) => {
      const color = colorField(l, "color", `elevation.${k}.layer(color=${l.color})`);
      return `WDElevationLayer(${numField(l, "x", `elevation.${k}`)}.dp, ${numField(l, "y", `elevation.${k}`)}.dp, ${numField(l, "blur", `elevation.${k}`)}.dp, ${kotlinColor(color)})`;
    });
    if (layers.length === 0) {
      L.push(`    public val ${name}: WDElevationSpec = WDElevationSpec(emptyList())`);
    } else {
      L.push(`    public val ${name}: WDElevationSpec = WDElevationSpec(`);
      L.push("        listOf(");
      layers.forEach((layer, i) => L.push(`            ${layer}${i === layers.length - 1 ? "" : ","}`));
      L.push("        ),");
      L.push("    )");
    }
  }
  L.push("}");
  L.push("");

  // 组件私有描画/节奏参数（AR-61：12 键出口）
  L.push("/** 组件私有描画/节奏参数。12 键（AR-61）；交互动效时长在 WDMotion，禁止互相搬运。 */");
  L.push("public object WDComponent {");
  for (const [key, token] of Object.entries(t.motion.component)) {
    if (key.startsWith("$")) continue;
    const entry = COMPONENT_NAMES[key];
    if (!entry) fail(`motion.component.${key} 没有出口名（WDComponent 12 键名表未覆盖）`);
    const [name, type] = entry;
    const value = numField(token, "$value", `motion.component.${key}`);
    L.push(`    public val ${name}: ${type} = ${type === "Int" ? num(value) : floatLit(value)}`);
  }
  L.push("}");
  L.push("");

  L.push("/** 动效。进场慢、出场快；位移越长时长越长。 */");
  L.push(
    `/** 弹簧 canonical = response + dampingRatio；stiffness 由 μ = ${SPRING_MU} 派生：stiffness = μ·(2π/response)²。 */`,
  );
  L.push("public object WDMotion {");
  for (const [k, v] of Object.entries(t.motion.duration)) {
    if (k.startsWith("$")) continue;
    L.push(`    public val duration${upperFirst(k)}: Int = ${numField(v, "$value", `motion.duration.${k}`)}`);
  }
  L.push("");
  for (const [k, v] of Object.entries(t.motion.spring)) {
    if (k.startsWith("$")) continue;
    const response = numField(v.$value, "response", `motion.spring.${k}`);
    const damping = numField(v.$value, "dampingRatio", `motion.spring.${k}`);
    let stiffness = 0;
    if (response > 0) {
      stiffness = SPRING_MU * Math.pow((2 * Math.PI) / response, 2);
    } else {
      warn(`motion.spring.${k}.response 非法（${response}）→ stiffness emit 0`);
    }
    L.push(
      `    public val spring${upperFirst(k)}: SpringSpec<Float> = spring<Float>(dampingRatio = ${floatLit(damping)}, stiffness = ${stiffness.toFixed(2)}f)`,
    );
  }
  L.push("}");
  L.push("");

  L.push("/** 交互状态视觉值（U6 / F45）。百分数按 0–100 原样给，使用时除 100。 */");
  L.push("public object WDState {");
  for (const [key, entry] of Object.entries(STATE_NAMES)) {
    const [group, leaf] = key.split(".");
    const [name, type] = entry;
    const value = numField(t.state?.[group]?.[leaf], "$value", `state.${key}`);
    L.push(`    public val ${name}: ${type} = ${type === "Dp" ? `${num(value)}.dp` : floatLit(value)}`);
  }
  L.push("}");

  return `${L.join("\n")}\n`;
}

function buildKotlinVersion(t, ctx) {
  const L = [
    ...banner(ctx),
    `package ${ANDROID_PACKAGE}`,
    "",
    "/** 令牌变更集自证（G7 / U14）：banner（生成物第 3 行）与 dist/tokens.manifest.json 同值。 */",
    "/** `sha256` = banner 里的 12 位前缀（= 令牌源文件 SHA-256 前 12 位）；G7 断言它 == banner hash。 */",
    "public object WDTokensVersion {",
    `    public val version: String = "${ctx.version}"`,
    `    public val sha256: String = "${ctx.sha12}"`,
    "    /** 已生成的 scheme 清单（M0-1 schemes 维度）。 */",
    `    public val schemes: List<String> = listOf(${ctx.schemes.map((s) => `"${s.name}"`).join(", ")})`,
    "    /** 默认 scheme（schemes.<name>.isDefault == true）。 */",
    `    public val defaultScheme: String = "${ctx.defaultScheme}"`,
    "    /** U12 语义色槽位数（生成器 --check 断言 == 32）。 */",
    `    public val colorSlotCount: Int = ${ctx.slotCount}`,
    "}",
  ];
  return `${L.join("\n")}\n`;
}

// ---------------------------------------------------------------- 主流程

function parseArgs(argv) {
  const options = { check: false, emitManifest: false, schemes: null, platforms: "all", help: false };
  for (const arg of argv) {
    if (arg === "--check") options.check = true;
    else if (arg === "--emit-manifest") options.emitManifest = true;
    else if (arg === "--help" || arg === "-h") options.help = true;
    else if (arg === "--schemes") options.schemes = "";
    else if (arg.startsWith("--schemes=")) options.schemes = arg.slice("--schemes=".length);
    else if (arg.startsWith("--platforms=")) options.platforms = arg.slice("--platforms=".length);
    else if (!arg.startsWith("--")) options.schemes = arg; // 兼容 `--schemes light,dark`
    else fail(`未知参数：${arg}（--help 看用法）`);
  }
  return options;
}

/** `--platforms=all|ios|android|none` -> 选中平台列表；none 只允许与 --emit-manifest 同用。 */
function resolvePlatforms(options) {
  const value = options.platforms;
  if (value === "all") return ["ios", "android"];
  if (value === "ios" || value === "android") return [value];
  if (value === "none") {
    if (!options.emitManifest) fail("--platforms=none 只能与 --emit-manifest 同用（只产出设计仓 manifest）");
    return [];
  }
  fail(`--platforms 只支持 all / ios / android / none，实际 = ${JSON.stringify(value)}`);
  return [];
}

function usage() {
  console.log(`用法：
  node tools/token-build/build.js [--check] [--platforms=all|ios|android|none] [--schemes[=a,b]] [--emit-manifest]

  （默认）              生成并写入两端生成物目录（被选中平台的目录必须已存在）
  --check               只校验产物与提交一致；重跑零 diff；不一致 exit 1
  --platforms=ios|android   只处理一端（两端并行迁移时免互相阻塞；默认 all）
  --platforms=none      只产出设计仓 manifest（必须与 --emit-manifest 同用）
  --schemes[=a,b]       只产出指定 scheme 的每套常量；裸开关 / 缺省 = schemes 维度的全部
  --emit-manifest       额外产出 / 校验 dist/tokens.manifest.json（跨仓 sha12 自证）
                        manifest 的 artifacts 恒列**两端全部**生成物（内容由令牌版本唯一决定）`);
}

function readTokenFile() {
  const raw = fs.readFileSync(TOKENS);
  const t = JSON.parse(raw.toString("utf8"));
  const sha256 = crypto.createHash("sha256").update(raw).digest("hex");
  return { t, sha256, sha12: sha256.slice(0, 12) };
}

/**
 * 大小写精确的目录存在性判定。
 * macOS/APFS 默认大小写不敏感：`existsSync("…/generated")` 会把既有的 `Generated/` 判成存在，
 * 于是"写进 lowercase 目录"实际写进了大写目录，而 Linux CI 上又不存在 ⇒ 两端行为分叉。
 * 因此这里按**父目录条目名精确匹配**判定，保证任何文件系统上语义一致。
 */
function dirExistsExact(dir) {
  const parent = path.dirname(dir);
  const base = path.basename(dir);
  if (!fs.existsSync(parent)) return false;
  return fs.readdirSync(parent).includes(base);
}

/** 同目录下仅大小写不同的兄弟条目（用于给出可操作的迁移提示） */
function caseMismatchHint(dir) {
  const parent = path.dirname(dir);
  const base = path.basename(dir);
  if (!fs.existsSync(parent)) return "";
  const other = fs.readdirSync(parent).find((name) => name !== base && name.toLowerCase() === base.toLowerCase());
  return other ? `（同级存在大小写不同的 \`${other}\`：M0-2 目标态是小写 \`${base}\`，请完成「纯移动」迁移后重跑）` : "";
}

/**
 * 被选中平台的生成物目录必须**已存在且大小写一致**：缺失即 exit 1（M0-2 要求；生成器不代建、
 * 不代改名 —— 目录迁移属各端「纯移动」提交）。返回缺失目录列表。
 */
function missingTargetDirs(platforms) {
  const dirs = [];
  if (platforms.includes("ios")) dirs.push(IOS_GENERATED);
  if (platforms.includes("android")) dirs.push(ANDROID_GENERATED);
  return dirs.filter((dir) => !dirExistsExact(dir));
}

/** 全部生成物（两端）：`[platform, 绝对路径, 内容]`；manifest 恒列两端全部。 */
function allTargets(t, ctx) {
  return [
    ["ios", path.join(IOS_GENERATED, "WDTokens.swift"), buildSwiftTokens(t, ctx)],
    ["ios", path.join(IOS_GENERATED, "WDTokensVersion.swift"), buildSwiftVersion(t, ctx)],
    ["ios", path.join(IOS_GENERATED, "WDColorSlots.swift"), buildSwiftColorSlots(t, ctx)],
    ["android", path.join(ANDROID_GENERATED, "WDTokens.kt"), buildKotlinTokens(t, ctx)],
    ["android", path.join(ANDROID_GENERATED, "WDTokensVersion.kt"), buildKotlinVersion(t, ctx)],
  ];
}

function manifestContent(ctx, allFiles) {
  const artifacts = allFiles.map(([, file, content]) => ({
    path: path.relative(OUT_ROOT, file).split(path.sep).join("/"),
    sha256: crypto.createHash("sha256").update(content).digest("hex"),
  }));
  return `${JSON.stringify(
    { version: ctx.version, sha256: ctx.sha256, sha12: ctx.sha12, artifacts },
    null,
    2,
  )}\n`;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    usage();
    return;
  }

  const { t, sha256, sha12 } = readTokenFile();
  const allSchemes = readSchemes(t);
  const selected = selectSchemes(allSchemes, options.schemes);
  const platforms = resolvePlatforms(options);

  // 守卫：任一失败即非零退出
  assertGlassPairing(t);
  assertTintRecipe(t);
  assertSpringKeys(t);
  assertFrozenTokens(t);
  const slotPaths = assertSlotCount(t, allSchemes);
  assertContrast(t, allSchemes);

  const defaultScheme = allSchemes.find((s) => s.isDefault).name;
  const lightScheme = (allSchemes.find((s) => s.appearance === "light") ?? allSchemes[0]).name;
  const darkScheme = (allSchemes.find((s) => s.appearance === "dark") ?? allSchemes[0]).name;
  if (selected.length < 2) {
    warn(
      `--schemes 只选了 ${selected.length} 套（${selected.map((s) => s.name).join(",")}）：iOS 动态浅深对仍取 ${lightScheme}/${darkScheme}`,
    );
  }

  const ctx = {
    version: t.$version,
    sha256,
    sha12,
    schemes: selected,
    allSchemes,
    defaultScheme,
    lightScheme,
    darkScheme,
    slotCount: slotPaths.length,
  };

  // 目录缺失 → exit 1（先检查再写，避免半写状态）
  const missing = missingTargetDirs(platforms);
  if (missing.length > 0) {
    fail(
      `目标目录缺失（生成器不代建、不代改名；请先完成该端「纯移动」迁移提交：只移动目录与包名）：\n` +
        missing.map((d) => `    · ${path.relative(OUT_ROOT, d)} ${caseMismatchHint(d)}`).join("\n"),
    );
  }

  const allFiles = allTargets(t, ctx);
  const files = allFiles.filter(([platform]) => platforms.includes(platform));
  let drifted = 0;
  const report = (rel, matches) => {
    if (matches) console.log(`✓ ${rel}`);
    else console.error(`✗ 生成产物与提交不一致：${rel}`);
  };

  for (const [, file, content] of files) {
    const rel = path.relative(OUT_ROOT, file).split(path.sep).join("/");
    const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
    if (options.check) {
      if (current !== content) drifted += 1;
      report(rel, current === content);
    } else {
      fs.writeFileSync(file, content);
      console.log(`→ ${rel}`);
    }
  }

  if (options.emitManifest) {
    const content = manifestContent(ctx, allFiles);
    const rel = path.relative(OUT_ROOT, MANIFEST_OUT).split(path.sep).join("/");
    const current = fs.existsSync(MANIFEST_OUT) ? fs.readFileSync(MANIFEST_OUT, "utf8") : null;
    if (options.check) {
      if (current !== content) drifted += 1;
      report(rel, current === content);
    } else {
      fs.mkdirSync(path.dirname(MANIFEST_OUT), { recursive: true });
      fs.writeFileSync(MANIFEST_OUT, content);
      console.log(`→ ${rel}（设计仓自有产物，目录自动创建）`);
    }
  }

  console.log(
    `tokens v${ctx.version} · sha256:${sha12} · schemes=[${selected.map((s) => s.name).join(", ")}] · 槽位=${ctx.slotCount} · platforms=[${platforms.join(", ")}]`,
  );

  if (options.check && drifted > 0) {
    console.error(
      `\n${drifted} 个文件需要重新生成：node tools/token-build/build.js${options.emitManifest ? " --emit-manifest" : ""}`,
    );
    process.exit(1);
  }
  if (warnings.length > 0) {
    console.error(`\n${warnings.length} 条缺字段/回落告警（已 emit 0 或回落，见上）。`);
  }
}

main();
