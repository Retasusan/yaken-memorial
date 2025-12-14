import { headers } from "next/headers";

export async function getDecodedAccessJWT() {
  const h = await headers();
  const jwt = h.get("cf-access-jwt-assertion");

  if (!jwt) {
    return { ok: false, error: "No JWT" };
  }

  // JWTは header.payload.signature
  const [, payload] = jwt.split(".");

  if (!payload) {
    return { ok: false, error: "Invalid JWT format" };
  }

  // Base64URL decode
  const json = JSON.parse(
    Buffer.from(payload, "base64url").toString("utf-8")
  );

  return {
    ok: true,
    jwt,
    payload: json,
  };
}
