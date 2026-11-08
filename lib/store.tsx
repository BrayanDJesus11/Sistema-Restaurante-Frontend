"use client";

import React, { createContext, useContext, useReducer, useEffect } from "react";

import { obtenerConfiguracion } from "@/lib/configuracion";
import { obtenerGastos } from "@/lib/gastos";
// ─── TYPES ───────────────────────────────────────────────────────────────────

export type UserRole = "dueno" | "empleado";
export type OrderType = "mesa" | "para-llevar" | "domicilio";
export type OrderStatus =
  | "pendiente"
  | "listo"
  | "entregado"
  | "pagado"
  | "cancelado";
export type PaymentMethod = "efectivo" | "transferencia" | "mixto";
export type IngredientUnit =
  | "unidad"
  | "gramo"
  | "kilogramo"
  | "litro"
  | "mililitro";

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
}

export interface IngredientBatch {
  id: string;
  purchaseOrderId: string;
  purchaseDate: string;
  quantity: number;
  remainingQuantity: number;
  unitCost: number;
  expirationDate?: string;
}

export interface Ingredient {
  id: string;
  name: string;
  unit: IngredientUnit;
  batches: IngredientBatch[];
  minStock: number;
  expirationAlertDays: number;
}

export interface PurchaseOrderItem {
  ingredientId: string;
  quantity: number;
  totalPrice: number;
  unitCost: number;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  date: string;
  supplier: string;
  items: PurchaseOrderItem[];
  totalCost: number;
  status: "pendiente" | "recibida";
}

export interface RecipeIngredient {
  ingredientId: string;
  quantity: number;
}

export interface ProductExtra {
  id: string;
  ingredientId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  recipe: RecipeIngredient[];
  extras: ProductExtra[];
  imageUrl?: string;
  active: boolean;
}

export interface OrderItemExtra {
  extraId: string;
  ingredientId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  extras: OrderItemExtra[];
  subtotal: number;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  type: OrderType;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  estimatedMinutes: number;
  additionalMinutes: number;
  createdAt: string;
  tableNumber?: string;
  customerName?: string;
  address?: string;
  paymentMethod?: PaymentMethod;
  cashAmount?: number;
  transferAmount?: number;
  paidAt?: string;
  costoProduccion?: number | null;
  mantenerParaVenta?: boolean;
}

export interface OperationalExpense {
  id: string;
  name: string;
  amount: number;
  category: string;
  date: string;
  recurring: boolean;
  frequency?: "diario" | "semanal" | "mensual" | "anual";
}

export interface WasteRecord {
  id: string;
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: string;
  reason: string;
  cost: number;
  date: string;
}

export interface Alert {
  id: string;
  type:
  | "pedido-retrasado"
  | "pedido-sin-pagar"
  | "stock-bajo"
  | "proxima-vencimiento"
  | "ingrediente-vencido";
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  relatedId?: string;
}

export interface Settings {
  restaurantName: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  workdayStart: string;
  workdayEnd: string;
  jornadaConfigurada: boolean;
  jornadaActiva: boolean;
  lowStockThreshold: number;
  expirationAlertDays: number;
  defaultPrepTimes: number[];
  theme: "dark" | "light";
}

export interface AppState {
  user: User | null;
  ingredients: Ingredient[];
  purchaseOrders: PurchaseOrder[];
  products: Product[];
  orders: Order[];
  operationalExpenses: OperationalExpense[];
  wasteRecords: WasteRecord[];
  alerts: Alert[];
  settings: Settings;
  currentPage: string;
}

// ─── INITIAL DATA ────────────────────────────────────────────────────────────

const defaultSettings: Settings = {
  restaurantName: "FastBurger",
  address: "Calle 123 # 45-67, Bogotá",
  phone: "+57 300 123 4567",
  email: "info@fastburger.com",
  currency: "COP",
  workdayStart: "17:00",
  workdayEnd: "01:00",
  jornadaConfigurada: false,
  jornadaActiva: false,
  lowStockThreshold: 10,
  expirationAlertDays: 3,
  defaultPrepTimes: [10, 15, 20],
  theme: "dark",
};

const initialIngredients: Ingredient[] = [
  {
    id: "i1",
    name: "Pan de hamburguesa",
    unit: "unidad",
    batches: [
      {
        id: "b1",
        purchaseOrderId: "po1",
        purchaseDate: "2026-06-10",
        quantity: 100,
        remainingQuantity: 65,
        unitCost: 500,
        expirationDate: "2026-06-20",
      },
    ],
    minStock: 20,
    expirationAlertDays: 3,
  },
  {
    id: "i2",
    name: "Salchicha ranchera",
    unit: "unidad",
    batches: [
      {
        id: "b2",
        purchaseOrderId: "po1",
        purchaseDate: "2026-06-10",
        quantity: 80,
        remainingQuantity: 50,
        unitCost: 1200,
        expirationDate: "2026-06-25",
      },
    ],
    minStock: 15,
    expirationAlertDays: 3,
  },
  {
    id: "i3",
    name: "Lechuga",
    unit: "gramo",
    batches: [
      {
        id: "b3",
        purchaseOrderId: "po1",
        purchaseDate: "2026-06-10",
        quantity: 2000,
        remainingQuantity: 1200,
        unitCost: 0.8,
        expirationDate: "2026-06-18",
      },
    ],
    minStock: 300,
    expirationAlertDays: 3,
  },
  {
    id: "i4",
    name: "Queso cheddar",
    unit: "gramo",
    batches: [
      {
        id: "b4",
        purchaseOrderId: "po1",
        purchaseDate: "2026-06-10",
        quantity: 1000,
        remainingQuantity: 700,
        unitCost: 1.5,
        expirationDate: "2026-06-30",
      },
    ],
    minStock: 200,
    expirationAlertDays: 3,
  },
  {
    id: "i5",
    name: "Salsa especial",
    unit: "gramo",
    batches: [
      {
        id: "b5",
        purchaseOrderId: "po1",
        purchaseDate: "2026-06-10",
        quantity: 800,
        remainingQuantity: 600,
        unitCost: 0.6,
        expirationDate: "2026-07-10",
      },
    ],
    minStock: 100,
    expirationAlertDays: 3,
  },
  {
    id: "i6",
    name: "Papa crispy",
    unit: "gramo",
    batches: [
      {
        id: "b6",
        purchaseOrderId: "po2",
        purchaseDate: "2026-06-12",
        quantity: 5000,
        remainingQuantity: 3200,
        unitCost: 0.4,
        expirationDate: "2026-07-15",
      },
    ],
    minStock: 500,
    expirationAlertDays: 3,
  },
  {
    id: "i7",
    name: "Carne de res",
    unit: "gramo",
    batches: [
      {
        id: "b7",
        purchaseOrderId: "po2",
        purchaseDate: "2026-06-12",
        quantity: 3000,
        remainingQuantity: 1800,
        unitCost: 2.5,
        expirationDate: "2026-06-19",
      },
    ],
    minStock: 400,
    expirationAlertDays: 2,
  },
];

const initialProducts: Product[] = [
  {
    id: "p1",
    name: "Hamburguesa Clásica",
    price: 15000,
    category: "Hamburguesas",
    recipe: [
      { ingredientId: "i1", quantity: 1 },
      { ingredientId: "i7", quantity: 150 },
      { ingredientId: "i3", quantity: 30 },
      { ingredientId: "i5", quantity: 20 },
    ],
    extras: [],
    active: true,
  },
  {
    id: "p2",
    name: "Perro Caliente",
    price: 10000,
    category: "Perros Calientes",
    recipe: [
      { ingredientId: "i1", quantity: 1 },
      { ingredientId: "i2", quantity: 1 },
      { ingredientId: "i3", quantity: 20 },
      { ingredientId: "i5", quantity: 15 },
    ],
    extras: [],
    active: true,
  },
  {
    id: "p3",
    name: "Hamburguesa Doble",
    price: 22000,
    category: "Hamburguesas",
    recipe: [
      { ingredientId: "i1", quantity: 1 },
      { ingredientId: "i7", quantity: 300 },
      { ingredientId: "i4", quantity: 50 },
      { ingredientId: "i3", quantity: 40 },
      { ingredientId: "i5", quantity: 25 },
    ],
    extras: [],
    active: true,
  },
  {
    id: "p4",
    name: "Papas Fritas",
    price: 7000,
    category: "Acompañamientos",
    recipe: [{ ingredientId: "i6", quantity: 200 }],
    extras: [],
    active: true,
  },
  {
    id: "p5",
    name: "Perro Ranchero",
    price: 13000,
    category: "Perros Calientes",
    recipe: [
      { ingredientId: "i1", quantity: 1 },
      { ingredientId: "i2", quantity: 2 },
      { ingredientId: "i4", quantity: 30 },
      { ingredientId: "i5", quantity: 20 },
    ],
    extras: [],
    active: true,
  },
];

const initialOrders: Order[] = [
  {
    id: "o1",
    orderNumber: "001",
    type: "mesa",
    status: "pendiente",
    items: [
      {
        id: "oi1",
        productId: "p1",
        productName: "Hamburguesa Clásica",
        quantity: 2,
        unitPrice: 15000,
        extras: [],
        subtotal: 34000,
      },
      {
        id: "oi2",
        productId: "p4",
        productName: "Papas Fritas",
        quantity: 2,
        unitPrice: 7000,
        extras: [],
        subtotal: 14000,
      },
    ],
    total: 48000,
    estimatedMinutes: 15,
    additionalMinutes: 0,
    createdAt: new Date(Date.now() - 12 * 60000).toISOString(),
    tableNumber: "3",
  },
  {
    id: "o2",
    orderNumber: "002",
    type: "para-llevar",
    status: "listo",
    items: [
      {
        id: "oi3",
        productId: "p2",
        productName: "Perro Caliente",
        quantity: 1,
        unitPrice: 10000,
        extras: [],
        subtotal: 13000,
      },
    ],
    total: 13000,
    estimatedMinutes: 10,
    additionalMinutes: 0,
    createdAt: new Date(Date.now() - 8 * 60000).toISOString(),
    customerName: "Carlos R.",
  },
  {
    id: "o3",
    orderNumber: "003",
    type: "domicilio",
    status: "entregado",
    items: [
      {
        id: "oi4",
        productId: "p3",
        productName: "Hamburguesa Doble",
        quantity: 1,
        unitPrice: 22000,
        extras: [],
        subtotal: 22000,
      },
      {
        id: "oi5",
        productId: "p4",
        productName: "Papas Fritas",
        quantity: 1,
        unitPrice: 7000,
        extras: [],
        subtotal: 7000,
      },
    ],
    total: 29000,
    estimatedMinutes: 20,
    additionalMinutes: 5,
    createdAt: new Date(Date.now() - 35 * 60000).toISOString(),
    customerName: "María L.",
    address: "Cra 7 # 23-45",
  },
];

const initialPurchaseOrders: PurchaseOrder[] = [
  {
    id: "po1",
    orderNumber: "OC-001",
    date: "2026-06-10",
    supplier: "Distribuidora Alimentos S.A.S",
    items: [
      { ingredientId: "i1", quantity: 100, totalPrice: 50000, unitCost: 500 },
      { ingredientId: "i2", quantity: 80, totalPrice: 96000, unitCost: 1200 },
      { ingredientId: "i3", quantity: 2000, totalPrice: 1600, unitCost: 0.8 },
      { ingredientId: "i4", quantity: 1000, totalPrice: 1500, unitCost: 1.5 },
      { ingredientId: "i5", quantity: 800, totalPrice: 480, unitCost: 0.6 },
    ],
    totalCost: 149580,
    status: "recibida",
  },
  {
    id: "po2",
    orderNumber: "OC-002",
    date: "2026-06-12",
    supplier: "Carnes Premium Ltda",
    items: [
      { ingredientId: "i6", quantity: 5000, totalPrice: 2000, unitCost: 0.4 },
      { ingredientId: "i7", quantity: 3000, totalPrice: 7500, unitCost: 2.5 },
    ],
    totalCost: 9500,
    status: "recibida",
  },
];

const initialExpenses: OperationalExpense[] = [
  {
    id: "exp1",
    name: "Arriendo",
    amount: 2500000,
    category: "Inmueble",
    date: "2026-06-01",
    recurring: true,
    frequency: "mensual",
  },
  {
    id: "exp2",
    name: "Gas",
    amount: 180000,
    category: "Servicios",
    date: "2026-06-05",
    recurring: true,
    frequency: "mensual",
  },
  {
    id: "exp3",
    name: "Electricidad",
    amount: 350000,
    category: "Servicios",
    date: "2026-06-05",
    recurring: true,
    frequency: "mensual",
  },
  {
    id: "exp4",
    name: "Sueldos",
    amount: 4500000,
    category: "Personal",
    date: "2026-06-01",
    recurring: true,
    frequency: "mensual",
  },
  {
    id: "exp5",
    name: "Internet",
    amount: 89000,
    category: "Servicios",
    date: "2026-06-05",
    recurring: true,
    frequency: "mensual",
  },
];

const initialWaste: WasteRecord[] = [
  {
    id: "w1",
    ingredientId: "i3",
    ingredientName: "Lechuga",
    quantity: 200,
    unit: "gramo",
    reason: "Vencimiento",
    cost: 160,
    date: "2026-06-14",
  },
  {
    id: "w2",
    ingredientId: "i7",
    ingredientName: "Carne de res",
    quantity: 100,
    unit: "gramo",
    reason: "Cocción fallida",
    cost: 250,
    date: "2026-06-15",
  },
];

const initialAlerts: Alert[] = [];

const initialState: AppState = {
  user: null,
  ingredients: initialIngredients,
  purchaseOrders: initialPurchaseOrders,
  products: initialProducts,
  orders: initialOrders,
  operationalExpenses: initialExpenses,
  wasteRecords: initialWaste,
  alerts: initialAlerts,
  settings: defaultSettings,
  currentPage: "dashboard",
};

// ─── ACTIONS ─────────────────────────────────────────────────────────────────
type Action =
  | { type: "LOGIN"; payload: User }
  | { type: "LOGOUT" }
  | { type: "SET_PAGE"; payload: string }
  | { type: "ADD_ORDER"; payload: Order }
  | { type: "UPDATE_ORDER"; payload: Order }
  | {
    type: "UPDATE_ORDER_STATUS";
    payload: { id: string; status: OrderStatus };
  }
  | { type: "ADD_TIME_TO_ORDER"; payload: { id: string; minutes: number } }
  | { type: "ADD_INGREDIENT"; payload: Ingredient }
  | { type: "CARGAR_INGREDIENTES"; payload: Ingredient[] }
  | { type: "UPDATE_INGREDIENT"; payload: Ingredient }
  | { type: "DELETE_INGREDIENT"; payload: string }
  | { type: "ADD_PURCHASE_ORDER"; payload: PurchaseOrder }
  | { type: "UPDATE_PURCHASE_ORDER"; payload: PurchaseOrder }
  | { type: "ADD_PRODUCT"; payload: Product }
  | { type: "CARGAR_PRODUCTOS"; payload: Product[] }
  | { type: "UPDATE_PRODUCT"; payload: Product }
  | { type: "DELETE_PRODUCT"; payload: string }
  | { type: "CARGAR_GASTOS"; payload: OperationalExpense[] }
  | { type: "ADD_EXPENSE"; payload: OperationalExpense }
  | { type: "UPDATE_EXPENSE"; payload: OperationalExpense }
  | { type: "DELETE_EXPENSE"; payload: string }
  | { type: "ADD_WASTE"; payload: WasteRecord }
  | { type: "MARK_ALERT_READ"; payload: string }
  | { type: "DISMISS_ALERT"; payload: string }
  | { type: "ADD_ALERT"; payload: Alert }
  | { type: "UPDATE_SETTINGS"; payload: Partial<Settings> };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "LOGIN":
      return { ...state, user: action.payload };
    case "LOGOUT":
      return { ...state, user: null, currentPage: "dashboard" };
    case "SET_PAGE":
      return { ...state, currentPage: action.payload };
    case "ADD_ORDER":
      return { ...state, orders: [action.payload, ...state.orders] };
    case "UPDATE_ORDER":
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.payload.id ? action.payload : o,
        ),
      };
    case "UPDATE_ORDER_STATUS":
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.payload.id
            ? {
              ...o,
              status: action.payload.status,
              ...(action.payload.status === "pagado"
                ? { paidAt: new Date().toISOString() }
                : {}),
            }
            : o,
        ),
      };
    case "ADD_TIME_TO_ORDER":
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.payload.id
            ? {
              ...o,
              additionalMinutes: o.additionalMinutes + action.payload.minutes,
            }
            : o,
        ),
      };
    case "ADD_INGREDIENT":
      return { ...state, ingredients: [...state.ingredients, action.payload] };
    case "UPDATE_INGREDIENT":
      return {
        ...state,
        ingredients: state.ingredients.map((i) =>
          i.id === action.payload.id ? action.payload : i,
        ),
      };
    case "DELETE_INGREDIENT":
      return {
        ...state,
        ingredients: state.ingredients.filter((i) => i.id !== action.payload),
      };

    case "CARGAR_INGREDIENTES":
      return {
        ...state,
        ingredients: action.payload,
      };
    case "ADD_PURCHASE_ORDER":
      return {
        ...state,
        purchaseOrders: [action.payload, ...state.purchaseOrders],
      };
    case "UPDATE_PURCHASE_ORDER":
      return {
        ...state,
        purchaseOrders: state.purchaseOrders.map((p) =>
          p.id === action.payload.id ? action.payload : p,
        ),
      };
    case "CARGAR_PRODUCTOS":
      return {
        ...state,
        products: action.payload,
      };

    case "ADD_PRODUCT":
      return {
        ...state,
        products: [...state.products, action.payload],
      };
    case "UPDATE_PRODUCT":
      return {
        ...state,
        products: state.products.map((p) =>
          p.id === action.payload.id ? action.payload : p,
        ),
      };
    case "DELETE_PRODUCT":
      return {
        ...state,
        products: state.products.filter((p) => p.id !== action.payload),
      };
    case "CARGAR_GASTOS":
      return {
        ...state,
        operationalExpenses: action.payload,
      };
    case "ADD_EXPENSE":
      return {
        ...state,
        operationalExpenses: [...state.operationalExpenses, action.payload],
      };
    case "UPDATE_EXPENSE":
      return {
        ...state,
        operationalExpenses: state.operationalExpenses.map((e) =>
          e.id === action.payload.id ? action.payload : e,
        ),
      };
    case "DELETE_EXPENSE":
      return {
        ...state,
        operationalExpenses: state.operationalExpenses.filter(
          (e) => e.id !== action.payload,
        ),
      };
    case "ADD_WASTE":
      return {
        ...state,
        wasteRecords: [...state.wasteRecords, action.payload],
      };
    case "MARK_ALERT_READ":
      return {
        ...state,
        alerts: state.alerts.map((a) =>
          a.id === action.payload ? { ...a, read: true } : a,
        ),
      };
    case "DISMISS_ALERT":
      return {
        ...state,
        alerts: state.alerts.filter((a) => a.id !== action.payload),
      };
    case "ADD_ALERT":
      return { ...state, alerts: [action.payload, ...state.alerts] };
    case "UPDATE_SETTINGS":
      return { ...state, settings: { ...state.settings, ...action.payload } };
    default:
      return state;
  }
}

// ─── CONTEXT ─────────────────────────────────────────────────────────────────

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    async function cargarGastos() {
      try {
        const gastos = await obtenerGastos();

        dispatch({
          type: "CARGAR_GASTOS",
          payload: gastos,
        });
      } catch (error) {
        console.error("Error al cargar los gastos:", error);
      }
    }

    cargarGastos();
  }, []);

  useEffect(() => {
    let cancelado = false;
    let cargando = false;

    const cargarConfiguracion = async () => {
      if (cargando) return;

      cargando = true;

      try {
        const configuracion = await obtenerConfiguracion();

        if (!cancelado) {
          dispatch({
            type: "UPDATE_SETTINGS",
            payload: {
              workdayStart: configuracion.workdayStart,
              workdayEnd: configuracion.workdayEnd,
              jornadaConfigurada: configuracion.jornadaConfigurada,
              jornadaActiva: configuracion.jornadaActiva,
            },
          });
        }
      } catch (error) {
        console.error("No fue posible cargar la configuración:", error);
      } finally {
        cargando = false;
      }
    };

    cargarConfiguracion();

    const intervalo = window.setInterval(cargarConfiguracion, 15000);

    return () => {
      cancelado = true;
      window.clearInterval(intervalo);
    };
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

// ─── UTILITY FUNCTIONS ───────────────────────────────────────────────────────

export function formatCurrency(amount: number, currency = "COP"): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getTotalStock(ingredient: Ingredient): number {
  return ingredient.batches.reduce((sum, b) => sum + b.remainingQuantity, 0);
}

export function getIngredientUnitCostFIFO(ingredient: Ingredient): number {
  const lotesConCosto = [...(ingredient.batches ?? [])]
    .filter(
      (lote) =>
        Number.isFinite(lote.unitCost) &&
        lote.unitCost >= 0,
    )
    .sort((a, b) => a.purchaseDate.localeCompare(b.purchaseDate));

  if (lotesConCosto.length === 0) return 0;

  // Priorizar el lote disponible más antiguo (FIFO).
  const loteDisponible = lotesConCosto.find(
    (lote) => lote.remainingQuantity > 0,
  );

  if (loteDisponible) {
    return loteDisponible.unitCost;
  }

  // Si todo el inventario está agotado, utilizar el último costo conocido.
  const ultimoLote = lotesConCosto[lotesConCosto.length - 1];

  return ultimoLote.unitCost;
}

export function calculateProductCost(
  product: Product,
  ingredients: Ingredient[],
): number {
  return product.recipe.reduce((total, ri) => {
    const ingredient = ingredients.find((i) => i.id === ri.ingredientId);
    if (!ingredient) return total;
    const unitCost = getIngredientUnitCostFIFO(ingredient);
    return total + unitCost * ri.quantity;
  }, 0);
}

export function calculateExtraCost(
  extra: ProductExtra,
  ingredients: Ingredient[],
): number {
  const ingredient = ingredients.find((i) => i.id === extra.ingredientId);

  if (!ingredient) return 0;

  const unitCost = getIngredientUnitCostFIFO(ingredient);

  return unitCost * extra.quantity;
}

export function calculateAvailableQuantity(
  product: Product,
  ingredients: Ingredient[],
): number {
  if (product.recipe.length === 0) return 999;
  let minQty = Infinity;
  for (const ri of product.recipe) {
    const ingredient = ingredients.find((i) => i.id === ri.ingredientId);
    if (!ingredient) return 0;
    const stock = getTotalStock(ingredient);
    const canMake = Math.floor(stock / ri.quantity);
    if (canMake < minQty) minQty = canMake;
  }
  return minQty === Infinity ? 0 : minQty;
}

export function getOrderElapsedMinutes(order: Order): number {
  const elapsed = (Date.now() - new Date(order.createdAt).getTime()) / 60000;
  return Math.floor(elapsed);
}

export function isOrderDelayed(order: Order): boolean {
  const estado = order.status.toLowerCase();

  if (estado !== "pendiente" && estado !== "listo") return false;

  const elapsed = getOrderElapsedMinutes(order);

  return elapsed > order.estimatedMinutes + order.additionalMinutes;
}

export function getOrderTimerStatus(
  order: Order,
): "verde" | "amarillo" | "rojo" {
  const elapsed = getOrderElapsedMinutes(order);
  const total = order.estimatedMinutes + order.additionalMinutes;
  const ratio = elapsed / total;
  if (ratio < 0.7) return "verde";
  if (ratio < 1) return "amarillo";
  return "rojo";
}
