"use client";

import { useMemo, useState } from "react";
import { PERSON_OPTIONS } from "@/app/constants/personOptions";

function toChoice(value: string | undefined): { selected: string; custom: string } {
  if (!value) return { selected: "", custom: "" };
  return PERSON_OPTIONS.includes(value)
    ? { selected: value, custom: "" }
    : { selected: "その他", custom: value };
}

type Props = {
  imageKey: string;
  initialCapturedBy?: string;
  initialSubjects?: string[];
  initialComment?: string;
  onSaved?: (next: { capturedBy: string; subjects: string[]; comment: string }) => void;
  onCancel?: () => void;
};

export function MetadataEditor({
  imageKey,
  initialCapturedBy = "",
  initialSubjects = [],
  initialComment = "",
  onSaved,
  onCancel,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [capturedBy, setCapturedBy] = useState(() => toChoice(initialCapturedBy));
  const [subjects, setSubjects] = useState<Array<{ selected: string; custom: string }>>(() => {
    if (initialSubjects.length === 0) return [{ selected: "", custom: "" }];
    return initialSubjects.map(toChoice);
  });
  const [comment, setComment] = useState(initialComment);

  const uniqueSubjects = useMemo(
    () =>
      Array.from(
        new Set(
          subjects
            .map((s) => (s.selected === "その他" ? s.custom : s.selected).trim())
            .filter(Boolean)
        )
      ),
    [subjects]
  );

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);

    const capturedByValue =
      capturedBy.selected === "その他" ? capturedBy.custom.trim() : capturedBy.selected.trim();

    try {
      const res = await fetch("/api/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: imageKey,
          capturedBy: capturedByValue,
          subjects: uniqueSubjects,
          comment,
        }),
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => "保存に失敗しました");
        throw new Error(msg || "保存に失敗しました");
      }

      setSaved(true);
      onSaved?.({
        capturedBy: capturedByValue,
        subjects: uniqueSubjects,
        comment,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "保存に失敗しました";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4 text-white/80">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white">メタデータを編集</p>
        <span className="text-xs text-white/50">{imageKey}</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm text-white/80" htmlFor="edit-capturedBy">
            撮影した人
          </label>
          <div className="space-y-2">
            <select
              id="edit-capturedBy"
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
          <label className="text-sm text-white/80" htmlFor="edit-subjects">
            写っている人
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
                    onClick={() => setSubjects((prev) => prev.filter((_, i) => i !== idx))}
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
            {uniqueSubjects.length > 0 && (
              <p className="text-xs text-white/50">重複は自動でまとめます。</p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm text-white/80" htmlFor="edit-comment">
          コメント
        </label>
        <textarea
          id="edit-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="min-h-[90px] w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
          placeholder="写真の背景や思い出など"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-amber-200 to-pink-200 px-4 py-2 text-sm font-bold text-slate-900 shadow-lg shadow-amber-200/30 transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60"
        >
          {saving ? "保存中…" : "メタデータを保存"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/40"
          >
            キャンセル
          </button>
        )}
        {saved && <span className="text-sm text-emerald-300">保存しました。</span>}
        {error && <span className="text-sm text-rose-300">{error}</span>}
      </div>
    </form>
  );
}
