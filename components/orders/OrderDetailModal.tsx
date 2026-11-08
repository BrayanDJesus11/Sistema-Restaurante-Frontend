"use client";

import { useState } from "react";
import { useApp, Order, formatCurrency } from "@/lib/store";
import { X, Clock, DollarSign, Check, Plus } from "lucide-react";
import { registrarPago, agregarTiempo } from "@/lib/pedidos";

export function OrderDetailModal({
  order,
  onClose,
  onUpdated,
  onEdit,
}: {
  order: Order;
  onClose: () => void;
  onUpdated: () => Promise<void>;
  onEdit: (order: Order) => void;
}) {
  const [paymentMethod, setPaymentMethod] = useState<
    "efectivo" | "transferencia" | "mixto"
  >("efectivo");
  const [cashAmount, setCashAmount] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [customTime, setCustomTime] = useState("");

  const handlePayment = async () => {
    try {
      await registrarPago(order.id, {
        paymentMethod,
        cashAmount:
          paymentMethod === "efectivo"
            ? order.total
            : paymentMethod === "mixto"
              ? Number(cashAmount)
              : 0,

        transferAmount:
          paymentMethod === "transferencia"
            ? order.total
            : paymentMethod === "mixto"
              ? Number(transferAmount)
              : 0,
      });

      await onUpdated();

      onClose();
    } catch (error) {
      console.error(error);

      alert("No fue posible registrar el pago.");
    }
  };

  const mixedTotal = Number(cashAmount || 0) + Number(transferAmount || 0);
  const mixedValid =
    paymentMethod !== "mixto" || Math.abs(mixedTotal - order.total) < 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
        style={{ background: "oklch(0.13 0.008 240)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Pedido #{order.orderNumber}
            </h2>
            <p className="text-xs text-muted-foreground capitalize">
              {order.type.replace("-", " ")}
              {order.type === "mesa" && ` · Mesa ${order.tableNumber}`}
              {order.type !== "mesa" &&
                order.customerName &&
                ` · ${order.customerName}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Información del pedido */}
          <div className="glass rounded-xl p-4 border border-white/10 space-y-2">
            <div className="text-xs text-muted-foreground">
              📅 <span className="font-semibold">Creado:</span>{" "}
              {order.createdAt
                ? `${new Date(order.createdAt).toLocaleDateString("es-CO")} · ${new Date(
                    order.createdAt,
                  ).toLocaleTimeString("es-CO", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`
                : "No disponible"}
            </div>

            {order.paidAt && (
              <div className="text-xs text-muted-foreground">
                💳 <span className="font-semibold">Pagado:</span>{" "}
                {`${new Date(order.paidAt).toLocaleDateString("es-CO")} · ${new Date(
                  order.paidAt,
                ).toLocaleTimeString("es-CO", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}`}
              </div>
            )}
          </div>

          {/* Items */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Productos</h3>
            {order.items.map((item) => (
              <div key={item.productId} className="stat-card rounded-xl p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-semibold text-foreground">
                    {item.quantity}x {item.productName}
                  </span>
                  <span className="text-sm font-bold text-primary">
                    {formatCurrency(item.subtotal)}
                  </span>
                </div>
                {item.extras && item.extras.length > 0 && (
                  <div className="space-y-1">
                    {(item.extras ?? []).map((extra) => (
                      <div
                        key={extra.extraId}
                        className="flex justify-between text-xs"
                      >
                        <span className="text-muted-foreground">
                          + {extra.name}
                        </span>

                        {extra.price > 0 && (
                          <span className="text-muted-foreground">
                            {formatCurrency(extra.price)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {item.notes && (
                  <p className="text-xs text-muted-foreground mt-1 italic">
                    {item.notes}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Payment (if delivered) */}
          {order.status.toLowerCase() === "entregado" && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                Método de Pago
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: "efectivo", label: "Efectivo" },
                  { value: "transferencia", label: "Transferencia" },
                  { value: "mixto", label: "Mixto" },
                ].map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setPaymentMethod(m.value as any)}
                    className={`py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      paymentMethod === m.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-white/10 text-muted-foreground hover:border-primary/30"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              {paymentMethod === "mixto" && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">
                      Monto en Efectivo
                    </label>
                    <input
                      type="number"
                      value={cashAmount}
                      onChange={(e) => setCashAmount(e.target.value)}
                      placeholder="0"
                      className="w-full px-4 py-2.5 rounded-xl glass border border-white/10 text-foreground text-sm focus:outline-none focus:border-primary/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">
                      Monto en Transferencia
                    </label>
                    <input
                      type="number"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      placeholder="0"
                      className="w-full px-4 py-2.5 rounded-xl glass border border-white/10 text-foreground text-sm focus:outline-none focus:border-primary/50"
                    />
                  </div>
                  <div
                    className={`flex justify-between text-sm p-3 rounded-xl border ${
                      mixedValid
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : "bg-red-500/10 border-red-500/30 text-red-400"
                    }`}
                  >
                    <span>Total acumulado</span>
                    <span className="font-bold">
                      {formatCurrency(mixedTotal)}
                    </span>
                  </div>
                  {!mixedValid && (
                    <p className="text-xs text-red-400">
                      El total debe ser exactamente{" "}
                      {formatCurrency(order.total)}. Falta:{" "}
                      {formatCurrency(order.total - mixedTotal)}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Payment info (if paid) */}
          {order.status.toLowerCase() === "pagado" && (
            <div className="glass rounded-xl p-4 border border-emerald-500/30 bg-emerald-500/10">
              <div className="flex items-center gap-2 text-emerald-400 mb-2">
                <Check className="w-4 h-4" />
                <span className="text-sm font-semibold">Pedido pagado</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Método: {order.paymentMethod}
                {order.paidAt &&
                  ` · ${new Date(order.paidAt).toLocaleTimeString("es-CO")}`}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/5">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-xl font-black text-primary">
              {formatCurrency(order.total)}
            </span>
          </div>
          <div className="flex gap-3">
            {(order.status.toLowerCase() === "pendiente" ||
              order.status.toLowerCase() === "listo") && (
              <button
                onClick={() => onEdit(order)}
                className="flex-1 py-2.5 rounded-xl border border-primary/30 bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-all"
              >
                Editar Pedido
              </button>
            )}

            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl glass border border-white/10 text-sm text-muted-foreground hover:text-foreground transition-all"
            >
              Cerrar
            </button>

            {order.status.toLowerCase() === "entregado" && (
              <button
                onClick={handlePayment}
                disabled={!mixedValid}
                className="flex-1 py-2.5 rounded-xl gradient-brand text-white text-sm font-bold disabled:opacity-40 transition-all hover:opacity-90"
              >
                Registrar Pago
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
