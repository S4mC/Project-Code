// Simple i18n system with i18next
import i18next from "i18next";

// Declare global build number injected at build time
declare const __BUILD_NUMBER__: number;

const LANG_KEY = "i18nextLng";
const CACHE_KEY_PREFIX = "i18n_cache_";
const BUILD_KEY = "i18n_build";

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

// Get language from localStorage or browser
function detectLanguage(): string {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved && SUPPORTED_LANGS.includes(saved)) {
        // Verify the language has translation files available
        const testPath = `../languages/${saved}/index.js`;
        if (translationModules[testPath]) {
            return saved;
        }
        // If saved language doesn't have files, clear it
        localStorage.removeItem(LANG_KEY);
    }
    
    // Ultimate fallback
    return "en";
}

// Pre-register all translation modules with Vite (this lets Vite know about them at build time)
// but we only load the specific one we need at runtime
// Only register root-level files (not nested in folders) so Vite bundles imports together
const translationModules = import.meta.glob<Record<string, Record<string, string>>>('../languages/*/*.js', { eager: false });

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

// Load translation file with cache busting
async function loadTranslations(lang: string, namespace: string): Promise<Record<string, string>> {
    const isDev = import.meta.env.DEV;
    const cacheKey = `${CACHE_KEY_PREFIX}_${lang}_${namespace}`;
    const storedBuild = localStorage.getItem(BUILD_KEY);
    const currentBuild = String(__BUILD_NUMBER__);

    // In development, skip cache - always fetch fresh
    if (!isDev && storedBuild === currentBuild) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try {
                return JSON.parse(cached) as Record<string, string>;
            } catch (e) {
                console.warn(`Failed to parse cached translations for ${namespace}`, e);
            }
        }
    } else {
        // Clear old cache if build number changed
        Object.keys(localStorage).forEach((key) => {
            if (key.startsWith(CACHE_KEY_PREFIX)) {
                localStorage.removeItem(key);
            }
        });
    }

    // Always load from root-level files only (index.js, hola.js, etc.)
    const moduleLoader = translationModules[`../languages/${lang}/${namespace}.js`];
    
    if (!moduleLoader) {
        throw new Error(`Translation module not found for ${lang}/${namespace}.js`);
    }
    
    // This actually loads the file (dynamic import at runtime)
    // Vite will bundle any imports inside this file automatically
    const module = await moduleLoader();
    const data = module[namespace];

    if (!data) {
        throw new Error(`Translation data not found for namespace "${namespace}" in ${lang}/${namespace}.js`);
    }

    // Flatten nested objects to support dot notation
    const flattenedData = flattenTranslations(data as Record<string, unknown>);

    // Cache the data only in production
    if (!isDev) {
        try {
            localStorage.setItem(cacheKey, JSON.stringify(flattenedData));
            localStorage.setItem(BUILD_KEY, currentBuild);
        } catch (e) {
            console.warn("Failed to cache translations (localStorage might be full)", e);
        }
    }

    return flattenedData;
}

// Initialize i18next - automatically loads all registered namespaces
export async function initLanguages(): Promise<typeof i18next> {
    const lang = detectLanguage();
    const resources: Record<string, Record<string, Record<string, string>>> = { [lang]: {} };

    // Get first namespace as default (usually the page namespace)
    const namespaces = Array.from(registeredNamespaces);
    const defaultNS = namespaces[0] || "index";

    // Load all registered translations
    for (const ns of registeredNamespaces) {
        const translations = await loadTranslations(lang, ns);
        resources[lang][ns] = translations;
    }

    await i18next.init({
        lng: lang,
        resources,
        ns: namespaces,
        defaultNS: defaultNS,
        fallbackLng: false,
        interpolation: { escapeValue: false },
    });

    localStorage.setItem(LANG_KEY, lang);
    document.documentElement.setAttribute("lang", lang);

    return i18next;
}

// Simple function to get translator for a namespace
// Automatically registers the namespace for loading
export interface TranslationFunction {
    t: (key: string) => string;
    scope: (prefix: string) => TranslationFunction;
}

export function translation(namespace?: string): TranslationFunction {
    if (namespace) {
        registeredNamespaces.add(namespace);
    }

    const createTranslator = (prefix: string = ""): TranslationFunction => ({
        t: (key: string) => {
            const fullKey = prefix ? `${prefix}.${key}` : key;
            return namespace ? i18next.t(fullKey, { ns: namespace }) : i18next.t(fullKey);
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

// Change language and reload page
export function changeLanguage(lng: string): void {
    if (!SUPPORTED_LANGS.includes(lng)) {
        console.warn(`Language ${lng} is not supported`);
        return;
    }

    localStorage.setItem(LANG_KEY, lng);
    window.location.reload();
}

export default i18next;
