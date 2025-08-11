"use client";
import { useState } from "react";

type PlatformBlock = {
  title: string;
  intro: string;
  details: string;
  tags: string[];
  hashtags: string[];
  pricing: { price: number; listHigh: number; minAccept: number };
};

export default function Home() {
  const [itemNotes, setItemNotes] = useState("");
  const [imageUrls, setImageUrls] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | {
    platforms: Record<"depop" | "ebay" | "poshmark" | "mercari", PlatformBlock>;
  }>(null);
  const [error, setError] = useState("");

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const urls = imageUrls
        .split("\n")
        .map(s => s.trim())
        .filter(Boolean);

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemNotes, imageUrls: urls })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to generate.");
      setResult(data);
    } catch (err: any) {
      setError(err?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function Block({ name, block }: { name: string; block: PlatformBlock }) {
    const lines = [
      ["SEO-Optimized Title", block.title],
      ["Intro Paragraph", block.intro],
      ["Details", block.details],
      ["Trending Style Tags & Categories", block.tags.join(", ")],
      ["Hashtags", block.hashtags.join(" ")]
    ];
    const pricing = `Price: $${block.pricing.price} | List High: $${block.pricing.listHigh} | Accept Offers Down To: $${block.pricing.minAccept}`;

    return (
      <div className="p-5 border rounded-2xl shadow-sm">
        <h2 className="text-xl font-semibold mb-3">{name}</h2>
        <p className="text-sm mb-3 italic">{pricing}</p>
        {lines.map(([label, value]) => (
          <div key={label} className="mb-4">
            <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
            <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-3 rounded">{value as string}</pre>
          </div>
        ))}
        <button
          onClick={() => {
            const text = [
              block.title,
              "",
              block.intro,
              "",
              block.details,
              "",
              "Trending Style Tags & Categories:",
              block.tags.join(", "),
              "",
              "Hashtags:",
              block.hashtags.join(" ")
            ].join("\n");
            navigator.clipboard.writeText(text);
          }}
          className="px-3 py-2 rounded bg-black text-white text-sm"
        >
          Copy This Platform
        </button>
      </div>
    );
  }

  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Reselling Listing Generator</h1>
      <p className="text-sm text-gray-600 mb-6">
        Paste quick notes + optional image URLs (one per line). Get platform-ready listings.
      </p>

      <form onSubmit={handleGenerate} className="grid gap-4 mb-8">
        <label className="grid gap-2">
          <span className="text-sm font-medium">Item notes</span>
          <textarea
            className="border rounded p-3 min-h-[140px]"
            placeholder={`Brand, size, era, materials, condition (include flaws), measurements, anything special...`}
            value={itemNotes}
            onChange={e => setItemNotes(e.target.value)}
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium">Image URLs (optional, one per line)</span>
          <textarea
            className="border rounded p-3 min-h-[80px]"
            placeholder={`https://...jpg\nhttps://...jpg`}
            value={imageUrls}
            onChange={e => setImageUrls(e.target.value)}
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded bg-black text-white text-sm w-fit"
        >
          {loading ? "Generating..." : "Generate Listings"}
        </button>
      </form>

      {error && <div className="text-red-600 mb-6">{error}</div>}

      {result && (
        <div className="grid md:grid-cols-2 gap-6">
          <Block name="Depop" block={result.platforms.depop} />
          <Block name="eBay" block={result.platforms.ebay} />
          <Block name="Poshmark" block={result.platforms.poshmark} />
          <Block name="Mercari" block={result.platforms.mercari} />
        </div>
      )}

      <footer className="text-xs text-gray-500 mt-10">
        Titles target ~80 chars, no emojis. Copy blocks are double-spaced between sections.
      </footer>
    </main>
  );
}
