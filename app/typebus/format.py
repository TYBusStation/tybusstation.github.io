import json
import re
from functools import cmp_to_key

def parse_route(route):
    route_type = 'UNKNOWN'
    base_num = None
    base_str = None
    suffix_alpha = ''
    suffix_numeric = ''
    suffix_special = ''
    suffix_parenthesis = ''

    main_part = route

    # 處理括號 Suffix Parenthesis
    if '(' in route:
        match = re.match(r'^(.*?)\((.*)\)$', route)
        if match:
            main_part = match.group(1)
            suffix_parenthesis = f"({match.group(2)})"

    # 1. SPECIAL_PREFIX: 數字 + [東西南北]
    special_prefix_match = re.match(r'^(\d+)([東西南北])$', main_part)
    if special_prefix_match:
        route_type = 'SPECIAL_PREFIX'
        base_num = int(special_prefix_match.group(1))
        suffix_special = special_prefix_match.group(2)

    # 2. T Route: T + 數字 + 字母
    elif main_part.startswith('T'):
        match = re.match(r'^T(\d+)([A-Z]*)', main_part)
        if match:
            route_type = 'T'
            base_num = int(match.group(1))
            suffix_alpha = match.group(2) or ''
        else:
            route_type = 'ALPHA'
            base_str = main_part

    # 3. NUMERIC: 數字開頭
    elif re.match(r'^\d', main_part):
        route_type = 'NUMERIC'
        match = re.match(r'^(\d+)(.*)', main_part)
        if match:
            base_num = int(match.group(1))
            remaining = match.group(2) or ''
            suffix_match = re.match(r'^([A-Z]*)(.*)', remaining)
            if suffix_match:
                suffix_alpha = suffix_match.group(1) or ''
                suffix_special = suffix_match.group(2) or ''

    # 4. ALPHA: 字母開頭
    else:
        route_type = 'ALPHA'
        match = re.match(r'^([A-Z]+)(\d*)([A-Z]*)(.*)', main_part)
        if match:
            base_str = match.group(1)
            suffix_numeric = match.group(2) or ''
            suffix_alpha = match.group(3) or ''
            suffix_special = match.group(4) or ''
        else:
            base_str = main_part

    return {
        'original': route,
        'type': route_type,
        'baseNum': base_num,
        'baseStr': base_str,
        'suffixAlpha': suffix_alpha,
        'suffixNumeric': suffix_numeric,
        'suffixSpecial': suffix_special,
        'suffixParenthesis': suffix_parenthesis,
    }

def get_special_suffix_order(suffix):
    if not suffix: return 0
    mapping = {
        '區': 1, '副': 2, '直': 3, '快': 4,
        '夜': 5, '通勤': 6, '延': 7
    }
    if suffix in mapping:
        return mapping[suffix]
    if suffix.startswith('經'):
        return 8
    return 99

def compare_routes(a_name, b_name):
    if a_name == b_name: return 0
    pa = parse_route(a_name)
    pb = parse_route(b_name)

    # Type Order
    type_priority = {'SPECIAL_PREFIX': 0, 'NUMERIC': 1, 'ALPHA': 2, 'T': 3, 'UNKNOWN': 4}

    cp_type = type_priority.get(pa['type'], 4) - type_priority.get(pb['type'], 4)
    if cp_type != 0: return cp_type

    # Base Comparison (Numeric or String)
    if pa['baseNum'] is not None and pb['baseNum'] is not None:
        cp_base = pa['baseNum'] - pb['baseNum']
        if cp_base != 0: return cp_base
    elif pa['baseStr'] is not None and pb['baseStr'] is not None:
        if pa['baseStr'] < pb['baseStr']: return -1
        if pa['baseStr'] > pb['baseStr']: return 1

    # Suffix Alpha
    if pa['suffixAlpha'] != pb['suffixAlpha']:
        return -1 if pa['suffixAlpha'] < pb['suffixAlpha'] else 1

    # Special Suffix Order
    cp_spec_order = get_special_suffix_order(pa['suffixSpecial']) - get_special_suffix_order(pb['suffixSpecial'])
    if cp_spec_order != 0: return cp_spec_order

    # Special Suffix String
    if pa['suffixSpecial'] != pb['suffixSpecial']:
        return -1 if pa['suffixSpecial'] < pb['suffixSpecial'] else 1

    # Suffix Numeric
    val_a = int(pa['suffixNumeric']) if pa['suffixNumeric'] else 0
    val_b = int(pb['suffixNumeric']) if pb['suffixNumeric'] else 0
    if val_a != val_b: return val_a - val_b

    # Parenthesis
    if pa['suffixParenthesis'] < pb['suffixParenthesis']: return -1
    if pa['suffixParenthesis'] > pb['suffixParenthesis']: return 1

    return 0

def sort_bus_data(input_file, output_file=None):
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)

        for category in data:
            if 'routes' in category:
                # 使用自定義排序規則
                category['routes'].sort(key=cmp_to_key(lambda x, y: compare_routes(x['name'], y['name'])))

        if output_file:
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=4)
            print(f"排序完成，已存至: {output_file}")
        else:
            print(json.dumps(data, ensure_ascii=False, indent=4))

    except Exception as e:
        print(f"發生錯誤: {e}")

if __name__ == "__main__":
    # 使用方式
    FILE_NAME = "data.json"  # 請確保你的檔案名稱正確
    sort_bus_data(FILE_NAME, "data.json")