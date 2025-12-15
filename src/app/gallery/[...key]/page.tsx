export const dynamic = "force-dynamic";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppEnv } from "@/types/env";

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
        <div className="grid gap-4">
          <div className="rounded-xl border border-white/10 bg-black/40 p-3">
            <img
              src={imageUrl}
              alt="Uploaded memory"
              className="mx-auto w-full max-h-[70vh] object-contain"
            />
          </div>
          <div className="text-sm text-white/70">
            <p>保存キー: {objectKey}</p>
            {head.uploaded && (
              <p>アップロード: {new Date(head.uploaded).toLocaleString("ja-JP")}</p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
