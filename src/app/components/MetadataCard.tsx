"use client";

import { useMemo, useState } from "react";
import { MetadataEditor } from "@/app/components/MetadataEditor";

export type MetaSnapshot = {
  capturedBy?: string;
  subjects?: string[];
  comment?: string;
  createdAt?: string;
};

type Props = {
  imageKey: string;
  initialMeta: MetaSnapshot;
};

export function MetadataCard({ imageKey, initialMeta }: Props) {
  const [editing, setEditing] = useState(false);
  const [meta, setMeta] = useState<MetaSnapshot>(initialMeta);

  const hasAny = useMemo(
    () => Boolean(meta.capturedBy || meta.comment || (meta.subjects && meta.subjects.length > 0)),
    [meta]
  );

  const subjects = meta.subjects ?? [];

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-white/80">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">メタデータ</p>
          {meta.createdAt && (
            <p className="text-xs text-white/50">
              最終更新: {new Date(meta.createdAt).toLocaleString("ja-JP")}
            </p>
          )}
        </div>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white transition hover:border-white/40"
          >
            編集
          </button>
        )}
      </div>

      {!editing ? (
        hasAny ? (
          <div className="space-y-2 text-sm">
            {meta.capturedBy && <p>撮影: {meta.capturedBy}</p>}
            {subjects.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-white/70">写っている人:</span>
                <div className="flex flex-wrap gap-2">
                  {subjects.map((name) => (
                    <span
                      key={name}
                      className="rounded-full bg-white/10 px-3 py-1 text-xs text-white shadow"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {meta.comment && <p>コメント: {meta.comment}</p>}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="w-full rounded-lg border border-dashed border-white/25 px-3 py-3 text-left text-sm text-white/60 hover:border-white/40"
          >
            メタデータはまだ登録されていません。クリックして追加。
          </button>
        )
      ) : (
        <MetadataEditor
          imageKey={imageKey}
          initialCapturedBy={meta.capturedBy}
          initialSubjects={meta.subjects}
          initialComment={meta.comment}
          onSaved={(next) => {
            setMeta((prev) => ({ ...prev, ...next }));
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      )}
    </div>
  );
}
