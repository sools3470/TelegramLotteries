import express from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
// Dynamically import scheduler to avoid issues during startup
// import MembershipScheduler from './services/membershipScheduler';

const app = express();

app.use(express.json());

(async () => {
  const server = await registerRoutes(app);

  const isProduction = process.env.NODE_ENV === "production";
  if (isProduction) {
    // Serve prebuilt client assets in production
    serveStatic(app);
  } else {
    // Setup Vite middleware in development for HMR and dev server features
    await setupVite(app, server);
  }

  // Initialize membership scheduler if bot token is available
  if (process.env.BOT_TOKEN) {
    try {
      const { default: MembershipScheduler } = await import('./services/membershipScheduler');
      const scheduler = new MembershipScheduler(process.env.BOT_TOKEN);
      scheduler.start();
      console.log('✅ Membership scheduler started successfully');
    } catch (error) {
      console.error('❌ Failed to start membership scheduler:', error);
    }
  } else {
    console.warn('⚠️ BOT_TOKEN not configured - Membership checking disabled');
  }

  const port = Number(process.env.PORT) || 5000;
  server.listen(port, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${port}`);
  });
})();
