import React from "react";
import { Bi } from "./Bi";
import { BigButton } from "./BigButton";
import { BilingualText, StringKey } from "@/lib/strings";

export interface EmptyStateProps {
  /** Optional icon component */
  icon?: React.ReactNode;
  /** Primary heading string key or pair */
  titleKey?: StringKey;
  titleText?: BilingualText;
  /** Optional detailed reassuring message */
  descriptionText?: BilingualText;
  /** Optional action button key */
  actionKey?: StringKey;
  /** Action button click */
  onAction?: () => void;
  /** Action button href */
  actionHref?: string;
  /** Action button icon */
  actionIcon?: React.ReactNode;
}

/**
 * <EmptyState>
 *
 * Warm, friendly empty state in large bilingual typography.
 * Reassures Mom that nothing is broken and guides what to do next.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  titleKey,
  titleText,
  descriptionText,
  actionKey,
  onAction,
  actionHref,
  actionIcon,
}) => {
  return (
    <div className="w-full flex flex-col items-center justify-center p-8 sm:p-16 text-center bg-[var(--bg-surface)] border-4 border-[var(--border-subtle)] rounded-3xl my-6">
      {icon && (
        <div className="w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center text-[var(--accent)] mb-6">
          {icon}
        </div>
      )}

      <h2 className="text-[var(--text-heading)] font-bold mb-4">
        <Bi
          k={titleKey}
          text={titleText}
          layout="stacked"
          enClassName="text-[1.0em] text-[var(--text-secondary)]"
          teClassName="text-[1.25em] text-yellow-300"
        />
      </h2>

      {descriptionText && (
        <p className="text-[var(--text-body)] text-slate-300 max-w-xl mb-8 leading-relaxed">
          <Bi text={descriptionText} layout="stacked" />
        </p>
      )}

      {actionKey && (
        <BigButton
          k={actionKey}
          icon={actionIcon}
          onClick={onAction}
          href={actionHref}
          variant="accent"
          className="min-w-[280px]"
        />
      )}
    </div>
  );
};

export default EmptyState;
