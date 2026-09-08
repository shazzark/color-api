import Fastify from "fastify";
import { colorRoutes } from "./routes/colors.js";
import { healthRoutes } from "./routes/health.js";

export function buildApp() {
  const app = Fastify({ logger: true });

  app.register(healthRoutes);
  app.register(colorRoutes);

  return app;
}
