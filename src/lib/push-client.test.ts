import { test, describe } from "node:test";
import assert from "node:assert";
import {
  SERVER_PUSH_CAPABILITIES,
  isIos,
  isStandalone,
  probePushCapabilities,
  urlBase64ToUint8Array,
} from "./push-client";

describe("Push Client Helpers", () => {
  test("should decode a VAPID public key into a 65 bytes P-256 point", () => {
    const vapidPublicKey =
      "BM3OVB90RkWr8jK7xjolYYf7ysbXFdnIVzogPMXxNH3JCUypIcqUIW_G1W9fvNP9HdB3uipaFuquAaTP2toA8BQ";

    const decoded = urlBase64ToUint8Array(vapidPublicKey);

    assert.ok(decoded instanceof Uint8Array);
    assert.strictEqual(decoded.length, 65);
    assert.strictEqual(
      decoded[0],
      4,
      "An uncompressed P-256 point starts with 0x04",
    );
  });

  test("should translate the url-safe base64 alphabet", () => {
    const decoded = urlBase64ToUint8Array("-_8");

    assert.deepStrictEqual(Array.from(decoded), [251, 255]);
  });

  test("should restore the missing base64 padding", () => {
    const decoded = urlBase64ToUint8Array("QQ");

    assert.deepStrictEqual(Array.from(decoded), [65]);
  });

  test("should recognise iOS user agents", () => {
    const iphone =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15";
    const ipad =
      "Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15";
    const android =
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36";

    assert.strictEqual(isIos(iphone), true);
    assert.strictEqual(isIos(ipad), true);
    assert.strictEqual(isIos(android), false);
  });

  test("should detect the standalone display mode from the navigator flag", () => {
    assert.strictEqual(isStandalone({ standalone: true }), true);
    assert.strictEqual(isStandalone({ standalone: false }), false);
    assert.strictEqual(isStandalone({}), false);
  });
});

describe("probePushCapabilities", () => {
  /**
   * The result feeds `useSyncExternalStore`, which compares snapshots by
   * reference and throws "The result of getSnapshot should be cached" if a fresh
   * object comes back each render. Capabilities cannot change within a session,
   * so caching is both safe and required.
   */
  test("should return the very same object on repeated calls", () => {
    assert.strictEqual(probePushCapabilities(), probePushCapabilities());
  });

  test("should report both capabilities as booleans", () => {
    const capabilities = probePushCapabilities();

    assert.strictEqual(typeof capabilities.supported, "boolean");
    assert.strictEqual(typeof capabilities.needsInstall, "boolean");
  });

  test("should report nothing available without a browser", () => {
    // Node has no window, so the probe must degrade rather than throw: this is
    // the path taken during server rendering.
    assert.deepStrictEqual(probePushCapabilities(), {
      supported: false,
      needsInstall: false,
    });
  });

  test("should offer a stable server snapshot", () => {
    assert.strictEqual(SERVER_PUSH_CAPABILITIES, SERVER_PUSH_CAPABILITIES);
    assert.deepStrictEqual(SERVER_PUSH_CAPABILITIES, {
      supported: false,
      needsInstall: false,
    });
  });
});
