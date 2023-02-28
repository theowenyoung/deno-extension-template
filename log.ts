export type LevelName = "debug" | "info" | "warn" | "error" | "fatal";

export enum Level {
  Debug = 0,
  Info = 1,
  Warn = 2,
  Error = 3,
  Fatal = 4,
}
export const brandName = "Immersive Translate";
export class Timing {
  #t = performance.now();

  reset() {
    this.#t = performance.now();
  }

  stop(message: string) {
    const now = performance.now();
    const d = Math.round(now - this.#t);
    console.debug(
      brandName + " TIMING:",
      message,
      "in",
      d + "ms",
    );
    this.#t = now;
  }
}

export class Logger {
  #level: Level = Level.Info;

  get level(): Level {
    return this.#level;
  }

  setLevel(level: LevelName): void {
    switch (level) {
      case "debug":
        this.#level = Level.Debug;
        break;
      case "info":
        this.#level = Level.Info;
        break;
      case "warn":
        this.#level = Level.Warn;
        break;
      case "error":
        this.#level = Level.Error;
        break;
      case "fatal":
        this.#level = Level.Fatal;
        break;
    }
  }

  debug(...args: unknown[]): void {
    if (this.#level <= Level.Debug) {
      console.log(brandName + " DEBUG:", ...args);
    }
  }
  v(...args: unknown[]): void {
    // for temp log, so we can remove it easily
    if (this.#level <= Level.Debug) {
      console.log(brandName + " VERBOSE:", ...args);
    }
  }

  info(...args: unknown[]): void {
    if (this.#level <= Level.Info) {
      console.log(brandName + " INFO:", ...args);
    }
  }

  l(...args: unknown[]): void {
    // for temp log, so we can remove it easily
    if (this.#level <= Level.Info) {
      console.log(brandName + " TEMP INFO:", ...args);
    }
  }

  warn(...args: unknown[]): void {
    if (this.#level <= Level.Warn) {
      console.warn(brandName + " WARN:", ...args);
    }
  }

  error(...args: unknown[]): void {
    if (this.#level <= Level.Error) {
      console.error(brandName + " ERROR:", ...args);
    }
  }

  fatal(...args: unknown[]): void {
    if (this.#level <= Level.Fatal) {
      console.error(brandName + " FATAL:", ...args);
      // Deno.exit(1);
    }
  }

  timing(): { reset(): void; stop(message: string): void } {
    if (this.level === Level.Debug) {
      return new Timing();
    }
    return { reset: () => {}, stop: () => {} };
  }
}

export default new Logger();
