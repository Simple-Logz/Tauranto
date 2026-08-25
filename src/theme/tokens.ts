export const colors = {
  // Updated to the "Tauranto High-Performance" reference's near-black
  // on-surface pair (was #0B0F0D/#48524D) — same role, exact reference hex.
  ink: "#181D19",
  inkSoft: "#3E4A41",
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
  // Page background is a warm off-white, one shade below the pure-white card
  // surface (`paper`) — that faint contrast plus a thin border is what now
  // defines a card, instead of a heavy drop shadow. Matches the flat,
  // data-dense SaaS look (warm gray page, crisp white bordered cards) the
  // account settled on as its visual reference, in place of the earlier
  // deeper-shadow "floating card" treatment.
  cream: "#FAFBF9",
  warmWhite: "#FAFBF9",
  paper: "#FFFFFF",
  line: "#DEE5E0",
  blue: "#5B7595",
  lavender: "#756889",
  black: "#101710",
  // Added adopting the "Tauranto High-Performance" reference design system
  // (Google Stitch mockups, Aug 2026): a brighter "active" green reserved
  // for nav/trend states, a vivid AI/voice lavender pair, and the tinted
  // stat-tile surface used by the home dashboard's bento grid.
  activeMint: "#28A96B",
  lavenderAi: "#6D56B3",
  lavenderPale: "#ECDCFF",
  surfaceLow: "#F0F5EF",
};

// Semantic status palette — the one place every risk/state pill across the
// app should draw its colors from, instead of each screen inventing its own
// red/amber/green. Mirrors a standard risk-register convention (high/medium/
// low + a neutral "in review" blue) rather than the ad hoc badge colors that
// had drifted per screen.
export const status = {
  critical: { bg: "#F6D2CD", fg: "#96281F" },
  high: { bg: "#FBE4E1", fg: "#C0392B" },
  medium: { bg: "#FDECC8", fg: "#B7791F" },
  low: { bg: "#E3F5E7", fg: "#1E8A4C" },
  info: { bg: "#E4EEFC", fg: "#2B5FCC" },
  neutral: { bg: "#F1F1EE", fg: "#6F786F" },
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

// Tightened from the original 12/18/24/30/38 scale — a flat SaaS dashboard
// reads as more precise/professional with a smaller, more restrained corner
// radius than a consumer app's fuller rounding.
export const radius = { sm: 10, md: 14, lg: 18, xl: 22, xxl: 28, pill: 999 };
// Deliberately faint now (was 0.11/22/10) — cards are meant to be defined by
// the `line` border + the `paper`-on-`cream` surface contrast, the same as
// the flat, barely-there card depth in the account's chosen reference, not
// by a heavy drop shadow.
export const shadow = {
  shadowColor: "#18231E",
  shadowOpacity: 0.05,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 3 },
  elevation: 1,
};
export const shadowSoft = {
  shadowColor: "#18231E",
  shadowOpacity: 0.03,
  shadowRadius: 7,
  shadowOffset: { width: 0, height: 2 },
  elevation: 1,
};
