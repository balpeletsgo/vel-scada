import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import AppLayout from "@/Layouts/AppLayout";
import { formatCurrency, formatKwh } from "@/lib/formatters";
import { Head } from "@inertiajs/react";
import {
    ArrowDownLeft,
    ArrowUpRight,
    Receipt,
    TrendingDown,
    TrendingUp,
    Zap,
} from "lucide-react";

interface Transaction {
    id: number;
    tx_hash: string;
    type: "buy" | "sell";
    counterparty: string;
    energy_kwh: number;
    price_per_kwh: number;
    total_price: number;
    status: "pending" | "completed" | "cancelled" | "failed";
    created_at: string;
    completed_at: string | null;
}

const truncateTxHash = (hash: string): string => {
    if (!hash) return "-";
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
};

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedTransactions {
    data: Transaction[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: PaginationLink[];
    next_page_url: string | null;
    prev_page_url: string | null;
}

interface Summary {
    buy_total: number;
    sell_total: number;
    buy_energy_total: number;
    sell_energy_total: number;
    net_balance: number;
}

interface TransactionsProps {
    transactions: PaginatedTransactions;
    summary: Summary;
}

const getStatusBadge = (status: string) => {
    const variants: Record<
        string,
        {
            variant: "default" | "secondary" | "destructive" | "outline";
            label: string;
        }
    > = {
        completed: { variant: "default", label: "Selesai" },
        pending: { variant: "secondary", label: "Pending" },
        cancelled: { variant: "outline", label: "Dibatalkan" },
        failed: { variant: "destructive", label: "Gagal" },
    };
    return variants[status] || variants.pending;
};

export default function Transactions({
    transactions,
    summary,
}: TransactionsProps) {
    return (
        <AppLayout>
            <Head title="Riwayat Transaksi" />

            <div className="p-6 space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold">Riwayat Transaksi</h1>
                    <p className="text-muted-foreground">
                        Lihat semua transaksi pembelian dan penjualan energi
                        Anda
                    </p>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Pembelian
                            </CardTitle>
                            <ArrowDownLeft className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                                {formatCurrency(summary.buy_total)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {formatKwh(summary.buy_energy_total)} kWh dibeli
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Penjualan
                            </CardTitle>
                            <ArrowUpRight className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {formatCurrency(summary.sell_total)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {formatKwh(summary.sell_energy_total)} kWh
                                terjual
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                Net Balance
                            </CardTitle>
                            {summary.net_balance >= 0 ? (
                                <TrendingUp className="h-4 w-4 text-green-500" />
                            ) : (
                                <TrendingDown className="h-4 w-4 text-red-500" />
                            )}
                        </CardHeader>
                        <CardContent>
                            <div
                                className={`text-2xl font-bold ${
                                    summary.net_balance >= 0
                                        ? "text-green-600"
                                        : "text-red-600"
                                }`}
                            >
                                {summary.net_balance >= 0 ? "+" : ""}
                                {formatCurrency(summary.net_balance)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Penjualan - Pembelian
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Transaksi
                            </CardTitle>
                            <Receipt className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {transactions.total}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Semua transaksi
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Transactions Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="h-5 w-5" />
                            Daftar Transaksi
                        </CardTitle>
                        <CardDescription>
                            Menampilkan {transactions.data.length} dari{" "}
                            {transactions.total} transaksi
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {transactions.data.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Belum ada transaksi</p>
                                <p className="text-sm">
                                    Mulai jual atau beli energi di Marketplace
                                </p>
                            </div>
                        ) : (
                            <>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Tx Hash</TableHead>
                                            <TableHead>Tipe</TableHead>
                                            <TableHead>Pihak Lain</TableHead>
                                            <TableHead>Energi</TableHead>
                                            <TableHead>Harga/kWh</TableHead>
                                            <TableHead>Total</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Tanggal</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {transactions.data.map((tx) => {
                                            const statusBadge = getStatusBadge(
                                                tx.status
                                            );
                                            return (
                                                <TableRow key={tx.id}>
                                                    <TableCell>
                                                        <code
                                                            className="text-xs bg-muted px-2 py-1 rounded font-mono"
                                                            title={tx.tx_hash}
                                                        >
                                                            {truncateTxHash(
                                                                tx.tx_hash
                                                            )}
                                                        </code>
                                                    </TableCell>
                                                    <TableCell>
                                                        {tx.type === "buy" ? (
                                                            <Badge
                                                                variant="outline"
                                                                className="text-red-600 border-red-200 bg-red-50"
                                                            >
                                                                <ArrowDownLeft className="mr-1 h-3 w-3" />
                                                                Beli
                                                            </Badge>
                                                        ) : (
                                                            <Badge
                                                                variant="outline"
                                                                className="text-green-600 border-green-200 bg-green-50"
                                                            >
                                                                <ArrowUpRight className="mr-1 h-3 w-3" />
                                                                Jual
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        {tx.counterparty}
                                                    </TableCell>
                                                    <TableCell>
                                                        {formatKwh(
                                                            tx.energy_kwh
                                                        )}{" "}
                                                        kWh
                                                    </TableCell>
                                                    <TableCell>
                                                        {formatCurrency(
                                                            tx.price_per_kwh
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="font-semibold">
                                                        <span
                                                            className={
                                                                tx.type ===
                                                                "buy"
                                                                    ? "text-red-600"
                                                                    : "text-green-600"
                                                            }
                                                        >
                                                            {tx.type === "buy"
                                                                ? "-"
                                                                : "+"}
                                                            {formatCurrency(
                                                                tx.total_price
                                                            )}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant={
                                                                statusBadge.variant
                                                            }
                                                        >
                                                            {statusBadge.label}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground text-sm">
                                                        {tx.created_at}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>

                                {/* Pagination */}
                                {transactions.last_page > 1 && (
                                    <div className="mt-4 flex justify-center">
                                        <Pagination>
                                            <PaginationContent>
                                                {transactions.prev_page_url && (
                                                    <PaginationItem>
                                                        <PaginationPrevious
                                                            href={
                                                                transactions.prev_page_url
                                                            }
                                                        />
                                                    </PaginationItem>
                                                )}

                                                {transactions.links
                                                    .slice(1, -1)
                                                    .map((link, idx) => (
                                                        <PaginationItem
                                                            key={idx}
                                                        >
                                                            <PaginationLink
                                                                href={
                                                                    link.url ||
                                                                    "#"
                                                                }
                                                                isActive={
                                                                    link.active
                                                                }
                                                            >
                                                                {link.label}
                                                            </PaginationLink>
                                                        </PaginationItem>
                                                    ))}

                                                {transactions.next_page_url && (
                                                    <PaginationItem>
                                                        <PaginationNext
                                                            href={
                                                                transactions.next_page_url
                                                            }
                                                        />
                                                    </PaginationItem>
                                                )}
                                            </PaginationContent>
                                        </Pagination>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
