const theme = require("@monoplate/design-tokens/tailwind");
module.exports = { content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"], presets: [require("nativewind/preset")], theme: { extend: theme }, plugins: [] };
