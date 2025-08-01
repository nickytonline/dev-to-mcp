import pino from "pino";
import { getConfig, isDevelopment } from "./config.ts";

const config = getConfig();

export const logger = pino({
  level: config.LOG_LEVEL,

  transport: isDevelopment()
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss Z",
          ignore: "pid,hostname",
        },
      }
    : undefined,

  base: {
    service: config.SERVER_NAME,
    version: config.SERVER_VERSION,
    environment: config.NODE_ENV,
  },

  formatters: {
    level: (label) => ({ level: label }),
  },
});