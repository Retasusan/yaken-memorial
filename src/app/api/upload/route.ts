import { getCloudflareContext } from "@opennextjs/cloudflare";

export const runtime = "edge";

interface Env {
  MEMORIAL_IMAGES: R2Bucket;
}

export async function POST(request: Request) {
  const { env } = await getCloudflareContext();
  const typedEnv = env as unknown as Env;

  const contentType = request.headers.get("content-type") ?? "application/octet-stream";

  // ★ サイズが確定する
  const data = await request.arrayBuffer();

  await typedEnv.MEMORIAL_IMAGES.put("test", data, {
    httpMetadata: {
      contentType,
    },
  });

  return Response.json({ ok: true });
}
