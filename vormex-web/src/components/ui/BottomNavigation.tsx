'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

import { cn } from '@/lib/utils';

interface NavItem {
    title: string;
    href: string;
    icon: React.ReactNode;
    isActive?: boolean;
    onClick?: () => void;
    badge?: number;
}

interface BottomNavigationProps {
    items: NavItem[];
    className?: string;
}

export function BottomNavigation({ items, className }: BottomNavigationProps) {


    const handleVibrate = () => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(10);
        }
    };

    return (
        <div className={cn(
            "fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50",
            "w-[calc(100vw-32px)] max-w-[400px]",
            "h-[72px]", // Height 60-72px
            "bg-[#1e1e1e]/90 backdrop-blur-md", // Dark background with blur
            "rounded-[28px]", // Border radius 24-28px
            "shadow-xl shadow-black/20", // Elevated shadow
            "flex items-center justify-between px-2",
            "safe-area-inset-bottom",
            className
        )}>
            {items.map((item, index) => {
                const isActive = item.isActive;

                return (
                    <div key={item.href + index} className="relative flex-1 flex items-center justify-center h-full">
                        {isActive && (
                            <motion.div
                                layoutId="active-pill"
                                className="absolute bg-[#9EFF00] rounded-[24px]"
                                initial={false}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                style={{
                                    width: '64px', // Approx pill width
                                    height: '48px', // Pill height
                                    zIndex: 0
                                }}
                            />
                        )}

                        <Link
                            href={item.href}
                            onClick={(e) => {
                                handleVibrate();
                                if (item.onClick) {
                                    e.preventDefault();
                                    item.onClick();
                                }
                            }}
                            className={cn(
                                "relative z-10 flex items-center justify-center w-full h-full",
                                "transition-colors duration-300",
                                isActive ? "text-[#1E1E1E]" : "text-white/60 hover:text-white"
                            )}
                        >
                            <motion.div
                                whileTap={{ scale: 0.9 }}
                                className="flex flex-col items-center justify-center w-full h-full"
                            >
                                {/* Icon Container */}
                                <div className="relative">
                                    <div className={cn("w-6 h-6", isActive ? "text-[#1E1E1E]" : "text-current")}>
                                        {item.icon}
                                    </div>

                                    {/* Badge */}
                                    {item.badge && item.badge > 0 && (
                                        <span className="absolute -top-1 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-[#1E1E1E]">
                                            {item.badge > 9 ? '9+' : item.badge}
                                        </span>
                                    )}
                                </div>

                                {/* Label */}
                                <span className={cn(
                                    "text-[10px] font-medium transition-all duration-300 mt-1",
                                    isActive ? "text-[#1E1E1E] font-bold" : "text-white/60"
                                )}>
                                    {item.title}
                                </span>
                            </motion.div>
                        </Link>
                    </div>
                );
            })}
        </div>
    );
}
