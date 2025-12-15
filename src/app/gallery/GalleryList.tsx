"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";

type ImageItem = {
  key: string;
  url: string;
  path: string;
};

type MetaItem = {
  key: string;
  capturedBy?: string;
  subjects?: string[];
  comment?: string;
  createdAt?: string;
};

type Props = {
  images: ImageItem[];
};

export default function GalleryList({ images }: Props) {
  const [capturedBy, setCapturedBy] = useState("");
  const [subject, setSubject] = useState("");
  const [meta, setMeta] = useState<MetaItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!meta || (capturedBy === "" && subject === "")) {
      return images;
    }
    const keys = new Set(
      meta.map((m) => m.key)
    );
    return images.filter((img) => keys.has(img.key));
  }, [meta, images, capturedBy, subject]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("capturedBy", capturedBy);
      params.set("subject", subject);
      const res = await fetch(`/api/metadata?${params.toString()}`);
      const json = (await res.json()) as { ok: boolean; data?: MetaItem[]; error?: string };
      if (!json.ok || !json.data) {
        throw new Error(json.error || "metadata fetch failed");
      }
      setMeta(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white">ギャラリー</h2>
          <p className="text-sm text-white/60">アップロードした写真を静かに並べました。</p>
        </div>
        <p className="text-sm text-white/60">{filtered.length} 枚</p>
      </div>

      <form className="grid gap-3 sm:grid-cols-2" onSubmit={handleSearch}>
        <input
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
          placeholder="撮影者で検索"
          value={capturedBy}
          onChange={(e) => setCapturedBy(e.target.value)}
        />
        <input
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
          placeholder="写っている人で検索"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        <div className="flex gap-2 sm:col-span-2">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-300 to-teal-200 px-4 py-2 text-sm font-bold text-slate-950 shadow-lg shadow-teal-300/30 transition hover:-translate-y-0.5 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "検索中…" : "検索"}
          </button>
          <button
            type="button"
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/80 hover:border-white/30"
            onClick={() => {
              setCapturedBy("");
              setSubject("");
              setMeta(null);
            }}
          >
            クリア
          </button>
        </div>
        {error && <p className="text-sm text-rose-300 sm:col-span-2">{error}</p>}
      </form>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/15 bg-white/5 p-4 text-center text-sm text-white/60">
          該当する写真がありません。
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {filtered.map((img) => (
            <Link key={img.key} href={`/gallery/${img.path}`} className="group block">
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-white/10 bg-black/30 shadow-xl">
                <Image
                  src={img.url}
                  alt="Uploaded memory"
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition duration-300 group-hover:scale-[1.03] group-hover:saturate-110"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/35" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
