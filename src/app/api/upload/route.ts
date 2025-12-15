import { getCloudflareContext } from "@opennextjs/cloudflare";

interface Env {
  MEMORIAL_IMAGES: R2Bucket;
}

export async function POST(request: Request) {
  const { env } = await getCloudflareContext();
  const typedEnv = env as unknown as Env;

  const contentType =
    request.headers.get("content-type") ?? "application/octet-stream";

  // ★ Body を ArrayBuffer として取得（サイズ確定）
  const data = await request.arrayBuffer();

  // ★ ファイル名を作る（衝突防止）
  const ext =
    contentType === "image/png"
      ? "png"
      : contentType === "image/webp"
      ? "webp"
      : "jpg";

  const key = `uploads/${crypto.randomUUID()}.${ext}`;

  await typedEnv.MEMORIAL_IMAGES.put(key, data, {
    httpMetadata: {
      contentType,
    },
  });

  return Response.json({
    ok: true,
    key,
    url: `/api/images/${encodeURIComponent(key)}`,
  });
}
