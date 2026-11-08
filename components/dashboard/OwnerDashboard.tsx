"use client";

import { useEffect, useMemo, useState } from "react";
import { obtenerPedidos } from "@/lib/pedidos";
import {
  useApp,
  Order,
  OrderItem,
  formatCurrency,
  calculateProductCost,
  calculateAvailableQuantity,
  getTotalStock,
} from "@/lib/store";
import { obtenerProductos } from "@/lib/productos";
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Package,
  AlertTriangle,
  DollarSign,
  Clock,
  ChefHat,
  Calendar,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = [
  "oklch(0.72 0.19 52)",
  "oklch(0.70 0.18 140)",
  "oklch(0.68 0.17 200)",
  "oklch(0.75 0.16 300)",
  "oklch(0.65 0.22 27)",
];

function StatWidget({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  trend,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: any;
  color: string;
  trend?: number;
}) {
  return (
    <div className="stat-card rounded-2xl p-5 card-hover">
      <div className="flex items-start justify-between mb-4">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center`}
          style={{ background: `${color}20` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {trend !== undefined && (
          <div
            className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${trend >= 0
              ? "text-emerald-400 bg-emerald-400/10"
              : "text-red-400 bg-red-400/10"
              }`}
          >
            {trend >= 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="text-2xl font-black text-foreground mb-1">{value}</div>
      <div className="text-sm font-medium text-muted-foreground">{title}</div>
      <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>
    </div>
  );
}

const COLORES_CATEGORIA: Record<string, string> = {
  Hamburguesas: "#f97316",
  "Perros Calientes": "#22c55e",
  Acompañamientos: "#3b82f6",
  Bebidas: "#a855f7",
  Postres: "#ef4444",
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass rounded-xl p-3 border border-white/10 text-xs">
        <p className="text-muted-foreground mb-2">{label}</p>
        {payload.map((p: any) => (
          <p
            key={p.dataKey}
            style={{ color: p.color }}
            className="font-semibold"
          >
            {p.name}: {formatCurrency(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

function getBusinessDayBounds(date: Date, startTime: string, endTime: string) {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  const start = new Date(date);
  start.setHours(startHour, startMinute, 0, 0);

  const end = new Date(date);
  end.setHours(endHour, endMinute, 0, 0);

  if (endHour <= startHour) {
    end.setDate(end.getDate() + 1);
  }

  return { start, end };
}

export function OwnerDashboard() {
  const { state, dispatch } = useApp();
  const [pedidos, setPedidos] = useState<Order[]>([]);

  useEffect(() => {
    const cargarPedidos = async () => {
      try {
        const datos = await obtenerPedidos();
        setPedidos(datos);
      } catch (error) {
        console.error("No fue posible obtener los pedidos:", error);
      }
    };

    cargarPedidos();
  }, []);

  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const productos = await obtenerProductos();

        dispatch({
          type: "CARGAR_PRODUCTOS",
          payload: productos,
        });
      } catch (error) {
        console.error("No fue posible cargar los productos:", error);
      }
    };

    cargarProductos();
  }, [dispatch]);

  const [selectedDate, setSelectedDate] = useState(() => {
    const ahora = new Date();

    const inicio = state.settings.workdayStart;
    const fin = state.settings.workdayEnd;

    const [startHour, startMinute] = inicio.split(":").map(Number);
    const [endHour, endMinute] = fin.split(":").map(Number);

    const ahoraMinutos = ahora.getHours() * 60 + ahora.getMinutes();
    const inicioMinutos = startHour * 60 + startMinute;
    const finMinutos = endHour * 60 + endMinute;

    const cruzaMedianoche = finMinutos <= inicioMinutos;

    const fecha = new Date(ahora);

    if (cruzaMedianoche && ahoraMinutos < finMinutos) {
      fecha.setDate(fecha.getDate() - 1);
    }

    return fecha;
  });

  const [showCalendar, setShowCalendar] = useState(false);

  const jornadaActual = useMemo(() => {
    const inicio = state.settings.workdayStart;
    const fin = state.settings.workdayEnd;

    return getBusinessDayBounds(selectedDate, inicio, fin);
  }, [selectedDate, state.settings.workdayStart, state.settings.workdayEnd]);

  const businessOrders = useMemo(() => {
    return pedidos.filter((o) => {
      const fechaPedido = new Date(o.createdAt);

      return (
        fechaPedido >= jornadaActual.start && fechaPedido <= jornadaActual.end
      );
    });
  }, [pedidos, jornadaActual]);

  const weeklyData = useMemo(() => {
    const [startHour, startMinute] = state.settings.workdayStart
      .split(":")
      .map(Number);

    const [endHour, endMinute] = state.settings.workdayEnd
      .split(":")
      .map(Number);

    // Calcular el lunes de la semana seleccionada
    const lunes = new Date(selectedDate);
    const diaSemana = lunes.getDay();
    const diferencia = diaSemana === 0 ? -6 : 1 - diaSemana;

    lunes.setDate(lunes.getDate() + diferencia);
    lunes.setHours(0, 0, 0, 0);

    const dias = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

    const inicioMinutos = startHour * 60 + startMinute;
    const finMinutos = endHour * 60 + endMinute;
    const cruzaMedianoche = finMinutos <= inicioMinutos;

    return dias.map((day, index) => {
      const inicio = new Date(lunes);
      inicio.setDate(lunes.getDate() + index);
      inicio.setHours(startHour, startMinute, 0, 0);

      const fin = new Date(inicio);
      fin.setHours(endHour, endMinute, 0, 0);

      if (cruzaMedianoche) {
        fin.setDate(fin.getDate() + 1);
      }

      // Ingresos de pedidos pagados en cada jornada
      const pedidosDia = pedidos.filter((pedido) => {
        const fechaPedido = new Date(pedido.createdAt);

        return (
          fechaPedido >= inicio &&
          fechaPedido < fin &&
          pedido.status?.toLowerCase() === "pagado"
        );
      });

      const ventas = pedidosDia.reduce(
        (total, pedido) => total + pedido.total,
        0,
      );

      // Utilidad estimada a partir del costo de producción
      const costo = pedidosDia.reduce((total, pedido) => {
        if (typeof pedido.costoProduccion === "number") {
          return total + pedido.costoProduccion;
        }

        const costoPedido = pedido.items.reduce((subtotal, item) => {
          const producto = state.products.find((p) => p.id === item.productId);

          if (!producto) return subtotal;

          return (
            subtotal +
            calculateProductCost(producto, state.ingredients) * item.quantity
          );
        }, 0);

        return total + costoPedido;
      }, 0);

      return {
        day,
        ventas,
        utilidad: ventas - costo,
      };
    });
  }, [
    pedidos,
    selectedDate,
    state.settings.workdayStart,
    state.settings.workdayEnd,
    state.products,
    state.ingredients,
  ]);

  const metrics = useMemo(() => {
    const todayOrders = businessOrders;
    const paidOrders = todayOrders.filter(
      (o) => o.status?.toLowerCase() === "pagado",
    );
    const dailySales = paidOrders.reduce((sum, o) => sum + o.total, 0);
    const weeklySales = weeklyData.reduce((sum, d) => sum + d.ventas, 0);
    const monthlyProfit =
      weeklyData.reduce((sum, d) => sum + d.utilidad, 0) * 4;
    const activeOrders = businessOrders.filter(
      (o) =>
        o.status?.toLowerCase() === "pendiente" ||
        o.status?.toLowerCase() === "listo",
    );
    const totalExpenses = state.operationalExpenses.reduce(
      (sum, e) => sum + e.amount,
      0,
    );

    const lowStock = state.ingredients.filter((i) => {
      const total = getTotalStock(i);
      return total < i.minStock;
    });

    const nearExpiry = state.ingredients.filter((i) => {
      return i.batches.some((b) => {
        if (!b.expirationDate) return false;
        const days =
          (new Date(b.expirationDate).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24);
        return days <= state.settings.expirationAlertDays && days >= 0;
      });
    });
    const productSales: Record<string, number> = {};

    businessOrders.forEach((o) => {
      o.items.forEach((item: OrderItem) => {
        productSales[item.productName] =
          (productSales[item.productName] || 0) + item.quantity;
      });
    });
    const topProducts = Object.entries(productSales)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, qty]) => ({ name, qty }));

    const paymentTotals = {
      efectivo: paidOrders
        .filter((o) => o.paymentMethod === "efectivo")
        .reduce((sum, o) => sum + (o.cashAmount ?? o.total), 0),

      transferencia: paidOrders
        .filter((o) => o.paymentMethod === "transferencia")
        .reduce((sum, o) => sum + (o.transferAmount ?? o.total), 0),

      mixto: paidOrders
        .filter((o) => o.paymentMethod === "mixto")
        .reduce(
          (sum, o) => sum + (o.cashAmount ?? 0) + (o.transferAmount ?? 0),
          0,
        ),
    };

    return {
      dailySales,
      weeklySales,
      monthlyProfit,
      activeOrders,
      totalExpenses,
      lowStock,
      nearExpiry,
      topProducts,
      paymentTotals,
      todayOrderCount: todayOrders.length,
    };
  }, [state, businessOrders]);

  const productCostData = state.products.slice(0, 5).map((p) => ({
    name: p.name.length > 15 ? p.name.substring(0, 15) + "…" : p.name,
    costo: Math.round(calculateProductCost(p, state.ingredients)),
    precio: p.price,
    margen: Math.round(
      ((p.price - calculateProductCost(p, state.ingredients)) / p.price) * 100,
    ),
  }));

  const categoryData = useMemo(() => {
    const cats: Record<string, number> = {};

    // Considerar solamente pedidos pagados de la jornada seleccionada
    const pedidosPagados = businessOrders.filter(
      (pedido) => pedido.status?.toLowerCase() === "pagado",
    );

    pedidosPagados.forEach((pedido) => {
      pedido.items.forEach((item: OrderItem) => {
        // Buscar el producto por su identificador
        const producto =
          state.products.find((p) => p.id === item.productId) ??
          state.products.find(
            (p) =>
              p.name.trim().toLowerCase() ===
              item.productName.trim().toLowerCase(),
          );

        if (!producto) {
          console.warn(
            "No se encontró el producto para categorizar:",
            item.productName,
            item.productId,
          );
          return;
        }

        cats[producto.category] =
          (cats[producto.category] || 0) + item.subtotal;
      });
    });

    return Object.entries(cats).map(([name, value]) => ({
      name,
      value,
    }));
  }, [businessOrders, state.products]);

  return (
    <div className="space-y-6">
      {/* Greeting */}
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-foreground">
            Buen día, {state.user?.name?.split(" ")[0]}
          </h2>

          <p className="text-muted-foreground text-sm mt-1">
            {selectedDate.toLocaleDateString("es-CO", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-xl glass border border-primary/20 text-primary text-sm">
          <button
            onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() - 1);
              setSelectedDate(d);
            }}
            className="p-1 rounded-lg hover:bg-white/10"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowCalendar(!showCalendar)}
              className="flex items-center gap-2"
            >
              <CalendarDays className="w-4 h-4" />

              {selectedDate.toLocaleDateString("es-CO")}
            </button>

            {showCalendar && (
              <input
                type="date"
                className="absolute top-10 right-0 rounded-lg bg-zinc-900 border border-white/10 p-2"
                value={`${selectedDate.getFullYear()}-${String(
                  selectedDate.getMonth() + 1,
                ).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(
                  2,
                  "0",
                )}`}
                onChange={(e) => {
                  const [y, m, d] = e.target.value.split("-").map(Number);
                  setSelectedDate(new Date(y, m - 1, d));
                  setShowCalendar(false);
                }}
              />
            )}
          </div>

          <button
            onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() + 1);
              setSelectedDate(d);
            }}
            className="p-1 rounded-lg hover:bg-white/10"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatWidget
          title="Ventas del Día"
          value={formatCurrency(metrics.dailySales)}
          subtitle="Pedidos pagados"
          icon={DollarSign}
          color="oklch(0.72 0.19 52)"
          trend={12}
        />

        <div className="stat-card rounded-2xl p-5 card-hover">
          <div className="flex items-start justify-between mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "oklch(0.70 0.18 140 / 20%)" }}
            >
              <DollarSign
                className="w-5 h-5"
                style={{ color: "oklch(0.70 0.18 140)" }}
              />
            </div>

            <div className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full text-emerald-400 bg-emerald-400/10">
              <TrendingUp className="w-3 h-3" />
              8%
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="font-bold text-foreground">
                {formatCurrency(metrics.paymentTotals.efectivo)}
              </span>
              <span className="text-muted-foreground">Efectivo</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-bold text-foreground">
                {formatCurrency(metrics.paymentTotals.transferencia)}
              </span>
              <span className="text-muted-foreground">Transferencia</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-bold text-foreground">
                {formatCurrency(metrics.paymentTotals.mixto)}
              </span>
              <span className="text-muted-foreground">Mixto</span>
            </div>
          </div>

          <div className="text-sm font-medium text-muted-foreground mt-4">
            Ingresos por Método de Pago
          </div>
        </div>

        <StatWidget
          title="Pedidos de la Jornada"
          value={String(metrics.todayOrderCount)}
          subtitle="Pedidos registrados"
          icon={ArrowUpRight}
          color="oklch(0.68 0.17 200)"
          trend={5}
        />

        <StatWidget
          title="Pedidos Activos"
          value={String(metrics.activeOrders.length)}
          subtitle="En proceso ahora"
          icon={ShoppingCart}
          color="oklch(0.75 0.16 300)"
        />
      </div>

      {/* Alert summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className={`rounded-xl p-4 border ${metrics.activeOrders.filter((o) => {
            const elapsed =
              (Date.now() - new Date(o.createdAt).getTime()) / 60000;
            return elapsed > o.estimatedMinutes + o.additionalMinutes;
          }).length > 0
            ? "bg-red-500/10 border-red-500/30"
            : "stat-card"
            }`}
        >
          <Clock className="w-5 h-5 text-red-400 mb-2" />
          <div className="text-xl font-black text-foreground">
            {
              metrics.activeOrders.filter((o) => {
                const elapsed =
                  (Date.now() - new Date(o.createdAt).getTime()) / 60000;
                return elapsed > o.estimatedMinutes + o.additionalMinutes;
              }).length
            }
          </div>
          <div className="text-xs text-muted-foreground">
            Pedidos retrasados
          </div>
        </div>
        <div
          className={`rounded-xl p-4 border ${metrics.lowStock.length > 0 ? "bg-yellow-500/10 border-yellow-500/30" : "stat-card"}`}
        >
          <Package className="w-5 h-5 text-yellow-400 mb-2" />
          <div className="text-xl font-black text-foreground">
            {metrics.lowStock.length}
          </div>
          <div className="text-xs text-muted-foreground">Stock bajo</div>
        </div>
        <div
          className={`rounded-xl p-4 border ${metrics.nearExpiry.length > 0 ? "bg-orange-500/10 border-orange-500/30" : "stat-card"}`}
        >
          <AlertTriangle className="w-5 h-5 text-orange-400 mb-2" />
          <div className="text-xl font-black text-foreground">
            {metrics.nearExpiry.length}
          </div>
          <div className="text-xs text-muted-foreground">Próx. a vencer</div>
        </div>
        <div className="stat-card rounded-xl p-4 border border-white/8">
          <DollarSign className="w-5 h-5 text-blue-400 mb-2" />
          <div className="text-xl font-black text-foreground">
            {formatCurrency(metrics.totalExpenses)}
          </div>
          <div className="text-xs text-muted-foreground">Gastos mensuales</div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly sales chart */}
        <div className="lg:col-span-2 stat-card rounded-2xl p-5">
          <h3 className="text-sm font-bold text-foreground mb-4">
            Ventas y Utilidad Semanal
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={weeklyData}>
              <defs>
                <linearGradient id="gVentas" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="oklch(0.72 0.19 52)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="oklch(0.72 0.19 52)"
                    stopOpacity={0}
                  />
                </linearGradient>
                <linearGradient id="gUtilidad" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="oklch(0.70 0.18 140)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="oklch(0.70 0.18 140)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 5%)" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: "oklch(0.60 0.01 240)" }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "oklch(0.60 0.01 240)" }}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="ventas"
                name="Ventas"
                stroke="oklch(0.72 0.19 52)"
                fill="url(#gVentas)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="utilidad"
                name="Utilidad"
                stroke="oklch(0.70 0.18 140)"
                fill="url(#gUtilidad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category pie */}
        <div className="stat-card rounded-2xl p-5">
          <h3 className="text-sm font-bold text-foreground mb-4">
            Ventas por Categoría
          </h3>

          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="45%"
                  outerRadius={75}
                  innerRadius={40}
                  dataKey="value"
                  paddingAngle={3}
                >
                  {categoryData.map((entry, index) => {
                    const colores = [
                      "#f97316",
                      "#a855f7",
                      "#22c55e",
                      "#3b82f6",
                      "#ef4444",
                      "#06b6d4",
                      "#eab308",
                    ];

                    const color =
                      COLORES_CATEGORIA[entry.name] ??
                      colores[index % colores.length];

                    return (
                      <Cell key={entry.name} fill={color} />
                    );
                  })}
                </Pie>

                <Legend
                  formatter={(v) => (
                    <span
                      style={{
                        color: "oklch(0.80 0.01 240)",
                        fontSize: 12,
                      }}
                    >
                      {v}
                    </span>
                  )}
                />

                <Tooltip
                  formatter={(value) => [
                    formatCurrency(Number(value ?? 0)),
                    "Ventas",
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
              Sin datos aún
            </div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top products */}
        <div className="stat-card rounded-2xl p-5">
          <h3 className="text-sm font-bold text-foreground mb-4">
            Productos Más Vendidos
          </h3>
          {metrics.topProducts.length > 0 ? (
            <div className="space-y-3">
              {metrics.topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full gradient-brand flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-foreground font-medium">
                        {p.name}
                      </span>
                      <span className="text-primary font-semibold">
                        {p.qty} uds
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full gradient-brand"
                        style={{
                          width: `${(p.qty / (metrics.topProducts[0]?.qty || 1)) * 100}%`,
                          transition: "width 1s ease",
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground text-sm">
              Sin ventas registradas
            </div>
          )}
        </div>

        {/* Product cost analysis */}
        <div className="stat-card rounded-2xl p-5">
          <h3 className="text-sm font-bold text-foreground mb-4">
            Margen por Producto
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={productCostData} layout="vertical" barSize={8}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="oklch(1 0 0 / 5%)"
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: "oklch(0.60 0.01 240)" }}
                tickFormatter={(v) => `${v}%`}
                domain={[0, 100]}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 10, fill: "oklch(0.60 0.01 240)" }}
                width={90}
              />
              <Tooltip
                formatter={(v: any) => `${Number(v)}%`}
                contentStyle={{
                  background: "oklch(0.14 0.008 240)",
                  border: "1px solid oklch(1 0 0 / 8%)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar
                dataKey="margen"
                name="Margen %"
                fill="oklch(0.72 0.19 52)"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
