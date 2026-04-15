import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Road Not Taken",
  description: "Discover and share hidden gems with Road Not Taken - a community-driven map for exploring off-the-beaten-path locations. Create pins, share stories, and connect with fellow adventurers to uncover the world's best-kept secrets.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
