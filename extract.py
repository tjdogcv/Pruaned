import sys

file_path = 'src/pages/intranet/PadronSocios.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

start = -1
end = -1
for i, line in enumerate(lines):
    if "export const SocioSearchSelect =" in line:
        start = i - 4 # To catch the huge block comment
    if start != -1 and i > start + 50 and "export default function PadronSocios" in line:
        end = i - 1
        break

if start != -1 and end != -1:
    component = lines[start:end]
    with open('src/components/SocioSearchSelect.jsx', 'w', encoding='utf-8') as f:
        f.write("import React, { useState, useRef, useEffect } from 'react';\n")
        f.write("import { Search, ChevronDown, X, Shield } from 'lucide-react';\n\n")
        f.writelines(component)
    
    # Remove from PadronSocios
    new_padron = lines[:start] + lines[end:]
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(new_padron)
    print("Extracted SocioSearchSelect")
else:
    print(f"Not found: {start} {end}")
