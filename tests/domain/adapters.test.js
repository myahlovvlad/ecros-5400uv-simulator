import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ConsoleLogger } from "../../src/infrastructure/adapters/ConsoleLogger.js";
import { MemoryStorage } from "../../src/infrastructure/adapters/MemoryStorage.js";

describe("MemoryStorage", () => {
  let storage;

  beforeEach(() => {
    storage = new MemoryStorage();
  });

  it("stores and loads values", () => {
    storage.save("key", "value");
    expect(storage.load("key")).toBe("value");
  });

  it("clears values", () => {
    storage.save("key1", "value1");
    storage.save("key2", "value2");
    storage.clear();
    expect(storage.keys()).toHaveLength(0);
  });
});

describe("ConsoleLogger", () => {
  let logger;
  let consoleLogSpy;

  beforeEach(() => {
    logger = new ConsoleLogger({ prefix: "[Test]" });
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it("logs messages with prefix", () => {
    logger.log("test");
    expect(consoleLogSpy).toHaveBeenCalled();
    expect(consoleLogSpy.mock.calls[0][0]).toContain("[Test]");
  });

  it("supports info", () => {
    logger.info("info");
    expect(consoleLogSpy).toHaveBeenCalled();
  });
});
