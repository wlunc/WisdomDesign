#!/usr/bin/env ruby
# frozen_string_literal: true

# M1-1 设计真源只读提取器。
# 仅使用 Ruby 标准库；YAML 由 Psych/YAML 解析，绝不手写 YAML 解析器。
# 输出为稳定排序、无时间戳的 JSON，供 M1-2 生成组件目录与语义卡。

require "json"
require "yaml"
require "digest"

module ExtractDesign
  VERSION = "1.0".freeze
  EXPECTED_COMPONENT_COUNT = 37

  DESIGN_ROOT = File.expand_path("../../..", __dir__)
  PRODUCT_ROOT = File.expand_path("..", DESIGN_ROOT)
  AI_ROOT = File.join(DESIGN_ROOT, "ai", "skill")
  OVERLAY_ROOT = File.join(AI_ROOT, "component-overlays")

  SPEC_FILES = %w[01-basic.md 02-advanced.md 03-patterns.md].freeze
  FORMAL_SECTIONS = (1..12).freeze
  RECIPE_IDS = %w[R1 R2 R3 R4 R5].freeze

  class ExtractError < StandardError
    attr_reader :issues

    def initialize(issues)
      @issues = issues
      super(issues.length == 1 ? issues.first : "#{issues.length} extraction errors")
    end
  end

  module_function

  def rel(path)
    path.delete_prefix(DESIGN_ROOT + "/")
  end

  def sha256_file(path)
    Digest::SHA256.file(path).hexdigest
  end

  def sha256_text(text)
    Digest::SHA256.hexdigest(text)
  end

  def stable_json(value)
    JSON.pretty_generate(value) + "\n"
  end

  def read_text(path)
    File.read(path, encoding: "UTF-8")
  rescue SystemCallError => e
    raise ExtractError, ["#{rel(path)}: 无法读取：#{e.message}"]
  end

  def parse_json_file(path, issues)
    JSON.parse(read_text(path))
  rescue JSON::ParserError => e
    issues << "#{rel(path)}: JSON 解析失败：#{e.message}"
    nil
  end

  def split_sections(lines, heading_pattern)
    sections = []
    current = nil
    lines.each_with_index do |line, index|
      match = line.match(heading_pattern)
      if match
        current = { id: match[1], name: match[2], header_line: index + 1, lines: [] }
        sections << current
      elsif current
        current[:lines] << [index, line]
      elsif line.match?(/^# /)
        current = nil
      end
    end
    sections
  end

  def subsection_range(section_lines, number)
    start = nil
    finish = section_lines.length
    section_lines.each_with_index do |(_, line), index|
      if line =~ /^### #{number}\. /
        start = index + 1
      elsif start && line =~ /^### \d+\. /
        finish = index
        break
      end
    end
    return nil if start.nil?

    [start, finish]
  end

  def source_ref(path, line)
    { "path" => rel(path), "line" => line }
  end

  # Absolute 1-based line number for an entry of section[:lines].
  # split_sections stores section[:lines][k] = [absolute 0-based index, line], so the
  # 1-based line number is index + 1. The '### n.' heading itself is not stored in
  # section[:lines]; its index is the range start - 1.
  def line_ref(path, entry)
    source_ref(path, entry[0] + 1)
  end

  def extract_purpose(section, path)
    range = subsection_range(section[:lines], 1)
    issues = []
    unless range
      issues << "#{rel(path)}: #{section[:name]} 缺少规格 §1"
      return [{ "summary" => "", "bullets" => [], "notes" => [], "sourceRefs" => [] }, issues]
    end

    start, finish = range
    body = section[:lines][start...finish]
    heading_entry = section[:lines][start - 1]

    if body.empty? || body.all? { |(_, line)| line.strip.empty? }
      issues << "#{rel(path)}: #{section[:name]} 规格 §1 为空"
      return [{ "summary" => "", "bullets" => [], "notes" => [], "sourceRefs" => [] }, issues]
    end

    summary = ""
    summary_ref = nil
    bullets = []
    notes = []
    last_body_entry = nil
    body.each do |absolute_index, line|
      stripped = line.strip
      next if stripped.empty?

      line_text = stripped
      last_body_entry = [absolute_index, line]
      case stripped
      when /^- \*\*不要用\*\*[：:]\s*(.*)$/
        text = Regexp.last_match(1).strip
        bullets << { "kind" => "avoid", "text" => text, "lineText" => line_text, "sourceRef" => source_ref(path, absolute_index + 1) }
      when /^- \*\*用\*\*[：:]\s*(.*)$/
        text = Regexp.last_match(1).strip
        bullets << { "kind" => "use", "text" => text, "lineText" => line_text, "sourceRef" => source_ref(path, absolute_index + 1) } unless text.empty?
      when /^- (.*)$/
        notes << { "text" => Regexp.last_match(1).strip, "lineText" => line_text, "sourceRef" => source_ref(path, absolute_index + 1) }
      else
        if summary.empty?
          summary = stripped
          summary_ref = { "path" => rel(path), "line" => absolute_index + 1, "lineText" => line_text }
        end
      end
    end

    if summary.empty?
      summary = body.first[1].strip
      summary_ref = { "path" => rel(path), "line" => body.first[0] + 1, "lineText" => body.first[1].strip }
    end
    issues << "#{rel(path)}: #{section[:name]} 规格 §1 缺少用途摘要" if summary.empty?
    avoid_in_body = body.any? do |entry|
      line = entry[1]
      line.include?("不要用") || line.include?("不要混在")
    end
    unless bullets.any? { |bullet| bullet["kind"] == "avoid" } || avoid_in_body
      issues << "#{rel(path)}: #{section[:name]} 规格 §1 缺少反例（不要用）"
    end

    refs = [
      { "path" => rel(path), "line" => heading_entry[0] + 1, "lineText" => heading_entry[1].strip },
      summary_ref,
      last_body_entry ? line_ref(path, last_body_entry).merge("lineText" => last_body_entry[1].strip) : nil
    ].compact
    refs.concat(bullets.map { |bullet| bullet["sourceRef"].merge("lineText" => bullet["lineText"]) })
    refs.concat(notes.map { |note| note["sourceRef"].merge("lineText" => note["lineText"]) })
    [
      {
        "summary" => summary,
        "summaryRef" => summary_ref,
        "bullets" => bullets,
        "notes" => notes,
        "sourceRefs" => refs.uniq
      },
      issues
    ]
  end

  # §5 状态 / §7 内容 / §10 无障碍 conclusions. Markdown tables become
  # "header=cell; header=cell" items; bullets and paragraphs are kept verbatim.
  # Every item carries the exact source line text so audits can assert the line number.
  def extract_conclusions(section, path, number)
    range = subsection_range(section[:lines], number)
    return nil unless range

    start, finish = range
    body = section[:lines][start...finish]
    heading_entry = section[:lines][start - 1]
    items = []
    header_cells = nil
    body.each do |absolute_index, line|
      stripped = line.strip
      next if stripped.empty?

      if stripped.start_with?("|")
        cells = stripped.split("|").map(&:strip).reject(&:empty?)
        next if cells.empty? || cells.all? { |cell| cell.match?(/\A:?-{3,}:?\z/) }

        if header_cells.nil?
          header_cells = cells
          next
        end
        text = cells.each_with_index.map { |cell, index| header_cells[index] ? "#{header_cells[index]}=#{cell}" : cell }.join("; ")
      elsif stripped.start_with?("- ")
        text = stripped.sub(/\A-\s*/, "")
      else
        text = stripped
      end
      items << { "text" => text, "lineText" => stripped, "sourceRef" => source_ref(path, absolute_index + 1) }
    end
    return nil if items.empty?

    refs = [{ "path" => rel(path), "line" => heading_entry[0] + 1, "lineText" => heading_entry[1].strip }]
    refs.concat(items.map { |item| item["sourceRef"].merge("lineText" => item["lineText"]) })
    {
      "heading" => heading_entry[1].strip,
      "items" => items,
      "sourceRefs" => refs
    }
  end

  def load_specs(issues)
    specs = {}
    SPEC_FILES.each do |filename|
      path = File.join(DESIGN_ROOT, "docs", "specs", filename)
      lines = read_text(path).lines(chomp: true)
      split_sections(lines, /^# (\d+) · (.+)$/).each do |section|
        name = section[:name].strip
        component_id = "WD#{name}"
        component_id = "WDPullRefresh" if component_id == "WDPullToRefresh"
        if specs.key?(component_id)
          issues << "docs/specs: 规格重复 #{component_id}"
          next
        end

        purpose, purpose_issues = extract_purpose(section, path)
        issues.concat(purpose_issues)
        missing_sections = FORMAL_SECTIONS.reject { |number| subsection_range(section[:lines], number) }
        issues << "#{rel(path)}: #{component_id} 缺少正式章节 #{missing_sections.join(",")}" unless missing_sections.empty?

        conclusions = {
          "states" => extract_conclusions(section, path, 5),
          "content" => extract_conclusions(section, path, 7),
          "accessibility" => extract_conclusions(section, path, 10)
        }
        conclusions.each do |key, block|
          issues << "#{rel(path)}: #{component_id} 缺少#{key}结论（§#{ { "states" => 5, "content" => 7, "accessibility" => 10 }[key] }）" if block.nil?
        end

        specs[component_id] = {
          "component" => component_id,
          "specNumber" => section[:id].to_i,
          "specName" => name,
          "path" => rel(path),
          "headingLine" => section[:header_line],
          "purpose" => purpose,
          "conclusions" => conclusions,
          "sectionLines" => FORMAL_SECTIONS.each_with_object({}) do |number, hash|
            range = subsection_range(section[:lines], number)
            hash[number.to_s] = range ? [section[:header_line] + range[0], section[:header_line] + range[1]] : nil
          end
        }
      end

      recipes = split_sections(lines, /^# (R[1-5]) · (.+)$/)
      next if recipes.empty?

      recipe_ids = recipes.map { |recipe| recipe[:id] }
      unexpected = recipe_ids - RECIPE_IDS
      issues << "#{rel(path)}: 未知配方 ID #{unexpected.join(",")}" unless unexpected.empty?
      missing_recipes = RECIPE_IDS - recipe_ids
      issues << "#{rel(path)}: 缺少配方 #{missing_recipes.join(",")}" unless missing_recipes.empty?
    end

    missing_contracts = specs.keys.reject do |component|
      File.exist?(File.join(DESIGN_ROOT, "contracts", "#{component}.yaml"))
    end
    issues << "docs/specs: 正式规格引用了不存在的 YAML #{missing_contracts.join(",")}" unless missing_contracts.empty?
    specs
  end

  def load_contracts(component_ids, issues)
    contracts = {}
    files = Dir.glob(File.join(DESIGN_ROOT, "contracts", "WD*.yaml")).sort
    files.each do |path|
      filename = File.basename(path)
      document = YAML.safe_load(read_text(path), aliases: true)
      unless document.is_a?(Hash)
        issues << "#{filename}: YAML 顶层必须是 Hash"
        next
      end

      component = document["component"]
      unless component.is_a?(String) && !component.strip.empty?
        issues << "#{filename}: component 必须是非空字符串"
        next
      end
      issues << "#{filename}: component #{component} 与文件名不一致" if component != File.basename(filename, ".yaml")
      if contracts.key?(component)
        issues << "#{filename}: 重复 component #{component}"
        next
      end

      %w[params slots default enums].each do |key|
        issues << "#{filename}: 缺少 #{key}" unless document.key?(key)
      end
      params = document["params"]
      if params.is_a?(Array)
        duplicates = params.filter_map { |param| param["name"] if param.is_a?(Hash) }.tally.select { |_, count| count > 1 }.keys
        issues << "#{filename}: params.name 重复 #{duplicates.join(",")}" unless duplicates.empty?
      else
        issues << "#{filename}: params 必须是数组"
      end

      slots = document["slots"]
      issues << "#{filename}: slots 必须是数组或 无" unless slots == "无" || slots.is_a?(Array)
      enum_names = document["enums"].is_a?(Hash) ? document["enums"].keys : []
      contracts[component] = {
        "component" => component,
        "path" => rel(path),
        "sha256" => sha256_file(path),
        "params" => params.is_a?(Array) ? params : [],
        "slots" => slots,
        "default" => document["default"],
        "enums" => document["enums"],
        "enumNames" => enum_names
      }
    end

    issues << "contracts: 期望 #{EXPECTED_COMPONENT_COUNT} 个 WD*.yaml，实际 #{files.length}" if files.length != EXPECTED_COMPONENT_COUNT
    missing_specs = contracts.keys - component_ids
    issues << "contracts: YAML 组件缺少正式规格 #{missing_specs.join(",")}" unless missing_specs.empty?
    missing_yaml = component_ids - contracts.keys
    issues << "contracts: 正式规格缺少 YAML #{missing_yaml.join(",")}" unless missing_yaml.empty?
    contracts
  end

  def load_tokens(issues)
    path = File.join(DESIGN_ROOT, "tokens", "wisdom.tokens.json")
    document = parse_json_file(path, issues)
    return {} unless document.is_a?(Hash)

    {
      "path" => rel(path),
      "sha256" => sha256_file(path),
      "version" => document["$version"],
      "description" => document["$description"],
      "schemeNames" => document.fetch("schemes", {}).keys.reject { |key| key.start_with?("$") }.sort,
      "topLevelKeys" => document.keys.reject { |key| key.start_with?("$") }.sort
    }
  end

  def load_rule_document(filename, issues, required_headings)
    path = File.join(DESIGN_ROOT, "docs", filename)
    text = read_text(path)
    lines = text.lines(chomp: true)
    missing = required_headings.reject { |heading| lines.any? { |line| line.start_with?(heading) } }
    issues << "#{rel(path)}: 缺少章节 #{missing.join(",")}" unless missing.empty?
    {
      "path" => rel(path),
      "sha256" => sha256_text(text),
      "lineCount" => lines.length,
      "requiredHeadings" => required_headings
    }
  end

  def load_overlays(component_ids, issues)
    return {} unless Dir.exist?(OVERLAY_ROOT)

    overlays = {}
    Dir.glob(File.join(OVERLAY_ROOT, "WD*.json")).sort.each do |path|
      filename = File.basename(path, ".json")
      unless component_ids.include?(filename)
        issues << "#{rel(path)}: 未知组件 overlay #{filename}"
        next
      end
      document = parse_json_file(path, issues)
      next unless document.is_a?(Hash)

      issues << "#{rel(path)}: component 必须与文件名一致" unless document["component"] == filename
      allowed = %w[schemaVersion component searchAliases combinesWith pageRegions]
      unknown = document.keys - allowed
      issues << "#{rel(path)}: 未知 overlay 字段 #{unknown.join(",")}" unless unknown.empty?
      if document.key?("combinesWith")
        refs = document["combinesWith"]
        unless refs.is_a?(Array) && refs.all? { |item| item.is_a?(String) }
          issues << "#{rel(path)}: combinesWith 必须是字符串数组"
        else
          unknown_refs = refs.uniq - component_ids
          issues << "#{rel(path)}: 未知组合引用 #{unknown_refs.join(",")}" unless unknown_refs.empty?
        end
      end
      if document.key?("searchAliases") && !(document["searchAliases"].is_a?(Array) && document["searchAliases"].all? { |item| item.is_a?(String) && !item.strip.empty? })
        issues << "#{rel(path)}: searchAliases 必须是非空字符串数组"
      end
      if document.key?("pageRegions") && !(document["pageRegions"].is_a?(Array) && document["pageRegions"].all? { |item| item.is_a?(String) && !item.strip.empty? })
        issues << "#{rel(path)}: pageRegions 必须是非空字符串数组"
      end
      overlays[filename] = document
    end
    overlays
  end

  def build
    issues = []
    specs = load_specs(issues)
    contracts = load_contracts(specs.keys, issues)
    overlays = load_overlays(specs.keys, issues)
    tokens = load_tokens(issues)
    layout = load_rule_document("09-layout.md", issues, ["## 1. 页面骨架", "## 2. 边距与栅格", "## 3. 纵向节奏", "## 4. 密度", "## 5. 多设备", "## 6. 键盘与安全区", "## 7. 滚动行为", "## 8. 列表长度"])
    accessibility = load_rule_document("06-accessibility.md", issues, ["## 2. 四条底线", "## 3. 屏幕阅读器", "## 4. 动态字体", "## 5. 对比度"])
    content = load_rule_document("07-content.md", issues, ["## 1. 三条原则", "## 2. 句式规则", "## 3. 时间与日期", "## 4. 长度上限", "## 5. 分场景写法"])
    raise ExtractError, issues unless issues.empty?

    components = specs.keys.sort.map do |component_id|
      spec = specs.fetch(component_id)
      contract = contracts.fetch(component_id)
      overlay = overlays[component_id] || {}
      {
        "id" => component_id,
        "specNumber" => spec["specNumber"],
        "specName" => spec["specName"],
        "purpose" => spec["purpose"],
        "conclusions" => spec["conclusions"],
        "contract" => {
          "path" => contract["path"],
          "sha256" => contract["sha256"],
          "params" => contract["params"],
          "slots" => contract["slots"],
          "default" => contract["default"],
          "enums" => contract["enums"]
        },
        "overlay" => {
          "path" => overlays.key?(component_id) ? rel(File.join(OVERLAY_ROOT, "#{component_id}.json")) : nil,
          "searchAliases" => overlay["searchAliases"] || [],
          "combinesWith" => overlay["combinesWith"] || [],
          "pageRegions" => overlay["pageRegions"] || []
        },
        "sourceRefs" => [source_ref(File.join(DESIGN_ROOT, spec["path"]), spec["headingLine"]), source_ref(File.join(DESIGN_ROOT, contract["path"]), 1)] +
          spec["purpose"]["sourceRefs"] +
          %w[states content accessibility].flat_map { |key| (spec["conclusions"][key] || {})["sourceRefs"] || [] }
      }
    end

    {
      "schemaVersion" => "1.0",
      "extractorVersion" => VERSION,
      "policy" => {
        "specs" => "用途、反例、状态、内容与无障碍结论唯一来自 docs/specs/01-basic.md、02-advanced.md、03-patterns.md。",
        "contracts" => "参数、槽位、默认值与枚举唯一来自 contracts/WD*.yaml。",
        "tokens" => "视觉数值唯一来自 tokens/wisdom.tokens.json；本提取器只记录版本与摘要。",
        "overlay" => "overlay 只补检索关键词、组合关系和页面区域，不覆盖真源。",
        "excluded" => ["design/gallery/**", "docs/02-components.md"],
    "specAliases" => { "WDPullToRefresh" => "WDPullRefresh" }
      },
      "counts" => {
        "components" => components.length,
        "contracts" => contracts.length,
        "formalSpecs" => specs.length,
        "formalRecipes" => RECIPE_IDS.length
      },
      "tokens" => tokens,
      "rules" => {
        "layout" => layout,
        "accessibility" => accessibility,
        "content" => content
      },
      "components" => components
    }
  end

  def extract_json
    stable_json(build)
  end
end

if $PROGRAM_NAME == __FILE__
  begin
    print ExtractDesign.extract_json
  rescue ExtractDesign::ExtractError => e
    warn "设计真源提取失败："
    e.issues.each { |issue| warn "  #{issue}" }
    exit 1
  rescue StandardError => e
    warn "设计真源提取失败：#{e.class}: #{e.message}"
    exit 1
  end
end
