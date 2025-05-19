/**
 * Custom HTTP Error class for API responses
 */
export class HttpError extends Error {
  status: number;
  
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'HttpError';
    // Set prototype explicitly for better instanceof behavior in transpiled ES5
    Object.setPrototypeOf(this, HttpError.prototype);
  }
}

// Error helper functions
export const BadRequest   = (m = 'Bad Request')   => new HttpError(400, m);
export const Unauthorized = (m = 'Unauthorized')  => new HttpError(401, m);
export const NotFound     = (m = 'Not Found')     => new HttpError(404, m);
export const ServerError  = (m = 'Server Error')  => new HttpError(500, m);