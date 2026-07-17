"use client";

import { SessionProvider } from "next-auth/react";
import { NextIntlClientProvider } from "next-intl";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";

interface ProvidersProps {
  children: React.ReactNode;
  messages: Record<string, unknown>;
  locale: string;
}

export function Providers({ children, messages, locale }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <TooltipProvider>
            {children}
            <Toaster richColors closeButton position="top-right" />
          </TooltipProvider>
        </NextIntlClientProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
