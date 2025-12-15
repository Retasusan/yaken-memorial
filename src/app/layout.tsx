import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
	title: "Yaken Memorial",
	description: "This is a memorial website for Yaken.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="ja">
			<head>
				<link rel="icon" href="/favicon.svg" type="image/svg+xml"></link>
			</head>
			<body className="min-h-screen">{children}</body>
		</html>
	);
}
