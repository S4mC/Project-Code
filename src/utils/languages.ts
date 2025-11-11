// Simple i18n system with i18next
import i18next from "i18next";
import { useState, useEffect } from "react";

const LANG_KEY = "i18nextLng";

// Available languages with native names
export interface Language {
    code: string;
    name: string;
}

export const AVAILABLE_LANGUAGES: Language[] = [
    { code: "en", name: "English" },
    { code: "es", name: "Español" },
];

const SUPPORTED_LANGS = AVAILABLE_LANGUAGES.map((lang) => lang.code);

// Track all namespaces that are used
const registeredNamespaces = new Set<string>();

// Get browser's preferred language
function getBrowserLanguage(): string {
    const browserLang = navigator.language.split("-")[0]; // Get 'en' from 'en-US'
    return SUPPORTED_LANGS.includes(browserLang) ? browserLang : "en";
}

// Get language from localStorage or browser
function detectLanguage(): string {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved && SUPPORTED_LANGS.includes(saved)) {
        // Verify the language has translation files available
        const testPath = `/languages/${saved}/index.js`;
        if (translationModules[testPath]) {
            return saved;
        }
        // If saved language doesn't have files, clear it
        localStorage.removeItem(LANG_KEY);
    }
    
    // Try browser language, then fallback to English
    return getBrowserLanguage();
}

// Pre-register all translation modules with Vite (this lets Vite know about them at build time)
// but we only load the specific one we need at runtime
// Only register root-level files (not nested in folders) so Vite bundles imports together
const translationModules = import.meta.glob<Record<string, Record<string, string>>>('/languages/*/*.js', { eager: false });

// Flatten nested objects into dot notation keys
function flattenTranslations(obj: Record<string, unknown>, prefix = ""): Record<string, string> {
    const result: Record<string, string> = {};

    for (const [key, value] of Object.entries(obj)) {
        const newKey = prefix ? `${prefix}.${key}` : key;

        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
            // Recursively flatten nested objects
            Object.assign(result, flattenTranslations(value as Record<string, unknown>, newKey));
        } else if (typeof value === "string") {
            result[newKey] = value;
        }
    }

    return result;
}

// Load translation file with error handling
async function loadTranslations(lang: string, namespace: string): Promise<Record<string, string>> {
    try {
        // Always load from root-level files only (index.js, hola.js, etc.)
        const moduleLoader = translationModules[`/languages/${lang}/${namespace}.js`];
        
        if (!moduleLoader) {
            console.error(`Translation module not found for ${lang}/${namespace}.js`);
            // Try to load English fallback if not already English
            if (lang !== "en") {
                console.warn(`Attempting to load English fallback for namespace "${namespace}"`);
                return await loadTranslations("en", namespace);
            }
            // Return empty object if English also fails
            return {};
        }
        
        // This actually loads the file (dynamic import at runtime)
        // Vite will bundle any imports inside this file automatically
        // The browser's HTTP cache will handle caching of these JS modules
        const module = await moduleLoader();
        const data = module[namespace];

        if (!data) {
            console.error(`Translation data not found for namespace "${namespace}" in ${lang}/${namespace}.js`);
            // Try English fallback
            if (lang !== "en") {
                return await loadTranslations("en", namespace);
            }
            return {};
        }

        // Flatten nested objects to support dot notation
        const flattenedData = flattenTranslations(data as Record<string, unknown>);

        return flattenedData;
    } catch (error) {
        console.error(`Error loading translations for ${lang}/${namespace}:`, error);
        // Try English fallback on any error
        if (lang !== "en") {
            return await loadTranslations("en", namespace);
        }
        return {};
    }
}

// // Load a specific namespace dynamically
// export async function loadNamespace(lang: string, namespace: string): Promise<void> {
//     const translations = await loadTranslations(lang, namespace);
    
//     // Add the namespace to i18next if not already present
//     if (!i18next.hasResourceBundle(lang, namespace)) {
//         i18next.addResourceBundle(lang, namespace, translations);
//     }
// }

// Initialize i18next - loads all registered namespaces
export async function initLanguages(): Promise<typeof i18next> {
    const lang = detectLanguage();
    const resources: Record<string, Record<string, Record<string, string>>> = { [lang]: {} };

    // Get registered namespaces
    const namespaces = Array.from(registeredNamespaces);
    const defaultNS = namespaces[0] || "index";

    // Load all registered translations
    try {
        for (const ns of registeredNamespaces) {
            const translations = await loadTranslations(lang, ns);
            resources[lang][ns] = translations;
        }
    } catch (error) {
        console.error("Error loading translations:", error);
        // Continue with whatever translations we have
    }

    await i18next.init({
        lng: lang,
        resources,
        ns: namespaces.length > 0 ? namespaces : ["index"],
        defaultNS: defaultNS,
        fallbackLng: "en",
        interpolation: { escapeValue: false },
    });

    localStorage.setItem(LANG_KEY, lang);
    document.documentElement.setAttribute("lang", lang);

    return i18next;
}

// Simple function to get translator for a namespace
// Automatically registers the namespace for loading
export interface TranslationFunction {
    t: (key: string, params?: Record<string, string | number>) => string;
    scope: (prefix: string) => TranslationFunction;
}

export function translation(namespace?: string): TranslationFunction {
    if (namespace) {
        registeredNamespaces.add(namespace);
    }

    const createTranslator = (prefix: string = ""): TranslationFunction => ({
        t: (key: string, params?: Record<string, string | number>) => {
            const fullKey = prefix ? `${prefix}.${key}` : key;
            const options = { ns: namespace, ...params };
            return namespace ? i18next.t(fullKey, options) : i18next.t(fullKey, params);
        },
        scope: (newPrefix: string) => {
            const fullPrefix = prefix ? `${prefix}.${newPrefix}` : newPrefix;
            return createTranslator(fullPrefix);
        },
    });

    return createTranslator();
}

// Get current language
export function getCurrentLanguage(): string {
    return i18next.language || detectLanguage();
}

// Change language dynamically without reload
export async function changeLanguage(lng: string): Promise<void> {
    if (!SUPPORTED_LANGS.includes(lng)) {
        console.warn(`Language ${lng} is not supported`);
        return;
    }

    // Load all namespaces for the new language
    const namespaces = Array.from(registeredNamespaces);
    const resources: Record<string, Record<string, string>> = {};

    try {
        for (const ns of namespaces) {
            const translations = await loadTranslations(lng, ns);
            resources[ns] = translations;
        }

        // Add resources to i18next for the new language
        for (const ns of namespaces) {
            if (!i18next.hasResourceBundle(lng, ns)) {
                i18next.addResourceBundle(lng, ns, resources[ns]);
            }
        }

        // Change language in i18next
        await i18next.changeLanguage(lng);

        // Update localStorage and HTML lang attribute
        localStorage.setItem(LANG_KEY, lng);
        document.documentElement.setAttribute("lang", lng);

    } catch (error) {
        console.error(`Error changing language to ${lng}:`, error);
        // Fallback to reload if dynamic change fails
        localStorage.setItem(LANG_KEY, lng);
        window.location.reload();
    }
}

export default i18next;

// ============================================================================
// React Hooks for Translation
// ============================================================================

export interface ReactTranslationFunction {
    (key: string, params?: Record<string, string | number>): string;
    scope: (prefix: string) => ReactTranslationFunction;
}

/**
 * Create a translation hook factory for a specific namespace
 * Call this at MODULE level (outside component) to register namespace before render
 * 
 * Usage:
 *   // At module level (top of file)
 *   const useAppTranslation = createTranslationHook("index");
 * 
 *   // Inside component
 *   function App() {
 *       const t = useAppTranslation();
 *       return <h1>{t("title")}</h1>;
 *   }
 */
export function createTranslationHook(namespace: string) {
    // Register namespace immediately at module level
    translation(namespace);
    
    // Return a hook that uses this namespace
    return () => useTranslation(namespace);
}

/**
 * Hook to get a reactive translation function
 * Only the text changes, not the entire component
 * 
 * For better DX, use createTranslationHook() instead
 * 
 * Usage: 
 *   const t = useTranslation("namespace");
 *   const t = useTranslation("namespace").scope("section");
 */
export function useTranslation(namespace?: string): ReactTranslationFunction {
    // Auto-register namespace (backup if not using createTranslationHook)
    if (namespace) {
        translation(namespace);
    }

    // Trigger re-render when language changes
    const [, setLanguage] = useState(i18next.language || "");

    useEffect(() => {
        const handleLanguageChange = (lng: string) => {
            setLanguage(lng);
        };

        // Subscribe to language change events
        i18next.on("languageChanged", handleLanguageChange);

        // Cleanup subscription on unmount
        return () => {
            i18next.off("languageChanged", handleLanguageChange);
        };
    }, []);

    // Create translation function with scope support
    const createTranslator = (prefix: string = ""): ReactTranslationFunction => {
        const translator = ((key: string, params?: Record<string, string | number>) => {
            const fullKey = prefix ? `${prefix}.${key}` : key;
            const options = namespace ? { ns: namespace, ...params } : params;
            return i18next.t(fullKey, options);
        }) as ReactTranslationFunction;

        translator.scope = (newPrefix: string) => {
            const fullPrefix = prefix ? `${prefix}.${newPrefix}` : newPrefix;
            return createTranslator(fullPrefix);
        };

        return translator;
    };

    return createTranslator();
}