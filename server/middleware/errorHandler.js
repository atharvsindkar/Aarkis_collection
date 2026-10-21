import crypto from 'crypto';

/**
 * Generates a unique correlation ID for tracking errors in server logs
 * without leaking sensitive stack traces or internal details to clients.
 */
export function generateCorrelationId() {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(4).toString('hex');
  return `cid_${timestamp}_${random}`;
}

/**
 * Helper to safely respond to 500 internal server errors.
 * Logs full stack trace and internal message on the server, but returns
 * only a generic sanitized message and correlation ID to the client.
 */
export function sendInternalError(res, err, publicMessage = 'An unexpected internal error occurred. Please try again later.') {
  const correlationId = generateCorrelationId();
  
  // Detailed log to server-side stderr only
  console.error(`\n🚨 [SERVER ERROR] CorrelationId: ${correlationId}`);
  console.error(`   Message: ${err?.message || err}`);
  if (err?.stack) {
    console.error(`   Stack:\n${err.stack}`);
  }
  console.error('------------------------------------------------------\n');

  // Generic sanitized response to client
  return res.status(500).json({
    success: false,
    message: publicMessage,
    correlationId
  });
}

/**
 * Express Global Error Handling Middleware
 */
export function globalErrorHandler(err, req, res, next) {
  const correlationId = req.correlationId || generateCorrelationId();
  const statusCode = err.status || err.statusCode || 500;

  console.error(`\n🚨 [UNHANDLED ERROR] CorrelationId: ${correlationId}`);
  console.error(`   Route: ${req.method} ${req.originalUrl}`);
  console.error(`   Message: ${err?.message || err}`);
  if (err?.stack) {
    console.error(`   Stack:\n${err.stack}`);
  }
  console.error('------------------------------------------------------\n');

  // Ensure headers are sent cleanly
  if (res.headersSent) {
    return next(err);
  }

  const isClientSafe = statusCode < 500;
  const clientMessage = isClientSafe 
    ? (err.message || 'Client request error') 
    : 'An unexpected internal error occurred. Please quote the correlation ID if contacting support.';

  res.status(statusCode).json({
    success: false,
    message: clientMessage,
    correlationId
  });
}
