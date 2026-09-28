import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { otpOtpAuthRouter } from "./src/server/otpRouter";
import { smsOtpRouter } from "./src/server/smsOtpRouter";
import { geminiRouter } from "./src/server/geminiRouter";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Trust proxy to resolve express-rate-limit warnings/errors when run behind Cloud Run or Nginx proxies
  app.set('trust proxy', 1);

  // Parse incoming raw/JSON request payloads with ample limit for camera and document uploads
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // API Endpoints registered first
  app.use("/api/auth", otpOtpAuthRouter);
  app.use("/api/auth", smsOtpRouter);
  app.use("/api/gemini", geminiRouter);

  // Vite middleware pipeline for development vs static build files for production
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
    console.log(`Secure Full-Stack Server listening on http://localhost:${PORT}`);
  });
}

startServer();
