import { getCurrentLanguage, changeLanguage, AVAILABLE_LANGUAGES } from "../../utils/languages.ts";

export default function LanguageSelector() {
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
