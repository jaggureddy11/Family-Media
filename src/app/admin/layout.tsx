import React from "react";
import { AdminSystemStatusBanner } from "@/components/AdminSystemStatusBanner";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-950 text-neutral-100">
      <AdminSystemStatusBanner />
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}
