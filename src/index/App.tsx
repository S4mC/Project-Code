import { useState } from "react";
import "./App.css";
import IconListView from "./components/IconListView.tsx";
import type { IconListItem } from "./components/IconListView.tsx";


import PruebaComponent from "./components/pruebaComponent.tsx";


import LanguageSelector from "./components/languageSelector.tsx";
import { createTranslationHook } from "../utils/languages.ts";

// Create hook at module level - auto-registers namespace before render
const useAppTranslation = createTranslationHook("index");

function App() {
    // Clean, single call - no repetition!
    const t = useAppTranslation();

    const [selectedId, setSelectedId] = useState<string | number>("home");

    const [advancedGridItems, setAdvancedGridItems] = useState<IconListItem[]>([
        {
            id: "a1",
            icon: "Home",
            text: "Dashboard",
            gridSpan: 2,
            backgroundSvg:
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#3b82f6;stop-opacity:0.1" /><stop offset="100%" style="stop-color:#2563eb;stop-opacity:0.1" /></linearGradient></defs><rect fill="url(#grad1)" width="100" height="100"/><path fill="#3b82f6" opacity="0.15" d="M10 50 L50 10 L90 50 L90 90 H10 Z"/></svg>',
        },
        { id: "a2", text: "Usuarios 1651 6 168 16 81 6  6 168 1 68168 1" },
        {
            id: "a50",
            icon: "User",
            text: "Usuarios",
            subtitle: "subt        sddsds  dds ds d sds            eewew  weew  ewew  ewitle",
            badge: 5,
        },
        {
            id: "a60cc",
            icon: "User",
            text: "Usuarios strart 1",
            badge: 5,
            disabled: true,
            gridColumnStart: 1,
            gridRowStart: 1,
            gridRowSpan: 3,
        },
        {
            id: "a60ccc",
            icon: "User",
            text: "Usuarios row 1",
            badge: 5,
            gridRowStart: 1,
            backgroundColor: "#575757ff",
            textColor: "#be185dff",
        },
        { id: "a3", icon: "Settings", text: "Ajustes" },
        { id: "a33", icon: "Settings", text: "Ajustes" },
        { id: "a333", icon: "Settings", text: "Ajustes" },
        { id: "a3333", icon: "Settings", text: "Ajustes" },
        { id: "a5", icon: "Bell", text: "Notificaciones", badge: 3 },
        {
            id: "a4",
            text: "Reportes",
            gridSpan: 2,
            gridRowSpan: 2,
            icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M6 15h1.5V9H5v1.5h1zm3.5 0H12q.425 0 .713-.288T13 14v-4q0-.425-.288-.712T12 9H9.5q-.425 0-.712.288T8.5 10v4q0 .425.288.713T9.5 15m.5-1.5v-3h1.5v3zm4 1.5h1.5v-2.25L17.25 15H19l-2.25-3L19 9h-1.75l-1.75 2.25V9H14zm-9 6q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h14q.825 0 1.413.588T21 5v14q0 .825-.587 1.413T19 21z"/></svg>',
        },
        {
            id: "a6",
            icon: "Heart",
            text: "Favoritos",
            backgroundSvg:
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#ec4899;stop-opacity:0.1" /><stop offset="100%" style="stop-color:#be185d;stop-opacity:0.1" /></linearGradient></defs><rect fill="url(#grad3)" width="100" height="100"/><path fill="#ec4899" opacity="0.15" d="M50 80 C30 60 10 45 10 30 C10 20 18 15 25 15 C35 15 45 25 50 35 C55 25 65 15 75 15 C82 15 90 20 90 30 C90 45 70 60 50 80 Z"/></svg>',
        },
    ]);

    const handleItemClick = (item: IconListItem) => {
        setSelectedId(item.id);
        console.log("Clic en:", item);
    };

    return (
        <>
            <PruebaComponent />
            <LanguageSelector />
            <span>{t("language") /* Language selector label */}</span>
            <IconListView
                items={advancedGridItems}
                onItemClick={handleItemClick}
                selectedId={selectedId}
                layout="grid"
                iconSize="small"
                allowFixedItems={true}
                textColor="var(--bg)"
                backgroundSvg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#3b82f6;stop-opacity:0.1"/><stop offset="100%" style="stop-color:#2563eb;stop-opacity:0.1"/></linearGradient></defs><rect fill="url(#grad1)" width="100" height="100"/><path fill="#3b82f6" opacity="0.15" d="M10 50 L50 10 L90 50 L90 90 H10 Z"/></svg>'
            />
            <button
                onClick={() =>
                    setAdvancedGridItems([
                        ...advancedGridItems,
                        { id: "newww", icon: "New", text: "Nuevo" },
                    ])
                }
            >
                Add Item
            </button>
        </>
    );
}

export default App;
