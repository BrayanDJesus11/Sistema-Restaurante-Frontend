"use client";

import { useState, useMemo, useEffect } from "react";
import { obtenerIngredientes } from "@/lib/ingredientes";
import { useApp, WasteRecord, formatCurrency } from "@/lib/store";
import {
  Plus,
  X,
  Trash2,
  AlertTriangle,
  Calendar,
  TrendingDown,
} from "lucide-react";
import { listarDesperdicios, registrarDesperdicio } from "@/lib/desperdicios";

const REASONS = [
  "Vencimiento",
  "Cocción fallida",
  "Error de porción",
  "Contaminación",
  "Caída accidental",
  "Exceso de producción",
  "Otro",
];

function obtenerFechaLocalActual(): string {
  const hoy = new Date();

  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const dia = String(hoy.getDate()).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
}

function formatearFechaDesperdicio(fecha?: string | null): string {
  if (!fecha) return "—";

  const coincidencia = /^(\d{4})-(\d{2})-(\d{2})/.exec(fecha);

  if (coincidencia) {
    return `${coincidencia[3]}/${coincidencia[2]}/${coincidencia[1]}`;
  }

  return "—";
}

function obtenerTiempoFecha(fecha?: string | null): number {
  if (!fecha) return 0;

  const coincidencia = /^(\d{4})-(\d{2})-(\d{2})/.exec(fecha);

  if (coincidencia) {
    return Date.UTC(
      Number(coincidencia[1]),
      Number(coincidencia[2]) - 1,
      Number(coincidencia[3])
    );
  }

  const tiempo = new Date(fecha).getTime();

  return Number.isFinite(tiempo) ? tiempo : 0;
}

function WasteModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const { state } = useApp();
  const [ingredientId, setIngredientId] = useState(
    state.ingredients[0]?.id || "",
  );
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState(REASONS[0]);
  const [date, setDate] = useState(obtenerFechaLocalActual);

  const selectedIngredient = state.ingredients.find(
    (i) => i.id === ingredientId,
  );

  const availableQuantity = useMemo(() => {
    if (!selectedIngredient) return 0;

    return selectedIngredient.batches.reduce(
      (total, batch) => total + batch.remainingQuantity,
      0,
    );
  }, [selectedIngredient]);

  const requestedQuantity = Number(quantity) || 0;

  const insufficientStock = requestedQuantity > availableQuantity;

  const cost = useMemo(() => {
    if (!selectedIngredient || !quantity) return 0;
    const sorted = [...selectedIngredient.batches]
      .filter((b) => b.remainingQuantity > 0)
      .sort(
        (a, b) =>
          new Date(a.purchaseDate).getTime() -
          new Date(b.purchaseDate).getTime(),
      );
    if (!sorted.length) return 0;
    return sorted[0].unitCost * Number(quantity);
  }, [selectedIngredient, quantity]);

  const handleSave = async () => {
    if (!ingredientId || !quantity || !selectedIngredient) return;

    try {
      await registrarDesperdicio({
        pedidoId: null,
        motivo: reason,
        tipo: "MANUAL",
        fechaIncidente: date,
        detalles: [
          {
            ingredienteId: ingredientId,
            cantidad: Number(quantity),
          },
        ],
      });

      await onSaved();

      onClose();
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("No fue posible registrar el desperdicio.");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-md rounded-2xl border border-white/10 p-6 shadow-2xl"
        style={{ background: "oklch(0.13 0.008 240)" }}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-foreground">
            Registrar Desperdicio
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">
              Ingrediente
            </label>
            <select
              value={ingredientId}
              onChange={(e) => setIngredientId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl glass border border-white/10 text-foreground text-sm bg-transparent focus:outline-none focus:border-primary/50"
            >
              {state.ingredients.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} ({i.unit})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-muted-foreground">
                  Cantidad ({selectedIngredient?.unit || "unidad"})
                </label>

                {selectedIngredient && (
                  <span className="text-[11px] text-muted-foreground">
                    Disponible:{" "}
                    <span className="font-semibold text-foreground">
                      {availableQuantity}
                    </span>
                  </span>
                )}
              </div>

              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-3 rounded-xl glass border border-white/10 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              />

              {insufficientStock && (
                <p className="text-xs text-red-400 mt-1">
                  La cantidad supera el inventario disponible.
                </p>
              )}
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Fecha
              </label>

              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl glass border border-white/10 text-foreground text-sm focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">
              Motivo
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-3 rounded-xl glass border border-white/10 text-foreground text-sm bg-transparent focus:outline-none focus:border-primary/50"
            >
              {REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {cost > 0 && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <div className="text-xs text-muted-foreground mb-1">
                Costo estimado del desperdicio (FIFO)
              </div>
              <div className="text-lg font-black text-red-400">
                {formatCurrency(cost)}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl glass border border-white/10 text-sm text-muted-foreground"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!quantity || insufficientStock}
            className="flex-1 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-bold disabled:opacity-40 hover:bg-red-500/30 transition-all"
          >
            Registrar Desperdicio
          </button>
        </div>
      </div>
    </div>
  );
}

export function WastePage() {
  const { state, dispatch } = useApp();

  const [showModal, setShowModal] = useState(false);

  const [desperdicios, setDesperdicios] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  const registrosBackend = useMemo(() => {
    return desperdicios.flatMap((desperdicio) =>
      desperdicio.detalles.map((detalle: any) => ({
        id: `${desperdicio.id}-${detalle.ingrediente}`,
        ingredientName: detalle.ingrediente,
        quantity: detalle.cantidad,
        unit: detalle.unidad,
        reason: desperdicio.motivo,
        cost: detalle.costo,
        date: desperdicio.fechaIncidente ?? desperdicio.fecha,
        orderNumber: desperdicio.pedido,
      })),
    );
  }, [desperdicios]);

  const cargarDesperdicios = async () => {
    try {
      const datos = await listarDesperdicios();

      console.log("Desperdicios desde backend:", datos);

      setDesperdicios(datos);
    } catch (error) {
      console.error("Error cargando desperdicios:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDesperdicios();
  }, []);

  const stats = useMemo(() => {
    const totalCost = registrosBackend.reduce(
      (sum, w) => sum + Number(w.cost || 0),
      0,
    );

    const byReason: Record<string, number> = {};

    registrosBackend.forEach((w) => {
      byReason[w.reason] = (byReason[w.reason] || 0) + 1;
    });

    let topReasonName = "—";
    let topReasonCount = 0;

    Object.entries(byReason).forEach(([reason, count]) => {
      if (count > topReasonCount) {
        topReasonName = reason;
        topReasonCount = count;
      }
    });

    return {
      totalCost,
      topReasonName,
      topReasonCount,
      count: desperdicios.length,
    };
  }, [registrosBackend]);

  const sorted = useMemo(
    () =>
      [...registrosBackend].sort(
        (a, b) => obtenerTiempoFecha(b.date) - obtenerTiempoFecha(a.date),
      ),
    [registrosBackend],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Control de Desperdicios
          </h2>
          <p className="text-sm text-muted-foreground">
            {stats.count} registros
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-semibold hover:bg-red-500/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          Registrar Desperdicio
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl p-5 border border-red-500/20 bg-red-500/5">
          <TrendingDown className="w-5 h-5 text-red-400 mb-2" />
          <div className="text-2xl font-black text-foreground">
            {formatCurrency(stats.totalCost)}
          </div>
          <div className="text-xs text-muted-foreground">
            Costo total de desperdicios
          </div>
        </div>
        <div className="stat-card rounded-2xl p-5">
          <AlertTriangle className="w-5 h-5 text-yellow-400 mb-2" />
          <div className="text-2xl font-black text-foreground">
            {stats.count}
          </div>
          <div className="text-xs text-muted-foreground">
            Incidentes registrados
          </div>
        </div>
        <div className="stat-card rounded-2xl p-5">
          <AlertTriangle className="w-5 h-5 text-orange-400 mb-2" />
          <div className="text-xl font-black text-foreground">
            {stats.topReasonName}
          </div>

          <div className="text-xs text-muted-foreground">
            Causa principal · {stats.topReasonCount} veces
          </div>
        </div>
      </div>

      {/* Waste records */}
      <div className="space-y-3">
        {sorted.map((record) => (
          <div
            key={record.id}
            className="stat-card rounded-xl p-4 border border-white/8 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-red-400" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-foreground">
                  {record.ingredientName}
                  <span className="text-muted-foreground font-normal">
                    · {record.quantity}
                    {record.unit ? ` ${record.unit}` : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground border border-white/10">
                    {record.reason}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {formatearFechaDesperdicio(record.date)}

                    {record.orderNumber && (
                      <span className="text-xs text-muted-foreground">
                        Pedido · {record.orderNumber}
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-base font-black text-red-400">
              -{formatCurrency(record.cost)}
            </div>
          </div>
        ))}
      </div>

      {sorted.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No hay desperdicios registrados</p>
        </div>
      )}

      {showModal && (
        <WasteModal
          onClose={() => setShowModal(false)}
          onSaved={async () => {
            const ingredientes = await obtenerIngredientes();

            dispatch({
              type: "CARGAR_INGREDIENTES",
              payload: ingredientes,
            });
          }}
        />
      )}
    </div>
  );
}
