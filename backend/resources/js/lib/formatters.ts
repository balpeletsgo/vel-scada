/**
 * Format a number as Indonesian Rupiah currency
 * @param value - The numeric value to format
 * @returns Formatted currency string (e.g., "Rp 1.500.000")
 */
export const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

/**
 * Format a kWh value with appropriate decimal places
 * - >= 10 kWh: 1 decimal place
 * - >= 1 kWh: 2 decimal places
 * - < 1 kWh: 4 decimal places
 * @param value - The kWh value to format
 * @returns Formatted kWh string (number only, without "kWh" suffix)
 */
export const formatKwh = (value: number): string => {
    if (value >= 10) return value.toFixed(1);
    if (value >= 1) return value.toFixed(2);
    return value.toFixed(4);
};

/**
 * Format a kWh value with the "kWh" suffix
 * @param value - The kWh value to format
 * @returns Formatted string with suffix (e.g., "12.5 kWh")
 */
export const formatKwhWithUnit = (value: number): string => {
    return `${formatKwh(value)} kWh`;
};

/**
 * Format a number with thousand separators (Indonesian format)
 * @param value - The numeric value to format
 * @returns Formatted number string (e.g., "1.500.000")
 */
export const formatNumber = (value: number): string => {
    return new Intl.NumberFormat("id-ID").format(value);
};

/**
 * Format a decimal number, removing unnecessary trailing zeros
 * @param value - The numeric value to format
 * @param maxDecimals - Maximum decimal places (default: 2)
 * @returns Formatted number string
 */
export const formatDecimal = (
    value: number,
    maxDecimals: number = 2
): string => {
    const formatted = value.toFixed(maxDecimals);
    // Remove trailing zeros after decimal point
    return parseFloat(formatted).toString();
};
