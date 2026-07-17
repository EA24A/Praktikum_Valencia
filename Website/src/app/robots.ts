import type { MetadataRoute } from "next";

/**
 * Allow all major search engines and modern LLM/GEO crawlers
 * (ChatGPT, Claude, Perplexity, Gemini, Bing/Copilot, You.com, Apple).
 */
export default function robots(): MetadataRoute.Robots {
  const friendlyBots = [
    "Googlebot",
    "Googlebot-Image",
    "Bingbot",
    "Slurp",
    "DuckDuckBot",
    "Baiduspider",
    "YandexBot",
    "facebookexternalhit",
    "Twitterbot",
    "WhatsApp",
    "GPTBot",            // OpenAI
    "ChatGPT-User",
    "OAI-SearchBot",
    "ClaudeBot",         // Anthropic
    "Claude-Web",
    "anthropic-ai",
    "PerplexityBot",
    "Perplexity-User",
    "Google-Extended",   // Bard / Gemini training opt-in
    "Bytespider",        // ByteDance / Doubao
    "Applebot",
    "Applebot-Extended",
    "Amazonbot",
    "CCBot",             // Common Crawl (used by many LLMs)
    "Meta-ExternalAgent",
    "FacebookBot",
    "YouBot",
    "MistralAI-User",
  ];

  return {
    rules: [
      ...friendlyBots.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: ["/admin/", "/api/"],
      })),
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/"],
      },
    ],
    sitemap: "https://www.casafenicia.com/sitemap.xml",
    host: "https://www.casafenicia.com",
  };
}
