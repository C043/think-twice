import { test, describe } from "node:test";
import assert from "node:assert";
import { isIos, isStandalone, urlBase64ToUint8Array } from "./push-client";

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
