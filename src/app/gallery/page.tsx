export const dynamic = "force-dynamic";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import Link from "next/link";
import { AppEnv } from "@/types/env";
import GalleryList from "./GalleryList";

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
      path: obj.key.split("/").map(encodeURIComponent).join("/"),
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
      <GalleryList images={images} />
    </main>
  );
}
