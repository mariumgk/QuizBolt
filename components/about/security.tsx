"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Lock, Database } from "lucide-react";

export function Security() {
    return (
        <section className="py-20">
            <div className="container px-4 md:px-6">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="bg-primary/5 rounded-2xl p-8 md:p-12 border border-primary/10 flex flex-col md:flex-row items-center gap-8"
                    >
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                <ShieldCheck className="text-primary w-8 h-8" />
                                Your Data is Safe
                            </h2>
                            <p className="text-muted-foreground mb-6">
                                We believe in privacy by design. Your documents are processed in a secure environment and are strictly isolated to your account. We never sell your personal data.
                            </p>
                            <ul className="space-y-2">
                                <li className="flex items-center gap-2 text-sm font-medium">
                                    <Lock className="w-4 h-4 text-green-500" /> End-to-end encryption in transit
                                </li>
                                <li className="flex items-center gap-2 text-sm font-medium">
                                    <Database className="w-4 h-4 text-green-500" /> Isolated user storage (RLS)
                                </li>
                            </ul>
                        </div>
                        <div className="w-32 h-32 bg-background rounded-full flex items-center justify-center shadow-lg animate-pulse">
                            <ShieldCheck className="w-16 h-16 text-primary" />
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
