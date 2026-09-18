import { networkInterfaces } from 'node:os';
import type { IncomingMessage } from 'node:http';
import type { Duplex } from 'node:stream';
import { WebSocketServer, type WebSocket } from 'ws';
import type { Plugin } from 'vite';

/** First non-loopback IPv4 address of this machine — used to build the link the
 * host shares with the second device on the same wifi network. */
function lanIp(): string | null {
  const interfaces = networkInterfaces();
  for (const entries of Object.values(interfaces)) {
    for (const entry of entries ?? []) {
      if (entry.family === 'IPv4' && !entry.internal) return entry.address;
    }
  }
  return null;
}

interface Room {
  host?: WebSocket;
  guest?: WebSocket;
}

/** Dev-only local relay for two-player multiplayer: pairs a host and a guest
 * browser under a short room code and forwards raw messages between them
 * unchanged. No message is ever inspected or stored — the host's own game
 * engine is the sole authority, this just moves bytes between two sockets on
 * the same wifi network. */
export function multiplayerRelayPlugin(): Plugin {
  const rooms = new Map<string, Room>();

  return {
    name: 'poison-cup-multiplayer-relay',
    configureServer(server) {
      server.middlewares.use('/api/lan-ip', (_req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ip: lanIp() }));
      });

      const wss = new WebSocketServer({ noServer: true });

      server.httpServer?.on('upgrade', (req: IncomingMessage, socket: Duplex, head: Buffer) => {
        const url = new URL(req.url ?? '', 'http://internal');
        if (url.pathname !== '/mp-ws') return; // not ours — leave it for Vite's own HMR socket

        const room = url.searchParams.get('room');
        const role = url.searchParams.get('role');
        if (!room || (role !== 'host' && role !== 'guest')) {
          socket.destroy();
          return;
        }

        wss.handleUpgrade(req, socket as never, head, (ws) => {
          let entry = rooms.get(room);
          if (!entry) {
            entry = {};
            rooms.set(room, entry);
          }
          const peerKey = role === 'host' ? 'guest' : 'host';
          entry[role] = ws;

          entry[peerKey]?.send(JSON.stringify({ type: role === 'host' ? 'host_joined' : 'guest_joined' }));

          ws.on('message', (data) => {
            entry?.[peerKey]?.send(data.toString());
          });

          ws.on('close', () => {
            if (entry && entry[role] === ws) entry[role] = undefined;
            entry?.[peerKey]?.send(JSON.stringify({ type: role === 'host' ? 'host_left' : 'guest_left' }));
            if (entry && !entry.host && !entry.guest) rooms.delete(room);
          });
        });
      });
    },
  };
}
