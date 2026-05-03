"use client";

import { createTheme } from "@mui/material/styles";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

const theme = createTheme({
  cssVariables: true,
  colorSchemes: {
    dark: {
      palette: {
        // primary.main is the same indigo used on buttons (white text → 5.5:1).
        // primary.light is the vibrant decorative shade for chips/icons/gradients
        // where 3:1 contrast on dark surfaces is enough.
        primary: {
          main: "#4F46E5",
          light: "#A5B4FC",
          dark: "#3730A3",
          contrastText: "#FFFFFF",
        },
        secondary: { main: "#38BDF8", light: "#7DD3FC" },
        success: { main: "#34D399", light: "#6EE7B7" },
        warning: { main: "#FBBF24", light: "#FCD34D" },
        error: { main: "#F87171" },
        background: {
          default: "#0B0F19",
          paper: "#11151F",
        },
        text: {
          primary: "#FFFFFF",
          secondary: "rgba(255, 255, 255, 0.72)",
          disabled: "rgba(255, 255, 255, 0.5)",
        },
        divider: "rgba(255, 255, 255, 0.12)",
        action: {
          hover: "rgba(255, 255, 255, 0.06)",
          selected: "rgba(255, 255, 255, 0.10)",
        },
      },
    },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: inter.style.fontFamily,
    h1: { fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.05 },
    h2: { fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.1 },
    h3: { fontWeight: 700, letterSpacing: "-0.02em" },
    h4: { fontWeight: 700, letterSpacing: "-0.015em" },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600 },
    body1: { lineHeight: 1.65 },
  },
  components: {
    MuiCard: {
      defaultProps: { elevation: 0, variant: "outlined" },
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundImage: "none",
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 10, paddingInline: 20, paddingBlock: 10 },
        sizeLarge: { paddingInline: 24, paddingBlock: 13, fontSize: "1rem" },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0, color: "transparent", position: "sticky" },
      styleOverrides: {
        root: {
          backgroundColor: "rgba(11, 15, 25, 0.72)",
          backdropFilter: "saturate(180%) blur(12px)",
          borderBottom: "1px solid var(--mui-palette-divider)",
        },
      },
    },
    MuiContainer: {
      defaultProps: { maxWidth: "lg" },
    },
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: "none" } },
    },
  },
});

export default theme;
