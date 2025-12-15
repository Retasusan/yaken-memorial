import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { AppEnv } from "../../../types/env";

export async function GET() {
  const ctx = await getCloudflareContext();
  const env = ctx.env as unknown as AppEnv; // ★ ここが必須

  const list = await env.MEMORIAL_IMAGES.list();

  return Response.json({
    images: list.objects.map(o => ({
      key: o.key,
      url: `/api/images/${encodeURIComponent(o.key)}`,
    })),
  });
}