import { redirect } from "next/navigation";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { auth } from "@/lib/auth";
import ProfileForm from "./ProfileForm";
import PasswordForm from "./PasswordForm";

export default async function ProfileSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <Stack spacing={3} sx={{ maxWidth: 640 }}>
      <Card>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Typography variant="h6" gutterBottom>
            Profile
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "text.secondary", mb: 3 }}
          >
            Information shown to your teammates.
          </Typography>
          <ProfileForm
            defaultName={session.user.name ?? ""}
            email={session.user.email ?? ""}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Typography variant="h6" gutterBottom>
            Password
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "text.secondary", mb: 3 }}
          >
            Use a strong password you don&rsquo;t reuse anywhere else.
          </Typography>
          <PasswordForm />
        </CardContent>
      </Card>
    </Stack>
  );
}
