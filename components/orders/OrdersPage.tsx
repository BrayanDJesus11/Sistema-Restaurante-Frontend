"use client";

import { useState, useEffect, useMemo } from "react";
import {
  useApp,
  Order,
  OrderStatus,
  OrderType,
  OrderItem,
  OrderItemExtra,
  formatCurrency,
  getOrderElapsedMinutes,
  getOrderTimerStatus,
  isOrderDelayed,
} from "@/lib/store";
import {
  Plus,
  Trash2,
  Clock,
  CheckCircle,
  Truck,
  DollarSign,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Timer,
  AlertTriangle,
  ShoppingCart,
  MapPin,
  Users,
  Minus,
  Search,
  Filter,
} from "lucide-react";
import { obtenerIngredientes } from "@/lib/ingredientes";
import { CreateOrderModal } from "./CreateOrderModal";
import { OrderDetailModal } from "./OrderDetailModal";
import { CancelOrderModal } from "./CancelOrderModal";
import {
  obtenerPedidos,
  eliminarPedido,
  actualizarEstadoPedido,
  agregarTiempo,
} from "@/lib/pedidos";
function OrderCard({
  order,
  onView,
  onDelete,
  onCancel,
}: {
  order: Order;
  onView: (o: Order) => void;
  onDelete: () => Promise<void>;
  onCancel: (o: Order) => void;
}) {
  const { dispatch } = useApp();
  const [elapsed, setElapsed] = useState(getOrderElapsedMinutes(order));
  const totalMinutes = order.estimatedMinutes + order.additionalMinutes;
  const timerStatus = getOrderTimerStatus(order);
  const delayed = isOrderDelayed(order);

  const [showCustomTime, setShowCustomTime] = useState(false);
  const [customMinutes, setCustomMinutes] = useState("");

  const handleUpdateStatus = async (status: string) => {
    try {
      await actualizarEstadoPedido(order.id, status);

      if (status === "LISTO") {
        const ingredientes = await obtenerIngredientes();

        dispatch({
          type: "CARGAR_INGREDIENTES",
          payload: ingredientes,
        });
      }

      await onDelete();
    } catch (error) {
      console.error(error);

      alert("No fue posible actualizar el estado del pedido.");
    }
  };

  function getBusinessDayBounds(
    date: Date,
    startHour: number,
    endHour: number,
  ) {
    const start = new Date(date);
    start.setHours(startHour, 0, 0, 0);

    const end = new Date(start);

    if (endHour <= startHour) {
      end.setDate(end.getDate() + 1);
    }

    end.setHours(endHour, 0, 0, 0);

    return { start, end };
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Deseas eliminar este pedido?")) return;

    try {
      await eliminarPedido(id);

      await onDelete();
    } catch (error) {
      console.error(error);

      alert("No fue posible eliminar el pedido.");
    }
  };

  useEffect(() => {
    const estado = order.status.toLowerCase();

    if (estado !== "pendiente" && estado !== "listo") return;
    const interval = setInterval(
      () => setElapsed(getOrderElapsedMinutes(order)),
      10000,
    );
    return () => clearInterval(interval);
  }, [order]);

  const statusConfig = {
    pendiente: {
      label: "Pendiente",
      color: "text-yellow-400",
      bg: "bg-yellow-400/10",
      border: "border-yellow-400/30",
    },
    listo: {
      label: "Listo",
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
      border: "border-emerald-400/30",
    },
    entregado: {
      label: "Entregado",
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      border: "border-blue-400/30",
    },
    pagado: {
      label: "Pagado",
      color: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/30",
    },
    cancelado: {
      label: "Cancelado",
      color: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/30",
    },
  };
  const typeConfig = {
    mesa: { label: "Mesa", icon: Users, color: "text-purple-400" },
    "para-llevar": {
      label: "Para llevar",
      icon: ShoppingCart,
      color: "text-blue-400",
    },
    domicilio: { label: "Domicilio", icon: MapPin, color: "text-emerald-400" },
  };
  const sc =
    statusConfig[order.status.toLowerCase() as keyof typeof statusConfig];
  const tc = typeConfig[order.type];

  const handleAddTime = async (minutes: number) => {
    try {
      await agregarTiempo(order.id, minutes);

      await onDelete();
    } catch (error) {
      console.error(error);

      alert("No fue posible agregar tiempo.");
    }
  };

  return (
    <div
      className={`stat-card rounded-2xl p-5 card-hover border transition-all ${delayed &&
        (order.status.toLowerCase() === "pendiente" ||
          order.status.toLowerCase() === "listo")
        ? "border-red-500/40 bg-red-500/5"
        : "border-white/8"
        }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center">
              <span className="text-sm font-black text-foreground truncate">
                #{order.orderNumber}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${sc.bg} ${sc.color} border ${sc.border}`}
              >
                {sc.label}
              </span>

              {delayed &&
                (order.status.toLowerCase() === "pendiente" ||
                  order.status.toLowerCase() === "listo") && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Retrasado
                  </span>
                )}
            </div>

            <div className={`flex items-center gap-1 mt-2 text-xs ${tc.color}`}>
              <tc.icon className="w-3 h-3" />
              {tc.label}
              {order.type === "mesa" && ` · Mesa ${order.tableNumber}`}
              {order.type !== "mesa" &&
                order.customerName &&
                ` · ${order.customerName}`}
            </div>
          </div>
        </div>
        <div className="flex items-start gap-2">
          {(order.status.toLowerCase() === "pendiente" ||
            order.status.toLowerCase() === "listo") && (
              <div
                className={`text-right ${timerStatus === "rojo"
                  ? "timer-red"
                  : timerStatus === "amarillo"
                    ? "timer-yellow"
                    : "timer-green"
                  }`}
              >
                <div className="text-lg font-black flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {elapsed}m
                </div>

                <div className="text-xs text-muted-foreground">
                  / {totalMinutes}m
                </div>
              </div>
            )}

          <button
            onClick={() => handleDelete(order.id)}
            className="w-7 h-7 rounded-lg glass border border-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-1 mb-3">
        {order.items.map((item) => (
          <div
            key={`${item.productId}-${item.quantity}`}
            className="text-xs text-muted-foreground flex justify-between"
          >
            <span>
              {item.quantity}x {item.productName}
            </span>
            <span>{formatCurrency(item.subtotal)}</span>
          </div>
        ))}
      </div>

      {/* Timer progress */}
      {(order.status.toLowerCase() === "pendiente" ||
        order.status.toLowerCase() === "listo") && (
          <div className="mb-3">
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (elapsed / totalMinutes) * 100)}%`,
                  background:
                    timerStatus === "rojo"
                      ? "oklch(0.65 0.22 27)"
                      : timerStatus === "amarillo"
                        ? "oklch(0.85 0.18 90)"
                        : "oklch(0.70 0.18 140)",
                }}
              />
            </div>
          </div>
        )}

      {/* Total */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-muted-foreground">Total</span>
        <span className="text-base font-black text-primary">
          {formatCurrency(order.total)}
        </span>
      </div>

      {/* Add time buttons (pending/ready only) */}
      {(order.status.toLowerCase() === "pendiente" ||
        order.status.toLowerCase() === "listo") && (
          <div className="flex gap-2 mb-3">
            {[5, 10].map((m) => (
              <button
                key={m}
                onClick={() => handleAddTime(m)}
                className="flex-1 py-1.5 rounded-lg glass border border-white/10 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
              >
                +{m}m
              </button>
            ))}

            <button
              onClick={() => setShowCustomTime(!showCustomTime)}
              className="flex-1 py-1.5 rounded-lg glass border border-primary/20 text-xs text-primary hover:bg-primary/10 transition-all"
            >
              +Personalizado
            </button>
          </div>
        )}
      {showCustomTime && (
        <div className="flex gap-2 mb-3">
          <input
            type="number"
            value={customMinutes}
            onChange={(e) => setCustomMinutes(e.target.value)}
            placeholder="Minutos"
            className="flex-1 px-3 py-2 rounded-lg glass border border-white/10 text-sm text-foreground focus:outline-none focus:border-primary/50"
          />

          <button
            onClick={async () => {
              if (!customMinutes || Number(customMinutes) <= 0) return;

              await handleAddTime(Number(customMinutes));

              setCustomMinutes("");
              setShowCustomTime(false);
            }}
            className="px-4 py-2 rounded-lg gradient-brand text-white text-sm font-bold"
          >
            Agregar
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <button
            onClick={() => onView(order)}
            className="flex-1 py-2 rounded-xl glass border border-white/10 text-xs font-semibold text-foreground hover:border-primary/30 transition-all"
          >
            Detalles
          </button>

          {(order.status.toLowerCase() === "pendiente" ||
            (order.status.toLowerCase() === "cancelado" &&
              order.mantenerParaVenta === true)) && (
              <button
                onClick={() => handleUpdateStatus("LISTO")}
                className="flex-1 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/30 transition-all"
              >
                Marcar Listo
              </button>
            )}

          {order.status.toLowerCase() === "listo" && (
            <button
              onClick={() => handleUpdateStatus("ENTREGADO")}
              className="flex-1 py-2 rounded-xl bg-blue-500/20 border border-blue-500/30 text-xs font-semibold text-blue-400 hover:bg-blue-500/30 transition-all"
            >
              Entregar
            </button>
          )}

          {order.status.toLowerCase() === "entregado" && (
            <button
              onClick={() => onView(order)}
              className="flex-1 py-2 rounded-xl bg-primary/20 border border-primary/30 text-xs font-semibold text-primary hover:bg-primary/30 transition-all"
            >
              Pagar
            </button>
          )}
        </div>

        {(order.status.toLowerCase() === "pendiente" ||
          (order.status.toLowerCase() === "listo" &&
            order.mantenerParaVenta !== true)) && (
            <button
              onClick={() => onCancel(order)}
              className="w-full py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-xs font-semibold text-red-400 hover:bg-red-500/30 transition-all"
            >
              Cancelar Pedido
            </button>
          )}
      </div>
    </div>
  );
}

function getBusinessDayBounds(date: Date, startHour: number, endHour: number) {
  const start = new Date(date);
  start.setHours(startHour, 0, 0, 0);

  const end = new Date(start);

  if (endHour <= startHour) {
    end.setDate(end.getDate() + 1);
  }

  end.setHours(endHour, 0, 0, 0);

  return { start, end };
}

export function OrdersPage() {
  const { state, dispatch } = useApp();
  const [pedidos, setPedidos] = useState<any[]>([]);
  const isOwner = state.user?.role === "dueno";
  const jornadaConfigurada = state.settings.jornadaConfigurada;
  const jornadaActiva = state.settings.jornadaActiva;
  const [showCreate, setShowCreate] = useState(false);
  const [editOrder, setEditOrder] = useState<Order | undefined>();
  const [cancelOrder, setCancelOrder] = useState<Order | null>(null);
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<OrderType | "all">("all");
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);

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

  const businessOrders = useMemo(() => {
    const [sh, sm] = state.settings.workdayStart.split(":").map(Number);
    const [eh, em] = state.settings.workdayEnd.split(":").map(Number);

    const { start, end } = getBusinessDayBounds(selectedDate, sh, eh);

    start.setMinutes(sm);
    end.setMinutes(em);

    console.log("JORNADA", {
      workdayStart: state.settings.workdayStart,
      workdayEnd: state.settings.workdayEnd,
      start: start.toString(),
      end: end.toString(),
      pedidos: pedidos.map((o: any) => ({
        id: o.id,
        numero: o.orderNumber,
        createdAt: o.createdAt,
        fechaInterpretada: new Date(o.createdAt).toString(),
      })),
    });

    return pedidos.filter((o: any) => {
      const d = new Date(o.createdAt);
      return d >= start && d <= end;
    });
  }, [pedidos, state.settings, selectedDate]);

  const filtered = useMemo(() => {
    return businessOrders.filter((o: any) => {
      if (statusFilter !== "all" && o.status.toLowerCase() !== statusFilter)
        return false;

      if (typeFilter !== "all" && o.type !== typeFilter) return false;

      if (
        search &&
        !o.orderNumber.toLowerCase().includes(search.toLowerCase()) &&
        !(o.customerName ?? "").toLowerCase().includes(search.toLowerCase())
      )
        return false;

      return true;
    });
  }, [businessOrders, statusFilter, typeFilter, search]);

  const counts = useMemo(
    () => ({
      pendiente: businessOrders.filter((o: any) => o.status === "PENDIENTE")
        .length,
      listo: businessOrders.filter((o: any) => o.status === "LISTO").length,
      entregado: businessOrders.filter((o: any) => o.status === "ENTREGADO")
        .length,
      pagado: businessOrders.filter((o: any) => o.status === "PAGADO").length,
      cancelado: businessOrders.filter((o: any) => o.status === "CANCELADO")
        .length,
    }),
    [businessOrders],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">

        {/* Título */}
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Gestión de Pedidos
          </h2>
          <p className="text-sm text-muted-foreground">
            {businessOrders.length} pedidos en la jornada
          </p>
        </div>

        {/* Controles a la derecha */}
        <div className="flex flex-wrap items-center gap-3">

          {/* Selector de fecha */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl glass border border-primary/20 text-primary text-sm">

            <button
              type="button"
              onClick={() => {
                const fecha = new Date(selectedDate);
                fecha.setDate(fecha.getDate() - 1);
                setSelectedDate(fecha);
              }}
              className="p-1 rounded-lg hover:bg-white/10"
              title="Día anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCalendar(!showCalendar)}
                className="flex items-center gap-2"
              >
                <CalendarDays className="w-4 h-4" />
                {selectedDate.toLocaleDateString("es-CO")}
              </button>

              {showCalendar && (
                <input
                  type="date"
                  className="absolute top-10 right-0 z-50 rounded-lg bg-zinc-900 border border-white/10 p-2"
                  value={`${selectedDate.getFullYear()}-${String(
                    selectedDate.getMonth() + 1,
                  ).padStart(2, "0")}-${String(
                    selectedDate.getDate(),
                  ).padStart(2, "0")}`}
                  onChange={(e) => {
                    if (!e.target.value) return;

                    const [anio, mes, dia] = e.target.value.split("-").map(Number);

                    setSelectedDate(new Date(anio, mes - 1, dia));
                    setShowCalendar(false);
                  }}
                />
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                const fecha = new Date(selectedDate);
                fecha.setDate(fecha.getDate() + 1);
                setSelectedDate(fecha);
              }}
              className="p-1 rounded-lg hover:bg-white/10"
              title="Día siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

          </div>

          {/* Botón Nuevo Pedido */}
          <button
            type="button"
            onClick={() => {
              if (!jornadaActiva) return;
              setShowCreate(true);
            }}
            disabled={!jornadaActiva}
            title={
              !jornadaActiva
                ? "La jornada operativa no está dentro del horario permitido"
                : "Crear nuevo pedido"
            }
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all ${jornadaActiva
                ? "gradient-brand hover:opacity-90"
                : "bg-gray-500/30 opacity-50 cursor-not-allowed"
              }`}
          >
            <Plus className="w-4 h-4" />
            Nuevo Pedido
          </button>

        </div>
      </div>

      {!jornadaActiva && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10">
          <p className="text-sm text-amber-400 font-semibold">
            {!jornadaConfigurada
              ? "Jornada operativa no configurada"
              : "Fuera del horario de la jornada"}
          </p>

          <p className="text-xs text-muted-foreground mt-1">
            {!jornadaConfigurada
              ? "El administrador debe configurar y guardar la jornada operativa antes de registrar nuevos pedidos."
              : `La jornada está configurada de ${state.settings.workdayStart} a ${state.settings.workdayEnd}. La creación de pedidos se habilitará cuando comience el horario.`}
          </p>
        </div>
      )}

      {/* Status summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {[
          {
            key: "pendiente",
            icon: "🟡",
            label: "Pendientes",
            count: counts.pendiente,
            color: "text-yellow-400",
            bg: "bg-yellow-400/10",
          },
          {
            key: "listo",
            icon: "🟢",
            label: "Listos",
            count: counts.listo,
            color: "text-emerald-400",
            bg: "bg-emerald-400/10",
          },
          {
            key: "entregado",
            icon: "🔵",
            label: "Entregados",
            count: counts.entregado,
            color: "text-blue-400",
            bg: "bg-blue-400/10",
          },
          {
            key: "pagado",
            icon: "🟠",
            label: "Pagados",
            count: counts.pagado,
            color: "text-primary",
            bg: "bg-primary/10",
          },
          {
            key: "cancelado",
            icon: "🔴",
            label: "Cancelados",
            count: counts.cancelado,
            color: "text-red-400",
            bg: "bg-red-500/10",
          },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() =>
              setStatusFilter(
                s.key === statusFilter ? "all" : (s.key as OrderStatus),
              )
            }
            className={`rounded-xl p-3 text-left transition-all border ${statusFilter === s.key
              ? `${s.bg} border-current ${s.color}`
              : "stat-card border-white/8"
              }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-lg">{s.icon}</span>

              <div
                className={`text-xl font-black ${statusFilter === s.key ? s.color : "text-foreground"
                  }`}
              >
                {s.count}
              </div>
            </div>

            <div className="text-[11px] text-muted-foreground leading-tight">
              {s.label}
            </div>
          </button>
        ))}
      </div>


      {/* Filters */}
      <div className="flex flex-col xl:flex-row xl:items-center gap-3">

        {/* Buscador */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar pedido..."
            className="w-full pl-9 pr-4 py-3 rounded-xl glass border border-white/10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
          />
        </div>

        {/* Tipos de pedido */}
        <div className="flex flex-wrap items-center gap-2">

          {[
            { value: "all", label: "Todos" },
            { value: "mesa", label: "Mesa" },
            { value: "para-llevar", label: "Para llevar" },
            { value: "domicilio", label: "Domicilio" },
          ].map((opcion) => (
            <button
              key={opcion.value}
              type="button"
              onClick={() => setTypeFilter(opcion.value as OrderType | "all")}
              className={`px-4 py-3 rounded-xl text-xs font-semibold border whitespace-nowrap transition-all ${typeFilter === opcion.value
                ? "gradient-brand text-white border-transparent"
                : "glass border-white/10 text-muted-foreground hover:text-foreground"
                }`}
            >
              {opcion.label}
            </button>
          ))}

        </div>
      </div>

      {/* Orders grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No se encontraron pedidos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            )
            .map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onView={setViewOrder}
                onDelete={cargarPedidos}
                onCancel={setCancelOrder}
              />
            ))}
        </div>
      )}

      {showCreate && (
        <CreateOrderModal
          order={editOrder}
          onClose={() => {
            setShowCreate(false);
            setEditOrder(undefined);
          }}
          onCreated={cargarPedidos}
        />
      )}
      {viewOrder && (
        <OrderDetailModal
          order={viewOrder}
          onClose={() => setViewOrder(null)}
          onUpdated={cargarPedidos}
          onEdit={(order) => {
            setViewOrder(null);
            setEditOrder(order);
            setShowCreate(true);
          }}
        />
      )}

      {cancelOrder && (
        <CancelOrderModal
          order={cancelOrder}
          onClose={() => setCancelOrder(null)}
          onUpdated={cargarPedidos}
        />
      )}
    </div>
  );
}
