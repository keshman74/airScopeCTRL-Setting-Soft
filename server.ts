import express from "express";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Disable strict TLS verification for internal network devices with self-signed certs
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  // Middleware to proxy requests to the Linkplay device
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
