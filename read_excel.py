import zipfile
import xml.etree.ElementTree as ET
import re

def get_shared_strings(zip_file):
    try:
        with zip_file.open('xl/sharedStrings.xml') as f:
            tree = ET.parse(f)
            root = tree.getroot()
            ns = {'': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
            strings = []
            for si in root.findall('.//si', ns):
                t = si.find('.//t', ns)
                if t is not None:
                    strings.append(t.text or '')
            return strings
    except:
        return []

def col_to_num(col):
    num = 0
    for c in col:
        num = num * 26 + (ord(c) - ord('A') + 1)
    return num - 1

def parse_sheet(zip_file, sheet_name, shared_strings):
    with zip_file.open(f'xl/worksheets/{sheet_name}') as f:
        tree = ET.parse(f)
        root = tree.getroot()
        ns = {'': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
        
        rows_data = {}
        for row in root.findall('.//row', ns):
            r = row.get('r')
            if not r:
                continue
            row_num = int(r)
            rows_data[row_num] = {}
            
            for cell in row.findall('.//c', ns):
                cell_ref = cell.get('r')
                if not cell_ref:
                    continue
                match = re.match(r'([A-Z]+)(\d+)', cell_ref)
                if match:
                    col = match.group(1)
                    col_num = col_to_num(col)
                    
                    v = cell.find('.//v', ns)
                    if v is not None and v.text:
                        cell_type = cell.get('t')
                        if cell_type == 's':
                            idx = int(v.text)
                            if idx < len(shared_strings):
                                rows_data[row_num][col_num] = shared_strings[idx]
                        else:
                            rows_data[row_num][col_num] = v.text
        
        return rows_data

zip_file = zipfile.ZipFile('AVIVA喀麦隆.xlsx')
shared_strings = get_shared_strings(zip_file)

with zip_file.open('xl/workbook.xml') as f:
    tree = ET.parse(f)
    root = tree.getroot()
    ns = {'': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    sheets = []
    for sheet in root.findall('.//sheet', ns):
        sheets.append({
            'name': sheet.get('name'),
            'id': sheet.get('sheetId'),
            'rid': sheet.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')
        })

with open('kamainong.md', 'w', encoding='utf-8') as md:
    md.write('# AVIVA喀麦隆 数据整理\n\n')
    
    for sheet_info in sheets:
        sheet_name = f"sheet{sheet_info['id']}.xml"
        md.write(f"## {sheet_info['name']}\n\n")
        
        rows_data = parse_sheet(zip_file, sheet_name, shared_strings)
        
        if rows_data:
            max_row = max(rows_data.keys())
            max_col = max(max(row.keys()) if row else 0 for row in rows_data.values())
            
            for row_num in sorted(rows_data.keys())[:50]:
                row = rows_data[row_num]
                if row:
                    cells = []
                    for col_num in range(max_col + 1):
                        cells.append(row.get(col_num, ''))
                    md.write('| ' + ' | '.join(str(c) for c in cells) + ' |\n')
            
            md.write('\n')

zip_file.close()
print('完成！已生成 kamainong.md')
