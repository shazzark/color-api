import Fastify from "fastify";
import { colorRoutes } from "./routes/colors.js";
import { contrastRoutes } from "./routes/contrast.js";
import { healthRoutes } from "./routes/health.js";
import { paletteRoutes } from "./routes/palette.js";

export function buildApp() {
  const app = Fastify({ logger: true });

  app.register(healthRoutes);
  app.register(colorRoutes);
  app.register(contrastRoutes);
  app.register(paletteRoutes);

  return app;
}
