// Vercel serverless entry point — wraps the Express app
// The server/index.ts already has: if (!process.env.VERCEL) app.listen(...)
// So it won't try to bind a port in serverless mode.
import app from '../server/index.js';

export default app;
