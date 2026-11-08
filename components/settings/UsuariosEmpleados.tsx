
"use client";

import { useCallback, useEffect, useState } from "react";
import {
    Plus,
    Users,
    UserRound,
    Power,
    KeyRound,
    X,
    Save,
    RefreshCw,
} from "lucide-react";

import {
    obtenerEmpleados,
    crearEmpleado,
    cambiarEstadoEmpleado,
    cambiarContrasenaEmpleado,
    type UsuarioEmpleado,
} from "@/lib/usuarios";

export function UsuariosEmpleados() {
    const [empleados, setEmpleados] = useState<UsuarioEmpleado[]>([]);
    const [cargando, setCargando] = useState(true);
    const [procesando, setProcesando] = useState(false);

    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [nombre, setNombre] = useState("");
    const [correo, setCorreo] = useState("");
    const [contrasena, setContrasena] = useState("");

    const [empleadoPassword, setEmpleadoPassword] = useState<string | null>(null);
    const [nuevaContrasena, setNuevaContrasena] = useState("");

    const [mensaje, setMensaje] = useState("");
    const [error, setError] = useState("");

    const cargarEmpleados = useCallback(async () => {
        try {
            setCargando(true);
            setError("");

            const datos = await obtenerEmpleados();
            setEmpleados(datos);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "No fue posible cargar los empleados."
            );
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        cargarEmpleados();
    }, [cargarEmpleados]);

    const handleCrearEmpleado = async (
        e: React.FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault();

        if (procesando) return;

        try {
            setProcesando(true);
            setError("");
            setMensaje("");

            await crearEmpleado({
                nombre: nombre.trim(),
                correo: correo.trim(),
                contrasena,
            });

            setNombre("");
            setCorreo("");
            setContrasena("");
            setMostrarFormulario(false);

            await cargarEmpleados();

            setMensaje("Empleado creado correctamente.");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "No fue posible crear el empleado."
            );
        } finally {
            setProcesando(false);
        }
    };

    const handleCambiarEstado = async (empleado: UsuarioEmpleado) => {
        if (procesando) return;

        try {
            setProcesando(true);
            setError("");
            setMensaje("");

            await cambiarEstadoEmpleado(
                empleado.id,
                !empleado.activo
            );

            await cargarEmpleados();

            setMensaje(
                empleado.activo
                    ? "Empleado desactivado correctamente."
                    : "Empleado activado correctamente."
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "No fue posible cambiar el estado."
            );
        } finally {
            setProcesando(false);
        }
    };

    const handleCambiarContrasena = async (
        e: React.FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault();

        if (!empleadoPassword || procesando) return;

        try {
            setProcesando(true);
            setError("");
            setMensaje("");

            await cambiarContrasenaEmpleado(
                empleadoPassword,
                nuevaContrasena
            );

            setEmpleadoPassword(null);
            setNuevaContrasena("");

            setMensaje("Contraseña actualizada correctamente.");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "No fue posible cambiar la contraseña."
            );
        } finally {
            setProcesando(false);
        }
    };

    const empleadosActivos = empleados.filter(
        (empleado) => empleado.activo
    ).length;

    return (
        <div className="stat-card rounded-2xl p-6 border border-white/8 space-y-5">

            {/* Encabezado */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                        <span className="w-1 h-4 rounded-full gradient-brand" />
                        Usuarios y Empleados
                    </h3>

                    <p className="text-xs text-muted-foreground mt-2">
                        Administra las cuentas del personal de tu restaurante.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => {
                        setMostrarFormulario(!mostrarFormulario);
                        setError("");
                        setMensaje("");
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-white text-sm font-semibold hover:opacity-90 transition-all"
                >
                    {mostrarFormulario ? (
                        <X className="w-4 h-4" />
                    ) : (
                        <Plus className="w-4 h-4" />
                    )}

                    {mostrarFormulario ? "Cerrar" : "Nuevo empleado"}
                </button>
            </div>

            {/* Resumen */}
            <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl glass border border-white/5">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs">
                        <Users className="w-4 h-4" />
                        Total empleados
                    </div>

                    <p className="text-2xl font-bold text-foreground mt-2">
                        {empleados.length}
                    </p>
                </div>

                <div className="p-4 rounded-xl glass border border-white/5">
                    <div className="flex items-center gap-2 text-emerald-400 text-xs">
                        <UserRound className="w-4 h-4" />
                        Empleados activos
                    </div>

                    <p className="text-2xl font-bold text-foreground mt-2">
                        {empleadosActivos}
                    </p>
                </div>
            </div>

            {/* Mensajes */}
            {mensaje && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                    {mensaje}
                </div>
            )}

            {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                    {error}
                </div>
            )}

            {/* Formulario de creación */}
            {mostrarFormulario && (
                <form
                    onSubmit={handleCrearEmpleado}
                    className="p-5 rounded-xl glass border border-primary/20 space-y-4"
                >
                    <h4 className="text-sm font-bold text-foreground">
                        Registrar nuevo empleado
                    </h4>

                    <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block">
                            Nombre completo
                        </label>

                        <input
                            type="text"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            placeholder="Nombre del empleado"
                            maxLength={100}
                            required
                            className="w-full px-4 py-3 rounded-xl glass border border-white/10 text-foreground text-sm focus:outline-none focus:border-primary/50 bg-transparent"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block">
                            Correo electrónico
                        </label>

                        <input
                            type="email"
                            value={correo}
                            onChange={(e) => setCorreo(e.target.value)}
                            placeholder="empleado@restaurante.com"
                            maxLength={150}
                            required
                            className="w-full px-4 py-3 rounded-xl glass border border-white/10 text-foreground text-sm focus:outline-none focus:border-primary/50 bg-transparent"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block">
                            Contraseña inicial
                        </label>

                        <input
                            type="password"
                            value={contrasena}
                            onChange={(e) => setContrasena(e.target.value)}
                            placeholder="Mínimo 8 caracteres"
                            minLength={8}
                            required
                            className="w-full px-4 py-3 rounded-xl glass border border-white/10 text-foreground text-sm focus:outline-none focus:border-primary/50 bg-transparent"
                        />
                    </div>

                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <p className="text-xs text-muted-foreground">
                            El rol EMPLEADO se asigna automáticamente.
                        </p>

                        <button
                            type="submit"
                            disabled={procesando}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-brand text-white text-sm font-semibold disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {procesando ? "Creando..." : "Crear empleado"}
                        </button>
                    </div>
                </form>
            )}

            {/* Lista de empleados */}
            <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-foreground">
                        Empleados registrados
                    </h4>

                    <button
                        type="button"
                        onClick={cargarEmpleados}
                        disabled={cargando}
                        title="Actualizar lista"
                        className="p-2 rounded-lg glass border border-white/10 text-muted-foreground hover:text-foreground disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${cargando ? "animate-spin" : ""}`} />
                    </button>
                </div>

                {cargando ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                        Cargando empleados...
                    </div>
                ) : empleados.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                        Todavía no hay empleados registrados.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {empleados.map((empleado) => (
                            <div
                                key={empleado.id}
                                className="p-4 rounded-xl glass border border-white/5 space-y-3"
                            >
                                <div className="flex items-center justify-between flex-wrap gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center shrink-0">
                                            <UserRound className="w-5 h-5 text-white" />
                                        </div>

                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-foreground truncate">
                                                {empleado.nombre}
                                            </p>

                                            <p className="text-xs text-muted-foreground truncate">
                                                {empleado.correo}
                                            </p>
                                        </div>
                                    </div>

                                    <span
                                        className={`text-xs font-semibold px-3 py-1 rounded-full ${empleado.activo
                                                ? "bg-emerald-500/10 text-emerald-400"
                                                : "bg-red-500/10 text-red-400"
                                            }`}
                                    >
                                        {empleado.activo ? "Activo" : "Inactivo"}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between flex-wrap gap-3">
                                    <span className="text-xs text-muted-foreground">
                                        Rol: {empleado.rol}
                                    </span>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            disabled={procesando}
                                            onClick={() =>
                                                handleCambiarEstado(empleado)
                                            }
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg glass border border-white/10 text-xs text-foreground hover:border-primary/40 disabled:opacity-50"
                                        >
                                            <Power className="w-3.5 h-3.5" />
                                            {empleado.activo ? "Desactivar" : "Activar"}
                                        </button>

                                        <button
                                            type="button"
                                            disabled={procesando}
                                            onClick={() => {
                                                setEmpleadoPassword(
                                                    empleadoPassword === empleado.id
                                                        ? null
                                                        : empleado.id
                                                );
                                                setNuevaContrasena("");
                                                setError("");
                                                setMensaje("");
                                            }}
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg glass border border-white/10 text-xs text-foreground hover:border-primary/40 disabled:opacity-50"
                                        >
                                            <KeyRound className="w-3.5 h-3.5" />
                                            Contraseña
                                        </button>
                                    </div>
                                </div>

                                {/* Formulario para cambiar contraseña */}
                                {empleadoPassword === empleado.id && (
                                    <form
                                        onSubmit={handleCambiarContrasena}
                                        className="pt-3 border-t border-white/10 space-y-3"
                                    >
                                        <label className="text-xs text-muted-foreground block">
                                            Nueva contraseña para {empleado.nombre}
                                        </label>

                                        <input
                                            type="password"
                                            value={nuevaContrasena}
                                            onChange={(e) =>
                                                setNuevaContrasena(e.target.value)
                                            }
                                            placeholder="Mínimo 8 caracteres"
                                            minLength={8}
                                            required
                                            className="w-full px-4 py-3 rounded-xl glass border border-white/10 text-foreground text-sm focus:outline-none focus:border-primary/50 bg-transparent"
                                        />

                                        <div className="flex justify-end">
                                            <button
                                                type="submit"
                                                disabled={procesando}
                                                className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-brand text-white text-xs font-semibold disabled:opacity-50"
                                            >
                                                <Save className="w-3.5 h-3.5" />
                                                {procesando ? "Guardando..." : "Actualizar contraseña"}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
