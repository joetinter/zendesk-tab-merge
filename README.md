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
