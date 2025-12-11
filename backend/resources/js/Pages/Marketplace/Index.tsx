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
    Plus,
    X,
    AlertCircle,
    Package,
    TrendingUp,
    TrendingDown,
} from "lucide-react";
import { useState, FormEvent, useEffect } from "react";
import { toast } from "sonner";
import { formatCurrency, formatKwh } from "@/lib/formatters";

interface Listing {
    id: number;
    seller_id?: number;
    seller_name?: string;
    energy_kwh: number;
    price_per_kwh: number;
    total_price: number;
    created_at: string;
}

interface MyBattery {
    current_kwh: number;
    max_capacity: number;
}

interface SystemPrice {
    base_price: number;
    multiplier: number;
    final_price: number;
    market_condition: "high_supply" | "balanced" | "high_demand";
    effective_from: string;
}

interface MarketplaceProps {
    listings: Listing[];
    myListings: Listing[];
    myBattery: MyBattery | null;
    walletBalance: number;
    systemPrice: SystemPrice;
}

export default function Marketplace({
    listings,
    myListings,
    myBattery,
    walletBalance,
    systemPrice,
}: MarketplaceProps) {
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [energyKwh, setEnergyKwh] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Auto-refresh data every 10 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({
                only: [
                    "listings",
                    "myListings",
                    "myBattery",
                    "walletBalance",
                    "systemPrice",
                ],
            });
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    const handleCreateListing = (e: FormEvent) => {
        e.preventDefault();
        const energy = parseFloat(energyKwh);

        if (isNaN(energy) || energy < 1) {
            toast.error("Minimal 1 kWh");
            return;
        }

        if (energy > 50) {
            toast.error("Maksimal 50 kWh per listing");
            return;
        }

        if (myBattery && energy > myBattery.current_kwh) {
            toast.error("Battery tidak cukup");
            return;
        }

        setIsSubmitting(true);
        router.post(
            route("marketplace.create-listing"),
            { energy_kwh: energy },
            {
                onSuccess: () => {
                    setCreateDialogOpen(false);
                    setEnergyKwh("");
                    toast.success("Listing berhasil dibuat");
                },
                onError: (errors) => {
                    toast.error(errors.energy_kwh || "Gagal membuat listing");
                },
                onFinish: () => setIsSubmitting(false),
            }
        );
    };

    const handleCancelListing = (listingId: number) => {
        if (!confirm("Batalkan listing ini?")) return;

        setIsSubmitting(true);
        router.post(
            route("marketplace.cancel-listing"),
            { listing_id: listingId },
            {
                onSuccess: () => {
                    toast.success("Listing dibatalkan");
                },
                onError: (errors) => {
                    toast.error(errors.listing || "Gagal membatalkan listing");
                },
                onFinish: () => setIsSubmitting(false),
            }
        );
    };

    const handleBuyListing = (listingId: number, totalPrice: number) => {
        if (walletBalance < totalPrice) {
            toast.error("Saldo tidak cukup");
            return;
        }

        if (!confirm("Beli listing ini?")) return;

        setIsSubmitting(true);
        router.post(
            route("marketplace.buy"),
            { listing_id: listingId },
            {
                onSuccess: () => {
                    toast.success("Pembelian berhasil");
                },
                onError: (errors) => {
                    toast.error(
                        errors.listing ||
                            errors.wallet ||
                            errors.battery ||
                            "Gagal membeli"
                    );
                },
                onFinish: () => setIsSubmitting(false),
            }
        );
    };

    const totalPrice = energyKwh
        ? parseFloat(energyKwh) * systemPrice.final_price
        : 0;

    const getMarketConditionBadge = () => {
        switch (systemPrice.market_condition) {
            case "high_supply":
                return (
                    <Badge
                        variant="default"
                        className="flex items-center gap-1"
                    >
                        <TrendingDown className="h-3 w-3" /> Supply Tinggi
                    </Badge>
                );
            case "high_demand":
                return (
                    <Badge
                        variant="destructive"
                        className="flex items-center gap-1"
                    >
                        <TrendingUp className="h-3 w-3" /> Demand Tinggi
                    </Badge>
                );
            default:
                return <Badge variant="secondary">Seimbang</Badge>;
        }
    };

    return (
        <AppLayout>
            <Head title="Marketplace" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Energy Marketplace
                        </h1>
                        <p className="text-muted-foreground">
                            Jual beli energi P2P dengan harga dinamis
                        </p>
                    </div>
                    <Button onClick={() => setCreateDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Buat Listing
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Harga Energi
                            </CardTitle>
                            {getMarketConditionBadge()}
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrency(systemPrice.final_price)}/kWh
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Berlaku: {systemPrice.effective_from}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Battery Tersedia
                            </CardTitle>
                            <Battery className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatKwh(myBattery?.current_kwh || 0)} kWh
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Max: {formatKwh(myBattery?.max_capacity || 0)}{" "}
                                kWh
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Saldo Wallet
                            </CardTitle>
                            <Wallet className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrency(walletBalance)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Tersedia untuk transaksi
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* My Listings */}
                {myListings.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Listing Saya
                            </CardTitle>
                            <CardDescription>
                                {myListings.length} listing aktif
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Energi</TableHead>
                                        <TableHead>Harga/kWh</TableHead>
                                        <TableHead>Total</TableHead>
                                        <TableHead>Dibuat</TableHead>
                                        <TableHead className="text-right">
                                            Aksi
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {myListings.map((listing) => (
                                        <TableRow key={listing.id}>
                                            <TableCell className="font-medium">
                                                {formatKwh(listing.energy_kwh)}{" "}
                                                kWh
                                            </TableCell>
                                            <TableCell>
                                                {formatCurrency(
                                                    listing.price_per_kwh
                                                )}
                                            </TableCell>
                                            <TableCell className="font-semibold">
                                                {formatCurrency(
                                                    listing.total_price
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {listing.created_at}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        handleCancelListing(
                                                            listing.id
                                                        )
                                                    }
                                                    disabled={isSubmitting}
                                                >
                                                    <X className="h-4 w-4 mr-1" />
                                                    Batalkan
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}

                {/* Available Listings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Store className="h-5 w-5" />
                            Listing Tersedia
                        </CardTitle>
                        <CardDescription>
                            {listings.length} listing dari seller lain
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {listings.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Belum ada listing tersedia</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Seller</TableHead>
                                        <TableHead>Energi</TableHead>
                                        <TableHead>Harga/kWh</TableHead>
                                        <TableHead>Total</TableHead>
                                        <TableHead>Dibuat</TableHead>
                                        <TableHead className="text-right">
                                            Aksi
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {listings.map((listing) => (
                                        <TableRow key={listing.id}>
                                            <TableCell className="font-medium">
                                                {listing.seller_name}
                                            </TableCell>
                                            <TableCell>
                                                {formatKwh(listing.energy_kwh)}{" "}
                                                kWh
                                            </TableCell>
                                            <TableCell>
                                                {formatCurrency(
                                                    listing.price_per_kwh
                                                )}
                                            </TableCell>
                                            <TableCell className="font-semibold text-green-600">
                                                {formatCurrency(
                                                    listing.total_price
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {listing.created_at}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    size="sm"
                                                    onClick={() =>
                                                        handleBuyListing(
                                                            listing.id,
                                                            listing.total_price
                                                        )
                                                    }
                                                    disabled={
                                                        isSubmitting ||
                                                        walletBalance <
                                                            listing.total_price
                                                    }
                                                >
                                                    <ShoppingCart className="h-4 w-4 mr-1" />
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

            {/* Create Listing Dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Buat Listing Baru</DialogTitle>
                        <DialogDescription>
                            Buat listing untuk menjual energi dari battery Anda
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateListing}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Jumlah Energi (kWh)
                                </label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="1"
                                    max="50"
                                    value={energyKwh}
                                    onChange={(e) =>
                                        setEnergyKwh(e.target.value)
                                    }
                                    placeholder="Masukkan jumlah kWh (1-50)"
                                    required
                                />
                                <p className="text-xs text-muted-foreground">
                                    Battery tersedia:{" "}
                                    {formatKwh(myBattery?.current_kwh || 0)} kWh
                                </p>
                            </div>

                            {energyKwh && (
                                <div className="rounded-lg bg-muted p-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Harga per kWh:</span>
                                        <span className="font-medium">
                                            {formatCurrency(
                                                systemPrice.final_price
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Jumlah:</span>
                                        <span className="font-medium">
                                            {formatKwh(parseFloat(energyKwh))}{" "}
                                            kWh
                                        </span>
                                    </div>
                                    <div className="border-t pt-2 flex justify-between font-semibold">
                                        <span>Total Harga:</span>
                                        <span className="text-green-600">
                                            {formatCurrency(totalPrice)}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setCreateDialogOpen(false)}
                                disabled={isSubmitting}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting || !energyKwh}
                            >
                                {isSubmitting ? "Memproses..." : "Buat Listing"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
