export const demonTheme = {
  colors: {
    background: "#000000",
    surface: "rgba(255,255,255,0.06)",       // glass panel base
    surfaceHover: "rgba(255,255,255,0.10)",
    border: "rgba(255,255,255,0.15)",
    dotPrimary: "#FFFFFF",
    outline: "#FFFFFF",
    accent: "#FFFFFF",                        // no color accent — emphasis via opacity/glow only
    graticule: "rgba(255,255,255,0.25)",      // Globe grid lines, dimmed white
    textPrimary: "#FFFFFF",
    textSecondary: "rgba(255,255,255,0.55)",
    textMuted: "rgba(255,255,255,0.30)",
  },
  fonts: {
    heading: "Orbitron",
    body: "Inter",
    mono: "JetBrains Mono",
  },
  motion: {
    glowPulse: "2s ease-in-out infinite",
    gridReactRadius: 200,
    globeRotationSpeed: 2,
  },
} as const;
