"use client";

import { useState } from "react";

type NormalizedImage = { file: File; converted: boolean };

const PERSON_OPTIONS = [
  "Retasusan",
  "rokuosan",
  "nenrin",
  "ikotome",
  "taiseiue",
  "Nikoyaka",
  "uyuki",
  "その他",
];

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
  const [capturedBy, setCapturedBy] = useState<{ selected: string; custom: string }>(
    { selected: "", custom: "" }
  );
  const [subjects, setSubjects] = useState<Array<{ selected: string; custom: string }>>([
    { selected: "", custom: "" },
  ]);
  const [comment, setComment] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setDone(false);
    setConverted(false);
    const payload = new FormData(e.currentTarget);

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

      const json = (await res.json().catch(() => null)) as
        | { ok: boolean; key?: string }
        | null;

      const imageKey = json?.key;

      // メタデータ保存（失敗しても致命的ではないので warn に留める）
      if (imageKey) {
        const capturedByValue =
          capturedBy.selected === "その他"
            ? capturedBy.custom.trim()
            : capturedBy.selected.trim();

        const parsedSubjects = Array.from(
          new Set(
            subjects
              .map((s) => (s.selected === "その他" ? s.custom : s.selected).trim())
              .filter(Boolean)
          )
        );

        const metaRes = await fetch("/api/metadata", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            key: imageKey,
            capturedBy: capturedByValue,
            subjects: parsedSubjects,
            comment: payload.get("comment") || comment,
          }),
        });

        if (!metaRes.ok) {
          console.warn("metadata save failed", await metaRes.text().catch(() => ""));
        }
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

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm text-white/80" htmlFor="capturedBy">
            撮影した人（任意）
          </label>
          <div className="space-y-2">
            <select
              id="capturedBy"
              name="capturedBy"
              value={capturedBy.selected}
              onChange={(e) => setCapturedBy({ selected: e.target.value, custom: "" })}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            >
              <option value="">選択してください</option>
              {PERSON_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            {capturedBy.selected === "その他" && (
              <input
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
                placeholder="撮影者を入力"
                value={capturedBy.custom}
                onChange={(e) => setCapturedBy((prev) => ({ ...prev, custom: e.target.value }))}
              />
            )}
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-sm text-white/80" htmlFor="subjects">
            写っている人（任意）
          </label>
          <div className="space-y-2">
            {subjects.map((value, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <select
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                  value={value.selected}
                  onChange={(e) => {
                    const next = [...subjects];
                    next[idx] = { selected: e.target.value, custom: "" };
                    setSubjects(next);
                  }}
                >
                  <option value="">選択してください</option>
                  {PERSON_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                {value.selected === "その他" && (
                  <input
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
                    placeholder="名前を入力"
                    value={value.custom}
                    onChange={(e) => {
                      const next = [...subjects];
                      next[idx] = { ...next[idx], custom: e.target.value };
                      setSubjects(next);
                    }}
                  />
                )}
                {subjects.length > 1 && (
                  <button
                    type="button"
                    className="rounded-lg border border-white/20 bg-white/10 px-2 py-1 text-xs text-white hover:border-white/40"
                    onClick={() => {
                      setSubjects((prev) => prev.filter((_, i) => i !== idx));
                    }}
                  >
                    削除
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="rounded-lg border border-dashed border-white/25 px-3 py-2 text-xs text-white/80 hover:border-white/50"
              onClick={() => setSubjects((prev) => [...prev, { selected: "", custom: "" }])}
            >
              + 追加
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm text-white/80" htmlFor="comment">
          コメント（任意）
        </label>
        <textarea
          id="comment"
          name="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="min-h-[90px] w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
          placeholder="写真の背景や思い出など"
        />
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
