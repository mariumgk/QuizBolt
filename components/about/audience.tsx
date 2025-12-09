"use client";

import { motion } from "framer-motion";
import { User, Briefcase, GraduationCap, School } from "lucide-react";

const audiences = [
    { label: "Students", icon: GraduationCap },
    { label: "Professionals", icon: Briefcase },
    { label: "Self-Learners", icon: User },
    { label: "Educators", icon: School },
];

export function Audience() {
    return (
        <section className="py-20 border-y bg-muted/20">
            <div className="container px-4 md:px-6">
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="text-center mb-10"
                >
                    <h2 className="text-2xl font-bold mb-8">Built For Everyone Who Learns</h2>
                    <div className="flex flex-wrap justify-center gap-8 md:gap-16">
                        {audiences.map((item, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, scale: 0.8 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                            >
                                <div className="p-4 rounded-full bg-background shadow-sm border">
                                    <item.icon className="w-6 h-6" />
                                </div>
                                <span className="font-medium text-sm">{item.label}</span>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
