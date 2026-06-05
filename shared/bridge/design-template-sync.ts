import type { NoteDesignConflictBehavior, NoteDesignTemplate } from './protocol-write-args.js';

export interface HostedNoteDesignTemplateOwner {
  accountId: string;
  userId: string;
}

export interface HostedNoteDesignTemplateRecord {
  schemaVersion: 1;
  templateId: string;
  owner: HostedNoteDesignTemplateOwner;
  template: NoteDesignTemplate;
  version: number;
  updatedAt: string;
  deletedAt?: string;
}

export interface HostedNoteDesignTemplateSyncCursor {
  accountId: string;
  userId: string;
  cursor: string;
  lastSyncedAt: string;
}

export interface HostedNoteDesignTemplateSyncPlan {
  enabled: false;
  schemaVersion: 1;
  ownership: 'account_user_template';
  conflictBehavior: NoteDesignConflictBehavior;
  localStore: 'plugin.storage.local';
  hostedStore: 'not_implemented';
  securityNote: 'No hosted template sync is implemented until authenticated account ownership is enforced server-side.';
}

export const HOSTED_NOTE_DESIGN_TEMPLATE_SYNC_PLAN: HostedNoteDesignTemplateSyncPlan = {
  enabled: false,
  schemaVersion: 1,
  ownership: 'account_user_template',
  conflictBehavior: 'versioned_reject',
  localStore: 'plugin.storage.local',
  hostedStore: 'not_implemented',
  securityNote: 'No hosted template sync is implemented until authenticated account ownership is enforced server-side.',
};
