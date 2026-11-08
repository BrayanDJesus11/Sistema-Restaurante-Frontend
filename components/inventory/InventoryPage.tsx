"use client";

import { useState, useMemo, useEffect } from "react";
import {
  obtenerIngredientes,
  obtenerIngredientesDesactivados,
  reactivarIngrediente,
  crearIngrediente,
  actualizarIngrediente,
  eliminarIngrediente,
} from "@/lib/ingredientes";
import {
  useApp,
  Ingredient,
  IngredientBatch,
  getTotalStock,
  formatCurrency,
} from "@/lib/store";
import {
  Plus,
  Package,
  AlertTriangle,
  Clock,
  Trash2,
  Edit,
  X,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from "lucide-react";

// Convierte una fecha YYYY-MM-DD en un valor de calendario UTC,
// sin interpretarla como una fecha/hora UTC que pueda cambiar de día.
function obtenerFechaUTC(fecha?: string | null): number | null {
  if (!fecha) return null;

  const coincidencia = /^(\d{4})-(\d{2})-(\d{2})/.exec(fecha);

  if (!coincidencia) return null;

  const anio = Number(coincidencia[1]);
  const mes = Number(coincidencia[2]);
  const dia = Number(coincidencia[3]);

  const fechaUTC = Date.UTC(anio, mes - 1, dia);
  const comprobacion = new Date(fechaUTC);

  // Evitar fechas inválidas.
  if (
    comprobacion.getUTCFullYear() !== anio ||
    comprobacion.getUTCMonth() !== mes - 1 ||
    comprobacion.getUTCDate() !== dia
  ) {
    return null;
  }

  return fechaUTC;
}

// Calcula los días restantes usando días calendario,
// sin problemas de zona horaria ni cambios de horario.
function calcularDiasHastaVencimiento(
  fecha?: string | null
): number | null {
  const fechaUTC = obtenerFechaUTC(fecha);

  if (fechaUTC === null) return null;

  const ahora = new Date();

  const hoyUTC = Date.UTC(
    ahora.getFullYear(),
    ahora.getMonth(),
    ahora.getDate()
  );

  return Math.round((fechaUTC - hoyUTC) / 86400000);
}

// Muestra las fechas en formato colombiano DD/MM/YYYY.
function formatearFecha(fecha?: string | null): string {
  const fechaUTC = obtenerFechaUTC(fecha);

  if (fechaUTC === null) return "—";

  const fechaConvertida = new Date(fechaUTC);

  const dia = String(fechaConvertida.getUTCDate()).padStart(2, "0");
  const mes = String(fechaConvertida.getUTCMonth() + 1).padStart(2, "0");
  const anio = fechaConvertida.getUTCFullYear();

  return `${dia}/${mes}/${anio}`;
}

function AddIngredientModal({
  ingredient,
  onClose,
}: {
  ingredient?: Ingredient;
  onClose: () => void;
}) {
  const { dispatch } = useApp();
  const [name, setName] = useState(ingredient?.name || "");

  const [unit, setUnit] = useState<Ingredient["unit"]>(
    ingredient?.unit || "unidad",
  );

  const [minStock, setMinStock] = useState(String(ingredient?.minStock || 10));

  const [expirationDays, setExpirationDays] = useState(
    String(ingredient?.expirationAlertDays || 3),
  );

  const handleSave = async () => {
    if (!name) return;

    const ingrediente = {
      name,
      unit,
      minStock: Number(minStock),
      expirationAlertDays: Number(expirationDays),
      batches: ingredient?.batches || [],
    };

    try {
      if (ingredient) {
        await actualizarIngrediente(ingredient.id, ingrediente);
      } else {
        await crearIngrediente(ingrediente);
      }

      const ingredientes = await obtenerIngredientes();

      dispatch({
        type: "CARGAR_INGREDIENTES",

        payload: ingredientes,
      });

      onClose();
    } catch (error) {
      console.error(error);
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
            Nuevo Ingrediente
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
              Nombre
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Pan de hamburguesa"
              className="w-full px-4 py-3 rounded-xl glass border border-white/10 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">
              Unidad de medida
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as any)}
              className="w-full px-4 py-3 rounded-xl glass border border-white/10 text-foreground text-sm bg-transparent focus:outline-none focus:border-primary/50"
            >
              <option value="unidad">Unidad</option>
              <option value="gramo">Gramo</option>
              <option value="kilogramo">Kilogramo</option>
              <option value="litro">Litro</option>
              <option value="mililitro">Mililitro</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Stock mínimo
              </label>
              <input
                type="number"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
                className="w-full px-4 py-3 rounded-xl glass border border-white/10 text-foreground text-sm focus:outline-none focus:border-primary/50"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Alerta vencimiento (días)
              </label>
              <input
                type="number"
                value={expirationDays}
                onChange={(e) => setExpirationDays(e.target.value)}
                className="w-full px-4 py-3 rounded-xl glass border border-white/10 text-foreground text-sm focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>
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
            disabled={!name}
            className="flex-1 py-2.5 rounded-xl gradient-brand text-white text-sm font-bold disabled:opacity-40"
          >
            Guardar Ingrediente
          </button>
        </div>
      </div>
    </div>
  );
}


function IngredientRow({
  ingredient,
  desactivado = false,
  onReactivar,
  onIngredienteDesactivado,
}: {
  ingredient: Ingredient;
  desactivado?: boolean;
  onReactivar?: (id: string) => Promise<void>;
  onIngredienteDesactivado?: (ingredient: Ingredient) => void;
}) {

  const { dispatch, state } = useApp();
  const [expanded, setExpanded] = useState(false);
  const [errorDesactivacion, setErrorDesactivacion] = useState<string | null>(null);
  const [confirmarDesactivacion, setConfirmarDesactivacion] = useState(false);
  const totalStock = getTotalStock(ingredient);
  const isLowStock = totalStock < ingredient.minStock;

  const nearExpiry = ingredient.batches.some((b) => {
    if (!b.expirationDate) return false;

    const days = calcularDiasHastaVencimiento(b.expirationDate);

    return (
      days !== null &&
      days <= state.settings.expirationAlertDays &&
      days >= 0
    );
  });

  const expired = ingredient.batches.some((b) => {
    if (!b.expirationDate) return false;

    const days = calcularDiasHastaVencimiento(b.expirationDate);

    return days !== null && days < 0;
  });

  return (
    <div
      className={`stat-card rounded-xl overflow-hidden border transition-all ${expired
        ? "border-red-500/40"
        : nearExpiry
          ? "border-orange-500/40"
          : isLowStock
            ? "border-yellow-500/40"
            : "border-white/8"
        }`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-2 h-2 rounded-full ${expired
              ? "bg-red-400"
              : nearExpiry
                ? "bg-orange-400"
                : isLowStock
                  ? "bg-yellow-400"
                  : "bg-emerald-400"
              }`}
          />
          <div>
            <div className="text-sm font-semibold text-foreground">
              {ingredient.name}
            </div>
            <div className="text-xs text-muted-foreground">
              {ingredient.unit}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div
              className={`text-base font-bold ${isLowStock ? "text-yellow-400" : "text-foreground"}`}
            >
              {totalStock.toLocaleString("es-CO")}
            </div>
            <div className="text-xs text-muted-foreground">
              Min: {ingredient.minStock}
            </div>
          </div>
          <div className="flex gap-1">
            {expired && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                Vencido
              </span>
            )}
            {!expired && nearExpiry && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                Próx. a vencer
              </span>
            )}
            {isLowStock && !expired && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                Stock bajo
              </span>
            )}
          </div>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-white/5 pt-3">
          <div className="text-xs text-muted-foreground uppercase tracking-widest mb-3">
            Lotes FIFO/PEPS (más antiguo primero)
          </div>
          <div className="space-y-2">
            {ingredient.batches
              .sort(
                (a, b) =>
                  new Date(a.purchaseDate).getTime() -
                  new Date(b.purchaseDate).getTime(),
              )
              .map((batch, i) => {

                const daysToExpiry = batch.expirationDate
                  ? calcularDiasHastaVencimiento(batch.expirationDate)
                  : null;

                return (
                  <div
                    key={batch.id}
                    className={`rounded-lg p-3 border text-xs ${i === 0
                      ? "border-primary/30 bg-primary/5"
                      : "border-white/5 bg-white/2"
                      }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-foreground">
                        Lote #{i + 1}{" "}
                        {i === 0 && (
                          <span className="text-primary">(Próximo a usar)</span>
                        )}
                      </span>
                      <span className="text-muted-foreground">
                        {batch.purchaseOrderId}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                      <span>
                        Compra:{" "}
                        {formatearFecha(batch.purchaseDate)}
                      </span>
                      <span>
                        Costo/unidad: {formatCurrency(batch.unitCost)}
                      </span>
                      <span>
                        Restante:{" "}
                        {batch.remainingQuantity.toLocaleString("es-CO")}
                      </span>
                      {batch.expirationDate && (
                        <span
                          className={
                            daysToExpiry !== null && daysToExpiry <= 3
                              ? "text-orange-400 font-semibold"
                              : ""
                          }
                        >
                          Vence:{" "}
                          {formatearFecha(batch.expirationDate)}
                          {daysToExpiry !== null &&
                            ` (${daysToExpiry < 0
                              ? "VENCIDO"
                              : daysToExpiry === 0
                                ? "VENCE HOY"
                                : `${daysToExpiry} días`
                            })`}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>


          <div className="flex gap-2 mt-3">
            {desactivado ? (
              <button
                onClick={async () => {
                  setErrorDesactivacion(null);

                  try {
                    if (onReactivar) {
                      await onReactivar(ingredient.id);
                    }
                  } catch (error) {
                    setErrorDesactivacion(
                      error instanceof Error
                        ? error.message
                        : "No fue posible reactivar el ingrediente.",
                    );
                  }
                }}
                className="flex items-center gap-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-400 transition-all hover:bg-emerald-500/20"
              >
                <RotateCcw className="h-3 w-3" />
                Reactivar
              </button>
            ) : (
              <button
                onClick={() => {
                  setErrorDesactivacion(null);
                  setConfirmarDesactivacion(true);
                }}
                className="flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs text-red-400 transition-all hover:bg-red-500/20"
              >
                <Trash2 className="h-3 w-3" />
                Desactivar
              </button>
            )}
          </div>

          {confirmarDesactivacion && (
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="titulo-confirmar-desactivacion"
              className="fixed left-1/2 top-5 z-[110] w-[calc(100%-2.5rem)] max-w-sm -translate-x-1/2 rounded-xl border border-white/10 bg-[#17191d] p-4 font-sans shadow-2xl"
            >
              <p
                id="titulo-confirmar-desactivacion"
                className="text-sm font-semibold text-foreground"
              >
                ¿Desea desactivar este ingrediente?
              </p>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmarDesactivacion(false)}
                  className="rounded-lg border border-white/10 px-3 py-2 text-xs text-muted-foreground hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    setConfirmarDesactivacion(false);
                    setErrorDesactivacion(null);

                    try {
                      await eliminarIngrediente(ingredient.id);

                      const ingredientes = await obtenerIngredientes();

                      dispatch({

                        type: "CARGAR_INGREDIENTES",
                        payload: ingredientes,

                      });

                      onIngredienteDesactivado?.(ingredient);

                    } catch (error) {
                      const mensaje =
                        error instanceof Error
                          ? error.message
                          : "No fue posible desactivar el ingrediente.";

                      setErrorDesactivacion(mensaje);
                    }
                  }}
                  className="rounded-lg bg-red-500/15 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/25 transition-colors"
                >
                  Desactivar
                </button>
              </div>
            </div>
          )}

          {errorDesactivacion && (
            <div
              role="alert"
              className="fixed left-1/2 top-5 z-[100] flex w-[calc(100%-2.5rem)] max-w-sm -translate-x-1/2 items-start gap-3 rounded-xl border border-red-500/25 bg-[#17191d] p-4 font-sans text-sm shadow-2xl"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-sm font-semibold text-red-400">
                !
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">
                  {desactivado
                    ? "No se pudo reactivar"
                    : "Ingrediente en uso"}
                </p>

                <p className="mt-1 text-sm leading-5 text-muted-foreground">
                  {errorDesactivacion}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setErrorDesactivacion(null)}
                aria-label="Cerrar notificación"
                className="rounded-md px-1 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
              >
                ×
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

export function InventoryPage() {
  const { state, dispatch } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");

  const [vista, setVista] = useState<"activos" | "desactivados">("activos");
  const [ingredientesDesactivados, setIngredientesDesactivados] =
    useState<Ingredient[]>([]);
  const [cargandoDesactivados, setCargandoDesactivados] = useState(false);
  const [errorCargaDesactivados, setErrorCargaDesactivados] =
    useState<string | null>(null);


  useEffect(() => {
    async function cargarIngredientes() {
      try {
        const ingredientes = await obtenerIngredientes();

        dispatch({
          type: "CARGAR_INGREDIENTES",
          payload: ingredientes,
        });

        // Cargar también los ingredientes desactivados.
        const desactivados = await obtenerIngredientesDesactivados();
        setIngredientesDesactivados(desactivados);

      } catch (error) {
        console.error(error);
      }
    }

    cargarIngredientes();
  }, [dispatch]);

  const cargarDesactivados = async () => {
    setVista("desactivados");
    setCargandoDesactivados(true);
    setErrorCargaDesactivados(null);

    try {
      const ingredientes = await obtenerIngredientesDesactivados();
      setIngredientesDesactivados(ingredientes);
    } catch (error) {
      setErrorCargaDesactivados(
        error instanceof Error
          ? error.message
          : "No fue posible obtener los ingredientes desactivados.",
      );
    } finally {
      setCargandoDesactivados(false);
    }
  };

  const handleReactivarIngrediente = async (id: string) => {
    await reactivarIngrediente(id);

    const [activos, desactivados] = await Promise.all([
      obtenerIngredientes(),
      obtenerIngredientesDesactivados(),
    ]);

    dispatch({
      type: "CARGAR_INGREDIENTES",
      payload: activos,
    });

    setIngredientesDesactivados(desactivados);
  };

  const filtered = useMemo(() => {
    const fuente =
      vista === "activos"
        ? state.ingredients
        : ingredientesDesactivados;

    return fuente.filter((i) =>
      i.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [vista, state.ingredients, ingredientesDesactivados, search]);

  const stats = useMemo(() => {
    const lowStock = state.ingredients.filter(
      (i) => getTotalStock(i) < i.minStock,
    ).length;

    const nearExpiry = state.ingredients.filter((i) =>
      i.batches.some((b) => {
        if (!b.expirationDate) return false;

        const days = calcularDiasHastaVencimiento(b.expirationDate);

        return (
          days !== null &&
          days <= state.settings.expirationAlertDays &&
          days >= 0
        );
      }),
    ).length;

    const totalValue = state.ingredients.reduce((sum, i) => {
      return (
        sum +
        i.batches.reduce((s, b) => s + b.remainingQuantity * b.unitCost, 0)
      );
    }, 0);
    return { lowStock, nearExpiry, totalValue };
  }, [state.ingredients, state.settings.expirationAlertDays]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Control de Inventario
          </h2>
          <p className="text-sm text-muted-foreground">
            Sistema FIFO/PEPS • {state.ingredients.length} ingredientes
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-brand text-white text-sm font-semibold hover:opacity-90"
        >
          <Plus className="w-4 h-4" />
          Nuevo Ingrediente
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setVista("activos")}
          className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-all ${vista === "activos"
            ? "border-primary/40 bg-primary/10 text-primary"
            : "border-white/10 text-muted-foreground hover:bg-white/5"
            }`}
        >
          Activos ({state.ingredients.length})
        </button>

        <button
          onClick={cargarDesactivados}
          className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-all ${vista === "desactivados"
            ? "border-primary/40 bg-primary/10 text-primary"
            : "border-white/10 text-muted-foreground hover:bg-white/5"
            }`}
        >
          Desactivados ({ingredientesDesactivados.length})
        </button>
      </div>

      {errorCargaDesactivados && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300"
        >
          {errorCargaDesactivados}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="stat-card rounded-xl p-4">
          <Package className="w-5 h-5 text-primary mb-2" />
          <div className="text-xl font-black text-foreground">
            {state.ingredients.length}
          </div>
          <div className="text-xs text-muted-foreground">
            Total ingredientes
          </div>
        </div>
        <div
          className={`rounded-xl p-4 border ${stats.lowStock > 0 ? "bg-yellow-500/10 border-yellow-500/30" : "stat-card"}`}
        >
          <AlertTriangle className="w-5 h-5 text-yellow-400 mb-2" />
          <div className="text-xl font-black text-foreground">
            {stats.lowStock}
          </div>
          <div className="text-xs text-muted-foreground">Con stock bajo</div>
        </div>
        <div
          className={`rounded-xl p-4 border col-span-2 lg:col-span-1 ${stats.nearExpiry > 0 ? "bg-orange-500/10 border-orange-500/30" : "stat-card"}`}
        >
          <Clock className="w-5 h-5 text-orange-400 mb-2" />
          <div className="text-xl font-black text-foreground">
            {stats.nearExpiry}
          </div>
          <div className="text-xs text-muted-foreground">Próximos a vencer</div>
        </div>
      </div>

      {/* Inventory value */}
      <div className="glass rounded-xl p-4 border border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
              Valor del inventario (FIFO)
            </div>
            <div className="text-2xl font-black gradient-text">
              {formatCurrency(stats.totalValue)}
            </div>
          </div>
          <div className="text-xs text-muted-foreground text-right">
            Basado en costos
            <br />
            de lotes activos
          </div>
        </div>
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar ingrediente..."
        className="w-full px-4 py-2.5 rounded-xl glass border border-white/10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
      />

      {/* Ingredients list */}
      <div className="space-y-3">

        {cargandoDesactivados && vista === "desactivados" ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Cargando ingredientes desactivados...
          </p>
        ) : filtered.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {vista === "activos"
              ? "No hay ingredientes activos."
              : "No hay ingredientes desactivados."}
          </p>
        ) : (
          filtered.map((ingredient) => (
            <IngredientRow
              key={ingredient.id}
              ingredient={ingredient}
              desactivado={vista === "desactivados"}
              onReactivar={handleReactivarIngrediente}
              onIngredienteDesactivado={(ingrediente) =>
                setIngredientesDesactivados((actuales) => [
                  ...actuales.filter((item) => item.id !== ingrediente.id),
                  ingrediente,
                ])
              }
            />
          ))
        )}
      </div>

      {showAdd && <AddIngredientModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
