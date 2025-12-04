import AppLayout from "@/Layouts/AppLayout";
import { Head, usePage, router } from "@inertiajs/react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
    ChartConfig,
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
    Battery,
    Sun,
    ArrowRight,
    ArrowDown,
    Activity,
    Radio,
    Gauge,
    TrendingUp,
    Home,
    Plug,
} from "lucide-react";
import { useEnergyData } from "@/hooks/useEnergyData";
import { useEffect, useState, useMemo, FormEvent } from "react";
import axios from "axios";

interface EnergyData {
    mainPower: { current: number; unit: string };
    solar: {
        currentOutput: number;
        maxCapacity: number;
        status: string;
        unit: string;
    };
    battery: {
        currentKwh: number;
        maxCapacity: number;
        percentage: number;
        status: string;
        unit: string;
    };
    trading: { totalSold: number; totalBought: number; balance: number };
    consumption: { ratePerHour: number; ratePerMinute: number; unit: string };
}

interface Transaction {
    id: number;
    type: "sell" | "buy";
    amount: number;
    price: number;
    total: number;
    status: string;
    created_at: string;
}

interface PublicTransaction {
    id: number;
    tx_hash: string;
    seller_name: string;
    buyer_name: string;
    energy_kwh: number;
    price_per_kwh: number;
    total_price: number;
    created_at: string;
}

interface DashboardProps {
    energyData: EnergyData;
    publicTransactions: PublicTransaction[];
    user: {
        id: number;
        name: string;
        email: string;
        address: string | null;
        phone: string | null;
        is_active: boolean;
    };
}

const energyChartConfig = {
    mainPower: { label: "Main Power", color: "hsl(221, 83%, 53%)" },
    battery: { label: "Battery", color: "hsl(142, 76%, 36%)" },
} satisfies ChartConfig;

import { formatKwh, formatCurrency } from "@/lib/formatters";

const toNumber = (value: any, defaultValue: number = 0): number => {
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
};

const getBatteryColor = (percentage: number): string => {
    if (percentage >= 60) return "text-green-500";
    if (percentage >= 30) return "text-yellow-500";
    return "text-red-500";
};

const getMainPowerColor = (kwh: number): string => {
    if (kwh >= 40) return "text-blue-500";
    if (kwh >= 20) return "text-yellow-500";
    return "text-red-500";
};

const getBatteryStatusBadge = (status: string) => {
    const variants: Record<
        string,
        {
            variant: "default" | "secondary" | "destructive" | "outline";
            label: string;
        }
    > = {
        charging: { variant: "default", label: "⚡ Charging" },
        discharging: { variant: "secondary", label: "🔋 Discharging" },
        idle: { variant: "outline", label: "💤 Idle" },
    };
    return variants[status] || variants.idle;
};

// Skeleton Components
const EnergyFlowSkeleton = () => (
    <Card className="bg-linear-to-br from-yellow-50 via-green-50 to-blue-50 dark:from-yellow-950/20 dark:via-green-950/20 dark:to-blue-950/20">
        <CardHeader>
            <Skeleton className="h-6 w-32 mx-auto" />
            <Skeleton className="h-4 w-64 mx-auto mt-2" />
        </CardHeader>
        <CardContent>
            <div className="flex flex-col items-center gap-4">
                <div className="flex items-center justify-center gap-4 flex-wrap">
                    <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm min-w-[140px] border-2 border-yellow-400">
                        <Skeleton className="h-10 w-10 mx-auto rounded-full" />
                        <Skeleton className="h-8 w-20 mx-auto mt-2" />
                        <Skeleton className="h-3 w-16 mx-auto mt-1" />
                        <Skeleton className="h-5 w-20 mx-auto mt-2 rounded-full" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm min-w-40 border-2 border-green-400">
                        <Skeleton className="h-10 w-10 mx-auto rounded-full" />
                        <Skeleton className="h-8 w-24 mx-auto mt-2" />
                        <Skeleton className="h-3 w-28 mx-auto mt-1" />
                        <Skeleton className="h-5 w-20 mx-auto mt-2 rounded-full" />
                    </div>
                </div>
                <div className="flex flex-col items-center">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-5 w-28 mt-1 rounded-full" />
                </div>
                <div className="flex items-center justify-center gap-4 flex-wrap">
                    <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm min-w-40 border-2 border-blue-400">
                        <Skeleton className="h-10 w-10 mx-auto rounded-full" />
                        <Skeleton className="h-8 w-20 mx-auto mt-2" />
                        <Skeleton className="h-3 w-24 mx-auto mt-1" />
                        <Skeleton className="h-3 w-28 mx-auto mt-1" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm min-w-[140px] border-2 border-purple-400">
                        <Skeleton className="h-10 w-10 mx-auto rounded-full" />
                        <Skeleton className="h-8 w-20 mx-auto mt-2" />
                        <Skeleton className="h-3 w-16 mx-auto mt-1" />
                        <Skeleton className="h-3 w-20 mx-auto mt-1" />
                    </div>
                </div>
            </div>
        </CardContent>
    </Card>
);

const StatCardSkeleton = () => (
    <Card className="border-l-4 border-l-gray-300">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4 rounded-full" />
        </CardHeader>
        <CardContent>
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-2 w-full mt-2" />
            <Skeleton className="h-3 w-32 mt-2" />
        </CardContent>
    </Card>
);

const ScadaSkeleton = () => (
    <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-48 mt-1" />
                </div>
                <Skeleton className="h-5 w-12 rounded-full" />
            </div>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div
                        key={i}
                        className="text-center p-3 bg-muted rounded-lg"
                    >
                        <Skeleton className="h-8 w-16 mx-auto" />
                        <Skeleton className="h-3 w-20 mx-auto mt-1" />
                    </div>
                ))}
            </div>
        </CardContent>
    </Card>
);

const ChartSkeleton = () => (
    <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-40 mt-1" />
                </div>
                <Skeleton className="h-5 w-12 rounded-full" />
            </div>
        </CardHeader>
        <CardContent>
            <Skeleton className="h-[300px] w-full" />
        </CardContent>
    </Card>
);

export default function Dashboard({
    energyData,
    publicTransactions = [],
    user,
}: DashboardProps) {
    const { auth } = usePage().props as any;
    const userId = auth?.user?.id || user?.id || 1;

    // Realtime WebSocket connection
    const { data: realtimeData, history, isConnected } = useEnergyData(userId);

    const [liveStats, setLiveStats] = useState({
        mainPower: toNumber(energyData?.mainPower?.current, 66),
        solarOutput: toNumber(energyData?.solar?.currentOutput, 0),
        solarMaxCapacity: toNumber(energyData?.solar?.maxCapacity, 0.37),
        solarStatus: energyData?.solar?.status || "inactive",
        batteryKwh: toNumber(energyData?.battery?.currentKwh, 50),
        batteryMaxCapacity: toNumber(energyData?.battery?.maxCapacity, 100),
        batteryPercentage: toNumber(energyData?.battery?.percentage, 50),
        batteryStatus: energyData?.battery?.status || "idle",
    });

    const [transferAmount, setTransferAmount] = useState("");
    const [isTransferring, setIsTransferring] = useState(false);
    const [transferMessage, setTransferMessage] = useState<{
        type: "success" | "error";
        text: string;
    } | null>(null);

    // Realtime update effect
    useEffect(() => {
        if (realtimeData) {
            setLiveStats((prev) => ({
                ...prev,
                mainPower: toNumber(realtimeData.main_power, prev.mainPower),
                solarOutput: toNumber(
                    realtimeData.solar_output,
                    prev.solarOutput
                ),
                batteryKwh: toNumber(
                    realtimeData.battery_level,
                    prev.batteryKwh
                ),
                batteryPercentage: toNumber(
                    realtimeData.battery_percentage,
                    prev.batteryPercentage
                ),
                batteryStatus:
                    realtimeData.battery_status || prev.batteryStatus,
            }));
        }
    }, [realtimeData]);

    const handleTransfer = async (e: FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(transferAmount);
        if (isNaN(amount) || amount <= 0) {
            setTransferMessage({
                type: "error",
                text: "Masukkan jumlah yang valid",
            });
            return;
        }
        if (amount > liveStats.batteryKwh) {
            setTransferMessage({
                type: "error",
                text: `Battery tidak cukup. Tersedia: ${formatKwh(
                    liveStats.batteryKwh
                )} kWh`,
            });
            return;
        }
        setIsTransferring(true);
        setTransferMessage(null);
        try {
            const response = await axios.post("/api/energy/transfer-to-main", {
                amount,
            });
            if (response.data.success) {
                setTransferMessage({
                    type: "success",
                    text: response.data.message,
                });
                setTransferAmount("");
                setLiveStats((prev) => ({
                    ...prev,
                    batteryKwh: response.data.data.battery.currentKwh,
                    batteryPercentage: response.data.data.battery.percentage,
                    mainPower: response.data.data.mainPower.current,
                }));
                router.reload({ only: ["energyData"] });
            }
        } catch (error: any) {
            setTransferMessage({
                type: "error",
                text: error.response?.data?.message || "Transfer gagal",
            });
        } finally {
            setIsTransferring(false);
        }
    };

    // Chart data - use realtime history if available, fallback to sample data
    const chartData = useMemo(() => {
        if (history.length > 0) {
            return history.map((item) => ({
                time: new Date(item.timestamp).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
                mainPower: toNumber(item.main_power, 0),
                consumption: toNumber(item.consumption, 0.046),
                battery: toNumber(item.battery_level, 0),
            }));
        }

        // Generate sample data for last 100 minutes (10 data points, 10 min interval)
        const now = new Date();
        const sampleData = [];
        let currentMainPower = liveStats.mainPower;
        const consumptionRate = 0.046; // kWh per 10 minutes

        for (let i = 9; i >= 0; i--) {
            const time = new Date(now.getTime() - i * 10 * 60000); // 10 minute intervals
            sampleData.push({
                time: time.toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
                mainPower: Math.max(0, currentMainPower + i * consumptionRate),
                consumption: consumptionRate,
                battery: liveStats.batteryKwh,
            });
        }
        return sampleData;
    }, [history, liveStats.mainPower, liveStats.batteryKwh]);

    // SCADA data from realtime
    const scadaData = realtimeData?.scada || null;
    const hasValidScada = scadaData && typeof scadaData.voltage === "number";
    const batteryStatusInfo = getBatteryStatusBadge(liveStats.batteryStatus);
    const consumptionPerDay = 6.6;
    const daysRemaining = liveStats.mainPower / consumptionPerDay;

    return (
        <AppLayout>
            <Head title="Dashboard" />
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Energy Dashboard</h1>
                        <p className="text-muted-foreground">
                            SCADA Energy Management System
                        </p>
                    </div>
                    <Badge
                        variant={isConnected ? "default" : "secondary"}
                        className="gap-1"
                    >
                        {isConnected ? (
                            <>
                                <Radio className="h-3 w-3 text-green-400 animate-pulse" />{" "}
                                Live
                            </>
                        ) : (
                            <>
                                <Activity className="h-3 w-3" /> Connecting...
                            </>
                        )}
                    </Badge>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-l-4 border-l-blue-500">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                Main Power
                            </CardTitle>
                            <Plug
                                className={`h-4 w-4 ${getMainPowerColor(
                                    liveStats.mainPower
                                )}`}
                            />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatKwh(liveStats.mainPower)} kWh
                            </div>
                            <Progress
                                value={(liveStats.mainPower / 66) * 100}
                                className="mt-2 h-2"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Token Listrik | ~{daysRemaining.toFixed(1)} hari
                                tersisa
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-yellow-500">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                Solar Panel
                            </CardTitle>
                            <Sun className="h-4 w-4 text-yellow-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatKwh(liveStats.solarOutput)} kWh
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Max: {liveStats.solarMaxCapacity} kWh/jam
                            </p>
                            <div className="flex items-center text-xs text-yellow-600 mt-2">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                Output → Battery (06:00-18:00)
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-green-500">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                Battery Storage
                            </CardTitle>
                            <Battery
                                className={`h-4 w-4 ${getBatteryColor(
                                    liveStats.batteryPercentage
                                )}`}
                            />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatKwh(liveStats.batteryKwh)} kWh
                            </div>
                            <Progress
                                value={liveStats.batteryPercentage}
                                className="mt-2 h-2"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                <span>
                                    {liveStats.batteryPercentage.toFixed(0)}%
                                </span>
                                <span>
                                    Max: {liveStats.batteryMaxCapacity} kWh
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-purple-500">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                Consumption
                            </CardTitle>
                            <Home className="h-4 w-4 text-purple-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-purple-600">
                                {formatKwh(0.046)} kWh
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Per 10 menit (dari Main Power)
                            </p>
                            <div className="text-xs text-purple-600 mt-2">
                                ~6.6 kWh/hari
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    {/* Energy Log Chart */}
                    {chartData.length > 0 ? (
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>
                                            📊 Energy Usage Log
                                        </CardTitle>
                                        <CardDescription>
                                            Main Power berkurang seiring
                                            consumption per menit
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            variant="outline"
                                            className="text-blue-600"
                                        >
                                            Main:{" "}
                                            {formatKwh(liveStats.mainPower)} kWh
                                        </Badge>
                                        <Badge variant="secondary">
                                            {history.length} logs
                                        </Badge>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer
                                    config={energyChartConfig}
                                    className="h-[350px] w-full"
                                >
                                    <AreaChart
                                        data={chartData}
                                        margin={{
                                            top: 10,
                                            right: 30,
                                            left: 10,
                                            bottom: 0,
                                        }}
                                    >
                                        <defs>
                                            <linearGradient
                                                id="fillMainPower"
                                                x1="0"
                                                y1="0"
                                                x2="0"
                                                y2="1"
                                            >
                                                <stop
                                                    offset="5%"
                                                    stopColor="hsl(221, 83%, 53%)"
                                                    stopOpacity={0.8}
                                                />
                                                <stop
                                                    offset="95%"
                                                    stopColor="hsl(221, 83%, 53%)"
                                                    stopOpacity={0.1}
                                                />
                                            </linearGradient>
                                            <linearGradient
                                                id="fillBattery"
                                                x1="0"
                                                y1="0"
                                                x2="0"
                                                y2="1"
                                            >
                                                <stop
                                                    offset="5%"
                                                    stopColor="hsl(142, 76%, 36%)"
                                                    stopOpacity={0.8}
                                                />
                                                <stop
                                                    offset="95%"
                                                    stopColor="hsl(142, 76%, 36%)"
                                                    stopOpacity={0.1}
                                                />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            className="stroke-muted"
                                        />
                                        <XAxis
                                            dataKey="time"
                                            tickLine={false}
                                            axisLine={false}
                                            tickMargin={8}
                                            fontSize={11}
                                        />
                                        <YAxis
                                            yAxisId="left"
                                            tickLine={false}
                                            axisLine={false}
                                            tickMargin={8}
                                            domain={[0, 100]}
                                            label={{
                                                value: "kWh",
                                                angle: -90,
                                                position: "insideLeft",
                                                fontSize: 12,
                                            }}
                                        />
                                        <ChartTooltip
                                            content={
                                                <ChartTooltipContent
                                                    labelFormatter={(label) =>
                                                        `Waktu: ${label}`
                                                    }
                                                />
                                            }
                                        />
                                        <Area
                                            yAxisId="left"
                                            type="monotone"
                                            dataKey="mainPower"
                                            stroke="hsl(221, 83%, 53%)"
                                            fill="url(#fillMainPower)"
                                            strokeWidth={3}
                                            isAnimationActive={false}
                                            name="Main Power"
                                        />
                                        <Area
                                            yAxisId="left"
                                            type="monotone"
                                            dataKey="battery"
                                            stroke="hsl(142, 76%, 36%)"
                                            fill="url(#fillBattery)"
                                            strokeWidth={2}
                                            isAnimationActive={false}
                                            name="Battery"
                                        />
                                        <ChartLegend
                                            content={<ChartLegendContent />}
                                        />
                                    </AreaChart>
                                </ChartContainer>
                                <div className="mt-4 grid grid-cols-3 gap-4 text-center text-sm">
                                    <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                                        <p className="text-blue-600 font-semibold">
                                            Main Power
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Berkurang {formatKwh(0.046)} kWh/10
                                            menit
                                        </p>
                                    </div>
                                    <div className="p-2 bg-green-50 dark:bg-green-950/30 rounded-lg">
                                        <p className="text-green-600 font-semibold">
                                            Battery
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            +Solar (06:00-18:00)
                                        </p>
                                    </div>
                                    <div className="p-2 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                                        <p className="text-purple-600 font-semibold">
                                            Consumption
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            ~6.6 kWh/hari
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <ChartSkeleton />
                    )}

                    {/* Public Transactions - Blockchain Ledger */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Activity className="h-5 w-5 text-primary" />
                                        Public Transaction Ledger
                                    </CardTitle>
                                    <CardDescription>
                                        Latest P2P energy trades on the network
                                    </CardDescription>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                    {publicTransactions.length} transactions
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {publicTransactions.length > 0 ? (
                                <div className="space-y-3">
                                    {publicTransactions.map((tx) => (
                                        <div
                                            key={tx.id}
                                            className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                                                        {tx.tx_hash.slice(
                                                            0,
                                                            10
                                                        )}
                                                        ...
                                                        {tx.tx_hash.slice(-8)}
                                                    </code>
                                                    <Badge
                                                        variant="secondary"
                                                        className="text-xs"
                                                    >
                                                        Confirmed
                                                    </Badge>
                                                </div>
                                                <span className="text-xs text-muted-foreground">
                                                    {tx.created_at}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm mb-2">
                                                <span className="font-medium text-orange-600 dark:text-orange-400">
                                                    {tx.seller_name}
                                                </span>
                                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium text-green-600 dark:text-green-400">
                                                    {tx.buyer_name}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-4">
                                                    <span>
                                                        <span className="text-muted-foreground">
                                                            Energy:
                                                        </span>{" "}
                                                        <span className="font-medium">
                                                            {formatKwh(
                                                                tx.energy_kwh
                                                            )}{" "}
                                                            kWh
                                                        </span>
                                                    </span>
                                                    <span>
                                                        <span className="text-muted-foreground">
                                                            Price:
                                                        </span>{" "}
                                                        <span className="font-medium">
                                                            {formatCurrency(
                                                                tx.price_per_kwh
                                                            )}
                                                            /kWh
                                                        </span>
                                                    </span>
                                                </div>
                                                <span className="font-semibold text-primary">
                                                    {formatCurrency(
                                                        tx.total_price
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                    <p>No public transactions yet</p>
                                    <p className="text-sm">
                                        Trades will appear here when completed
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
