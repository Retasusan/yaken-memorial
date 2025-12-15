"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteButton({ imageKey }: { imageKey: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (loading) return;
    setError(null);
    const ok = window.confirm("本当に削除しますか？ この操作は元に戻せません。");
    if (!ok) return;

    setLoading(true);
    try {
      const res = await fetch("/api/photos/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ key: imageKey }),
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => "failed to delete");
        throw new Error(msg || "failed to delete");
      }

      router.push("/gallery");
      router.refresh();
    } catch (e) {
      console.error(e);
      const message = e instanceof Error ? e.message : "unknown error";
      setError(`削除に失敗しました: ${message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg border border-rose-300/40 bg-rose-300/20 px-3 py-2 text-sm font-semibold text-rose-50 shadow-sm transition hover:border-rose-200 hover:bg-rose-300/30 disabled:opacity-60"
      >
        {loading ? "削除中…" : "この写真を削除"}
      </button>
      {error && <p className="text-xs text-rose-200">{error}</p>}
    </div>
  );
}
