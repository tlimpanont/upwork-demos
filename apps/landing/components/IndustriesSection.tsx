import type { SvgIconComponent } from "@mui/icons-material";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import PrecisionManufacturingRoundedIcon from "@mui/icons-material/PrecisionManufacturingRounded";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";
import LocalHospitalRoundedIcon from "@mui/icons-material/LocalHospitalRounded";
import AgricultureRoundedIcon from "@mui/icons-material/AgricultureRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";

const ICONS: Record<string, SvgIconComponent> = {
  factory: PrecisionManufacturingRoundedIcon,
  logistics: LocalShippingRoundedIcon,
  energy: BoltRoundedIcon,
  finance: AccountBalanceRoundedIcon,
  healthcare: LocalHospitalRoundedIcon,
  agriculture: AgricultureRoundedIcon,
  professional: GroupsRoundedIcon,
};

type IndustriesContent = {
  overline: string;
  heading: string;
  intro: string;
  items: readonly { name: string; note: string; icon: string }[];
};

export default function IndustriesSection({
  content,
}: {
  content: IndustriesContent;
}) {
  return (
    <Box
      component="section"
      id="industries"
      sx={{
        py: { xs: 8, md: 12 },
        borderTop: "1px solid",
        borderColor: "divider",
      }}
    >
      <Container>
        <Stack
          spacing={1.5}
          sx={{
            alignItems: "center",
            textAlign: "center",
            mb: { xs: 5, md: 7 },
          }}
        >
          <Typography
            variant="overline"
            sx={{
              color: "primary.light",
              letterSpacing: "0.18em",
              fontWeight: 700,
            }}
          >
            {content.overline}
          </Typography>
          <Typography
            variant="h2"
            sx={{ fontSize: { xs: "2rem", md: "2.75rem" } }}
          >
            {content.heading}
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ maxWidth: 640, fontSize: { xs: "1rem", md: "1.1rem" } }}
          >
            {content.intro}
          </Typography>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gap: { xs: 2, md: 3 },
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(4, 1fr)",
            },
          }}
        >
          {content.items.map((item) => {
            const Icon = ICONS[item.icon] ?? PrecisionManufacturingRoundedIcon;
            return (
              <Paper
                key={item.name}
                variant="outlined"
                sx={{
                  p: { xs: 2.5, md: 3 },
                  borderRadius: 3,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.5,
                  transition: "border-color 180ms ease, transform 180ms ease",
                  "&:hover": {
                    borderColor: "primary.light",
                    transform: "translateY(-2px)",
                  },
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    bgcolor: "rgba(165,180,252,0.14)",
                    color: "primary.light",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <Icon />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {item.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.note}
                </Typography>
              </Paper>
            );
          })}
        </Box>
      </Container>
    </Box>
  );
}
