import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import cloudinary from "cloudinary";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Cloudinary signature endpoint
  app.post("/api/cloudinary-sign", (req, res) => {
    try {
      const apiKey = process.env.CLOUDINARY_API_KEY || "";
      const apiSecret = process.env.CLOUDINARY_API_SECRET || "";
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "dfbhvgcbi";

      if (!apiSecret || !apiKey) {
        return res.status(500).json({ error: "Missing Cloudinary credentials on server." });
      }

      // Generate signature
      const timestamp = Math.round(new Date().getTime() / 1000);
      const signature = cloudinary.v2.utils.api_sign_request(
        { timestamp: timestamp },
        apiSecret
      );

      res.json({
        timestamp,
        signature,
        apiKey,
        cloudName
      });
    } catch (err: any) {
      console.error("[Backend] Error generating Cloudinary signature:", err);
      res.status(500).json({ error: err.message || "Failed to sign" });
    }
  });

  // API route test
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
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
