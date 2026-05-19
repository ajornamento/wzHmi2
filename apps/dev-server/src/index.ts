import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { MOCK_TAGS, computeValue, type TagDef } from './mockData.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const HMI_DIR = join(__dirname, '../../hmi-files');
if (!existsSync(HMI_DIR)) mkdirSync(HMI_DIR, { recursive: true });

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/hmi', (_req, res) => {
  try {
    const files = readdirSync(HMI_DIR).filter((f) => f.endsWith('.json'));
    res.json(files);
  } catch {
    res.json([]);
  }
});

app.get('/api/hmi/:name', (req, res) => {
  try {
    const content = readFileSync(join(HMI_DIR, req.params.name), 'utf-8');
    res.json(JSON.parse(content));
  } catch {
    res.status(404).json({ error: 'Not found' });
  }
});

app.post('/api/hmi/:name', (req, res) => {
  try {
    writeFileSync(join(HMI_DIR, req.params.name), JSON.stringify(req.body, null, 2));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.get('/api/tags', (_req, res) => {
  res.json(MOCK_TAGS.map((t) => ({ tagId: t.tagId, description: t.description })));
});

app.post('/api/tags/values', (req, res) => {
  const { tagIds } = req.body as { tagIds?: string[] };
  if (!Array.isArray(tagIds) || tagIds.length === 0) return res.json([]);
  const elapsed = Date.now() - startTime;
  const result = tagIds
    .map((id) => MOCK_TAGS.find((t) => t.tagId === id))
    .filter((tag): tag is TagDef => tag !== undefined)
    .map((tag) => ({ tagId: tag.tagId, value: computeValue(tag, elapsed), timestamp: Date.now() }));
  res.json(result);
});

const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer });

const clients = new Set<WebSocket>();
const subscriptions = new Map<WebSocket, Set<string>>();
const startTime = Date.now();

wss.on('connection', (ws) => {
  clients.add(ws);
  subscriptions.set(ws, new Set());
  console.log(`[WS] Client connected (total: ${clients.size})`);

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.type === 'subscribe') {
        subscriptions.get(ws)?.add(msg.tagId);
        const tag = MOCK_TAGS.find((t) => t.tagId === msg.tagId);
        if (tag) {
          const value = computeValue(tag, Date.now() - startTime);
          ws.send(JSON.stringify({ type: 'tag_update', data: { tagId: tag.tagId, value, timestamp: Date.now() } }));
        }
      }
      if (msg.type === 'unsubscribe') {
        subscriptions.get(ws)?.delete(msg.tagId);
      }
    } catch {}
  });

  ws.on('close', () => {
    clients.delete(ws);
    subscriptions.delete(ws);
    console.log(`[WS] Client disconnected (total: ${clients.size})`);
  });
});

const tagIntervals = new Map<string, ReturnType<typeof setInterval>>();

for (const tag of MOCK_TAGS) {
  const interval = setInterval(() => {
    const value = computeValue(tag, Date.now() - startTime);
    const msg = JSON.stringify({ type: 'tag_update', data: { tagId: tag.tagId, value, timestamp: Date.now() } });

    for (const [ws, subs] of subscriptions) {
      if (subs.has(tag.tagId) && ws.readyState === WebSocket.OPEN) {
        ws.send(msg);
      }
    }
  }, tag.period < 1000 ? 500 : 1000);
  tagIntervals.set(tag.tagId, interval);
}

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;
httpServer.listen(PORT, () => {
  console.log(`\n🚀 HMI Dev Server`);
  console.log(`   HTTP API: http://localhost:${PORT}/api`);
  console.log(`   WebSocket: ws://localhost:${PORT}`);
  console.log(`   Mock tags: ${MOCK_TAGS.length}개`);
  console.log(`   HMI files: ${HMI_DIR}\n`);
});
