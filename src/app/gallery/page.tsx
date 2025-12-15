export const dynamic = "force-dynamic";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import Link from "next/link";
import { AppEnv } from "@/types/env";

export default async function GalleryPage() {
  // ★ Cloudflare 環境を直接取得
  const { env } = await getCloudflareContext<{
    MEMORIAL_IMAGES: R2Bucket;
  }>();

  const typedEnv = env as unknown as AppEnv;

  // ★ R2 の一覧取得
  const list = await typedEnv.MEMORIAL_IMAGES.list({
    prefix: "uploads/",
  });

  const images = list.objects
    .filter(
      (obj) =>
        obj.size > 0 &&
        !obj.key.endsWith("/")
    )
    .map((obj) => ({
      key: obj.key,
      url: `/api/images/${encodeURIComponent(obj.key)}`,
    }));

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-12 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-white/60">
          <Link className="transition hover:text-white" href="/">
            トップ
          </Link>
          <span aria-hidden>→</span>
          <span>ギャラリー</span>
        </div>
        <Link
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/15"
          href="/#upload"
        >
          新しい写真を追加する
        </Link>
      </div>

      <section className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-white">ギャラリー</h2>
            <p className="text-sm text-white/60">アップロードした写真を静かに並べました。</p>
          </div>
          <p className="text-sm text-white/60">{images.length} 枚</p>
        </div>

        {images.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/15 bg-white/5 p-4 text-center text-sm text-white/60">
            まだ写真はありません。はじめの一枚をどうぞ。
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {images.map((img) => (
              <div
                key={img.key}
                className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-white/10 bg-black/30 shadow-xl"
              >
                <img
                  src={img.url}
                  alt="Uploaded memory"
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03] group-hover:saturate-110"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/35" />
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
