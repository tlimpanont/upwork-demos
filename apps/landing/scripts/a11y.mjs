#!/usr/bin/env node
/**
 * Run pa11y (axe-core) against the landing page in a chosen color scheme.
 *
 * Usage:
 *   node scripts/a11y.mjs                    # both schemes, default URL
 *   node scripts/a11y.mjs --scheme=light
 *   node scripts/a11y.mjs --scheme=dark --url=http://localhost:3000/case-studies
 *
 * Requires the dev server (or a built start server) to be running.
 */

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import puppeteer from "puppeteer";

const require = createRequire(import.meta.url);
const axeSourcePath = require.resolve("axe-core/axe.min.js");
const axeSource = readFileSync(axeSourcePath, "utf8");

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [k, v] = arg.replace(/^--/, "").split("=");
    return [k, v ?? true];
  }),
);

const url = args.url ?? "http://localhost:3000";
const schemes =
  args.scheme === "light" || args.scheme === "dark"
    ? [args.scheme]
    : ["light", "dark"];

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

let totalErrors = 0;

const browser = await puppeteer.launch({ headless: true });

try {
  for (const scheme of schemes) {
    const page = await browser.newPage();
    await page.emulateMediaFeatures([
      { name: "prefers-color-scheme", value: scheme },
    ]);
    await page.goto(url, { waitUntil: "networkidle0" });
    await page.evaluate(axeSource);
    const axeResult = await page.evaluate(async () =>
      // eslint-disable-next-line no-undef
      window.axe.run(document, {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] },
      }),
    );

    // Strip Next.js dev-mode error-overlay portal nodes — they're not part of
    // the actual page and only exist while `next dev` is running.
    const violations = axeResult.violations
      .map((v) => ({
        ...v,
        nodes: v.nodes.filter(
          (n) => !n.target.some((t) => String(t).includes("#__next_error__")),
        ),
      }))
      .filter((v) => v.nodes.length > 0);
    const errorCount = violations.reduce(
      (sum, v) => sum + v.nodes.length,
      0,
    );
    totalErrors += errorCount;

    console.log();
    console.log(
      `${BOLD}${scheme.toUpperCase()} mode${RESET} — ${url} — ${errorCount} error(s) across ${violations.length} rule(s)`,
    );

    for (const v of violations) {
      console.log(
        `\n  ${RED}[${v.id}]${RESET} ${v.help} (${v.impact}) — ${v.nodes.length} node(s)`,
      );
      for (const node of v.nodes) {
        console.log(`    ${DIM}at${RESET} ${node.target.join(" ")}`);
        const ctx = node.html.replace(/\s+/g, " ").slice(0, 140);
        console.log(`    ${DIM}html${RESET} ${ctx}`);
        for (const check of [...node.any, ...node.all, ...node.none]) {
          if (check.id === "color-contrast" && check.data) {
            const d = check.data;
            console.log(
              `    ${DIM}fg${RESET} ${d.fgColor} ${DIM}bg${RESET} ${d.bgColor} ${DIM}ratio${RESET} ${Number(d.contrastRatio).toFixed(2)} (need ${d.expectedContrastRatio}, ${d.fontSize} ${d.fontWeight})`,
            );
          }
        }
      }
    }

    await page.close();
  }
} finally {
  await browser.close();
}

console.log();
if (totalErrors === 0) {
  console.log(`${GREEN}✓ no a11y errors${RESET}`);
  process.exit(0);
} else {
  console.log(`${RED}✗ ${totalErrors} a11y error(s)${RESET}`);
  process.exit(1);
}
