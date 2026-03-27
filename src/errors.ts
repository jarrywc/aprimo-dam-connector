export class AprimoError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'AprimoError';
  }
}

export class AprimoApiError extends AprimoError {
  constructor(
    message: string,
    public readonly status: number,
    public readonly type: string,
    public readonly raw: unknown,
  ) {
    super(message, type);
    this.name = 'AprimoApiError';
  }
}
