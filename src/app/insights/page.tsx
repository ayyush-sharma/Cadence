import type { Metadata } from "next";
import { ClientPage } from "@/components/layout/client-page";

export const metadata: Metadata = {
  title: "Insights",
};

export default function InsightsPage() {
  return <ClientPage page="insights" />;
}
