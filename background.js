// Zendesk Tab Merge — background.js  v2.2
//
// Merges Zendesk ticket tabs into one tab per instance.
// The primary instance (support.zendesk.com) is always merged.
// External instances (any other *.zendesk.com subdomain) are merged
// only when the "Merge tabs for external Zendesk instances" toggle is on.
//
// Changelog v2.1 → v2.2:
//   - Fixed: URLs with additional path segments after the ticket ID
//     (e.g. /events) were not being matched by TICKET_REGEX due to a
//     strict end-of-string anchor ($). Made the trailing path segment
//     optional with (\/.*)?$ so /events and any future sub-paths are
//     handled correctly. Applies to Z2 and all external instances.

// ── Constants ─────────────────────────────────────────────────────────────────

const PRIMARY_HOST = "support.zendesk.com";

// Matches any https://*.zendesk.com/agent/tickets/{id} URL,
// including sub-paths like /events after the ticket ID.
// Capture group 1 → full host   (e.g. "z3n-zenjoe.zendesk.com")
// Capture group 2 → ticket ID   (e.g. "12345")
// Capture group 3 → sub-path    (e.g. "/events", optional)
const TICKET_REGEX = /^https:\/\/([\w-]+\.zendesk\.com)\/agent\/tickets\/(\d+)(\/.*)?$/;

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
  // 1. Only act on Zendesk ticket URLs (including sub-paths like /events)
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
    // 4. Find any Zendesk agent tab for this host in the current window
    const tabs = await chrome.tabs.query({
      currentWindow: true,
      url: `https://${host}/agent/*`,
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
    if (targetId !== null) inFlightTabReuses.delete(targetId);
  }
}

// ── Listener ──────────────────────────────────────────────────────────────────

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url) {
    tryReuseTab(tabId, changeInfo.url);
  }
});
