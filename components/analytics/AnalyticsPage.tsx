"use client";

import { useEffect, useMemo, useState } from "react";

import {
  useApp,
  formatCurrency,
  calculateProductCost,
  type Order,
  type Product,
  type Ingredient,
} from "@/lib/store";

import { obtenerPedidos } from "@/lib/pedidos";
import { obtenerProductos } from "@/lib/productos";
import { obtenerIngredientes } from "@/lib/ingredientes";
import { listarDesperdicios } from "@/lib/desperdicios";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
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

import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  AlertTriangle,
  Calendar,
} from "lucide-react";

const COLORS = [
  "oklch(0.72 0.19 52)",
  "oklch(0.70 0.18 140)",
  "oklch(0.68 0.17 200)",
  "oklch(0.75 0.16 300)",
  "oklch(0.65 0.22 27)"
]

const PERIOD_LABELS = {
  "7d": "Últimos 7 días",
  "30d": "Últimos 30 días",
  "90d": "Últimos 90 días",
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-xl p-3 border border-white/10 text-xs space-y-1">
      <p className="text-muted-foreground font-medium mb-2">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {typeof p.value === "number" && p.name !== "Pedidos"
            ? formatCurrency(p.value)
            : p.value}
        </p>
      ))}
    </div>
  )
}

interface DesperdicioAnalitica {
  id: string;
  fecha?: string | null;
  fechaIncidente?: string | null;
  motivo?: string | null;
  detalles?: Array<{
    costo?: number | string | null;
  }>;
}

const DIA_MS = 24 * 60 * 60 * 1000;

function obtenerFechaEnRango(
  valor: string | undefined,
  inicio: Date,
  fin: Date,
): Date | null {
  if (!valor) return null;

  const fecha = new Date(valor);

  if (
    Number.isNaN(fecha.getTime()) ||
    fecha < inicio ||
    fecha > fin
  ) {
    return null;
  }

  fecha.setHours(0, 0, 0, 0);
  return fecha;
}

function estaDentroDelRangoPorFecha(
  valor: string | undefined,
  inicio: Date,
  fin: Date,
): boolean {
  if (!valor) return false;

  // Evita desplazamientos de fecha por la zona horaria
  const soloFecha = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);

  const fecha = soloFecha
    ? new Date(
      Number(soloFecha[1]),
      Number(soloFecha[2]) - 1,
      Number(soloFecha[3]),
    )
    : new Date(valor);

  return (
    !Number.isNaN(fecha.getTime()) &&
    fecha >= inicio &&
    fecha <= fin
  );
}

export function AnalyticsPage() {
  const { state } = useApp();

  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("7d");

  const [pedidos, setPedidos] = useState<Order[]>([]);
  const [productos, setProductos] = useState<Product[]>([]);
  const [ingredientes, setIngredientes] = useState<Ingredient[]>([]);
  const [desperdicios, setDesperdicios] = useState<DesperdicioAnalitica[]>([]);

  const [cargandoPedidos, setCargandoPedidos] = useState(true);
  const [errorPedidos, setErrorPedidos] = useState(false);

  const [cargandoDatosComplementarios, setCargandoDatosComplementarios] = useState(true);
  const [errorDatosComplementarios, setErrorDatosComplementarios] = useState(false);

  // Cargar pedidos reales desde el backend
  useEffect(() => {
    let cancelado = false;

    async function cargarPedidos() {
      try {
        const datos = await obtenerPedidos();

        if (!cancelado) {
          setPedidos(Array.isArray(datos) ? (datos as Order[]) : []);
        }
      } catch (error) {
        console.error("Error al cargar pedidos para Analytics:", error);

        if (!cancelado) {
          setErrorPedidos(true);
        }
      } finally {
        if (!cancelado) {
          setCargandoPedidos(false);
        }
      }
    }

    cargarPedidos();

    return () => {
      cancelado = true;
    };
  }, []);

  // Cargar productos, ingredientes y desperdicios reales
  useEffect(() => {
    let cancelado = false;

    async function cargarDatosComplementarios() {
      try {
        const resultados = await Promise.allSettled([
          obtenerProductos(),
          obtenerIngredientes(),
          listarDesperdicios(),
        ]);

        if (cancelado) return;

        const [
          resultadoProductos,
          resultadoIngredientes,
          resultadoDesperdicios,
        ] = resultados;

        let huboError = false;

        // Productos
        if (
          resultadoProductos.status === "fulfilled" &&
          Array.isArray(resultadoProductos.value)
        ) {
          setProductos(resultadoProductos.value as Product[]);
        } else {
          console.error("No fue posible cargar los productos:", resultadoProductos);
          setProductos([]);
          huboError = true;
        }

        // Ingredientes
        if (
          resultadoIngredientes.status === "fulfilled" &&
          Array.isArray(resultadoIngredientes.value)
        ) {
          setIngredientes(resultadoIngredientes.value as Ingredient[]);
        } else {
          console.error("No fue posible cargar los ingredientes:", resultadoIngredientes);
          setIngredientes([]);
          huboError = true;
        }

        // Desperdicios
        if (
          resultadoDesperdicios.status === "fulfilled" &&
          Array.isArray(resultadoDesperdicios.value)
        ) {
          setDesperdicios(resultadoDesperdicios.value as DesperdicioAnalitica[]);
        } else {
          console.error("No fue posible cargar los desperdicios:", resultadoDesperdicios);
          setDesperdicios([]);
          huboError = true;
        }

        setErrorDatosComplementarios(huboError);
      } finally {
        if (!cancelado) {
          setCargandoDatosComplementarios(false);
        }
      }
    }

    cargarDatosComplementarios();

    return () => {
      cancelado = true;
    };
  }, []);

  // Fechas del período seleccionado
  const diasPeriodo = period === "7d" ? 7 : period === "30d" ? 30 : 90;

  const rango = useMemo(() => {
    const inicio = new Date();
    inicio.setHours(0, 0, 0, 0);
    inicio.setDate(inicio.getDate() - diasPeriodo + 1);

    const fin = new Date();
    fin.setHours(23, 59, 59, 999);

    return { inicio, fin, dias: diasPeriodo };
  }, [diasPeriodo]);

  // Pedidos creados durante el período, excluyendo los cancelados
  const pedidosPeriodo = useMemo(() => {
    return pedidos.filter((pedido) => {
      if (String(pedido.status).toLowerCase() === "cancelado") {
        return false;
      }

      return (
        obtenerFechaEnRango(
          pedido.createdAt,
          rango.inicio,
          rango.fin,
        ) !== null
      );
    });
  }, [pedidos, rango]);

  // Ventas efectivamente pagadas durante el período
  const pedidosPagadosPeriodo = useMemo(() => {
    return pedidos.filter((pedido) => {
      return (
        String(pedido.status).toLowerCase() === "pagado" &&
        obtenerFechaEnRango(
          pedido.paidAt,
          rango.inicio,
          rango.fin,
        ) !== null
      );
    });
  }, [pedidos, rango]);

  // Gastos operativos del período seleccionado
  const gastosPeriodo = useMemo(() => {
    return state.operationalExpenses.filter((gasto) =>
      estaDentroDelRangoPorFecha(
        gasto.date,
        rango.inicio,
        rango.fin,
      ),
    );
  }, [state.operationalExpenses, rango]);

  // Desperdicios reales del período seleccionado
  const desperdiciosPeriodo = useMemo(() => {
    return desperdicios.flatMap((registro) => {
      const fecha = registro.fechaIncidente || registro.fecha;

      if (
        !estaDentroDelRangoPorFecha(
          fecha ?? undefined,
          rango.inicio,
          rango.fin,
        )
      ) {
        return [];
      }

      const costo = (registro.detalles ?? []).reduce(
        (total, detalle) => {
          const valor = Number(detalle.costo ?? 0);

          return total + (Number.isFinite(valor) ? valor : 0);
        },
        0,
      );

      return [{
        id: registro.id,
        date: fecha,
        cost: costo,
      }];
    });
  }, [desperdicios, rango]);

  const wasteCostTotal = useMemo(() => {
    return desperdiciosPeriodo.reduce(
      (total, registro) => total + registro.cost,
      0,
    );
  }, [desperdiciosPeriodo]);

  // Gráficas construidas con pedidos reales
  const chartData = useMemo(() => {
    const numeroBloques =
      period === "90d" ? Math.ceil(rango.dias / 7) : rango.dias;

    const datos = Array.from({ length: numeroBloques }, (_, i) => {
      const fecha = new Date(rango.inicio);

      fecha.setDate(
        fecha.getDate() + (period === "90d" ? i * 7 : i),
      );

      let label: string;

      if (period === "7d") {
        label = fecha.toLocaleDateString("es-CO", {
          weekday: "short",
        });
      } else if (period === "30d") {
        label = fecha.toLocaleDateString("es-CO", {
          day: "2-digit",
          month: "short",
        });
      } else {
        label = `Sem ${i + 1}`;
      }

      return {
        label,
        ventas: 0,
        costo: 0,
        pedidos: 0,
      };
    });

    function obtenerIndice(fechaValor: string | undefined): number {
      const fecha = obtenerFechaEnRango(
        fechaValor,
        rango.inicio,
        rango.fin,
      );

      if (!fecha) return -1;

      const diasTranscurridos = Math.floor(
        (fecha.getTime() - rango.inicio.getTime()) / DIA_MS,
      );

      const indice =
        period === "90d"
          ? Math.floor(diasTranscurridos / 7)
          : diasTranscurridos;

      return indice >= 0 && indice < datos.length ? indice : -1;
    }

    // Volumen de pedidos por fecha de creación
    pedidosPeriodo.forEach((pedido) => {
      const indice = obtenerIndice(pedido.createdAt);

      if (indice >= 0) {
        datos[indice].pedidos += 1;
      }
    });

    // Ingresos y costos registrados por fecha de pago
    pedidosPagadosPeriodo.forEach((pedido) => {
      const indice = obtenerIndice(pedido.paidAt);

      if (indice < 0) return;

      const total = Number(pedido.total);

      if (Number.isFinite(total)) {
        datos[indice].ventas += total;
      }

      if (pedido.costoProduccion != null) {
        const costo = Number(pedido.costoProduccion);

        if (Number.isFinite(costo)) {
          datos[indice].costo += costo;
        }
      }
    });

    return datos;
  }, [period, rango, pedidosPeriodo, pedidosPagadosPeriodo]);

  // Indicadores calculados a partir de las gráficas
  const totals = useMemo(() => {
    const ventas = chartData.reduce((s, d) => s + d.ventas, 0);
    const costo = chartData.reduce((s, d) => s + d.costo, 0);
    const cantidadPedidos = chartData.reduce(
      (s, d) => s + d.pedidos,
      0,
    );

    const pedidosPagados = pedidosPagadosPeriodo.length;
    const utilidad = ventas - costo;
    const margen =
      ventas > 0 ? Math.round((utilidad / ventas) * 100) : 0;

    const gastos = gastosPeriodo.reduce(
      (s, gasto) => s + gasto.amount,
      0,
    );

    const utilidadNeta = utilidad - gastos - wasteCostTotal;

    return {
      ventas,
      costo,
      pedidos: cantidadPedidos,
      pedidosPagados,
      utilidad,
      margen,
      gastos,
      utilidadNeta,
    };
  }, [chartData, gastosPeriodo, pedidosPagadosPeriodo, wasteCostTotal]);
  // Productos vendidos en pedidos pagados del período
  const productPerformance = useMemo(() => {
    const perfMap: Record<
      string,
      { name: string; qty: number; revenue: number }
    > = {};

    pedidosPagadosPeriodo.forEach((pedido) => {
      pedido.items.forEach((item) => {
        if (!perfMap[item.productId]) {
          perfMap[item.productId] = {
            name: item.productName,
            qty: 0,
            revenue: 0,
          };
        }

        perfMap[item.productId].qty += Number(item.quantity) || 0;
        perfMap[item.productId].revenue += Number(item.subtotal) || 0;
      });
    });

    return Object.values(perfMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);
  }, [pedidosPagadosPeriodo]);

  // Distribución de pedidos por tipo durante el período
  const orderTypeData = useMemo(() => {
    const types: Record<string, number> = {};

    pedidosPeriodo.forEach((pedido) => {
      const label = {
        mesa: "Mesa",
        "para-llevar": "Para llevar",
        domicilio: "Domicilio",
      }[pedido.type];

      if (label) {
        types[label] = (types[label] || 0) + 1;
      }
    });

    return Object.entries(types).map(([name, value]) => ({
      name,
      value,
    }));
  }, [pedidosPeriodo]);

  const pedidosSinCosto = pedidosPagadosPeriodo.filter(
    (pedido) => pedido.costoProduccion == null,
  ).length;


  // Margen de utilidad calculado con productos e ingredientes 
  const marginData = useMemo(() => {
    return productos
      .map((producto) => {
        const costo = calculateProductCost(producto, ingredientes);

        const margen =
          producto.price > 0
            ? Math.round(((producto.price - costo) / producto.price) * 100)
            : 0;

        return {
          name:
            producto.name.length > 14
              ? producto.name.slice(0, 14) + "…"
              : producto.name,
          margen,
          costo: Math.round(costo),
          precio: producto.price,
        };
      })
      .sort((a, b) => b.margen - a.margen);
  }, [productos, ingredientes]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Analíticas y Reportes</h2>
          <p className="text-sm text-muted-foreground">Vista financiera del restaurante</p>
        </div>
        <div className="flex gap-2">
          {(["7d", "30d", "90d"] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${period === p
                ? "gradient-brand text-white border-transparent"
                : "glass border-white/10 text-muted-foreground hover:text-foreground"
                }`}>
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {cargandoPedidos && (
        <p className="text-sm text-muted-foreground">
          Cargando estadísticas de pedidos...
        </p>
      )}

      {errorPedidos && (
        <p className="text-sm text-red-400">
          No fue posible cargar los pedidos del servidor.
          Revisa la conexión con el backend.
        </p>
      )}

      {cargandoDatosComplementarios && (
        <p className="text-sm text-muted-foreground">
          Cargando productos, ingredientes y desperdicios...
        </p>
      )}

      {errorDatosComplementarios && (
        <p className="text-sm text-red-400">
          No fue posible cargar algunos datos complementarios.
          Los indicadores relacionados podrían estar incompletos.
        </p>
      )}

      {!cargandoPedidos && !errorPedidos && pedidosSinCosto > 0 && (
        <p className="text-sm text-muted-foreground">
          Hay {pedidosSinCosto} pedidos pagados sin un costo de producción
          registrado. La utilidad calculada no incluye esos costos faltantes.
        </p>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Ventas Brutas", value: formatCurrency(totals.ventas), icon: TrendingUp, color: "oklch(0.72 0.19 52)", trend: 12 },
          { label: "Utilidad Bruta", value: formatCurrency(totals.utilidad), icon: DollarSign, color: "oklch(0.70 0.18 140)", sub: `Margen: ${totals.margen}%` },
          { label: "Utilidad Neta", value: formatCurrency(totals.utilidadNeta), icon: DollarSign, color: "oklch(0.68 0.17 200)", sub: `Gastos: ${formatCurrency(totals.gastos)}` },
          {
            label: "Total Pedidos", value: String(totals.pedidos), icon: ShoppingCart, color: "oklch(0.75 0.16 300)", sub: `Ticket prom: ${formatCurrency(
              totals.pedidosPagados > 0
                ? Math.round(totals.ventas / totals.pedidosPagados)
                : 0
            )}`
          },
        ].map(kpi => (
          <div key={kpi.label} className="stat-card rounded-2xl p-5 card-hover">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
              style={{ background: `${kpi.color.replace(")", " / 0.15)")}` }}>
              <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
            </div>
            <div className="text-2xl font-black text-foreground mb-1">{kpi.value}</div>
            <div className="text-xs text-muted-foreground">{kpi.label}</div>
            {kpi.sub && <div className="text-xs text-primary mt-1">{kpi.sub}</div>}
          </div>
        ))}
      </div>

      {/* Main charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales & profit area chart */}
        <div className="lg:col-span-2 stat-card rounded-2xl p-5">
          <h3 className="text-sm font-bold text-foreground mb-4">Ventas vs Costos — {PERIOD_LABELS[period]}</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="aVentas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.72 0.19 52)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="oklch(0.72 0.19 52)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="aCosto" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.65 0.22 27)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="oklch(0.65 0.22 27)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 5%)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "oklch(0.60 0.01 240)" }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11, fill: "oklch(0.60 0.01 240)" }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="ventas" name="Ventas" stroke="oklch(0.72 0.19 52)" fill="url(#aVentas)" strokeWidth={2} />
              <Area type="monotone" dataKey="costo" name="Costo Producción" stroke="oklch(0.65 0.22 27)" fill="url(#aCosto)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Order type pie */}
        <div className="stat-card rounded-2xl p-5">
          <h3 className="text-sm font-bold text-foreground mb-4">Pedidos por Tipo</h3>
          {orderTypeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={orderTypeData} cx="50%" cy="45%" outerRadius={75} innerRadius={40} dataKey="value"
                  paddingAngle={3}>
                  {orderTypeData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend formatter={(v) => <span style={{ color: "oklch(0.80 0.01 240)", fontSize: 12 }}>{v}</span>} />
                <Tooltip formatter={(value) => `${value ?? 0} pedidos`} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Sin datos</div>
          )}
        </div>
      </div>

      {/* Orders volume bar chart */}
      <div className="stat-card rounded-2xl p-5">
        <h3 className="text-sm font-bold text-foreground mb-4">Volumen de Pedidos — {PERIOD_LABELS[period]}</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} barSize={period === "30d" ? 8 : 24}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 5%)" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "oklch(0.60 0.01 240)" }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11, fill: "oklch(0.60 0.01 240)" }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="pedidos" name="Pedidos" fill="oklch(0.72 0.19 52)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Product performance + margin */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top products by revenue */}
        <div className="stat-card rounded-2xl p-5">
          <h3 className="text-sm font-bold text-foreground mb-4">Rendimiento por Producto</h3>
          {productPerformance.length > 0 ? (
            <div className="space-y-3">
              {productPerformance.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: COLORS[Math.min(i, COLORS.length - 1)] }}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-foreground font-medium">{p.name}</span>
                      <span className="text-primary font-semibold">{formatCurrency(p.revenue)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full"
                        style={{
                          width: `${(p.revenue / (productPerformance[0]?.revenue || 1)) * 100}%`,
                          background: COLORS[Math.min(i, COLORS.length - 1)],
                          transition: "width 1s ease"
                        }} />
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground w-10 text-right">{p.qty} uds</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground text-sm text-center py-8">Sin datos de ventas</div>
          )}
        </div>

        {/* Margin analysis */}
        <div className="stat-card rounded-2xl p-5">
          <h3 className="text-sm font-bold text-foreground mb-4">Margen de Utilidad por Producto</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={marginData} layout="vertical" barSize={10}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 5%)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "oklch(0.60 0.01 240)" }} tickFormatter={v => `${v}%`} domain={[0, 100]} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "oklch(0.60 0.01 240)" }} width={95} />
              <Tooltip
                formatter={(value) => `${value == null ? 0 : String(value)}%`}
                contentStyle={{
                  background: "oklch(0.14 0.008 240)",
                  border: "1px solid oklch(1 0 0 / 8%)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="margen" name="Margen %" radius={[0, 4, 4, 0]}>
                {marginData.map((entry, i) => (
                  <Cell key={i} fill={
                    entry.margen > 60 ? "oklch(0.70 0.18 140)" :
                      entry.margen > 40 ? "oklch(0.72 0.19 52)" :
                        "oklch(0.65 0.22 27)"
                  } />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Financial summary */}
      <div className="stat-card rounded-2xl p-5">
        <h3 className="text-sm font-bold text-foreground mb-4">Resumen Financiero</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Ventas brutas", value: formatCurrency(totals.ventas), color: "text-primary" },
            { label: "Costo de producción", value: `-${formatCurrency(totals.costo)}`, color: "text-red-400" },
            {
              label: "Gastos operativos",
              value: totals.gastos > 0
                ? `-${formatCurrency(totals.gastos)}`
                : formatCurrency(0),
              color: "text-red-400"
            },
            { label: "Costo desperdicios", value: `-${formatCurrency(wasteCostTotal)}`, color: "text-orange-400" },
          ].map(item => (
            <div key={item.label} className="p-3 rounded-xl glass border border-white/5">
              <div className="text-xs text-muted-foreground mb-1">{item.label}</div>
              <div className={`text-lg font-black ${item.color}`}>{item.value}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-4 rounded-xl border border-primary/20"
          style={{ background: "oklch(0.72 0.19 52 / 0.08)" }}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Utilidad Neta Estimada</span>
            <span className={`text-2xl font-black ${totals.utilidadNeta >= 0 ? "text-primary" : "text-red-400"}`}>
              {formatCurrency(totals.utilidadNeta)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
