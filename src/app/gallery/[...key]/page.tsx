export const dynamic = "force-dynamic";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppEnv } from "@/types/env";
import { DeleteButton } from "@/app/components/DeleteButton";
import { LightboxImage } from "@/app/components/LightboxImage";
import { MetadataCard } from "@/app/components/MetadataCard";

type RouteParams = {
  params: Promise<{ key: string[] }>;
};

export default async function GalleryDetailPage({ params }: RouteParams) {
  const { key } = await params;
  const objectKey = key.join("/");

  const { env } = await getCloudflareContext<{
    MEMORIAL_IMAGES: R2Bucket;
  }>();
  const typedEnv = env as unknown as AppEnv;

  // 確認だけなら head で十分
  const head = await typedEnv.MEMORIAL_IMAGES.head(objectKey);
  if (!head) {
    return notFound();
  }

  const meta = await typedEnv.MEMORIAL_META.prepare(
    `SELECT image_key, captured_by, subjects, comment, created_at
     FROM photos WHERE image_key = ?1 LIMIT 1`
  )
    .bind(objectKey)
    .first<{
      image_key: string;
      captured_by: string;
      subjects: string;
      comment: string;
      created_at: string;
    }>();

  const subjects = meta?.subjects
    ? (() => {
        try {
          const arr = JSON.parse(meta.subjects);
          return Array.isArray(arr)
            ? arr.map((s) => (typeof s === "string" ? s.trim() : "")).filter(Boolean)
            : [];
        } catch {
          return [];
        }
      })()
    : [];

  const imageUrl = `/api/images/${encodeURIComponent(objectKey)}`;

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-4 py-12 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-white/70">
        <div className="flex items-center gap-2">
          <Link className="transition hover:text-white" href="/gallery">
            ギャラリー
          </Link>
          <span aria-hidden>→</span>
          <span className="truncate max-w-[220px] sm:max-w-none">{objectKey}</span>
        </div>
        <p className="text-white/60">{Math.round((head.size ?? 0) / 1024)} KB</p>
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/gallery"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/25 hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <span aria-hidden>←</span>
            ギャラリーに戻る
          </Link>
        </div>
        <div className="grid gap-4">
          <LightboxImage src={imageUrl} alt="Uploaded memory" />
          <div className="text-sm text-white/70">
            <p>保存キー: {objectKey}</p>
            {head.uploaded && (
              <p>アップロード: {new Date(head.uploaded).toLocaleString("ja-JP")}</p>
            )}
              <MetadataCard
                imageKey={objectKey}
                initialMeta={{
                  capturedBy: meta?.captured_by ?? "",
                  subjects,
                  comment: meta?.comment ?? "",
                  createdAt: meta?.created_at,
                }}
              />

            <div className="mt-5">
              <DeleteButton imageKey={objectKey} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
