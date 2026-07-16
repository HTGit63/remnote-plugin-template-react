import logoUrl from '../../../public/logo.svg';

/**
 * The supplied RemnoteMCP mark is bundled as a data URL so RemNote's native
 * widget, sandbox widget, command palette, and sidebar tab all receive the
 * exact same asset without depending on iframe-relative paths.
 */
export const REMNOTE_MCP_LOGO_URL = logoUrl;
