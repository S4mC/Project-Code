import { useState, useMemo, useCallback, useEffect, useRef, memo } from "react";
import "./FileExplorer.css";

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
    data?: FileSystemItem[];
    onItemClick?: (item: FileSystemItem) => void;
    onItemSelect?: (item: FileSystemItem) => void;
    onDataChange?: (data: FileSystemItem[]) => void;
    contextMenuOptions?: {
        createFile?: {
            enabled: boolean;
            onBeforeCreate?: (targetItem?: FileSystemItem) => boolean | Promise<boolean>; // Return false to cancel
            onAfterCreate?: (newItem: FileSystemItem, targetItem?: FileSystemItem) => void;
        };
        createFolder?: {
            enabled: boolean;
            onBeforeCreate?: (targetItem?: FileSystemItem) => boolean | Promise<boolean>;
            onAfterCreate?: (newItem: FileSystemItem, targetItem?: FileSystemItem) => void;
        };
        rename?: {
            enabled: boolean;
            onBeforeRename?: (item: FileSystemItem, newName: string) => boolean | Promise<boolean>;
            onAfterRename?: (item: FileSystemItem, oldName: string, newName: string) => void;
        };
        delete?: {
            enabled: boolean;
            onBeforeDelete?: (item: FileSystemItem) => boolean | Promise<boolean>;
            onAfterDelete?: (item: FileSystemItem) => void;
        };
    };
    lightMode?: boolean;
}

interface FileSystemItemProps {
    item: FileSystemItem;
    level: number;
    onToggle: (id: string) => void;
    onSelect: (item: FileSystemItem) => void;
    selectedId?: string;
    creationContext?: CreationContext;
    renameContext?: RenameContext;
    lightMode?: boolean;
}

interface FileIconProps {
    type: string | Promise<string>; // Allow both sync and async type resolution
    isExpanded?: boolean;
    lightMode?: boolean;
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

interface RenameContext {
    isRenaming: boolean;
    itemId: string;
    newName: string;
    onNewNameChange: (name: string) => void;
    onRenameItem: () => void;
    onCancelRename: () => void;
}

// ----------------------------------------------------------------
// Constants & Dynamic Icon Loading
// ----------------------------------------------------------------

// Lazy load icon configuration only when needed
let configCache: {
    folderNames: Record<string, string>;
    fileNames: Record<string, string>;
    fileExtensions: Record<string, string>;
} | null = null;

// Load configuration on demand
const getConfig = async () => {
    if (!configCache) {
        const module = await import("../assets/FileExplorerIcons");
        configCache = module.FileExplorerIcons as {
            folderNames: Record<string, string>;
            fileNames: Record<string, string>;
            fileExtensions: Record<string, string>;
        };
    }
    return configCache;
};

// Cache for loaded icons (loaded on demand)
const iconCache: Record<string, string> = {};

// Function to dynamically load an icon when needed
const loadIcon = async (iconName: string, lightMode: boolean = false): Promise<string | null> => {
    // Add _light suffix if in light mode
    const finalIconName = lightMode ? `${iconName}_light` : iconName;

    // Check if already cached
    if (iconCache[finalIconName]) {
        return iconCache[finalIconName];
    }

    try {
        // Dynamically import the icon
        let module;
        try {
            module = await import(`../assets/FileExplorerIcons/${finalIconName}.svg`);
        } catch {
            // If not found, try the regular icon name
            module = await import(`../assets/FileExplorerIcons/${iconName}.svg`);
        }
        iconCache[finalIconName] = module.default;
        return module.default;
    } catch {
        // Icon not found, return null
        return null;
    }
};

// ----------------------------------------------------------------
// Utility Functions
// ----------------------------------------------------------------

// eslint-disable-next-line react-refresh/only-export-components
export const getFileExtension = (fileName: string): string => {
    const lastDotIndex = fileName.lastIndexOf(".");
    return lastDotIndex > 0 ? fileName.slice(lastDotIndex + 1) : "";
};

const getFileIcon = async (fileName: string): Promise<string> => {
    const config = await getConfig();
    const lowerFileName = fileName.toLowerCase();

    // First check if the exact file name has a specific icon
    if (config.fileNames[lowerFileName]) {
        return config.fileNames[lowerFileName];
    }

    // Then check by file extension
    const ext = getFileExtension(lowerFileName);
    if (ext && config.fileExtensions[ext]) {
        return config.fileExtensions[ext];
    }

    // Fallback to generic file icon
    return "file";
};

// Get folder icon based on folder name
const getFolderIcon = async (folderName: string, isExpanded: boolean): Promise<string> => {
    const config = await getConfig();
    const lowerFolderName = folderName.toLowerCase();

    // Check folder names
    if (isExpanded && config.folderNames[lowerFolderName]) {
        return config.folderNames[lowerFolderName] + "-open";
    }
    if (!isExpanded && config.folderNames[lowerFolderName]) {
        return config.folderNames[lowerFolderName];
    }

    // Return default folder icon type
    if (isExpanded) {
        return "folder-open";
    } else {
        return "folder";
    }
};

// ----------------------------------------------------------------
// FileIcon Component - Icon rendering for different file types
// ----------------------------------------------------------------

// Hardcoded folder icons (kept in code for performance)
const FOLDER_ICON_EXPANDED = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
        <path
            d="M14.483 6H4.721a1 1 0 0 0-.949.684L2 12V5h12a1 1 0 0 0-1-1H7.562a1 1 0 0 1-.64-.232l-.644-.536A1 1 0 0 0 5.638 3H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h11l2.403-5.606A1 1 0 0 0 14.483 6"
            fill="#90a4ae"
        />
    </svg>
);

const FOLDER_ICON_COLLAPSED = (
    <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
        <path
            d="m6.922 3.768-.644-.536A1 1 0 0 0 5.638 3H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1H7.562a1 1 0 0 1-.64-.232"
            fill="#90a4ae"
        />
    </svg>
);

// Default file icon (used when no specific icon is found)
const DEFAULT_FILE_ICON = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
            d="M9.5 2H3.5C2.95 2 2.5 2.45 2.5 3V13C2.5 13.55 2.95 14 3.5 14H12.5C13.05 14 13.5 13.55 13.5 13V6L9.5 2Z"
            fill="#7F8C96"
        />
        <path d="M9.5 2V5.5C9.5 5.78 9.72 6 10 6H13.5L9.5 2Z" fill="#5F6C75" />
    </svg>
);

export const FileIcon = memo(({ type, isExpanded, lightMode = false }: FileIconProps) => {
    const [iconUrl, setIconUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [resolvedType, setResolvedType] = useState<string>("file");

    // Resolve type if it's a Promise (for async icon name resolution)
    useEffect(() => {
        let isMounted = true;

        const resolveType = async () => {
            // Check if type is a Promise (from async getFileIcon or getFolderIcon)
            const actualType = typeof type === "string" ? type : await type;

            if (isMounted) {
                setResolvedType(actualType);
            }
        };

        resolveType();

        return () => {
            isMounted = false;
        };
    }, [type]);

    // Load icon dynamically when component mounts or type changes
    useEffect(() => {
        let isMounted = true;
        setIsLoading(true);

        // Try to load the icon dynamically
        loadIcon(resolvedType, lightMode)
            .then((url) => {
                if (isMounted) {
                    setIconUrl(url);
                    setIsLoading(false);
                }
            })
            .catch(() => {
                if (isMounted) {
                    setIconUrl(null);
                    setIsLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [resolvedType, isExpanded, lightMode]);

    // Show loading state
    if (isLoading) {
        // Use default icons while loading
        if (resolvedType === "folder" || resolvedType.startsWith("folder-")) {
            return isExpanded ? FOLDER_ICON_EXPANDED : FOLDER_ICON_COLLAPSED;
        }
        return DEFAULT_FILE_ICON;
    }

    // Try to use dynamically loaded icon
    if (iconUrl) {
        return (
            <img src={iconUrl} width="16" height="16" alt={resolvedType} style={{ display: "block" }} />
        );
    }

    // Fallback to default icons
    if (resolvedType === "folder" || resolvedType.startsWith("folder-")) {
        return isExpanded ? FOLDER_ICON_EXPANDED : FOLDER_ICON_COLLAPSED;
    }

    return DEFAULT_FILE_ICON;
});

// ----------------------------------------------------------------
// FileSystemItem Component - Memoized for performance
// ----------------------------------------------------------------

export const FileSystemItem = memo(({
    item,
    level,
    onToggle,
    onSelect,
    selectedId,
    creationContext,
    renameContext,
    lightMode = false,
}: FileSystemItemProps) => {
    const isFolder = item.type === "folder";
    const isSelected = selectedId === item.id;
    const showNewItemInput = creationContext?.isCreating && creationContext.targetFolderId === item.id;
    const isRenaming = renameContext?.isRenaming && renameContext.itemId === item.id;
    
    // Memoize calculated values
    const paddingLeft = useMemo(() => `${level * 16 + 8}px`, [level]);

    // Calculate guide lines for this level (memoized)
    const guideLines = useMemo(() => {
        const lines = [];
        for (let i = 0; i < level; i++) {
            lines.push(
                <div
                    key={i}
                    className="file-system-item__guide-line"
                    style={{ left: `${i * 16 + 15}px` }}
                />
            );
        }
        return lines;
    }, [level]);

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

    const handleRenameInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            renameContext?.onNewNameChange(e.target.value);
        },
        [renameContext]
    );

    return (
        <div className="file-system-item-wrapper">
            {guideLines}
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
                            <path
                                d="M6 11L11 6L6 1"
                                stroke="var(--color-muted)"
                                strokeWidth="1.5"
                                fill="none"
                            />
                        </svg>
                    </span>
                ) : (
                    <div className="file-system-item__spacer" />
                )}

                {/* File/Folder icon */}
                <span className="file-system-item__icon">
                    <FileIcon
                        type={
                            isFolder
                                ? getFolderIcon(item.name, item.isExpanded || false)
                                : getFileIcon(item.name)
                        }
                        isExpanded={item.isExpanded}
                        lightMode={lightMode}
                    />
                </span>

                {/* File/Folder name or rename input */}
                {isRenaming ? (
                    <input
                        type="text"
                        value={renameContext.newName}
                        onChange={handleRenameInputChange}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") renameContext.onRenameItem();
                            if (e.key === "Escape") renameContext.onCancelRename();
                        }}
                        onBlur={renameContext.onRenameItem}
                        autoFocus
                        className="file-explorer__new-item-input"
                        onClick={(e) => e.stopPropagation()}
                    />
                ) : (
                    <span className="file-system-item__name">{item.name}</span>
                )}
            </div>

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
                            renameContext={renameContext}
                            lightMode={lightMode}
                        />
                    ))}
                </div>
            )}

            {/* Show new item input at the end if creating inside this folder */}
            {showNewItemInput && isFolder && creationContext && (
                <NewItemInput
                    level={level + 1}
                    createType={creationContext.createType}
                    newItemName={creationContext.newItemName}
                    onNewItemNameChange={handleInputChange}
                    onCreateItem={creationContext.onCreateItem}
                    onCancelCreate={creationContext.onCancelCreate}
                    lightMode={lightMode}
                />
            )}
        </div>
    );
}, (prevProps, nextProps) => {
    // Custom comparison - return true if props are EQUAL (should NOT update)
    // Check if children reference changed (important for nested updates)
    const childrenChanged = prevProps.item.children !== nextProps.item.children;
    
    if (childrenChanged) return false; // Must update if children changed
    
    return (
        prevProps.item.id === nextProps.item.id &&
        prevProps.item.name === nextProps.item.name &&
        prevProps.item.isExpanded === nextProps.item.isExpanded &&
        prevProps.item.type === nextProps.item.type &&
        prevProps.level === nextProps.level &&
        prevProps.selectedId === nextProps.selectedId &&
        prevProps.creationContext === nextProps.creationContext &&
        prevProps.renameContext === nextProps.renameContext &&
        prevProps.lightMode === nextProps.lightMode
    );
});

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
    lightMode?: boolean;
}

const NewItemInput = memo(({
    level,
    createType,
    newItemName,
    onNewItemNameChange,
    onCreateItem,
    onCancelCreate,
    lightMode = false,
}: NewItemInputProps) => {
    // Memoize calculated values
    const paddingLeft = useMemo(() => `${level * 16 + 8}px`, [level]);

    // Calculate guide lines (memoized)
    const guideLines = useMemo(() => {
        const lines = [];
        for (let i = 0; i < level; i++) {
            lines.push(
                <div
                    key={i}
                    className="file-system-item__guide-line"
                    style={{ left: `${i * 16 + 15}px` }}
                />
            );
        }
        return lines;
    }, [level]);

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
        <div className="file-explorer__new-item-wrapper">
            {guideLines}
            <div className="file-explorer__new-item" style={{ paddingLeft }} onClick={handleClick}>
                <div className="file-system-item__spacer" />
            <span className="file-system-item__icon">
                <FileIcon
                    type={createType === "folder" ? "folder" : "file"}
                    isExpanded={false}
                    lightMode={lightMode}
                />
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
        </div>
    );
});

// ----------------------------------------------------------------
// FileExplorer Component - Main explorer with optimized state management
// ----------------------------------------------------------------

export const FileExplorer = ({
    data = [],
    onItemClick,
    onItemSelect,
    onDataChange,
    contextMenuOptions = {
        createFile: { enabled: true },
        createFolder: { enabled: true },
        rename: { enabled: true },
        delete: { enabled: true },
    },
    lightMode = false,
}: FileExplorerProps) => {
    // ----------------------------------------------------------------
    // State Management
    // ----------------------------------------------------------------
    const [fileSystem, setFileSystem] = useState<FileSystemItem[]>(data);
    const [selectedId, setSelectedId] = useState<string>();
    const [isCreating, setIsCreating] = useState(false);
    const [createType, setCreateType] = useState<"file" | "folder">("file");
    const [newItemName, setNewItemName] = useState("");
    const [targetFolderId, setTargetFolderId] = useState<string | null>(null);
    const [isRenaming, setIsRenaming] = useState(false);
    const [renamingItemId, setRenamingItemId] = useState<string | null>(null);
    const [newName, setNewName] = useState("");
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; itemId?: string } | null>(
        null
    );

    // Track if the change came from external prop to avoid infinite loops
    const isExternalUpdate = useRef(false);

    // Sync internal state with external data prop
    useEffect(() => {
        isExternalUpdate.current = true;
        setFileSystem(data);
    }, [data]);

    // Notify parent component when fileSystem changes (after render)
    useEffect(() => {
        // Only notify parent if change was internal (not from external prop)
        if (!isExternalUpdate.current) {
            onDataChange?.(fileSystem);
        } else {
            isExternalUpdate.current = false;
        }
    }, [fileSystem, onDataChange]);

    // Helper function to update fileSystem
    const updateFileSystem = useCallback(
        (updater: FileSystemItem[] | ((prev: FileSystemItem[]) => FileSystemItem[])) => {
            setFileSystem((prev) => {
                const newData = typeof updater === "function" ? updater(prev) : updater;
                return newData;
            });
        },
        []
    );

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
        (
            items: FileSystemItem[],
            childId: string,
            parent: FileSystemItem | null = null
        ): FileSystemItem | null => {
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
    const toggleItem = useCallback(
        (id: string) => {
            updateFileSystem((prevFileSystem) => {
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
        },
        [updateFileSystem]
    );

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
    const createNewItem = useCallback(async () => {
        if (!newItemName.trim()) return;

        const targetItem = targetFolderId ? findItemById(fileSystem, targetFolderId) : undefined;
        const options =
            createType === "folder" ? contextMenuOptions.createFolder : contextMenuOptions.createFile;

        // Call onBeforeCreate callback
        if (options?.onBeforeCreate) {
            const shouldContinue = await options.onBeforeCreate(targetItem || undefined);
            if (!shouldContinue) {
                cancelCreate();
                return;
            }
        }

        const newItem: FileSystemItem = {
            id: Date.now().toString(),
            name: newItemName,
            type: createType,
            children: createType === "folder" ? [] : undefined,
            isExpanded: false,
        };

        updateFileSystem((prevFileSystem) => {
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

        // Call onAfterCreate callback
        if (options?.onAfterCreate) {
            options.onAfterCreate(newItem, targetItem || undefined);
        }

        cancelCreate();
    }, [
        newItemName,
        createType,
        targetFolderId,
        cancelCreate,
        contextMenuOptions,
        fileSystem,
        findItemById,
        updateFileSystem,
    ]);

    /**
     * Start creating a new item
     */
    const startCreating = useCallback(
        (type: "file" | "folder", contextItemId?: string, isFromContextMenu: boolean = false) => {
            setCreateType(type);
            setNewItemName("");

            // If from context menu without specific item, create in root
            if (isFromContextMenu && contextItemId === undefined) {
                setTargetFolderId(null);
                setIsCreating(true);
                return;
            }

            // Otherwise, use context item or selected item
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
    const deleteItem = useCallback(
        async (id: string) => {
            const itemToDelete = findItemById(fileSystem, id);
            if (!itemToDelete) return;

            // Call onBeforeDelete callback
            if (contextMenuOptions.delete?.onBeforeDelete) {
                const shouldContinue = await contextMenuOptions.delete.onBeforeDelete(itemToDelete);
                if (!shouldContinue) {
                    setContextMenu(null);
                    return;
                }
            }

            updateFileSystem((prevFileSystem) => {
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

            // Call onAfterDelete callback
            if (contextMenuOptions.delete?.onAfterDelete) {
                contextMenuOptions.delete.onAfterDelete(itemToDelete);
            }

            setContextMenu(null);
        },
        [fileSystem, findItemById, contextMenuOptions, updateFileSystem]
    );

    /**
     * Start renaming an item
     */
    const startRenaming = useCallback(
        (itemId: string) => {
            const item = findItemById(fileSystem, itemId);
            if (!item) return;

            setRenamingItemId(itemId);
            setNewName(item.name);
            setIsRenaming(true);
            setContextMenu(null);
        },
        [fileSystem, findItemById]
    );

    /**
     * Cancel renaming
     */
    const cancelRename = useCallback(() => {
        setIsRenaming(false);
        setRenamingItemId(null);
        setNewName("");
    }, []);

    /**
     * Rename an item
     */
    const renameItem = useCallback(async () => {
        if (!renamingItemId || !newName.trim()) {
            cancelRename();
            return;
        }

        const item = findItemById(fileSystem, renamingItemId);
        if (!item) {
            cancelRename();
            return;
        }

        // Don't rename if name hasn't changed
        if (item.name === newName.trim()) {
            cancelRename();
            return;
        }

        const oldName = item.name;

        // Call onBeforeRename callback
        if (contextMenuOptions.rename?.onBeforeRename) {
            const shouldContinue = await contextMenuOptions.rename.onBeforeRename(item, newName.trim());
            if (!shouldContinue) {
                cancelRename();
                return;
            }
        }

        updateFileSystem((prevFileSystem) => {
            const renameRecursive = (items: FileSystemItem[]): FileSystemItem[] => {
                return items.map((item) => {
                    if (item.id === renamingItemId) {
                        return { ...item, name: newName.trim() };
                    }
                    if (item.children) {
                        return { ...item, children: renameRecursive(item.children) };
                    }
                    return item;
                });
            };
            return renameRecursive(prevFileSystem);
        });

        // Call onAfterRename callback
        if (contextMenuOptions.rename?.onAfterRename) {
            contextMenuOptions.rename.onAfterRename(
                { ...item, name: newName.trim() },
                oldName,
                newName.trim()
            );
        }

        cancelRename();
    }, [
        renamingItemId,
        newName,
        cancelRename,
        fileSystem,
        findItemById,
        contextMenuOptions,
        updateFileSystem,
    ]);

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

    /**
     * Close context menu when clicking outside or scrolling
     */
    useEffect(() => {
        if (!contextMenu) return;

        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // Check if click was outside the context menu
            if (!target.closest(".file-explorer__context-menu")) {
                setContextMenu(null);
            }
        };

        const handleScroll = () => {
            setContextMenu(null);
        };

        // Add listener after a short delay to avoid closing immediately
        const timeoutId = setTimeout(() => {
            document.addEventListener("click", handleClickOutside);
            document.addEventListener("scroll", handleScroll, true); // Use capture phase to catch all scroll events
        }, 0);

        return () => {
            clearTimeout(timeoutId);
            document.removeEventListener("click", handleClickOutside);
            document.removeEventListener("scroll", handleScroll, true);
        };
    }, [contextMenu]);

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

    const renameContext = useMemo(
        () =>
            isRenaming && renamingItemId
                ? {
                      isRenaming,
                      itemId: renamingItemId,
                      newName,
                      onNewNameChange: setNewName,
                      onRenameItem: renameItem,
                      onCancelRename: cancelRename,
                  }
                : undefined,
        [isRenaming, renamingItemId, newName, renameItem, cancelRename]
    );

    // ----------------------------------------------------------------
    // Render
    // ----------------------------------------------------------------

    return (
        <div className="file-explorer" onContextMenu={handleContextMenu}>
            {/* Header with action buttons */}
            <ExplorerHeader
                onCreateFile={() => startCreating("file")}
                onCreateFolder={() => startCreating("folder")}
                showCreateFile={contextMenuOptions.createFile?.enabled !== false}
                showCreateFolder={contextMenuOptions.createFolder?.enabled !== false}
            />

            {/* File system tree view */}
            <div className="file-explorer__content">
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
                        renameContext={renameContext}
                        lightMode={lightMode}
                    />
                ))}

                {/* New item input field at root level (at the end) */}
                {isCreating && targetFolderId === null && (
                    <NewItemInput
                        level={0}
                        createType={createType}
                        newItemName={newItemName}
                        onNewItemNameChange={(e) => setNewItemName(e.target.value)}
                        onCreateItem={createNewItem}
                        onCancelCreate={cancelCreate}
                        lightMode={lightMode}
                    />
                )}

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
                    options={contextMenuOptions}
                    onCreateFile={() => {
                        startCreating("file", contextMenu.itemId, true);
                        setContextMenu(null);
                    }}
                    onCreateFolder={() => {
                        startCreating("folder", contextMenu.itemId, true);
                        setContextMenu(null);
                    }}
                    onRename={() => contextMenu.itemId && startRenaming(contextMenu.itemId)}
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
    showCreateFile?: boolean;
    showCreateFolder?: boolean;
}

const ExplorerHeader = memo(({
    onCreateFile,
    onCreateFolder,
    showCreateFile = true,
    showCreateFolder = true,
}: ExplorerHeaderProps) => (
    <div className="file-explorer__header">
        <span className="file-explorer__title">Explorer</span>
        <div className="file-explorer__actions">
            {/* New File button */}
            {showCreateFile && (
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
            )}
            {/* New Folder button */}
            {showCreateFolder && (
                <button
                    onClick={onCreateFolder}
                    className="file-explorer__action-btn"
                    title="New Folder"
                >
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
            )}
        </div>
    </div>
));

// ----------------------------------------------------------------
// ContextMenu Component - Separated for better organization
// ----------------------------------------------------------------

interface ContextMenuProps {
    x: number;
    y: number;
    itemId?: string;
    options: FileExplorerProps["contextMenuOptions"];
    onCreateFile: () => void;
    onCreateFolder: () => void;
    onRename: () => void;
    onDelete: () => void;
}

const ContextMenu = memo(({
    x,
    y,
    itemId,
    options,
    onCreateFile,
    onCreateFolder,
    onRename,
    onDelete,
}: ContextMenuProps) => {
    const showCreateFile = options?.createFile?.enabled !== false;
    const showCreateFolder = options?.createFolder?.enabled !== false;
    const showRename = options?.rename?.enabled !== false && itemId;
    const showDelete = options?.delete?.enabled !== false && itemId;

    // Don't render menu if all options are disabled
    const hasAnyOption = showCreateFile || showCreateFolder || showRename || showDelete;
    if (!hasAnyOption) {
        return null;
    }

    return (
        <div className="file-explorer__context-menu" style={{ left: x + 1, top: y + 1 }}>
            {showCreateFile && (
                <button onClick={onCreateFile} className="file-explorer__context-menu-item">
                    New File
                </button>
            )}
            {showCreateFolder && (
                <button onClick={onCreateFolder} className="file-explorer__context-menu-item">
                    New Folder
                </button>
            )}
            {itemId && (showRename || showDelete) && (showCreateFile || showCreateFolder) && (
                <div className="file-explorer__context-menu-separator"></div>
            )}
            {showRename && (
                <button onClick={onRename} className="file-explorer__context-menu-item">
                    Rename
                </button>
            )}
            {showDelete && (
                <button onClick={onDelete} className="file-explorer__context-menu-item">
                    Delete
                </button>
            )}
        </div>
    );
});
