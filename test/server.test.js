const { test, describe, before, after } = require("node:test");
const assert = require("node:assert");
const http = require("node:http");
const app = require("../server");

describe("Server API & Security Tests", () => {
  let server;
  let baseUrl;
  const originalGroqKey = process.env.GROQ_API_KEY;
  const originalFetch = global.fetch;

  before(async () => {
    await new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, "127.0.0.1", () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    process.env.GROQ_API_KEY = originalGroqKey;
    global.fetch = originalFetch;
    await new Promise((resolve) => server.close(resolve));
  });

  test("GET / serves the NatureSnap AI web interface", async () => {
    const res = await fetch(`${baseUrl}/`);
    assert.strictEqual(res.status, 200);
    const text = await res.text();
    assert.ok(text.includes("NatureSnap AI"));
    assert.ok(text.includes("Discover Nature"));
    assert.ok(text.includes("tabHistory"));
    assert.ok(text.includes("tabSaved"));
  });

  test("GET /discovery-store.js serves the client discovery store module", async () => {
    const res = await fetch(`${baseUrl}/discovery-store.js`);
    assert.strictEqual(res.status, 200);
    const text = await res.text();
    assert.ok(text.includes("NatureSnapStore"));
    assert.ok(text.includes("HISTORY_STORAGE_KEY"));
  });

  test("Scenario 10: POST /api/analyze fails gracefully when no image is uploaded", async () => {
    const res = await fetch(`${baseUrl}/api/analyze`, {
      method: "POST",
    });
    assert.strictEqual(res.status, 400);
    const json = await res.json();
    assert.ok(json.error);
    assert.strictEqual(json.error, "Please select an image first.");
  });

  test("Scenario 10: POST /api/analyze rejects invalid image signature", async () => {
    const form = new FormData();
    // Create a blob with jpeg mimetype but invalid header bytes
    const fakeBlob = new Blob([new Uint8Array([0x00, 0x01, 0x02, 0x03])], {
      type: "image/jpeg",
    });
    form.append("image", fakeBlob, "fake.jpg");

    const res = await fetch(`${baseUrl}/api/analyze`, {
      method: "POST",
      body: form,
    });
    assert.strictEqual(res.status, 400);
    const json = await res.json();
    assert.ok(json.error);
    assert.ok(json.error.includes("valid JPG, PNG, GIF, or WebP"));
  });

  test("Scenario 10: POST /api/analyze returns 500 when GROQ_API_KEY is missing", async () => {
    delete process.env.GROQ_API_KEY;

    const form = new FormData();
    // Valid JPEG signature: 0xFF, 0xD8, 0xFF
    const validJpg = new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10])], {
      type: "image/jpeg",
    });
    form.append("image", validJpg, "photo.jpg");

    const res = await fetch(`${baseUrl}/api/analyze`, {
      method: "POST",
      body: form,
    });
    assert.strictEqual(res.status, 500);
    const json = await res.json();
    assert.strictEqual(json.error, "Server key missing.");
  });

  test("Scenario 1 & 11: Successful image analysis completes and returns formatted report", async () => {
    process.env.GROQ_API_KEY = "gsk_mock_secret_test_key_12345";

    // Mock global.fetch for the upstream Groq call
    global.fetch = async (url, options) => {
      if (typeof url === "string" && url.includes("api.groq.com")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            choices: [
              {
                message: {
                  content:
                    "1) Name: Douglas Fir (Pseudotsuga menziesii)\n" +
                    "2) Three short interesting facts:\n" +
                    "- It can grow over 250 feet tall.\n" +
                    "- Native to western North America.\n" +
                    "- Not a true fir, hence the hyphen in Douglas-fir.\n" +
                    "3) Activity: Hike through an evergreen forest and examine the distinctive 3-pointed cone bracts.",
                },
              },
            ],
          }),
        };
      }
      return originalFetch(url, options);
    };

    const form = new FormData();
    const validJpg = new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10])], {
      type: "image/jpeg",
    });
    form.append("image", validJpg, "douglas_fir.jpg");

    const res = await fetch(`${baseUrl}/api/analyze`, {
      method: "POST",
      body: form,
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.ok(json.analysis);
    assert.ok(json.analysis.includes("Douglas Fir"));
  });

  test("Scenario 10: Upstream Groq failure returns 502 gracefully", async () => {
    process.env.GROQ_API_KEY = "gsk_mock_secret_test_key_12345";

    global.fetch = async (url, options) => {
      if (typeof url === "string" && url.includes("api.groq.com")) {
        return {
          ok: false,
          status: 500,
          json: async () => ({ error: "Internal Groq Error" }),
        };
      }
      return originalFetch(url, options);
    };

    const form = new FormData();
    const validJpg = new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10])], {
      type: "image/jpeg",
    });
    form.append("image", validJpg, "photo.jpg");

    const res = await fetch(`${baseUrl}/api/analyze`, {
      method: "POST",
      body: form,
    });
    assert.strictEqual(res.status, 502);
    const json = await res.json();
    assert.ok(json.error);
    assert.strictEqual(json.error, "AI analysis failed. Please try again later.");
  });

  test("Scenario 12: API keys and credentials are NEVER exposed in any response", async () => {
    const secretKey = "gsk_secret_never_leak_this_key_99999";
    process.env.GROQ_API_KEY = secretKey;

    // Check GET /
    const homeRes = await fetch(`${baseUrl}/`);
    const homeHtml = await homeRes.text();
    assert.strictEqual(homeHtml.includes(secretKey), false);

    // Check GET /discovery-store.js
    const storeRes = await fetch(`${baseUrl}/discovery-store.js`);
    const storeJs = await storeRes.text();
    assert.strictEqual(storeJs.includes(secretKey), false);

    // Check POST /api/analyze error response
    const errRes = await fetch(`${baseUrl}/api/analyze`, { method: "POST" });
    const errText = await errRes.text();
    assert.strictEqual(errText.includes(secretKey), false);
  });
});
