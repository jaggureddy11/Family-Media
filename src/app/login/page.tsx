"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, ArrowRight, AlertCircle, Home } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Bi } from "@/components/Bi";
import { BigButton } from "@/components/BigButton";
import { StringKey } from "@/lib/strings";

export default function LoginPage() {
  const router = useRouter();
  const [passphrase, setPassphrase] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorKey, setErrorKey] = useState<StringKey | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase.trim() || isLoading) return;

    setIsLoading(true);
    setErrorKey(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passphrase }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "tooManyAttempts") {
          setErrorKey("tooManyAttempts");
        } else {
          setErrorKey("invalidPassphrase");
        }
        setIsLoading(false);
        return;
      }

      router.push(data.redirect || "/admin/family");
      router.refresh();
    } catch {
      setErrorKey("somethingWentWrong");
      setIsLoading(false);
    }
  };

  return (
    <PageShell
      titleKey="adminLogin"
      showBack={false}
      showHome={true}
    >
      <div className="max-w-xl mx-auto my-8 sm:my-16 p-6 sm:p-12 bg-[var(--bg-surface)] border-4 border-[var(--border-subtle)] rounded-3xl shadow-2xl flex flex-col gap-8">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[var(--bg-surface-elevated)] border-4 border-yellow-400 flex items-center justify-center text-yellow-300">
            <Lock className="w-10 h-10 sm:w-12 sm:h-12" />
          </div>
          <h1 className="text-[var(--text-heading)] font-bold">
            <Bi k="adminLogin" layout="stacked" />
          </h1>
        </div>

        {errorKey && (
          <div
            role="alert"
            className="p-5 bg-red-950/80 border-4 border-red-500 rounded-2xl flex items-center gap-4 text-white"
          >
            <AlertCircle className="w-8 h-8 text-red-400 shrink-0" />
            <div className="text-[var(--text-body)] font-medium">
              <Bi k={errorKey} layout="stacked" />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <label
              htmlFor="passphrase-input"
              className="text-[var(--text-body)] font-semibold text-slate-200"
            >
              <Bi k="passphraseLabel" />
            </label>
            <input
              id="passphrase-input"
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="••••••••••••"
              disabled={isLoading}
              required
              className="kutumbam-focus w-full min-h-[64px] sm:min-h-[72px] px-6 text-[var(--text-body)] bg-[var(--bg-surface-elevated)] text-white border-4 border-[var(--border-thick)] rounded-2xl placeholder:text-slate-500 font-sans"
              data-nav-item="true"
            />
          </div>

          <BigButton
            type="submit"
            k="loginButton"
            icon={<ArrowRight className="w-8 h-8" />}
            variant="accent"
            disabled={isLoading || !passphrase.trim()}
            className="w-full mt-2"
          />
        </form>

        <div className="pt-4 border-t-2 border-[var(--border-subtle)] text-center">
          <BigButton
            k="home"
            icon={<Home className="w-8 h-8" />}
            href="/"
            variant="secondary"
            className="w-full"
          />
        </div>
      </div>
    </PageShell>
  );
}
