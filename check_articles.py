with open("c:/PRUANED/blocks_dump.txt", "r", encoding="utf-8") as f:
    content = f.read()

# Let's search for Artículos in content
import re

articles_to_check = [
    "Artículo 10",
    "Artículo 12",
    "Artículo 15",
    "Artículo 19",
    "Artículo 30",
    "Artículo 71",
    "Artículo 72",
    "Artículo 75"
]

for art in articles_to_check:
    print(f"=== {art} ===")
    matches = [line for line in content.split("\n") if art in line or (art + "°") in line]
    for m in matches[:3]:
        print("  Found:", m[:120])
    print()
