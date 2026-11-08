"use client"

import { useEffect, useMemo, useState } from "react";

import {
  useApp,
  calculateAvailableQuantity,
  formatCurrency,
  type Order,
} from "@/lib/store";

import { obtenerPedidos } from "@/lib/pedidos";
import { obtenerProductos } from "@/lib/productos";
import { obtenerIngredientes } from "@/lib/ingredientes";
import { ShoppingCart, ChefHat, Clock, CheckCircle, AlertTriangle, Package } from "lucide-react"

export function EmployeeDashboard() {
  const { state, dispatch } = useApp()

  // Datos reales del backend
  const [pedidos, setPedidos] = useState<Order[]>([]);
  const [productos, setProductos] = useState<typeof state.products>([]);
  const [ingredientes, setIngredientes] = useState<typeof state.ingredients>([]);

  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [errorCarga, setErrorCarga] = useState(false);

  // Consultar información del restaurante
  useEffect(() => {
    let cancelado = false;

    const cargarDatos = async () => {
      const [datosPedidos, datosProductos, datosIngredientes] =
        await Promise.all([
          obtenerPedidos().catch((error) => {
            console.error("Error al cargar pedidos:", error);
            return null;
          }),

          obtenerProductos().catch((error) => {
            console.error("Error al cargar productos:", error);
            return null;
          }),

          obtenerIngredientes().catch((error) => {
            console.error("Error al cargar ingredientes:", error);
            return null;
          }),
        ]);

      if (cancelado) return;

      if (datosPedidos !== null) {
        setPedidos(datosPedidos);
      }

      if (datosProductos !== null) {
        setProductos(datosProductos);
      }

      if (datosIngredientes !== null) {
        setIngredientes(datosIngredientes);
      }

      setErrorCarga(
        datosPedidos === null ||
        datosProductos === null ||
        datosIngredientes === null
      );

      setCargandoDatos(false);
    };

    cargarDatos();

    const intervalo = setInterval(cargarDatos, 15000);

    return () => {
      cancelado = true;
      clearInterval(intervalo);
    };
  }, []);

  const activeOrders = useMemo(
    () =>
      pedidos.filter(
        (o) => o.status === "pendiente" || o.status === "listo"
      ),
    [pedidos]
  );

  const availability = useMemo(
    () =>
      productos
        .filter((p) => p.active)
        .map((p) => ({
          product: p,
          available: calculateAvailableQuantity(p, ingredientes),
        })),
    [productos, ingredientes]
  );

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-black text-foreground">Buen día, {state.user?.name?.split(" ")[0]}</h2>
        <p className="text-muted-foreground text-sm mt-1">Panel de empleado</p>
      </div>

      {cargandoDatos && (
        <p className="text-xs text-muted-foreground mt-2">
          Cargando información del restaurante...
        </p>
      )}

      {errorCarga && (
        <p className="text-xs text-amber-400 mt-2">
          Algunos datos no pudieron actualizarse. Se conservará la última información disponible.
        </p>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card rounded-2xl p-5">
          <ShoppingCart className="w-5 h-5 text-primary mb-3" />
          <div className="text-2xl font-black text-foreground">{activeOrders.length}</div>
          <div className="text-sm text-muted-foreground">Pedidos activos</div>
        </div>
        <div className="stat-card rounded-2xl p-5">
          <Clock className="w-5 h-5 text-yellow-400 mb-3" />
          <div className="text-2xl font-black text-foreground">
            {activeOrders.filter(o => o.status === "pendiente").length}
          </div>
          <div className="text-sm text-muted-foreground">Pendientes</div>
        </div>
        <div className="stat-card rounded-2xl p-5">
          <CheckCircle className="w-5 h-5 text-emerald-400 mb-3" />
          <div className="text-2xl font-black text-foreground">
            {activeOrders.filter(o => o.status === "listo").length}
          </div>
          <div className="text-sm text-muted-foreground">Listos</div>
        </div>
        <div className="stat-card rounded-2xl p-5">
          <AlertTriangle className="w-5 h-5 text-red-400 mb-3" />
          <div className="text-2xl font-black text-foreground">
            {state.alerts.filter(a => !a.read).length}
          </div>
          <div className="text-sm text-muted-foreground">Alertas activas</div>
        </div>
      </div>

      {/* Available products */}
      <div className="stat-card rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-5">
          <Package className="w-5 h-5 text-primary" />
          <h3 className="text-base font-bold text-foreground">Disponibilidad de Productos</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {availability.map(({ product, available }) => {
            const status = available === 0 ? "agotado" : available <= 5 ? "bajo" : "disponible"
            return (
              <div key={product.id}
                className={`rounded-xl p-4 border transition-all ${status === "agotado" ? "bg-red-500/10 border-red-500/30" :
                  status === "bajo" ? "bg-yellow-500/10 border-yellow-500/30" :
                    "bg-emerald-500/10 border-emerald-500/30"
                  }`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="text-sm font-semibold text-foreground">{product.name}</div>
                  <div className={`text-xs px-2 py-0.5 rounded-full font-medium ${status === "agotado" ? "bg-red-500/20 text-red-400" :
                    status === "bajo" ? "bg-yellow-500/20 text-yellow-400" :
                      "bg-emerald-500/20 text-emerald-400"
                    }`}>
                    {status === "agotado" ? "Agotado" : status === "bajo" ? "Bajo" : "Disponible"}
                  </div>
                </div>
                <div className="text-2xl font-black" style={{
                  color: status === "agotado" ? "oklch(0.65 0.22 27)" :
                    status === "bajo" ? "oklch(0.85 0.18 90)" : "oklch(0.70 0.18 140)"
                }}>
                  {available}
                </div>
                <div className="text-xs text-muted-foreground">unidades disponibles</div>
                <div className="text-xs text-muted-foreground mt-1">{formatCurrency(product.price)}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Active orders preview */}
      <div className="stat-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-primary" />
            <h3 className="text-base font-bold text-foreground">Pedidos en Proceso</h3>
          </div>
          <button
            onClick={() => dispatch({ type: "SET_PAGE", payload: "pedidos" })}
            className="text-xs text-primary hover:underline">
            Ver todos
          </button>
        </div>
        {activeOrders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ChefHat className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No hay pedidos activos</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeOrders.slice(0, 4).map(order => {
              const elapsed = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000)
              const total = order.estimatedMinutes + order.additionalMinutes
              const isLate = elapsed > total
              return (
                <div key={order.id} className={`flex items-center justify-between p-3 rounded-xl border ${isLate ? "bg-red-500/10 border-red-500/30" : "bg-white/3 border-white/8"
                  }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${order.status === "listo" ? "bg-emerald-400" :
                      isLate ? "bg-red-400 animate-pulse" : "bg-yellow-400"
                      }`} />
                    <div>
                      <div className="text-sm font-semibold text-foreground">Pedido #{order.orderNumber}</div>
                      <div className="text-xs text-muted-foreground">
                        {order.type === "mesa" ? `Mesa ${order.tableNumber}` :
                          order.type === "para-llevar" ? `Para llevar - ${order.customerName}` :
                            `Domicilio - ${order.customerName}`}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold ${isLate ? "text-red-400" : "text-foreground"}`}>
                      {elapsed}m
                    </div>
                    <div className="text-xs text-muted-foreground">/ {total}m</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
