import { PropsWithChildren, useState } from "react";
import { Link, usePage, router } from "@inertiajs/react";
import { formatCurrency } from "@/lib/formatters";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
    LayoutDashboard,
    ArrowLeftRight,
    LogOut,
    ChevronUp,
    User,
    Send,
    Zap,
    Settings,
    Wallet,
} from "lucide-react";

interface UserType {
    id: number;
    name: string;
    email: string;
    role?: string;
    main_power_kwh?: number;
    wallet_balance?: number;
}

const menuItems = [
    {
        title: "Dashboard",
        items: [
            { title: "Overview", url: "/dashboard", icon: LayoutDashboard },
        ],
    },
    {
        title: "Energy Management",
        items: [{ title: "Transfer Energi", url: "/transfer", icon: Send }],
    },
    {
        title: "Trading",
        items: [
            { title: "Marketplace", url: "/marketplace", icon: ArrowLeftRight },
            {
                title: "My Transactions",
                url: "/transactions",
                icon: ArrowLeftRight,
            },
        ],
    },
];

export default function AppLayout({ children }: PropsWithChildren) {
    const { auth } = usePage().props as { auth: { user: UserType } };
    const user = auth.user;
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = () => {
        setIsLoggingOut(true);
        router.post(
            route("logout"),
            {},
            {
                onFinish: () => setIsLoggingOut(false),
            }
        );
    };

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full">
                <Sidebar>
                    <SidebarHeader className="border-b h-14 px-4 flex items-center">
                        <Link
                            href="/dashboard"
                            className="flex items-center h-full gap-2"
                        >
                            <Zap className="h-6 w-6 text-primary" />
                            <span className="font-bold text-xl">Vel-SCADA</span>
                        </Link>
                    </SidebarHeader>
                    <SidebarContent>
                        {menuItems.map((group) => (
                            <SidebarGroup key={group.title}>
                                <SidebarGroupLabel>
                                    {group.title}
                                </SidebarGroupLabel>
                                <SidebarGroupContent>
                                    <SidebarMenu>
                                        {group.items.map((item) => (
                                            <SidebarMenuItem key={item.title}>
                                                <SidebarMenuButton asChild>
                                                    <Link href={item.url}>
                                                        <item.icon className="h-4 w-4" />
                                                        <span>
                                                            {item.title}
                                                        </span>
                                                    </Link>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        ))}
                                    </SidebarMenu>
                                </SidebarGroupContent>
                            </SidebarGroup>
                        ))}
                    </SidebarContent>
                    <SidebarFooter className="border-t p-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start gap-2 h-auto py-2"
                                >
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback className="bg-primary text-primary-foreground">
                                            {user.name.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 text-left">
                                        <p className="text-sm font-medium truncate">
                                            {user.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {user.email}
                                        </p>
                                    </div>
                                    <ChevronUp className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                side="top"
                                align="start"
                                className="w-64"
                                sideOffset={8}
                            >
                                <DropdownMenuLabel>
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium">
                                            {user.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {user.email}
                                        </p>
                                        {user.role && (
                                            <Badge
                                                variant="secondary"
                                                className="w-fit mt-1"
                                            >
                                                {user.role}
                                            </Badge>
                                        )}
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />

                                {/* Quick Stats */}
                                <div className="px-2 py-2 space-y-1">
                                    {user.main_power_kwh !== undefined && (
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">
                                                Main Power
                                            </span>
                                            <span className="font-medium text-blue-600">
                                                {user.main_power_kwh.toFixed(2)}{" "}
                                                kWh
                                            </span>
                                        </div>
                                    )}
                                    {user.wallet_balance !== undefined && (
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">
                                                Wallet
                                            </span>
                                            <span className="font-medium text-green-600">
                                                {formatCurrency(
                                                    user.wallet_balance
                                                )}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link
                                        href="/profile"
                                        className="cursor-pointer"
                                    >
                                        <User className="mr-2 h-4 w-4" />
                                        Profile
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link
                                        href="/profile"
                                        className="cursor-pointer"
                                    >
                                        <Settings className="mr-2 h-4 w-4" />
                                        Settings
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => setShowLogoutDialog(true)}
                                    className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarFooter>
                </Sidebar>

                <main className="flex-1 overflow-auto">
                    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-6">
                        <SidebarTrigger />
                        <div className="flex-1" />

                        {/* Quick Stats in Header */}
                        <div className="hidden md:flex items-center gap-4 text-sm">
                            {user.main_power_kwh !== undefined && (
                                <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-950/30 rounded-full">
                                    <Zap className="h-4 w-4 text-blue-600" />
                                    <span className="text-blue-700 dark:text-blue-300 font-medium">
                                        {user.main_power_kwh.toFixed(2)} kWh
                                    </span>
                                </div>
                            )}
                            {user.wallet_balance !== undefined && (
                                <div className="flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-950/30 rounded-full">
                                    <Wallet className="h-4 w-4 text-green-600" />
                                    <span className="text-green-700 dark:text-green-300 font-medium">
                                        {formatCurrency(user.wallet_balance)}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Logout button in header */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowLogoutDialog(true)}
                            className="text-muted-foreground hover:text-red-600"
                            title="Logout"
                        >
                            <LogOut className="h-5 w-5" />
                        </Button>
                    </header>
                    <div className="p-6">{children}</div>
                </main>
            </div>

            {/* Logout Confirmation Dialog */}
            <AlertDialog
                open={showLogoutDialog}
                onOpenChange={setShowLogoutDialog}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Konfirmasi Logout</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin keluar dari akun{" "}
                            <span className="font-medium text-foreground">
                                {user.name}
                            </span>
                            ?
                            <br />
                            <span className="text-muted-foreground text-xs mt-2 block">
                                Anda akan diarahkan ke halaman login.
                            </span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isLoggingOut}>
                            Batal
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        >
                            {isLoggingOut ? (
                                <>
                                    <span className="animate-spin mr-2">
                                        ⏳
                                    </span>
                                    Logging out...
                                </>
                            ) : (
                                <>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Ya, Logout
                                </>
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </SidebarProvider>
    );
}
