const info = (message: string, ...args: unknown[]) => {
  console.log(`[INFO] ${message}`, ...args);
};

const warn = (message: string, ...args: unknown[]) => {
  console.warn(`[WARN] ${message}`, ...args);
};

const error = (message: string, ...args: unknown[]) => {
  console.error(`[ERROR] ${message}`, ...args);
};

const debug = (message: string, ...args: unknown[]) => {
  if (process.env.NODE_ENV !== "production") {
    console.debug(`[DEBUG] ${message}`, ...args);
  }
};

const logger = { info, warn, error, debug };

export default logger;
