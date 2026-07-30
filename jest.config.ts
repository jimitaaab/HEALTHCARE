import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: "tsconfig.test.json",
      },
    ],
  },
  rootDir: ".",
  testMatch: ["<rootDir>/src/__tests__/**/*.test.ts"],
  collectCoverage: true,
  collectCoverageFrom: [
    "<rootDir>/src/**/*.ts",
    "!<rootDir>/src/server.ts",
    "!<rootDir>/src/types/**",
    "!<rootDir>/src/__tests__/**",
    "!<rootDir>/src/**/*.interface.ts",
    "!<rootDir>/src/**/*.types.ts",
    "!<rootDir>/src/shared/utils/logger.ts",
  ],
  coverageDirectory: "<rootDir>/coverage",
  coverageThreshold: {
    global: {
      lines: 70,
      branches: 60,
      functions: 65,
      statements: 70,
    },
  },
  setupFiles: ["<rootDir>/src/__tests__/setup.ts"],
  verbose: true,
  maxWorkers: 1,
};

export default config;
