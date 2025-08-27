export default [
    {
        files: ["**/*.js"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            globals: {
                console: "readonly",
                document: "readonly",
                window: "readonly",
                requestAnimationFrame: "readonly",
                setTimeout: "readonly",
                clearTimeout: "readonly",
                Math: "readonly"
            }
        },
        rules: {
            // Core JavaScript rules
            "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
            "no-console": "off", // Allow console for game logging
            "no-debugger": "error",
            "no-alert": "error",
            "eqeqeq": "error",
            "prefer-const": "error",
            "no-var": "error",
            
            // Style rules for consistency
            "indent": ["error", 4],
            "quotes": ["error", "single"],
            "semi": ["error", "always"],
            "comma-dangle": ["error", "never"],
            
            // Best practices for game development
            "no-global-assign": "error",
            "no-implicit-coercion": "error",
            "no-magic-numbers": ["warn", { "ignore": [0, 1, 2, -1] }],
            "prefer-arrow-functions": "off"
        }
    }
];