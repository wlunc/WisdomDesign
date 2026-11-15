#!/usr/bin/env ruby
# frozen_string_literal: true

# contracts 字段级校验（仅用 Ruby 标准库 YAML，无第三方依赖）
#
# 用法（在 wisdomdesign 根目录运行）：
#   ruby tools/contracts-check.rb
#   ./tools/contracts-check.rb
#
# 校验范围（wisdomdesign/contracts/*.yaml）：
#   1. YAML 可解析，顶层为 Hash；
#   2. component 非空、全局唯一，且与内置 37 个组件基线完全相等；
#   3. params 为数组；每项含非空 name/ios/type；name 与 ios 在文件内唯一；
#      default 可选，允许 null / true / false / 数字 / 字符串（如 ".case"）/ 空数组；
#   4. slots 为 21 名冻结词表中的字符串数组，或字符串 "无"；
#   5. default 为 Hash；
#   6. enums 为 Hash；枚举名非空；同名枚举 case 完全相同时视为共享枚举（允许），
#      case 不同则报错；case 为非空、元素为字符串且不重复的数组；
#   7. 汇总文件数 / 组件数 / 枚举数 / 枚举定义处数 / 共享枚举数；
#      失败逐条输出 file:问题 并 exit 1。
#
# 本脚本只读契约文件，不会修改任何 YAML。

require "yaml"

CONTRACTS_DIR = File.expand_path("../contracts", __dir__)

# 37 个组件基线（来源：contracts/*.yaml 的 component 实际值，按字母序固化）。
EXPECTED_COMPONENTS = %w[
  WDActionSheet
  WDAlert
  WDAssigneePicker
  WDAvatar
  WDAvatarStack
  WDBadge
  WDBanner
  WDBottomSheet
  WDButton
  WDCard
  WDCheckbox
  WDChip
  WDDatePicker
  WDDivider
  WDEmptyState
  WDFAB
  WDFormRow
  WDIcon
  WDIconButton
  WDListRow
  WDListSection
  WDNavigationBar
  WDPicker
  WDProgressBar
  WDProgressRing
  WDPullRefresh
  WDRadio
  WDSearchField
  WDSegmentedControl
  WDSkeleton
  WDSlider
  WDStepper
  WDSwitch
  WDTabBar
  WDTextField
  WDToast
  WDToolbar
].freeze

# U3 槽位冻结词表（21 名）。
SLOT_VOCABULARY = %w[
  content header footer leadingIcon trailingIcon leading trailing
  title message actions items label icon prefix accessory helper
  subtitle valueText options placeholder control
].freeze

def type_name(value)
  case value
  when nil then "null"
  when true, false then "Boolean"
  when Hash then "Hash"
  when Array then "Array"
  when String then "String"
  when Integer then "Integer"
  when Float then "Float"
  else value.class.name
  end
end

def show(value)
  text = value.inspect
  text.length > 80 ? "#{text[0, 77]}..." : text
end

def add(failures, file, message)
  failures << "#{file}: #{message}"
end

def allowed_default?(value)
  return true if value.nil? || value == true || value == false
  return true if value.is_a?(Numeric) || value.is_a?(String)
  return true if value.is_a?(Array) && value.empty?

  false
end

def load_contract(path, file, failures)
  document = YAML.safe_load(File.read(path), aliases: true)
  unless document.is_a?(Hash)
    add(failures, file, "顶层必须是 Hash，实际为 #{type_name(document)}")
    return nil
  end

  document
rescue Psych::Exception, SystemCallError => e
  message = e.message.gsub(/\s+/, " ").strip
  add(failures, file, "YAML 解析失败：#{message}")
  nil
end

def check_component(document, file, components, owners, failures)
  unless document.key?("component")
    add(failures, file, "缺少 component")
    return
  end

  component = document["component"]
  unless component.is_a?(String) && !component.strip.empty?
    add(failures, file, "component 必须是非空字符串，实际为 #{show(component)}")
    return
  end

  components << component
  if owners.key?(component)
    add(failures, file, "component #{component} 重复（首次出现于 #{owners[component]}）")
  else
    owners[component] = file
  end
end

def check_params(document, file, failures)
  unless document.key?("params")
    add(failures, file, "缺少 params")
    return
  end

  params = document["params"]
  unless params.is_a?(Array)
    add(failures, file, "params 必须是数组，实际为 #{type_name(params)}")
    return
  end

  name_owners = {}
  ios_owners = {}

  params.each_with_index do |param, index|
    label = "params[#{index}]"
    unless param.is_a?(Hash)
      add(failures, file, "#{label} 必须是 Hash，实际为 #{type_name(param)}")
      next
    end

    %w[name ios type].each do |key|
      unless param.key?(key)
        add(failures, file, "#{label} 缺少 #{key}")
        next
      end

      value = param[key]
      next if value.is_a?(String) && !value.strip.empty?

      add(failures, file, "#{label}.#{key} 必须是非空字符串，实际为 #{show(value)}")
    end

    name = param["name"]
    if name.is_a?(String) && !name.strip.empty?
      if name_owners.key?(name)
        add(failures, file, "#{label}.name #{name.inspect} 在文件内重复（首次出现于 params[#{name_owners[name]}]）")
      else
        name_owners[name] = index
      end
    end

    ios = param["ios"]
    if ios.is_a?(String) && !ios.strip.empty?
      if ios_owners.key?(ios)
        add(failures, file, "#{label}.ios #{ios.inspect} 在文件内重复（首次出现于 params[#{ios_owners[ios]}]）")
      else
        ios_owners[ios] = index
      end
    end

    next unless param.key?("default")

    default_value = param["default"]
    next if allowed_default?(default_value)

    add(
      failures,
      file,
      "#{label}.default 类型不受支持：#{type_name(default_value)}（允许 null / Boolean / 数字 / " \
      "字符串（如 .case）/ 空数组）"
    )
  end
end

def check_slots(document, file, failures)
  unless document.key?("slots")
    add(failures, file, "缺少 slots")
    return
  end

  slots = document["slots"]

  if slots.is_a?(String)
    add(failures, file, "slots 字符串只能是 \"无\"，实际为 #{slots.inspect}") unless slots == "无"
    return
  end

  unless slots.is_a?(Array)
    add(failures, file, "slots 必须是数组或字符串 \"无\"，实际为 #{type_name(slots)}")
    return
  end

  slots.each_with_index do |slot, index|
    unless slot.is_a?(String)
      add(failures, file, "slots[#{index}] 必须是字符串，实际为 #{type_name(slot)}")
      next
    end

    next if SLOT_VOCABULARY.include?(slot)

    add(failures, file, "slots[#{index}] #{slot.inspect} 不在 21 名冻结词表中")
  end
end

def check_default(document, file, failures)
  unless document.key?("default")
    add(failures, file, "缺少 default")
    return
  end

  default_value = document["default"]
  return if default_value.is_a?(Hash)

  add(failures, file, "default 必须是 Hash，实际为 #{type_name(default_value)}")
end

def check_enums(document, file, enum_registry, enum_definitions, failures)
  unless document.key?("enums")
    add(failures, file, "缺少 enums")
    return
  end

  enums = document["enums"]
  unless enums.is_a?(Hash)
    add(failures, file, "enums 必须是 Hash，实际为 #{type_name(enums)}")
    return
  end

  enums.each do |name, cases|
    enum_definitions << name

    if !name.is_a?(String) || name.strip.empty?
      add(failures, file, "枚举名必须是非空字符串，实际为 #{show(name)}")
      next
    end

    unless cases.is_a?(Array)
      add(failures, file, "enums.#{name} 的 case 必须是数组，实际为 #{type_name(cases)}")
      next
    end

    if cases.empty?
      add(failures, file, "enums.#{name} 的 case 数组不能为空")
      next
    end

    enum_registry[name] << { file: file, cases: cases }

    case_owners = {}
    cases.each_with_index do |enum_case, index|
      unless enum_case.is_a?(String)
        add(failures, file, "enums.#{name} case[#{index}] 必须是字符串，实际为 #{type_name(enum_case)}")
        next
      end

      if enum_case.strip.empty?
        add(failures, file, "enums.#{name} case[#{index}] 不能为空字符串")
        next
      end

      if case_owners.key?(enum_case)
        add(failures, file, "enums.#{name} case[#{index}] #{enum_case.inspect} 重复（首次出现于 case[#{case_owners[enum_case]}]）")
      else
        case_owners[enum_case] = index
      end
    end
  end
end

def check_enum_sharing(enum_registry, failures)
  shared = []

  enum_registry.each do |name, entries|
    next if entries.length < 2

    first = entries.first
    if entries.all? { |entry| entry[:cases] == first[:cases] }
      shared << name
    else
      entries.drop(1).each do |entry|
        next if entry[:cases] == first[:cases]

        add(
          failures,
          entry[:file],
          "枚举名 #{name} 与 #{first[:file]} 重名但 case 不同" \
          "（#{show(first[:cases])} vs #{show(entry[:cases])}）"
        )
      end
    end
  end

  shared
end

def check_baseline(components, failures)
  actual = components.uniq
  missing = EXPECTED_COMPONENTS - actual
  extra = actual - EXPECTED_COMPONENTS

  missing.each { |component| add(failures, "contracts/", "缺少基线组件 #{component}") }
  extra.each { |component| add(failures, "contracts/", "出现基线外组件 #{component}") }

  if components.length != EXPECTED_COMPONENTS.length
    add(
      failures,
      "contracts/",
      "组件总数 #{components.length}，基线要求 #{EXPECTED_COMPONENTS.length}"
    )
  end

  return if actual.length == EXPECTED_COMPONENTS.length

  add(
    failures,
    "contracts/",
    "唯一组件数 #{actual.length}，基线要求 #{EXPECTED_COMPONENTS.length}"
  )
end

def main
  failures = []
  components = []
  component_owners = {}
  enum_registry = Hash.new { |hash, key| hash[key] = [] }
  enum_definitions = []

  unless Dir.exist?(CONTRACTS_DIR)
    puts "contracts 目录: #{CONTRACTS_DIR}"
    puts "contracts/: 目录不存在"
    return 1
  end

  files = Dir.glob(File.join(CONTRACTS_DIR, "*.yaml")).sort

  if files.empty?
    puts "contracts 目录: #{CONTRACTS_DIR}"
    puts "contracts/: 未找到任何 *.yaml 文件"
    return 1
  end

  files.each do |path|
    file = File.basename(path)
    document = load_contract(path, file, failures)
    next if document.nil?

    check_component(document, file, components, component_owners, failures)
    check_params(document, file, failures)
    check_slots(document, file, failures)
    check_default(document, file, failures)
    check_enums(document, file, enum_registry, enum_definitions, failures)
  end

  shared_enums = check_enum_sharing(enum_registry, failures)
  check_baseline(components, failures)

  unique_components = components.uniq.length
  component_summary = components.length.to_s
  component_summary += "（唯一 #{unique_components}）" if unique_components != components.length

  shared_summary = shared_enums.empty? ? "0" : "#{shared_enums.length}（#{shared_enums.join(", ")}）"

  puts "contracts 目录: #{CONTRACTS_DIR}"
  puts "文件数: #{files.length}"
  puts "组件数: #{component_summary}"
  puts "枚举数: #{enum_registry.length}"
  puts "枚举定义处数: #{enum_definitions.length}"
  puts "共享枚举数: #{shared_summary}"

  if failures.empty?
    puts "检查通过：全部字段校验成功。"
    return 0
  end

  puts ""
  puts "检查失败（#{failures.length} 项）："
  failures.each { |failure| puts "  #{failure}" }
  return 1
end

exit(main)
