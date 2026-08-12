import sys

with open(r'c:\PRUANED\definitivos_clean.txt', encoding='utf-8') as f:
    text = f.read()

pages = text.split('--- PAGE ')
for p in pages:
    if not p.strip():
        continue
    lines = p.strip().split('\n')
    header = lines[0] if lines else ""
    print(f"PAGE {header}")
    # Print first few lines and last few lines
    for line in lines[1:6]:
        print("  ", line[:100])
    if len(lines) > 6:
        print("   ...")
        for line in lines[-5:]:
            print("  ", line[:100])
    print("="*60)
