import * as React from "react"
import { PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/ui/StatCard"
import { LucideIcon } from "lucide-react";

interface ListPageLayoutProps {
    title: string;
    description: string;
    createButtonText: string;
    onCreate: () => void;
    statCards: {
        title: string;
        value: string;
        description: string;
        icon: LucideIcon;
    }[];
    children: React.ReactNode;
}

export function ListPageLayout({
    title,
    description,
    createButtonText,
    onCreate,
    statCards,
    children
}: ListPageLayoutProps) {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
                    <p className="text-muted-foreground">{description}</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button onClick={onCreate}>
                        <PlusCircle className="mr-2 h-4 w-4" /> {createButtonText}
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {statCards.map((card) => (
                    <StatCard 
                        key={card.title}
                        title={card.title}
                        value={card.value}
                        description={card.description}
                        icon={card.icon}
                    />
                ))}
            </div>

            <div className="space-y-4">
                {children}
            </div>
        </div>
    )
} 