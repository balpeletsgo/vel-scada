import { useEffect, useState, useCallback } from "react";
import Echo from "laravel-echo";

interface SystemPrice {
    base_price: number;
    multiplier: number;
    final_price: number;
    supply_kwh?: number;
    demand_kwh?: number;
    market_condition: "high_supply" | "balanced" | "high_demand";
    effective_from: string;
}

interface UseSystemPriceOptions {
    initialPrice?: SystemPrice | null;
}

export function useSystemPrice(options: UseSystemPriceOptions = {}) {
    const [systemPrice, setSystemPrice] = useState<SystemPrice | null>(
        options.initialPrice || null
    );
    const [isConnected, setIsConnected] = useState(false);

    const updatePrice = useCallback((data: SystemPrice) => {
        setSystemPrice(data);
    }, []);

    useEffect(() => {
        // @ts-ignore
        const echo = window.Echo as Echo;

        if (!echo) {
            console.warn("Echo not available");
            return;
        }

        const channel = echo.channel("system-price");

        channel
            .listen(".price.updated", (event: { priceData: SystemPrice }) => {
                console.log("Price updated:", event.priceData);
                updatePrice(event.priceData);
            })
            .subscribed(() => {
                setIsConnected(true);
                console.log("Subscribed to system-price channel");
            })
            .error((error: any) => {
                console.error("Channel error:", error);
                setIsConnected(false);
            });

        return () => {
            echo.leave("system-price");
        };
    }, [updatePrice]);

    return {
        systemPrice,
        isConnected,
        setSystemPrice,
    };
}
