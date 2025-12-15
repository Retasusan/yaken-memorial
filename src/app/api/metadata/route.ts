import { getCloudflareContext } from "@opennextjs/cloudflare";
import { AppEnv } from "@/types/env";

function safeParseSubjects(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.map((s) => (typeof s === "string" ? s.trim() : "")).filter(Boolean)
      : [];
  } catch {
    return [];
  }
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: Request) {
  const { env } = await getCloudflareContext();
  const typedEnv = env as unknown as AppEnv;

  const url = new URL(req.url);
  const key = url.searchParams.get("key")?.trim();
  const capturedByFilter = url.searchParams.get("capturedBy")?.trim() ?? "";
  const subjectFilter = url.searchParams.get("subject")?.trim() ?? "";

  try {
    if (key) {
      // 単一キー取得
      const stmt = typedEnv.MEMORIAL_META.prepare(
        `SELECT image_key, captured_by, subjects, comment, created_at
         FROM photos WHERE image_key = ?1 LIMIT 1`
      );
      const row = await stmt.bind(key).first<{
        image_key: string;
        captured_by: string;
        subjects: string;
        comment: string;
        created_at: string;
      }>();

      if (!row) {
        return new Response(JSON.stringify({ ok: false, error: "not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json", ...CORS_HEADERS },
        });
      }

      return new Response(
        JSON.stringify({
          ok: true,
          data: {
            key: row.image_key,
            capturedBy: row.captured_by,
            subjects: safeParseSubjects(row.subjects),
            comment: row.comment,
            createdAt: row.created_at,
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...CORS_HEADERS },
        }
      );
    }

    // 検索（部分一致）。subject は JSON 文字列に LIKE をかける簡易実装。
    const stmt = typedEnv.MEMORIAL_META.prepare(
      `SELECT image_key, captured_by, subjects, comment, created_at
       FROM photos
       WHERE (?1 = '' OR captured_by LIKE ?2)
         AND (?3 = '' OR subjects LIKE ?4)`
    );

    const cb = `%${capturedByFilter}%`;
    const sj = `%${subjectFilter}%`;

    const rows = await stmt
      .bind(capturedByFilter, cb, subjectFilter, sj)
      .all<{
        image_key: string;
        captured_by: string;
        subjects: string;
        comment: string;
        created_at: string;
      }>();

    const list = rows?.results ?? [];

    return new Response(
      JSON.stringify({
        ok: true,
        data: list.map((row) => ({
          key: row.image_key,
          capturedBy: row.captured_by,
          subjects: safeParseSubjects(row.subjects),
          comment: row.comment,
          createdAt: row.created_at,
        })),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      }
    );
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ ok: false, error: "failed to read metadata" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      }
    );
  }
}

export async function POST(req: Request) {
  const { env } = await getCloudflareContext();
  const typedEnv = env as unknown as AppEnv;

  let payload: {
    key?: string;
    capturedBy?: string;
    subjects?: string | string[];
    comment?: string;
  };

  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "invalid json" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }

  const key = payload.key?.trim();
  if (!key) {
    return new Response(JSON.stringify({ ok: false, error: "key is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }

  const capturedBy = payload.capturedBy?.trim() ?? "";
  const subjectsArray = Array.isArray(payload.subjects)
    ? payload.subjects
    : (payload.subjects ?? "")
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter(Boolean);

  const subjects = JSON.stringify(subjectsArray);
  const comment = payload.comment?.trim() ?? "";

  try {
    const stmt = typedEnv.MEMORIAL_META.prepare(
      `INSERT INTO photos (image_key, captured_by, subjects, comment, created_at)
      VALUES (?1, ?2, ?3, ?4, datetime('now'))
       ON CONFLICT(image_key) DO UPDATE SET
         captured_by=excluded.captured_by,
         subjects=excluded.subjects,
         comment=excluded.comment,
         created_at=excluded.created_at`
    );

    await stmt.bind(key, capturedBy, subjects, comment).run();

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ ok: false, error: "failed to write metadata" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      }
    );
  }
}
