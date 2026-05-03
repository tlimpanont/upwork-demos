import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import SettingsTabs from "./SettingsTabs";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box>
      <Stack spacing={1} sx={{ mb: 2 }}>
        <Typography variant="h5" component="h1">
          Settings
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Manage your profile and workspace.
        </Typography>
      </Stack>
      <SettingsTabs />
      {children}
    </Box>
  );
}
