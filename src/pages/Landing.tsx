import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Code2, Trophy, Users, Zap, Target, BookOpen, ArrowRight, Star, Flame, Gamepad2 } from "lucide-react";
const Landing = () => {
  return <div className="min-h-screen bg-gradient-hero dark">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Code2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">JovemCoder</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Recursos</a>
            <a href="#how" className="text-muted-foreground hover:text-foreground transition-colors">Como Funciona</a>
            
          </div>
          
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" className="text-foreground">Entrar</Button>
            </Link>
            <Link to="/auth?mode=register">
              <Button className="bg-gradient-primary hover:opacity-90 transition-opacity">
                Começar Grátis
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6">
            <Flame className="w-4 h-4 text-streak" />
            <span className="text-sm text-foreground">+10 alunos aprendendo código</span>
          </div>
          
          <h1 className="font-display text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
            Aprenda a programar
            <br />
            <span className="text-gradient-primary">se divertindo</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Transforme sua jornada de aprendizado em uma aventura épica. 
            Ganhe XP, suba de nível e desbloqueie conquistas enquanto domina programação.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link to="/auth?mode=register">
              <Button size="lg" className="bg-gradient-primary hover:opacity-90 transition-opacity text-lg px-8 py-6 glow-primary">
                Começar Aventura
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[{
            icon: Users,
            value: "10+",
            label: "Alunos Ativos"
          }, {
            icon: BookOpen,
            value: "50+",
            label: "Exercícios"
          }, {
            icon: Trophy,
            value: "50+",
            label: "Conquistas"
          }, {
            icon: Star,
            value: "4.9",
            label: "Avaliação"
          }].map((stat, index) => <div key={index} className="glass rounded-2xl p-6 animate-fade-in" style={{
            animationDelay: `${index * 0.1}s`
          }}>
                <stat.icon className="w-8 h-8 text-primary mx-auto mb-3" />
                <div className="font-display text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>)}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold text-foreground mb-4">
              Por que CodeQuest?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Uma plataforma completa que transforma o aprendizado de programação em uma experiência divertida e envolvente.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[{
            icon: Zap,
            title: "XP & Níveis",
            description: "Ganhe pontos de experiência a cada exercício completado e suba de nível como em um RPG.",
            gradient: "bg-gradient-xp"
          }, {
            icon: Flame,
            title: "Sistema de Streak",
            description: "Mantenha sua sequência de dias estudando e ganhe bônus especiais.",
            gradient: "bg-gradient-streak"
          }, {
            icon: Trophy,
            title: "Conquistas",
            description: "Desbloqueie badges exclusivos ao completar desafios e marcos importantes.",
            gradient: "bg-gradient-accent"
          }, {
            icon: Target,
            title: "Missões Diárias",
            description: "Novos desafios todos os dias para manter você motivado e progredindo.",
            gradient: "bg-gradient-primary"
          }, {
            icon: Users,
            title: "Rankings",
            description: "Compita com outros alunos e veja sua posição no ranking global.",
            gradient: "bg-gradient-accent"
          }, {
            icon: Code2,
            title: "Editor de Código",
            description: "Execute Python, JavaScript e SQL diretamente no navegador.",
            gradient: "bg-gradient-primary"
          }].map((feature, index) => <div key={index} className="glass rounded-2xl p-8 hover:scale-105 transition-transform duration-300 animate-fade-in" style={{
            animationDelay: `${index * 0.1}s`
          }}>
                <div className={`w-14 h-14 rounded-xl ${feature.gradient} flex items-center justify-center mb-6`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>)}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="glass rounded-3xl p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-primary opacity-10" />
            <div className="relative z-10">
              <h2 className="font-display text-4xl font-bold text-foreground mb-4">
                Pronto para começar sua jornada?
              </h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
                Junte-se a milhares de alunos que já estão transformando suas carreiras através da gamificação.
              </p>
              <Link to="/auth?mode=register">
                <Button size="lg" className="bg-gradient-primary hover:opacity-90 transition-opacity text-lg px-10 py-6">
                  Criar Conta Grátis
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border/50">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Code2 className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-foreground">JovemCoder</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 JovemCoder. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>;
};
export default Landing;