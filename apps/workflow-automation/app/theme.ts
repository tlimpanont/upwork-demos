"use client";

import { createTheme } from "@mui/material/styles";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"], display: "swap" });

const theme = createTheme({
  cssVariables: { colorSchemeSelector: "data" },
  colorSchemes: {
    dark: {
      palette: {
        primary: { main: "#7C3AED", light: "#C4B5FD", dark: "#5B21B6", contrastText: "#FFFFFF" },
        secondary: { main: "#38BDF8", light: "#7DD3FC" },
        success: { main: "#34D399", light: "#6EE7B7" },
        warning: { main: "#FBBF24", light: "#FCD34D" },
        error: { main: "#F87171" },
        background: { default: "#0B0F19", paper: "#11151F" },
        text: {
          primary: "#FFFFFF",
          secondary: "rgba(255, 255, 255, 0.72)",
          disabled: "rgba(255, 255, 255, 0.5)",
        },
        divider: "rgba(255, 255, 255, 0.12)",
      },
    },
    light: {
      palette: {
        primary: { main: "#7C3AED", light: "#6D28D9", dark: "#5B21B6", contrastText: "#FFFFFF" },
        secondary: { main: "#0284C7", light: "#38BDF8" },
        success: { main: "#059669", light: "#34D399" },
        warning: { main: "#D97706", light: "#FBBF24" },
        error: { main: "#DC2626" },
        background: { default: "#FFFFFF", paper: "#F8FAFC" },
        text: {
          primary: "#0B0F19",
          secondary: "rgba(11, 15, 25, 0.7)",
          disabled: "rgba(11, 15, 25, 0.45)",
        },
        divider: "rgba(11, 15, 25, 0.12)",
      },
    },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: inter.style.fontFamily,
    h1: { fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.05 },
    h2: { fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.1 },
    h3: { fontWeight: 700, letterSpacing: "-0.02em" },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600 },
    body1: { lineHeight: 1.65 },
  },
});

export default theme;
