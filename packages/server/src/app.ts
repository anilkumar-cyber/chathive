import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Express } from "express";
import mongoSanitize from "express-mongo-sanitize";
import helmet from "helmet";
import hpp from "hpp";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import xss from "xss-clean";
import { env, isProd } from "./config/env";
import { passport } from "./config/passport";
import { swaggerSpec } from "./config/swagger";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware";
import { generalLimiter } from "./middlewares/rateLimit.middleware";
import { ipBlockGuard } from "./middlewares/security.middleware";
import router from "./routes";

export function createApp(): Express {
  const app = express();

  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
    })
  );
  app.use(compression());
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true, limit: "2mb" }));
  app.use(cookieParser(env.COOKIE_SECRET));
  app.use(mongoSanitize());
  app.use(xss());
  app.use(hpp());
  app.use(ipBlockGuard);
  app.use(passport.initialize());
  app.use(morgan(isProd ? "combined" : "dev"));
  app.use(generalLimiter);

  app.get("/health", (_req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get("/api-docs.json", (_req, res) => res.json(swaggerSpec));

  app.use("/api/v1", router);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
