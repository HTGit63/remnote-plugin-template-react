import React from 'react';
import type { BridgeStatusSnapshot } from '../../bridge/status';

export function BridgeWidgetHeader({
  status,
  statusClassName,
  statusLabel,
  nextAction,
}: {
  status: BridgeStatusSnapshot;
  statusClassName: string;
  statusLabel: string;
  nextAction: string;
}) {
  return (
    <header className="bridge-hero plugin-header">
      <div className="bridge-mark" aria-hidden="true">
        <svg className="bridge-mark-glyph" viewBox="0 0 32 32" focusable="false">
          <path d="M7 10h7l3.5 5 3.5-5h4v12h-4v-6.2l-2.7 4h-1.6l-2.7-4V22h-4v-8H7v8H3V10h4z" />
          <circle cx="7" cy="10" r="2.2" />
          <circle cx="25" cy="10" r="2.2" />
          <circle cx="16" cy="25" r="2.2" />
        </svg>
        <span>MCP</span>
      </div>
      <div className="bridge-hero-copy">
        <h2 className="bridge-title">RemNote MCP</h2>
        <p className="bridge-subtitle">
          {nextAction}
          {status.activeToolTier || status.toolTier || status.toolProfile
            ? ` Tool tier: ${status.activeToolTier ?? status.toolTier ?? status.toolProfile}.`
            : ''}
        </p>
      </div>
      <span className={statusClassName}>{statusLabel}</span>
    </header>
  );
}

export function BridgeTaskBanner({
  variant,
  title,
  copy,
  onChangeAccess,
}: {
  variant: 'ready' | 'warning' | 'offline';
  title: string;
  copy: string;
  onChangeAccess: () => void;
}) {
  return (
    <section className={['bridge-task-banner', `bridge-task-banner--${variant}`].join(' ')}>
      <div>
        <h3>{title}</h3>
        <p>{copy}</p>
      </div>
      <button type="button" onClick={onChangeAccess} className="bridge-button bridge-button-secondary">
        Change Access
      </button>
    </section>
  );
}

export function RecommendedModeCard({
  tone,
  badge,
  title,
  children,
}: {
  tone: 'success' | 'warning' | 'danger';
  badge: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className={['bridge-mode-card', `bridge-mode-card--${tone}`].join(' ')}>
      <span className={['bridge-pill', `bridge-pill-${tone}`].join(' ')}>{badge}</span>
      <strong>{title}</strong>
      <p>{children}</p>
    </div>
  );
}

export function ToolProfileSummary({
  toolProfile,
  publicToolCount,
  allPublicToolCount,
  preferredToolCount,
  hiddenByProfileCount,
}: {
  toolProfile?: string;
  publicToolCount?: number;
  allPublicToolCount?: number;
  preferredToolCount: number;
  hiddenByProfileCount: number;
}) {
  const total = allPublicToolCount ?? publicToolCount;
  return (
    <div className="bridge-profile-summary" aria-label="Tool profile summary">
      <span>{toolProfile ?? 'note_writer'} profile</span>
      <span>{publicToolCount ?? 0}{total ? `/${total}` : ''} exposed</span>
      <span>{preferredToolCount} preferred</span>
      <span>{hiddenByProfileCount} profile-hidden</span>
    </div>
  );
}
