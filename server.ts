import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import http from "http";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to proxy requests to the Linkplay device
  // Example usage from frontend: /api/proxy?ip=192.168.1.100&command=getPlayerStatus
  app.get("/api/proxy", (req, res) => {
    const targetIp = req.query.ip as string;
    const command = req.query.command as string;

    if (!targetIp || !command) {
      return res.status(400).json({ error: "Missing ip or command parameter" });
    }

    const targetUrl = `http://${targetIp}/httpapi.asp?command=${encodeURIComponent(command)}`;

    http.get(targetUrl, (targetRes) => {
      let data = '';
      targetRes.on('data', (chunk) => {
        data += chunk;
      });

      targetRes.on('end', () => {
        res.status(targetRes.statusCode || 200).send(data);
      });
    }).on('error', (err) => {
      console.error(`Proxy error to ${targetUrl}:`, err.message);
      res.status(502).json({ error: "Failed to reach device", details: err.message });
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
