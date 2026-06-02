import type { RichTextFormatName } from '@remnote/plugin-sdk';
import type { BridgeErrorCode, RemColorName } from '../../../shared/bridge/protocol';

export const MAX_MARKDOWN_CHARS = 20000;
export const CREATE_TREE_DEFAULT_MAX_DEPTH = 8;
export const CREATE_TREE_DEFAULT_MAX_NODES = 200;
export const CREATE_TREE_MAX_DEPTH = 12;
export const CREATE_TREE_MAX_NODES = 1000;
export const CREATE_TREE_MAX_TITLE_LENGTH = 1000;
export const STRUCTURED_BATCH_CACHE_LIMIT = 50;

export type ParentLookupCode = Extract<BridgeErrorCode, 'REM_NOT_FOUND' | 'PARENT_NOT_FOUND'>;

export interface ValidatedTreeNode {
  title: string;
  children: ValidatedTreeNode[];
}

export interface TreeValidationState {
  nodeCount: number;
  maxDepthSeen?: number;
  maxDepthPath?: string;
  maxDepthTitle?: string;
}

export const COLOR_FORMATS: Record<RemColorName, RichTextFormatName | undefined> = {
  red: 'Red',
  orange: 'Orange',
  yellow: 'Yellow',
  green: 'Green',
  blue: 'Blue',
  purple: 'Purple',
  pink: undefined,
  gray: undefined,
  brown: undefined,
  default: undefined,
};

export const COLOR_FORMAT_NAMES: RichTextFormatName[] = ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Purple'];
