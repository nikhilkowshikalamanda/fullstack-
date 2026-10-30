// An error that carries an HTTP status code, so route code can simply "throw".
export class HttpError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.status = status;
    this.errors = errors; // optional: { fieldName: 'message' }
  }
}
