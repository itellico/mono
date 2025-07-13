"use client"

import * as React from "react"
import { ListPageLayout } from "@/components/layouts/ListPageLayout"
import { TenantsDataTable } from "@/components/tenants/TenantsDataTable"
import { columns } from "@/components/tenants/columns"
import { mockTenants } from "@/components/tenants/mock-data"
import { CreateTenantModal } from "@/components/tenants/CreateTenantModal"
import { EditTenantModal } from "@/components/tenants/EditTenantModal"
import { Building, Users, Clock } from "lucide-react"
import { useState } from "react"

interface Tenant {
  id: string;
  name: string;
  status: string;
  domain: string;
  createdAt: string;
  updatedAt: string;
  // Add other properties as needed
}

export default function TenantsPage() {
    const [tenants, setTenants] = useState(mockTenants);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

    const statCards = [
        {
            title: "Total Tenants",
            value: tenants.length.toString(),
            description: "All registered tenants",
            icon: Building,
        },
        {
            title: "Active Tenants",
            value: tenants.filter((t) => t.status === "Active").length.toString(),
            description: "Currently active subscriptions",
            icon: Users,
        },
        {
            title: "Pending Approvals",
            value: tenants.filter((t) => t.status === "Pending").length.toString(),
            description: "Tenants awaiting activation",
            icon: Clock,
        }
    ];

    const handleCreateTenant = () => {
        setCreateModalOpen(true);
    };

    const handleCreateSuccess = (newTenant: any) => {
        setTenants(prev => [...prev, newTenant]);
        console.log("New tenant created:", newTenant);
    };

    const handleEditSuccess = (updatedTenant: any) => {
        setTenants(prev => prev.map(t => t.id === updatedTenant.id ? updatedTenant : t));
        console.log("Tenant updated:", updatedTenant);
    };

    return (
        <>
            <ListPageLayout
                title="Tenant Management"
                description="Oversee and manage all tenants on the platform."
                createButtonText="Create Tenant"
                onCreate={handleCreateTenant}
                statCards={statCards}
            >
                <TenantsDataTable 
                    columns={columns as any} 
                    data={tenants as any}
                />
            </ListPageLayout>

            <CreateTenantModal
                open={createModalOpen}
                onOpenChange={setCreateModalOpen}
                onSuccess={handleCreateSuccess}
            />

            <EditTenantModal
                open={editModalOpen}
                onOpenChange={setEditModalOpen}
                tenant={selectedTenant}
                onSuccess={handleEditSuccess}
            />
        </>
    )
} 