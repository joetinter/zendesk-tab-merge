# Zendesk Tab Merge

A lightweight Chrome extension that automatically consolidates Zendesk ticket
tabs so you're never drowning in duplicates — no matter how many ticket links
you open throughout your day.

---

## How It Works

1. Open any Zendesk ticket link from an email, Slack, a doc, or anywhere else
   in your browser.
2. Instead of piling up a new tab each time, the extension silently navigates
   your existing Zendesk tab to that ticket.
3. The duplicate tab is closed automatically, keeping your tab bar clean.

---

## Features

- **Single-tab merging** — All ticket links for Z2 (support.zendesk.com) are
  automatically routed into one dedicated tab.
- **Multi-instance support** — Working across multiple Zendesk subdomains?
  Each instance gets its own dedicated tab, keeping them cleanly separated.
- **External instance toggle** — Enable or disable tab merging for non-Z2
  Zendesk instances with a single checkbox, right from the extension popup.
- **Smart deduplication** — If the ticket you're opening is already loaded,
  the extension focuses that tab rather than reloading it unnecessarily.
- **Pinned tab safe** — Pinned tabs are never modified or closed.

---

## Privacy & Data

Only your extension preference setting (the external instance toggle) is saved
locally via `chrome.storage.sync`. Nothing else is collected or stored.

| Data | Stored |
|---|---|
| External instance toggle preference | ✓ Yes — `chrome.storage.sync` |
| Ticket URLs / ticket IDs | ✗ No |
| Browsing history | ✗ No |
| User or personal data | ✗ No |
| Tab activity or logs | ✗ No |
| Anything sent to an external server | ✗ No |

> `chrome.storage.sync` means the toggle preference will silently sync across
> any Chrome instance where the user is signed into the same Google account.
> This has no privacy implications as it is a single `true`/`false` value.

---

## File Structure

| File | What it does |
|---|---|
| `background.js` | Service worker — core tab merge logic |
| `popup.html` | Extension popup UI |
| `popup.js` | Popup logic — loads and saves toggle preference |​
`manifest.json` | Extension config, permissions, host rules |

---

## Permissions

| Permission | Why it's needed |
|---|---|
| `tabs` | Read tab URLs and open/close/update tabs |
| `storage` | Save the external instance toggle preference |
| `https://*.zendesk.com/agent/tickets/*` | Interact only with Zendesk agent ticket pages |

---

## Usage

Once installed the extension works automatically in the background with no
setup required.

**To configure external instance merging:**

1. Click the extension icon in the Chrome toolbar
2. Check or uncheck **"Merge tabs for external Zendesk instances"**
3. The setting is saved instantly

---

## Compatibility

Works with any `*.zendesk.com` subdomain. Z2 (`support.zendesk.com`) is
always merged regardless of the external instance toggle.

| Instance | Always merged | Respects toggle |
|---|---|---|
| Z2 (`support.zendesk.com`) | ✓ | — |
| Any other `*.zendesk.com` | — | ✓ |

---

## Version History

### v2.1
- Fixed: external ticket links now correctly route into a tab sitting on
  a View (`/agent/filters/*`) or any other agent page, not just ticket pages
- Broadened tab query from `/agent/tickets/*` to `/agent/*` to catch all
  Zendesk agent tab states
- Updated `host_permissions` in `manifest.json` to match

### v2.0
- Extended URL matching to any `*.zendesk.com` subdomain (was
  `support.zendesk.com` only)
- Each subdomain now merges into its own dedicated tab
- Added `chrome.storage` setting to toggle external instance merging on/off
- Added popup UI to control the toggle
- Improved error cleanup: in-flight guard is now released on error as well
  as on success

### v1.1
- Added in-flight guard (`inFlightTabReuses`) to prevent re-entrant tab
  update loops
- Tab query scoped to current window only
- Pinned and discarded tabs excluded from candidates
- Prioritised reusing a tab with the exact same URL before falling back

### v1.0
- Initial release
- Single-tab merging for `support.zendesk.com`

---

## License

Internal use only. Not licensed for public distribution.
