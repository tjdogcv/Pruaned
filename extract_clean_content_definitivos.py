import pymupdf
import re

doc = pymupdf.open(r'C:\Users\crist\Downloads\Estatutos PRUANED definitivos.pdf')

clean_paragraphs = []

for page_idx, page in enumerate(doc):
    pnum = page_idx + 1
    blocks = page.get_text("blocks")
    
    for b in blocks:
        text = b[4].strip()
        if not text:
            continue
        
        # Strip header quote if standalone block
        if text.replace("“", "").replace("”", "").replace('"', '').strip() == "Por la inclusión de los animales en la gestión del riesgo de desastres":
            continue
        
        # Strip standalone page numbers
        if text.isdigit() and int(text) == pnum:
            continue
        
        # Stop at signatures section on page 20/21
        if "Testigo 1" in text or "Testigo 2" in text or "Ministro de Fe" in text or "Firma y Timbre" in text:
            continue
        
        clean_paragraphs.append((pnum, text))

print(f"Extracted {len(clean_paragraphs)} clean text blocks across all pages.")

# Save to file for verification
with open("c:/PRUANED/extracted_definitivos_blocks.txt", "w", encoding="utf-8") as f:
    for pnum, btext in clean_paragraphs:
        f.write(f"[Page {pnum}]\n{btext}\n\n")

print("Saved extracted_definitivos_blocks.txt")
