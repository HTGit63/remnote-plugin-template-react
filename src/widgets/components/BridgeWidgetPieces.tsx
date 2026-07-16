import React from 'react';
import type { BridgeStatusSnapshot } from '../../bridge/status';
import { REMNOTE_MCP_LOGO_URL } from '../bridge-panel/brand';

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
        <img className="bridge-mark-glyph" src={REMNOTE_MCP_LOGO_URL} alt="" />
      </div>
      <div className="bridge-hero-copy">
        <h2 className="bridge-title">RemNote MCP</h2>
        <p className="bridge-subtitle">
          {status.state === 'connected' ? 'ChatGPT can work in this note.' : nextAction}
        </p>
      </div>
      <span className={statusClassName}>{statusLabel}</span>
    </header>
  );
}

export function BridgePrimaryAction({
  icon,
  title,
  description,
  trailing,
  expanded,
  controls,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  trailing?: React.ReactNode;
  expanded: boolean;
  controls: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="bridge-primary-action"
      aria-expanded={expanded}
      aria-controls={controls}
      onClick={onClick}
    >
      <span className="bridge-primary-action__icon" aria-hidden="true">{icon}</span>
      <span className="bridge-primary-action__copy">
        <strong>{title}</strong>
        <span>{description}</span>
      </span>
      {trailing ? <span className="bridge-primary-action__trailing">{trailing}</span> : null}
    </button>
  );
}

export function BridgeTaskBanner({
  variant,
  title,
  copy,
  onChangeAccess,
  actionLabel = 'Change Access',
}: {
  variant: 'ready' | 'warning' | 'offline' | 'progress' | 'failed';
  title: string;
  copy: string;
  onChangeAccess: () => void;
  actionLabel?: string;
}) {
  return (
    <section className={['bridge-task-banner', `bridge-task-banner--${variant}`].join(' ')}>
      <div>
        <h3>{title}</h3>
        <p>{copy}</p>
      </div>
      <button type="button" onClick={onChangeAccess} className="bridge-button bridge-button-secondary">
        {actionLabel}
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
      <span>{toolProfile ? `${toolProfile} profile` : 'Server tier unknown'}</span>
      <span>{publicToolCount ?? 0}{total ? `/${total}` : ''} exposed</span>
      <span>{preferredToolCount} preferred</span>
      <span>{hiddenByProfileCount} profile-hidden</span>
    </div>
  );
}
