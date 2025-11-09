import { changeLanguage, AVAILABLE_LANGUAGES, getCurrentLanguage, useTranslation } from "../../utils/languages.ts";

export default function LanguageSelector() {
    // This ensures the selector updates when language changes
    useTranslation();
    const language = getCurrentLanguage();

    return (
        <div className="language-selector">
            <select
                value={language}
                onChange={(e) => changeLanguage((e.target as HTMLSelectElement).value)}
            >
                {AVAILABLE_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                        {lang.name}
                    </option>
                ))}
            </select>
        </div>
    );
}