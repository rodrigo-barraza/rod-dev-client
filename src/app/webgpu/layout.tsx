import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rodrigo Barraza - WebGPU",
  description:
    "WebGPU capability report for this browser: adapter, features and limits.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
