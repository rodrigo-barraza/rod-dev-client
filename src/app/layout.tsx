import type { Metadata } from "next";
import { Ubuntu } from "next/font/google";
import Script from "next/script";
import ClientProviders from "./ClientProviders";
import "@/styles/styles.scss";
import "@/styles/animations.scss";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const IS_PRODUCTION_BUILD = process.env.NODE_ENV === "production";

// Self-hosted at build time: no render-blocking stylesheet from
// fonts.googleapis.com, and a size-matched fallback while it loads.
const ubuntu = Ubuntu({
  weight: ["300", "400", "500", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-ubuntu",
});

export const metadata: Metadata = {
  // Resolves relative Open Graph URLs and gives every page a canonical host.
  metadataBase: new URL("https://rod.dev"),
  title: "Rodrigo Barraza",
  description:
    "Rodrigo Barraza — photographer, software engineer and artist in Vancouver, Canada.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={ubuntu.variable} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        {/* Material Symbols stays on Google Fonts: an icon font, used by the
            generator's buttons. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20,100..700,0..1,200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {/* Production builds only — dev sessions would pollute the GA property */}
        {IS_PRODUCTION_BUILD && GA_ID && (
          <>
            <Script
              id="google-analytics-loader"
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics-config" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}');
              `}
            </Script>
          </>
        )}
        {IS_PRODUCTION_BUILD && (
          <Script id="google-tag-manager" strategy="afterInteractive">
            {`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-T62WJS5');
            `}
          </Script>
        )}

        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
