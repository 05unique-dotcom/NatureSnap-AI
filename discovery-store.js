(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.NatureSnapStore = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const HISTORY_STORAGE_KEY = "naturesnap_session_history";
  const SAVED_STORAGE_KEY = "naturesnap_saved_discoveries";

  function isValidImageReference(ref) {
    if (!ref || typeof ref !== "string") return false;
    const trimmed = ref.trim();
    return (
      trimmed.startsWith("data:image/") ||
      trimmed.startsWith("blob:") ||
      trimmed.startsWith("http://") ||
      trimmed.startsWith("https://")
    );
  }

  function stripMarkdown(text) {
    return String(text || "")
      .replace(/[*_#`~]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function extractTitle(rawReport) {
    if (!rawReport || typeof rawReport !== "string") return "Nature Discovery";
    const text = rawReport.replace(/\r/g, "");
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

    for (const line of lines) {
      const match = line.match(
        /^(?:#{1,4}\s*)?(?:\*\*)?(?:1[\).]\s*)?(?:Name|Identification|Species|Common Name)\s*[:\-]\s*(.+)$/i
      );
      if (match) {
        const cleaned = stripMarkdown(match[1]).replace(/[:.]+$/, "");
        if (cleaned.length > 0 && cleaned.length <= 100) return cleaned;
      }
    }

    for (const line of lines) {
      if (/^1[\).]\s*/.test(line)) {
        const cleaned = stripMarkdown(line.replace(/^1[\).]\s*/, "")).replace(/[:.]+$/, "");
        if (cleaned.length > 0 && cleaned.length <= 100) return cleaned;
      }
    }

    for (const line of lines) {
      const heading = line.match(/^#{1,3}\s+(.+)$/);
      if (heading) {
        const cleaned = stripMarkdown(heading[1]);
        if (cleaned.length > 0 && cleaned.length <= 100) return cleaned;
      }
    }

    if (lines.length > 0) {
      const cleaned = stripMarkdown(lines[0]);
      if (cleaned.length > 0 && cleaned.length <= 100) return cleaned;
    }

    return "Nature Discovery";
  }

  function extractSummary(rawReport) {
    if (!rawReport || typeof rawReport !== "string") return "AI-generated nature report.";
    const text = rawReport.replace(/\r/g, "");
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

    let summaryParts = [];
    let passedTitle = false;

    for (const line of lines) {
      if (!passedTitle) {
        if (/name|identif|species/i.test(line) || /^1[\).]/i.test(line)) {
          passedTitle = true;
          continue;
        }
      }
      const cleaned = stripMarkdown(line.replace(/^[*\-•\d+.)]\s*/, ""));
      if (cleaned.length > 15 && !/^#{1,4}/.test(line)) {
        summaryParts.push(cleaned);
        if (summaryParts.join(" ").length >= 120) break;
      }
    }

    if (!summaryParts.length && lines.length > 1) {
      summaryParts.push(stripMarkdown(lines[1]));
    }

    const combined = summaryParts.join(" ").trim();
    if (!combined) return "AI-generated nature report.";
    if (combined.length > 140) {
      return combined.substring(0, 137).trim() + "...";
    }
    return combined;
  }

  function createDiscovery(data) {
    const rawData = data || {};
    const reportText = String(rawData.report || "").trim();
    const generatedId =
      rawData.id ||
      "nat_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);

    return {
      id: String(generatedId),
      title: (rawData.title || extractTitle(reportText) || "Nature Discovery").trim(),
      summary: (rawData.summary || extractSummary(reportText) || "AI-generated nature report.").trim(),
      report: reportText,
      imageReference: isValidImageReference(rawData.imageReference) ? rawData.imageReference : null,
      createdAt: rawData.createdAt || new Date().toISOString(),
      savedAt: rawData.savedAt || null,
    };
  }

  function formatTimestamp(isoString) {
    if (!isoString) return "";
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return String(isoString);
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return String(isoString);
    }
  }

  function safeStorageGet(storage, key) {
    if (!storage) return [];
    try {
      const raw = storage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn("NatureSnapStore: Failed to read from storage", e);
      return [];
    }
  }

  function safeStorageSet(storage, key, value) {
    if (!storage) return false;
    try {
      storage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn("NatureSnapStore: Failed to write to storage", e);
      return false;
    }
  }

  // --- Session History Store ---
  const HistoryStore = {
    getAll: function (customStorage) {
      const storage = customStorage || (typeof sessionStorage !== "undefined" ? sessionStorage : null);
      return safeStorageGet(storage, HISTORY_STORAGE_KEY);
    },

    add: function (discoveryInput, customStorage) {
      const storage = customStorage || (typeof sessionStorage !== "undefined" ? sessionStorage : null);
      const entry = createDiscovery(discoveryInput);
      const list = safeStorageGet(storage, HISTORY_STORAGE_KEY);

      // Avoid exact duplicates in history (same id or same report + title)
      const filtered = list.filter(
        item => item.id !== entry.id && !(item.title === entry.title && item.report === entry.report)
      );
      filtered.unshift(entry);

      // Keep recent 50 entries
      if (filtered.length > 50) filtered.length = 50;
      safeStorageSet(storage, HISTORY_STORAGE_KEY, filtered);
      return entry;
    },

    getById: function (id, customStorage) {
      const list = this.getAll(customStorage);
      return list.find(item => item.id === id) || null;
    },

    clear: function (customStorage) {
      const storage = customStorage || (typeof sessionStorage !== "undefined" ? sessionStorage : null);
      if (storage) {
        try {
          storage.removeItem(HISTORY_STORAGE_KEY);
          return true;
        } catch {
          return false;
        }
      }
      return false;
    },
  };

  // --- Saved Discoveries Store ---
  const SavedStore = {
    getAll: function (customStorage) {
      const storage = customStorage || (typeof localStorage !== "undefined" ? localStorage : null);
      return safeStorageGet(storage, SAVED_STORAGE_KEY);
    },

    isSaved: function (idOrEntry, customStorage) {
      const list = this.getAll(customStorage);
      if (typeof idOrEntry === "string") {
        return list.some(item => item.id === idOrEntry);
      }
      if (idOrEntry && typeof idOrEntry === "object") {
        return list.some(
          item =>
            item.id === idOrEntry.id ||
            (item.title === idOrEntry.title && item.report === idOrEntry.report)
        );
      }
      return false;
    },

    save: function (discoveryInput, customStorage) {
      const storage = customStorage || (typeof localStorage !== "undefined" ? localStorage : null);
      const list = safeStorageGet(storage, SAVED_STORAGE_KEY);

      const isDup = list.some(
        item =>
          item.id === discoveryInput.id ||
          (item.title === discoveryInput.title && item.report === discoveryInput.report)
      );

      if (isDup) {
        const existing = list.find(
          item =>
            item.id === discoveryInput.id ||
            (item.title === discoveryInput.title && item.report === discoveryInput.report)
        );
        return { success: false, reason: "DUPLICATE", entry: existing };
      }

      const entry = createDiscovery(discoveryInput);
      entry.savedAt = new Date().toISOString();
      list.unshift(entry);

      const saved = safeStorageSet(storage, SAVED_STORAGE_KEY, list);
      return { success: saved, reason: saved ? "SAVED" : "STORAGE_ERROR", entry };
    },

    remove: function (id, customStorage) {
      const storage = customStorage || (typeof localStorage !== "undefined" ? localStorage : null);
      const list = safeStorageGet(storage, SAVED_STORAGE_KEY);
      const initialCount = list.length;
      const updated = list.filter(item => item.id !== id);

      if (updated.length === initialCount) {
        return { success: false, reason: "NOT_FOUND", id };
      }

      safeStorageSet(storage, SAVED_STORAGE_KEY, updated);
      return { success: true, reason: "REMOVED", id };
    },

    getById: function (id, customStorage) {
      const list = this.getAll(customStorage);
      return list.find(item => item.id === id) || null;
    },
  };

  return {
    HISTORY_STORAGE_KEY,
    SAVED_STORAGE_KEY,
    isValidImageReference,
    extractTitle,
    extractSummary,
    createDiscovery,
    formatTimestamp,
    HistoryStore,
    SavedStore,
  };
});
