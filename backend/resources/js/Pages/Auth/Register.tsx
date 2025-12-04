import { Head, Link, useForm } from "@inertiajs/react";
import { FormEventHandler } from "react";
import GuestLayout from "@/Layouts/GuestLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, User, Mail, Lock, AlertCircle, Zap, Battery, Sun } from "lucide-react";

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route("register"), {
            onFinish: () => reset("password", "password_confirmation"),
        });
    };

    return (
        <GuestLayout>
            <Head title="Register" />

            <Card className="border-0 shadow-xl">
                <CardHeader className="space-y-1 pb-4">
                    <CardTitle className="text-2xl font-bold text-center">
                        Buat Akun Baru 🚀
                    </CardTitle>
                    <CardDescription className="text-center">
                        Daftar untuk mulai trading energi
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {/* Benefit Cards */}
                    <div className="grid grid-cols-3 gap-2 mb-6">
                        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 text-center">
                            <Zap className="h-5 w-5 mx-auto text-blue-600 mb-1" />
                            <p className="text-xs font-medium text-blue-700 dark:text-blue-300">66 kWh</p>
                            <p className="text-[10px] text-muted-foreground">Main Power</p>
                        </div>
                        <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3 text-center">
                            <Battery className="h-5 w-5 mx-auto text-green-600 mb-1" />
                            <p className="text-xs font-medium text-green-700 dark:text-green-300">100 kWh</p>
                            <p className="text-[10px] text-muted-foreground">Battery</p>
                        </div>
                        <div className="bg-yellow-50 dark:bg-yellow-950/30 rounded-lg p-3 text-center">
                            <Sun className="h-5 w-5 mx-auto text-yellow-600 mb-1" />
                            <p className="text-xs font-medium text-yellow-700 dark:text-yellow-300">0.37 kWh</p>
                            <p className="text-[10px] text-muted-foreground">Solar/jam</p>
                        </div>
                    </div>

                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nama Lengkap</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="John Doe"
                                    className="pl-10"
                                    value={data.name}
                                    onChange={(e) => setData("name", e.target.value)}
                                    autoComplete="name"
                                    autoFocus
                                    required
                                />
                            </div>
                            {errors.name && (
                                <p className="text-sm text-destructive flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="nama@email.com"
                                    className="pl-10"
                                    value={data.email}
                                    onChange={(e) => setData("email", e.target.value)}
                                    autoComplete="username"
                                    required
                                />
                            </div>
                            {errors.email && (
                                <p className="text-sm text-destructive flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Minimal 8 karakter"
                                    className="pl-10"
                                    value={data.password}
                                    onChange={(e) => setData("password", e.target.value)}
                                    autoComplete="new-password"
                                    required
                                />
                            </div>
                            {errors.password && (
                                <p className="text-sm text-destructive flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password_confirmation">Konfirmasi Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="password_confirmation"
                                    type="password"
                                    placeholder="Ulangi password"
                                    className="pl-10"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData("password_confirmation", e.target.value)}
                                    autoComplete="new-password"
                                    required
                                />
                            </div>
                            {errors.password_confirmation && (
                                <p className="text-sm text-destructive flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    {errors.password_confirmation}
                                </p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            size="lg"
                            disabled={processing}
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Membuat Akun...
                                </>
                            ) : (
                                "Daftar Sekarang"
                            )}
                        </Button>
                    </form>
                </CardContent>

                <CardFooter className="flex flex-col space-y-4 pt-0">
                    <div className="relative w-full">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">
                                Sudah punya akun?
                            </span>
                        </div>
                    </div>

                    <Button variant="outline" className="w-full" asChild>
                        <Link href={route("login")}>Masuk</Link>
                    </Button>
                </CardFooter>
            </Card>
        </GuestLayout>
    );
}
