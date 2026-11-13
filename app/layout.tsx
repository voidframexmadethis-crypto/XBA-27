import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0b0d12",
};

export const metadata: Metadata = {
  title: "Hoops Moves – 3D Basketball Skills",
  description: "Master your handles and hit the game-winner in this realistic 3D basketball simulation. Practice crossovers, dunks, and clutch jump shots.",
  openGraph: {
    title: "Hoops Moves – 3D Basketball Skills",
    description: "Master your handles and hit the game-winner in this realistic 3D basketball simulation. Practice crossovers, dunks, and clutch jump shots.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hoops Moves – 3D Basketball Skills",
    description: "Master your handles and hit the game-winner in this realistic 3D basketball simulation. Practice crossovers, dunks, and clutch jump shots.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Hoops Moves",
              "applicationCategory": "GameApplication",
              "operatingSystem": "All",
              "description": "A high-fidelity 3D basketball simulation game.",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              }
            }),
          }}
        />
      </head>
      <body className={`${jakarta.className} bg-[#0b0d12] text-white antialiased overflow-hidden`}>
        {children}
      </body>
    </html>
  );
}
