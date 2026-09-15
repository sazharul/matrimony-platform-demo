import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { getSettings } from "@/services/publicService";
import { cfImageUrl } from "@/lib/utils";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "MatriConnect";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export async function generateMetadata(): Promise<Metadata> {
  let settings;
  try {
    settings = await getSettings();
  } catch {
    settings = null;
  }

  const siteName    = settings?.site_name        ?? APP_NAME;
  const metaTitle   = settings?.meta_title       ?? `${siteName} — Find Your Perfect Life Partner`;
  const metaDesc    = settings?.meta_description ?? `Find your perfect life partner on ${siteName}.`;
  const metaKw      = settings?.meta_keywords    ?? "matrimony, marriage, Bangladesh";
  const faviconUrl  = cfImageUrl(settings?.site_favicon);

  return {
    title: {
      default:  metaTitle,
      template: `%s | ${siteName} Matrimony`,
    },
    description:  metaDesc,
    keywords:     metaKw.split(",").map((k) => k.trim()),
    openGraph: {
      siteName: `${siteName} Matrimony`,
      type:     "website",
    },
    icons: faviconUrl
      ? {
          icon:     [{ url: faviconUrl }],
          shortcut: [{ url: faviconUrl }],
          apple:    [{ url: faviconUrl }],
        }
      : undefined,
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <QueryProvider>{children}</QueryProvider>
        {/* Portal targets for react-datepicker and react-select */}
        <div id="datepicker-portal" style={{position:'fixed',zIndex:99999}}/>
      </body>
    </html>
  );
}
