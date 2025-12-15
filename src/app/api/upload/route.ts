import { getCloudflareContext } from "@opennextjs/cloudflare";

interface Env {
  MEMORIAL_IMAGES: R2Bucket;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function POST(request: Request) {
  const { env } = await getCloudflareContext();
  const typedEnv = env as unknown as Env;

  const contentType = request.headers.get("content-type");

  // ★ HEIC はブラウザ表示できないため、アップロード前に JPEG 化して送ってもらう
  const allowed = ["image/jpeg", "image/png", "image/webp"];

  if (!contentType || !allowed.includes(contentType)) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Please upload JPEG/PNG/WebP (HEIC は事前に JPEG へ変換してください)",
      }),
      {
        status: 415,
        headers: {
          "Content-Type": "application/json",
          ...CORS_HEADERS,
        },
      }
    );
  }

  const data = await request.arrayBuffer();

  const ext =
    contentType === "image/png"
      ? "png"
      : contentType === "image/webp"
      ? "webp"
      : contentType === "image/heic" || contentType === "image/heif"
      ? "heic"
      : "jpg";

  const key = `uploads/${crypto.randomUUID()}.${ext}`;

  await typedEnv.MEMORIAL_IMAGES.put(key, data, {
    httpMetadata: { contentType },
  });

  return new Response(
    JSON.stringify({
      ok: true,
      key,
      url: `/api/images/${encodeURIComponent(key)}`,
    }),
    {
      headers: {
        "Content-Type": "application/json",
        ...CORS_HEADERS,
      },
    }
  );
}
