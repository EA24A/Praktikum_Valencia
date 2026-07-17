import { getLocale, getMessages } from "next-intl/server";
import { Providers } from "@/components/providers";
import "./globals.css";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <meta name="robots" content="noindex, nofollow" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Lora:ital,wght@0,400;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased">
        <Providers messages={messages} locale={locale}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
