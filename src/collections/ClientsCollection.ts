import type { Client } from "@/types/types";

// A tile renders `logo` when one is set and falls back to the client name as a
// wordmark when it is not. Logos have to be hosted on assets.rod.dev — it is the
// only image host allowed by `images.remotePatterns` in next.config.ts.
const ClientsCollection: Client[] = [
  {
    name: "Ontario Power Generation",
    url: "https://www.opg.com",
  },
  {
    name: "Government of British Columbia",
    url: "https://www2.gov.bc.ca",
  },
  {
    // einstein.exchange no longer resolves — the exchange wound down, so the
    // tile stays unlinked rather than pointing at a dead domain.
    name: "Einstein Exchange",
  },
  {
    // Acquired — payfirma.com now redirects to its successor, Kort Payments.
    name: "Payfirma",
    url: "https://www.payfirma.com",
  },
  {
    name: "Vidigami",
    url: "https://vidigami.com",
  },
  {
    // Corporate site rather than the storefront: it is the apt target for a
    // client reference, and shop./www. both sit behind bot protection.
    name: "lululemon",
    url: "https://corporate.lululemon.com",
  },
  {
    // Rebranded to Letus.
    name: "Rentmoola",
    url: "https://let.us",
  },
  {
    name: "Autozen",
    url: "https://www.autozen.com",
  },
  {
    // The Vancouver commuter paper ceased publication in 2019.
    name: "24 Hours",
  },
  {
    name: "FIFA",
    url: "https://www.fifa.com",
  },
  {
    // Bare domain is canonical here — www.nirvanalabs.io 308s to it.
    name: "Nirvana Labs",
    url: "https://nirvanalabs.io",
  },
];

export default ClientsCollection;
