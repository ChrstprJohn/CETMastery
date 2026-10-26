export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function notFound(_req, res) {
  res.status(404).json({ error: { message: 'API route not found.' } });
}

export function errorHandler(error, _req, res, _next) {
  if (error instanceof HttpError) {
    if (error.status === 401) res.set('WWW-Authenticate', 'Bearer');
    return res.status(error.status).json({ error: { message: error.message } });
  }
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { message: 'Request body must be valid JSON.' } });
  }
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ error: { message: 'Request body is too large.' } });
  }
  console.error('API request failed:', error.message);
  return res.status(500).json({ error: { message: 'Something went wrong. Please try again.' } });
}
