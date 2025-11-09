import { createTranslationHook } from "../../utils/languages.ts";

// Create scoped hook at module level - auto-registers namespace
const usePruebaTranslation = createTranslationHook("hola");

export default function PruebaComponent() {
    // Clean syntax - scope works perfectly
    const t = usePruebaTranslation().scope("pruebaComponent").scope("title");
    const userName = ". Samuel .";
    return (
        <div className="language-selector">
            {t("text", { name: userName })}
        </div>
    );
}
