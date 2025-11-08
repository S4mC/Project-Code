import { translation } from "../../languages.ts";

// Get translator for "index" namespace and scope it to "iconListView"
const { t } = translation("hola").scope("pruebaComponent").scope("title");

export default function PruebaComponent() {

    return (
        <div className="language-selector">
            {t("text")}
        </div>
    );
}
