"use client";

import { useState } from "react";
import { AppProvider, useApp } from "@/lib/store";
import { LandingHero } from "@/components/landing/LandingHero";
import {
  LandingFeatures,
  LandingStats,
  LandingTestimonials,
  LandingFooter,
} from "@/components/landing/LandingSections";
import { LoginPage } from "@/components/auth/LoginPage";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { OwnerDashboard } from "@/components/dashboard/OwnerDashboard";
import { EmployeeDashboard } from "@/components/dashboard/EmployeeDashboard";
import { OrdersPage } from "@/components/orders/OrdersPage";
import { KitchenMode } from "@/components/kitchen/KitchenMode";
import { ProductsPage } from "@/components/products/ProductsPage";
import { InventoryPage } from "@/components/inventory/InventoryPage";
import { PurchasesPage } from "@/components/inventory/PurchasesPage";
import { ExpensesPage } from "@/components/expenses/ExpensesPage";
import { WastePage } from "@/components/waste/WastePage";
import { AlertsPage } from "@/components/alerts/AlertsPage";
import { AnalyticsPage } from "@/components/analytics/AnalyticsPage";
import { SettingsPage } from "@/components/settings/SettingsPage";

import { useEffect } from "react";
import { obtenerIngredientes } from "@/lib/ingredientes";

function AppContent() {
  const { state, dispatch } = useApp();
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    async function cargarIngredientes() {
      try {
        const ingredientes = await obtenerIngredientes();

        dispatch({
          type: "CARGAR_INGREDIENTES",
          payload: ingredientes,
        });
      } catch (error) {
        console.error(error);
      }
    }

    cargarIngredientes();
  }, [dispatch]);

  // Not logged in
  if (!state.user) {
    if (showLogin) {
      return <LoginPage onBack={() => setShowLogin(false)} />;
    }
    return (
      <div>
        <LandingHero onLogin={() => setShowLogin(true)} />
        <LandingFeatures />
        <LandingStats />
        <LandingTestimonials />
        <LandingFooter />
      </div>
    );
  }

  // Logged in — render the correct page inside the dashboard layout
  const isOwner = state.user.role === "dueno";

  const renderPage = () => {
    switch (state.currentPage) {
      case "dashboard":
        return isOwner ? <OwnerDashboard /> : <EmployeeDashboard />;
      case "pedidos":
        return <OrdersPage />;
      case "cocina":
        return <KitchenMode />;
      case "productos":
        return isOwner ? <ProductsPage /> : <EmployeeDashboard />;
      case "inventario":
        return isOwner ? <InventoryPage /> : <EmployeeDashboard />;
      case "compras":
        return isOwner ? <PurchasesPage /> : <EmployeeDashboard />;
      case "gastos":
        return isOwner ? <ExpensesPage /> : <EmployeeDashboard />;
      case "desperdicios":
        return isOwner ? <WastePage /> : <EmployeeDashboard />;
      case "alertas":
        return <AlertsPage />;
      case "analiticas":
        return isOwner ? <AnalyticsPage /> : <EmployeeDashboard />;
      case "configuracion":
        return <SettingsPage />;
      default:
        return isOwner ? <OwnerDashboard /> : <EmployeeDashboard />;
    }
  };

  return <DashboardLayout>{renderPage()}</DashboardLayout>;
}

export default function Page() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
