import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Trophy, Users, Zap, Target, BookOpen, ArrowRight, Star, Flame, Code, Brain, FileCode, Globe } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-hero dark relative overflow-hidden">
      {/* Planeta Marte animado ao fundo - mais proeminente e menos desfocado */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-[1200px] h-[1200px] lg:w-[1400px] lg:h-[1400px] animate-pulse-slow">
          {/* Planeta Marte - menos blur e mais visível */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-800/40 via-red-700/30 to-orange-900/35 blur-xl animate-float">
            {/* Superfície do planeta - mais detalhes */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-700/30 via-red-600/25 to-orange-800/30">
              {/* Detalhes da superfície - crateras e texturas mais visíveis */}
              <div className="absolute top-[15%] left-[25%] w-32 h-32 rounded-full bg-orange-900/20 blur-lg"></div>
              <div className="absolute top-[35%] right-[20%] w-24 h-24 rounded-full bg-red-900/20 blur-md"></div>
              <div className="absolute bottom-[25%] left-[15%] w-36 h-36 rounded-full bg-orange-800/20 blur-lg"></div>
              <div className="absolute top-[55%] left-[40%] w-20 h-20 rounded-full bg-red-800/20 blur-sm"></div>
              <div className="absolute bottom-[40%] right-[30%] w-28 h-28 rounded-full bg-orange-900/20 blur-md"></div>
              <div className="absolute top-[70%] left-[60%] w-16 h-16 rounded-full bg-red-700/20 blur-sm"></div>
              <div className="absolute top-[20%] right-[45%] w-20 h-20 rounded-full bg-orange-800/20 blur-md"></div>
              
              {/* Pólos do planeta - mais brilhantes */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full bg-white/10 blur-xl"></div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full bg-white/8 blur-lg"></div>
              
              {/* Anéis de poeira/atmosfera - mais visíveis */}
              <div className="absolute inset-0 rounded-full border border-orange-600/30 blur-sm"></div>
              <div className="absolute inset-2 rounded-full border border-red-600/20 blur-sm"></div>
              <div className="absolute inset-4 rounded-full border border-orange-700/15 blur-sm"></div>
            </div>
          </div>
          
          {/* Aura atmosférica - mais intensa */}
          <div className="absolute -inset-10 rounded-full bg-gradient-to-t from-orange-500/8 via-transparent to-red-500/8 blur-2xl"></div>
          <div className="absolute -inset-20 rounded-full bg-gradient-to-t from-orange-600/5 via-transparent to-red-600/5 blur-3xl"></div>
          
          {/* Estrelas ao redor - mais brilhantes */}
          <div className="absolute top-10 left-10 w-3 h-3 bg-white/80 rounded-full animate-twinkle"></div>
          <div className="absolute top-20 right-20 w-2 h-2 bg-white/60 rounded-full animate-twinkle" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute bottom-20 left-20 w-3 h-3 bg-white/70 rounded-full animate-twinkle" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-10 right-10 w-2 h-2 bg-white/50 rounded-full animate-twinkle" style={{ animationDelay: '1.5s' }}></div>
          <div className="absolute top-1/3 left-1/4 w-2 h-2 bg-white/60 rounded-full animate-twinkle" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-2/3 right-1/4 w-3 h-3 bg-white/70 rounded-full animate-twinkle" style={{ animationDelay: '2.5s' }}></div>
          <div className="absolute top-1/4 right-1/3 w-2 h-2 bg-white/50 rounded-full animate-twinkle" style={{ animationDelay: '3s' }}></div>
          <div className="absolute bottom-1/3 left-1/3 w-3 h-3 bg-white/60 rounded-full animate-twinkle" style={{ animationDelay: '3.5s' }}></div>
        </div>
      </div>

      {/* Ícones de programação animados atrás do banner */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Python - Top Left */}
        <div className="absolute top-20 left-10 lg:top-32 lg:left-20 animate-float-slow" style={{ animationDelay: '0s' }}>
          <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-blue-500/20 backdrop-blur-sm border border-blue-400/30 flex items-center justify-center shadow-lg">
            <svg viewBox="0 0 24 24" className="w-8 h-8 lg:w-10 lg:h-10 text-blue-400" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              <path d="M8.5 8.5c.83 0 1.5-.67 1.5-1.5S9.33 5.5 8.5 5.5 7 6.17 7 7s.67 1.5 1.5 1.5zm7 0c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5z"/>
            </svg>
          </div>
        </div>

        {/* IA - Top Right */}
        <div className="absolute top-32 right-10 lg:top-40 lg:right-20 animate-float" style={{ animationDelay: '1s' }}>
          <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-purple-500/20 backdrop-blur-sm border border-purple-400/30 flex items-center justify-center shadow-lg">
            <Brain className="w-8 h-8 lg:w-10 lg:h-10 text-purple-400" />
          </div>
        </div>

        {/* Código - Bottom Left */}
        <div className="absolute bottom-40 left-20 lg:bottom-60 lg:left-32 animate-float-slow" style={{ animationDelay: '2s' }}>
          <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-green-500/20 backdrop-blur-sm border border-green-400/30 flex items-center justify-center shadow-lg">
            <Code className="w-8 h-8 lg:w-10 lg:h-10 text-green-400" />
          </div>
        </div>

        {/* HTML - Bottom Right */}
        <div className="absolute bottom-20 right-20 lg:bottom-32 lg:right-32 animate-float" style={{ animationDelay: '3s' }}>
          <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-orange-500/20 backdrop-blur-sm border border-orange-400/30 flex items-center justify-center shadow-lg">
            <FileCode className="w-8 h-8 lg:w-10 lg:h-10 text-orange-400" />
          </div>
        </div>

        {/* Python adicional - Middle Left */}
        <div className="absolute top-1/2 left-5 lg:left-10 animate-float" style={{ animationDelay: '1.5s' }}>
          <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-xl bg-blue-500/15 backdrop-blur-sm border border-blue-400/25 flex items-center justify-center shadow-md">
            <svg viewBox="0 0 24 24" className="w-6 h-6 lg:w-8 lg:h-8 text-blue-400" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              <path d="M8.5 8.5c.83 0 1.5-.67 1.5-1.5S9.33 5.5 8.5 5.5 7 6.17 7 7s.67 1.5 1.5 1.5zm7 0c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5z"/>
            </svg>
          </div>
        </div>

        {/* IA adicional - Middle Right */}
        <div className="absolute top-1/3 right-5 lg:right-10 animate-float-slow" style={{ animationDelay: '2.5s' }}>
          <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-xl bg-purple-500/15 backdrop-blur-sm border border-purple-400/25 flex items-center justify-center shadow-md">
            <Brain className="w-6 h-6 lg:w-8 lg:h-8 text-purple-400" />
          </div>
        </div>

        {/* Código adicional - Top Center */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 animate-float" style={{ animationDelay: '0.5s' }}>
          <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg bg-green-500/15 backdrop-blur-sm border border-green-400/25 flex items-center justify-center shadow-md">
            <Code className="w-5 h-5 lg:w-6 lg:h-6 text-green-400" />
          </div>
        </div>

        {/* HTML adicional - Bottom Center */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-float-slow" style={{ animationDelay: '3.5s' }}>
          <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg bg-orange-500/15 backdrop-blur-sm border border-orange-400/25 flex items-center justify-center shadow-md">
            <FileCode className="w-5 h-5 lg:w-6 lg:h-6 text-orange-400" />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 sticky top-0 glass backdrop-blur-lg border-b border-primary/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          {/* LOGO - JOVEMCODER MODERNO */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-500 flex items-center justify-center shadow-xl relative overflow-hidden group hover:scale-105 transition-transform">
              {/* Background gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-50"></div>
              
              {/* Letter J */}
              <div className="relative z-10">
                <div className="text-white font-bold text-xl font-display">J</div>
                <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-white/60 rounded-full"></div>
              </div>
              
              {/* Letter O */}
              <div className="relative z-10 ml-1">
                <div className="text-white font-bold text-xl font-display">O</div>
                <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-white/60 rounded-full"></div>
              </div>
              
              {/* Letter V */}
              <div className="relative z-10 ml-1">
                <div className="text-white font-bold text-xl font-display">V</div>
                <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-white/60 rounded-full"></div>
              </div>
              
              {/* Letter E */}
              <div className="relative z-10 ml-1">
                <div className="text-white font-bold text-xl font-display">E</div>
                <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-white/60 rounded-full"></div>
              </div>
              
              {/* Letter M */}
              <div className="relative z-10 ml-1">
                <div className="text-white font-bold text-xl font-display">M</div>
                <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-white/60 rounded-full"></div>
              </div>
              
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/30 to-purple-400/30 blur-md group-hover:from-cyan-400/50 group-hover:to-purple-400/50 transition-all"></div>
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
      <section className="relative z-10 pt-36 pb-24 px-4">
        <div className="container mx-auto text-center">
          {/* LOGO CENTRAL */}
          <div className="flex justify-center mb-6 animate-float">
            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-500 flex items-center justify-center shadow-2xl relative overflow-hidden group hover:scale-105 transition-transform">
              {/* Background gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-50"></div>
              
              {/* Letter J */}
              <div className="relative z-10">
                <div className="text-white font-bold text-2xl font-display">J</div>
                <div className="absolute -bottom-1 left-0 w-full h-1 bg-white/60 rounded-full"></div>
              </div>
              
              {/* Letter O */}
              <div className="relative z-10 ml-2">
                <div className="text-white font-bold text-2xl font-display">O</div>
                <div className="absolute -bottom-1 left-0 w-full h-1 bg-white/60 rounded-full"></div>
              </div>
              
              {/* Letter V */}
              <div className="relative z-10 ml-2">
                <div className="text-white font-bold text-2xl font-display">V</div>
                <div className="absolute -bottom-1 left-0 w-full h-1 bg-white/60 rounded-full"></div>
              </div>
              
              {/* Letter E */}
              <div className="relative z-10 ml-2">
                <div className="text-white font-bold text-2xl font-display">E</div>
                <div className="absolute -bottom-1 left-0 w-full h-1 bg-white/60 rounded-full"></div>
              </div>
              
              {/* Letter M */}
              <div className="relative z-10 ml-2">
                <div className="text-white font-bold text-2xl font-display">M</div>
                <div className="absolute -bottom-1 left-0 w-full h-1 bg-white/60 rounded-full"></div>
              </div>
              
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/30 to-purple-400/30 blur-md group-hover:from-cyan-400/50 group-hover:to-purple-400/50 transition-all"></div>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6 animate-fade-in">
            <Flame className="w-4 h-4 text-streak" />
            <span className="text-sm text-foreground">Simulação de treinamento global ativa</span>
          </div>

          {/* === TÍTULO SPACEX === */}
          <h1 className="font-display text-5xl md:text-7xl font-black tracking-tight text-white mb-6 leading-tight">
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
      <section id="features" className="relative z-10 py-24 px-4">
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
              { icon: Users, title: "Ranking", description: "Disputa com outros alunos.", gradient: "bg-gradient-accent" },
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
      <section className="relative z-10 py-24 px-4">
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
      <footer className="relative z-10 py-12 px-4 border-t border-border/50">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-500 flex items-center justify-center">
              {/* Letter J */}
              <div className="text-white font-bold text-sm font-display">J</div>
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