import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	images: {
		unoptimized: true, // Cloudflare(OpenNext)での next/image 最適化を無効化し、元画像をそのまま配信
	},
};

export default nextConfig;

// Enable calling `getCloudflareContext()` in `next dev`.
// See https://opennext.js.org/cloudflare/bindings#local-access-to-bindings.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
