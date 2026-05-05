import { collection, config, fields, singleton } from "@keystatic/core";

export default config({
  storage: { kind: "cloud" },
  cloud: { project: "theuy-limpanont/upwork-demos" },
  ui: {
    brand: { name: "Landing CMS" },
  },
  singletons: {
    hero: singleton({
      label: "Hero",
      path: "apps/landing/content/hero",
      format: { data: "yaml" },
      schema: {
        chip: fields.text({
          label: "Eyebrow chip",
          defaultValue: "Production-ready demos · built for clients",
        }),
        headingLead: fields.text({
          label: "Heading (regular)",
          defaultValue: "AI-Powered SaaS Systems",
        }),
        headingAccent: fields.text({
          label: "Heading (gradient)",
          defaultValue: "Ready for Production",
        }),
        subheading: fields.text({
          label: "Subheading",
          multiline: true,
          defaultValue:
            "Customer Support AI, Document Processing, and multi-tenant SaaS platforms — three working systems, one consistent stack, deployed on Vercel.",
        }),
        primaryCta: fields.object({
          label: fields.text({ label: "Label", defaultValue: "View Demos" }),
          href: fields.text({ label: "Href", defaultValue: "#demos" }),
        }, { label: "Primary CTA" }),
        secondaryCta: fields.object({
          label: fields.text({ label: "Label", defaultValue: "Book a Call" }),
          href: fields.text({ label: "Href", defaultValue: "#contact" }),
        }, { label: "Secondary CTA" }),
        techLabels: fields.array(
          fields.text({ label: "Label" }),
          {
            label: "Tech stack labels",
            itemLabel: (props) => props.value,
          }
        ),
        euRegionNote: fields.text({
          label: "EU-region note",
          multiline: true,
          defaultValue:
            "EU-region deployments available — Hetzner, AWS eu-central, Mistral",
        }),
      },
    }),

    services: singleton({
      label: "Services",
      path: "apps/landing/content/services",
      format: { data: "yaml" },
      schema: {
        overline: fields.text({ label: "Overline", defaultValue: "How I help" }),
        heading: fields.text({
          label: "Heading",
          defaultValue: "From idea to production-ready",
        }),
        intro: fields.text({
          label: "Intro",
          multiline: true,
          defaultValue:
            "Three things I'm hired for — and the patterns I bring with me, so you don't pay for me to invent the wheel each engagement.",
        }),
        items: fields.array(
          fields.object({
            title: fields.text({ label: "Title" }),
            price: fields.text({ label: "Price" }),
            duration: fields.text({ label: "Duration / scope" }),
            body: fields.text({ label: "Body", multiline: true }),
            bullets: fields.array(fields.text({ label: "Bullet" }), {
              label: "Bullets",
              itemLabel: (props) => props.value,
            }),
            icon: fields.select({
              label: "Icon",
              options: [
                { label: "Layers", value: "layers" },
                { label: "Psychology", value: "psychology" },
                { label: "Account tree", value: "accountTree" },
              ],
              defaultValue: "layers",
            }),
          }),
          {
            label: "Services",
            itemLabel: (props) => props.fields.title.value,
          }
        ),
      },
    }),

    demoShowcase: singleton({
      label: "Demo showcase",
      path: "apps/landing/content/demo-showcase",
      format: { data: "yaml" },
      schema: {
        overline: fields.text({
          label: "Overline",
          defaultValue: "Live capabilities",
        }),
        heading: fields.text({
          label: "Heading",
          defaultValue: "See the stack in production",
        }),
        intro: fields.text({
          label: "Intro",
          multiline: true,
          defaultValue:
            "Three real working systems built on the same patterns I ship to clients — customer-support AI, document processing, and multi-tenant SaaS — each running on the same Vercel + Postgres + AI stack I use in production.",
        }),
      },
    }),

    architecture: singleton({
      label: "Architecture",
      path: "apps/landing/content/architecture",
      format: { data: "yaml" },
      schema: {
        overline: fields.text({ label: "Overline", defaultValue: "Architecture" }),
        heading: fields.text({
          label: "Heading",
          defaultValue: "Boring stack, modern tools",
        }),
        intro: fields.text({
          label: "Intro",
          multiline: true,
          defaultValue:
            "One coherent stack across all three demos. Battle-tested infrastructure that scales to production without a rewrite.",
        }),
        layers: fields.array(
          fields.object({
            name: fields.text({ label: "Name" }),
            detail: fields.text({ label: "Detail" }),
            icon: fields.select({
              label: "Icon",
              options: [
                { label: "Cloud", value: "cloud" },
                { label: "Psychology", value: "psychology" },
                { label: "Hub", value: "hub" },
                { label: "Storage", value: "storage" },
                { label: "Inventory", value: "inventory" },
              ],
              defaultValue: "cloud",
            }),
            accent: fields.text({
              label: "Accent (hex)",
              defaultValue: "#FFFFFF",
            }),
          }),
          {
            label: "Layers",
            itemLabel: (props) => props.fields.name.value,
          }
        ),
      },
    }),

    faq: singleton({
      label: "FAQ",
      path: "apps/landing/content/faq",
      format: { data: "yaml" },
      schema: {
        overline: fields.text({
          label: "Overline",
          defaultValue: "Frequently asked",
        }),
        heading: fields.text({
          label: "Heading",
          defaultValue: "Things clients ask before booking",
        }),
        items: fields.array(
          fields.object({
            question: fields.text({ label: "Question" }),
            answer: fields.text({ label: "Answer", multiline: true }),
          }),
          {
            label: "Items",
            itemLabel: (props) => props.fields.question.value,
          }
        ),
      },
    }),

    trust: singleton({
      label: "Trust",
      path: "apps/landing/content/trust",
      format: { data: "yaml" },
      schema: {
        overline: fields.text({
          label: "Overline",
          defaultValue: "Why this matters",
        }),
        heading: fields.text({
          label: "Heading",
          defaultValue: "Demos that ship, not toys",
        }),
        points: fields.array(
          fields.object({
            icon: fields.select({
              label: "Icon",
              options: [
                { label: "Verified", value: "verified" },
                { label: "Trending up", value: "trendingUp" },
                { label: "Rocket launch", value: "rocketLaunch" },
              ],
              defaultValue: "verified",
            }),
            title: fields.text({ label: "Title" }),
            body: fields.text({ label: "Body", multiline: true }),
          }),
          {
            label: "Points",
            itemLabel: (props) => props.fields.title.value,
          }
        ),
      },
    }),

    cta: singleton({
      label: "CTA",
      path: "apps/landing/content/cta",
      format: { data: "yaml" },
      schema: {
        heading: fields.text({
          label: "Heading",
          defaultValue: "Let's build your system",
        }),
        body: fields.text({
          label: "Body",
          multiline: true,
          defaultValue:
            "Available for SaaS builds, AI integrations, and platform engineering work. Start with a 30-minute call — no pitch deck, just a working session.",
        }),
        primaryCta: fields.object({
          label: fields.text({ label: "Label", defaultValue: "Hire on Upwork" }),
          href: fields.text({
            label: "Href",
            defaultValue:
              "https://www.upwork.com/freelancers/~01e2fb2cd37f32f0ad?viewMode=1",
          }),
        }, { label: "Primary CTA" }),
        secondaryCta: fields.object({
          label: fields.text({ label: "Label", defaultValue: "Email me" }),
          href: fields.text({
            label: "Href",
            defaultValue: "mailto:theuy.limpanont@gmail.com",
          }),
        }, { label: "Secondary CTA" }),
      },
    }),
  },
  collections: {
    caseStudies: collection({
      label: "Case studies",
      slugField: "title",
      path: "apps/landing/content/case-studies/*",
      format: { contentField: "body" },
      entryLayout: "content",
      schema: {
        title: fields.slug({
          name: { label: "Title" },
          slug: { label: "Slug (URL)" },
        }),
        summary: fields.text({
          label: "Summary",
          multiline: true,
          description: "One- or two-sentence card preview.",
        }),
        client: fields.text({ label: "Client" }),
        stack: fields.array(fields.text({ label: "Tag" }), {
          label: "Stack tags",
          itemLabel: (props) => props.value,
        }),
        publishedAt: fields.date({ label: "Published" }),
        body: fields.markdoc({ label: "Body" }),
      },
    }),

  },
});