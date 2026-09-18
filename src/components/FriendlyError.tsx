import React from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Bi } from "./Bi";
import { BigButton } from "./BigButton";
import { BilingualText } from "@/lib/strings";

export interface FriendlyErrorProps {
  /** Optional custom reassuring message */
  message?: BilingualText;
  /** Callback to retry */
  onRetry?: () => void;
}

/**
 * <FriendlyError>
 *
 * Warm, jargon-free error screen.
 * Reassures the user and provides immediate clear recovery actions.
 */
export const FriendlyError: React.FC<FriendlyErrorProps> = ({
  message = {
    en: "Don't worry! Please try again or return home.",
    te: "కంగారు పడకండి! దయచేసి మళ్ళీ ప్రయత్నించండి లేదా హోమ్‌కి వెళ్ళండి.",
  },
  onRetry,
}) => {
  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-[var(--bg-surface-elevated)] border-6 border-red-500 rounded-3xl my-8 shadow-2xl">
      <div className="w-24 h-24 flex items-center justify-center text-red-400 mb-6">
        <AlertCircle className="w-20 h-20" />
      </div>

      <h2 className="text-[var(--text-heading)] font-bold text-white mb-4">
        <Bi k="somethingWentWrong" layout="stacked" teClassName="text-red-300" />
      </h2>

      <p className="text-[var(--text-body)] text-slate-200 mb-8 max-w-lg leading-relaxed font-medium">
        <Bi text={message} layout="stacked" />
      </p>

      <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
        {onRetry && (
          <BigButton
            k="tryAgain"
            icon={<RefreshCw className="w-8 h-8" />}
            onClick={onRetry}
            variant="accent"
            className="flex-1"
          />
        )}

        <BigButton
          k="home"
          icon={<Home className="w-8 h-8" />}
          href="/"
          variant="secondary"
          className="flex-1"
        />
      </div>
    </div>
  );
};

export default FriendlyError;
