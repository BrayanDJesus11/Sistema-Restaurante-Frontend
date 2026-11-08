"use client";

import { useState, useMemo } from "react";
import { useApp, OperationalExpense, formatCurrency } from "@/lib/store";
import { crearGasto, actualizarGasto, eliminarGasto } from "@/lib/gastos";
import {
  Calendar,
  DollarSign,
  Edit,
  Plus,
  RefreshCw,
  Trash2,
  TrendingDown,
  X,
} from "lucide-react";

const CATEGORIES = [
  "Inmueble",
  "Servicios",
  "Personal",
  "Insumos",
  "Mantenimiento",
  "Marketing",
  "Transporte",
  "Otro",
];

function ExpenseModal({
  expense,
  onClose,
}: {
  expense?: OperationalExpense;
  onClose: () => void;
}) {
  const { dispatch } = useApp();
  const [name, setName] = useState(expense?.name || "");
  const [amount, setAmount] = useState(String(expense?.amount || ""));
  const [category, setCategory] = useState(expense?.category || CATEGORIES[0]);
  const [date, setDate] = useState(
    expense?.date || new Date().toISOString().split("T")[0],
  );
  const [recurring, setRecurring] = useState(expense?.recurring ?? false);
  const [frequency, setFrequency] = useState<OperationalExpense["frequency"]>(
    expense?.frequency || "mensual",
  );

  const handleSave = async () => {
    if (!name || !amount) return;

    try {
      const datosGasto = {
        name,
        amount: Number(amount),
        category,
        date,
        recurring,
        frequency: recurring ? frequency : undefined,
      };

      if (expense?.id) {
        const gastoActualizado = await actualizarGasto(expense.id, datosGasto);

        dispatch({
          type: "UPDATE_EXPENSE",
          payload: gastoActualizado,
        });
      } else {
        const gastoCreado = await crearGasto(datosGasto);

        dispatch({
          type: "ADD_EXPENSE",
          payload: gastoCreado,
        });
      }

      onClose();
    } catch (error) {
      console.error("Error al guardar el gasto:", error);
      alert(
        error instanceof Error
          ? error.message
          : "No fue posible guardar el gasto.",
      );
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
            {expense ? "Editar Gasto" : "Nuevo Gasto"}
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
              Descripción
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Arriendo local"
              className="w-full px-4 py-3 rounded-xl glass border border-white/10 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Monto
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-3 rounded-xl glass border border-white/10 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Categoría
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-xl glass border border-white/10 text-foreground text-sm bg-transparent focus:outline-none focus:border-primary/50"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
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

          <div className="flex items-center justify-between p-4 rounded-xl glass border border-white/10">
            <div>
              <div className="text-sm font-semibold text-foreground">
                Gasto recurrente
              </div>
              <div className="text-xs text-muted-foreground">
                Se repite periódicamente
              </div>
            </div>
            <button
              onClick={() => setRecurring(!recurring)}
              className={`w-10 h-6 rounded-full transition-colors relative ${recurring ? "bg-primary" : "bg-white/10"}`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow ${recurring ? "translate-x-4" : "translate-x-0.5"}`}
              />
            </button>
          </div>

          {recurring && (
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Frecuencia
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as any)}
                className="w-full px-4 py-3 rounded-xl glass border border-white/10 text-foreground text-sm bg-transparent focus:outline-none focus:border-primary/50"
              >
                <option value="diario">Diario</option>
                <option value="semanal">Semanal</option>
                <option value="mensual">Mensual</option>
                <option value="anual">Anual</option>
              </select>
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
            disabled={!name || !amount}
            className="flex-1 py-2.5 rounded-xl gradient-brand text-white text-sm font-bold disabled:opacity-40"
          >
            {expense ? "Guardar Cambios" : "Registrar Gasto"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ExpensesPage() {
  const { state, dispatch } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editExpense, setEditExpense] = useState<
    OperationalExpense | undefined
  >();
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filtered = useMemo(
    () =>
      state.operationalExpenses.filter(
        (e) => categoryFilter === "all" || e.category === categoryFilter,
      ),
    [state.operationalExpenses, categoryFilter],
  );

  const stats = useMemo(() => {
    const total = state.operationalExpenses.reduce(
      (sum, e) => sum + e.amount,
      0,
    );
    const recurring = state.operationalExpenses
      .filter((e) => e.recurring)
      .reduce((sum, e) => sum + e.amount, 0);
    const byCategory = state.operationalExpenses.reduce(
      (acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + e.amount;
        return acc;
      },
      {} as Record<string, number>,
    );
    const topCategory = Object.entries(byCategory).sort(
      ([, a], [, b]) => b - a,
    )[0];
    return { total, recurring, topCategory };
  }, [state.operationalExpenses]);

  const categories = useMemo(() => {
    return Array.from(
      new Set(state.operationalExpenses.map((e) => e.category)),
    );
  }, [state.operationalExpenses]);

  const frequencyLabel = {
    diario: "Diario",
    semanal: "Semanal",
    mensual: "Mensual",
    anual: "Anual",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Gastos Operativos
          </h2>
          <p className="text-sm text-muted-foreground">
            {state.operationalExpenses.length} gastos registrados
          </p>
        </div>
        <button
          onClick={() => {
            setEditExpense(undefined);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-brand text-white text-sm font-semibold hover:opacity-90"
        >
          <Plus className="w-4 h-4" />
          Registrar Gasto
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card rounded-2xl p-5">
          <TrendingDown className="w-5 h-5 text-red-400 mb-2" />
          <div className="text-2xl font-black text-foreground">
            {formatCurrency(stats.total)}
          </div>
          <div className="text-xs text-muted-foreground">Total gastos</div>
        </div>
        <div className="stat-card rounded-2xl p-5">
          <RefreshCw className="w-5 h-5 text-blue-400 mb-2" />
          <div className="text-2xl font-black text-foreground">
            {formatCurrency(stats.recurring)}
          </div>
          <div className="text-xs text-muted-foreground">
            Gastos recurrentes
          </div>
        </div>
        <div className="stat-card rounded-2xl p-5">
          <DollarSign className="w-5 h-5 text-primary mb-2" />
          <div className="text-2xl font-black text-foreground">
            {stats.topCategory?.[0] || "—"}
          </div>
          <div className="text-xs text-muted-foreground">
            Categoría principal ·{" "}
            {stats.topCategory ? formatCurrency(stats.topCategory[1]) : "—"}
          </div>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="stat-card rounded-2xl p-5">
        <h3 className="text-sm font-bold text-foreground mb-4">
          Distribución por Categoría
        </h3>
        <div className="space-y-3">
          {Object.entries(
            state.operationalExpenses.reduce(
              (acc, e) => {
                acc[e.category] = (acc[e.category] || 0) + e.amount;
                return acc;
              },
              {} as Record<string, number>,
            ),
          )
            .sort(([, a], [, b]) => b - a)
            .map(([cat, amt]) => (
              <div key={cat} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-28 truncate">
                  {cat}
                </span>
                <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full gradient-brand"
                    style={{
                      width: `${(amt / stats.total) * 100}%`,
                      transition: "width 1s ease",
                    }}
                  />
                </div>
                <span className="text-xs font-semibold text-foreground w-24 text-right">
                  {formatCurrency(amt)}
                </span>
                <span className="text-xs text-muted-foreground w-8 text-right">
                  {Math.round((amt / stats.total) * 100)}%
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setCategoryFilter("all")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
            categoryFilter === "all"
              ? "gradient-brand text-white border-transparent"
              : "glass border-white/10 text-muted-foreground"
          }`}
        >
          Todos
        </button>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategoryFilter(c)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
              categoryFilter === c
                ? "gradient-brand text-white border-transparent"
                : "glass border-white/10 text-muted-foreground"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Expenses list */}
      <div className="space-y-3">
        {filtered.map((expense) => (
          <div
            key={expense.id}
            className="stat-card rounded-xl p-4 border border-white/8 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-9 h-9 rounded-xl glass border border-white/10 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-foreground truncate">
                  {expense.name}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">
                    {expense.category}
                  </span>
                  {expense.recurring && (
                    <span className="flex items-center gap-1 text-xs text-blue-400">
                      <RefreshCw className="w-3 h-3" />
                      {frequencyLabel[expense.frequency!]}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {new Date(expense.date).toLocaleDateString("es-CO")}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-base font-black text-foreground">
                {formatCurrency(expense.amount)}
              </span>
              <button
                onClick={() => {
                  setEditExpense(expense);
                  setShowModal(true);
                }}
                className="w-7 h-7 rounded-lg glass border border-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={async () => {
                  try {
                    await eliminarGasto(expense.id);

                    dispatch({
                      type: "DELETE_EXPENSE",
                      payload: expense.id,
                    });
                  } catch (error) {
                    console.error("Error al eliminar el gasto:", error);

                    alert(
                      error instanceof Error
                        ? error.message
                        : "No fue posible eliminar el gasto.",
                    );
                  }
                }}
                className="w-7 h-7 rounded-lg glass border border-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No hay gastos registrados</p>
        </div>
      )}

      {showModal && (
        <ExpenseModal
          expense={editExpense}
          onClose={() => {
            setShowModal(false);
            setEditExpense(undefined);
          }}
        />
      )}
    </div>
  );
}
