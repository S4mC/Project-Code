import { useState, useMemo, useCallback } from "react";
import "./FileExplorerComplete.css";

// ----------------------------------------------------------------
// Type Definitions
// ----------------------------------------------------------------

export type FileSystemItemType = "file" | "folder";

export interface FileSystemItem {
    id: string;
    name: string;
    type: FileSystemItemType;
    children?: FileSystemItem[];
    isExpanded?: boolean;
}

interface FileExplorerProps {
    initialData?: FileSystemItem[];
    onItemClick?: (item: FileSystemItem) => void;
    onItemSelect?: (item: FileSystemItem) => void;
}

interface FileSystemItemProps {
    item: FileSystemItem;
    level: number;
    onToggle: (id: string) => void;
    onSelect: (item: FileSystemItem) => void;
    selectedId?: string;
    creationContext?: CreationContext;
}

interface FileIconProps {
    type: string;
    isExpanded?: boolean;
}

interface CreationContext {
    isCreating: boolean;
    createType: "file" | "folder";
    newItemName: string;
    targetFolderId: string | null;
    onNewItemNameChange: (name: string) => void;
    onCreateItem: () => void;
    onCancelCreate: () => void;
}

// ----------------------------------------------------------------
// Constants
// ----------------------------------------------------------------

const ICON_MAP: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    json: "json",
    html: "html",
    css: "css",
    md: "markdown",
    gitignore: "git",
    png: "image",
    jpg: "image",
    svg: "image",
};

// ----------------------------------------------------------------
// Utility Functions
// ----------------------------------------------------------------


// eslint-disable-next-line react-refresh/only-export-components
export const getFileExtension = (fileName: string): string => {
    const lastDotIndex = fileName.lastIndexOf(".");
    return lastDotIndex > 0 ? fileName.slice(lastDotIndex + 1) : "";
};

// eslint-disable-next-line react-refresh/only-export-components
export const getFileIcon = (fileName: string): string => {
    if (fileName === ".gitignore") return "git";
    if (fileName.includes("config")) return "config";

    const ext = getFileExtension(fileName);
    return ICON_MAP[ext] || "file";
};

// ----------------------------------------------------------------
// FileIcon Component - Icon rendering for different file types
// ----------------------------------------------------------------

const FOLDER_ICON_EXPANDED = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M14.5 13.5V6.5H7L5.5 4.5H1.5V13.5H14.5Z" fill="#90a0b5" />
        <path
            d="M1.5 4.5V3C1.5 2.72 1.72 2.5 2 2.5H5L6.5 4.5H14C14.28 4.5 14.5 4.72 14.5 5V6.5H7L5.5 4.5H1.5Z"
            fill="#b4c5d9"
        />
    </svg>
);

const FOLDER_ICON_COLLAPSED = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M14.5 3.5H7L5.5 2H1.5V13.5H14.5V3.5Z" fill="#8c9aaa" />
        <path d="M1.5 2V3.5H5.5L7 5H14.5V3.5H7L5.5 2H1.5Z" fill="#b4c5d9" />
    </svg>
);

const ICON_COMPONENTS: Record<string, React.JSX.Element> = {
    typescript: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect width="16" height="16" rx="2" fill="#2F74C0" />
            <path d="M8.5 8.5V12.5H9.5V8.5H11V7.5H7V8.5H8.5Z" fill="white" />
            <path
                d="M11.5 10.5C11.5 10.22 11.72 10 12 10C12.28 10 12.5 10.22 12.5 10.5V11.5C12.5 11.78 12.28 12 12 12H11.5V10.5Z"
                fill="white"
            />
            <path
                d="M11.5 8.5C11.5 8.22 11.72 8 12 8C12.28 8 12.5 8.22 12.5 8.5V9.5H11.5V8.5Z"
                fill="white"
            />
        </svg>
    ),
    javascript: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect width="16" height="16" rx="2" fill="#F7DF1E" />
            <path
                d="M8.5 11C8.5 11.5 8.3 11.8 7.8 11.8C7.4 11.8 7.2 11.6 7 11.3L6.2 11.8C6.5 12.4 7.1 12.8 7.9 12.8C8.8 12.8 9.5 12.3 9.5 11.3V8H8.5V11Z"
                fill="black"
            />
            <path
                d="M10.5 11.8C10 11.8 9.7 11.6 9.5 11.2L8.7 11.7C9 12.3 9.6 12.8 10.5 12.8C11.5 12.8 12.2 12.3 12.2 11.4C12.2 10.6 11.8 10.2 10.8 9.9L10.5 9.8C10 9.6 9.8 9.5 9.8 9.2C9.8 9 10 8.8 10.3 8.8C10.6 8.8 10.8 8.9 11 9.2L11.7 8.7C11.4 8.2 10.9 8 10.3 8C9.4 8 8.8 8.5 8.8 9.3C8.8 10 9.2 10.4 10.1 10.7L10.4 10.8C11 11 11.2 11.2 11.2 11.5C11.2 11.8 10.9 11.8 10.5 11.8Z"
                fill="black"
            />
        </svg>
    ),
    json: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect width="16" height="16" rx="2" fill="#5382A1" />
            <path
                d="M5 6C5 5.45 5.45 5 6 5H6.5V10C6.5 10.55 6.05 11 5.5 11H5V10H5.5V6H5Z"
                fill="#FFC107"
            />
            <path
                d="M8 7C7.45 7 7 7.45 7 8V9C7 9.55 7.45 10 8 10C8.55 10 9 9.55 9 9V8C9 7.45 8.55 7 8 7ZM8 9V8H8V9Z"
                fill="#FFC107"
            />
            <path
                d="M11 7H10V8.5C10 8.78 9.78 9 9.5 9V10C10.33 10 11 9.33 11 8.5V7Z"
                fill="#FFC107"
            />
        </svg>
    ),
    html: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect width="16" height="16" rx="2" fill="#E44D26" />
            <path d="M4 3L4.5 11.5L8 13L11.5 11.5L12 3H4Z" fill="#F16529" />
            <path d="M8 4.5V12L10.8 10.8L11.2 4.5H8Z" fill="#EBEBEB" />
            <path d="M5.5 7H8V6H4.8L5 8.5H8V7.5H6L5.5 7Z" fill="white" />
            <path d="M8 9.5H6.8L6.5 10.5L8 11V9.8L8 9.5Z" fill="#EBEBEB" />
        </svg>
    ),
    css: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect width="16" height="16" rx="2" fill="#1572B6" />
            <path d="M4 3L4.5 11.5L8 13L11.5 11.5L12 3H4Z" fill="#33A9DC" />
            <path d="M8 4.5V12L10.8 10.8L11.2 4.5H8Z" fill="white" />
            <path d="M8 7H9.5L9.7 5.5H8V4H11.2L10.8 8H8V7Z" fill="#EBEBEB" />
            <path d="M8 10V11.5L9.5 11L9.7 9.5H8.5V10H8Z" fill="#EBEBEB" />
        </svg>
    ),
    markdown: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect width="16" height="16" rx="2" fill="#083FA1" />
            <path d="M4 10V6H5.5L7 7.5L8.5 6H10V10H8.5V7.5L7 9L5.5 7.5V10H4Z" fill="white" />
            <path d="M11 8.5L12.5 10V8.5H11Z" fill="white" />
            <path d="M10.5 10L12 8.5L10.5 7V10Z" fill="white" />
        </svg>
    ),
    git: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" fill="#F05133" />
            <path d="M7.5 4L10.5 7L7.5 10V8H5.5V6H7.5V4Z" fill="white" />
        </svg>
    ),
    image: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="3" width="12" height="10" rx="1" fill="#70B1E8" />
            <circle cx="5.5" cy="6.5" r="1" fill="white" />
            <path
                d="M2 11L5 8L7 10L11 6L14 9V12C14 12.55 13.55 13 13 13H3C2.45 13 2 12.55 2 12V11Z"
                fill="#90C8F0"
            />
        </svg>
    ),
    config: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" fill="#6D6D6D" />
            <circle cx="8" cy="8" r="2.5" fill="#BCBCBC" />
            <rect x="7.5" y="3" width="1" height="2" fill="#BCBCBC" />
            <rect x="7.5" y="11" width="1" height="2" fill="#BCBCBC" />
            <rect x="11" y="7.5" width="2" height="1" fill="#BCBCBC" />
            <rect x="3" y="7.5" width="2" height="1" fill="#BCBCBC" />
        </svg>
    ),
    file: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
                d="M9.5 2H3.5C2.95 2 2.5 2.45 2.5 3V13C2.5 13.55 2.95 14 3.5 14H12.5C13.05 14 13.5 13.55 13.5 13V6L9.5 2Z"
                fill="#7F8C96"
            />
            <path d="M9.5 2V5.5C9.5 5.78 9.72 6 10 6H13.5L9.5 2Z" fill="#5F6C75" />
        </svg>
    ),
};

export const FileIcon = ({ type, isExpanded }: FileIconProps) => {
    if (type === "folder") {
        return isExpanded ? FOLDER_ICON_EXPANDED : FOLDER_ICON_COLLAPSED;
    }
    return ICON_COMPONENTS[type] || ICON_COMPONENTS.file;
};

// ----------------------------------------------------------------
// FileSystemItem Component - Memoized for performance
// ----------------------------------------------------------------

export const FileSystemItem = ({
    item,
    level,
    onToggle,
    onSelect,
    selectedId,
    creationContext,
}: FileSystemItemProps) => {
    const isFolder = item.type === "folder";
    const isSelected = selectedId === item.id;
    const showNewItemInput = creationContext?.isCreating && creationContext.targetFolderId === item.id;
    const paddingLeft = `${level * 16 + 8}px`;

    const handleClick = useCallback(() => {
        if (isFolder) {
            onToggle(item.id);
        }
        onSelect(item);
    }, [isFolder, item, onToggle, onSelect]);

    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            creationContext?.onNewItemNameChange(e.target.value);
        },
        [creationContext]
    );

    return (
        <div>
            <div
                className={`file-system-item ${isSelected ? "file-system-item--selected" : ""}`}
                style={{ paddingLeft }}
                onClick={handleClick}
                data-item-id={item.id}
            >
                {/* Collapse/Expand arrow for folders */}
                {isFolder ? (
                    <span
                        className={`file-system-item__chevron ${
                            item.isExpanded
                                ? "file-system-item__chevron--expanded"
                                : "file-system-item__chevron--collapsed"
                        }`}
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M6 11L11 6L6 1" stroke="#C5C5C5" strokeWidth="1.5" fill="none" />
                        </svg>
                    </span>
                ) : (
                    <div className="file-system-item__spacer" />
                )}

                {/* File/Folder icon */}
                <span className="file-system-item__icon">
                    <FileIcon type={isFolder ? "folder" : getFileIcon(item.name)} isExpanded={item.isExpanded} />
                </span>

                {/* File/Folder name */}
                <span className="file-system-item__name">{item.name}</span>
            </div>

            {/* Show new item input if creating inside this folder */}
            {showNewItemInput && isFolder && creationContext && (
                <NewItemInput
                    level={level + 1}
                    createType={creationContext.createType}
                    newItemName={creationContext.newItemName}
                    onNewItemNameChange={handleInputChange}
                    onCreateItem={creationContext.onCreateItem}
                    onCancelCreate={creationContext.onCancelCreate}
                />
            )}

            {/* Recursively render children if folder is expanded */}
            {isFolder && item.isExpanded && item.children && (
                <div>
                    {item.children.map((child) => (
                        <FileSystemItem
                            key={child.id}
                            item={child}
                            level={level + 1}
                            onToggle={onToggle}
                            onSelect={onSelect}
                            selectedId={selectedId}
                            creationContext={creationContext}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// ----------------------------------------------------------------
// NewItemInput Component - Separated for better organization
// ----------------------------------------------------------------

interface NewItemInputProps {
    level: number;
    createType: "file" | "folder";
    newItemName: string;
    onNewItemNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onCreateItem: () => void;
    onCancelCreate: () => void;
}

const NewItemInput = ({
    level,
    createType,
    newItemName,
    onNewItemNameChange,
    onCreateItem,
    onCancelCreate,
}: NewItemInputProps) => {
    const paddingLeft = `${level * 16 + 8}px`;

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") onCreateItem();
            if (e.key === "Escape") onCancelCreate();
        },
        [onCreateItem, onCancelCreate]
    );

    const handleClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
    }, []);

    return (
        <div className="file-explorer__new-item" style={{ paddingLeft }} onClick={handleClick}>
            <div className="file-system-item__spacer" />
            <span className="file-system-item__icon">
                <FileIcon type={createType === "folder" ? "folder" : "file"} isExpanded={false} />
            </span>
            <input
                type="text"
                value={newItemName}
                onChange={onNewItemNameChange}
                onKeyDown={handleKeyDown}
                onBlur={onCreateItem}
                autoFocus
                className="file-explorer__new-item-input"
                placeholder={createType === "folder" ? "Folder name" : "File name"}
            />
        </div>
    );
};

// ----------------------------------------------------------------
// FileExplorer Component - Main explorer with optimized state management
// ----------------------------------------------------------------

export const FileExplorer = ({ initialData = [], onItemClick, onItemSelect }: FileExplorerProps) => {
    // ----------------------------------------------------------------
    // State Management
    // ----------------------------------------------------------------
    const [fileSystem, setFileSystem] = useState<FileSystemItem[]>(initialData);
    const [selectedId, setSelectedId] = useState<string>();
    const [isCreating, setIsCreating] = useState(false);
    const [createType, setCreateType] = useState<"file" | "folder">("file");
    const [newItemName, setNewItemName] = useState("");
    const [targetFolderId, setTargetFolderId] = useState<string | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; itemId?: string } | null>(null);

    // ----------------------------------------------------------------
    // Utility Functions - Memoized for performance
    // ----------------------------------------------------------------

    /**
     * Find an item by ID in the file system tree
     */
    const findItemById = useCallback((items: FileSystemItem[], id: string): FileSystemItem | null => {
        for (const item of items) {
            if (item.id === id) return item;
            if (item.children) {
                const found = findItemById(item.children, id);
                if (found) return found;
            }
        }
        return null;
    }, []);

    /**
     * Find parent folder of an item
     */
    const findParentFolder = useCallback(
        (items: FileSystemItem[], childId: string, parent: FileSystemItem | null = null): FileSystemItem | null => {
            for (const item of items) {
                if (item.id === childId) {
                    return parent;
                }
                if (item.children) {
                    const found = findParentFolder(item.children, childId, item);
                    if (found !== null) return found;
                }
            }
            return null;
        },
        []
    );

    // ----------------------------------------------------------------
    // Event Handlers
    // ----------------------------------------------------------------

    /**
     * Toggle expand/collapse state of a folder
     */
    const toggleItem = useCallback((id: string) => {
        setFileSystem((prevFileSystem) => {
            const toggleRecursive = (items: FileSystemItem[]): FileSystemItem[] => {
                return items.map((item) => {
                    if (item.id === id) {
                        return { ...item, isExpanded: !item.isExpanded };
                    }
                    if (item.children) {
                        return { ...item, children: toggleRecursive(item.children) };
                    }
                    return item;
                });
            };
            return toggleRecursive(prevFileSystem);
        });
    }, []);

    /**
     * Handle item selection
     */
    const handleSelect = useCallback(
        (item: FileSystemItem) => {
            if (isCreating) {
                setIsCreating(false);
                setNewItemName("");
                setTargetFolderId(null);
            }
            setSelectedId(item.id);
            
            // Call external callbacks if provided
            onItemSelect?.(item);
            onItemClick?.(item);
        },
        [isCreating, onItemSelect, onItemClick]
    );

    /**
     * Cancel item creation
     */
    const cancelCreate = useCallback(() => {
        setIsCreating(false);
        setNewItemName("");
        setTargetFolderId(null);
    }, []);

    /**
     * Create a new file or folder
     */
    const createNewItem = useCallback(() => {
        if (!newItemName.trim()) return;

        const newItem: FileSystemItem = {
            id: Date.now().toString(),
            name: newItemName,
            type: createType,
            children: createType === "folder" ? [] : undefined,
            isExpanded: false,
        };

        setFileSystem((prevFileSystem) => {
            if (targetFolderId) {
                const addToFolder = (items: FileSystemItem[]): FileSystemItem[] => {
                    return items.map((item) => {
                        if (item.id === targetFolderId) {
                            return {
                                ...item,
                                children: [...(item.children || []), newItem],
                                isExpanded: true,
                            };
                        }
                        if (item.children) {
                            return { ...item, children: addToFolder(item.children) };
                        }
                        return item;
                    });
                };
                return addToFolder(prevFileSystem);
            } else {
                return [...prevFileSystem, newItem];
            }
        });

        cancelCreate();
    }, [newItemName, createType, targetFolderId, cancelCreate]);

    /**
     * Start creating a new item
     */
    const startCreating = useCallback(
        (type: "file" | "folder", contextItemId?: string) => {
            setCreateType(type);
            setNewItemName("");

            const targetItemId = contextItemId || selectedId;

            if (targetItemId) {
                const selectedItem = findItemById(fileSystem, targetItemId);
                if (selectedItem?.type === "folder") {
                    setTargetFolderId(targetItemId);
                    if (!selectedItem.isExpanded) {
                        toggleItem(targetItemId);
                    }
                } else {
                    const parentFolder = findParentFolder(fileSystem, targetItemId);
                    if (parentFolder) {
                        setTargetFolderId(parentFolder.id);
                        if (!parentFolder.isExpanded) {
                            toggleItem(parentFolder.id);
                        }
                    } else {
                        setTargetFolderId(null);
                    }
                }
            } else {
                setTargetFolderId(null);
            }

            setIsCreating(true);
        },
        [selectedId, fileSystem, findItemById, findParentFolder, toggleItem]
    );

    /**
     * Delete an item from the file system
     */
    const deleteItem = useCallback((id: string) => {
        setFileSystem((prevFileSystem) => {
            const deleteRecursive = (items: FileSystemItem[]): FileSystemItem[] => {
                return items.filter((item) => {
                    if (item.id === id) return false;
                    if (item.children) {
                        item.children = deleteRecursive(item.children);
                    }
                    return true;
                });
            };
            return deleteRecursive(prevFileSystem);
        });
        setContextMenu(null);
    }, []);

    /**
     * Handle right-click context menu
     */
    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();

        const target = e.target as HTMLElement;
        const itemElement = target.closest("[data-item-id]") as HTMLElement;

        if (itemElement && itemElement.dataset.itemId) {
            setContextMenu({ x: e.clientX, y: e.clientY, itemId: itemElement.dataset.itemId });
        } else {
            setContextMenu((prev) => ({ x: e.clientX, y: e.clientY, itemId: prev?.itemId }));
        }
    }, []);

    // ----------------------------------------------------------------
    // Memoized Values
    // ----------------------------------------------------------------

    const creationContext = useMemo(
        () =>
            isCreating
                ? {
                      isCreating,
                      createType,
                      newItemName,
                      targetFolderId,
                      onNewItemNameChange: setNewItemName,
                      onCreateItem: createNewItem,
                      onCancelCreate: cancelCreate,
                  }
                : undefined,
        [isCreating, createType, newItemName, targetFolderId, createNewItem, cancelCreate]
    );

    // ----------------------------------------------------------------
    // Render
    // ----------------------------------------------------------------

    return (
        <div className="file-explorer" onContextMenu={handleContextMenu}>
            {/* Header with action buttons */}
            <ExplorerHeader onCreateFile={() => startCreating("file")} onCreateFolder={() => startCreating("folder")} />

            {/* File system tree view */}
            <div className="file-explorer__content" onClick={() => setContextMenu(null)}>
                {/* New item input field at root level */}
                {isCreating && targetFolderId === null && (
                    <NewItemInput
                        level={0}
                        createType={createType}
                        newItemName={newItemName}
                        onNewItemNameChange={(e) => setNewItemName(e.target.value)}
                        onCreateItem={createNewItem}
                        onCancelCreate={cancelCreate}
                    />
                )}

                {/* Render file system items */}
                {fileSystem.map((item) => (
                    <FileSystemItem
                        key={item.id}
                        item={item}
                        level={0}
                        onToggle={toggleItem}
                        onSelect={handleSelect}
                        selectedId={selectedId}
                        creationContext={creationContext}
                    />
                ))}

                {/* Empty state message */}
                {fileSystem.length === 0 && !isCreating && (
                    <div className="file-explorer__empty">No files or folders</div>
                )}
            </div>

            {/* Context menu (right-click menu) */}
            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    itemId={contextMenu.itemId}
                    onCreateFile={() => {
                        startCreating("file", contextMenu.itemId);
                        setContextMenu(null);
                    }}
                    onCreateFolder={() => {
                        startCreating("folder", contextMenu.itemId);
                        setContextMenu(null);
                    }}
                    onDelete={() => contextMenu.itemId && deleteItem(contextMenu.itemId)}
                />
            )}
        </div>
    );
};

// ----------------------------------------------------------------
// ExplorerHeader Component - Separated for better organization
// ----------------------------------------------------------------

interface ExplorerHeaderProps {
    onCreateFile: () => void;
    onCreateFolder: () => void;
}

const ExplorerHeader = ({ onCreateFile, onCreateFolder }: ExplorerHeaderProps) => (
    <div className="file-explorer__header">
        <span className="file-explorer__title">Explorer</span>
        <div className="file-explorer__actions">
            {/* New File button */}
            <button onClick={onCreateFile} className="file-explorer__action-btn" title="New File">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                        d="M9.5 1.5H3.5C2.95 1.5 2.5 1.95 2.5 2.5V13.5C2.5 14.05 2.95 14.5 3.5 14.5H12.5C13.05 14.5 13.5 14.05 13.5 13.5V5.5L9.5 1.5Z"
                        stroke="currentColor"
                        strokeWidth="1"
                        fill="none"
                    />
                    <path d="M9.5 1.5V5.5H13.5" stroke="currentColor" strokeWidth="1" fill="none" />
                </svg>
            </button>
            {/* New Folder button */}
            <button onClick={onCreateFolder} className="file-explorer__action-btn" title="New Folder">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                        d="M14 12.5V5H6.5L5 3H2V12.5H14Z"
                        stroke="currentColor"
                        strokeWidth="1"
                        fill="none"
                    />
                    <path
                        d="M2 3V2C2 1.72 2.22 1.5 2.5 1.5H5.5L6.5 3H13.5C13.78 3 14 3.22 14 3.5V5H6.5L5 3H2Z"
                        stroke="currentColor"
                        strokeWidth="1"
                        fill="none"
                    />
                </svg>
            </button>
        </div>
    </div>
);

// ----------------------------------------------------------------
// ContextMenu Component - Separated for better organization
// ----------------------------------------------------------------

interface ContextMenuProps {
    x: number;
    y: number;
    itemId?: string;
    onCreateFile: () => void;
    onCreateFolder: () => void;
    onDelete: () => void;
}

const ContextMenu = ({ x, y, itemId, onCreateFile, onCreateFolder, onDelete }: ContextMenuProps) => (
    <div className="file-explorer__context-menu" style={{ left: x, top: y }}>
        <button onClick={onCreateFile} className="file-explorer__context-menu-item">
            New File
        </button>
        <button onClick={onCreateFolder} className="file-explorer__context-menu-item">
            New Folder
        </button>
        {itemId && (
            <>
                <div className="file-explorer__context-menu-separator"></div>
                <button onClick={onDelete} className="file-explorer__context-menu-item">
                    Delete
                </button>
            </>
        )}
    </div>
);
