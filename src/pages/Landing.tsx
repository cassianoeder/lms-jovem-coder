import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Trophy, Users, Zap, Target, BookOpen, ArrowRight, Star, Flame } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-hero dark">

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass backdrop-blur-lg border-b border-primary/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">

          {/* LOGO */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-primary flex items-center justify-center shadow-xl">
              <svg viewBox="0 0 64 64" className="w-6 h-6 text-white fill-current">
                <path d="M32 4c6 0 11 5 11 11s-5 11-11 11S21 21 21 15 26 4 32 4zm0 26c-9 0-18 4-18 12v6h36v-6c0-8-9-12-18-12z"/>
              </svg>
            </div>

            <span className="font-display text-xl font-extrabold tracking-wide text-foreground">
              Jovem<span className="text-gradient-primary">Coder</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Recursos</a>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" className="text-foreground">Entrar</Button>
            </Link>

            <Link to="/auth?mode=register">
              <Button className="bg-gradient-primary hover:scale-105 transition-all duration-300 shadow-lg">
                Começar Grátis
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-36 pb-24 px-4">
        <div className="container mx-auto text-center">

          {/* LOGO CENTRAL */}
          <div className="flex justify-center mb-6 animate-float">
            <div className="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center shadow-2xl">
              <svg viewBox="0 0 64 64" className="w-10 h-10 text-white fill-current">
                <path d="M32 4c6 0 11 5 11 11s-5 11-11 11S21 21 21 15 26 4 32 4zm0 26c-9 0-18 4-18 12v6h36v-6c0-8-9-12-18-12z"/>
              </svg>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6 animate-fade-in">
            <Flame className="w-4 h-4 text-streak" />
            <span className="text-sm text-foreground">Simulação de treinamento global ativa</span>
          </div>

          {/* === TÍTULO SPACEX === */}
          <h1 className="font-display text-5xl md:text-7xl font-black tracking-tight text-white mb-6 leading-tight animate-slide-up">
            PROGRAME O FUTURO
            <br />
            <span className="text-gradient-primary">COMO UM ENGENHEIRO DE MISSÃO</span>
          </h1>

          {/* SUBTÍTULO */}
          <p className="text-lg text-cyan-200 max-w-2xl mx-auto mb-12 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            Aprenda programação como quem comanda uma missão espacial. Python, lógica e sistemas reais em uma experiência futurista.
          </p>

          {/* BOTÃO */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <Link to="/auth?mode=register">
              <Button
                size="lg"
                className="bg-black border border-cyan-400 text-cyan-300 hover:bg-cyan-500 hover:text-black transition-all text-lg px-10 py-6 shadow-xl hover:scale-105"
              >
                Iniciar Missão
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>

          {/* === TERMINAL COM PYTHON === */}
          <div className="max-w-2xl mx-auto text-left p-6 rounded-xl bg-black/60 border border-cyan-300/30 backdrop-blur shadow-xl mb-20 animate-fade-in animate-glow">
            <pre className="text-cyan-300 font-mono text-sm whitespace-pre">
{`# Missão Espacial JovemCoder

def launch_programming():
    system = "JovemCoder OS"
    student = "Recruta"
    level = 1

    print(f"🚀 {student} iniciado no {system}")
    print(f"📡 Nível atual: {level}")
    print("✅ Sistema pronto para decolar!")

launch_programming()`}
            </pre>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { icon: Users, value: "10+", label: "Alunos Ativos" },
              { icon: BookOpen, value: "50+", label: "Exercícios" },
              { icon: Trophy, value: "50+", label: "Conquistas" },
              { icon: Star, value: "4.9", label: "Avaliação" }
            ].map((stat, index) => (
              <div
                key={index}
                className="glass rounded-2xl p-6 border border-primary/20 hover:shadow-2xl hover:border-primary hover:scale-105 transition-all animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <stat.icon className="w-8 h-8 text-primary mx-auto mb-3" />
                <div className="font-display text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-black text-foreground mb-4">
              Por que JovemCoder?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Aqui você aprende programação como se estivesse jogando.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Zap, title: "XP & Níveis", description: "Suba de nível como em um game real.", gradient: "bg-gradient-xp" },
              { icon: Flame, title: "Streak Diário", description: "Não quebre sua sequência.", gradient: "bg-gradient-streak" },
              { icon: Trophy, title: "Conquistas", description: "Desbloqueie recompensas.", gradient: "bg-gradient-accent" },
              { icon: Target, title: "Missões", description: "Desafios todos os dias.", gradient: "bg-gradient-primary" },
              { icon: Users, title: "Ranking", description: "Dispute com outros alunos.", gradient: "bg-gradient-accent" },
              { icon: BookOpen, title: "Aprendizado real", description: "Nada de teoria sem prática.", gradient: "bg-gradient-primary" },
            ].map((feature, index) => (
              <div
                key={index}
                className="glass rounded-2xl p-8 border border-primary/20 hover:shadow-2xl hover:scale-105 transition-all animate-fade-in group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`w-14 h-14 rounded-xl ${feature.gradient} flex items-center justify-center mb-6 group-hover:glow-primary transition-all`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <div className="glass rounded-3xl p-12 text-center relative overflow-hidden animate-glow">
            <div className="absolute inset-0 bg-gradient-primary opacity-10" />

            <div className="relative z-10">
              <h2 className="font-display text-4xl font-black text-foreground mb-4">
                Comece sua missão hoje
              </h2>

              <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
                Você não está entrando em um curso. Está entrando em uma central de comando.
              </p>

              <Link to="/auth?mode=register">
                <Button size="lg" className="bg-gradient-primary hover:scale-110 transition-all text-lg px-10 py-6">
                  Criar Conta Grátis
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 px-4 border-t border-border/50">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <svg viewBox="0 0 64 64" className="w-5 h-5 text-white fill-current">
                <path d="M32 4c6 0 11 5 11 11s-5 11-11 11S21 21 21 15 26 4 32 4zm0 26c-9 0-18 4-18 12v6h36v-6c0-8-9-12-18-12z"/>
              </svg>
            </div>
            <span className="font-display font-bold text-foreground">
              Jovem<span className="text-gradient-primary">Coder</span>
            </span>
          </div>

          <p className="text-sm text-muted-foreground">
            © 2026 JovemCoder. Todos os direitos reservados. | Por: Ederson Wermeier
          </p>
        </div>
      </footer>

    </div>
  );
};

export default Landing;