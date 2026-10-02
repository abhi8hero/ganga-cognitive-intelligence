# Theme Name: Neon Tech

# Vibe & Description:
High-saturation neon on a dark base, with glassmorphism glows and layered color gradients, creating a modern, energetic, cutting-edge digital tech feel.

# Color

- Use deep cinematic navy-blue as the overall background base; recommend `#040a1c` or a similar dark tone. Do not use pure white backgrounds, gray backgrounds, or black text.
- Use electric tech blue `#1173f2` as the primary color, paired with cyan `#22d3ee`, deep azure `#2563eb`, and ice `#7dd3fc` as accents.
- Use gradients for large visual emphasis: `from-sky-400 via-blue-500 to-indigo-500`, for buttons, title accents, decorative lines, and key numbers.
- Use a semi-transparent glass effect for cards: `bg-white/10`, `border-white/20`, with `text-white`, `text-white/80`, and `text-white/60` to preserve hierarchy.

# Font

- Use "Inter" as the title font (weight 700) to emphasize the tech feel and information hierarchy. (https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2)
- Use "Inter" as the body font (weight 400) and "JetBrains Mono" for data/code cells to keep it clear, modern, and readable. (https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2)

# Animation

- Use subtle scaling feedback when buttons or cards are tapped: `active:scale-95`, paired with enhanced colored shadows to create a clear touch response.
- When elements appear, use a "fade in + glow spread" effect; gradient accents can float slowly to create a dynamic tech atmosphere.
- Keep all interactions smooth: `transition-all duration-300`, avoiding abrupt shifts and traditional hard-edged shadows.

# Layout

- Build the page on a dark full-screen background, with a simple logo and primary action entry at the top, and vertically scrolling content below.
- Make the hero area stand out with a large title, subtitle, and main CTA, with blurred gradient glow orbs layered in the background to create a focal point.
- Present features, data, and reviews in vertically stacked glass cards, with generous spacing between cards and a clear mobile reading rhythm.

# Elements

- Use a purple-to-rose gradient background for buttons, with `rounded-2xl` corners and a colored glow shadow: `shadow-violet-500/30`.
- Use `rounded-3xl`, semi-transparent backgrounds, thin white borders, and `backdrop-blur-xl` for cards to create a floating glass feel.
- Use gradient text for key numbers, and add cyan, light purple, or rose accents to titles and icons.
- Use blurred colored spots, gradient lines, and semi-transparent overlays for background decoration, avoiding solid white cards, black text, and sharp corners.
## v1.1 — Layout & Flow Updates

- Landing page embeds the ingestion zone (drag & drop CSV/XLSX/JSON/TXT) directly below the hero "Upload Dataset" CTA; the standalone upload route is removed. Parsed preview cards offer "Open in Workspace".
- Process-flow steps render as rhombus (diamond) cards: a rotated-45 glass square with un-rotated centered icon/label content.
- Workspace sidebars toggle via VS Code-style edge chevron tabs ("<" tab on the left panel's inner edge, ">" tab on the right panel's inner edge); collapsed panels become 40px icon rails with an expand chevron. No panel toggles in the top bar.
- Intelligence Suite items carry a visible amber "Coming Soon" badge.
- Column normalization removes underscores ("first_name" → "First Name"); missing-value tokens ("N/A", "null", "-", "?") and odd datatypes in numeric/mixed columns are flagged by the error detector.
