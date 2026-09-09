import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vault — Aries",
  robots: { index: false, follow: false },
};

export default function VaultLayout({ children }: { children: React.ReactNode }) {
  return children;
}
