import { ChangeEvent, KeyboardEvent } from "react";

/**
 * Sanitize input to only allow numeric values (integers and decimals)
 * @param value - The input value to sanitize
 * @param allowDecimal - Whether to allow decimal points (default: true)
 * @returns Sanitized numeric string
 */
export const sanitizeNumericInput = (
    value: string,
    allowDecimal: boolean = true
): string => {
    if (!allowDecimal) {
        // Only allow digits
        return value.replace(/[^0-9]/g, "");
    }

    // Allow digits and one decimal point
    let sanitized = value.replace(/[^0-9.]/g, "");

    // Ensure only one decimal point
    const parts = sanitized.split(".");
    if (parts.length > 2) {
        sanitized = parts[0] + "." + parts.slice(1).join("");
    }

    return sanitized;
};

/**
 * Handle keydown event for numeric input
 * Allows: digits, decimal, backspace, delete, tab, escape, enter, arrows
 * @param e - Keyboard event
 * @param allowDecimal - Whether to allow decimal points (default: true)
 */
export const handleNumericKeyDown = (
    e: KeyboardEvent<HTMLInputElement>,
    allowDecimal: boolean = true
): void => {
    const allowedKeys = [
        "Backspace",
        "Delete",
        "Tab",
        "Escape",
        "Enter",
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "Home",
        "End",
    ];

    // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    if (
        (e.ctrlKey || e.metaKey) &&
        ["a", "c", "v", "x"].includes(e.key.toLowerCase())
    ) {
        return;
    }

    // Allow special keys
    if (allowedKeys.includes(e.key)) {
        return;
    }

    // Allow decimal point (only one)
    if (allowDecimal && e.key === ".") {
        const input = e.currentTarget;
        if (input.value.includes(".")) {
            e.preventDefault();
        }
        return;
    }

    // Allow digits 0-9
    if (/^[0-9]$/.test(e.key)) {
        return;
    }

    // Prevent all other keys
    e.preventDefault();
};

/**
 * Create onChange handler for numeric input
 * @param onChange - The original onChange handler from form library
 * @param allowDecimal - Whether to allow decimal points (default: true)
 * @returns Modified onChange handler
 */
export const createNumericOnChange = (
    onChange: (value: string) => void,
    allowDecimal: boolean = true
) => {
    return (e: ChangeEvent<HTMLInputElement>) => {
        const sanitized = sanitizeNumericInput(e.target.value, allowDecimal);
        onChange(sanitized);
    };
};

/**
 * Parse numeric string to number safely
 * @param value - String value to parse
 * @param defaultValue - Default value if parsing fails (default: 0)
 * @returns Parsed number
 */
export const parseNumericValue = (
    value: string,
    defaultValue: number = 0
): number => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Format number with thousand separators
 * @param value - Number to format
 * @param locale - Locale for formatting (default: 'id-ID')
 * @returns Formatted string
 */
export const formatNumber = (
    value: number,
    locale: string = "id-ID"
): string => {
    return new Intl.NumberFormat(locale).format(value);
};

/**
 * Format currency
 * @param value - Number to format
 * @param currency - Currency code (default: 'IDR')
 * @param locale - Locale for formatting (default: 'id-ID')
 * @returns Formatted currency string
 */
export const formatCurrency = (
    value: number,
    currency: string = "IDR",
    locale: string = "id-ID"
): string => {
    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
    }).format(value);
};
