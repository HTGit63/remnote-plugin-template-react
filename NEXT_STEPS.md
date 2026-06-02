# Next Steps

## Required Before Public Production

1. Run full automated release gates from `README.md`.
2. Run server-only clean install/build from `server/`.
3. Run live RemNote manual golden test with `create_or_replace_note_from_markdown`.
4. Verify Render deployment with real hosted PostgreSQL and OAuth/provider secrets.
5. Monitor and maintain codebase split guidelines (no files over 1000 lines) during future feature work.

## Manual Golden Test

Focus Rem:

```text
Plugin Test
```

Use:

```text
create_or_replace_note_from_markdown
```

Sample must include H1 title, at least 8 H3 sections, blank spacers, multiple paragraphs, nested bullets, numbered list, inline math, block math, code block, table, and formula-heavy section.

Do not mark manual proof complete without live plugin access and actual returned `rootRemId`, `createdRemIds`, and passing verification.

## Known Limitations

- Live RemNote manual golden test is environment-dependent.
- Hosted Render proof needs real secrets and deployment logs.
- `create_folder` remains SDK-unsupported.
- All primary code files successfully comply with size limits under Goal 2.

