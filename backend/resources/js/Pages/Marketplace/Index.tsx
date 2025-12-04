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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    ShoppingCart,
    Store,
    Battery,
    Wallet,
    User,
    Loader2,
    Plus,
    Minus,
    AlertCircle,
    Package,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
    handleNumericKeyDown,
    createNumericOnChange,
    parseNumericValue,
} from "@/lib/numeric-input";
import { formatCurrency, formatKwh } from "@/lib/formatters";
import { useSystemPrice } from "@/hooks/useSystemPrice";

interface Seller {
    id: number;
    user_id: number;
    seller_name: string;
    price_per_kwh: number;
    stock_kwh: number;
    is_selling: boolean;
}

interface MyEnergyPrice {
    id: number;
    price_per_kwh: number;
    stock_kwh: number;
    is_selling: boolean;
}

interface MyBattery {
    current_kwh: number;
    max_capacity: number;
}

interface SystemPrice {
    base_price: number;
    multiplier: number;
    final_price: number;
    supply_kwh?: number;
    demand_kwh?: number;
    market_condition: "high_supply" | "balanced" | "high_demand";
    effective_from: string;
}

interface MarketplaceProps {
    sellers: Seller[];
    myEnergyPrice: MyEnergyPrice | null;
    myBattery: MyBattery | null;
    walletBalance: number;
    systemPrice: SystemPrice;
}

// Schemas
const createStockSchema = (maxAmount: number) =>
    z.object({
        amount: z
            .string()
            .min(1, "Jumlah harus diisi")
            .refine((val) => parseFloat(val) >= 1, {
                message: "Minimal 1 kWh",
            })
            .refine((val) => parseFloat(val) <= maxAmount, {
                message: `Maksimal ${formatKwh(maxAmount)} kWh`,
            }),
    });

const createBuySchema = (
    maxKwh: number,
    walletBalance: number,
    pricePerKwh: number
) =>
    z.object({
        amount: z
            .string()
            .min(1, "Jumlah harus diisi")
            .refine((val) => parseFloat(val) >= 1, {
                message: "Minimal pembelian 1 kWh",
            })
            .refine((val) => parseFloat(val) <= maxKwh, {
                message: `Maksimal pembelian ${formatKwh(maxKwh)} kWh`,
            })
            .refine((val) => parseFloat(val) * pricePerKwh <= walletBalance, {
                message: "Saldo tidak cukup",
            }),
    });

type StockFormValues = z.infer<ReturnType<typeof createStockSchema>>;
type BuyFormValues = z.infer<ReturnType<typeof createBuySchema>>;

const getMarketConditionLabel = (condition: string) => {
    switch (condition) {
        case "high_supply":
            return {
                label: "Supply Tinggi",
                color: "text-green-600",
                badge: "default" as const,
            };
        case "high_demand":
            return {
                label: "Demand Tinggi",
                color: "text-red-600",
                badge: "destructive" as const,
            };
        default:
            return {
                label: "Seimbang",
                color: "text-blue-600",
                badge: "secondary" as const,
            };
    }
};

export default function Marketplace({
    sellers,
    myEnergyPrice,
    myBattery,
    walletBalance,
    systemPrice: initialSystemPrice,
}: MarketplaceProps) {
    // Real-time system price updates
    const { systemPrice: livePrice } = useSystemPrice({
        initialPrice: initialSystemPrice,
    });
    const systemPrice = livePrice || initialSystemPrice;

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [addStockDialogOpen, setAddStockDialogOpen] = useState(false);
    const [withdrawStockDialogOpen, setWithdrawStockDialogOpen] =
        useState(false);
    const [buyDialogOpen, setBuyDialogOpen] = useState(false);
    const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);

    // Show toast when price updates
    useEffect(() => {
        if (
            livePrice &&
            livePrice.final_price !== initialSystemPrice.final_price
        ) {
            toast.info(
                `Harga energi diperbarui: ${formatCurrency(
                    livePrice.final_price
                )}/kWh`
            );
        }
    }, [livePrice?.final_price]);

    // Add stock form
    const maxAddStock = myBattery?.current_kwh || 0;
    const addStockForm = useForm<StockFormValues>({
        resolver: zodResolver(createStockSchema(maxAddStock)),
        defaultValues: { amount: "" },
        mode: "onChange",
    });

    // Withdraw stock form
    const maxWithdrawStock = myEnergyPrice?.stock_kwh || 0;
    const withdrawStockForm = useForm<StockFormValues>({
        resolver: zodResolver(createStockSchema(maxWithdrawStock)),
        defaultValues: { amount: "" },
        mode: "onChange",
    });

    // Buy form - always use system price
    const buySchema = selectedSeller
        ? createBuySchema(
              selectedSeller.stock_kwh,
              walletBalance,
              systemPrice.final_price
          )
        : createBuySchema(1, walletBalance, systemPrice.final_price);
    const buyForm = useForm<BuyFormValues>({
        resolver: zodResolver(buySchema),
        defaultValues: { amount: "" },
        mode: "onChange",
    });

    const watchBuyAmount = buyForm.watch("amount");
    const parsedBuyAmount = parseNumericValue(watchBuyAmount);
    const totalPrice = selectedSeller
        ? parsedBuyAmount * systemPrice.final_price
        : 0;

    // Handlers
    const handleAddStock = (values: StockFormValues) => {
        setIsSubmitting(true);
        router.post(route("marketplace.add-stock"), values, {
            preserveScroll: true,
            onSuccess: (page) => {
                const flash = page.props.flash as any;
                if (flash?.success) toast.success(flash.success);
                setAddStockDialogOpen(false);
                addStockForm.reset();
            },
            onError: (errors) => {
                toast.error(Object.values(errors)[0] as string);
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    const handleWithdrawStock = (values: StockFormValues) => {
        setIsSubmitting(true);
        router.post(route("marketplace.withdraw-stock"), values, {
            preserveScroll: true,
            onSuccess: (page) => {
                const flash = page.props.flash as any;
                if (flash?.success) toast.success(flash.success);
                setWithdrawStockDialogOpen(false);
                withdrawStockForm.reset();
            },
            onError: (errors) => {
                toast.error(Object.values(errors)[0] as string);
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    const handleToggleSelling = () => {
        setIsSubmitting(true);
        router.post(
            route("marketplace.toggle-selling"),
            {},
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    const flash = page.props.flash as any;
                    if (flash?.success) toast.success(flash.success);
                },
                onError: (errors) => {
                    toast.error(Object.values(errors)[0] as string);
                },
                onFinish: () => setIsSubmitting(false),
            }
        );
    };

    const openBuyDialog = (seller: Seller) => {
        setSelectedSeller(seller);
        buyForm.reset({ amount: "1" });
        setBuyDialogOpen(true);
    };

    const handleBuy = (values: BuyFormValues) => {
        if (!selectedSeller) return;
        setIsSubmitting(true);
        router.post(
            route("marketplace.buy"),
            {
                seller_id: selectedSeller.user_id,
                amount: values.amount,
            },
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    const flash = page.props.flash as any;
                    if (flash?.success) toast.success(flash.success);
                    setBuyDialogOpen(false);
                    buyForm.reset();
                },
                onError: (errors) => {
                    toast.error(Object.values(errors)[0] as string);
                },
                onFinish: () => setIsSubmitting(false),
            }
        );
    };

    return (
        <AppLayout>
            <Head title="Marketplace" />

            <div className="p-6 space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold">Marketplace Energi</h1>
                    <p className="text-muted-foreground">
                        Jual beli energi P2P dengan pengguna lain
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                Saldo Wallet
                            </CardTitle>
                            <Wallet className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {formatCurrency(walletBalance)}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                Harga Sistem
                            </CardTitle>
                            <Badge
                                variant={
                                    getMarketConditionLabel(
                                        systemPrice.market_condition
                                    ).badge
                                }
                            >
                                {
                                    getMarketConditionLabel(
                                        systemPrice.market_condition
                                    ).label
                                }
                            </Badge>
                        </CardHeader>
                        <CardContent>
                            <div
                                className={`text-2xl font-bold ${
                                    getMarketConditionLabel(
                                        systemPrice.market_condition
                                    ).color
                                }`}
                            >
                                {formatCurrency(systemPrice.final_price)}/kWh
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Multiplier: {systemPrice.multiplier}x
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                Stok Jual
                            </CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600">
                                {formatKwh(myEnergyPrice?.stock_kwh || 0)} kWh
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {myEnergyPrice?.is_selling ? (
                                    <Badge
                                        variant="default"
                                        className="text-xs"
                                    >
                                        Aktif Jual
                                    </Badge>
                                ) : (
                                    <Badge
                                        variant="secondary"
                                        className="text-xs"
                                    >
                                        Tidak Jual
                                    </Badge>
                                )}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                Battery
                            </CardTitle>
                            <Battery className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {myBattery
                                    ? formatKwh(myBattery.current_kwh)
                                    : 0}{" "}
                                kWh
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Kapasitas: {myBattery?.max_capacity || 0} kWh
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* System Price Info */}
                <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Harga Energi Saat Ini (Berdasarkan PLN
                                    R-1/TR 1.300 VA)
                                </p>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-3xl font-bold text-primary">
                                        {formatCurrency(
                                            systemPrice.final_price
                                        )}
                                        /kWh
                                    </span>
                                    <Badge
                                        variant={
                                            getMarketConditionLabel(
                                                systemPrice.market_condition
                                            ).badge
                                        }
                                    >
                                        {
                                            getMarketConditionLabel(
                                                systemPrice.market_condition
                                            ).label
                                        }
                                    </Badge>
                                </div>
                            </div>
                            <div className="text-right text-sm">
                                <p className="text-muted-foreground">
                                    Base PLN:{" "}
                                    {formatCurrency(systemPrice.base_price)}
                                </p>
                                <p className="text-muted-foreground">
                                    Multiplier: {systemPrice.multiplier}x
                                </p>
                                <p className="text-muted-foreground text-xs mt-1">
                                    Update: {systemPrice.effective_from}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* My Selling Settings */}
                    <Card className="lg:col-span-1">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Pengaturan Jual
                            </CardTitle>
                            <CardDescription>
                                Kelola stok dan harga jual energi Anda
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Stock Management */}
                            <div className="p-4 border rounded-lg space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">
                                        Stok Jual Saya
                                    </span>
                                    <span className="text-lg font-bold text-orange-600">
                                        {formatKwh(
                                            myEnergyPrice?.stock_kwh || 0
                                        )}{" "}
                                        kWh
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => {
                                            addStockForm.reset({ amount: "" });
                                            setAddStockDialogOpen(true);
                                        }}
                                        disabled={
                                            !myBattery ||
                                            myBattery.current_kwh < 1
                                        }
                                    >
                                        <Plus className="mr-1 h-4 w-4" />
                                        Tambah
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => {
                                            withdrawStockForm.reset({
                                                amount: "",
                                            });
                                            setWithdrawStockDialogOpen(true);
                                        }}
                                        disabled={
                                            !myEnergyPrice ||
                                            myEnergyPrice.stock_kwh < 1
                                        }
                                    >
                                        <Minus className="mr-1 h-4 w-4" />
                                        Tarik
                                    </Button>
                                </div>
                            </div>

                            {/* Selling Toggle */}
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                    <p className="font-medium">Status Jual</p>
                                    <p className="text-sm text-muted-foreground">
                                        {myEnergyPrice?.is_selling
                                            ? "Aktif di marketplace"
                                            : "Tidak aktif"}
                                    </p>
                                </div>
                                <Switch
                                    checked={myEnergyPrice?.is_selling || false}
                                    onCheckedChange={handleToggleSelling}
                                    disabled={
                                        isSubmitting ||
                                        !myEnergyPrice ||
                                        myEnergyPrice.stock_kwh < 1
                                    }
                                />
                            </div>

                            {/* System Price Info */}
                            <div className="p-4 border rounded-lg bg-muted/50">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">
                                        Harga Jual
                                    </span>
                                    <Badge variant="outline">Otomatis</Badge>
                                </div>
                                <p className="text-2xl font-bold text-primary">
                                    {formatCurrency(systemPrice.final_price)}
                                    /kWh
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Harga ditentukan sistem berdasarkan
                                    supply/demand
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Sellers List */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Store className="h-5 w-5" />
                                Penjual Tersedia
                            </CardTitle>
                            <CardDescription>
                                Beli energi dari pengguna lain
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {sellers.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Store className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>Belum ada penjual yang tersedia</p>
                                    <p className="text-sm">
                                        Jadilah yang pertama menjual energi!
                                    </p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Penjual</TableHead>
                                            <TableHead>Harga/kWh</TableHead>
                                            <TableHead>Stok</TableHead>
                                            <TableHead className="text-right">
                                                Aksi
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sellers.map((seller) => (
                                            <TableRow key={seller.id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4" />
                                                        {seller.seller_name}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary">
                                                        {formatCurrency(
                                                            seller.price_per_kwh
                                                        )}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {formatKwh(
                                                        seller.stock_kwh
                                                    )}{" "}
                                                    kWh
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        size="sm"
                                                        onClick={() =>
                                                            openBuyDialog(
                                                                seller
                                                            )
                                                        }
                                                    >
                                                        <ShoppingCart className="mr-2 h-4 w-4" />
                                                        Beli
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Info Card */}
                <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
                    <CardHeader>
                        <CardTitle className="text-blue-700 dark:text-blue-300 flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            Informasi Marketplace
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-blue-700 dark:text-blue-300">
                        <ul className="list-disc list-inside space-y-1 text-sm">
                            <li>
                                Tambah stok jual dari Battery untuk menjual di
                                marketplace
                            </li>
                            <li>
                                Stok jual terpisah dari Battery - energi
                                dipindahkan saat ditambahkan
                            </li>
                            <li>
                                Tarik stok jual untuk mengembalikan energi ke
                                Battery
                            </li>
                            <li>
                                Pembeli menerima energi langsung ke Battery
                                mereka
                            </li>
                            <li>Minimal transaksi adalah 1 kWh</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>

            {/* Add Stock Dialog */}
            <Dialog
                open={addStockDialogOpen}
                onOpenChange={setAddStockDialogOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tambah Stok Jual</DialogTitle>
                        <DialogDescription>
                            Pindahkan energi dari Battery ke Stok Jual
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...addStockForm}>
                        <form
                            onSubmit={addStockForm.handleSubmit(handleAddStock)}
                            className="space-y-4"
                        >
                            <div className="p-3 bg-muted rounded-lg text-sm">
                                <div className="flex justify-between">
                                    <span>Battery tersedia:</span>
                                    <span className="font-semibold">
                                        {formatKwh(myBattery?.current_kwh || 0)}{" "}
                                        kWh
                                    </span>
                                </div>
                            </div>
                            <FormField
                                control={addStockForm.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Jumlah (kWh)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="text"
                                                inputMode="decimal"
                                                placeholder="Masukkan jumlah"
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
                                            Min: 1 kWh | Max:{" "}
                                            {formatKwh(maxAddStock)} kWh
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setAddStockDialogOpen(false)}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={
                                        isSubmitting ||
                                        !addStockForm.formState.isValid
                                    }
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Plus className="mr-2 h-4 w-4" />
                                    )}
                                    Tambah Stok
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Withdraw Stock Dialog */}
            <Dialog
                open={withdrawStockDialogOpen}
                onOpenChange={setWithdrawStockDialogOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tarik Stok Jual</DialogTitle>
                        <DialogDescription>
                            Kembalikan energi dari Stok Jual ke Battery
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...withdrawStockForm}>
                        <form
                            onSubmit={withdrawStockForm.handleSubmit(
                                handleWithdrawStock
                            )}
                            className="space-y-4"
                        >
                            <div className="p-3 bg-muted rounded-lg text-sm">
                                <div className="flex justify-between">
                                    <span>Stok jual tersedia:</span>
                                    <span className="font-semibold">
                                        {formatKwh(
                                            myEnergyPrice?.stock_kwh || 0
                                        )}{" "}
                                        kWh
                                    </span>
                                </div>
                            </div>
                            <FormField
                                control={withdrawStockForm.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Jumlah (kWh)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="text"
                                                inputMode="decimal"
                                                placeholder="Masukkan jumlah"
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
                                            Min: 1 kWh | Max:{" "}
                                            {formatKwh(maxWithdrawStock)} kWh
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                        setWithdrawStockDialogOpen(false)
                                    }
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={
                                        isSubmitting ||
                                        !withdrawStockForm.formState.isValid
                                    }
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Minus className="mr-2 h-4 w-4" />
                                    )}
                                    Tarik Stok
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Buy Dialog */}
            <Dialog open={buyDialogOpen} onOpenChange={setBuyDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Beli Energi</DialogTitle>
                        <DialogDescription>
                            Beli energi dari {selectedSeller?.seller_name}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedSeller && (
                        <Form {...buyForm}>
                            <form
                                onSubmit={buyForm.handleSubmit(handleBuy)}
                                className="space-y-4"
                            >
                                <div className="p-3 bg-muted rounded-lg space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span>Harga per kWh:</span>
                                        <span className="font-semibold">
                                            {formatCurrency(
                                                systemPrice.final_price
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Stok tersedia:</span>
                                        <span>
                                            {formatKwh(
                                                selectedSeller.stock_kwh
                                            )}{" "}
                                            kWh
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Saldo Anda:</span>
                                        <span className="text-green-600">
                                            {formatCurrency(walletBalance)}
                                        </span>
                                    </div>
                                </div>
                                <FormField
                                    control={buyForm.control}
                                    name="amount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Jumlah (kWh)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="text"
                                                    inputMode="decimal"
                                                    placeholder="Masukkan jumlah"
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
                                                Min: 1 kWh | Max:{" "}
                                                {formatKwh(
                                                    selectedSeller.stock_kwh
                                                )}{" "}
                                                kWh
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                {parsedBuyAmount > 0 && (
                                    <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                                        <div className="flex justify-between text-sm">
                                            <span>Total Pembayaran:</span>
                                            <span className="font-bold text-lg">
                                                {formatCurrency(totalPrice)}
                                            </span>
                                        </div>
                                        {totalPrice > walletBalance && (
                                            <p className="text-red-500 text-xs mt-1">
                                                Saldo tidak cukup!
                                            </p>
                                        )}
                                    </div>
                                )}
                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setBuyDialogOpen(false)}
                                    >
                                        Batal
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={
                                            isSubmitting ||
                                            !buyForm.formState.isValid ||
                                            totalPrice > walletBalance
                                        }
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                                                Memproses...
                                            </>
                                        ) : (
                                            <>
                                                <ShoppingCart className="mr-2 h-4 w-4" />{" "}
                                                Beli Sekarang
                                            </>
                                        )}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
