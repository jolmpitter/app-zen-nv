'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  Plus,
  Target,
  TrendingUp,
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  Star,
  Zap,
  LayoutDashboard,
  Users,
  Facebook,
  Bot
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatedDiv, StaggerContainer, AnimatedSpan } from '@/components/animated/motion-components';
import { fadeInUp, fadeIn, staggerContainer, staggerItem } from '@/lib/animations';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#000000] text-white selection:bg-primary selection:text-white">
      {/* Dynamic Background Mesh */}
      <div className="fixed inset-0 z-0 opacity-40 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/30 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Plus className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
              POLODASH
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
            <Link href="#features" className="hover:text-white transition-colors">Funcionalidades</Link>
            <Link href="#okr" className="hover:text-white transition-colors">OKR</Link>
            <Link href="#meta" className="hover:text-white transition-colors">Meta Ads</Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="hover:bg-white/5 text-white/80">Entrar</Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 border border-primary/20">
                Criar Conta
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <AnimatedDiv variants={fadeInUp} className="space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest">
              <Zap className="w-3 h-3" />
              Lançamento Nacional
            </div>

            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tighter leading-[1.1]">
              A Inteligência que sua <br />
              <AnimatedSpan variants={fadeIn} className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-400 to-primary">
                Agência Merece.
              </AnimatedSpan>
            </h1>

            <p className="text-lg text-white/60 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              O PoloDash é a plataforma definitiva de gestão para agências de tráfego.
              Integre Meta Ads, OKRs, CRM e WhatsApp em um único ecossistema premium.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/signup">
                <Button size="lg" className="h-14 px-8 bg-white text-black hover:bg-white/90 font-bold text-base group">
                  Começar Trial Gratuito
                  <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="h-14 px-8 border-white/10 hover:bg-white/5 font-semibold text-base">
                  Ver Funcionalidades
                </Button>
              </Link>
            </div>

            <div className="flex items-center gap-6 pt-4 justify-center lg:justify-start">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-black bg-zinc-800 flex items-center justify-center text-xs font-bold">
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <p className="text-sm text-white/40">
                <span className="text-white font-bold">+500 gestores</span> já estão escalando
              </p>
            </div>
          </AnimatedDiv>

          <AnimatedDiv
            variants={fadeIn}
            transition={{ delay: 0.3 }}
            className="relative lg:scale-110"
          >
            <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full opacity-50" />
            <div className="relative rounded-2xl border border-white/10 shadow-2xl overflow-hidden bg-zinc-900/50 backdrop-blur-sm">
              <Image
                src="/mockup.png"
                alt="PoloDash Dashboard"
                width={1200}
                height={800}
                className="w-full h-auto"
                priority
              />
            </div>

            {/* Floating Elements */}
            <AnimatedDiv
              variants={fadeInUp}
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4 }}
              className="absolute -top-6 -right-6 p-4 rounded-xl bg-black/60 backdrop-blur-lg border border-white/10 shadow-2xl hidden md:block"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <TrendingUp className="text-green-500 w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] text-white/40 uppercase font-bold">ROI Médio</p>
                  <p className="text-lg font-bold">4.82x</p>
                </div>
              </div>
            </AnimatedDiv>
          </AnimatedDiv>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 px-4 bg-[#050505] relative border-y border-white/5">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold tracking-tight">Um Ecossistema Completo</h2>
            <p className="text-white/40 max-w-2xl mx-auto">
              Elimine a fragmentação de ferramentas. O PoloDash centraliza tudo o que você precisa para gerir sua operação.
            </p>
          </div>

          <StaggerContainer variants={staggerContainer} className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={<Facebook className="w-6 h-6" />}
              title="Gestão de Meta Ads"
              desc="Controle orçamentos, pause campanhas e veja o ROI em tempo real sem sair do dashboard."
              color="blue"
            />
            <FeatureCard
              icon={<Target className="w-6 h-6" />}
              title="Metas OKR"
              desc="Defina objetivos claros para sua equipe e acompanhe o progresso de cada setor."
              color="purple"
            />
            <FeatureCard
              icon={<MessageSquare className="w-6 h-6" />}
              title="WhatsApp Inbox"
              desc="Responda seus leads instantaneamente com nosso Inbox multi-atendimento integrado."
              color="green"
            />
            <FeatureCard
              icon={<Bot className="w-6 h-6" />}
              title="IA de Conversão"
              desc="Nossa inteligência analisa seus criativos e sugere melhorias para baixar o seu CPA."
              color="orange"
            />
          </StaggerContainer>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-32 px-4">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h2 className="text-4xl font-bold leading-tight">
              A ferramenta secreta das <br />
              <span className="text-primary italic">agências que mais crescem.</span>
            </h2>
            <div className="space-y-6">
              <Testimonial
                text="O PoloDash mudou a forma como apresentamos relatórios. Meus clientes agora entendem o ROI em segundos."
                author="Ricardo Silva"
                role="CEO, Agência Focus"
              />
              <Testimonial
                text="A integração com OKR me permitiu dobrar o tamanho da minha equipe sem perder o controle."
                author="Ana Paula"
                role="Diretora de Operações"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4 pt-12">
              <StatCard label="Leads Gerados" value="2.4M+" />
              <StatCard label="Ads Gerenciados" value="R$ 15M+" />
            </div>
            <div className="space-y-4">
              <StatCard label="ROI Médio" value="+340%" />
              <StatCard label="CPA Reduzido" value="-28%" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-4 relative">
        <div className="max-w-5xl mx-auto rounded-[40px] bg-gradient-to-br from-primary to-purple-800 p-12 lg:p-20 text-center space-y-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-10">
            <Plus className="w-64 h-64 -rotate-12" />
          </div>

          <h2 className="text-4xl lg:text-6xl font-black tracking-tighter">
            Pronto para o próximo <br /> nível de gestão?
          </h2>
          <p className="text-white/80 max-w-xl mx-auto text-lg">
            Junte-se a centenas de agências e comece sua jornada PoloDash ainda hoje.
            Sem fidelidade, cancele quando quiser.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="h-16 px-12 bg-white text-black hover:bg-white/90 font-black text-lg">
                Começar Agora
              </Button>
            </Link>
          </div>
          <p className="text-white/40 text-sm">Trial de 14 dias. Não pedimos cartão agora.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-4 border-t border-white/5 bg-[#050505]">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12">
          <div className="col-span-2 space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Plus className="text-white w-5 h-5" />
              </div>
              <span className="text-lg font-bold tracking-tighter">POLODASH</span>
            </div>
            <p className="text-white/40 text-sm max-w-sm">
              Sua agência merece a melhor tecnologia. PoloDash, o sistema operacional do gestor de alto nível.
            </p>
          </div>

          <div className="space-y-4 text-sm">
            <h4 className="font-bold">Plataforma</h4>
            <ul className="space-y-2 text-white/40">
              <li><Link href="#features">Funcionalidades</Link></li>
              <li><Link href="/pricing">Preços</Link></li>
              <li><Link href="/changelog">Notas de Lançamento</Link></li>
            </ul>
          </div>

          <div className="space-y-4 text-sm">
            <h4 className="font-bold">Legal</h4>
            <ul className="space-y-2 text-white/40">
              <li><Link href="/privacy">Privacidade</Link></li>
              <li><Link href="/terms">Termos de Uso</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-20 flex justify-between items-center text-xs text-white/20">
          <p>© 2024 PoloDash Inc. Todos os direitos reservados.</p>
          <div className="flex gap-4">
            <span>Instagram</span>
            <span>LinkedIn</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc, color }: { icon: React.ReactNode, title: string, desc: string, color: string }) {
  const colors: Record<string, string> = {
    blue: 'group-hover:text-blue-400 bg-blue-500/10 text-blue-500',
    purple: 'group-hover:text-purple-400 bg-purple-500/10 text-purple-500',
    green: 'group-hover:text-green-400 bg-green-500/10 text-green-500',
    orange: 'group-hover:text-orange-400 bg-orange-500/10 text-orange-500',
  };

  return (
    <AnimatedDiv variants={staggerItem} className="group p-8 rounded-3xl bg-zinc-900/50 border border-white/5 hover:border-primary/30 transition-all duration-500 hover:-translate-y-2">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-500 ${colors[color]}`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">{title}</h3>
      <p className="text-white/40 leading-relaxed text-sm">{desc}</p>
    </AnimatedDiv>
  );
}

function Testimonial({ text, author, role }: { text: string, author: string, role: string }) {
  return (
    <div className="p-6 rounded-2xl bg-zinc-900/40 border border-white/5 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Star className="text-primary w-20 h-20 fill-current" />
      </div>
      <p className="text-white/80 mb-4 font-medium leading-relaxed italic">"{text}"</p>
      <div>
        <h4 className="font-bold text-sm">{author}</h4>
        <p className="text-xs text-white/40">{role}</p>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string, value: string }) {
  return (
    <div className="p-8 rounded-3xl bg-zinc-900 border border-white/5 text-center">
      <h3 className="text-3xl font-black mb-1 tracking-tighter text-primary">{value}</h3>
      <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">{label}</p>
    </div>
  );
}
