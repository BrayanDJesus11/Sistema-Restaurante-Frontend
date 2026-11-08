"use client";

import { useState, useEffect } from "react";
import { useApp, Settings } from "@/lib/store";
import { UsuariosEmpleados } from "./UsuariosEmpleados";
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Bell,
  Clock,
  Save,
  CheckCircle,
  ChefHat,
  User,
  Shield,
  CalendarClock,
} from "lucide-react";

import {
  obtenerConfiguracion,
  actualizarConfiguracion,
} from "@/lib/configuracion";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="stat-card rounded-2xl p-6 border border-white/8">
      <h3 className="text-sm font-bold text-foreground uppercase tracking-widest mb-5 flex items-center gap-2">
        <span className="w-1 h-4 rounded-full gradient-brand" />
        {title}
      </h3>
      {children}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1.5 block">
        {label}
      </label>
      {children}
    </div>
  );
}

export function SettingsPage() {
  const { state, dispatch } = useApp();
  const [settings, setSettings] = useState<Settings>({ ...state.settings });
  const [saved, setSaved] = useState(false);

  const update = (key: keyof Settings, value: any) => {
    setSettings((s) => ({ ...s, [key]: value }));
  };
  useEffect(() => {
    const cargarConfiguracion = async () => {
      try {
        const configuracion = await obtenerConfiguracion();

        setSettings((prev) => ({
          ...prev,
          workdayStart: configuracion.workdayStart,
          workdayEnd: configuracion.workdayEnd,
          jornadaConfigurada: configuracion.jornadaConfigurada,
          jornadaActiva: configuracion.jornadaActiva,
        }));

        dispatch({
          type: "UPDATE_SETTINGS",
          payload: {
            workdayStart: configuracion.workdayStart,
            workdayEnd: configuracion.workdayEnd,
            jornadaConfigurada: configuracion.jornadaConfigurada,
            jornadaActiva: configuracion.jornadaActiva,
          },
        });
      } catch (error) {
        console.error("No fue posible cargar la configuración:", error);
      }
    };

    cargarConfiguracion();
  }, [dispatch]);

  const handleSave = async () => {
    try {
      const configuracion = await actualizarConfiguracion({
        workdayStart: settings.workdayStart,
        workdayEnd: settings.workdayEnd,
      });

      setSettings((prev) => ({
        ...prev,
        workdayStart: configuracion.workdayStart,
        workdayEnd: configuracion.workdayEnd,
        jornadaConfigurada: configuracion.jornadaConfigurada,
        jornadaActiva: configuracion.jornadaActiva,
      }));

      dispatch({
        type: "UPDATE_SETTINGS",
        payload: {
          workdayStart: configuracion.workdayStart,
          workdayEnd: configuracion.workdayEnd,
          jornadaConfigurada: configuracion.jornadaConfigurada,
          jornadaActiva: configuracion.jornadaActiva,
        },
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);

    } catch (error) {
      console.error("No fue posible guardar la configuración:", error);
      alert("No fue posible guardar la Jornada.");
    }
  };

  const inputClass =
    "w-full px-4 py-3 rounded-xl glass border border-white/10 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 bg-transparent";

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold text-foreground">Configuración</h2>
        <p className="text-sm text-muted-foreground">
          Ajustes del sistema FastManager
        </p>
      </div>

      {/* Restaurant info */}
      <Section title="Información del Restaurante">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Field label="Nombre del restaurante">
              <div className="relative">
                <ChefHat className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={settings.restaurantName}
                  onChange={(e) => update("restaurantName", e.target.value)}
                  className={`${inputClass} pl-10`}
                  placeholder="FastBurger"
                />
              </div>
            </Field>
          </div>
          <Field label="Dirección">
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={settings.address}
                onChange={(e) => update("address", e.target.value)}
                className={`${inputClass} pl-10`}
                placeholder="Calle 123 # 45-67"
              />
            </div>
          </Field>
          <Field label="Teléfono">
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={settings.phone}
                onChange={(e) => update("phone", e.target.value)}
                className={`${inputClass} pl-10`}
                placeholder="+57 300 123 4567"
              />
            </div>
          </Field>
          <Field label="Correo electrónico">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={settings.email}
                onChange={(e) => update("email", e.target.value)}
                className={`${inputClass} pl-10`}
                placeholder="info@restaurante.com"
              />
            </div>
          </Field>
          <Field label="Moneda">
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <select
                value={settings.currency}
                onChange={(e) => update("currency", e.target.value)}
                className={`${inputClass} pl-10`}
              >
                <option value="COP">COP — Peso colombiano</option>
                <option value="USD">USD — Dólar estadounidense</option>
                <option value="MXN">MXN — Peso mexicano</option>
                <option value="ARS">ARS — Peso argentino</option>
                <option value="EUR">EUR — Euro</option>
              </select>
            </div>
          </Field>
        </div>
      </Section>

      {/* Inventory & alerts */}
      <Section title="Inventario y Alertas">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Stock mínimo por defecto (unidades)">
            <input
              type="number"
              value={settings.lowStockThreshold}
              onChange={(e) =>
                update("lowStockThreshold", Number(e.target.value))
              }
              className={inputClass}
              min={1}
            />
          </Field>
          <Field label="Días de alerta de vencimiento">
            <input
              type="number"
              value={settings.expirationAlertDays}
              onChange={(e) =>
                update("expirationAlertDays", Number(e.target.value))
              }
              className={inputClass}
              min={1}
              max={30}
            />
          </Field>
        </div>
        <div className="mt-4 p-4 rounded-xl glass border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-foreground">
              Alertas automáticas activas
            </span>
          </div>
          <ul className="space-y-1.5">
            {[
              "Pedidos retrasados (superar tiempo estimado)",
              "Ingredientes con stock por debajo del mínimo",
              `Productos próximos a vencer (${settings.expirationAlertDays} días)`,
              "Pedidos entregados sin registrar pago",
            ].map((item) => (
              <li
                key={item}
                className="flex items-center gap-2 text-xs text-muted-foreground"
              >
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* Workday */}
      <Section title="Jornada Operativa">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Hora de inicio de la jornada">
            <div className="relative">
              <CalendarClock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="time"
                value={settings.workdayStart}
                onChange={(e) => update("workdayStart", e.target.value)}
                className={`${inputClass} pl-10`}
              />
            </div>
          </Field>

          <Field label="Hora de finalización de la jornada">
            <div className="relative">
              <CalendarClock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="time"
                value={settings.workdayEnd}
                onChange={(e) => update("workdayEnd", e.target.value)}
                className={`${inputClass} pl-10`}
              />
            </div>
          </Field>
        </div>

        <div className="mt-4 p-4 rounded-xl glass border border-primary/10">
          <p className="text-xs text-muted-foreground leading-6">
            Configura la jornada operativa del restaurante. Si la jornada cruza
            la medianoche (ejemplo: 17:00 a 01:00), el Dashboard, los reportes y
            los PDF utilizarán este horario para calcular las ventas de una
            misma jornada.
          </p>
        </div>
      </Section>

      {/* Prep times */}
      <Section title="Tiempos de Preparación Predeterminados">
        <div className="grid grid-cols-3 gap-4">
          {settings.defaultPrepTimes.map((time, i) => (
            <Field key={i} label={`Opción ${i + 1} (minutos)`}>
              <input
                type="number"
                value={time}
                onChange={(e) => {
                  const updated = [...settings.defaultPrepTimes];
                  updated[i] = Number(e.target.value);
                  update("defaultPrepTimes", updated);
                }}
                className={inputClass}
                min={1}
              />
            </Field>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Estos tiempos aparecen como opciones rápidas al crear nuevos pedidos.
        </p>
      </Section>

      {/* Usuarios y Empleados */}
      {state.user?.role === "dueno" && (
        <UsuariosEmpleados />
      )}

      {/* User info (read-only) */}
      <Section title="Información del Usuario">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl glass border border-white/5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">
                {state.user?.name}
              </div>
              <div className="text-xs text-muted-foreground">
                {state.user?.email}
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl glass border border-white/5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl glass border border-primary/20 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">
                {state.user?.role === "dueno" ? "Dueño" : "Empleado"}
              </div>
              <div className="text-xs text-muted-foreground">
                {state.user?.role === "dueno"
                  ? "Acceso completo al sistema"
                  : "Acceso a pedidos y cocina"}
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Save button */}
      <button
        onClick={handleSave}
        className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${saved
          ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
          : "gradient-brand text-white hover:opacity-90"
          }`}
      >
        {saved ? (
          <>
            <CheckCircle className="w-4 h-4" />
            Guardado correctamente
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            Guardar Configuración
          </>
        )}
      </button>
    </div>
  );
}
