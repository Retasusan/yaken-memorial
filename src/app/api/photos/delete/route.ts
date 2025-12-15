import { getCloudflareContext } from "@opennextjs/cloudflare";
import { AppEnv } from "@/types/env";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: Request) {
  const { env } = await getCloudflareContext();
  const typedEnv = env as unknown as AppEnv;

  let body: { key?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "invalid json" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }

  const key = body.key?.trim();
  if (!key) {
    return new Response(JSON.stringify({ ok: false, error: "key is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }

  try {
    // 1) R2 を物理削除
    await typedEnv.MEMORIAL_IMAGES.delete(key);

    // 2) D1 のメタデータも削除（存在しなくても OK）
    if (typedEnv.MEMORIAL_META?.prepare) {
      const stmt = typedEnv.MEMORIAL_META.prepare(
        `DELETE FROM photos WHERE image_key = ?1`
      );
      await stmt.bind(key).run();
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ ok: false, error: "failed to delete" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      }
    );
  }
}
