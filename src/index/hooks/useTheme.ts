import { useState, useEffect } from "react";

/**
 * Custom hook to detect and react to theme changes
 * Listens to changes in the data-theme attribute on the document element
 */
export function useTheme() {
    const [theme, setTheme] = useState<string>(() => {
        return document.documentElement.getAttribute("data-theme") || "dark";
    });

    const [isLightMode, setIsLightMode] = useState<boolean>(() => {
        return document.documentElement.getAttribute("data-theme") === "light";
    });

    useEffect(() => {
        // Create a MutationObserver to watch for theme changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === "attributes" && mutation.attributeName === "data-theme") {
                    const newTheme = document.documentElement.getAttribute("data-theme") || "dark";
                    setTheme(newTheme);
                    setIsLightMode(newTheme === "light");
                }
            });
        });

        // Start observing the document element for attribute changes
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["data-theme"],
        });

        // Cleanup observer on unmount
        return () => observer.disconnect();
    }, []);

    return { theme, isLightMode };
}
