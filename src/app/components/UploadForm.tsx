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
    <div style={{ maxWidth: 480 }}>
      <h2>画像アップロード</h2>

      <form onSubmit={handleSubmit}>
        <input type="file" name="file" accept="image/*" />
        <button type="submit" disabled={state.status === "uploading"}>
          アップロード
        </button>
      </form>

      {/* ---- フィードバック ---- */}
      <div style={{ marginTop: 12 }}>
        {state.status === "idle" && <p>画像を選択してください</p>}

        {state.status === "uploading" && (
          <p>⏳ アップロード中...</p>
        )}

        {state.status === "success" && (
          <>
            <p>✅ アップロード成功</p>
            <code>{state.key}</code>
          </>
        )}

        {state.status === "error" && (
          <p style={{ color: "red" }}>
            ❌ エラー: {state.message}
          </p>
        )}
      </div>
    </div>
  );
}
