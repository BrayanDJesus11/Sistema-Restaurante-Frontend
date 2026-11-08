"use client"

import { useEffect, useState } from "react"
import { ArrowRight, ChefHat, Zap, TrendingUp } from "lucide-react"

export function LandingHero({ onLogin }: { onLogin: () => void }) {
  const [mounted, setMounted] = useState(false)
  const [currentWord, setCurrentWord] = useState(0)
  const words = ["Eficiencia", "Control", "Rentabilidad", "Excelencia"]

  useEffect(() => {
    setMounted(true)
    const interval = setInterval(() => {
      setCurrentWord(w => (w + 1) % words.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="hero-bg min-h-screen flex flex-col relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {mounted && Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-20"
            style={{
              width: Math.random() * 6 + 2,
              height: Math.random() * 6 + 2,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: i % 2 === 0
                ? "oklch(0.72 0.19 52)"
                : "oklch(0.65 0.22 27)",
              animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: "oklch(0.72 0.19 52)" }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-8 blur-3xl"
          style={{ background: "oklch(0.65 0.22 27)" }} />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5 glass-dark border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center shadow-lg">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-foreground tracking-tight">
            Fast<span className="gradient-text">Manager</span>
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          {["Características", "Soluciones", "Estadísticas", "Testimonios"].map(item => (
            <a key={item} href={`#${item.toLowerCase()}`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {item}
            </a>
          ))}
        </div>
        <button
          onClick={onLogin}
          className="px-5 py-2.5 rounded-xl gradient-brand text-white text-sm font-semibold transition-all hover:opacity-90 hover:shadow-lg animate-pulse-glow"
        >
          Iniciar Sesión
        </button>
      </nav>

      {/* Hero Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 md:px-12 py-20">
        <div className="max-w-6xl w-full flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/30 text-primary text-xs font-semibold mb-8 animate-slide-up">
              <Zap className="w-3 h-3" />
              Sistema Premium de Gestión
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-foreground leading-tight mb-6 animate-slide-up text-balance"
              style={{ animationDelay: "0.1s" }}>
              Lleva tu restaurante hacia la{" "}
              <span
                key={currentWord}
                className="gradient-text inline-block"
                style={{ animation: "slide-up 0.5s ease-out forwards" }}
              >
                {words[currentWord]}
              </span>
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed mb-10 max-w-xl animate-slide-up"
              style={{ animationDelay: "0.2s" }}>
              Controla pedidos, inventario, costos y finanzas en tiempo real. La herramienta definitiva para restaurantes de comida rápida modernos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-slide-up"
              style={{ animationDelay: "0.3s" }}>
              <button
                onClick={onLogin}
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl gradient-brand text-white font-bold text-base transition-all hover:opacity-90 hover:scale-105 animate-pulse-glow"
              >
                Comenzar Ahora
                <ArrowRight className="w-5 h-5" />
              </button>
              <button className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl glass border border-white/10 text-foreground font-semibold text-base transition-all hover:border-primary/40">
                Ver Demo
              </button>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-4 mt-12 animate-slide-up" style={{ animationDelay: "0.4s" }}>
              {[
                { label: "Pedidos/día", value: "200+" },
                { label: "Ahorro en costos", value: "35%" },
                { label: "Restaurantes", value: "500+" },
              ].map(stat => (
                <div key={stat.label} className="glass rounded-xl p-3 text-center">
                  <div className="text-2xl font-black gradient-text">{stat.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Dashboard preview */}
          <div className="flex-1 relative animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <div className="relative glass rounded-2xl p-4 border border-white/10 shadow-2xl animate-float">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                <span className="text-xs text-muted-foreground ml-2">FastManager Dashboard</span>
              </div>
              {/* Mini dashboard preview */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: "Ventas Hoy", value: "$1.2M", color: "text-primary", icon: TrendingUp },
                  { label: "Pedidos Activos", value: "8", color: "text-emerald-400", icon: ChefHat },
                  { label: "Utilidad Neta", value: "$340K", color: "text-blue-400", icon: TrendingUp },
                  { label: "Alertas", value: "3", color: "text-red-400", icon: Zap },
                ].map(w => (
                  <div key={w.label} className="stat-card rounded-xl p-3">
                    <div className="text-xs text-muted-foreground mb-1">{w.label}</div>
                    <div className={`text-xl font-black ${w.color}`}>{w.value}</div>
                  </div>
                ))}
              </div>
              {/* Mini chart bars */}
              <div className="rounded-xl p-3" style={{ background: "oklch(0.18 0.01 240)" }}>
                <div className="text-xs text-muted-foreground mb-3">Ventas de la Semana</div>
                <div className="flex items-end gap-2 h-16">
                  {[45, 65, 55, 80, 70, 90, 85].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t-sm transition-all"
                      style={{
                        height: `${h}%`,
                        background: i === 5 ? "oklch(0.72 0.19 52)" : "oklch(0.72 0.19 52 / 0.35)",
                      }}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-1">
                  {["L", "M", "X", "J", "V", "S", "D"].map(d => (
                    <span key={d} className="text-xs text-muted-foreground flex-1 text-center">{d}</span>
                  ))}
                </div>
              </div>
            </div>
            {/* Floating badges */}
            <div className="absolute -top-4 -right-4 glass rounded-xl px-3 py-2 border border-primary/30 text-xs font-semibold text-primary animate-float" style={{ animationDelay: "0.5s" }}>
              ✓ Sistema FIFO/PEPS
            </div>
            <div className="absolute -bottom-4 -left-4 glass rounded-xl px-3 py-2 border border-emerald-500/30 text-xs font-semibold text-emerald-400 animate-float" style={{ animationDelay: "1s" }}>
              ✓ Modo Cocina
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
