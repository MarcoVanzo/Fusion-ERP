import globals from "globals";
import js from "@eslint/js";

export default [
    js.configs.recommended,
    {
        files: ["js/**/*.js"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            globals: {
                ...globals.browser,
                $: "readonly",
                jQuery: "readonly",
                Swal: "readonly",
                app: "readonly",
                config: "readonly",
                UI: "readonly",
                Store: "readonly",
                Utils: "readonly",
                Router: "readonly",
                App: "readonly",
                Auth: "readonly",
                Theme: "readonly",
                Storage: "readonly",
                AdminView: "readonly",
                Admin: "readonly",
                ApexCharts: "readonly",
                FilePond: "readonly",
                FilePondPluginImagePreview: "readonly",
                moment: "readonly",
                html2canvas: "readonly",
                jsPDF: "readonly"
            }
        },
        rules: {
            "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
            "no-undef": "warn",
            "no-console": "off",
            "no-empty": ["error", { "allowEmptyCatch": true }],
            "no-useless-assignment": "warn",
            "preserve-caught-error": "warn"
        }
    }
];
