import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CreateOrgForm from "./CreateOrgForm";

export default function NewOrganizationPage() {
  return (
    <Box sx={{ maxWidth: 520, mx: "auto" }}>
      <Stack spacing={1} sx={{ mb: 3 }}>
        <Typography variant="h5" component="h1">
          Create a new workspace
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Each workspace is fully isolated, with its own members, billing, and data.
        </Typography>
      </Stack>
      <Card>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <CreateOrgForm />
        </CardContent>
      </Card>
    </Box>
  );
}
