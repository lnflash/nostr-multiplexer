// Load .env before any module that reads process.env at import time (e.g. config).
import 'dotenv/config';
import express, {
  Express,
  Request,
  Response,
  NextFunction,
} from 'express';
import helmet from 'helmet';
import config from '../config/config';
import userRoutes from './routes/users';

const app: Express = express();

// Trust the configured number of proxy hops so req.ip reflects the real client
// and the rate limiter cannot be bypassed via a spoofed X-Forwarded-For header.
app.set('trust proxy', config.TRUST_PROXY);

// Baseline security headers; don't advertise the framework.
app.use(helmet());
app.disable('x-powered-by');

app.use('/', userRoutes);

app.get('/ping', (req: Request, res: Response) => {
  res.send('pong');
});

// GRAPHQL_URL is validated at boot (see config), so if we're up, we're ready.
app.get('/ready', (req: Request, res: Response) => {
  res.json({status: 'ready'});
});

// 404 fallthrough
app.use((req: Request, res: Response) => {
  res.status(404).json({error: 'Not found'});
});

// Terminal error handler — never leak internals to callers.
app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  console.error('[server]: unhandled error', err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).json({error: 'Internal server error'});
});

const server = app.listen(config.PORT, () => {
  console.log(
    `[server]: nostr-multiplexer running at http://localhost:${config.PORT}`,
  );
});

// Graceful shutdown
const shutdown = (signal: string) => {
  console.log(`[server]: ${signal} received, shutting down...`);
  server.close(() => {
    console.log('[server]: closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', reason => {
  console.error('[server]: unhandledRejection', reason);
});
