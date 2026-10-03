#!/usr/bin/env node
/**
 * 设计令牌生成器
 *
 *   node tools/token-build/build.js          生成，写入两端仓库
 *   node tools/token-build/build.js --check  只校验生成产物与提交是否一致（CI 用）
 *
 * 输入：tokens/wisdom.tokens.json（DTCG）
 * 输出：../iOS/Sources/WisdomUI/Foundation/Generated/WDTokens.swift
 *       ../android/wisdom-ui/src/main/kotlin/io/github/wlunc/wisdom/foundation/Generated/WDTokens.kt
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");
const OUT_ROOT = path.resolve(ROOT, "..");
const TOKENS = path.join(ROOT, "tokens/wisdom.tokens.json");

const SWIFT_OUT = path.join(OUT_ROOT, "iOS/Sources/WisdomUI/Foundation/Generated/WDTokens.swift");
const KOTLIN_OUT = path.join(
  OUT_ROOT,
  "android/wisdom-ui/src/main/kotlin/io/github/wlunc/wisdom/foundation/Generated/WDTokens.kt",
);

// ---------------------------------------------------------------- helpers

/** #RGB / #RRGGBB / #RRGGBBAA -> {r,g,b,a} 0-255 */
function parseHex(value) {
  const hex = value.trim().replace(/^#/, "");
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

/** Swift: 拆出 0xRRGGBB 与 alpha */
function swiftHex(value) {
  const { r, g, b, a } = parseHex(value);
  return {
    hex: `0x${[r, g, b].map(sw0).join("")}`,
    alpha: a / 255,
  };
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

const sw0 = (n) => n.toString(16).toUpperCase().padStart(2, "0");

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

/** "fontWeight": 600 -> Swift .semibold / Kotlin FontWeight.SemiBold */
const SWIFT_WEIGHT = { 400: ".regular", 500: ".medium", 600: ".semibold", 700: ".bold" };
const KOTLIN_WEIGHT = { 400: "FontWeight.Normal", 500: "FontWeight.Medium", 600: "FontWeight.SemiBold", 700: "FontWeight.Bold" };

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

function banner(tool, comment) {
  return [
    `// 本文件由 ${tool} 生成，请勿手改。`,
    `// 修改请编辑 wisdomdesign/tokens/wisdom.tokens.json 后重新生成。`,
    comment,
    "",
  ];
}

/**
 * 汇总渐变定义。
 * semantic.light/dark.gradient 下的随外观取值；顶层 gradient 下的两端共用。
 * 返回顺序：随外观的先出（surface / fill 用得最多），再出共用的。
 */
function collectGradients(t) {
  const out = [];
  const light = t.semantic?.light?.gradient ?? {};
  const dark = t.semantic?.dark?.gradient ?? {};
  for (const [name, token] of Object.entries(light)) {
    if (name.startsWith("$")) continue;
    const l = parseLinearGradient(token.$value);
    const d = parseLinearGradient(dark[name].$value);
    if (l.stops.length !== d.stops.length) {
      throw new Error(`渐变 ${name} 的浅深两端 stop 数量不一致`);
    }
    out.push({ name, angle: l.angle, light: l.stops, dark: d.stops });
  }
  for (const [name, token] of Object.entries(t.gradient)) {
    if (name.startsWith("$")) continue;
    const g = parseLinearGradient(token.$value);
    out.push({ name, angle: g.angle, light: g.stops, dark: g.stops });
  }
  return out;
}

/** 同一位置两端色值相同就用单值颜色，不同就用成对颜色 */
function swiftStopColor(lightHex, darkHex) {
  return lightHex.toUpperCase() === darkHex.toUpperCase()
    ? swiftColorSingle(lightHex)
    : swiftColorPair(lightHex, darkHex);
}

// ---------------------------------------------------------------- Swift

function buildSwift(t) {
  const L = [...banner("wisdomdesign/tools/token-build/build.js", ""), "import SwiftUI", ""];

  // 语义色
  const semanticKeys = [];
  for (const group of Object.keys(t.semantic.light)) {
    if (group.startsWith("$") || group === "gradient") continue;
    const keys = Object.keys(t.semantic.light[group]).filter((k) => !k.startsWith("$"));
    keys.forEach((k) => {
      const light = t.semantic.light[group][k].$value;
      const dark = t.semantic.dark[group][k].$value;
      semanticKeys.push(
        `    public static let ${camel(group, k)} = ${swiftColorPair(light, dark)}`,
      );
    });
  }

  L.push("/// 语义色。界面只允许引用这一层。");
  L.push("public enum WDColor {");
  L.push(...semanticKeys);
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
  L.push("public enum WDGradient {");
  for (const g of collectGradients(t)) {
    L.push(`    public static let ${camel("", g.name)} = WDGradientSpec(`);
    L.push(`        angleDegrees: ${g.angle},`);
    L.push(`        stops: [`);
    g.light.forEach((s, i) => {
      const darkStop = g.dark[i];
      L.push(
        `            (color: ${swiftStopColor(s.hex, darkStop.hex)}, location: ${(s.pos / 100).toFixed(2)})${i === g.light.length - 1 ? "" : ","}`
      );
    });
    L.push(`        ]`);
    L.push(`    )`);
  }
  L.push("}");
  L.push("");

  // 间距 / 圆角 / 尺寸
  L.push("/// 间距，基准 4pt。");
  L.push("public enum WDSpacing {");
  for (const [k, v] of Object.entries(t.space)) {
    if (k.startsWith("$")) continue;
    L.push(`    public static let s${k}: CGFloat = ${v.$value}`);
  }
  L.push("}");
  L.push("");

  L.push("/// 圆角阶梯。");
  L.push("public enum WDRadius {");
  for (const [k, v] of Object.entries(t.radius)) {
    if (k.startsWith("$")) continue;
    L.push(`    public static let ${camel("", k)}: CGFloat = ${v.$value}`);
  }
  L.push("}");
  L.push("");

  L.push("/// 组件尺寸。");
  L.push("public enum WDSize {");
  for (const [group, value] of Object.entries(t.size)) {
    if (group.startsWith("$")) continue;
    if (value.$value !== undefined) {
      L.push(`    public static let ${camel("", group)}: CGFloat = ${value.$value}`);
    } else {
      for (const [k, v] of Object.entries(value)) {
        if (k.startsWith("$")) continue;
        L.push(`    public static let ${camel(group, k)}: CGFloat = ${v.$value}`);
      }
    }
  }
  L.push("}");
  L.push("");

  // 字阶
  L.push("/// 字阶。size 与 lineHeight 分开给，行高比由设计决定，不交给系统默认。");
  L.push("public enum WDType {");
  for (const [k, v] of Object.entries(t.typography)) {
    if (k.startsWith("$") || k === "family") continue;
    const val = v.$value;
    L.push(
      `    public static let ${camel("", k)} = WDTextStyle(size: ${val.fontSize}, lineHeight: ${val.lineHeight}, weight: ${SWIFT_WEIGHT[val.fontWeight]})`,
    );
  }
  L.push("}");
  L.push("");

  // 阴影
  L.push("/// 高度。每层阴影按顺序叠加，禁止单层重阴影。");
  L.push("public enum WDElevation {");
  for (const [k, v] of Object.entries(t.elevation)) {
    if (k.startsWith("$")) continue;
    const layers = (v.$value.layers || []).map(
      (l) =>
        `        .init(x: ${l.x}, y: ${l.y}, blur: ${l.blur}, color: ${swiftColorSingle(l.color)})`,
    );
    L.push(`    public static let ${k === "0" ? "e0" : k === "brand" ? "brand" : "e" + k}: [WDShadowLayer] = [`);
    L.push(...layers.map((l, i) => (i === layers.length - 1 ? l : l + ",")));
    L.push("    ]");
  }
  L.push("}");
  L.push("");

  // 动效
  L.push("/// 动效。进场慢、出场快；位移越长时长越长。");
  L.push("public enum WDMotion {");
  L.push("    public enum Duration {");
  for (const [k, v] of Object.entries(t.motion.duration)) {
    if (k.startsWith("$")) continue;
    L.push(`        public static let ${camel("", k)}: Double = ${(Number(v.$value) / 1000).toFixed(2)}`);
  }
  L.push("    }");
  L.push("");
  L.push("    public enum Spring {");
  for (const [k, v] of Object.entries(t.motion.spring)) {
    if (k.startsWith("$")) continue;
    const s = v.$value;
    L.push(
      `        public static let ${camel("", k)} = Animation.spring(response: ${s.response}, dampingFraction: ${s.dampingFraction})`,
    );
  }
  L.push("    }");
  L.push("}");

  return L.join("\n") + "\n";
}

// ---------------------------------------------------------------- Kotlin

function buildKotlin(t) {
  const names = [];
  for (const group of Object.keys(t.semantic.light)) {
    if (group.startsWith("$") || group === "gradient") continue;
    Object.keys(t.semantic.light[group])
      .filter((k) => !k.startsWith("$"))
          .forEach((k) => names.push(camel(group, k)));
  }

  const L = [...banner("wisdomdesign/tools/token-build/build.js", ""), "package io.github.wlunc.wisdom.foundation", ""];
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

  L.push("/** 语义色。界面只允许引用这一层。 */");
  // 不用 data class：27 个属性会顺带暴露 copy() 与 componentN()，不是我们想承诺的 API
  L.push("@Immutable");
  L.push("public class WDColors(");
  names.forEach((n, i) => L.push(`    public val ${n}: Color,`));
  L.push(")");
  L.push("");

  for (const theme of ["light", "dark"]) {
    L.push(`internal val wd${upperFirst(theme)}Colors: WDColors = WDColors(`);
    for (const group of Object.keys(t.semantic[theme])) {
      if (group.startsWith("$") || group === "gradient") continue;
      for (const [k, v] of Object.entries(t.semantic[theme][group])) {
        if (k.startsWith("$")) continue;
        L.push(`    ${camel(group, k)} = ${kotlinColor(v.$value)},`);
      }
    }
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

  L.push("/** 渐变。用 stops 描述，角度沿用 CSS 口径。 */");
  L.push("@Immutable");
  L.push("public class WDGradientSpec(");
  L.push("    public val angleDegrees: Float,");
  L.push("    public val stops: List<Pair<Color, Float>>,");
  L.push(")");
  L.push("");

  const gradients = collectGradients(t);
  L.push("/** 当前主题下的全部渐变。Compose 不做浅深自动解析，所以深浅各出一套。 */");
  L.push("@Immutable");
  L.push("public class WDGradients(");
  gradients.forEach((g) => L.push(`    public val ${camel("", g.name)}: WDGradientSpec,`));
  L.push(")");
  L.push("");

  for (const theme of ["light", "dark"]) {
    L.push(`internal val wd${upperFirst(theme)}Gradients: WDGradients = WDGradients(`);
    gradients.forEach((g) => {
      const stops = g[theme]
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
    L.push(`    public val s${k}: Dp = ${v.$value}.dp`);
  }
  L.push("}");
  L.push("");

  L.push("/** 圆角阶梯。 */");
  L.push("public object WDRadius {");
  for (const [k, v] of Object.entries(t.radius)) {
    if (k.startsWith("$")) continue;
    L.push(`    public val ${camel("", k)}: Dp = ${v.$value}.dp`);
  }
  L.push("}");
  L.push("");

  L.push("/** 组件尺寸。 */");
  L.push("public object WDSize {");
  for (const [group, value] of Object.entries(t.size)) {
    if (group.startsWith("$")) continue;
    if (value.$value !== undefined) {
      L.push(`    public val ${camel("", group)}: Dp = ${value.$value}.dp`);
    } else {
      for (const [k, v] of Object.entries(value)) {
        if (k.startsWith("$")) continue;
        L.push(`    public val ${camel(group, k)}: Dp = ${v.$value}.dp`);
      }
    }
  }
  L.push("}");
  L.push("");

  L.push("/** 字阶。size 与 lineHeight 分开给，行高比由设计决定，不交给系统默认。 */");
  L.push("public data class WDTextStyle(val size: TextUnit, val lineHeight: TextUnit, val weight: FontWeight)");
  L.push("");
  L.push("public object WDType {");
  for (const [k, v] of Object.entries(t.typography)) {
    if (k.startsWith("$") || k === "family") continue;
    const val = v.$value;
    L.push(
      `    public val ${camel("", k)}: WDTextStyle = WDTextStyle(${val.fontSize}.sp, ${val.lineHeight}.sp, ${KOTLIN_WEIGHT[val.fontWeight]})`,
    );
  }
  L.push("}");
  L.push("");

  L.push("/** 动效。进场慢、出场快；位移越长时长越长。 */");
  L.push("public object WDMotion {");
  for (const [k, v] of Object.entries(t.motion.duration)) {
    if (k.startsWith("$")) continue;
    L.push(`    public const val duration${upperFirst(k)}: Int = ${v.$value}`);
  }
  L.push("");
  for (const [k, v] of Object.entries(t.motion.spring)) {
    if (k.startsWith("$")) continue;
    const s = v.$value;
    L.push(
      `    public val spring${upperFirst(k)}: SpringSpec<Float> = spring<Float>(dampingRatio = ${s.dampingFraction}f, stiffness = ${s.stiffness}f)`,
    );
  }
  L.push("}");

  return L.join("\n") + "\n";
}

// ---------------------------------------------------------------- main

function main() {
  const tokens = JSON.parse(fs.readFileSync(TOKENS, "utf8"));
  const targets = [
    [SWIFT_OUT, buildSwift(tokens)],
    [KOTLIN_OUT, buildKotlin(tokens)],
  ];

  const check = process.argv.includes("--check");
  let drifted = 0;

  for (const [file, content] of targets) {
    const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
    if (check) {
      if (current !== content) {
        console.error(`✗ 生成产物与提交不一致：${path.relative(OUT_ROOT, file)}`);
        drifted++;
      } else {
        console.log(`✓ ${path.relative(OUT_ROOT, file)}`);
      }
    } else {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, content);
      console.log(`→ ${path.relative(OUT_ROOT, file)}`);
    }
  }

  if (check && drifted > 0) {
    console.error(`\n${drifted} 个文件需要重新生成：node tools/token-build/build.js`);
    process.exit(1);
  }
}

main();
