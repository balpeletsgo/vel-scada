import AppLayout from "@/Layouts/AppLayout";
import { Head, router } from "@inertiajs/react";
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
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Battery, Zap, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    handleNumericKeyDown,
    createNumericOnChange,
    parseNumericValue,
} from "@/lib/numeric-input";
import { formatKwh } from "@/lib/formatters";
import { toast } from "sonner";

interface TransferProps {
    energyData: {
        mainPower: { current: number; unit: string };
        battery: {
            currentKwh: number;
            maxCapacity: number;
            percentage: number;
            status: string;
            unit: string;
        };
    };
}

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

// Zod schema factory with dynamic max value
const createTransferSchema = (maxBattery: number) =>
    z.object({
        amount: z
            .string()
            .min(1, "Jumlah transfer harus diisi")
            .refine((val) => !isNaN(parseFloat(val)), {
                message: "Masukkan angka yang valid",
            })
            .refine((val) => parseFloat(val) >= 1, {
                message: "Jumlah minimal adalah 1 kWh",
            })
            .refine((val) => parseFloat(val) <= maxBattery, {
                message: `Jumlah tidak boleh melebihi saldo battery (${formatKwh(
                    maxBattery
                )} kWh)`,
            }),
    });

type TransferFormValues = z.infer<ReturnType<typeof createTransferSchema>>;

export default function Transfer({ energyData }: TransferProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    // Create Zod schema with current battery value
    const transferSchema = createTransferSchema(energyData.battery.currentKwh);

    const form = useForm<TransferFormValues>({
        resolver: zodResolver(transferSchema),
        defaultValues: {
            amount: "",
        },
        mode: "onChange",
    });

    const watchAmount = form.watch("amount");
    const parsedAmount = parseNumericValue(watchAmount);

    const handleFormSubmit = (values: TransferFormValues) => {
        // Show confirmation dialog instead of submitting directly
        setShowConfirmDialog(true);
    };

    const confirmTransfer = () => {
        setShowConfirmDialog(false);
        setIsSubmitting(true);

        const transferAmount = form.getValues("amount");

        router.post(
            route("transfer.store"),
            { amount: transferAmount },
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    form.reset();
                    const flash = page.props.flash as any;
                    if (flash?.success) {
                        toast.success("Transfer Berhasil", {
                            description: flash.success,
                        });
                    }
                },
                onError: (errors) => {
                    const errorMessage = Object.values(errors)[0] as string;
                    toast.error("Transfer Gagal", {
                        description:
                            errorMessage || "Terjadi kesalahan saat transfer",
                    });
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            }
        );
    };

    const setQuickAmount = (amount: number) => {
        const finalAmount = Math.min(amount, energyData.battery.currentKwh);
        form.setValue("amount", finalAmount.toString(), {
            shouldValidate: true,
        });
    };

    const quickAmounts = [1, 5, 10, 25, 50];

    return (
        <AppLayout>
            <Head title="Transfer Energi" />

            <div className="p-6 space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold">Transfer Energi</h1>
                    <p className="text-muted-foreground">
                        Transfer energi dari Battery ke Main Power
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Energy Status Cards */}
                    <Card className="border-l-4 border-l-green-500">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                Battery Storage
                            </CardTitle>
                            <Battery
                                className={`h-5 w-5 ${getBatteryColor(
                                    energyData.battery.percentage
                                )}`}
                            />
                        </CardHeader>
                        <CardContent>
                            <div
                                className={`text-3xl font-bold ${getBatteryColor(
                                    energyData.battery.percentage
                                )}`}
                            >
                                {formatKwh(energyData.battery.currentKwh)} kWh
                            </div>
                            <Progress
                                value={energyData.battery.percentage}
                                className="mt-2 h-2"
                            />
                            <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                                <span>
                                    {energyData.battery.percentage.toFixed(1)}%
                                </span>
                                <span>
                                    Max:{" "}
                                    {formatKwh(energyData.battery.maxCapacity)}{" "}
                                    kWh
                                </span>
                            </div>
                            <Badge variant="outline" className="mt-2">
                                {energyData.battery.status === "charging"
                                    ? "⚡ Charging"
                                    : energyData.battery.status ===
                                      "discharging"
                                    ? "🔋 Discharging"
                                    : "💤 Idle"}
                            </Badge>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-blue-500">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                Main Power
                            </CardTitle>
                            <Zap
                                className={`h-5 w-5 ${getMainPowerColor(
                                    energyData.mainPower.current
                                )}`}
                            />
                        </CardHeader>
                        <CardContent>
                            <div
                                className={`text-3xl font-bold ${getMainPowerColor(
                                    energyData.mainPower.current
                                )}`}
                            >
                                {formatKwh(energyData.mainPower.current)} kWh
                            </div>
                            <Progress
                                value={Math.min(
                                    (energyData.mainPower.current / 100) * 100,
                                    100
                                )}
                                className="mt-2 h-2"
                            />
                            <p className="text-sm text-muted-foreground mt-2">
                                Token listrik tersedia
                            </p>
                            <Badge variant="outline" className="mt-2">
                                🔌 Active
                            </Badge>
                        </CardContent>
                    </Card>
                </div>

                {/* Transfer Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Form Transfer</CardTitle>
                        <CardDescription>
                            Masukkan jumlah energi yang ingin ditransfer dari
                            Battery ke Main Power
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form
                                onSubmit={form.handleSubmit(handleFormSubmit)}
                                className="space-y-4"
                            >
                                <FormField
                                    control={form.control}
                                    name="amount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Jumlah (kWh)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="text"
                                                    inputMode="decimal"
                                                    placeholder="Masukkan jumlah kWh"
                                                    className="text-lg"
                                                    disabled={isSubmitting}
                                                    onKeyDown={(e) =>
                                                        handleNumericKeyDown(
                                                            e,
                                                            true
                                                        )
                                                    }
                                                    {...field}
                                                    onChange={createNumericOnChange(
                                                        field.onChange,
                                                        true
                                                    )}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Minimal: 1 kWh | Maksimal:{" "}
                                                {formatKwh(
                                                    energyData.battery
                                                        .currentKwh
                                                )}{" "}
                                                kWh (saldo battery)
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Quick Amount Buttons */}
                                <div className="space-y-2">
                                    <FormLabel>Pilih Cepat</FormLabel>
                                    <div className="flex flex-wrap gap-2">
                                        {quickAmounts.map((amount) => (
                                            <Button
                                                key={amount}
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    setQuickAmount(amount)
                                                }
                                                disabled={
                                                    isSubmitting ||
                                                    amount >
                                                        energyData.battery
                                                            .currentKwh
                                                }
                                                className={
                                                    amount >
                                                    energyData.battery
                                                        .currentKwh
                                                        ? "opacity-50"
                                                        : ""
                                                }
                                            >
                                                {amount} kWh
                                            </Button>
                                        ))}
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                setQuickAmount(
                                                    energyData.battery
                                                        .currentKwh
                                                )
                                            }
                                            disabled={
                                                isSubmitting ||
                                                energyData.battery.currentKwh <=
                                                    0
                                            }
                                        >
                                            Max
                                        </Button>
                                    </div>
                                </div>

                                {/* Transfer Preview */}
                                {parsedAmount > 0 &&
                                    parsedAmount <=
                                        energyData.battery.currentKwh && (
                                        <div className="p-4 bg-muted rounded-lg space-y-2">
                                            <h4 className="font-medium">
                                                Preview Transfer
                                            </h4>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <p className="text-muted-foreground">
                                                        Battery setelah
                                                        transfer:
                                                    </p>
                                                    <p className="font-medium">
                                                        {formatKwh(
                                                            Math.max(
                                                                energyData
                                                                    .battery
                                                                    .currentKwh -
                                                                    parsedAmount,
                                                                0
                                                            )
                                                        )}{" "}
                                                        kWh
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">
                                                        Main Power setelah
                                                        transfer:
                                                    </p>
                                                    <p className="font-medium">
                                                        {formatKwh(
                                                            energyData.mainPower
                                                                .current +
                                                                parsedAmount
                                                        )}{" "}
                                                        kWh
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                <Button
                                    type="submit"
                                    className="w-full"
                                    size="lg"
                                    disabled={
                                        isSubmitting || !form.formState.isValid
                                    }
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Memproses Transfer...
                                        </>
                                    ) : (
                                        <>
                                            <ArrowRight className="mr-2 h-4 w-4" />
                                            Transfer ke Main Power
                                        </>
                                    )}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>

                {/* Info Card */}
                <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
                    <CardHeader>
                        <CardTitle className="text-blue-700 dark:text-blue-300 flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            Informasi Transfer
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-blue-700 dark:text-blue-300">
                        <ul className="list-disc list-inside space-y-1 text-sm">
                            <li>
                                Transfer hanya dapat dilakukan dari Battery ke
                                Main Power (satu arah)
                            </li>
                            <li>
                                Energi yang sudah ditransfer tidak dapat
                                dikembalikan ke Battery
                            </li>
                            <li>
                                Main Power akan berkurang secara otomatis sesuai
                                konsumsi listrik (~0.0046 kWh/menit)
                            </li>
                            <li>
                                Battery akan terisi otomatis dari Solar Panel
                                pada jam 06:00-18:00
                            </li>
                            <li>Jumlah minimal transfer adalah 1 kWh</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>

            {/* Confirmation Dialog */}
            <AlertDialog
                open={showConfirmDialog}
                onOpenChange={setShowConfirmDialog}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Konfirmasi Transfer</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-3">
                                <p>
                                    Apakah Anda yakin ingin melakukan transfer
                                    energi?
                                </p>
                                <div className="p-3 bg-muted rounded-lg space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span>Jumlah Transfer:</span>
                                        <span className="font-semibold">
                                            {parsedAmount} kWh
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Battery Sekarang:</span>
                                        <span>
                                            {formatKwh(
                                                energyData.battery.currentKwh
                                            )}{" "}
                                            kWh
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Battery Setelah:</span>
                                        <span className="text-orange-600 font-medium">
                                            {formatKwh(
                                                Math.max(
                                                    energyData.battery
                                                        .currentKwh -
                                                        parsedAmount,
                                                    0
                                                )
                                            )}{" "}
                                            kWh
                                        </span>
                                    </div>
                                    <hr className="my-2" />
                                    <div className="flex justify-between">
                                        <span>Main Power Sekarang:</span>
                                        <span>
                                            {formatKwh(
                                                energyData.mainPower.current
                                            )}{" "}
                                            kWh
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Main Power Setelah:</span>
                                        <span className="text-green-600 font-medium">
                                            {formatKwh(
                                                energyData.mainPower.current +
                                                    parsedAmount
                                            )}{" "}
                                            kWh
                                        </span>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Transfer ini tidak dapat dibatalkan setelah
                                    dikonfirmasi.
                                </p>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmTransfer}>
                            Ya, Transfer Sekarang
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
