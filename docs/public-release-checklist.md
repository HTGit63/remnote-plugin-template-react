# RemnoteMCP Public Release Checklist

Status: unlisted beta candidate only until all verification gates pass.

## Marketplace Metadata

- [x] Product name: `RemnoteMCP`
- [x] Manifest description under 200 characters
- [x] `projectUrl`
- [x] `supportUrl`
- [x] `changelogUrl`
- [x] `requestNative: false`
- [x] `enableOnMobile: false` until mobile bridge behavior is verified
- [x] `unlisted: true` for beta
- [ ] Final privacy policy URL
- [ ] Final hosted support page
- [ ] Final changelog page
- [ ] Final marketplace icon asset beyond widget data-URI icon

## User Setup

- [x] Default widget shows setup, status, writing access, template selector, pending approval, last result, health check
- [x] Debug bundle and raw registry stay behind Advanced
- [x] RemNote commands registered for open, health check, template save, approved root, MCP URL, diagnostics, settings
- [x] Recommended mode is Focused Rem + Descendants with Read + Create + Modify
- [ ] Live user review that a first-time user understands setup in 30 seconds

## Security

- [x] Local token mode remains separate from hosted pairing mode
- [x] Hosted mode stays beta/guarded and is not described as production-ready
- [x] Danger Zone remains explicit and non-default
- [x] Diagnostics copy path redacts token/secret/content-style keys
- [ ] Privacy review
- [ ] Security review
- [ ] Dynamic `DescendantsOfId` permission experiment and manifest narrowing decision

## Write Quality

- [x] Bulk writer transaction result bug fixed in code
- [x] Bulk note tools return `durationMs`/performance data in code
- [ ] Live styled-tree write test in RemNote
- [ ] Live structured batch write test in RemNote
- [ ] Live markdown hierarchy write test in RemNote
- [ ] Live designed-note benchmark
- [ ] Live flashcard set benchmark
- [ ] Live danger tool dry-run/guard test

## Required Gates

- [x] `npm run check-types`
- [x] `npm run validate`
- [x] `npm run build`
- [x] `npm run server:build`
- [x] `npm run server:smoke`
- [ ] `npm run bridge:live-test`
- [x] `npm run test:style-correctness`
- [x] `npm run server:test:markdown-importer`
- [x] `npm run server:test:performance-benchmark`
- [ ] diagnostics redaction test
- [ ] manifest review
- [ ] setup wizard review

## Rollback Plan

- Keep release unlisted while beta gates are open.
- Revert hosted public URL from ChatGPT connector if hosted pairing or routing fails.
- Keep local mode documented as fallback.
- Disable danger tier in server config if destructive guard behavior regresses.
