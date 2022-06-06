/*
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/en/configuration.html
 */

module.exports = {
    collectCoverage: true,
    coverageDirectory: "<rootDir>/coverage",
    coverageProvider: "v8",
    setupFiles: ["<rootDir>/.jest/setEnvVars.js"],
    testEnvironment: "node",
    verbose: true
};