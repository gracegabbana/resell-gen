import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const { itemNotes, imageUrls } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY server env var." },
        { status: 500 }
      );
    }

    const prompt = `
You are a world-class SEO listing generator for secondhand fashion. 
Return JSON ONLY. No markdown. No commentary.

INPUT:
- Item notes: ${itemNotes || "(none provided)"}
- Image URLs (optional): ${Array.isArray(imageUrls) ? imageUrls.join(", ") : "(none)"}

REQUIREMENTS:
- Produce platform-specific outputs for Depop, eBay, Poshmark, Mercari.
- For EACH platform, include these sections IN THIS ORDER, single-spaced between lines, double-spaced between sections:
  1) SEO-Optimized Title (aim ~80 characters, never exceed 80, no emojis)
  2) Intro Paragraph (punchy, trend-aware, conversion-focused)
  3) Details (bullet-style lines: brand, size, condition, materials, era, measurements if present; call out flaws)
  4) Trending Style Tags & Categories (mix of trend tags + categorical tags relevant to the platform)
  5) Hashtags (10–15, platform-appropriate, no emojis)

- Include pricing suggestions per platform (USD). Provide "Price", "List High", and "Accept Offers Down To".
- Respect: user prefers clean, professional copy; no emojis anywhere in titles/descriptions.
- If image/notes mention flaws, call them out plainly and neutrally.
- If info missing, infer cautiously and label as "estimated" or leave blank—never invent brands/sizes.

OUTPUT JSON SHAPE:
{
  "platforms": {
    "depop": { "title": "...", "intro": "...", "details": "...", "tags": ["..."], "hashtags": ["..."], "pricing": {"price": 00, "listHigh": 00, "minAccept": 00 } },
    "ebay":  { ...same keys... },
    "poshmark": { ...same keys... },
    "mercari": { ...same keys... }
  }
}
`;

    // Call OpenAI Chat Completions (compatible fetch)
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o",
        temperature: 0.6,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "You generate impeccable, platform-optimized secondhand fashion listings." },
          { role: "user", content: prompt }
        ]
      })
    });

    if (!resp.ok) {
      const text = await resp.text();
      return NextResponse.json({ error: text }, { status: 500 });
    }

    const data = await resp.json();
    const parsed = JSON.parse(data.choices[0].message.content || "{}");

    return NextResponse.json(parsed);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 });
  }
}
