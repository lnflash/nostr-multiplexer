import express, {Express, Request, Response} from 'express';
import dotenv from 'dotenv';
import userRoutes from './routes/users';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 4000;

app.use(express.json());

app.use('/', userRoutes);

app.get('/ping', (req: Request, res: Response) => {
  res.send('pong');
});

app.get('/ready', (req: Request, res: Response) => {
  const graphqlUrl = process.env.GRAPHQL_URL;

  if (!graphqlUrl) {
    return res.status(503).json({status: 'not ready', reason: 'GRAPHQL_URL not configured'});
  }

  return res.json({status: 'ready'});
});

const server = app.listen(port, () => {
  console.log(`[server]: nostr-multiplexer running at http://localhost:${port}`);
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
