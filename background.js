// Zendesk Tab Merge — background.js  v2.1
//
// Merges Zendesk ticket tabs into one tab per instance.
// The primary instance (support.zendesk.com) is always merged.
// External instances (any other *.zendesk.com subdomain) are merged
// only when the "Merge tabs for external Zendesk instances" toggle is on.
//
// Changelog v2.0 → v2.1:
//   - Fixed: external ticket links now correctly route into a tab sitting on
//     a View (/agent/filters/*) or any other agent page, not just ticket pages.
//     Previously only tabs already on /agent/tickets/* were considered as
//     reuse candidates, causing a new tab to open if the Zendesk tab was on
//     a View. Broadened the tab query from /agent/tickets/* to /agent/* to
//     catch all Zendesk agent tab states.
//
// Changelog v1.1 → v2.0:
//   - Extended URL matching to any *.zendesk.com subdomain (was support.zendesk.com only)
//   - Each subdomain now merges into its own dedicated tab
//   - Added chrome.storage setting to toggle external-instance merging on/off
//   - Added popup UI (popup.html / popup.js) to control the toggle
//   - Improved error cleanup: in-flight guard is released on error as well as success
//   - Removed legacy v1.0 rollback code

// ── Constants ─────────────────────────────────────────────────────────────────

const PRIMARY_HOST = "support.zendesk.com";

// Matches any https://*.zendesk.com/agent/tickets/{id} URL.
// Capture group 1 → full host   (e.g. "z3n-zenjoe.zendesk.com")
// Capture group 2 → ticket ID   (e.g. "12345")
const TICKET_REGEX = /^https:\/\/([\w-]+\.zendesk\.com)\/agent\/tickets\/(\d+)$/;

// ── In-flight guard ───────────────────────────────────────────────────────────
const inFlightTabReuses = new Set();

// ── Settings ──────────────────────────────────────────────────────────────────

async function getMergeExternalEnabled() {
  return new Promise(resolve => {
    chrome.storage.sync.get({ mergeExternal: false }, items => {
      resolve(items.mergeExternal);
    });
  });
}

// ── Core reuse logic ──────────────────────────────────────────────────────────

async function tryReuseTab(tabId, url) {
  // 1. Only act on Zendesk ticket URLs
  const match = url.match(TICKET_REGEX);
  if (!match) return;

  const host      = match[1];
  const ticketId  = match[2];
  const isPrimary = (host === PRIMARY_HOST);

  // 2. For external instances, check the user toggle
  if (!isPrimary) {
    const enabled = await getMergeExternalEnabled();
    if (!enabled) return;
  }

  // 3. Skip if this tab is already mid-reuse
  if (inFlightTabReuses.has(tabId)) return;

  let targetId = null;

  try {
    // 4. Find any Zendesk agent tab for this host in the current window.
    //    Broadened from /agent/tickets/* to /agent/* so that tabs sitting
    //    on Views (/agent/filters/*) or any other agent page are included.
    const tabs = await chrome.tabs.query({
      currentWindow: true,
      url: `https://${host}/agent/*`,  // ← v2.1 fix
    });

    // 5. Exclude the newly-opened tab, pinned tabs, and discarded tabs
    const candidates = tabs.filter(t =>
      t.id    !== tabId &&
      !t.pinned          &&
      !t.discarded
    );

    if (candidates.length === 0) return;

    // 6. Prefer a tab already showing this exact ticket; otherwise use the first one
    const target = candidates.find(t => t.url === url) ?? candidates[0];
    targetId = target.id;

    inFlightTabReuses.add(targetId);

    // 7. Bring the target tab to the correct URL and activate it
    if (target.url === url) {
      await chrome.tabs.update(targetId, { active: true });
    } else {
      await chrome.tabs.update(targetId, { url, active: true });
    }

    // 8. Close the newly-opened duplicate tab
    await chrome.tabs.remove(tabId);

    // 9. Release the guard after a short delay
    setTimeout(() => inFlightTabReuses.delete(targetId), 1000);

    console.log(
      `[Zendesk Tab Merge] Ticket #${ticketId} on ${host}` +
      ` → reused tab ${targetId}, closed tab ${tabId}`
    );

  } catch (err) {
    console.error("[Zendesk Tab Merge] Error in tryReuseTab:", err);
    // Always clean up the guard to avoid a permanently blocked tab
    if (targetId !== null) inFlightTabReuses.delete(targetId);
  }
}

// ── Listener ──────────────────────────────────────────────────────────────────

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url) {
    tryReuseTab(tabId, changeInfo.url);
  }
});
