import { useMemo, useCallback, type ReactNode } from "react";
import "./IconListView.css";

export interface IconListItem {
    id: string | number;
    icon?: string;
    text: string;
    subtitle?: string;
    badge?: string | number;
    disabled?: boolean;
    gridSpan?: number; // How many columns the icon will occupy (1-4)
    gridRowSpan?: number; // How many rows the icon will occupy
    gridColumnStart?: number; // Starting position in columns (1-based)
    gridRowStart?: number; // Starting position in rows (1-based)
    iconSize?: "small" | "medium" | "large" | "xlarge"; // Icon size
    iconLeft?: boolean; // Align icon to the left
    backgroundSvg?: string;
    textColor?: string; // Custom text color for the item
    subtitleColor?: string; // Custom subtitle color for the item
    backgroundColor?: string; // Custom background color for the item
    backgroundImage?: string; // Background image for the item
    backgroundGradient?: string; // Background gradient for the item
}

interface IconListViewProps {
    items: IconListItem[];
    onItemClick?: (item: IconListItem, index: number) => void;
    onItemHover?: (item: IconListItem, index: number) => void;
    onItemDoubleClick?: (item: IconListItem, index: number) => void;
    selectedId?: string | number;
    className?: string;
    itemClassName?: string;
    iconClassName?: string;
    textClassName?: string;
    renderCustomContent?: (item: IconListItem, index: number) => ReactNode;
    layout?: "list" | "grid";
    gridColumns?: number; // Number of columns in the grid (default: 4)
    gridDensity?: "compact" | "normal" | "comfortable"; // Grid density: compact (more items), normal (default), comfortable (fewer items)
    allowFixedItems?: boolean;
    iconSize?: "small" | "medium" | "large" | "xlarge"; // Global icon size
    iconLeft?: boolean; // Global icon left alignment
    gap?: string; // Spacing between items
    textColor?: string; // Global text color
    subtitleColor?: string; // Global subtitle color
    backgroundSvg?: string; // Desktop background SVG
    backgroundColor?: string; // Desktop background color
}

export default function IconListView({
    items,
    onItemClick,
    onItemHover,
    onItemDoubleClick,
    selectedId,
    className = "",
    itemClassName = "",
    iconClassName = "",
    textClassName = "",
    renderCustomContent,
    layout = "grid",
    gridColumns = 4,
    gridDensity = "normal",
    allowFixedItems = true,
    iconSize = "medium",
    iconLeft = false,
    gap = "1rem",
    textColor = "",
    subtitleColor = "",
    backgroundColor = "var(--bg-light)",
    backgroundSvg = "",
}: IconListViewProps) {
    // Memoize icon size calculations
    const getIconSizeInPercent = useCallback((size: "small" | "medium" | "large" | "xlarge"): string => {
        const sizes = {
            small: "25%",
            medium: "45%",
            large: "65%",
            xlarge: "85%",
        };
        return sizes[size];
    }, []);

    const getIconMaxSizeInPercent = useCallback((size: "small" | "medium" | "large" | "xlarge"): string => {
        const sizes = {
            small: "80px",
            medium: "135px",
            large: "195px",
            xlarge: "255px",
        };
        return sizes[size];
    }, []);

    const handleItemClick = useCallback((item: IconListItem, index: number) => {
        if (!item.disabled && onItemClick) {
            onItemClick(item, index);
        }
    }, [onItemClick]);

    const handleItemDoubleClick = useCallback((item: IconListItem, index: number) => {
        if (!item.disabled && onItemDoubleClick) {
            onItemDoubleClick(item, index);
        }
    }, [onItemDoubleClick]);

    const handleItemHover = useCallback((item: IconListItem, index: number) => {
        if (!item.disabled && onItemHover) {
            onItemHover(item, index);
        }
    }, [onItemHover]);

    // Memoize container style
    const containerStyle = useMemo((): React.CSSProperties => {
        const baseStyle: React.CSSProperties = {
            backgroundColor: backgroundColor,
            backgroundImage: backgroundSvg
                ? `url('data:image/svg+xml;utf8,${encodeURIComponent(backgroundSvg)}')`
                : undefined,
        };

        if (layout === "grid") {
            // Define grid item sizes based on density
            const densityConfig = {
                compact: { minSize: "80px", maxSize: "120px", minRowSize: "90px" },
                normal: { minSize: "100px", maxSize: "150px", minRowSize: "110px" },
                comfortable: { minSize: "120px", maxSize: "180px", minRowSize: "130px" },
            };

            const config = densityConfig[gridDensity];

            return {
                ...baseStyle,
                gridTemplateColumns: `repeat(auto-fit, minmax(${config.minSize}, ${config.maxSize}))`,
                justifyContent: "center",
                gridAutoRows: `minmax(${config.minRowSize}, auto)`,
                gap: gap,
            };
        } else {
            return baseStyle;
        }
    }, [backgroundColor, backgroundSvg, layout, gap, gridDensity]);

    // Memoize processed items
    const processedItems = useMemo((): IconListItem[] => {
        if (layout !== "list" || !allowFixedItems) {
            return items;
        }

        const adjustedItems = [...items];
        const rowMap = new Map<number, number>();

        adjustedItems.forEach((item) => {
            if (item.gridRowStart !== undefined) {
                const currentRow = item.gridRowStart;
                const itemsInRow = rowMap.get(currentRow) || 0;

                const newRowStart = currentRow + itemsInRow * (item.gridRowSpan || 1);
                item.gridRowStart = newRowStart;

                rowMap.set(currentRow, itemsInRow + 1);
            }
        });

        return adjustedItems;
    }, [items, layout, allowFixedItems]);

    const renderIcon = useCallback((item: IconListItem) => {
        if (!item.icon) return null;

        const size = item.iconSize || iconSize;
        const sizeInPercent = getIconSizeInPercent(size);
        const maxSizeInPercent = getIconMaxSizeInPercent(size);

        return (
            <div
                className={`icon-list-icon ${iconClassName}`}
                dangerouslySetInnerHTML={{ __html: item.icon }}
                style={{
                    width: sizeInPercent,
                    maxWidth: maxSizeInPercent,
                    maxHeight: maxSizeInPercent,
                }}
            />
        );
    }, [iconSize, iconClassName, getIconSizeInPercent, getIconMaxSizeInPercent]);

    const getItemStyle = useCallback((item: IconListItem): React.CSSProperties => {
        const baseStyle: React.CSSProperties = {};

        // Custom item background
        if (item.backgroundColor) {
            baseStyle.backgroundColor = item.backgroundColor;
        }

        // Item background image
        if (item.backgroundImage) {
            baseStyle.backgroundImage = `url(${item.backgroundImage})`;
            baseStyle.backgroundSize = "cover";
            baseStyle.backgroundPosition = "center";
            baseStyle.backgroundRepeat = "no-repeat";
        }

        // Item background gradient
        if (item.backgroundGradient) {
            baseStyle.backgroundImage = item.backgroundGradient;
        }

        if (item.backgroundSvg) {
            baseStyle.backgroundImage = `url('data:image/svg+xml;utf8,${encodeURIComponent(
                item.backgroundSvg
            )}')`;
            baseStyle.backgroundSize = "cover";
            baseStyle.backgroundPosition = "center";
        }

        // Specific row position (from top)
        if (item.gridRowStart !== undefined && allowFixedItems) {
            let rowEnd = item.gridRowSpan ? item.gridRowStart + item.gridRowSpan : item.gridRowStart + 1;
            if (layout === "list") {
                // In list layout, set rowEnd equal to gridRowStart to avoid spanning
                rowEnd = item.gridRowStart;
            }
            baseStyle.gridRow = `${item.gridRowStart} / ${rowEnd}`;
        }

        // Grid positioning control
        if (layout === "grid") {
            // Column span (width)
            if (item.gridSpan) {
                // In allowFixedItems mode, limits the span to prevent overflow from the grid
                const maxSpan = allowFixedItems ? item.gridSpan : Math.min(item.gridSpan, gridColumns);
                baseStyle.gridColumn = `span ${maxSpan}`;
            }

            // Specific column position (from left)
            if (item.gridColumnStart !== undefined && allowFixedItems) {
                const columnEnd = item.gridSpan
                    ? item.gridColumnStart + item.gridSpan
                    : item.gridColumnStart + 1;
                baseStyle.gridColumn = `${item.gridColumnStart} / ${columnEnd}`;
            }
        }

        return baseStyle;
    }, [layout, allowFixedItems, gridColumns]);

    const getItemClasses = useCallback((item: IconListItem, isSelected: boolean, isDisabled: boolean): string => {
        const classes = [
            "icon-list-item",
            layout === "grid" ? "icon-list-item-grid" : "icon-list-item-list",
        ];

        if (isDisabled) {
            classes.push("icon-list-item-disabled");
        } else {
            classes.push("icon-list-item-enabled");
        }

        if (isSelected) {
            classes.push("icon-list-item-selected");
        } else if (
            !item.backgroundColor &&
            !item.backgroundImage &&
            !item.backgroundGradient &&
            !item.backgroundSvg
        ) {
            classes.push("icon-list-item-default");
        }

        if (itemClassName) {
            classes.push(itemClassName);
        }

        return classes.join(" ");
    }, [layout, itemClassName]);

    return (
        <div
            style={containerStyle}
            className={`icon-list-container ${
                layout === "grid" ? "icon-list-grid" : "icon-list-list"
            } ${className}`}
        >
            {processedItems.map((item, index) => {
                const isSelected = selectedId === item.id;
                const isDisabled = item.disabled || false;

                return (
                    <div
                        key={item.id}
                        onClick={() => handleItemClick(item, index)}
                        onDoubleClick={() => handleItemDoubleClick(item, index)}
                        onMouseEnter={() => handleItemHover(item, index)}
                        style={getItemStyle(item)}
                        className={getItemClasses(item, isSelected, isDisabled)}
                        id={item.id.toString()}
                    >
                        {item.backgroundSvg && <div className="icon-list-overlay-svg" />}

                        {/* Overlay to improve readability if there is a custom background */}
                        {(item.backgroundImage || item.backgroundGradient) && (
                            <div className="icon-list-overlay-custom" />
                        )}

                        <div
                            className="icon-list-content"
                            style={
                                layout === "grid"
                                    ? { flexDirection: iconLeft || item.iconLeft ? "row" : "column" }
                                    : undefined
                            }
                        >
                            {renderCustomContent ? (
                                renderCustomContent(item, index)
                            ) : (
                                <>
                                    {item.icon && renderIcon(item)}

                                    <div className="icon-list-text-container">
                                        <div className="icon-list-title-wrapper">
                                            <p
                                                className={`icon-list-text ${
                                                    layout === "grid"
                                                        ? "icon-list-text-grid"
                                                        : "icon-list-text-list"
                                                } ${
                                                    isSelected
                                                        ? "icon-list-text-selected"
                                                        : "icon-list-text-default"
                                                } ${textClassName}`}
                                                style={{ color: item.textColor || textColor }}
                                            >
                                                {item.text}
                                            </p>
                                            {item.badge !== undefined && (
                                                <span className="icon-list-badge">{item.badge}</span>
                                            )}
                                        </div>
                                        {item.subtitle && (
                                            <p
                                                className="icon-list-subtitle"
                                                style={{ color: item.subtitleColor || subtitleColor }}
                                            >
                                                {item.subtitle}
                                            </p>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
