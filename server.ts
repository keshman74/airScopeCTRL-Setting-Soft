import express from "express";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";
import net from "net";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Disable strict TLS verification for internal network devices with self-signed certs
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Existing HTTP API Proxy Middleware
  app.get("/api/proxy", async (req, res) => {
    const targetIp = req.query.ip as string;
    const command = req.query.command as string;
    const protocol = req.query.protocol === 'https' ? 'https' : 'http';

    if (!targetIp || !command) {
      return res.status(400).json({ error: "Missing ip or command parameter" });
    }

    const targetUrl = `${protocol}://${targetIp}/httpapi.asp?command=${encodeURIComponent(command)}`;
    
    try {
      const response = await fetch(targetUrl);
      const data = await response.text();
      res.status(response.status).send(data);
    } catch (err: any) {
      console.error(`Proxy error to ${targetUrl}:`, err.message);
      res.status(502).json({ error: "Failed to reach device", details: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Initialize WebSocket server for TCP bridging
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    let deviceSocket: net.Socket | null = null;
    let keepAliveInterval: NodeJS.Timeout | null = null;

    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);
        
        if (data.type === 'connect_tcp') {
          const { ip, port = 8899 } = data;
          
          if (deviceSocket) {
            deviceSocket.destroy();
          }

          deviceSocket = new net.Socket();
          
          deviceSocket.connect(port, ip, () => {
            console.log(`TCP Connected to ${ip}:${port}`);
            ws.send(JSON.stringify({ type: 'tcp_status', status: 'connected' }));
          });

          let receiveBuffer = Buffer.alloc(0);

          deviceSocket.on('data', (chunk) => {
            receiveBuffer = Buffer.concat([receiveBuffer, chunk]);

            // Keep parsing as long as we have at least a 20-byte header
            while (receiveBuffer.length >= 20) {
              // Check for Linkplay magic header: 0x18 0x96 0x18 0x20
              if (
                receiveBuffer[0] !== 0x18 ||
                receiveBuffer[1] !== 0x96 ||
                receiveBuffer[2] !== 0x18 ||
                receiveBuffer[3] !== 0x20
              ) {
                // Not a valid header, shift 1 byte and search again
                receiveBuffer = receiveBuffer.slice(1);
                continue;
              }

              // Read little-endian 32-bit integer for payload length (bytes 4-7)
              const payloadLength = receiveBuffer.readUInt32LE(4);
              
              if (receiveBuffer.length < 20 + payloadLength) {
                // We don't have the full payload yet, wait for more chunks
                break;
              }

              // Extract the payload
              const payload = receiveBuffer.slice(20, 20 + payloadLength);
              const text = payload.toString('utf-8');
              
              // Forward decoded text payload to frontend
              ws.send(JSON.stringify({ type: 'tcp_data', data: text }));

              // Remove this packet from the buffer
              receiveBuffer = receiveBuffer.slice(20 + payloadLength);
            }
          });

          deviceSocket.on('close', () => {
            console.log(`TCP Connection closed from ${ip}`);
            ws.send(JSON.stringify({ type: 'tcp_status', status: 'disconnected' }));
          });

          deviceSocket.on('error', (err) => {
            console.error(`TCP Error to ${ip}:`, err.message);
            ws.send(JSON.stringify({ type: 'tcp_error', error: err.message }));
          });
          
        } else if (data.type === 'send_tcp') {
          if (deviceSocket && !deviceSocket.destroyed) {
            // Write command to device using Linkplay TCP header protocol
            const payload = Buffer.from(data.command, 'utf-8');
            const length = payload.length;
            
            let checksum = 0;
            for (let i = 0; i < length; i++) {
              checksum += payload[i];
            }
            
            const header = Buffer.alloc(20);
            header.writeUInt8(0x18, 0);
            header.writeUInt8(0x96, 1);
            header.writeUInt8(0x18, 2);
            header.writeUInt8(0x20, 3);
            
            header.writeUInt32LE(length, 4);
            header.writeUInt32LE(checksum, 8);
            // 8 bytes reserved (all zeros) already set by alloc
            
            const packet = Buffer.concat([header, payload]);
            deviceSocket.write(packet);
          } else {
            ws.send(JSON.stringify({ type: 'tcp_error', error: 'TCP socket is not connected' }));
          }
        }
      } catch (err) {
        console.error('WS Error:', err);
      }
    });

    ws.on('close', () => {
      if (deviceSocket) {
        deviceSocket.destroy();
      }
      if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
      }
    });
  });
}

startServer();
