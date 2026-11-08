
"use client";

import { useEffect, useMemo, useState } from "react";
import { useApp, Alert } from "@/lib/store";
import {
  Bell,
  Clock,
  Package,
  AlertTriangle,
  DollarSign,
  X,
  CheckCheck,
} from "lucide-react";

import { obtenerPedidos } from "@/lib/pedidos";
import { obtenerIngredientes } from "@/lib/ingredientes";

// Tipos que corresponden a las respuestas reales del backend.

interface PedidoAlerta {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  estimatedMinutes: number;
  additionalMinutes?: number;
  paidAt?: string | null;
}

interface LoteAlerta {
  id: string;
  purchaseDate?: string;
  expirationDate?: string | null;
  remainingQuantity?: number;
}

interface IngredienteAlerta {
  id: string;
  name: string;
  unit: string;
  minStock: number;
  expirationAlertDays?: number;
  activo?: boolean;
  batches: LoteAlerta[];
}

// Calcula los días restantes sin desfases por zona horaria.

function calcularDiasHastaVencimiento(fecha: string): number {
  const partes = fecha.substring(0, 10).split("-").map(Number);

  const fechaVencimiento = Date.UTC(
    partes[0],
    partes[1] - 1,
    partes[2],
  );

  const hoy = new Date();

  const fechaHoy = Date.UTC(
    hoy.getFullYear(),
    hoy.getMonth(),
    hoy.getDate(),
  );

  return Math.round(
    (fechaVencimiento - fechaHoy) / 86400000,
  );
}

// Genera las alertas utilizando exclusivamente datos del backend.

function generarAlertas(
  pedidos: PedidoAlerta[],
  ingredientes: IngredienteAlerta[],
  diasAlertaGlobal: number,
): Alert[] {
  const generadas: Alert[] = [];

  const ahora = Date.now();

  // 1. Pedidos retrasados.

  pedidos.forEach((pedido) => {
    const estado = pedido.status?.toUpperCase();

    if (estado !== "PENDIENTE" && estado !== "LISTO") {
      return;
    }

    const fechaCreacion = new Date(pedido.createdAt).getTime();

    if (!Number.isFinite(fechaCreacion)) return;

    const minutosTranscurridos = Math.floor(
      (ahora - fechaCreacion) / 60000,
    );

    const tiempoEstimado =
      Number(pedido.estimatedMinutes ?? 0) +
      Number(pedido.additionalMinutes ?? 0);

    if (minutosTranscurridos > tiempoEstimado) {
      generadas.push({
        id: `auto-delay-${pedido.id}`,
        type: "pedido-retrasado",
        title: "Pedido retrasado",
        message: `Pedido #${pedido.orderNumber} lleva ${minutosTranscurridos} minutos activo (estimado: ${tiempoEstimado} min).`,
        createdAt: new Date().toISOString(),
        read: false,
        relatedId: pedido.id,
      });
    }
  });

  // 2. Pedidos entregados sin pagar.

  pedidos.forEach((pedido) => {
    const estado = pedido.status?.toUpperCase();

    if (estado === "ENTREGADO" && !pedido.paidAt) {
      generadas.push({
        id: `auto-unpaid-${pedido.id}`,
        type: "pedido-sin-pagar",
        title: "Pedido sin pagar",
        message: `El pedido #${pedido.orderNumber} fue entregado y todavía no tiene un pago registrado.`,
        createdAt: new Date().toISOString(),
        read: false,
        relatedId: pedido.id,
      });
    }
  });

  // 3. Ingredientes con stock bajo y lotes próximos a vencer.

  ingredientes.forEach((ingrediente) => {
    if (ingrediente.activo === false) return;

    const stock = (ingrediente.batches ?? []).reduce(
      (total, lote) =>
        total + Number(lote.remainingQuantity ?? 0),
      0,
    );

    const stockMinimo = Number(ingrediente.minStock ?? 0);

    if (stock < stockMinimo) {
      generadas.push({
        id: `auto-stock-${ingrediente.id}`,
        type: "stock-bajo",
        title: "Stock bajo",
        message: `${ingrediente.name} tiene ${stock} ${ingrediente.unit}(s) disponibles (mínimo: ${stockMinimo}).`,
        createdAt: new Date().toISOString(),
        read: false,
        relatedId: ingrediente.id,
      });
    }

    // 4. Próximos a vencer y vencidos.

    (ingrediente.batches ?? []).forEach((lote) => {
      if (!lote.expirationDate) return;

      // No generar alertas para lotes sin existencias.
      if (Number(lote.remainingQuantity ?? 0) <= 0) return;

      const dias = calcularDiasHastaVencimiento(
        lote.expirationDate,
      );

      if (dias < 0) {
        generadas.push({
          id: `auto-expired-${lote.id}`,
          type: "ingrediente-vencido",
          title: "Ingrediente vencido",
          message: `${ingrediente.name} tiene un lote vencido desde hace ${Math.abs(dias)} día(s).`,
          createdAt: new Date().toISOString(),
          read: false,
          relatedId: lote.id,
        });
      } else {
        const diasPermitidos = Number(
          ingrediente.expirationAlertDays ?? diasAlertaGlobal,
        );

        if (dias <= diasPermitidos) {
          const mensaje =
            dias === 0
              ? "vence hoy."
              : `vence en ${dias} día(s).`;

          generadas.push({
            id: `auto-exp-${lote.id}`,
            type: "proxima-vencimiento",
            title: "Próximo a vencer",
            message: `${ingrediente.name} ${mensaje}`,
            createdAt: new Date().toISOString(),
            read: false,
            relatedId: lote.id,
          });
        }
      }
    });
  });

  return generadas;
}

// Tarjeta individual de alerta.

function AlertCard({
  alert,
  onRead,
  onDismiss,
}: {
  alert: Alert;
  onRead: () => void;
  onDismiss: () => void;
}) {
  const config: Record<
    Alert["type"],
    {
      icon: typeof Clock;
      color: string;
      bg: string;
      border: string;
      label: string;
    }
  > = {
    "pedido-retrasado": {
      icon: Clock,
      color: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      label: "Pedido Retrasado",
    },
    "pedido-sin-pagar": {
      icon: DollarSign,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/20",
      label: "Pago Pendiente",
    },
    "stock-bajo": {
      icon: Package,
      color: "text-orange-400",
      bg: "bg-orange-500/10",
      border: "border-orange-500/20",
      label: "Stock Bajo",
    },
    "proxima-vencimiento": {
      icon: AlertTriangle,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      label: "Próximo a Vencer",
    },
    "ingrediente-vencido": {
      icon: AlertTriangle,
      color: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      label: "Ingrediente Vencido",
    },
  };

  const c = config[alert.type];

  return (
    <div
      className={`rounded-xl p-4 border ${c.bg} ${c.border} ${alert.read ? "opacity-50" : ""
        } transition-all`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${c.bg} border ${c.border}`}
          >
            <c.icon className={`w-4 h-4 ${c.color}`} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground">
                {alert.title}
              </span>

              {!alert.read && (
                <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
              )}
            </div>

            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {alert.message}
            </p>

            <span className="text-xs text-muted-foreground mt-2 block">
              {new Date(alert.createdAt).toLocaleDateString(
                "es-CO",
                {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                },
              )}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {!alert.read && (
            <button
              onClick={onRead}
              title="Marcar como leída"
              className="px-2 py-1 rounded-lg glass border border-white/10 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={onDismiss}
            title="Descartar alerta"
            className="px-2 py-1 rounded-lg glass border border-white/10 text-xs text-muted-foreground hover:text-red-400 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Página principal de alertas.

export function AlertsPage() {
  const { state, dispatch } = useApp();

  const [alertasAutomaticas, setAlertasAutomaticas] = useState<Alert[]>([]);
  const [ocultas, setOcultas] = useState<Set<string>>(new Set());
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    let cargandoDatos = false;

    const cargarDatos = async () => {
      if (cargandoDatos) return;

      cargandoDatos = true;
      setCargando(true);

      try {
        const [pedidos, ingredientes] = await Promise.all([
          obtenerPedidos(),
          obtenerIngredientes(),
        ]);

        if (cancelado) return;

        const nuevasAlertas = generarAlertas(
          pedidos as PedidoAlerta[],
          ingredientes as IngredienteAlerta[],
          state.settings.expirationAlertDays,
        );

        const idsActuales = new Set(
          nuevasAlertas.map((alerta) => alerta.id),
        );

        // Conserva el estado de lectura de las alertas existentes.

        setAlertasAutomaticas((anteriores) =>
          nuevasAlertas.map((nueva) => {
            const anterior = anteriores.find(
              (alerta) => alerta.id === nueva.id,
            );

            return {
              ...nueva,
              read: anterior?.read ?? false,
              createdAt: anterior?.createdAt ?? nueva.createdAt,
            };
          }),
        );

        // Si una alerta desaparece porque el problema fue resuelto,
        // deja de estar ocultada para futuras apariciones.

        setOcultas((anteriores) =>
          new Set(
            [...anteriores].filter((id) => idsActuales.has(id)),
          ),
        );

        setErrorCarga(null);
      } catch (error) {
        console.error("Error al cargar las alertas:", error);

        if (!cancelado) {
          setErrorCarga(
            "No fue posible actualizar las alertas. Se conserva la última información disponible.",
          );
        }
      } finally {
        cargandoDatos = false;

        if (!cancelado) {
          setCargando(false);
        }
      }
    };

    cargarDatos();

    const intervalo = window.setInterval(
      cargarDatos,
      15000,
    );

    return () => {
      cancelado = true;
      window.clearInterval(intervalo);
    };
  }, [state.settings.expirationAlertDays]);

  const alertasVisibles = useMemo(
    () =>
      alertasAutomaticas.filter(
        (alerta) => !ocultas.has(alerta.id),
      ),
    [alertasAutomaticas, ocultas],
  );

  const allAlerts = useMemo(
    () => [...alertasVisibles, ...state.alerts],
    [alertasVisibles, state.alerts],
  );

  const unread = allAlerts.filter(
    (alerta) => !alerta.read,
  ).length;

  // Marcar una alerta individual como leída.

  const marcarLeida = (alerta: Alert) => {
    const esAutomatica = alertasAutomaticas.some(
      (actual) => actual.id === alerta.id,
    );

    if (esAutomatica) {
      setAlertasAutomaticas((anteriores) =>
        anteriores.map((actual) =>
          actual.id === alerta.id
            ? { ...actual, read: true }
            : actual,
        ),
      );
    } else {
      dispatch({
        type: "MARK_ALERT_READ",
        payload: alerta.id,
      });
    }
  };

  // Descartar una alerta.

  const descartarAlerta = (alerta: Alert) => {
    const esAutomatica = alertasAutomaticas.some(
      (actual) => actual.id === alerta.id,
    );

    if (esAutomatica) {
      setOcultas((anteriores) =>
        new Set([...anteriores, alerta.id]),
      );
    } else {
      dispatch({
        type: "DISMISS_ALERT",
        payload: alerta.id,
      });
    }
  };

  // Marcar todas como leídas.

  const marcarTodasLeidas = () => {
    setAlertasAutomaticas((anteriores) =>
      anteriores.map((alerta) => ({
        ...alerta,
        read: true,
      })),
    );

    state.alerts.forEach((alerta) => {
      if (!alerta.read) {
        dispatch({
          type: "MARK_ALERT_READ",
          payload: alerta.id,
        });
      }
    });
  };

  const categorias = [
    {
      type: "pedido-retrasado",
      label: "Retrasados",
      icon: Clock,
      color: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
    },
    {
      type: "pedido-sin-pagar",
      label: "Sin pagar",
      icon: DollarSign,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/20",
    },
    {
      type: "stock-bajo",
      label: "Stock bajo",
      icon: Package,
      color: "text-orange-400",
      bg: "bg-orange-500/10",
      border: "border-orange-500/20",
    },
    {
      type: "proxima-vencimiento",
      label: "Por vencer",
      icon: AlertTriangle,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    {
      type: "ingrediente-vencido",
      label: "Vencidos",
      icon: AlertTriangle,
      color: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
    },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Centro de Alertas
          </h2>

          <p className="text-sm text-muted-foreground">
            {unread} alertas sin leer · {allAlerts.length} en total
          </p>
        </div>

        {unread > 0 && (
          <button
            onClick={marcarTodasLeidas}
            className="flex items-center gap-2 px-4 py-2 rounded-xl glass border border-white/10 text-sm text-muted-foreground hover:text-foreground transition-all"
          >
            <CheckCheck className="w-4 h-4" />
            Marcar todas como leídas
          </button>
        )}
      </div>

      {errorCarga && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10">
          <p className="text-sm text-amber-400">
            {errorCarga}
          </p>
        </div>
      )}

      {/* Contadores */}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {categorias.map((categoria) => {
          const count = allAlerts.filter(
            (alerta) => alerta.type === categoria.type,
          ).length;

          return (
            <div
              key={categoria.type}
              className={`rounded-xl p-4 border ${categoria.bg} ${categoria.border}`}
            >
              <categoria.icon
                className={`w-5 h-5 ${categoria.color} mb-2`}
              />

              <div className="text-2xl font-black text-foreground">
                {count}
              </div>

              <div className="text-xs text-muted-foreground">
                {categoria.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Alertas automáticas */}

      {alertasVisibles.length > 0 && (
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Alertas operativas en tiempo real
          </div>

          <div className="space-y-3">
            {alertasVisibles.map((alerta) => (
              <AlertCard
                key={alerta.id}
                alert={alerta}
                onRead={() => marcarLeida(alerta)}
                onDismiss={() => descartarAlerta(alerta)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Historial almacenado en el estado global */}

      {state.alerts.length > 0 && (
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-widest mb-3">
            Historial de alertas
          </div>

          <div className="space-y-3">
            {[...state.alerts]
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime(),
              )
              .map((alerta) => (
                <AlertCard
                  key={alerta.id}
                  alert={alerta}
                  onRead={() => marcarLeida(alerta)}
                  onDismiss={() => descartarAlerta(alerta)}
                />
              ))}
          </div>
        </div>
      )}

      {cargando && allAlerts.length === 0 && (
        <div className="text-center py-10 text-muted-foreground">
          Consultando pedidos e inventario...
        </div>
      )}

      {!cargando && allAlerts.length === 0 && !errorCarga && (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl glass border border-white/10 flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-muted-foreground opacity-50" />
          </div>

          <p className="text-muted-foreground">
            No hay alertas activas
          </p>

          <p className="text-xs text-muted-foreground mt-2">
            El sistema generará alertas automáticamente al detectar novedades.
          </p>
        </div>
      )}
    </div>
  );
}
