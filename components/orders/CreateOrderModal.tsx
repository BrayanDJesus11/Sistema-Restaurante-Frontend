"use client";

import { useState, useMemo } from "react";
import {
  useApp,
  Order,
  OrderItem,
  OrderItemExtra,
  ProductExtra,
  formatCurrency,
  calculateAvailableQuantity,
  getTotalStock,
  Product,
} from "@/lib/store";
import {
  X,
  Plus,
  Minus,
  Search,
  Clock,
  ChefHat,
  ShoppingBag,
  MapPin,
  Users,
} from "lucide-react";
import { registrarPedido, actualizarPedido } from "@/lib/pedidos";

interface CartItem {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  selectedExtras: OrderItemExtra[];
}

import { useEffect } from "react";
import { obtenerProductos } from "@/lib/productos";

export function CreateOrderModal({
  order,
  onClose,
  onCreated,
}: {
  order?: Order;
  onClose: () => void;
  onCreated: () => Promise<void> | void;
}) {
  const { state, dispatch } = useApp();
  const [step, setStep] = useState<"type" | "items" | "time">("type");
  const [orderType, setOrderType] = useState<
    "mesa" | "para-llevar" | "domicilio"
  >("mesa");
  const [tableNumber, setTableNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [address, setAddress] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | null>(null);
  const [customMinutes, setCustomMinutes] = useState("");
  const [search, setSearch] = useState("");
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const [productos, setProductos] = useState<any[]>([]);

  const cargarProductos = async () => {
    try {
      const datos = await obtenerProductos();

      console.log("Productos:", datos);

      setProductos(datos);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  useEffect(() => {
    if (!order) return;

    setOrderType(order.type);

    setTableNumber(order.tableNumber ?? "");

    setCustomerName(order.customerName ?? "");

    setAddress(order.address ?? "");

    setEstimatedMinutes(order.estimatedMinutes);

    setCart(
      order.items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        selectedExtras: [],
      })),
    );
  }, [order]);

  const filteredProducts = useMemo(
    () =>
      productos.filter(
        (p: any) =>
          p.active && p.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [productos, search],
  );

  const cartTotal = useMemo(
    () =>
      cart.reduce((sum, item) => {
        const extrasTotal = item.selectedExtras.reduce(
          (s, e) => s + e.price,
          0,
        );
        return sum + (item.unitPrice + extrasTotal) * item.quantity;
      }, 0),
    [cart],
  );

  const addToCart = (
    productId: string,
    productName: string,
    unitPrice: number,
  ) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing)
        return prev.map((i) =>
          i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i,
        );
      return [
        ...prev,
        { productId, productName, unitPrice, quantity: 1, selectedExtras: [] },
      ];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (!existing) return prev;
      if (existing.quantity === 1)
        return prev.filter((i) => i.productId !== productId);
      return prev.map((i) =>
        i.productId === productId ? { ...i, quantity: i.quantity - 1 } : i,
      );
    });
  };

  const toggleExtra = (productId: string, extra: OrderItemExtra) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.productId !== productId) return item;
        const hasExtra = item.selectedExtras.some(
          (e) => e.extraId === extra.extraId,
        );
        return {
          ...item,
          selectedExtras: hasExtra
            ? item.selectedExtras.filter((e) => e.extraId !== extra.extraId)
            : [...item.selectedExtras, extra],
        };
      }),
    );
  };

  const handleCreate = async () => {
    if (guardando) return;

    // Bloquear la creación si la jornada no está activa.
    // Las ediciones de pedidos existentes siguen permitidas.
    if (!order && !state.settings.jornadaActiva) {
      alert(
        !state.settings.jornadaConfigurada
          ? "No puedes registrar pedidos. Primero debes configurar la jornada operativa."
          : "No puedes registrar pedidos porque estás fuera del horario de la jornada."
      );
      return;
    }

    setGuardando(true);

    const minutes = estimatedMinutes ?? Number(customMinutes) ?? 15;

    try {
      const pedido = {
        type: orderType,
        customerName: orderType === "mesa" ? null : customerName,
        tableNumber: orderType === "mesa" ? tableNumber : null,
        address: orderType === "domicilio" ? address : null,
        estimatedMinutes: minutes,
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          extras: item.selectedExtras.map((extra) => ({
            extraId: extra.extraId,
            ingredienteId: extra.ingredientId,
            cantidad: extra.quantity,
            price: extra.price,
          })),
        })),
      };

      console.log("PEDIDO ENVIADO:", JSON.stringify(pedido, null, 2));

      if (order) {
        await actualizarPedido(order.id, pedido);
      } else {
        await registrarPedido(pedido);
      }

      await onCreated();

      onClose();

    } catch (error) {
      console.error(error);
      alert("No fue posible registrar el pedido.");
    } finally {
      setGuardando(false);
    }
  };

  const canProceed = () => {
    if (step === "type") {
      if (orderType === "mesa" && !tableNumber) return false;
      if (orderType !== "mesa" && !customerName) return false;
      if (orderType === "domicilio" && !address) return false;
      return true;
    }
    if (step === "items") return cart.length > 0;
    if (step === "time")
      return estimatedMinutes !== null || Number(customMinutes) > 0;
    return false;
  };

  const calcularInventarioDisponible = (
    product: Product,
    cartQuantity: number,
    selectedExtras: OrderItemExtra[],
  ): number => {
    const consumoPorIngrediente = new Map<string, number>();

    // Si el producto todavía no está en el carrito,
    // no debemos descontar absolutamente nada.
    if (cartQuantity === 0) {
      let stockMinimo = Infinity;

      for (const receta of product.recipe) {
        const ingredient = state.ingredients.find(
          (i) => i.id === receta.ingredientId,
        );

        if (!ingredient) {
          return 0;
        }

        const stock = getTotalStock(ingredient);

        if (stock < stockMinimo) {
          stockMinimo = stock;
        }
      }

      return stockMinimo === Infinity ? 999 : stockMinimo;
    }

    // =====================================================
    // CONSUMO REAL DEL PRODUCTO YA SELECCIONADO
    // =====================================================

    // Receta
    for (const receta of product.recipe) {
      const consumo = receta.quantity * cartQuantity;

      consumoPorIngrediente.set(
        receta.ingredientId,
        (consumoPorIngrediente.get(receta.ingredientId) || 0) + consumo,
      );
    }

    // Extras seleccionados
    for (const extra of selectedExtras) {
      const consumo = extra.quantity * cartQuantity;

      consumoPorIngrediente.set(
        extra.ingredientId,
        (consumoPorIngrediente.get(extra.ingredientId) || 0) + consumo,
      );
    }

    if (consumoPorIngrediente.size === 0) {
      return 999;
    }

    let minDisponible = Infinity;

    for (const [ingredientId, consumo] of consumoPorIngrediente) {
      const ingredient = state.ingredients.find((i) => i.id === ingredientId);

      if (!ingredient) {
        return 0;
      }

      const stock = getTotalStock(ingredient);

      const disponible = Math.max(0, stock - consumo);

      if (disponible < minDisponible) {
        minDisponible = disponible;
      }
    }

    return minDisponible === Infinity ? 0 : minDisponible;
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
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div>
            <h2 className="text-lg font-bold text-foreground">Nuevo Pedido</h2>
            <div className="flex items-center gap-2 mt-1">
              {["Tipo", "Productos", "Tiempo"].map((s, i) => (
                <div key={s} className="flex items-center gap-1">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${(step === "type" && i === 0) ||
                      (step === "items" && i === 1) ||
                      (step === "time" && i === 2)
                      ? "gradient-brand text-white"
                      : i < ["type", "items", "time"].indexOf(step)
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-white/10 text-muted-foreground"
                      }`}
                  >
                    {i + 1}
                  </div>
                  <span className="text-xs text-muted-foreground">{s}</span>
                  {i < 2 && <div className="w-4 h-px bg-white/10" />}
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Step 1: Order type */}
          {step === "type" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    type: "mesa",
                    label: "Mesa",
                    icon: Users,
                    desc: "Pedido en mesa",
                  },
                  {
                    type: "para-llevar",
                    label: "Para llevar",
                    icon: ShoppingBag,
                    desc: "Recogida en local",
                  },
                  {
                    type: "domicilio",
                    label: "Domicilio",
                    icon: MapPin,
                    desc: "Entrega a domicilio",
                  },
                ].map((opt) => (
                  <button
                    key={opt.type}
                    onClick={() => setOrderType(opt.type as any)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${orderType === opt.type
                      ? "border-primary bg-primary/10"
                      : "border-white/10 hover:border-primary/30"
                      }`}
                  >
                    <opt.icon
                      className={`w-5 h-5 mb-2 ${orderType === opt.type ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <div
                      className={`text-sm font-semibold ${orderType === opt.type ? "text-primary" : "text-foreground"}`}
                    >
                      {opt.label}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {opt.desc}
                    </div>
                  </button>
                ))}
              </div>
              {orderType === "mesa" && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">
                    Número de Mesa
                  </label>
                  <input
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="Ej: 5"
                    className="w-full px-4 py-3 rounded-xl glass border border-white/10 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                  />
                </div>
              )}
              {orderType !== "mesa" && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">
                    Nombre del Cliente
                  </label>
                  <input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nombre del cliente"
                    className="w-full px-4 py-3 rounded-xl glass border border-white/10 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                  />
                </div>
              )}
              {orderType === "domicilio" && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">
                    Dirección
                  </label>
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Dirección de entrega"
                    className="w-full px-4 py-3 rounded-xl glass border border-white/10 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 2: Products */}
          {step === "items" && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar producto..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl glass border border-white/10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                />
              </div>

              {filteredProducts.map((product) => {
                const cartItem = cart.find((i) => i.productId === product.id);

                const selectedExtras = cartItem?.selectedExtras || [];

                const availableForCart = calcularInventarioDisponible(
                  product,
                  cartItem?.quantity || 0,
                  selectedExtras,
                );

                const isExpanded = expandedProduct === product.id;

                return (
                  <div
                    key={product.id}
                    className="stat-card rounded-xl overflow-hidden"
                  >
                    <div className="flex items-center justify-between p-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">
                            {product.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({availableForCart} disp.)
                          </span>
                        </div>
                        <span className="text-primary font-bold text-sm">
                          {formatCurrency(product.price)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {product.extras.length > 0 && (
                          <button
                            onClick={() =>
                              setExpandedProduct(isExpanded ? null : product.id)
                            }
                            className="text-xs text-primary hover:underline px-2 py-1 rounded-lg glass border border-primary/20"
                          >
                            Extras
                          </button>
                        )}

                        {cartItem ? (
                          <div className="flex items-center gap-2 bg-primary/10 rounded-xl px-2 py-1 border border-primary/30">
                            <button
                              onClick={() => removeFromCart(product.id)}
                              className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-sm font-bold text-primary w-5 text-center">
                              {cartItem.quantity}
                            </span>
                            <button
                              onClick={() =>
                                addToCart(
                                  product.id,
                                  product.name,
                                  product.price,
                                )
                              }
                              className="w-6 h-6 rounded-full gradient-brand flex items-center justify-center text-white"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() =>
                              addToCart(product.id, product.name, product.price)
                            }
                            className="w-8 h-8 rounded-xl gradient-brand flex items-center justify-center text-white hover:opacity-90"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    {/* Extras panel */}
                    {isExpanded && cartItem && product.extras.length > 0 && (
                      <div className="px-4 pb-4 border-t border-white/5 pt-3">
                        <p className="text-xs text-muted-foreground mb-2">
                          Extras para {product.name}:
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {product.extras.map((extra: ProductExtra) => {
                            const isSelected = cartItem.selectedExtras.some(
                              (e) => e.extraId === extra.id,
                            );

                            return (
                              <button
                                key={extra.id}
                                onClick={() =>
                                  toggleExtra(product.id, {
                                    extraId: extra.id,
                                    ingredientId: extra.ingredientId,
                                    name: extra.name,
                                    quantity: extra.quantity,
                                    price: extra.price,
                                  })
                                }
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${isSelected
                                  ? "bg-primary/20 border-primary/40 text-primary"
                                  : "glass border-white/10 text-muted-foreground hover:border-primary/20"
                                  }`}
                              >
                                {extra.name}{" "}
                                <span className="text-muted-foreground">
                                  ({extra.quantity})
                                </span>{" "}
                                {extra.price > 0 &&
                                  `+${formatCurrency(extra.price)}`}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {cart.length > 0 && (
                <div className="glass rounded-xl p-4 border border-primary/20">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-foreground">
                      Total del pedido
                    </span>
                    <span className="text-lg font-black text-primary">
                      {formatCurrency(cartTotal)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Time */}
          {step === "time" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-primary" />
                <h3 className="text-base font-semibold text-foreground">
                  Tiempo estimado de preparación
                </h3>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {state.settings.defaultPrepTimes.map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setEstimatedMinutes(t);
                      setCustomMinutes("");
                    }}
                    className={`py-4 rounded-xl border-2 text-center font-bold transition-all ${estimatedMinutes === t
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-white/10 text-muted-foreground hover:border-primary/30"
                      }`}
                  >
                    <Clock className="w-5 h-5 mx-auto mb-1" />
                    {t} minutos
                  </button>
                ))}
                <button
                  onClick={() => {
                    setEstimatedMinutes(null);
                  }}
                  className={`py-4 rounded-xl border-2 text-center font-bold transition-all ${estimatedMinutes === null
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-white/10 text-muted-foreground hover:border-primary/30"
                    }`}
                >
                  <ChefHat className="w-5 h-5 mx-auto mb-1" />
                  Personalizado
                </button>
              </div>
              {estimatedMinutes === null && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">
                    Tiempo personalizado (minutos)
                  </label>
                  <input
                    type="number"
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(e.target.value)}
                    placeholder="Ej: 25"
                    min={1}
                    className="w-full px-4 py-3 rounded-xl glass border border-white/10 text-foreground text-sm focus:outline-none focus:border-primary/50"
                  />
                </div>
              )}
              {/* Summary */}
              <div className="glass rounded-xl p-4 border border-white/10 space-y-2">
                <div className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
                  Resumen del pedido
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tipo</span>
                  <span className="text-foreground font-medium capitalize">
                    {orderType.replace("-", " ")}
                  </span>
                </div>
                {orderType === "mesa" && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Mesa</span>
                    <span className="text-foreground font-medium">
                      {tableNumber}
                    </span>
                  </div>
                )}
                {orderType !== "mesa" && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Cliente</span>
                    <span className="text-foreground font-medium">
                      {customerName}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Productos</span>
                  <span className="text-foreground font-medium">
                    {cart.reduce((s, i) => s + i.quantity, 0)} items
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t border-white/5 pt-2 mt-2">
                  <span className="text-foreground">Total</span>
                  <span className="text-primary">
                    {formatCurrency(cartTotal)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-white/5">
          <button
            onClick={() => {
              if (step === "items") setStep("type");
              else if (step === "time") setStep("items");
              else onClose();
            }}
            className="px-5 py-2.5 rounded-xl glass border border-white/10 text-sm text-muted-foreground hover:text-foreground transition-all"
          >
            {step === "type" ? "Cancelar" : "Atrás"}
          </button>
          <button
            onClick={() => {
              if (guardando) return;

              if (step === "type") {
                setStep("items");
              } else if (step === "items") {
                setStep("time");
              } else {
                handleCreate();
              }
            }}
            disabled={!canProceed() || guardando}
            className="px-6 py-2.5 rounded-xl gradient-brand text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:opacity-90"
          >
            {step === "time"
              ? guardando
                ? "Creando..."
                : "Crear Pedido"
              : "Siguiente"}
          </button>
        </div>
      </div>
    </div>
  );
}
