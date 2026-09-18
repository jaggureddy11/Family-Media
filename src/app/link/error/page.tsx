import React from "react";
import { PageShell } from "@/components/PageShell";
import { Bi } from "@/components/Bi";
import { BigButton } from "@/components/BigButton";
import { AlertCircle, HelpCircle } from "lucide-react";
import { StringKey } from "@/lib/strings";

interface ErrorPageProps {
  searchParams: Promise<{ type?: string }>;
}

export default async function LinkErrorPage({ searchParams }: ErrorPageProps) {
  const { type } = await searchParams;

  let messageKey: StringKey = "deviceLinkAlreadyUsed";
  let borderColor = "border-amber-500";
  let iconColor = "text-amber-400";
  let teColor = "text-amber-300";

  if (type === "expired") {
    messageKey = "deviceLinkExpired";
    borderColor = "border-amber-500";
    iconColor = "text-amber-400";
    teColor = "text-amber-300";
  } else if (type === "rate_limit") {
    messageKey = "tooManyAttempts";
    borderColor = "border-red-500";
    iconColor = "text-red-400";
    teColor = "text-red-300";
  }

  return (
    <PageShell showBack={false} showHome={false}>
      <main className="max-w-2xl mx-auto my-12 p-8 sm:p-12 text-center bg-[var(--bg-surface-elevated)] border-6 rounded-3xl shadow-2xl transition-all" style={{ borderColor: type === "rate_limit" ? "#ef4444" : "#f59e0b" }}>
        <AlertCircle className={`w-20 h-20 mx-auto mb-6 ${iconColor}`} />
        <h1 className="text-[var(--text-heading)] font-bold text-white mb-8">
          <Bi k={messageKey} layout="stacked" teClassName={teColor} />
        </h1>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <BigButton
            k="askForHelp"
            icon={<HelpCircle className="w-8 h-8" />}
            variant="accent"
            className="min-w-[280px]"
            href="https://wa.me/?text=Hello%2C%20I%20need%20a%20new%20Kutumbam%20family%20login%20link"
          />
        </div>
      </main>
    </PageShell>
  );
}
