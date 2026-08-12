---
name: ui-ux-pro-max
description: Pro-level UI/UX design rules, layout systems, aesthetic guidelines, color harmonies, bento grids, glassmorphism, typography scales, micro-interactions, and accessibility standards for creating stunning web applications.
---

# UI/UX Pro Max Skill

Guidelines for crafting world-class, visual design experiences:

## 1. Visual Hierarchy & Typography Scale
- Display Headings: Font family `Outfit`, `Plus Jakarta Sans`, or `Inter`. Font weights 700-900 with negative letter spacing (`tracking-tight`).
- Contrast: Distinct visual scale between titles (`3.5rem+`), subheaders (`1.5rem`), body copy (`0.95rem`), and subtle metadata (`0.75rem`).
- Gradient Text: Use subtle multi-stop text gradients for primary keywords (`bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-emerald-400 to-teal-300`).

## 2. Layout & Bento Grids
- Use bento-box grid layouts for features and technical divisions.
- Variable card sizes: Hero cards (span 2 cols or 2 rows) paired with compact detail cards.
- Border radius: Harmonious rounded corners (`rounded-2xl` to `rounded-3xl`).
- Subtle Borders: Use translucent borders (`border border-white/10` or `border-slate-800`) to define separation without heavy shadows.

## 3. Color Harmony & Glassmorphism
- Dark Mode Base: Deep slate/midnight background (`#030712`, `#0B132B`).
- Primary Accent Colors: Tailored emergency palette matching PRUANED shield:
  - Safety Emerald: `#10B981`
  - Ocean Blue: `#0EA5E9`
  - Emergency Red/Amber: `#EF4444`, `#F59E0B`
  - Earth Gold: `#D97706`
- Glass Backdrop: Translucent panels (`bg-slate-900/80 backdrop-blur-xl border border-slate-800/80`).

## 4. Micro-Interactions & Feedback
- Interactive hover transitions (`hover:-translate-y-1.5 hover:shadow-2xl transition-all duration-300 ease-out`).
- Glow effects: Subtle radial gradients behind key elements (`bg-blue-500/10 blur-3xl`).
- Active status pills: Color-coded badges with glowing icons.
