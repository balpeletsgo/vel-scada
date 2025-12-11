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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Activity,
    Battery,
    Sun,
    Zap,
    Gauge,
    Radio,
    Clock,
    TrendingUp,
    TrendingDown,
    Minus,
    User,
} from "lucide-react";
import { useEnergyData } from "@/hooks/useEnergyData";
import { useEffect, useState, useRef } from "react";
import { formatKwh } from "@/lib/formatters";

interface ActivityLog {
    id: number;
    user_id: number;
    user_name: string;
    type:
        | "solar"
        | "battery"
        | "main_power"
        | "transaction"
        | "scada"
        | "system";
    action: string;
    description: string;
    metadata: any;
    logged_at: string;
    time_ago: string;
}

interface RealtimeEvent {
    id: number;
    timestamp: string;
    type: "solar" | "consumption" | "battery" | "scada" | "system";
    title: string;
    description: string;
    value?: number;
    unit?: string;
    trend?: "up" | "down" | "stable";
    user_name?: string;
}

interface RealtimeMonitorProps {
    user: {
        id: number;
        name: string;
    };
    activityLogs: ActivityLog[];
}

export default function RealtimeMonitor({
    user,
    activityLogs,
}: RealtimeMonitorProps) {
    const { auth } = usePage().props as any;
    const userId = auth?.user?.id || user?.id || 1;

    const { isConnected } = useEnergyData(userId);

    // Initialize events from database logs only
    const [events, setEvents] = useState<RealtimeEvent[]>(() => {
        return activityLogs.map((log) => ({
            id: log.id,
            timestamp: new Date(log.logged_at).toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
            }),
            type: log.type as any,
            title: log.action,
            description: log.description,
            user_name: log.user_name,
            trend: "stable",
        }));
    });

    const [lastUpdate, setLastUpdate] = useState<string | null>(
        activityLogs.length > 0
            ? new Date(activityLogs[0].logged_at).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
              })
            : null
    );

    // Auto-refresh logs from database every 10 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({ only: ["activityLogs"] });
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    // Update events when activityLogs prop changes (from database)
    useEffect(() => {
        const dbEvents = activityLogs.map((log) => ({
            id: log.id,
            timestamp: new Date(log.logged_at).toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
            }),
            type: log.type as any,
            title: log.action,
            description: log.description,
            user_name: log.user_name,
            trend: "stable" as const,
        }));
        setEvents(dbEvents);

        // Update last update time
        if (activityLogs.length > 0) {
            setLastUpdate(
                new Date(activityLogs[0].logged_at).toLocaleTimeString(
                    "id-ID",
                    {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                    }
                )
            );
        }
    }, [activityLogs]);

    const getEventIcon = (type: RealtimeEvent["type"]) => {
        switch (type) {
            case "solar":
                return <Sun className="h-4 w-4 text-yellow-500" />;
            case "battery":
                return <Battery className="h-4 w-4 text-green-500" />;
            case "consumption":
                return <Zap className="h-4 w-4 text-blue-500" />;
            case "scada":
                return <Gauge className="h-4 w-4 text-purple-500" />;
            default:
                return <Activity className="h-4 w-4 text-gray-500" />;
        }
    };

    const getTrendIcon = (trend?: RealtimeEvent["trend"]) => {
        switch (trend) {
            case "up":
                return <TrendingUp className="h-3 w-3 text-green-500" />;
            case "down":
                return <TrendingDown className="h-3 w-3 text-red-500" />;
            default:
                return <Minus className="h-3 w-3 text-gray-400" />;
        }
    };

    const getEventBgColor = (type: RealtimeEvent["type"]) => {
        switch (type) {
            case "solar":
                return "bg-yellow-50 dark:bg-yellow-950/20 border-l-yellow-500";
            case "battery":
                return "bg-green-50 dark:bg-green-950/20 border-l-green-500";
            case "consumption":
                return "bg-blue-50 dark:bg-blue-950/20 border-l-blue-500";
            case "scada":
                return "bg-purple-50 dark:bg-purple-950/20 border-l-purple-500";
            default:
                return "bg-gray-50 dark:bg-gray-950/20 border-l-gray-500";
        }
    };

    return (
        <AppLayout>
            <Head title="Realtime Monitor" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Realtime Monitor
                        </h1>
                        <p className="text-muted-foreground">
                            Live feed aktivitas solar panel
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Badge
                            variant={isConnected ? "default" : "destructive"}
                            className="flex items-center gap-1"
                        >
                            <Radio
                                className={`h-3 w-3 ${
                                    isConnected ? "animate-pulse" : ""
                                }`}
                            />
                            {isConnected ? "Connected" : "Disconnected"}
                        </Badge>
                        {lastUpdate && (
                            <Badge
                                variant="outline"
                                className="flex items-center gap-1"
                            >
                                <Clock className="h-3 w-3" />
                                Last: {lastUpdate}
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Live Event Feed - Full Width */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="h-5 w-5" />
                                    Live Event Feed
                                </CardTitle>
                                <CardDescription>
                                    Update realtime setiap 1 menit dari solar
                                    broadcaster
                                </CardDescription>
                            </div>
                            <Badge variant="secondary">
                                {events.length} events
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[calc(100vh-280px)]">
                            <div className="space-y-3 pr-4">
                                {events.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>Menunggu aktivitas solar panel...</p>
                                        <p className="text-sm mt-2">
                                            Log akan muncul setiap 1 menit
                                        </p>
                                    </div>
                                ) : (
                                    events.map((event) => (
                                        <div
                                            key={event.id}
                                            className={`border-l-4 rounded-lg p-4 transition-all ${getEventBgColor(
                                                event.type
                                            )}`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-3 flex-1">
                                                    {getEventIcon(event.type)}
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium">
                                                                {event.title}
                                                            </span>
                                                            {event.trend && (
                                                                <span>
                                                                    {getTrendIcon(
                                                                        event.trend
                                                                    )}
                                                                </span>
                                                            )}
                                                            {event.user_name && (
                                                                <Badge
                                                                    variant="outline"
                                                                    className="text-xs"
                                                                >
                                                                    <User className="h-3 w-3 mr-1" />
                                                                    {
                                                                        event.user_name
                                                                    }
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-muted-foreground mt-1">
                                                            {event.description}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                                                    {event.timestamp}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
