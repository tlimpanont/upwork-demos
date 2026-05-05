import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";

type FAQContent = {
  overline: string;
  heading: string;
  items: readonly {
    question: string;
    answer: string;
  }[];
};

export default function FAQSection({ content }: { content: FAQContent }) {
  return (
    <Box
      component="section"
      id="faq"
      sx={{
        py: { xs: 8, md: 12 },
        borderTop: "1px solid",
        borderColor: "divider",
      }}
    >
      <Container maxWidth="md">
        <Stack
          spacing={1.5}
          sx={{ alignItems: "center", textAlign: "center", mb: { xs: 5, md: 7 } }}
        >
          <Typography
            variant="overline"
            sx={{ color: "primary.light", letterSpacing: "0.18em", fontWeight: 700 }}
          >
            {content.overline}
          </Typography>
          <Typography variant="h2" sx={{ fontSize: { xs: "2rem", md: "2.75rem" } }}>
            {content.heading}
          </Typography>
        </Stack>

        <Stack spacing={1.5}>
          {content.items.map(({ question, answer }) => (
            <Accordion
              key={question}
              disableGutters
              square={false}
              elevation={0}
              sx={{
                bgcolor: "transparent",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                "&:before": { display: "none" },
                "&.Mui-expanded": { borderColor: "primary.light" },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreRoundedIcon sx={{ color: "primary.light" }} />}
                sx={{
                  px: { xs: 2.5, md: 3 },
                  py: 0.5,
                  "& .MuiAccordionSummary-content": { my: 1.5 },
                }}
              >
                <Typography sx={{ fontWeight: 600 }}>{question}</Typography>
              </AccordionSummary>
              <AccordionDetails
                sx={{
                  px: { xs: 2.5, md: 3 },
                  pb: 2.5,
                  pt: 0,
                  color: "text.secondary",
                }}
              >
                <Typography sx={{ lineHeight: 1.7 }}>{answer}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>
      </Container>
    </Box>
  );
}
