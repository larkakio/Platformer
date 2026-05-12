"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useState } from "react";
import { WagmiProvider, type State as WagmiState } from "wagmi";

import { config } from "@/lib/wagmi/config";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 60 * 1000 },
    },
  });
}

export default function Providers({
  children,
  initialState,
}: {
  children: React.ReactNode;
  initialState?: WagmiState | undefined;
}) {
  const [queryClient] = useState(makeQueryClient);

  return (
    <WagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
