const checkbox = document.getElementById("mergeExternal");
const status   = document.getElementById("status");

let saveTimer = null;

// ── Load saved setting on open ────────────────────────────────────────────────
chrome.storage.sync.get({ mergeExternal: false }, items => {
  checkbox.checked = items.mergeExternal;
});

// ── Save on change ────────────────────────────────────────────────────────────
checkbox.addEventListener("change", () => {
  chrome.storage.sync.set({ mergeExternal: checkbox.checked }, () => {
    // Show "Settings saved" briefly
    status.classList.add("visible");
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => status.classList.remove("visible"), 1800);
  });
});