import pymupdf
import re

doc = pymupdf.open(r'C:\Users\crist\Downloads\Estatutos PRUANED definitivos.pdf')

pages_data = []
for i, page in enumerate(doc):
    lines = page.get_text().split('\n')
    pages_data.append((i+1, lines))

print(f"Total pages extracted: {len(pages_data)}")
# Write full raw text to file to inspect structure
with open("c:/PRUANED/definitivos_dump_full.txt", "w", encoding="utf-8") as f:
    for pnum, lines in pages_data:
        f.write(f"=== PAGE {pnum} ===\n")
        for line in lines:
            f.write(line + "\n")

print("Full text dumped to c:/PRUANED/definitivos_dump_full.txt")
