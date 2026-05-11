// Append UTM params to outbound URLs so the destination's analytics
// can attribute the click to the surface that drove it (e.g. Cal.com's
// booking attribution will show which page sent the booking).

type UtmParams = {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
};

const DEFAULT_SOURCE = "theuy.nl";
const DEFAULT_MEDIUM = "site";

export function withUtm(url: string, params: UtmParams): string {
  const u = new URL(url);
  u.searchParams.set("utm_source", params.source ?? DEFAULT_SOURCE);
  u.searchParams.set("utm_medium", params.medium ?? DEFAULT_MEDIUM);
  if (params.campaign) u.searchParams.set("utm_campaign", params.campaign);
  if (params.content) u.searchParams.set("utm_content", params.content);
  return u.toString();
}

export const CAL_URL = "https://cal.com/theuy";
export const LINKEDIN_URL = "https://www.linkedin.com/in/theuylimpanont/";

// Adds UTM params if the href is external; passes internal hrefs
// (anchor links, relative paths) through unchanged.
export function withUtmIfExternal(href: string, params: UtmParams): string {
  if (!/^https?:\/\//.test(href)) return href;
  return withUtm(href, params);
}
