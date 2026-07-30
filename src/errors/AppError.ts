export class AppError extends Error {
  public readonly status: number;

  constructor(message: string = "Internal server error", status: number = 500) {
    super(message);
    this.name = "AppError";
    this.status = status;

    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Turns anything thrown into a status and a message safe to send to a client.
 *
 * Only an `AppError` is quotable: it is raised deliberately, with wording meant
 * to be read. Everything else — driver failures, programming mistakes — becomes
 * a bare 500, because those messages describe the server. The build log leaking
 * `SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string` is the
 * kind of thing that used to reach the response body.
 *
 * A duck-typed `status` is deliberately not trusted: `throw {status: 200}` from
 * anywhere in a dependency should not be able to pick the response code.
 */
export function toErrorResponse(err: unknown): {
  status: number;
  message: string;
} {
  if (err instanceof AppError) {
    return { status: err.status, message: err.message };
  }

  return { status: 500, message: "Internal server error" };
}
