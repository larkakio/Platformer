import { cookieStorage, createConfig, createStorage, http } from "wagmi";
import { base, mainnet } from "wagmi/chains";
import { coinbaseWallet, injected, walletConnect } from "wagmi/connectors";
import { APP_NAME } from "../base";

const projectId =
  typeof process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID === "string" &&
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID.length > 0
    ? process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
    : undefined;

const connectors = [
  injected({ shimDisconnect: true }),
  coinbaseWallet({
    appName:
      typeof process.env.NEXT_PUBLIC_SITE_NAME === "string" &&
      process.env.NEXT_PUBLIC_SITE_NAME.length > 0
        ? process.env.NEXT_PUBLIC_SITE_NAME
        : APP_NAME,
    preference: "all",
    version: "4",
  }),
  ...(projectId
    ? [
        walletConnect({
          projectId,
          showQrModal: true,
        }),
      ]
    : []),
];

export const config = createConfig({
  chains: [base, mainnet],
  connectors,
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  transports: {
    [base.id]: http(),
    [mainnet.id]: http(),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
