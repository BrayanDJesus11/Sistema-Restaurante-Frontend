"use client";

import { useState } from "react";
import {
  ChefHat,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowLeft,
  Crown,
  User,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { iniciarSesion } from "@/lib/autenticacion";

export function LoginPage({ onBack }: { onBack: () => void }) {
  const { dispatch } = useApp();
  const [selectedRole, setSelectedRole] = useState<"dueno" | "empleado" | null>(
    null,
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Por favor completa todos los campos.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const respuesta = await iniciarSesion(email, password);

      console.log(respuesta);

      dispatch({
        type: "LOGIN",
        payload: {
          id: respuesta.usuario.id,
          name: respuesta.usuario.nombre,
          role: respuesta.usuario.rol === "DUENO" ? "dueno" : "empleado",
          email: respuesta.usuario.correo,
        },
      });
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse at 30% 50%, oklch(0.72 0.19 52 / 0.12) 0%, transparent 50%),
          radial-gradient(ellipse at 70% 30%, oklch(0.65 0.22 27 / 0.08) 0%, transparent 50%),
          oklch(0.10 0.005 240)
        `,
      }}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full opacity-10 blur-3xl"
          style={{ background: "oklch(0.72 0.19 52)" }}
        />
        <div
          className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full opacity-8 blur-3xl"
          style={{ background: "oklch(0.65 0.22 27)" }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto px-6">
        {/* Back button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio
        </button>

        {/* Card */}
        <div className="glass rounded-2xl p-8 border border-white/10 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl gradient-brand flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
              <ChefHat className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-black text-foreground mb-1">
              Bienvenido
            </h1>
            <p className="text-muted-foreground text-sm">
              Inicia sesión en FastManager
            </p>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl glass border border-white/10 text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  className="w-full pl-10 pr-12 py-3 rounded-xl glass border border-white/10 text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {error}
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-3.5 rounded-xl gradient-brand text-white font-bold text-sm transition-all hover:opacity-90 disabled:opacity-50 mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verificando...
                </span>
              ) : (
                "Iniciar Sesión"
              )}
            </button>
          </div>

          {/* Demo hint */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            Selecciona un rol para autocompletar las credenciales de demo
          </p>
        </div>
      </div>
    </div>
  );
}
