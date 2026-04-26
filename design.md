---

version: alpha
name: Obsidian OS
description: A premium, high-density financial services platform interface characterized by a sophisticated dark-mode aesthetic, serif-driven typography, and translucent layering.
colors:
  primary: #FFFFFF
  background: #1A1A1A
  surface: #262626
  accent: #0099FF
  text-secondary: rgba(255, 255, 255, 0.7)
  text-muted: rgba(255, 255, 255, 0.5)
  border: rgba(255, 255, 255, 0.1)
typography:
  family-serif: "Ivory Trial TT", "PT Serif", serif
  family-sans: "Inter", sans-serif
  h1: { size: 64px, weight: 300, family: "Ivory Trial TT" }
  body-md: { size: 16px, weight: 400, family: "Inter" }
  nav-link: { size: 14px, weight: 400, family: "Inter" }
spacing:
  base: 8px
  container-max: 1200px
  section-gap: 80px
rounded:
  button: 50px
  card: 24px
  pill: 100px
components:
  primary-button:
    backgroundColor: "{colors.border}"
    backdropFilter: "blur(34px)"
    borderRadius: "{rounded.button}"
    padding: "12px 24px"
    textColor: "{colors.primary}"
  nav-item:
    opacity: 0.7
    transition: "opacity 0.2s ease"

---

##

Overview

Obsidian OS presents a visual identity rooted in precision and luxury. The interface utilizes a deep monochromatic foundation—primarily dark grays and blacks—punctuated by high-contrast white typography. The tone is professional yet forward-thinking, employing heavy use of Gaussian blur (glassmorphism) and subtle gradients to suggest depth. Layout density is moderately high, utilizing slim line weights and delicate serif headers to evoke the feel of a premium digital terminal or an editorial financial report.

##

Colors

The palette is dominated by dark neutrals. The background is a solid
`#1A1A1A`
, providing a stable base for layered components. Foreground surfaces use varying levels of transparency, such as
`rgba(255, 255, 255, 0.1)`
, to create hierarchical separation without adding solid mass. Pure white
`#FFFFFF`
is reserved for primary text and high-visibility icons. A semantic accent of
`#0099FF`
is used sparingly for interactive links and focus states, ensuring they stand out against the monochromatic environment.

##

Typography

The typography is a sophisticated mix of traditional and modern. Large-scale headings utilize the
**
Ivory Trial TT
**
or
**
PT Serif
**
families in light weights (300) to convey authority and elegance. Secondary text and functional UI elements use
**
Inter
**
, providing maximum legibility at smaller scales. Navigation and metadata often appear in 14px or 16px Inter with reduced opacity (50% to 70%) to maintain a clear information hierarchy.

##

Layout

The layout follows a centered container pattern with a maximum width of 1200px. Content is organized into distinct vertical sections separated by generous 80px gaps. Grid structures are flexible, often moving from three-column feature blocks to full-width editorial sections. Alignment is strictly clean, relying on generous negative space and centered text blocks for hero content to create a sense of scale.

##

Elevation & Depth

Depth is achieved through layering and material properties rather than traditional drop shadows. Surfaces utilize
`backdrop-filter: blur(34px)`
to create a semi-transparent "glass" effect, allowing background colors to bleed through while maintaining readability. Subtle 1px borders in
`rgba(255, 255, 255, 0.1)`
define component boundaries, creating a structural look that feels etched or thin-shelled.

##

Shapes

The visual language favors organic, ultra-rounded geometry. Buttons and interactive containers use a 50px radius, essentially creating pill shapes. Section containers and larger cards utilize a 24px corner radius. Icons and small geometric accents (like the Obsidian logo mark) use circular and interlocking paths, reinforcing a theme of connectivity and flow.

##

Components

###

Navigation Bar

A floating top-level component characterized by a blur-treated surface and low-contrast borders. It contains high-detail SVG logo marks and slim-font navigation links.

###

Glass Button

A primary call-to-action component featuring a translucent background (
`rgba(255, 255, 255, 0.1)`
) and high-radius corners. It relies on the backdrop-blur to maintain visibility against varying backgrounds.

###

Content Cards

Cards are defined by their 1px subtle borders and rounded corners. They often feature an opacity-driven hover state, where the surface becomes slightly more prominent or text shifts from 70% to 100% opacity.

##

Do's and Don'ts

- **
  Do
  **
  use high-transparency glass surfaces for secondary UI elements.
- **
  Do
  **
  maintain high contrast between primary white text and the dark background.
- **
  Do
  **
  leverage serif fonts for editorial headings to preserve the premium brand feel.
- **
  Don't
  **
  use heavy, solid drop shadows; rely on border contrast and blur instead.
- **
  Don't
  **
  introduce vibrant secondary colors; stick to the monochromatic and blue-accent palette.
- **
  Don't
  **
  use sharp corners; adhere to the established rounded and pill-shaped geometry.

##

Accessibility

Text contrast is maintained primarily through the use of pure white on near-black backgrounds, which exceeds standard contrast ratios. Interactive targets like buttons and navigation items follow a generous height and padding rule. Focus visibility is handled through subtle opacity shifts or the primary blue accent. The choice of Inter for body copy ensures readability for users with visual impairments despite the overall dark aesthetic.

##
