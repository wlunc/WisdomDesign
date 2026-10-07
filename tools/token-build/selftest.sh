#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# 设计令牌生成器自测（M0-2 出口判据的机器化）
#
#   bash tools/token-build/selftest.sh
#
# 纪律：全部用例在**临时沙箱**里跑（复制 tokens/ + tools/ + 伪造两端生成物目录），
#       绝不写两端真实仓库、也不写本仓 dist/。任一用例失败 → exit 1。
# 覆盖：写入幂等 / --check 绿与检出漂移 / 目录缺失 exit 1（含零半写）/
#       单端模式 / manifest-only 模式 / --schemes 子集与未知名 /
#       缺字段 emit 0（数值）与颜色缺字段失败 / 四条守卫各一反例。
# ---------------------------------------------------------------------------
set -uo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
DESIGN_ROOT="$(cd "$HERE/../.." && pwd)"
TOKENS="$DESIGN_ROOT/tokens/wisdom.tokens.json"
SANDBOX="$(mktemp -d)"
trap 'rm -rf "$SANDBOX"' EXIT

PASS=0
FAIL=0
ok() { echo "PASS $1"; PASS=$((PASS + 1)); }
no() { echo "FAIL $1  :: $2"; FAIL=$((FAIL + 1)); }

# fresh <dir> <with-ios 0|1> <with-android 0|1>
fresh() {
  local dir="$1" ios="${2:-1}" android="${3:-1}"
  rm -rf "$dir"
  mkdir -p "$dir/wisdomdesign"
  cp -R "$DESIGN_ROOT/tokens" "$DESIGN_ROOT/tools" "$dir/wisdomdesign/"
  [ "$ios" = "1" ] && mkdir -p "$dir/iOS/Sources/WisdomUI/Foundation/generated"
  [ "$android" = "1" ] && mkdir -p "$dir/android/wisdom-ui/src/main/kotlin/io/github/wlunc/wisdom/foundation/generated"
  return 0
}
gen() { # gen <dir> <args...>
  local dir="$1"
  shift
  (cd "$dir" && node wisdomdesign/tools/token-build/build.js "$@")
}
tokens_of() { echo "$1/wisdomdesign/tokens/wisdom.tokens.json"; }
IOS_SWIFT="iOS/Sources/WisdomUI/Foundation/generated/WDTokens.swift"
AND_KT="android/wisdom-ui/src/main/kotlin/io/github/wlunc/wisdom/foundation/generated/WDTokens.kt"

# ---- 0 前置：令牌源与生成器存在
[ -s "$TOKENS" ] && [ -s "$HERE/build.js" ] && ok "前置：tokens 与 build.js 存在" || { no "前置" "缺 tokens/build.js"; exit 1; }

# ---- 1 生成 + 幂等（重跑零 diff）
D="$SANDBOX/ok"; fresh "$D"
gen "$D" --emit-manifest >"$SANDBOX/1a.log" 2>&1; e1=$?
find "$D" -type f \( -name '*.swift' -o -name '*.kt' -o -name '*.json' \) | sort | xargs shasum >"$SANDBOX/sum1"
gen "$D" --emit-manifest >"$SANDBOX/1b.log" 2>&1; e2=$?
find "$D" -type f \( -name '*.swift' -o -name '*.kt' -o -name '*.json' \) | sort | xargs shasum >"$SANDBOX/sum2"
[ "$e1" = "0" ] && [ "$e2" = "0" ] && ok "写入模式 exit 0（两次）" || no "写入模式" "exit=$e1/$e2"
cmp -s "$SANDBOX/sum1" "$SANDBOX/sum2" && ok "幂等：重跑零 diff（5 产物 + manifest 逐字节相同）" || no "幂等" "两次产物不同"

# ---- 2 --check 绿（含 manifest）
gen "$D" --check --emit-manifest >"$SANDBOX/2.log" 2>&1
[ $? = 0 ] && ok "--check --emit-manifest exit 0" || no "--check 绿" "$(tail -3 "$SANDBOX/2.log")"

# ---- 3 --check 检出漂移
printf '\n// tampered\n' >>"$D/$AND_KT"
gen "$D" --check >"$SANDBOX/3.log" 2>&1; e=$?
[ "$e" = "1" ] && grep -q "生成产物与提交不一致" "$SANDBOX/3.log" && ok "--check 检出漂移 exit 1" || no "--check 红" "exit=$e"

# ---- 4 目录缺失 → exit 1 且零半写
D="$SANDBOX/nodir"; fresh "$D" 1 0
gen "$D" >"$SANDBOX/4.log" 2>&1; e=$?
[ "$e" = "1" ] && grep -q "目标目录缺失" "$SANDBOX/4.log" && ok "目标目录缺失 → exit 1" || no "目录缺失" "exit=$e"
[ -z "$(find "$D/iOS" -name '*.swift' 2>/dev/null)" ] && ok "目录缺失时零写入（无半写状态）" || no "半写" "iOS 目录被写了"

# ---- 4b 大小写不精确的目录（macOS 上 `generated` 会被 existsSync 判成 `Generated`）→ exit 1
D="$SANDBOX/case"; fresh "$D" 0 0
mkdir -p "$D/iOS/Sources/WisdomUI/Foundation/Generated" \
  "$D/android/wisdom-ui/src/main/kotlin/io/github/wlunc/wisdom/foundation/Generated"
gen "$D" >"$SANDBOX/4b.log" 2>&1; e=$?
[ "$e" = "1" ] && grep -q "大小写不同" "$SANDBOX/4b.log" && ok "目录大小写不精确 → exit 1（含迁移提示）" \
  || no "目录大小写" "exit=$e; $(tail -1 "$SANDBOX/4b.log")"

# ---- 5 单端模式（另一端目录缺失不阻塞）
D="$SANDBOX/iosonly"; fresh "$D" 1 0
gen "$D" --platforms=ios --emit-manifest >"$SANDBOX/5.log" 2>&1
[ $? = 0 ] && [ -s "$D/$IOS_SWIFT" ] && ok "--platforms=ios 单端可用（两端并行不互相阻塞）" || no "--platforms=ios" "$(tail -2 "$SANDBOX/5.log")"

# ---- 6 manifest-only 模式
D="$SANDBOX/none"; fresh "$D" 0 0
gen "$D" --platforms=none >"$SANDBOX/6a.log" 2>&1; e1=$?
gen "$D" --platforms=none --emit-manifest >"$SANDBOX/6b.log" 2>&1; e2=$?
if [ "$e1" = "1" ] && [ "$e2" = "0" ] && [ -s "$D/wisdomdesign/dist/tokens.manifest.json" ] \
  && [ -z "$(find "$D/iOS" "$D/android" -type f 2>/dev/null)" ]; then
  ok "--platforms=none 须配 --emit-manifest（只产出设计仓 manifest、两端零写入）"
else
  no "--platforms=none" "exit=$e1/$e2"
fi

# ---- 7 --schemes 子集 / 未知名
D="$SANDBOX/subset"; fresh "$D"
gen "$D" --schemes=light >"$SANDBOX/7a.log" 2>&1; e=$?
if [ "$e" = "0" ] && grep -q 'wdSchemeNames: \[String\] = \["light"\]' "$D/iOS/Sources/WisdomUI/Foundation/generated/WDColorSlots.swift" \
  && ! grep -q "wdDarkColors" "$D/$AND_KT" && grep -q "wdLightColors" "$D/$AND_KT"; then
  ok "--schemes=light 只产出该套常量"
else
  no "--schemes 子集" "exit=$e"
fi
grep -q "只选了 1 套" "$SANDBOX/7a.log" && ok "--schemes 子集给出告警（不静默）" || no "--schemes 告警" "无告警"
gen "$D" --schemes=ocean >"$SANDBOX/7b.log" 2>&1; e=$?
[ "$e" = "1" ] && grep -q "未知 scheme" "$SANDBOX/7b.log" && ok "--schemes 未知名 → exit 1" || no "--schemes 未知" "exit=$e"

# ---- 8 缺字段 emit 0（数值）不静默
D="$SANDBOX/missing"; fresh "$D"
python3 - "$(tokens_of "$D")" <<'PY'
import json, sys
p = sys.argv[1]
t = json.load(open(p))
del t["typography"]["body"]["$value"]["letterSpacing"]
del t["size"]["field-height"]["$value"]
json.dump(t, open(p, "w"), ensure_ascii=False, indent=2)
PY
gen "$D" --platforms=ios >"$SANDBOX/8.log" 2>&1; e=$?
if [ "$e" = "0" ] \
  && grep -q "缺字段 typography.body.letterSpacing → emit 0" "$SANDBOX/8.log" \
  && grep -q '缺字段 size.field-height.\$value → emit 0' "$SANDBOX/8.log" \
  && grep -q "letterSpacing: 0)" "$D/$IOS_SWIFT" \
  && grep -q "fieldHeight: CGFloat = 0" "$D/$IOS_SWIFT"; then
  ok "缺字段：emit 0 且 stderr 报警（不静默；叶子缺 \$value 不丢键）"
else
  no "缺字段" "exit=$e; $(grep -c '缺字段' "$SANDBOX/8.log") 条告警"
fi

# ---- 9..13 守卫反例：每条都必须让生成器红
guard() { # guard <名字> <期望报错串> <python 变异脚本>
  local name="$1" expect="$2" mutate="$3"
  local dir="$SANDBOX/guard-$name"
  fresh "$dir"
  python3 - "$(tokens_of "$dir")" <<PY
import json, sys
p = sys.argv[1]
t = json.load(open(p))
$mutate
json.dump(t, open(p, "w"), ensure_ascii=False, indent=2)
PY
  gen "$dir" >"$SANDBOX/guard-$name.log" 2>&1; local e=$?
  if [ "$e" = "1" ] && grep -q "$expect" "$SANDBOX/guard-$name.log"; then
    ok "守卫反例（${name}）→ exit 1"
  else
    no "守卫反例（${name}）" "exit=$e; $(tail -2 "$SANDBOX/guard-$name.log" | tr '\n' ' ')"
  fi
}
guard "颜色缺字段" "缺/非法颜色字段" 'del t["semantic"]["light"]["status"]["info"]["$value"]'
guard "M0-1冻结值" "M0-1 冻结值被改动：size.row-height.compact" 't["size"]["row-height"]["compact"]["$value"] = "48"'
guard "过渡单键" "过渡单键" 't["size"]["touch-target-min"] = {"$value": "44"}'
guard "U12槽位计数" "槽位计数断言失败" 't["semantic"]["light"]["text"]["extra"] = {"$value": "#000000"}; t["semantic"]["dark"]["text"]["extra"] = {"$value": "#FFFFFF"}'
guard "弹簧键集合" "键集合必须恰为 {response, dampingRatio}" 't["motion"]["spring"]["gentle"]["$value"]["stiffness"] = 380'
guard "对比度" "对比度断言失败" 't["semantic"]["light"]["text"]["disabled"]["$value"] = "#B9D2DC"'
guard "WDComponent12键" "WDComponent 出口必须恰为 12 键" 'del t["motion"]["component"]["toast-in"]'
guard "schemes悬空" "schemes 与 semantic 的键集合不一致" 't["schemes"]["ocean"] = {"$value": {"appearance": "dark", "semantic": "semantic.ocean", "isDefault": False}}'

# ---- 14 未知参数
D="$SANDBOX/cli"; fresh "$D"
gen "$D" --bogus >"$SANDBOX/14.log" 2>&1
[ $? = 1 ] && ok "未知参数 → exit 1" || no "未知参数" "未拒绝"

echo "--------------------------------------------"
echo "selftest: PASS=$PASS FAIL=$FAIL"
[ "$FAIL" = "0" ] || exit 1
