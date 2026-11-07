const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert");
const NatureSnapStore = require("../discovery-store");

function createMockStorage() {
  let store = {};
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    },
    setItem(key, value) {
      store[key] = String(value);
    },
    removeItem(key) {
      delete store[key];
    },
    clear() {
      store = {};
    },
    _getRaw() {
      return store;
    },
  };
}

describe("Discovery Store and History Management", () => {
  let mockSessionStorage;
  let mockLocalStorage;

  beforeEach(() => {
    mockSessionStorage = createMockStorage();
    mockLocalStorage = createMockStorage();
  });

  const sampleReport = `
### 1) Name: Monarch Butterfly (Danaus plexippus)
**2) Facts:**
* Monarch butterflies migrate up to 3,000 miles every autumn.
* Their bright orange wings warn predators that they are poisonous.
* Caterpillars feed exclusively on milkweed plants.
**3) Outdoor Activity:**
Plant native milkweed in your garden to provide a habitat for monarch caterpillars.
  `.trim();

  test("Title and summary extraction from report", () => {
    const title = NatureSnapStore.extractTitle(sampleReport);
    assert.strictEqual(title, "Monarch Butterfly (Danaus plexippus)");

    const summary = NatureSnapStore.extractSummary(sampleReport);
    assert.ok(summary.length > 0);
    assert.ok(summary.includes("Monarch butterflies migrate"));
  });

  test("Fallback title when report has no name header", () => {
    const title = NatureSnapStore.extractTitle("");
    assert.strictEqual(title, "Nature Discovery");
  });

  test("Scenario 2: Analysis appears in session history", () => {
    const entry = NatureSnapStore.createDiscovery({
      report: sampleReport,
      imageReference: "data:image/jpeg;base64,samplethumbnail",
    });

    NatureSnapStore.HistoryStore.add(entry, mockSessionStorage);
    const history = NatureSnapStore.HistoryStore.getAll(mockSessionStorage);

    assert.strictEqual(history.length, 1);
    assert.strictEqual(history[0].id, entry.id);
    assert.strictEqual(history[0].title, "Monarch Butterfly (Danaus plexippus)");
    assert.strictEqual(history[0].imageReference, "data:image/jpeg;base64,samplethumbnail");
    assert.ok(history[0].createdAt);
  });

  test("Scenario 3 & 4: Save a discovery and persist across session/navigation", () => {
    const entry = NatureSnapStore.createDiscovery({
      id: "nat_test_1",
      report: sampleReport,
      imageReference: "data:image/jpeg;base64,thumb123",
    });

    // Save discovery
    const result = NatureSnapStore.SavedStore.save(entry, mockLocalStorage);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.reason, "SAVED");
    assert.ok(result.entry.savedAt);

    // Simulate navigating away and returning (reading fresh from storage)
    const freshLoaded = NatureSnapStore.SavedStore.getAll(mockLocalStorage);
    assert.strictEqual(freshLoaded.length, 1);
    assert.strictEqual(freshLoaded[0].id, "nat_test_1");
    assert.strictEqual(freshLoaded[0].title, "Monarch Butterfly (Danaus plexippus)");
    assert.strictEqual(freshLoaded[0].imageReference, "data:image/jpeg;base64,thumb123");
    assert.strictEqual(freshLoaded[0].report, sampleReport);
    assert.ok(freshLoaded[0].savedAt);
  });

  test("Scenario 5: User removes a saved discovery", () => {
    const entry = NatureSnapStore.createDiscovery({
      id: "nat_remove_test",
      report: sampleReport,
    });

    NatureSnapStore.SavedStore.save(entry, mockLocalStorage);
    assert.strictEqual(NatureSnapStore.SavedStore.getAll(mockLocalStorage).length, 1);

    const removeResult = NatureSnapStore.SavedStore.remove("nat_remove_test", mockLocalStorage);
    assert.strictEqual(removeResult.success, true);
    assert.strictEqual(removeResult.reason, "REMOVED");

    const remaining = NatureSnapStore.SavedStore.getAll(mockLocalStorage);
    assert.strictEqual(remaining.length, 0);
  });

  test("Scenario 6: Duplicate saves are handled correctly", () => {
    const entry = NatureSnapStore.createDiscovery({
      id: "nat_dup_test",
      report: sampleReport,
      imageReference: "data:image/jpeg;base64,thumb",
    });

    // First save
    const firstSave = NatureSnapStore.SavedStore.save(entry, mockLocalStorage);
    assert.strictEqual(firstSave.success, true);

    // Second save with same entry
    const secondSave = NatureSnapStore.SavedStore.save(entry, mockLocalStorage);
    assert.strictEqual(secondSave.success, false);
    assert.strictEqual(secondSave.reason, "DUPLICATE");

    // Check list length is still 1
    const list = NatureSnapStore.SavedStore.getAll(mockLocalStorage);
    assert.strictEqual(list.length, 1);
  });

  test("Scenario 7: Empty history displays correctly", () => {
    const history = NatureSnapStore.HistoryStore.getAll(mockSessionStorage);
    assert.ok(Array.isArray(history));
    assert.strictEqual(history.length, 0);
  });

  test("Scenario 8: Empty saved discoveries displays correctly", () => {
    const saved = NatureSnapStore.SavedStore.getAll(mockLocalStorage);
    assert.ok(Array.isArray(saved));
    assert.strictEqual(saved.length, 0);
  });

  test("Scenario 9: Invalid or missing image references are handled gracefully", () => {
    // Null image reference
    const entryNull = NatureSnapStore.createDiscovery({
      report: sampleReport,
      imageReference: null,
    });
    assert.strictEqual(entryNull.imageReference, null);

    // Empty string
    const entryEmpty = NatureSnapStore.createDiscovery({
      report: sampleReport,
      imageReference: "",
    });
    assert.strictEqual(entryEmpty.imageReference, null);

    // Malformed / unsupported scheme
    const entryInvalid = NatureSnapStore.createDiscovery({
      report: sampleReport,
      imageReference: "javascript:alert(1)",
    });
    assert.strictEqual(entryInvalid.imageReference, null);

    // Valid data URL
    const entryDataUrl = NatureSnapStore.createDiscovery({
      report: sampleReport,
      imageReference: "data:image/jpeg;base64,abcdef==",
    });
    assert.strictEqual(entryDataUrl.imageReference, "data:image/jpeg;base64,abcdef==");

    // Valid blob URL
    const entryBlob = NatureSnapStore.createDiscovery({
      report: sampleReport,
      imageReference: "blob:http://localhost:3000/123-456",
    });
    assert.strictEqual(entryBlob.imageReference, "blob:http://localhost:3000/123-456");
  });

  test("Corrupted storage JSON handles gracefully without throwing", () => {
    mockLocalStorage.setItem(NatureSnapStore.SAVED_STORAGE_KEY, "{ invalid json corrupt");
    const list = NatureSnapStore.SavedStore.getAll(mockLocalStorage);
    assert.deepStrictEqual(list, []);
  });

  test("Clear session history removes all history items", () => {
    NatureSnapStore.HistoryStore.add(
      NatureSnapStore.createDiscovery({ report: "Test 1" }),
      mockSessionStorage
    );
    NatureSnapStore.HistoryStore.add(
      NatureSnapStore.createDiscovery({ report: "Test 2" }),
      mockSessionStorage
    );
    assert.strictEqual(NatureSnapStore.HistoryStore.getAll(mockSessionStorage).length, 2);

    NatureSnapStore.HistoryStore.clear(mockSessionStorage);
    assert.strictEqual(NatureSnapStore.HistoryStore.getAll(mockSessionStorage).length, 0);
  });
});
