import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Banco só em memória: os testes nunca tocam o clinic.db real.
    env: { DATABASE_PATH: ":memory:" },
  },
});
