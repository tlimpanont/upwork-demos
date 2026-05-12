"use client";

import { useState } from "react";
import Link from "next/link";
import IconButton from "@mui/material/IconButton";
import Drawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import { CAL_URL, withUtm } from "@/lib/utm";

const NAV_ITEMS = [
  { label: "Services", href: "/#services" },
  { label: "Work", href: "/#demos" },
  { label: "Case studies", href: "/case-studies" },
  { label: "Contact", href: "/contact" },
];

export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <IconButton
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        edge="end"
        sx={{ color: "text.primary" }}
      >
        <MenuRoundedIcon />
      </IconButton>
      <Drawer
        anchor="right"
        open={open}
        onClose={close}
        slotProps={{
          paper: {
            sx: {
              bgcolor: "background.default",
              backgroundImage: "none",
              width: { xs: "100%", sm: 360 },
            },
          },
        }}
      >
        <Box
          sx={{
            p: 3,
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          <Stack
            direction="row"
            sx={{
              alignItems: "center",
              justifyContent: "space-between",
              mb: 4,
            }}
          >
            <Stack
              direction="row"
              spacing={1.25}
              sx={{ alignItems: "center" }}
              component={Link}
              href="/"
              onClick={close}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 1.5,
                  background: "linear-gradient(135deg,#A5B4FC,#7DD3FC)",
                  display: "grid",
                  placeItems: "center",
                  color: "#0B0F19",
                }}
              >
                <BoltRoundedIcon sx={{ fontSize: 20 }} />
              </Box>
              <Typography
                variant="h6"
                sx={{ fontWeight: 800, letterSpacing: "-0.01em" }}
              >
                Theuy Limpanont
              </Typography>
            </Stack>
            <IconButton
              onClick={close}
              aria-label="Close menu"
              sx={{ color: "text.primary" }}
            >
              <CloseRoundedIcon />
            </IconButton>
          </Stack>

          <Stack spacing={0} sx={{ flexGrow: 1 }}>
            {NAV_ITEMS.map((item) => (
              <Typography
                key={item.href}
                component={Link}
                href={item.href}
                onClick={close}
                sx={{
                  fontSize: "1.25rem",
                  fontWeight: 600,
                  color: "text.primary",
                  textDecoration: "none",
                  py: 2,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  display: "block",
                  "&:hover": { color: "primary.light" },
                }}
              >
                {item.label}
              </Typography>
            ))}
          </Stack>

          <Box sx={{ pt: 3 }}>
            <Button
              fullWidth
              size="large"
              variant="contained"
              href={withUtm(CAL_URL, {
                campaign: "mobile-menu",
                content: "book-a-call",
              })}
              startIcon={<CalendarMonthRoundedIcon />}
              onClick={close}
            >
              Book a call
            </Button>
          </Box>
        </Box>
      </Drawer>
    </>
  );
}
