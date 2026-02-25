// Vitest setup file
import { vi } from "vitest";

// Mock the logger to suppress output during tests
vi.mock("@/lib/utils/logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    errorWithStack: vi.fn(),
    debug: vi.fn(),
  }),
}));
