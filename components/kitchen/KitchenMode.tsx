"use client";

import { useState, useEffect } from "react";
import {
  useApp,
  Order,
  formatCurrency,
  getOrderElapsedMinutes,
  getOrderTimerStatus,
  isOrderDelayed,
} from "@/lib/store";
import {
  ChefHat,
  Clock,
  CheckCircle,
  Truck,
  Maximize2,
  Minimize2,
  Users,
  ShoppingBag,
  MapPin,
} from "lucide-react";

import { obtenerPedidos, actualizarEstadoPedido } from "@/lib/pedidos";
function KitchenOrderCard({
  order,
  kitchenNumber,
  onUpdated,
}: {
  order: Order;
  kitchenNumber: number;
  onUpdated: () => Promise<void>;
}) {
  const { dispatch } = useApp();
  const [elapsed, setElapsed] = useState(getOrderElapsedMinutes(order));
  const timerStatus = getOrderTimerStatus(order);
  const totalMinutes = order.estimatedMinutes + order.additionalMinutes;
  const remaining = Math.max(0, totalMinutes - elapsed);

  useEffect(() => {
    const interval = setInterval(
      () => setElapsed(getOrderElapsedMinutes(order)),
      5000,
    );
    return () => clearInterval(interval);
  }, [order]);

  const typeIcon = {
    mesa: <Users className="w-4 h-4" />,
    "para-llevar": <ShoppingBag className="w-4 h-4" />,
    domicilio: <MapPin className="w-4 h-4" />,
  };

  const statusColors = {
    verde: {
      border: "border-emerald-500/40",
      bg: "bg-emerald-500/5",
      timer: "text-emerald-400",
      timerBg: "bg-emerald-500/15 border-emerald-500/30",
      bar: "oklch(0.70 0.18 140)",
    },
    amarillo: {
      border: "border-yellow-500/40",
      bg: "bg-yellow-500/5",
      timer: "text-yellow-400",
      timerBg: "bg-yellow-500/15 border-yellow-500/30",
      bar: "oklch(0.85 0.18 90)",
    },
    rojo: {
      border: "border-red-500/50",
      bg: "bg-red-500/8",
      timer: "text-red-400",
      timerBg: "bg-red-500/15 border-red-500/30",
      bar: "oklch(0.65 0.22 27)",
    },
  };

  const sc = statusColors[timerStatus];

  const handleUpdateStatus = async (status: string) => {
    try {
      await actualizarEstadoPedido(order.id, status);

      await onUpdated();
    } catch (error) {
      console.error(error);

      alert("No fue posible actualizar el estado.");
    }
  };

  return (
    <div
      className={`rounded-2xl p-5 border-2 ${sc.border} ${sc.bg} flex flex-col gap-4 transition-all ${
        timerStatus === "rojo" ? "animate-pulse" : ""
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div>
            {/* Número del pedido */}
            <span className="text-2xl font-black text-foreground break-all">
              #{String(kitchenNumber).padStart(3, "0")}
            </span>

            {/* Tipo de pedido */}
            <div className="flex items-center gap-1 text-muted-foreground text-sm mt-2">
              {typeIcon[order.type]}
              <span className="capitalize">
                {order.type === "mesa"
                  ? `Mesa ${order.tableNumber}`
                  : order.type === "para-llevar"
                    ? `Para llevar · ${order.customerName}`
                    : `Domicilio · ${order.customerName}`}
              </span>
            </div>

            {/* Estado */}
            <div className="mt-3">
              <span
                className={`inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full border ${
                  order.status.toLowerCase() === "listo"
                    ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                    : order.status.toLowerCase() === "cancelado" &&
                        order.mantenerParaVenta
                      ? "bg-orange-500/20 border-orange-500/30 text-orange-400"
                      : "bg-yellow-500/20 border-yellow-500/30 text-yellow-400"
                }`}
              >
                {order.status.toLowerCase() === "listo"
                  ? "Listo"
                  : order.status.toLowerCase() === "cancelado" &&
                      order.mantenerParaVenta
                    ? "Cancelado · Para venta"
                    : "En preparación"}
              </span>
            </div>
          </div>
        </div>

        {/* Timer display */}
        <div
          className={`flex flex-col items-center p-3 rounded-xl border ${sc.timerBg}`}
        >
          <Clock className={`w-5 h-5 mb-1 ${sc.timer}`} />
          <div className={`text-2xl font-black ${sc.timer}`}>{elapsed}m</div>
          <div className="text-xs text-muted-foreground">transcurrido</div>
          <div className={`text-xs font-semibold mt-1 ${sc.timer}`}>
            {remaining > 0 ? `${remaining}m restantes` : "TIEMPO VENCIDO"}
          </div>
        </div>
      </div>

      {/* Timer bar */}
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{
            width: `${Math.min(100, (elapsed / totalMinutes) * 100)}%`,
            background: sc.bar,
          }}
        />
      </div>

      {/* Items */}
      <div className="flex-1 space-y-3">
        {order.items.map((item) => (
          <div
            key={`${item.productId}-${item.quantity}`}
            className="rounded-xl p-3"
            style={{ background: "oklch(0.16 0.009 240)" }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-base font-bold text-foreground">
                x{item.quantity} {item.productName}
              </span>
              <span className="text-sm text-primary font-semibold">
                {formatCurrency(item.subtotal)}
              </span>
            </div>
            {item.extras && item.extras.length > 0 && (
              <div className="space-y-0.5">
                {(item.extras ?? []).map((extra) => (
                  <div
                    key={extra.extraId}
                    className="flex items-center gap-1 text-xs text-muted-foreground"
                  >
                    <span className="text-primary">+</span>
                    {extra.name}
                    {extra.price > 0 && (
                      <span className="text-primary ml-auto">
                        {formatCurrency(extra.price)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
            {item.notes && (
              <p className="text-xs text-yellow-400 mt-1 italic">
                Nota: {item.notes}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {(order.status.toLowerCase() === "pendiente" ||
          (order.status.toLowerCase() === "cancelado" &&
            order.mantenerParaVenta === true)) && (
          <button
            onClick={() => handleUpdateStatus("LISTO")}
            className="flex-1 py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-500/30 transition-all"
          >
            <CheckCircle className="w-4 h-4" />
            Marcar como Listo
          </button>
        )}

        {order.status.toLowerCase() === "listo" && (
          <button
            onClick={() => handleUpdateStatus("ENTREGADO")}
            className="flex-1 py-3 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-500/30 transition-all"
          >
            <Truck className="w-4 h-4" />
            Marcar como Entregado
          </button>
        )}
      </div>
    </div>
  );
}

export function KitchenMode() {
  const { state } = useApp();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [, setTick] = useState(0);

  const [pedidos, setPedidos] = useState<Order[]>([]);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 10000);
    return () => clearInterval(interval);
  }, []);

  const activeOrders = pedidos.filter((o) => {
    const estado = o.status.toLowerCase();

    return (
      estado === "pendiente" ||
      estado === "listo" ||
      (estado === "cancelado" && o.mantenerParaVenta === true)
    );
  });

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const cargarPedidos = async () => {
    try {
      const datos = await obtenerPedidos();

      setPedidos(datos);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    cargarPedidos();
  }, []);

  const pendientes = activeOrders.filter(
    (o) => o.status.toLowerCase() === "pendiente",
  ).length;

  const listos = activeOrders.filter(
    (o) => o.status.toLowerCase() === "listo",
  ).length;

  const retrasados = activeOrders.filter((o) => isOrderDelayed(o)).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Modo Cocina</h2>
            <p className="text-sm text-muted-foreground">
              {activeOrders.length} pedido(s) activo(s)
            </p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-4">
          {/* Pendientes */}
          <div className="text-center">
            <div className="text-xl font-black text-yellow-400">
              {pendientes}
            </div>
            <div className="text-xs text-muted-foreground">Pendientes</div>
          </div>

          {/* Listos */}
          <div className="text-center">
            <div className="text-xl font-black text-emerald-400">{listos}</div>
            <div className="text-xs text-muted-foreground">Listos</div>
          </div>

          {/* Retrasados */}
          <div className="text-center">
            <div className="text-xl font-black text-red-400">{retrasados}</div>
            <div className="text-xs text-muted-foreground">Retrasados</div>
          </div>

          <button
            onClick={toggleFullscreen}
            className="w-10 h-10 rounded-xl glass border border-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap">
        {[
          { color: "bg-emerald-400", label: "En tiempo (< 70%)" },
          { color: "bg-yellow-400", label: "Casi vencido (70-100%)" },
          { color: "bg-red-400", label: "Tiempo vencido (> 100%)" },
        ].map((l) => (
          <div
            key={l.label}
            className="flex items-center gap-2 text-xs text-muted-foreground"
          >
            <div className={`w-3 h-3 rounded-full ${l.color}`} />
            {l.label}
          </div>
        ))}
      </div>

      {/* Orders grid */}
      {activeOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <ChefHat className="w-16 h-16 mb-4 opacity-20" />
          <p className="text-lg font-semibold">Sin pedidos activos</p>
          <p className="text-sm mt-1">
            Los nuevos pedidos aparecerán aquí automáticamente
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {activeOrders
            .sort(
              (a, b) =>
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime(),
            )
            .map((order, index) => (
              <KitchenOrderCard
                key={order.id}
                order={order}
                kitchenNumber={index + 1}
                onUpdated={cargarPedidos}
              />
            ))}
        </div>
      )}
    </div>
  );
}
