import { useEffect, useState, useRef } from "react";

interface EnergyData {
    timestamp: string;
    // Main Power (Token Listrik)
    main_power: number;
    // Solar Output
    solar_output: number;
    solar_status: string;
    // Battery
    battery_level: number;
    battery_percentage: number;
    battery_capacity: number;
    battery_status: string;
    // Consumption
    consumption: number;
    // SCADA readings
    scada: {
        voltage: number;
        current: number;
        frequency: number;
        power_factor: number;
        power_kw: number;
    };
}

export function useEnergyData(userId: number) {
    const [data, setData] = useState<EnergyData | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [history, setHistory] = useState<EnergyData[]>([]);
    const channelRef = useRef<string | null>(null);

    useEffect(() => {
        // Use existing Echo instance from echo.js (imported in app.tsx)
        if (!window.Echo) {
            console.warn("Echo not initialized");
            return;
        }

        const channelName = `energy.${userId}`;
        channelRef.current = channelName;

        // Subscribe to user's energy channel
        const channel = window.Echo.channel(channelName);

        channel.listen(".energy.updated", (newData: EnergyData) => {
            setData(newData);
            setHistory((prev) => {
                const updated = [...prev, newData];
                // Keep only last 60 data points (60 minutes at 60s interval)
                return updated.slice(-60);
            });
        });

        channel.subscribed(() => {
            setIsConnected(true);
            console.log("Connected to energy channel:", channelName);
        });

        return () => {
            if (channelRef.current) {
                window.Echo.leave(channelRef.current);
            }
            setIsConnected(false);
        };
    }, [userId]);

    return { data, history, isConnected };
}
