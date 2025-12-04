import { Link } from "@inertiajs/react";
import { PropsWithChildren } from "react";
import { Zap } from "lucide-react";

export default function GuestLayout({ children }: PropsWithChildren) {
    return (
        <div className="min-h-screen flex">
            {/* Left Side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-blue-600 via-blue-700 to-indigo-800 p-12 flex-col justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-lg">
                        <Zap className="h-8 w-8 text-white" />
                    </div>
                    <span className="text-2xl font-bold text-white">
                        Vel-SCADA
                    </span>
                </div>

                <div className="space-y-6">
                    <h1 className="text-4xl font-bold text-white leading-tight">
                        Smart Energy Trading Platform
                    </h1>
                    <p className="text-blue-100 text-lg">
                        Monitor, manage, and trade your energy with our advanced
                        SCADA-based P2P energy trading system.
                    </p>
                    <div className="grid grid-cols-2 gap-4 pt-4">
                        <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                            <p className="text-3xl font-bold text-white">
                                66 kWh
                            </p>
                            <p className="text-blue-200 text-sm">
                                Default Token
                            </p>
                        </div>
                        <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                            <p className="text-3xl font-bold text-white">
                                100 kWh
                            </p>
                            <p className="text-blue-200 text-sm">
                                Battery Capacity
                            </p>
                        </div>
                        <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                            <p className="text-3xl font-bold text-white">
                                0.37 kWh
                            </p>
                            <p className="text-blue-200 text-sm">Solar/hour</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                            <p className="text-3xl font-bold text-white">
                                ~10 hari
                            </p>
                            <p className="text-blue-200 text-sm">
                                Estimasi Token
                            </p>
                        </div>
                    </div>
                </div>

                <p className="text-blue-200 text-sm">
                    © 2025 Vel-SCADA. P2P Energy Trading Platform.
                </p>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
                        <div className="p-2 bg-blue-600 rounded-lg">
                            <Zap className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-xl font-bold">Vel-SCADA</span>
                    </div>

                    {children}
                </div>
            </div>
        </div>
    );
}
