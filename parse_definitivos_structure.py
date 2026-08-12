import pymupdf
import re

doc = pymupdf.open(r'C:\Users\crist\Downloads\Estatutos PRUANED definitivos.pdf')

cleaned_pages = []

for page_idx, page in enumerate(doc):
    pnum = page_idx + 1
    # Get blocks of text
    blocks = page.get_text("blocks")
    
    page_text_blocks = []
    for b in blocks:
        text = b[4].strip()
        # Filter out running header/footer items if needed, or identify them
        # Header on pages: “Por la inclusión de los animales en la gestión del riesgo de desastres” or page numbers
        if not text:
            continue
        page_text_blocks.append(text)
    
    cleaned_pages.append((pnum, page_text_blocks))

print(f"Parsed {len(cleaned_pages)} pages.")

# Write structured block dump
with open("c:/PRUANED/blocks_dump.txt", "w", encoding="utf-8") as f:
    for pnum, blocks in cleaned_pages:
        f.write(f"==================== PAGE {pnum} ====================\n")
        for b_idx, b in enumerate(blocks):
            f.write(f"--- Block {b_idx+1} ---\n{b}\n\n")

print("Wrote blocks_dump.txt")
