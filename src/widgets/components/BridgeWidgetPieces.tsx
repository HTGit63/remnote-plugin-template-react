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
        RN
      </div>
      <div className="bridge-hero-copy">
        <h2 className="bridge-title">RemNote Bridge</h2>
        <p className="bridge-subtitle">
          {nextAction}
          {status.toolProfile ? ` Tool profile: ${status.toolProfile}.` : ''}
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
      <span>{toolProfile ?? 'full'} profile</span>
      <span>{publicToolCount ?? 0}{total ? `/${total}` : ''} exposed</span>
      <span>{preferredToolCount} preferred</span>
      <span>{hiddenByProfileCount} profile-hidden</span>
    </div>
  );
}
