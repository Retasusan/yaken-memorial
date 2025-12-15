import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { AppEnv } from "../../../../types/env";

export async function GET(
  _req: Request,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: any
) {
  const { env } = await getCloudflareContext<{
    MEMORIAL_IMAGES: R2Bucket;
  }>();

  const typedEnv = env as unknown as AppEnv;
  const key = context.params.key.join("/");
  const object = await typedEnv.MEMORIAL_IMAGES.get(key);

  if (!object) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(object.body, {
    headers: {
      "Content-Type":
        object.httpMetadata?.contentType ?? "image/png",
    },
  });
}
