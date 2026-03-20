# Repository Guidelines

## Project Structure & Module Organization
- Root: `manifest.json` (MV3 config), `README.md`, `TODO.md`.
- UI: `popup.html`, `popup.css`, `popup.js` (popup UI and logic).
- Background: `background.js` (extension background context).
- Assets: `images/` (icons: `icon16.png`, `icon48.png`, `icon128.png`).
- No build system; sources load directly via Chrome “Load unpacked”.

## Build, Test, and Development Commands
- Run locally: Chrome → `chrome://extensions` → enable Developer mode → “Load unpacked” → select repo root.
- Quick package: `zip -r dist/tab-groups-manager.zip . -x "*.DS_Store" "dist/*" ".idea/*" ".github/*"`
- Refresh while developing: click the extension’s “Reload” in `chrome://extensions` and reopen the popup.

## Coding Style & Naming Conventions
- JavaScript: 2-space indent, semicolons, single quotes; keep functions small and focused.
- Naming: `camelCase` for variables/functions; filenames lowercase like `popup.js`.
- HTML/CSS: descriptive IDs/classes; keep popup assets co-located.
- Tools: No linter configured; prefer Prettier defaults (2 spaces, semicolons) if formatting.

## Testing Guidelines
- Framework: None yet; manual testing via popup and DevTools.
- Manual checks:
  - Window/group/tab counts render and update correctly.
  - Create group applies title/color; sort and search behave.
  - “Show/Hide Tabs”, “Close group”, and “Focus window” work.
  - Edge cases: zero windows, zero groups, empty groups.
- Inspect popup: right-click popup → Inspect for console/DOM.

## Commit & Pull Request Guidelines
- Commits: Prefer Conventional Commits (e.g., `feat: add tab sorting by count`, `fix: correct tab count when closing`).
- PRs: Clear description, linked issues, screenshots/GIFs for UI changes, and call out any `manifest.json` permission changes.
- Keep changes minimal; update `README.md` if user-facing behavior changes.

## Security & Configuration Tips
- Permissions: Keep `manifest.json` minimal (`tabGroups`, `tabs`, `windows`, `storage` as needed).
- No secrets in repo; avoid remote code execution or external eval.
- Use `localStorage` only for non-sensitive metadata.
