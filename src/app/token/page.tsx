import { getDecodedAccessJWT } from "@/lib/auth";

export default async function Page() {
  const result = await getDecodedAccessJWT();

  return (
    <main style={{ padding: "2rem", fontFamily: "monospace" }}>
      <h1>Cloudflare Access JWT Debug</h1>

      {result.ok ? (
        <>
          <h2>Payload</h2>
          <pre>{JSON.stringify(result.payload, null, 2)}</pre>
        </>
      ) : (
        <pre>{result.error}</pre>
      )}
    </main>
  );
}

