"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function AboutCTA() {
    return (
        <section className="py-20 md:py-32 relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/5 -z-10" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

            <div className="container px-4 md:px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="max-w-2xl mx-auto space-y-8"
                >
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                        Ready to Transform Your Study Habits?
                    </h2>
                    <p className="text-xl text-muted-foreground">
                        Join thousands of students who are learning faster and retaining more with QuizBolt.
                    </p>
                    <div className="flex justify-center flex-col sm:flex-row gap-4">
                        <Link href="/login">
                            <Button size="lg" className="rounded-full h-14 px-8 text-lg shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all hover:scale-105">
                                Start Learning Smarter <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </Link>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
