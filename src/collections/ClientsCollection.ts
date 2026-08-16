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
    name: "Einstein Exchange",
  },
  {
    name: "Payfirma",
  },
  {
    name: "Vidigami",
  },
  {
    name: "lululemon",
    url: "https://shop.lululemon.com",
  },
  {
    name: "Rentmoola",
  },
  {
    name: "Autozen",
  },
  {
    name: "24 Hours",
  },
  {
    name: "FIFA",
    url: "https://www.fifa.com",
  },
];

export default ClientsCollection;
