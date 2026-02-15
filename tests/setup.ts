// Test setup — mock localStorage for jsdom environment

import { beforeEach } from "vitest";

// Clear localStorage before each test
beforeEach(() => {
  localStorage.clear();
});
