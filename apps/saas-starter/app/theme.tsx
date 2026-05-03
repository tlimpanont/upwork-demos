"use client";

import { forwardRef } from "react";
import NextLink, { type LinkProps as NextLinkProps } from "next/link";
import { createTheme } from "@mui/material/styles";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

type LinkBehaviorProps = Omit<NextLinkProps, "href"> & {
  href: NextLinkProps["href"];
};

const LinkBehavior = forwardRef<HTMLAnchorElement, LinkBehaviorProps>(
  function LinkBehavior(props, ref) {
    const { href, ...other } = props;
    return <NextLink ref={ref} href={href} {...other} />;
  },
);

const theme = createTheme({
  cssVariables: true,
  colorSchemes: { light: true, dark: true },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: inter.style.fontFamily,
    h1: { fontWeight: 700, letterSpacing: "-0.02em" },
    h2: { fontWeight: 700, letterSpacing: "-0.02em" },
    h3: { fontWeight: 600, letterSpacing: "-0.01em" },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  palette: {
    primary: { main: "#5B5BFE" },
    secondary: { main: "#0EA5E9" },
    success: { main: "#10B981" },
    warning: { main: "#F59E0B" },
    error: { main: "#EF4444" },
  },
  components: {
    MuiLink: { defaultProps: { component: LinkBehavior } },
    MuiButtonBase: { defaultProps: { LinkComponent: LinkBehavior } },
    MuiAppBar: {
      defaultProps: { elevation: 0, color: "inherit" },
      styleOverrides: {
        root: {
          backdropFilter: "saturate(180%) blur(8px)",
          borderBottom: "1px solid",
          borderColor: "var(--mui-palette-divider)",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: "1px solid",
          borderColor: "var(--mui-palette-divider)",
          backgroundImage: "none",
        },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0, variant: "outlined" },
      styleOverrides: { root: { borderRadius: 14 } },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 10 } },
    },
    MuiTextField: { defaultProps: { size: "small", fullWidth: true } },
    MuiTableCell: { styleOverrides: { head: { fontWeight: 600 } } },
  },
});

export default theme;
