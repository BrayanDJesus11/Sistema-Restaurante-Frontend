"use client";

import { useState, useEffect } from "react";
import { obtenerIngredientes } from "@/lib/ingredientes";
import {
  useApp,
  PurchaseOrder,
  PurchaseOrderItem,
  formatCurrency,
} from "@/lib/store";
import {
  Plus,
  X,
  Trash2,
  ShoppingCart,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { obtenerCompras, registrarCompra } from "@/lib/compras";

// Obtiene la fecha actual según el calendario local.
function obtenerFechaLocalActual(): string {
  const hoy = new Date();

  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const dia = String(hoy.getDate()).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
}

// Formatea fechas YYYY-MM-DD sin conversiones de zona horaria.
function formatearFechaLocal(fecha?: string | null): string {
  if (!fecha) return "—";

  const coincidencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);

  if (!coincidencia) return "—";

  return `${coincidencia[3]}/${coincidencia[2]}/${coincidencia[1]}`;
}

function CreatePurchaseModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const [ingredientes, setIngredientes] = useState<any[]>([]);
  const { state, dispatch } = useApp();
  const [supplier, setSupplier] = useState("");
  const [date, setDate] = useState(obtenerFechaLocalActual);

  useEffect(() => {
    cargarIngredientes();
  }, []);

  const cargarIngredientes = async () => {
    try {
      const datos = await obtenerIngredientes();

      console.log("Respuesta API ingredientes:", datos);

      setIngredientes(datos);
    } catch (error) {
      console.error(error);
    }
  };

  console.log("Ingredientes del store:", state.ingredients);

  const [items, setItems] = useState<
    Array<{
      ingredientId: string;
      quantity: string;
      totalPrice: string;
      expirationDate: string;
    }>
  >([
    {
      ingredientId: "",
      quantity: "",
      totalPrice: "",
      expirationDate: "",
    },
  ]);

  const addRow = () =>
    setItems((prev) => [
      ...prev,
      {
        ingredientId: "",
        quantity: "",
        totalPrice: "",
        expirationDate: "",
      },
    ]);

  const removeRow = (i: number) =>
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  const updateRow = (i: number, key: string, val: string) =>
    setItems((prev) =>
      prev.map((row, idx) => (idx === i ? { ...row, [key]: val } : row)),
    );

  const validItems = items.filter(
    (i) => i.ingredientId && Number(i.quantity) > 0 && Number(i.totalPrice) > 0,
  );

  const totalCost = validItems.reduce(
    (sum, i) => sum + Number(i.totalPrice),
    0,
  );

  const handleCreate = async () => {
    if (!supplier || validItems.length === 0) return;

    try {
      const compra = {
        proveedor: supplier,
        fecha: date,
        items: validItems.map((item) => ({
          ingredienteId: item.ingredientId,
          cantidad: Number(item.quantity),
          precioTotal: Number(item.totalPrice),
          fechaVencimiento: item.expirationDate || null,
        })),
      };
      console.log("Compra enviada:", compra);

      await registrarCompra(compra);

      await onCreated();

      onClose();
    } catch (error) {
      console.error(error);

      alert("No fue posible registrar la compra.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
        style={{ background: "oklch(0.13 0.008 240)" }}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h3 className="text-lg font-bold text-foreground">
            Nueva Orden de Compra
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Proveedor
              </label>
              <input
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="Nombre del proveedor"
                className="w-full px-4 py-3 rounded-xl glass border border-white/10 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              />
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
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs text-muted-foreground uppercase tracking-widest">
                Ingredientes
              </label>
              <button
                onClick={addRow}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Plus className="w-3 h-3" /> Agregar fila
              </button>
            </div>

            <div className="space-y-3">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground px-1">
                <span className="col-span-4">Ingrediente</span>
                <span className="col-span-2">Cantidad</span>
                <span className="col-span-2">Precio total</span>
                <span className="col-span-3">Vence</span>
                <span className="col-span-1" />
              </div>
              {items.map((item, i) => {
                const ingredient = ingredientes.find(
                  (ing) => ing.id === item.ingredientId,
                );
                const unitCost =
                  item.quantity && item.totalPrice
                    ? Number(item.totalPrice) / Number(item.quantity)
                    : null;
                return (
                  <div key={i} className="space-y-1">
                    <div className="grid grid-cols-12 gap-2">
                      <select
                        value={item.ingredientId}
                        onChange={(e) =>
                          updateRow(i, "ingredientId", e.target.value)
                        }
                        className="col-span-4 min-w-0 px-3 py-2.5 rounded-xl glass border border-white/10 text-foreground text-sm bg-transparent focus:outline-none focus:border-primary/50"
                      >
                        <option value="">Seleccionar...</option>
                        {ingredientes.map((ing) => (
                          <option key={ing.id} value={ing.id}>
                            {ing.name}
                          </option>
                        ))}
                      </select>

                      <div className="col-span-2 relative">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            updateRow(i, "quantity", e.target.value)
                          }
                          placeholder="0"
                          className="w-full min-w-0 px-3 py-2.5 rounded-xl glass border border-white/10 text-foreground text-sm focus:outline-none focus:border-primary/50"
                        />

                        {ingredient && (
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                            {ingredient.unit[0]}
                          </span>
                        )}
                      </div>

                      <input
                        type="number"
                        value={item.totalPrice}
                        onChange={(e) =>
                          updateRow(i, "totalPrice", e.target.value)
                        }
                        placeholder="$0"
                        className="col-span-2 min-w-0 px-2 py-2.5 rounded-xl glass border border-white/10 text-foreground text-sm focus:outline-none focus:border-primary/50"
                      />

                      <input
                        type="date"
                        value={item.expirationDate}
                        onChange={(e) =>
                          updateRow(i, "expirationDate", e.target.value)
                        }
                        className="col-span-3 min-w-0 w-full px-2 py-2.5 rounded-xl glass border border-white/10 text-foreground text-sm focus:outline-none focus:border-primary/50"
                      />

                      <button
                        onClick={() => removeRow(i)}
                        className="col-span-1 flex items-center justify-center text-muted-foreground hover:text-red-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {unitCost !== null && item.ingredientId && (
                      <div className="col-span-12 text-xs text-primary pl-1">
                        Costo unitario: {formatCurrency(unitCost)} /{" "}
                        {ingredient?.unit}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass rounded-xl p-4 border border-primary/20 flex justify-between">
            <span className="text-sm font-semibold text-foreground">
              Total de la orden
            </span>
            <span className="text-lg font-black text-primary">
              {formatCurrency(totalCost)}
            </span>
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t border-white/5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl glass border border-white/10 text-sm text-muted-foreground"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={!supplier || validItems.length === 0}
            className="flex-1 py-2.5 rounded-xl gradient-brand text-white text-sm font-bold disabled:opacity-40"
          >
            Crear Orden de Compra
          </button>
        </div>
      </div>
    </div>
  );
}

function PurchaseOrderCard({
  po,

  ingredientes,
}: {
  po: any;

  ingredientes: any[];
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="stat-card rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-foreground">
              {po.orderNumber}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full border ${po.status === "RECIBIDA"
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                }`}
            >
              {po.status === "RECIBIDA" ? "Recibida" : "Pendiente"}
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {po.supplier} · {formatearFechaLocal(po.date)}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-base font-bold text-primary">
              {formatCurrency(po.totalCost)}
            </div>
            <div className="text-xs text-muted-foreground">
              {po.items.length} ingredientes
            </div>
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
          <div className="space-y-2">
            {po.items.map((item: PurchaseOrderItem) => {
              const ingredient = ingredientes.find(
                (i) => i.id === item.ingredientId,
              );
              return (
                <div
                  key={item.ingredientId}
                  className="flex items-center justify-between text-sm p-2 rounded-lg"
                  style={{ background: "oklch(0.16 0.009 240)" }}
                >
                  <span className="text-foreground font-medium">
                    {ingredient?.name || "Ingrediente"}
                  </span>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>
                      {item.quantity} {ingredient?.unit}
                    </span>
                    <span className="text-foreground">
                      {formatCurrency(item.totalPrice)}
                    </span>
                    <span className="text-primary">
                      c/u: {formatCurrency(item.unitCost)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function PurchasesPage() {
  const [compras, setCompras] = useState<any[]>([]);

  const [showCreate, setShowCreate] = useState(false);

  const totalSpend = compras.reduce((sum, compra) => sum + compra.totalCost, 0);

  const [ingredientes, setIngredientes] = useState<any[]>([]);

  useEffect(() => {
    cargarCompras();
  }, []);

  const cargarCompras = async () => {
    try {
      const datosCompras = await obtenerCompras();

      const datosIngredientes = await obtenerIngredientes();

      setCompras(datosCompras);

      setIngredientes(datosIngredientes);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Órdenes de Compra
          </h2>
          <p className="text-sm text-muted-foreground">
            {compras.length} órdenes registradas
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-brand text-white text-sm font-semibold hover:opacity-90"
        >
          <Plus className="w-4 h-4" />
          Nueva Orden
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="stat-card rounded-xl p-4">
          <ShoppingCart className="w-5 h-5 text-primary mb-2" />
          <div className="text-xl font-black text-foreground">
            {compras.length}
          </div>
          <div className="text-xs text-muted-foreground">Total de órdenes</div>
        </div>
        <div className="stat-card rounded-xl p-4">
          <div className="text-xl font-black text-primary">
            {formatCurrency(totalSpend)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Gasto total en compras
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {compras.map((po) => (
          <PurchaseOrderCard key={po.id} po={po} ingredientes={ingredientes} />
        ))}
      </div>

      {showCreate && (
        <CreatePurchaseModal
          onClose={() => setShowCreate(false)}
          onCreated={cargarCompras}
        />
      )}
    </div>
  );
}
