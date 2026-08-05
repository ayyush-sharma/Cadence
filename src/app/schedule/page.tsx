import type { Metadata } from "next";
import { ClientPage } from "@/components/layout/client-page";

export const metadata: Metadata = {
  title: "Schedule",
};

export default function SchedulePage() {
  return <ClientPage page="schedule" />;
}
