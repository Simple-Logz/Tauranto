export const colors = {
  ink: "#0B0F0D",
  inkSoft: "#48524D",
  muted: "#747C83",
  leaf: "#00D084",
  leafDeep: "#00A96F",
  leafDark: "#08785A",
  // Deep green for headings, prices, and text/icons that need to read on a
  // white card — consolidates ~15 near-identical dark greens that had drifted
  // across screens (#174D2E, #287345, #176B4D, #34734B, #315B3D, and more).
  leafInk: "#174D2E",
  leafPale: "#E8FFF5",
  leafMist: "#F3FFF9",
  // Saturated pale green for chip/badge/highlight backgrounds — consolidates
  // #DFF7B4, #C9EEDD, #BFEAD5, #BFECD7, #CDE2D1 and similar one-off tints.
  leafTint: "#DFF7B4",
  tomato: "#F06B45",
  tomatoDeep: "#D95634",
  tomatoPale: "#FFF0E9",
  saffron: "#F2B84B",
  saffronPale: "#FFF4D8",
  cream: "#FFFFFF",
  warmWhite: "#FFFFFF",
  paper: "#FFFFFF",
  line: "#E0E5E3",
  blue: "#5B7595",
  lavender: "#756889",
  black: "#101710",
};

// Shared type scale. Every screen had picked its own one-off font sizes for
// what are really the same handful of text roles (a "kicker/eyebrow" label
// ranged from 8 to 11 across screens; page titles ranged from 25 to 38 with
// no clear logic). These five roles are the canonical set going forward —
// screens should reach for `type.eyebrow`/`type.title`/etc. instead of
// inventing a new fontSize/letterSpacing pair.
export const type = {
  eyebrow: { fontFamily: "NunitoSans_900Black", fontSize: 10, letterSpacing: 1.6 },
  display: { fontFamily: "NunitoSans_900Black", fontSize: 34, letterSpacing: -1.1 },
  title: { fontFamily: "NunitoSans_900Black", fontSize: 25, letterSpacing: -0.6 },
  subtitle: { fontFamily: "NunitoSans_700Bold", fontSize: 14, lineHeight: 20 },
  body: { fontFamily: "NunitoSans_600SemiBold", fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: "NunitoSans_600SemiBold", fontSize: 11, lineHeight: 16 },
};

// Canonical dark-mode surface set. HomeScreen had already worked these
// exact values out for its own dark variant before the rest of the app
// started ignoring the appearance preference entirely — every other screen
// should reach for these same six roles rather than inventing its own dark
// hex codes, so the whole app reads as one consistent dark theme instead of
// a patchwork of screens that each guessed independently.
export const darkColors = {
  bg: "#101512",
  surface: "#171D19",
  card: "#161C18",
  cardAlt: "#1B2320",
  border: "#2B342F",
  borderSoft: "#232B26",
  text: "#F4F8F5",
  textSoft: "#C7D2CC",
  textMuted: "#8FA49A",
  circle: "#222A25",
  circleBorder: "#39443E",
};

export const radius = { sm: 12, md: 18, lg: 24, xl: 30, xxl: 38, pill: 999 };
export const shadow = {
  shadowColor: "#18231E",
  shadowOpacity: 0.11,
  shadowRadius: 22,
  shadowOffset: { width: 0, height: 10 },
  elevation: 4,
};
export const shadowSoft = {
  shadowColor: "#18231E",
  shadowOpacity: 0.055,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 5 },
  elevation: 2,
};
