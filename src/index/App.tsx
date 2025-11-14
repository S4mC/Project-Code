import { useState } from "react";
import "./App.css";
import IconListView from "./components/IconListView.tsx";
import type { IconListItem } from "./components/IconListView.tsx";
import LanguageSelector from "./components/languageSelector.tsx";
import { createTranslationHook } from "../utils/languages.ts";
import { FileExplorer, type FileSystemItem } from "./components/FileExplorer.tsx";
import { ThemeSelector } from "./components/themeSelector.tsx";
import { useTheme } from "./hooks/useTheme.ts";

// Create hook at module level - auto-registers namespace before render
const useAppTranslation = createTranslationHook("index");

function App() {
    // Clean, single call - no repetition!
    const t = useAppTranslation();

    // Detect theme changes automatically
    const { isLightMode } = useTheme();

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
            text: "Usuarios",
            subtitle: "subt        sddsds  dds ds d sds            eewew  weew  ewew  ewitle",
            badge: 5,
        },
        {
            id: "a60cc",
            icon: "👤 User",
            text: "Usuarios strart 1",
            badge: 5,
            disabled: true,
            gridColumnStart: 1,
            gridRowStart: 1,
            gridRowSpan: 3,
        },
        {
            id: "a60ccc",
            text: "Usuarios row 1",
            badge: 5,
            gridRowStart: 1,
            backgroundColor: "#141414ff",
            textColor: "#be185dff",
            subtitleColor: "#c4ff5dff",
            subtitle: "subtitulo personalizado",
        },
        { id: "a3", icon: "Settings", text: "Ajustes" },
        { id: "a33", icon: "Settings", text: "Ajustes" },
        { id: "a333", icon: "Settings", text: "Ajustes" },
        { id: "a3333", icon: "Settings", text: "Ajustes" },
        {
            id: "a5",
            text: "Notificaciones",
            badge: 3,
            icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M6 15h1.5V9H5v1.5h1zm3.5 0H12q.425 0 .713-.288T13 14v-4q0-.425-.288-.712T12 9H9.5q-.425 0-.712.288T8.5 10v4q0 .425.288.713T9.5 15m.5-1.5v-3h1.5v3zm4 1.5h1.5v-2.25L17.25 15H19l-2.25-3L19 9h-1.75l-1.75 2.25V9H14zm-9 6q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h14q.825 0 1.413.588T21 5v14q0 .825-.587 1.413T19 21z"/></svg>',
        },
        {
            id: "a4",
            text: "Reportes",
            subtitle: "subtitulo personalizado",
            gridSpan: 2,
            gridRowSpan: 2,
            icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M6 15h1.5V9H5v1.5h1zm3.5 0H12q.425 0 .713-.288T13 14v-4q0-.425-.288-.712T12 9H9.5q-.425 0-.712.288T8.5 10v4q0 .425.288.713T9.5 15m.5-1.5v-3h1.5v3zm4 1.5h1.5v-2.25L17.25 15H19l-2.25-3L19 9h-1.75l-1.75 2.25V9H14zm-9 6q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h14q.825 0 1.413.588T21 5v14q0 .825-.587 1.413T19 21z"/></svg>',
            iconLeft: true,
        },
        {
            id: "a6",
            icon: "Heart",
            text: "Favoritos",
            backgroundSvg:
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#ec4899;stop-opacity:0.1" /><stop offset="100%" style="stop-color:#be185d;stop-opacity:0.1" /></linearGradient></defs><rect fill="url(#grad3)" width="100" height="100"/><path fill="#ec4899" opacity="0.15" d="M50 80 C30 60 10 45 10 30 C10 20 18 15 25 15 C35 15 45 25 50 35 C55 25 65 15 75 15 C82 15 90 20 90 30 C90 45 70 60 50 80 Z"/></svg>',
        },
    ]);

    const [sampleFileSystem, setSampleFileSystem] = useState<FileSystemItem[]>([
        {
            id: "1",
            name: ".github",
            type: "folder",
            isExpanded: false,
            children: [],
        },
        {
            id: "2",
            name: "dist",
            type: "folder",
            isExpanded: false,
            children: [],
        },
        {
            id: "3",
            name: "languages",
            type: "folder",
            isExpanded: false,
            children: [],
        },
        {
            id: "4",
            name: "public",
            type: "folder",
            isExpanded: false,
            children: [],
        },
        {
            id: "5",
            name: "src",
            type: "folder",
            isExpanded: true,
            children: [
                {
                    id: "6",
                    name: "components",
                    type: "folder",
                    isExpanded: true,
                    children: [
                        {
                            id: "7",
                            name: "hola",
                            type: "folder",
                            isExpanded: false,
                            children: [],
                        },
                        {
                            id: "8",
                            name: "index",
                            type: "folder",
                            isExpanded: true,
                            children: [
                                {
                                    id: "9",
                                    name: "assets",
                                    type: "folder",
                                    isExpanded: false,
                                    children: [],
                                },
                                {
                                    id: "10",
                                    name: "components",
                                    type: "folder",
                                    isExpanded: true,
                                    children: [
                                        {
                                            id: "11",
                                            name: "IconListView.css",
                                            type: "file",
                                        },
                                        {
                                            id: "12",
                                            name: "IconListView.tsx",
                                            type: "file",
                                        },
                                        {
                                            id: "13",
                                            name: "languageSelector.tsx",
                                            type: "file",
                                        },
                                        {
                                            id: "14",
                                            name: "pruebaComponent.tsx",
                                            type: "file",
                                        },
                                    ],
                                },
                                {
                                    id: "15",
                                    name: "hooks",
                                    type: "folder",
                                    isExpanded: false,
                                    children: [],
                                },
                                {
                                    id: "16",
                                    name: "utils",
                                    type: "folder",
                                    isExpanded: false,
                                    children: [],
                                },
                                {
                                    id: "17",
                                    name: "App.css",
                                    type: "file",
                                },
                                {
                                    id: "18",
                                    name: "App.tsx",
                                    type: "file",
                                },
                            ],
                        },
                        {
                            id: "19",
                            name: "styles",
                            type: "folder",
                            isExpanded: false,
                            children: [],
                        },
                        {
                            id: "20",
                            name: "utils",
                            type: "folder",
                            isExpanded: false,
                            children: [],
                        },
                    ],
                },
            ],
        },
        {
            id: "21",
            name: ".gitignore",
            type: "file",
        },
        {
            id: "22",
            name: "commands.md",
            type: "file",
        },
        {
            id: "23",
            name: "hola.html",
            type: "file",
        },
        {
            id: "24",
            name: "index.html",
            type: "file",
        },
        {
            id: "25",
            name: "package.json",
            type: "file",
        },
        {
            id: "26",
            name: "README.md",
            type: "file",
        },
        {
            id: "27",
            name: "vite.config.ts",
            type: "file",
        },
        {
            id: "28",
            name: "prueba.toml",
            type: "file",
        },
    ]);

    const handleItemClick = (item: IconListItem) => {
        setSelectedId(item.id);
        console.log("Clic en:", item);
    };

    const handleFileItemClick = (item: FileSystemItem) => {
        console.log("Clic en archivo/carpeta:", item);
    };

    return (
        <>
            <LanguageSelector />
            <span>{t("language") /* Language selector label */}</span>

            <ThemeSelector />

            <FileExplorer
                data={sampleFileSystem}
                onItemClick={handleFileItemClick}
                onDataChange={setSampleFileSystem}
                contextMenuOptions={{
                    rename: {
                        enabled: true,
                    },
                    createFile: {
                        enabled: true,
                    },
                    createFolder: {
                        enabled: true,
                    },
                    delete: {
                        enabled: true,
                    },
                }}
                lightMode={isLightMode}
            />

            <button
                onClick={() =>
                    setSampleFileSystem([
                        ...sampleFileSystem,
                        { id: "12343212", name: "text.txt", type: "file", isExpanded: false, children: [] },
                    ])
                }
            >
                Add Item
            </button>

            <button
                onClick={() =>
                    console.log("Current File System:", sampleFileSystem)
                }
            >
                Console.log
            </button>

            <IconListView
                items={advancedGridItems}
                onItemClick={handleItemClick}
                selectedId={selectedId}
                layout="grid"
                iconSize="small"
                allowFixedItems={true}
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
