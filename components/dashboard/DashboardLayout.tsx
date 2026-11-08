"use client"

import { useState } from "react"
import { useApp } from "@/lib/store"
import {
  LayoutDashboard, ShoppingCart, Package, ClipboardList,
  DollarSign, Trash2, Bell, BarChart3, Settings, ChefHat,
  LogOut, Menu, X, Crown, User, TrendingUp, AlertTriangle
} from "lucide-react"

interface NavItem {
  id: string
  label: string
  icon: any
  ownerOnly?: boolean
  badge?: number
}

const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "pedidos", label: "Pedidos", icon: ShoppingCart },
  { id: "cocina", label: "Modo Cocina", icon: ChefHat },
  { id: "productos", label: "Productos", icon: ClipboardList, ownerOnly: true },
  { id: "inventario", label: "Inventario", icon: Package, ownerOnly: true },
  { id: "compras", label: "Compras", icon: TrendingUp, ownerOnly: true },
  { id: "gastos", label: "Gastos Operativos", icon: DollarSign, ownerOnly: true },
  { id: "desperdicios", label: "Desperdicios", icon: Trash2, ownerOnly: true },
  { id: "alertas", label: "Alertas", icon: Bell },
  { id: "analiticas", label: "Analíticas", icon: BarChart3, ownerOnly: true },
  { id: "configuracion", label: "Configuración", icon: Settings },
]

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { state, dispatch } = useApp()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isOwner = state.user?.role === "dueno"
  const unreadAlerts = state.alerts.filter(a => !a.read).length

  const visibleItems = navItems.filter(item => !item.ownerOnly || isOwner)

  const handleNav = (id: string) => {
    dispatch({ type: "SET_PAGE", payload: id })
    setSidebarOpen(false)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:relative z-50 flex flex-col h-full w-64
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
        style={{ background: "oklch(0.11 0.006 240)", borderRight: "1px solid oklch(1 0 0 / 6%)" }}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
              <ChefHat className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-foreground">Fast<span className="gradient-text">Manager</span></span>
          </div>
          <button className="lg:hidden text-muted-foreground" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User info */}
        <div className="px-4 py-4 border-b border-white/5">
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "oklch(0.16 0.009 240)" }}>
            <div className="w-9 h-9 rounded-lg gradient-brand flex items-center justify-center flex-shrink-0">
              {isOwner ? <Crown className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-white" />}
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-semibold text-foreground truncate">{state.user?.name}</div>
              <div className="text-xs text-primary">{isOwner ? "Dueño" : "Empleado"}</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {visibleItems.map(item => {
              const isActive = state.currentPage === item.id
              const badge = item.id === "alertas" ? unreadAlerts : 0
              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleNav(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group ${
                      isActive
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    }`}
                  >
                    <item.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-primary" : ""}`} />
                    <span className="text-sm font-medium flex-1">{item.label}</span>
                    {badge > 0 && (
                      <span className="w-5 h-5 rounded-full gradient-brand flex items-center justify-center text-white text-xs font-bold">
                        {badge > 9 ? "9+" : badge}
                      </span>
                    )}
                    {isActive && <div className="w-1 h-1 rounded-full bg-primary" />}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Bottom */}
        <div className="p-4 border-t border-white/5">
          <button
            onClick={() => dispatch({ type: "LOGOUT" })}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all text-sm"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 flex-shrink-0"
          style={{ background: "oklch(0.11 0.006 240)" }}>
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-muted-foreground hover:text-foreground" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-foreground">
              {visibleItems.find(i => i.id === state.currentPage)?.label || "Dashboard"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Alert bell */}
            <button
              onClick={() => handleNav("alertas")}
              className="relative w-9 h-9 rounded-xl glass border border-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
              <Bell className="w-4 h-4" />
              {unreadAlerts > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full gradient-brand flex items-center justify-center text-white text-xs font-bold">
                  {unreadAlerts}
                </span>
              )}
            </button>
            {/* Settings */}
            <button
              onClick={() => handleNav("configuracion")}
              className="w-9 h-9 rounded-xl glass border border-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
