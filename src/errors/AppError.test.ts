import { test, describe } from "node:test";
import assert from "node:assert";
import { AppError, toErrorResponse } from "./AppError";

describe("toErrorResponse", () => {
  test("should carry through the status and message of an AppError", () => {
    const result = toErrorResponse(new AppError("Object not found", 404));

    assert.strictEqual(result.status, 404);
    assert.strictEqual(result.message, "Object not found");
  });

  test("should map an unexpected Error to a 500 without leaking its message", () => {
    // A driver error reads like `SASL: SCRAM-SERVER-FIRST-MESSAGE: client
    // password must be a string`, which describes the server's configuration to
    // whoever asked. Only errors this app raised on purpose are quotable.
    const result = toErrorResponse(
      new Error("SASL: client password must be a string"),
    );

    assert.strictEqual(result.status, 500);
    assert.strictEqual(result.message, "Internal server error");
  });

  test("should handle a thrown value that is not an Error", () => {
    assert.strictEqual(toErrorResponse("boom").status, 500);
    assert.strictEqual(toErrorResponse(undefined).status, 500);
    assert.strictEqual(toErrorResponse(null).message, "Internal server error");
  });

  test("should not trust a status carried by a plain object", () => {
    // Anything can be thrown. Only a real AppError sets the response code.
    const result = toErrorResponse({ status: 200, message: "fine" });

    assert.strictEqual(result.status, 500);
    assert.strictEqual(result.message, "Internal server error");
  });

  test("should keep a client error status from an AppError subclass", () => {
    class NotAllowed extends AppError {
      constructor() {
        super("Not allowed", 403);
      }
    }

    const result = toErrorResponse(new NotAllowed());

    assert.strictEqual(result.status, 403);
    assert.strictEqual(result.message, "Not allowed");
  });
});
