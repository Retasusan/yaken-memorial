import Link from "next/link";
import UploadForm from "./components/UploadForm";

export default function Page() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-12 sm:px-8">
      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-white/0 p-8 shadow-2xl">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.08),transparent_30%)]"
        />

        <div className="relative space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Yaken Memorial</h1>
          <p className="max-w-3xl text-sm text-white/70 sm:text-base">
            ここに集まる写真は、あなたの記憶をそっと灯す光です。静かな空気のまま、一枚ずつ大切に残していきましょう。
          </p>

          <div className="flex flex-wrap gap-3 pt-4">
            <Link
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/15"
              href="/gallery"
            >
              ギャラリーをひらく ↗
            </Link>
            <Link
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/15"
              href="#upload"
            >
              画像を追加する
            </Link>
          </div>
        </div>
      </section>

      <section
        id="upload"
        className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">新しい想い出をのせる</h2>
          <p className="text-sm text-white/60">jpg / png などの画像をアップロードできます</p>
        </div>

        <div className="mt-4">
          <UploadForm />
        </div>
      </section>
    </main>
  );
}
