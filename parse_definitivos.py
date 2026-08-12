import pymupdf

doc = pymupdf.open(r'C:\Users\crist\Downloads\Estatutos PRUANED definitivos.pdf')
print(f"Total pages in definitivos.pdf: {len(doc)}")

full_text = []
for i, page in enumerate(doc):
    text = page.get_text()
    full_text.append(f"--- PAGE {i+1} ---\n{text}")

full_content = "\n".join(full_text)

with open(r'c:\PRUANED\definitivos_clean.txt', 'w', encoding='utf-8') as f:
    f.write(full_content)

print("Saved clean text to c:\\PRUANED\\definitivos_clean.txt")
