import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { AppEnv } from "@/types/env";

type RouteContext = {
  params: Promise<{ key: string[] }>;
};

export async function GET(
  _req: Request,
  context: RouteContext
) {
  // ★ params は Promise なので await が必要
  const { key } = await context.params;

  const { env } = await getCloudflareContext<{
    MEMORIAL_IMAGES: R2Bucket;
  }>();

  const typedEnv = env as unknown as AppEnv;

  const objectKey = key.join("/");

  const object = await typedEnv.MEMORIAL_IMAGES.get(objectKey);

  if (!object) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(object.body, {
    headers: {
      "Content-Type":
        object.httpMetadata?.contentType ?? "application/octet-stream"
    },
  });
}

