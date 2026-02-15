/**
 * Environment variable validation for Harbor.
 * Import and call validateEnv() in server-side code to ensure required vars exist.
 */

interface EnvConfig {
  ANTHROPIC_API_KEY: string;
}

let validated = false;
let cachedEnv: EnvConfig | null = null;

export function getEnv(): EnvConfig {
  if (cachedEnv) return cachedEnv;

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || apiKey === "your_api_key_here") {
    throw new Error(
      "Missing ANTHROPIC_API_KEY environment variable. Copy .env.example to .env and add your API key."
    );
  }

  cachedEnv = {
    ANTHROPIC_API_KEY: apiKey,
  };

  return cachedEnv;
}

/**
 * Validates that all required env vars are set.
 * Call this early in server startup or API routes.
 * Returns true if valid, throws with descriptive error if not.
 */
export function validateEnv(): boolean {
  getEnv();
  validated = true;
  return true;
}

/**
 * Returns the Anthropic API key, validated.
 */
export function getAnthropicApiKey(): string {
  return getEnv().ANTHROPIC_API_KEY;
}
