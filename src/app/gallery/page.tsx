export const dynamic = "force-dynamic";

import { getCloudflareContext } from "@opennextjs/cloudflare";
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
      obj.size > 0 &&               // ★ 0バイト除外
      !obj.key.endsWith("/")         // ★ uploads/ を除外
  )
  .map((obj) => ({
    key: obj.key,
    url: `/api/images/${encodeURIComponent(obj.key)}`,
  }));

  list.objects.map(o => console.log(o.key));

  return (
    <main style={{ padding: 24 }}>
      <h1>Gallery</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 16,
        }}
      >
        {images.map((img) => (
          <img
            key={img.key}
            src={img.url}
            style={{ width: "100%", height: "auto" }}
          />
        ))}
      </div>
    </main>
  );
}
