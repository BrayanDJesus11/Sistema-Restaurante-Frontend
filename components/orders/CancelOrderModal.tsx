"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Order, useApp } from "@/lib/store";
import {
  actualizarEstadoPedido,
  cancelarManteniendoParaVenta,
} from "@/lib/pedidos";

import { obtenerIngredientesPedido } from "@/lib/pedidos";
import { registrarDesperdicio } from "@/lib/desperdicios";
import { obtenerIngredientes } from "@/lib/ingredientes";

export function CancelOrderModal({
  order,
  onClose,
  onUpdated,
}: {
  order: Order;
  onClose: () => void;
  onUpdated: () => Promise<void>;
}) {
  const { dispatch } = useApp();

  const [preparationStarted, setPreparationStarted] = useState<boolean | null>(
    null,
  );

  useEffect(() => {
    setPreparationStarted(order.status.toLowerCase() === "listo" ? true : null);
  }, [order.id, order.status]);

  const inventarioYaConsumido = order.status.toLowerCase() === "listo";

  const [mostrarIngredientes, setMostrarIngredientes] = useState(false);

  const [ingredientes, setIngredientes] = useState<any[]>([]);

  const [cargandoIngredientes, setCargandoIngredientes] = useState(false);

  const [ingredientesSeleccionados, setIngredientesSeleccionados] = useState<
    string[]
  >([]);

  const handleCancelOrder = async () => {
    try {
      await actualizarEstadoPedido(order.id, "CANCELADO");

      await onUpdated();

      onClose();
    } catch (error) {
      console.error(error);
      alert("No fue posible cancelar el pedido.");
    }
  };

  const handleMantenerParaVenta = async () => {
    try {
      await cancelarManteniendoParaVenta(order.id);

      await onUpdated();

      onClose();
    } catch (error) {
      console.error(error);
      alert("No fue posible mantener el pedido para la venta.");
    }
  };

  const handleMostrarIngredientes = async () => {
    console.log("Entró a handleMostrarIngredientes");

    try {
      setCargandoIngredientes(true);

      const datos = await obtenerIngredientesPedido(order.id);

      console.log(datos);

      setIngredientes(datos);

      setIngredientesSeleccionados(datos.map((i: any) => i.ingredienteId));

      setMostrarIngredientes(true);
    } catch (error) {
      console.error(error);
      alert("No fue posible obtener los ingredientes.");
    } finally {
      setCargandoIngredientes(false);
    }
  };

  const handleRegistrarDesperdicio = async () => {
    try {
      const data = {
        pedidoId: order.id,
        motivo: "Pedido cancelado",
        tipo: "PEDIDO_CANCELADO",
        detalles: ingredientes
          .filter((i) => ingredientesSeleccionados.includes(i.ingredienteId))
          .map((i) => ({
            ingredienteId: i.ingredienteId,
            cantidad: i.cantidad,
          })),
      };

      await registrarDesperdicio(data);

      await actualizarEstadoPedido(order.id, "CANCELADO");

      // Recargar inventario desde el backend
      const ingredientesActualizados = await obtenerIngredientes();

      dispatch({
        type: "CARGAR_INGREDIENTES",
        payload: ingredientesActualizados,
      });

      await onUpdated();

      onClose();
    } catch (error) {
      console.error(error);

      alert("No fue posible registrar el desperdicio.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-md rounded-2xl border border-white/10 overflow-hidden"
        style={{ background: "oklch(0.13 0.008 240)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h2 className="text-lg font-bold text-foreground">Cancelar Pedido</h2>

          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <p className="text-sm text-muted-foreground">
            Pedido{" "}
            <span className="font-semibold text-foreground">
              #{order.orderNumber}
            </span>
          </p>

          {preparationStarted === null &&
            order.status.toLowerCase() === "pendiente" && (
              <>
                <p className="text-sm text-muted-foreground">
                  ¿El pedido ya inició preparación?
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPreparationStarted(false)}
                    className="rounded-xl border border-white/10 py-3 hover:border-primary/40 transition-all"
                  >
                    No inició preparación
                  </button>

                  <button
                    onClick={() => setPreparationStarted(true)}
                    className="rounded-xl border border-white/10 py-3 hover:border-primary/40 transition-all"
                  >
                    Sí inició preparación
                  </button>
                </div>
              </>
            )}
          {preparationStarted === true &&
            !mostrarIngredientes &&
            !inventarioYaConsumido && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  ¿Qué deseas hacer con la preparación?
                </p>

                <button
                  onClick={handleMantenerParaVenta}
                  className="w-full rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-3 text-emerald-400"
                >
                  Mantener preparación para otra venta
                </button>

                <button
                  onClick={handleMostrarIngredientes}
                  disabled={cargandoIngredientes}
                  className="w-full rounded-xl border border-orange-500/30 bg-orange-500/10 py-3 text-orange-400 disabled:opacity-50"
                >
                  {cargandoIngredientes
                    ? "Cargando ingredientes..."
                    : "Registrar desperdicio"}
                </button>
              </div>
            )}

          {(preparationStarted === false || inventarioYaConsumido) && (
            <div className="space-y-3">
              <p className="text-lg font-semibold text-foreground">
                Cancelar pedido #{order.orderNumber}
              </p>

              <p className="text-sm text-muted-foreground">
                {inventarioYaConsumido
                  ? "El inventario ya fue descontado por este pedido. Al cancelarlo, el consumo realizado se registrará como desperdicio sin volver a descontar inventario."
                  : "El pedido se cancelará sin afectar inventario ni desperdicios."}
              </p>

              <button
                onClick={handleCancelOrder}
                className="w-full rounded-xl border border-red-500/30 bg-red-500/10 py-3 text-red-400 hover:bg-red-500/20 transition-all"
              >
                Confirmar cancelación
              </button>
            </div>
          )}

          {mostrarIngredientes && (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-foreground">
                Ingredientes detectados
              </p>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {ingredientes.map((ingrediente: any) => (
                  <label
                    key={ingrediente.ingredienteId}
                    className="flex items-center gap-3 rounded-xl border border-white/10 p-3 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={ingredientesSeleccionados.includes(
                        ingrediente.ingredienteId,
                      )}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setIngredientesSeleccionados((prev) => [
                            ...prev,
                            ingrediente.ingredienteId,
                          ]);
                        } else {
                          setIngredientesSeleccionados((prev) =>
                            prev.filter(
                              (id) => id !== ingrediente.ingredienteId,
                            ),
                          );
                        }
                      }}
                    />

                    <div className="flex-1">
                      <div className="text-sm font-medium text-foreground">
                        {ingrediente.nombre}
                      </div>

                      <div className="text-xs text-muted-foreground">
                        {ingrediente.cantidad} {ingrediente.unidad}
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <button
                onClick={handleRegistrarDesperdicio}
                className="w-full rounded-xl border border-orange-500/30 bg-orange-500/10 py-3 text-orange-400"
              >
                Registrar desperdicio
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/5">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl glass border border-white/10"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
