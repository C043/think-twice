export class AppError extends Error {
  public readonly status: number;

  constructor(message: string = "Internal server error", status: number = 500) {
    super(message);
    this.name = "AppError";
    this.status = status;

    Object.setPrototypeOf(this, AppError.prototype);
  }
}
