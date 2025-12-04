import { Head, Link, useForm } from "@inertiajs/react";
import { FormEventHandler } from "react";
import GuestLayout from "@/Layouts/GuestLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, Lock, AlertCircle } from "lucide-react";

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: "",
        password: "",
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route("login"), {
            onFinish: () => reset("password"),
        });
    };

    return (
        <GuestLayout>
            <Head title="Login" />

            <Card className="border-0 shadow-xl">
                <CardHeader className="space-y-1 pb-6">
                    <CardTitle className="text-2xl font-bold text-center">
                        Selamat Datang! 👋
                    </CardTitle>
                    <CardDescription className="text-center">
                        Masuk ke akun Anda untuk melanjutkan
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {status && (
                        <Alert className="mb-4 border-green-200 bg-green-50 text-green-800">
                            <AlertDescription>{status}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={submit} className="space-y-4">
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
                                    autoFocus
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
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                                {canResetPassword && (
                                    <Link
                                        href={route("password.request")}
                                        className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                                    >
                                        Lupa password?
                                    </Link>
                                )}
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="pl-10"
                                    value={data.password}
                                    onChange={(e) => setData("password", e.target.value)}
                                    autoComplete="current-password"
                                />
                            </div>
                            {errors.password && (
                                <p className="text-sm text-destructive flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="remember"
                                checked={data.remember}
                                onCheckedChange={(checked) =>
                                    setData("remember", checked as boolean)
                                }
                            />
                            <Label
                                htmlFor="remember"
                                className="text-sm font-normal cursor-pointer"
                            >
                                Ingat saya
                            </Label>
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
                                    Memproses...
                                </>
                            ) : (
                                "Masuk"
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
                                Belum punya akun?
                            </span>
                        </div>
                    </div>

                    <Button variant="outline" className="w-full" asChild>
                        <Link href={route("register")}>Daftar Sekarang</Link>
                    </Button>
                </CardFooter>
            </Card>
        </GuestLayout>
    );
}
