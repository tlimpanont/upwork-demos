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
          defaultValue: "Enterprise AI · Custom software · Production-ready",
        }),
        headingLead: fields.text({
          label: "Heading (regular)",
          defaultValue: "Enterprise AI and",
        }),
        headingAccent: fields.text({
          label: "Heading (gradient)",
          defaultValue: "Custom Software Solutions",
        }),
        subheading: fields.text({
          label: "Subheading",
          multiline: true,
          defaultValue:
            "We design and develop AI-powered platforms, automation systems, and scalable SaaS applications that deliver measurable business results.",
        }),
        supportingBullets: fields.array(
          fields.text({ label: "Bullet" }),
          {
            label: "Supporting bullets",
            itemLabel: (props) => props.value,
          },
        ),
        primaryCta: fields.object(
          {
            label: fields.text({
              label: "Label",
              defaultValue: "Book a Discovery Call",
            }),
            href: fields.text({ label: "Href", defaultValue: "#contact" }),
          },
          { label: "Primary CTA" },
        ),
        secondaryCta: fields.object(
          {
            label: fields.text({
              label: "Label",
              defaultValue: "View Portfolio",
            }),
            href: fields.text({ label: "Href", defaultValue: "#portfolio" }),
          },
          { label: "Secondary CTA" },
        ),
      },
    }),

    services: singleton({
      label: "Business solutions",
      path: "apps/landing/content/services",
      format: { data: "yaml" },
      schema: {
        overline: fields.text({
          label: "Overline",
          defaultValue: "Business solutions",
        }),
        heading: fields.text({
          label: "Heading",
          defaultValue: "What we build for enterprise teams",
        }),
        intro: fields.text({
          label: "Intro",
          multiline: true,
          defaultValue:
            "Production-ready systems that automate operations, surface decisions, and scale with the organization.",
        }),
        items: fields.array(
          fields.object({
            title: fields.text({ label: "Title" }),
            body: fields.text({ label: "Body", multiline: true }),
            bullets: fields.array(fields.text({ label: "Bullet" }), {
              label: "Bullets",
              itemLabel: (props) => props.value,
            }),
            icon: fields.select({
              label: "Icon",
              options: [
                { label: "Automation", value: "automation" },
                { label: "SaaS / layers", value: "layers" },
                { label: "Computer vision", value: "vision" },
                { label: "Analytics", value: "analytics" },
                { label: "Integration", value: "integration" },
                { label: "Predictive", value: "predictive" },
                { label: "AI / psychology", value: "psychology" },
                { label: "Account tree", value: "accountTree" },
              ],
              defaultValue: "automation",
            }),
          }),
          {
            label: "Solutions",
            itemLabel: (props) => props.fields.title.value,
          },
        ),
      },
    }),

    demoShowcase: singleton({
      label: "Featured projects intro",
      path: "apps/landing/content/demo-showcase",
      format: { data: "yaml" },
      schema: {
        overline: fields.text({
          label: "Overline",
          defaultValue: "Featured projects",
        }),
        heading: fields.text({
          label: "Heading",
          defaultValue: "Flagship platforms shipping today",
        }),
        intro: fields.text({
          label: "Intro",
          multiline: true,
          defaultValue:
            "Real production systems we've built for AI automation, computer vision, sustainability reporting, predictive maintenance, and multi-tenant SaaS analytics.",
        }),
      },
    }),

    industries: singleton({
      label: "Industries",
      path: "apps/landing/content/industries",
      format: { data: "yaml" },
      schema: {
        overline: fields.text({
          label: "Overline",
          defaultValue: "Industries we serve",
        }),
        heading: fields.text({
          label: "Heading",
          defaultValue: "Built for regulated, complex operations",
        }),
        intro: fields.text({
          label: "Intro",
          multiline: true,
          defaultValue:
            "Sectors where data volume, compliance burden, or operational complexity demand more than a spreadsheet or off-the-shelf SaaS.",
        }),
        items: fields.array(
          fields.object({
            name: fields.text({ label: "Industry name" }),
            note: fields.text({ label: "One-line note", multiline: true }),
            icon: fields.select({
              label: "Icon",
              options: [
                { label: "Factory / manufacturing", value: "factory" },
                { label: "Logistics / shipping", value: "logistics" },
                { label: "Energy", value: "energy" },
                { label: "Finance", value: "finance" },
                { label: "Healthcare", value: "healthcare" },
                { label: "Agriculture", value: "agriculture" },
                { label: "Professional services", value: "professional" },
              ],
              defaultValue: "factory",
            }),
          }),
          {
            label: "Industries",
            itemLabel: (props) => props.fields.name.value,
          },
        ),
      },
    }),

    outcomes: singleton({
      label: "Business outcomes",
      path: "apps/landing/content/outcomes",
      format: { data: "yaml" },
      schema: {
        overline: fields.text({
          label: "Overline",
          defaultValue: "Business outcomes",
        }),
        heading: fields.text({
          label: "Heading",
          defaultValue: "Measurable results clients can expect",
        }),
        intro: fields.text({
          label: "Intro",
          multiline: true,
          defaultValue:
            "Outcomes we plan toward, contractually scope against, and measure once the platform is live.",
        }),
        items: fields.array(
          fields.object({
            stat: fields.text({
              label: "Headline stat (short)",
              description: "Example: 80% · 3x · audit-ready",
            }),
            title: fields.text({ label: "Title" }),
            body: fields.text({ label: "Body", multiline: true }),
            icon: fields.select({
              label: "Icon",
              options: [
                { label: "Time / efficiency", value: "time" },
                { label: "Quality / target", value: "quality" },
                { label: "Visibility / chart", value: "visibility" },
                { label: "Compliance", value: "compliance" },
                { label: "Scale", value: "scale" },
              ],
              defaultValue: "time",
            }),
          }),
          {
            label: "Outcomes",
            itemLabel: (props) => props.fields.title.value,
          },
        ),
      },
    }),

    architecture: singleton({
      label: "Technology stack",
      path: "apps/landing/content/architecture",
      format: { data: "yaml" },
      schema: {
        overline: fields.text({
          label: "Overline",
          defaultValue: "Technology stack",
        }),
        heading: fields.text({
          label: "Heading",
          defaultValue: "Proven tools, deployed at scale",
        }),
        intro: fields.text({
          label: "Intro",
          multiline: true,
          defaultValue:
            "Battle-tested infrastructure across frontend, backend, AI, data, cloud, and integration layers. Every choice picked for production reliability, not novelty.",
        }),
        groups: fields.array(
          fields.object({
            name: fields.text({
              label: "Group name",
              description: "Frontend, Backend, AI, Data, Cloud, Integrations",
            }),
            items: fields.array(fields.text({ label: "Item" }), {
              label: "Items",
              itemLabel: (props) => props.value,
            }),
            icon: fields.select({
              label: "Icon",
              options: [
                { label: "Frontend", value: "frontend" },
                { label: "Backend", value: "backend" },
                { label: "AI", value: "ai" },
                { label: "Data", value: "data" },
                { label: "Cloud", value: "cloud" },
                { label: "Integrations", value: "integrations" },
              ],
              defaultValue: "frontend",
            }),
          }),
          {
            label: "Groups",
            itemLabel: (props) => props.fields.name.value,
          },
        ),
      },
    }),

    process: singleton({
      label: "Process",
      path: "apps/landing/content/process",
      format: { data: "yaml" },
      schema: {
        overline: fields.text({
          label: "Overline",
          defaultValue: "Our process",
        }),
        heading: fields.text({
          label: "Heading",
          defaultValue: "From discovery to optimization",
        }),
        intro: fields.text({
          label: "Intro",
          multiline: true,
          defaultValue:
            "A predictable engagement pattern from kickoff to long-term operations. Every phase ends with a written artefact you keep.",
        }),
        steps: fields.array(
          fields.object({
            title: fields.text({ label: "Title" }),
            body: fields.text({ label: "Body", multiline: true }),
          }),
          {
            label: "Steps",
            itemLabel: (props) => props.fields.title.value,
          },
        ),
      },
    }),

    about: singleton({
      label: "About",
      path: "apps/landing/content/about",
      format: { data: "yaml" },
      schema: {
        overline: fields.text({
          label: "Overline",
          defaultValue: "About",
        }),
        heading: fields.text({
          label: "Heading",
          defaultValue: "A senior engineering partner, not an agency layer",
        }),
        body: fields.text({
          label: "Body",
          multiline: true,
          defaultValue:
            "I help organizations design and build advanced AI and software solutions that automate operations, improve decision-making, and create scalable digital products. Direct contact with the architect, no PMs in the middle.",
        }),
        bullets: fields.array(fields.text({ label: "Bullet" }), {
          label: "Bullets",
          itemLabel: (props) => props.value,
        }),
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
          defaultValue: "Questions before the first call",
        }),
        items: fields.array(
          fields.object({
            question: fields.text({ label: "Question" }),
            answer: fields.text({ label: "Answer", multiline: true }),
          }),
          {
            label: "Items",
            itemLabel: (props) => props.fields.question.value,
          },
        ),
      },
    }),

    trust: singleton({
      label: "Testimonials",
      path: "apps/landing/content/trust",
      format: { data: "yaml" },
      schema: {
        overline: fields.text({
          label: "Overline",
          defaultValue: "Testimonials",
        }),
        heading: fields.text({
          label: "Heading",
          defaultValue: "What partners say",
        }),
        items: fields.array(
          fields.object({
            quote: fields.text({ label: "Quote", multiline: true }),
            author: fields.text({ label: "Author name" }),
            role: fields.text({ label: "Role" }),
            company: fields.text({ label: "Company" }),
            impact: fields.text({
              label: "Impact tag",
              description: "Short stat or outcome (optional)",
            }),
          }),
          {
            label: "Testimonials",
            itemLabel: (props) => props.fields.author.value,
          },
        ),
      },
    }),

    cta: singleton({
      label: "Final CTA",
      path: "apps/landing/content/cta",
      format: { data: "yaml" },
      schema: {
        heading: fields.text({
          label: "Heading",
          defaultValue: "Ready to Build Your Next AI or Software Solution?",
        }),
        body: fields.text({
          label: "Body",
          multiline: true,
          defaultValue:
            "Let's discuss how automation, AI, and custom software can help your organization grow.",
        }),
        primaryCta: fields.object(
          {
            label: fields.text({
              label: "Label",
              defaultValue: "Book a Discovery Call",
            }),
            href: fields.text({
              label: "Href",
              defaultValue: "https://cal.com/theuy",
            }),
          },
          { label: "Primary CTA" },
        ),
        secondaryCta: fields.object(
          {
            label: fields.text({
              label: "Label",
              defaultValue: "Discuss Your Project",
            }),
            href: fields.text({
              label: "Href",
              defaultValue: "mailto:theuy.limpanont@gmail.com",
            }),
          },
          { label: "Secondary CTA" },
        ),
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
