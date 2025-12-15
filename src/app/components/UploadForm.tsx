"use client";

import { useState } from "react";

type NormalizedImage = { file: File; converted: boolean };

// ★ ブラウザ限定で HEIC → JPEG
async function normalizeImage(file: File): Promise<NormalizedImage> {
  const isHeic =
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    file.name.toLowerCase().endsWith(".heic");

  if (!isHeic) return { file, converted: false };

  // ★ SSR / Worker で読まれないよう動的 import
  const heic2any = (await import("heic2any")).default;

  let converted: Blob;
  try {
    converted = (await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.9,
    })) as Blob;
  } catch (err) {
    const msg =
      err && typeof err === "object" && "message" in err
        ? String((err as { message?: string }).message)
        : String(err ?? "unknown");
    throw new Error(
      msg.includes("ERR_LIBHEIF")
        ? "この HEIC はブラウザでデコードできません（HEVC/10bit など非対応の形式）。写真アプリで JPEG へ書き出して再アップロードしてください。"
        : `HEIC の変換に失敗しました: ${msg}`
    );
  }

  const blobWithType = converted.type
    ? converted
    : new Blob([converted], { type: "image/jpeg" });

  const normalizedFile = new File(
    [blobWithType],
    file.name.replace(/\.heic$/i, ".jpg"),
    { type: "image/jpeg" }
  );

  return { file: normalizedFile, converted: true };
}

export default function UploadForm() {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [converted, setConverted] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setDone(false);
    setConverted(false);

    const input = e.currentTarget.file as HTMLInputElement;
    if (!input.files?.[0]) return;

    try {
      setUploading(true);
      const { file: normalized, converted } = await normalizeImage(input.files[0]);
      setConverted(converted);

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": normalized.type, // ← 常に image/jpeg 等
        },
        body: normalized,
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => "upload failed");
        throw new Error(msg || "upload failed");
      }

      setDone(true);
    } catch (e) {
      console.error(e);
      const message =
        e instanceof Error
          ? e.message
          : typeof e === "string"
          ? e
          : (() => {
              try {
                return JSON.stringify(e);
              } catch {
                return "不明なエラー";
              }
            })();
      setError(`HEIC の変換またはアップロードに失敗しました: ${message}`);
    } finally {
      setUploading(false);
    }
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <div className="flex flex-wrap items-center gap-3">
        <input
          className="w-full max-w-xs cursor-pointer rounded-xl border border-dashed border-white/20 bg-white/5 px-3 py-2 text-sm text-white file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white transition hover:file:bg-white/15"
          type="file"
          name="file"
          accept="image/*,.heic,.heif"
        />
        <button
          className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-300 to-teal-200 px-4 py-2 text-sm font-bold text-slate-950 shadow-lg shadow-teal-300/30 transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60"
          type="submit"
          disabled={uploading}
        >
          {uploading ? "アップロード中…" : "アップロード"}
        </button>
      </div>

      {done && (
        <p className="text-sm text-emerald-300">
          {converted ? "HEIC を JPEG に変換して保存しました。" : "画像を保存しました。"}
        </p>
      )}
      {error && <p className="text-sm text-rose-300">{error}</p>}
    </form>
  );
}
