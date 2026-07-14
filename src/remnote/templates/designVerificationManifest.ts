import type { RNPlugin } from '@remnote/plugin-sdk';
import type {
  CompiledNoteDesignManifest,
  CreateDesignedNoteTreeResult,
  NoteDesignRules,
} from '../../../shared/bridge/protocol';

const APPLIED_DESIGN_MANIFEST_STORAGE_KEY = 'bridge-applied-design-verification-manifests-v1';

export interface AppliedDesignVerificationManifest {
  schemaVersion: 1;
  rootRemId: string;
  templateId?: string;
  templateVersion?: number;
  rules: NoteDesignRules;
  compiledManifest: CompiledNoteDesignManifest;
  materializationEvidence: CreateDesignedNoteTreeResult['materializationEvidence'];
  recordedAt: string;
}

type AppliedDesignVerificationManifestStore = Record<string, AppliedDesignVerificationManifest>;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export async function saveAppliedDesignVerificationManifest(
  plugin: RNPlugin,
  manifest: AppliedDesignVerificationManifest
): Promise<void> {
  if (!plugin.storage) return;
  const existing = await plugin.storage
    .getLocal<AppliedDesignVerificationManifestStore>(APPLIED_DESIGN_MANIFEST_STORAGE_KEY)
    .catch(() => undefined);
  const store = existing && typeof existing === 'object' ? existing : {};
  await plugin.storage.setLocal(APPLIED_DESIGN_MANIFEST_STORAGE_KEY, {
    ...store,
    [manifest.rootRemId]: clone(manifest),
  });
}

export async function getAppliedDesignVerificationManifest(
  plugin: RNPlugin,
  rootRemId: string
): Promise<AppliedDesignVerificationManifest | undefined> {
  if (!plugin.storage) return undefined;
  const store = await plugin.storage
    .getLocal<AppliedDesignVerificationManifestStore>(APPLIED_DESIGN_MANIFEST_STORAGE_KEY)
    .catch(() => undefined);
  const manifest = store?.[rootRemId];
  if (
    !manifest ||
    manifest.schemaVersion !== 1 ||
    manifest.rootRemId !== rootRemId ||
    !manifest.rules ||
    !manifest.compiledManifest ||
    !Array.isArray(manifest.materializationEvidence)
  ) {
    return undefined;
  }
  return clone(manifest);
}
