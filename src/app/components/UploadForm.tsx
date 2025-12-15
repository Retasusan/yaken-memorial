"use client";

import { useState } from "react";

type UploadResponse =
  | { ok: true; key: string }
  | { ok: false; error: string };

type UploadState =
  | { status: "idle" }
  | { status: "uploading" }
  | { status: "success"; key: string }
  | { status: "error"; message: string };

export default function UploadForm() {
  const [state, setState] = useState<UploadState>({ status: "idle" });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const input = e.currentTarget.elements.namedItem(
      "file"
    ) as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      setState({ status: "error", message: "ファイルが選択されていません" });
      return;
    }

    const file = input.files[0];

    try {
      setState({ status: "uploading" });

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      const json = (await res.json()) as UploadResponse;

      if (json.ok) {
        setState({ status: "success", key: json.key });
      } else {
        setState({ status: "error", message: json.error });
      }
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "不明なエラー",
      });
    }
  }

  return (
    <div className="space-y-3">
      <form className="space-y-3" onSubmit={handleSubmit}>
        <div className="flex flex-wrap items-center gap-3">
          <input
            className="w-full max-w-xs cursor-pointer rounded-xl border border-dashed border-white/20 bg-white/5 px-3 py-2 text-sm text-white file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white transition hover:file:bg-white/15"
            type="file"
            name="file"
            accept="image/*"
          />
          <button
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-300 to-teal-200 px-4 py-2 text-sm font-bold text-slate-950 shadow-lg shadow-teal-300/30 transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60"
            type="submit"
            disabled={state.status === "uploading"}
          >
            {state.status === "uploading" ? "アップロード中…" : "アップロード"}
          </button>
        </div>
      </form>

      {/* ---- フィードバック ---- */}
      <div className="text-sm text-white/70">
        {state.status === "idle" && <p>画像を選択して送信してください。</p>}

        {state.status === "uploading" && (
          <p>⏳ アップロード中です。少しお待ちください。</p>
        )}

        {state.status === "success" && (
          <div className="space-y-1 text-emerald-300">
            <span className="block">✅ アップロードが完了しました。</span>
            <code className="block overflow-hidden text-ellipsis whitespace-pre rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80">
              {state.key}
            </code>
          </div>
        )}

        {state.status === "error" && (
          <p className="text-rose-300">❌ エラー: {state.message}</p>
        )}
      </div>
    </div>
  );
}
