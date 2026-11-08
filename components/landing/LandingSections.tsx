"use client"

import { useEffect, useRef, useState } from "react"
import {
  ShoppingCart, Package, Bell, ChefHat, DollarSign,
  Star, TrendingUp, Users, Award, Clock, BarChart3
} from "lucide-react"

function useCountUp(target: number, duration = 2000) {
  const [count, setCount] = useState(0)
  const [started, setStarted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started) setStarted(true)
    }, { threshold: 0.5 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [started])

  useEffect(() => {
    if (!started) return
    const steps = 60
    const increment = target / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(current))
    }, duration / steps)
    return () => clearInterval(timer)
  }, [started, target, duration])

  return { count, ref }
}

const features = [
  {
    icon: ShoppingCart,
    title: "Gestión de Ventas",
    description: "Control completo de pedidos con estados en tiempo real. Mesa, para llevar y domicilio con temporizadores inteligentes.",
    color: "text-orange-400",
    bg: "bg-orange-400/10",
    border: "border-orange-400/20",
  },
  {
    icon: Package,
    title: "Control de Inventario",
    description: "Sistema FIFO/PEPS real con trazabilidad por lotes. Alertas automáticas de stock bajo y vencimiento próximo.",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/20",
  },
  {
    icon: Bell,
    title: "Sistema de Alertas",
    description: "Notificaciones inteligentes para pedidos retrasados, sin pagar, inventario crítico y productos por vencer.",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
    border: "border-yellow-400/20",
  },
  {
    icon: ChefHat,
    title: "Modo Cocina",
    description: "Pantalla fullscreen para cocina con tarjetas grandes, temporizadores visuales y acciones rápidas de estado.",
    color: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-400/20",
  },
  {
    icon: DollarSign,
    title: "Control Financiero",
    description: "Costos reales por producto, gastos operativos, rentabilidad por ítem y análisis de utilidades históricas.",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-400/20",
  },
  {
    icon: BarChart3,
    title: "Analíticas Avanzadas",
    description: "Gráficas de tendencias, comparativa de proveedores, evolución de costos y rentabilidad por período.",
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    border: "border-purple-400/20",
  },
]

const testimonials = [
  {
    name: "Alejandro Torres",
    role: "Propietario — BurgerHouse",
    content: "FastManager transformó por completo cómo manejamos nuestro restaurante. El sistema FIFO nos ayudó a reducir el desperdicio en un 40% en el primer mes.",
    rating: 5,
    avatar: "AT",
  },
  {
    name: "Carolina Méndez",
    role: "Administradora — QuickBite",
    content: "El modo cocina es espectacular. Nuestros cocineros ahora tienen todo lo que necesitan en pantalla y los tiempos de preparación mejoraron notablemente.",
    rating: 5,
    avatar: "CM",
  },
  {
    name: "Ricardo Gómez",
    role: "Dueño — HotDog King",
    content: "Las analíticas financieras me permiten tomar decisiones informadas. Ahora sé exactamente cuánto gano por cada producto vendido.",
    rating: 5,
    avatar: "RG",
  },
]

function StatCard({ value, suffix, label, icon: Icon }: { value: number; suffix: string; label: string; icon: any }) {
  const { count, ref } = useCountUp(value)
  return (
    <div ref={ref} className="stat-card rounded-2xl p-6 text-center card-hover">
      <div className="w-12 h-12 rounded-xl gradient-brand flex items-center justify-center mx-auto mb-4">
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="text-4xl font-black gradient-text mb-2">
        {count.toLocaleString("es-CO")}{suffix}
      </div>
      <div className="text-muted-foreground text-sm">{label}</div>
    </div>
  )
}

export function LandingFeatures() {
  return (
    <section id="características" className="py-24 px-6 md:px-12">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/30 text-primary text-xs font-semibold mb-6">
            <Award className="w-3 h-3" />
            Funcionalidades
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-foreground mb-4 text-balance">
            Todo lo que necesitas para{" "}
            <span className="gradient-text">gestionar tu restaurante</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Un sistema completo diseñado específicamente para restaurantes de comida rápida, con todas las herramientas para optimizar operaciones y maximizar rentabilidad.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={f.title}
              className={`stat-card rounded-2xl p-6 card-hover border ${f.border} group`}
              style={{ animationDelay: `${i * 0.1}s` }}>
              <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                <f.icon className={`w-6 h-6 ${f.color}`} />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function LandingStats() {
  return (
    <section id="estadísticas" className="py-24 px-6 md:px-12"
      style={{ background: "oklch(0.12 0.007 240)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black text-foreground mb-4">
            Resultados que <span className="gradient-text">hablan solos</span>
          </h2>
          <p className="text-muted-foreground">Métricas reales de restaurantes que usan FastManager</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard value={500} suffix="+" label="Restaurantes activos" icon={Users} />
          <StatCard value={35} suffix="%" label="Reducción de desperdicios" icon={TrendingUp} />
          <StatCard value={200000} suffix="+" label="Pedidos procesados" icon={ShoppingCart} />
          <StatCard value={98} suffix="%" label="Satisfacción del cliente" icon={Star} />
        </div>
      </div>
    </section>
  )
}

export function LandingTestimonials() {
  return (
    <section id="testimonios" className="py-24 px-6 md:px-12">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/30 text-primary text-xs font-semibold mb-6">
            <Star className="w-3 h-3" />
            Testimonios
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-foreground mb-4">
            Lo que dicen nuestros <span className="gradient-text">clientes</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map(t => (
            <div key={t.name} className="stat-card rounded-2xl p-6 card-hover">
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-primary fill-primary" />
                ))}
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">&quot;{t.content}&quot;</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full gradient-brand flex items-center justify-center text-white text-sm font-bold">
                  {t.avatar}
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function LandingFooter() {
  return (
    <footer className="border-t border-white/5 py-16 px-6 md:px-12"
      style={{ background: "oklch(0.09 0.005 240)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center">
                <ChefHat className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">Fast<span className="gradient-text">Manager</span></span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
              El sistema de gestión más completo para restaurantes de comida rápida. Control total de tu negocio en tiempo real.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">Producto</h4>
            <ul className="space-y-2">
              {["Características", "Soluciones", "Seguridad", "Actualizaciones"].map(item => (
                <li key={item}>
                  <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">Soporte</h4>
            <ul className="space-y-2">
              {["Documentación", "Centro de ayuda", "Contacto", "Estado del sistema"].map(item => (
                <li key={item}>
                  <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Developer Credits */}
        <div className="border-t border-white/5 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl glass border border-primary/20 flex items-center justify-center">
                <span className="text-primary font-black text-lg">{"</>"}</span>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Desarrollado por</div>
                <div className="text-base font-bold text-foreground">Tu Nombre o Empresa</div>
                <div className="text-xs text-muted-foreground">Soluciones Tecnológicas para Restaurantes</div>
              </div>
            </div>
            <div className="flex items-center gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Versión 2.0.0</span>
              </div>
              <span>© 2026 FastManager. Todos los derechos reservados.</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
