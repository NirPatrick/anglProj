/// <reference types="vite/client" />
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { useTranslatedQuizData } from '@/hooks/useTranslatedQuizData';
import type { Question, AnswerValue } from '@/types/quiz';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  ChevronRight,
  ChevronLeft,
  GraduationCap,
  User,
  Target,
  MapPin,
  CheckCircle2,
  RotateCcw,
  Download,
  Sparkles,
  Loader2,
  ArrowRight,
  Home,
  Edit3,
  Map,
  Check,
  Brain,
  Shield,
  Zap,
  Globe,
  Star,
  ArrowUpRight,
  ChevronDown,
  Clock,
  Users,
  Award,
  BookOpen,
  TrendingUp,
  Heart,
  MessageCircle,
  Play,
  X,
  Menu,
  CheckCheck,
  Lightbulb,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── PARTIE KEY MAP ────────────────────────────────────
const partieKeyMap: Record<string, string> = {
  "Profil Académique": "quiz.parties.academicProfile",
  "Personnalité": "quiz.parties.personality",
  "Aspirations": "quiz.parties.aspirations",
  "Contexte Madagascar": "quiz.parties.madagascarContext",
};

// ─── CONFIG ────────────────────────────────────────────
const partieIcons: Record<string, React.ReactNode> = {
  "Profil Académique": <GraduationCap className="w-5 h-5" />,
  "Personnalité": <User className="w-5 h-5" />,
  "Aspirations": <Target className="w-5 h-5" />,
  "Contexte Madagascar": <MapPin className="w-5 h-5" />,
};

const partieConfig: Record<string, { color: string; bg: string; light: string; gradient: string }> = {
  "Profil Académique": { color: "#2563eb", bg: "from-blue-500 to-blue-600", light: "#eff6ff", gradient: "from-blue-500 to-indigo-600" },
  "Personnalité":      { color: "#7c3aed", bg: "from-violet-500 to-purple-600", light: "#f5f3ff", gradient: "from-violet-500 to-purple-600" },
  "Aspirations":       { color: "#059669", bg: "from-emerald-500 to-green-600", light: "#ecfdf5", gradient: "from-emerald-500 to-teal-600" },
  "Contexte Madagascar": { color: "#ea580c", bg: "from-orange-500 to-red-600", light: "#fff7ed", gradient: "from-orange-500 to-amber-600" },
};

// ✅ Fix TS error: cast import.meta to any to access env
const GEMINI_API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';

// ─── NAVBAR ────────────────────────────────────────────
function Navbar({ onNavigate, activeSection }: { onNavigate: (s: string) => void; activeSection: string }) {
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { id: 'hero', label: t('navbar.home') },
    { id: 'features', label: t('navbar.features') },
    { id: 'how', label: t('navbar.howItWorks') },
    { id: 'quiz', label: t('navbar.quiz') },
    { id: 'testimonials', label: t('navbar.testimonials') },
  ];

  const switchLanguage = useCallback((lng: string) => {
    i18n.changeLanguage(lng);
    document.documentElement.lang = lng;
    setLangOpen(false);
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(255,255,255,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(0,0,0,0.06)' : 'none',
      }}
    >
      <div className="max-w-6xl mx-auto px-5 flex items-center justify-between h-16">
        <button onClick={() => onNavigate('hero')} className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-200 group-hover:shadow-blue-300 transition-shadow">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="font-black text-lg text-gray-900 tracking-tight">Ori<span style={{ color: '#2563eb' }}>entation</span>.mg</span>
        </button>

        <div className="hidden md:flex items-center gap-1">
          {links.map(l => (
            <button
              key={l.id}
              onClick={() => onNavigate(l.id)}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
              style={{ color: activeSection === l.id ? '#2563eb' : '#64748b' }}
            >
              {l.label}
            </button>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2">
          {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors text-xs font-bold"
            >
              {i18n.language?.substring(0, 2).toUpperCase() === 'EN' ? 'EN' : 'FR'}
            </button>
            {langOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50">
                <button
                  onClick={() => switchLanguage('fr')}
                  className={cn(
                    "w-full px-4 py-2.5 text-sm font-medium text-left transition-colors",
                    i18n.language?.startsWith('fr') ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  FR
                </button>
                <button
                  onClick={() => switchLanguage('en')}
                  className={cn(
                    "w-full px-4 py-2.5 text-sm font-medium text-left transition-colors",
                    i18n.language?.startsWith('en') ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  EN
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigate('quiz')}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-bold shadow-lg shadow-blue-200 hover:shadow-blue-300 active:scale-95 transition-all"
          >
            {t('navbar.startQuiz')}
          </button>
        </div>

        <button
          className="md:hidden w-10 h-10 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-xl animate-in slide-in-from-top">
          <div className="px-5 py-4 space-y-1">
            {links.map(l => (
              <button
                key={l.id}
                onClick={() => { onNavigate(l.id); setMobileOpen(false); }}
                className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {l.label}
              </button>
            ))}
            {/* Mobile Language Switcher */}
            <div className="flex items-center gap-2 px-4 py-3">
              <button
                onClick={() => switchLanguage('fr')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors",
                  i18n.language?.startsWith('fr')
                    ? "border-blue-300 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-500 hover:bg-gray-50"
                )}
              >
                FR
              </button>
              <button
                onClick={() => switchLanguage('en')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors",
                  i18n.language?.startsWith('en')
                    ? "border-blue-300 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-500 hover:bg-gray-50"
                )}
              >
                EN
              </button>
            </div>
            <button
              onClick={() => { onNavigate('quiz'); setMobileOpen(false); }}
              className="w-full mt-3 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-bold text-center"
            >
              {t('navbar.startQuiz')}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

// ─── HERO ──────────────────────────────────────────────
function HeroSection({ onStart }: { onStart: () => void }) {
  const { t } = useTranslation();
  const quizData = useTranslatedQuizData();

  return (
    <section id="hero" className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/50 to-violet-50/50" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* SVG Abstract Background */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1440 900" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.08" />
            </linearGradient>
            <linearGradient id="grad2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.06" />
            </linearGradient>
            <linearGradient id="grad3" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#059669" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
            </linearGradient>
            <filter id="blur1">
              <feGaussianBlur in="SourceGraphic" stdDeviation="40" />
            </filter>
          </defs>
          {/* Large flowing blobs */}
          <circle cx="200" cy="150" r="300" fill="url(#grad1)" filter="url(#blur1)" />
          <circle cx="1200" cy="200" r="250" fill="url(#grad2)" filter="url(#blur1)" />
          <circle cx="700" cy="700" r="280" fill="url(#grad3)" filter="url(#blur1)" />
          {/* Decorative geometric shapes */}
          <circle cx="150" cy="400" r="4" fill="#3b82f6" opacity="0.3" />
          <circle cx="300" cy="200" r="3" fill="#8b5cf6" opacity="0.25" />
          <circle cx="1100" cy="350" r="5" fill="#059669" opacity="0.2" />
          <circle cx="1300" cy="150" r="3" fill="#3b82f6" opacity="0.3" />
          <circle cx="900" cy="600" r="4" fill="#8b5cf6" opacity="0.2" />
          {/* Subtle grid dots */}
          <g opacity="0.04">
            <circle cx="100" cy="100" r="1.5" fill="#000" />
            <circle cx="140" cy="100" r="1.5" fill="#000" />
            <circle cx="180" cy="100" r="1.5" fill="#000" />
            <circle cx="220" cy="100" r="1.5" fill="#000" />
            <circle cx="260" cy="100" r="1.5" fill="#000" />
            <circle cx="100" cy="140" r="1.5" fill="#000" />
            <circle cx="140" cy="140" r="1.5" fill="#000" />
            <circle cx="180" cy="140" r="1.5" fill="#000" />
            <circle cx="220" cy="140" r="1.5" fill="#000" />
            <circle cx="260" cy="140" r="1.5" fill="#000" />
            <circle cx="100" cy="180" r="1.5" fill="#000" />
            <circle cx="140" cy="180" r="1.5" fill="#000" />
            <circle cx="180" cy="180" r="1.5" fill="#000" />
            <circle cx="220" cy="180" r="1.5" fill="#000" />
            <circle cx="260" cy="180" r="1.5" fill="#000" />
            <circle cx="100" cy="220" r="1.5" fill="#000" />
            <circle cx="140" cy="220" r="1.5" fill="#000" />
            <circle cx="180" cy="220" r="1.5" fill="#000" />
            <circle cx="220" cy="220" r="1.5" fill="#000" />
            <circle cx="260" cy="220" r="1.5" fill="#000" />
          </g>
        </svg>
      </div>

      <div className="relative max-w-6xl mx-auto px-5 pt-24 pb-16 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-200 bg-blue-50/80 backdrop-blur mb-8 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-blue-700 font-semibold tracking-wide">{t('hero.badge')}</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-gray-900 leading-[1.05] mb-6 tracking-tight">
              {t('hero.titleLine1')}
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600">
                {t('hero.titleLine2')}
              </span>
            </h1>

            <p
              className="text-lg sm:text-xl text-gray-600 leading-relaxed mb-10 max-w-lg"
              dangerouslySetInnerHTML={{ __html: t('hero.description', { count: quizData.nombre_questions }) }}
            />

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <button
                onClick={onStart}
                className="group h-14 px-8 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold text-base flex items-center justify-center gap-3 shadow-xl shadow-blue-200 hover:shadow-blue-300 active:scale-95 transition-all"
              >
                {t('hero.startQuiz')}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => {
                  const el = document.getElementById('how');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="h-14 px-8 rounded-2xl border-2 border-gray-200 bg-white text-gray-700 font-semibold text-base flex items-center justify-center gap-2.5 hover:border-gray-300 hover:bg-gray-50 active:scale-95 transition-all"
              >
                <Play className="w-4 h-4 text-emerald-600" />
                {t('hero.howItWorks')}
              </button>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8">
              {[
                { value: '4', label: t('hero.statParties'), icon: <BookOpen className="w-4 h-4" /> },
                { value: '10min', label: t('hero.statDuration'), icon: <Clock className="w-4 h-4" /> },
                { value: '100%', label: t('hero.statFree'), icon: <Shield className="w-4 h-4" /> },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 shadow-sm">
                    {s.icon}
                  </div>
                  <div>
                    <div className="text-lg font-black text-gray-900">{s.value}</div>
                    <div className="text-xs text-gray-500 font-medium">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero Visual */}
          <div className="relative hidden lg:block">
            <div className="relative z-10">
              {/* Floating cards */}
              <div className="space-y-4">
                {Object.entries(partieIcons).map(([partie, icon], idx) => {
                  const c = partieConfig[partie];
                  return (
                    <div
                      key={partie}
                      className="bg-white rounded-2xl border border-gray-200 p-5 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 cursor-default"
                      style={{ animationDelay: `${idx * 0.1}s` }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${c.color}15`, color: c.color }}>
                          {icon}
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-gray-900 text-sm">{partieKeyMap[partie] ? t(partieKeyMap[partie]) : partie}</div>
                          <div className="flex gap-1 mt-2">
                            {[1, 2, 3, 4, 5].map(d => (
                              <div key={d} className="h-1.5 rounded-full flex-1" style={{ backgroundColor: `${c.color}${d <= 3 ? '' : '20'}` }} />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Glow behind */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full opacity-20 blur-3xl bg-gradient-to-br from-blue-500 to-violet-500" />
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-xs text-gray-400 font-medium">{t('hero.scrollDiscover')}</span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    </section>
  );
}

// ─── FEATURES ──────────────────────────────────────────
function FeaturesSection() {
  const { t } = useTranslation();

  const features = [
    {
      icon: <Brain className="w-6 h-6" />,
      title: t('features.ai.title'),
      desc: t('features.ai.desc'),
      color: "#2563eb",
      gradient: "from-blue-500 to-indigo-600",
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: t('features.universities.title'),
      desc: t('features.universities.desc'),
      color: "#ea580c",
      gradient: "from-orange-500 to-amber-600",
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: t('features.instant.title'),
      desc: t('features.instant.desc'),
      color: "#eab308",
      gradient: "from-yellow-500 to-amber-600",
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: t('features.free.title'),
      desc: t('features.free.desc'),
      color: "#059669",
      gradient: "from-emerald-500 to-teal-600",
    },
  ];

  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-5">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">{t('features.badge')}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">
            {t('features.title')}
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg">
            {t('features.subtitle')}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className="group rounded-2xl border border-gray-200 p-6 bg-white hover:shadow-xl hover:border-transparent hover:-translate-y-1 transition-all duration-300"
            >
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-5 bg-gradient-to-br text-white shadow-lg", f.gradient)}>
                {f.icon}
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── HOW IT WORKS ──────────────────────────────────────
function HowItWorks() {
  const { t } = useTranslation();
  const quizData = useTranslatedQuizData();

  const steps = [
    {
      num: "01",
      title: t('howItWorks.steps.1.title'),
      desc: t('howItWorks.steps.1.desc', { count: quizData.nombre_questions }),
      icon: <MessageCircle className="w-6 h-6" />,
      color: "#2563eb",
    },
    {
      num: "02",
      title: t('howItWorks.steps.2.title'),
      desc: t('howItWorks.steps.2.desc'),
      icon: <Brain className="w-6 h-6" />,
      color: "#7c3aed",
    },
    {
      num: "03",
      title: t('howItWorks.steps.3.title'),
      desc: t('howItWorks.steps.3.desc'),
      icon: <Award className="w-6 h-6" />,
      color: "#059669",
    },
  ];

  return (
    <section id="how" className="py-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-5">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-50 border border-violet-100 mb-4">
            <TrendingUp className="w-3.5 h-3.5 text-violet-600" />
            <span className="text-xs font-bold text-violet-700 uppercase tracking-wider">{t('howItWorks.badge')}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">
            {t('howItWorks.title')}
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg">
            {t('howItWorks.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-24 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-blue-200 via-violet-200 to-emerald-200" />

          {steps.map((s, i) => (
            <div key={i} className="relative text-center">
              <div
                className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 text-white shadow-xl relative z-10"
                style={{ background: `linear-gradient(135deg, ${s.color}, ${s.color}cc)` }}
              >
                {s.icon}
              </div>
              <div className="text-xs font-black mb-2" style={{ color: s.color }}>
                {t('howItWorks.step', { num: s.num })}
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-3">{s.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── QUIZ SECTION ──────────────────────────────────────
function QuizSection({
  answers,
  setAnswers,
  currentIndex,
  setCurrentIndex,
  setIsCompleted,
  handleGoHome,
}: {
  answers: Record<number, AnswerValue>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<number, AnswerValue>>>;
  currentIndex: number;
  setCurrentIndex: React.Dispatch<React.SetStateAction<number>>;
  setIsCompleted: React.Dispatch<React.SetStateAction<boolean>>;
  handleGoHome: () => void;
}) {
  const { t } = useTranslation();
  const quizData = useTranslatedQuizData();
  const questions = quizData.questions;
  const currentQuestion = questions[currentIndex];
  const cfg = partieConfig[currentQuestion?.partie] ?? partieConfig["Profil Académique"];
  const currentColor = cfg.color;

  const progress = useMemo(() => ((currentIndex + 1) / questions.length) * 100, [currentIndex, questions.length]);

  const handleAnswer = useCallback((value: AnswerValue) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
  }, [currentQuestion?.id, setAnswers]);

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) setCurrentIndex(prev => prev + 1);
    else setIsCompleted(true);
  }, [currentIndex, questions.length, setCurrentIndex, setIsCompleted]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
  }, [currentIndex, setCurrentIndex]);

  const renderQuestionInput = (question: Question) => {
    const value = answers[question.id];
    switch (question.type) {
      case 'choix_unique':
        return (
          <div className="space-y-2.5">
            {question.options?.map((option, idx) => (
              <div
                key={idx}
                onClick={() => handleAnswer(option)}
                className="flex items-center gap-3 rounded-2xl border-2 px-4 py-3.5 cursor-pointer transition-all duration-150 select-none bg-white"
                style={value === option
                  ? { borderColor: currentColor, backgroundColor: `${currentColor}0d`, boxShadow: `0 0 0 1px ${currentColor}30` }
                  : { borderColor: '#e2e8f0', backgroundColor: '#fff' }}
              >
                <div
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                  style={value === option ? { borderColor: currentColor } : { borderColor: '#cbd5e1' }}
                >
                  {value === option && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: currentColor }} />}
                </div>
                <Label className="flex-1 cursor-pointer text-sm font-medium text-gray-800 leading-snug">{option}</Label>
              </div>
            ))}
          </div>
        );

      case 'choix_multiple':
        const selectedValues = (value as string[]) || [];
        const maxChoices = question.max_choix || question.options?.length || 1;
        return (
          <div className="space-y-2.5">
            <p className="text-xs text-gray-500 font-medium mb-3 flex items-center gap-1.5">
              <span>{t('quiz.maxChoices', { max: maxChoices })}</span>
              {selectedValues.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-white text-xs font-semibold" style={{ backgroundColor: currentColor }}>
                  {selectedValues.length}/{maxChoices}
                </span>
              )}
            </p>
            {question.options?.map((option, idx) => {
              const isSelected = selectedValues.includes(option);
              const canSelect = isSelected || selectedValues.length < maxChoices;
              return (
                <div
                  key={idx}
                  onClick={() => {
                    if (isSelected) handleAnswer(selectedValues.filter((v: string) => v !== option));
                    else if (canSelect) handleAnswer([...selectedValues, option]);
                  }}
                  className="flex items-center gap-3 rounded-2xl border-2 px-4 py-3.5 transition-all duration-150 select-none bg-white"
                  style={{
                    cursor: canSelect ? 'pointer' : 'not-allowed',
                    opacity: !canSelect ? 0.4 : 1,
                    ...(isSelected
                      ? { borderColor: currentColor, backgroundColor: `${currentColor}0d`, boxShadow: `0 0 0 1px ${currentColor}30` }
                      : { borderColor: '#e2e8f0', backgroundColor: '#fff' })
                  }}
                >
                  <div
                    className="w-5 h-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all"
                    style={isSelected ? { borderColor: currentColor, backgroundColor: currentColor } : { borderColor: '#cbd5e1' }}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <Label className="flex-1 text-sm font-medium text-gray-800 leading-snug cursor-pointer">{option}</Label>
                </div>
              );
            })}
          </div>
        );

      case 'texte':
        return (
          <Textarea
            value={(value as string) || ''}
            onChange={(e) => handleAnswer(e.target.value)}
            placeholder={t('quiz.placeholder')}
            className="min-h-[130px] resize-none border-2 border-gray-200 rounded-2xl focus:border-blue-400 text-sm text-gray-800 bg-white placeholder:text-gray-300 px-4 py-3"
          />
        );
      default: return null;
    }
  };

  return (
    <section id="quiz" className="py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-3xl mx-auto px-5">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">{t('quiz.badge')}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">
            {t('quiz.title')}
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-lg">
            {t('quiz.subtitle')}
          </p>
        </div>

        {/* Progress bar */}
        <div className="h-2 w-full bg-gray-200 rounded-full mb-8 overflow-hidden">
          <div
            className="h-full transition-all duration-500 ease-out rounded-full"
            style={{ width: `${progress}%`, backgroundColor: currentColor }}
          />
        </div>

        {/* Quiz card */}
        <div className="rounded-3xl border border-gray-200 bg-white shadow-xl overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border"
              style={{ borderColor: `${currentColor}40`, backgroundColor: `${currentColor}08` }}
            >
              <span style={{ color: currentColor }}>{partieIcons[currentQuestion.partie]}</span>
              <span className="text-xs font-bold" style={{ color: currentColor }}>
                {partieKeyMap[currentQuestion.partie] ? t(partieKeyMap[currentQuestion.partie]) : currentQuestion.partie}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-gray-500">
                {currentIndex + 1}<span className="text-gray-400">/{questions.length}</span>
              </span>
              <button
                onClick={handleGoHome}
                className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:text-gray-800 hover:border-gray-300 transition-all shadow-sm"
                title={t('quiz.homeTitle')}
              >
                <Home className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Question */}
          <div className="px-6 py-8">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{t('quiz.question', { num: currentIndex + 1 })}</p>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 leading-snug mb-8">
              {currentQuestion.question}
            </h2>
            {renderQuestionInput(currentQuestion)}
          </div>

          {/* Footer */}
          <div className="px-6 py-5 border-t border-gray-100 bg-gray-50/50">
            {/* Dots */}
            <div className="flex justify-center gap-1.5 flex-wrap mb-5">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = !!answers[q.id];
                const c = partieConfig[q.partie];
                return (
                  <button
                    key={q.id}
                    onClick={() => idx <= currentIndex && setCurrentIndex(idx)}
                    disabled={idx > currentIndex}
                    className="rounded-full transition-all duration-300"
                    style={{
                      width: isCurrent ? 22 : 6,
                      height: 6,
                      backgroundColor: isCurrent ? c.color : isAnswered ? `${c.color}aa` : '#d1d5db',
                    }}
                  />
                );
              })}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="w-12 h-12 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-500 disabled:opacity-30 active:bg-gray-50 transition-colors flex-shrink-0 shadow-sm"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={handleNext}
                disabled={!answers[currentQuestion.id]}
                className="flex-1 h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 text-white active:scale-95 transition-all disabled:opacity-30 shadow-md"
                style={{
                  background: answers[currentQuestion.id]
                    ? `linear-gradient(135deg, ${currentColor}, ${currentColor}cc)`
                    : '#e5e7eb',
                  boxShadow: answers[currentQuestion.id] ? `0 4px 12px ${currentColor}40` : 'none',
                }}
              >
                {currentIndex === questions.length - 1 ? (
                  <>{t('quiz.finish')} <CheckCircle2 className="w-4 h-4" /></>
                ) : (
                  <>{t('quiz.next')} <ChevronRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── RESULTS ───────────────────────────────────────────
function ResultsSection({
  answers,
  recommendations,
  setRecommendations,
  isAnalyzing,
  setIsAnalyzing,
  error,
  setError,
  handleGoHome,
  handleBackToQuestions,
  handleAnalyzeIA,
  handleExport,
  handleRestart,
}: any) {
  const { t } = useTranslation();
  const quizData = useTranslatedQuizData();
  const questions = quizData.questions;
  const answeredCount = Object.keys(answers).length;

  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-2xl mx-auto px-5">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-500 to-green-600 mb-5 shadow-xl shadow-emerald-200">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-2">{t('results.title')}</h2>
          <p className="text-gray-500">{t('results.answersCount', { count: answeredCount })}</p>
        </div>

        {/* Recap */}
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm mb-6">
          <div className="px-5 py-4 bg-gray-50 flex items-center justify-between border-b border-gray-200">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{t('results.recap')}</span>
            <button
              onClick={handleBackToQuestions}
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              {t('results.edit')}
            </button>
          </div>
          <div className="max-h-52 overflow-y-auto divide-y divide-gray-100">
            {Object.entries(answers).map(([questionId, value]: [string, any]) => {
              const question = questions.find((q: Question) => q.id === parseInt(questionId));
              if (!question) return null;
              const c = partieConfig[question.partie];
              return (
                <div key={questionId} className="px-5 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                    <span className="text-xs font-bold" style={{ color: c.color }}>
                      {partieKeyMap[question.partie] ? t(partieKeyMap[question.partie]) : question.partie}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-gray-700 mb-0.5">{question.question}</p>
                  <p className="text-xs text-gray-500">{Array.isArray(value) ? value.join(', ') : value}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Analysis */}
        {!recommendations ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-200">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">{t('results.aiAnalysis')}</h3>
            <p className="text-sm text-gray-500 mb-6">{t('results.aiDescription')}</p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-4 py-3 rounded-xl mb-4">
                {error}
              </div>
            )}

            <button
              onClick={handleAnalyzeIA}
              disabled={isAnalyzing}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 active:scale-95 transition-all disabled:opacity-60"
            >
              {isAnalyzing ? (
                <><Loader2 className="w-5 h-5 animate-spin" />{t('results.analyzing')}</>
              ) : (
                <><Sparkles className="w-5 h-5" />{t('results.getRecommendations')}</>
              )}
            </button>
            <p className="text-xs text-gray-400 mt-4">{t('results.aiInfo')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white shadow-lg">
              <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest mb-2">{t('results.recommendedField')}</p>
              <h3 className="text-2xl font-black">{recommendations.domainePrincipal}</h3>
            </div>

            {recommendations.filieres?.map((filiere: any, idx: number) => (
              <div key={idx} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">{filiere.univ}</span>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 border border-gray-200">{filiere.duree}</span>
                    </div>
                    <h4 className="font-black text-gray-900 text-base leading-snug">{filiere.nom}</h4>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-emerald-600 font-black text-sm">{idx + 1}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{filiere.pourquoi}</p>
              </div>
            ))}

            {recommendations.conseils && (
              <div className="rounded-2xl border border-orange-200 bg-orange-50 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-4 h-4 text-orange-600" />
                  <span className="font-black text-gray-900 text-sm">{t('results.tipsTitle')}</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{recommendations.conseils}</p>
              </div>
            )}

            <button
              onClick={() => setRecommendations(null)}
              className="w-full py-3 rounded-xl border border-gray-200 bg-white text-gray-500 text-sm font-semibold flex items-center justify-center gap-2 active:bg-gray-50 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />{t('results.retryAnalysis')}
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <button
            onClick={handleExport}
            className="py-3 rounded-xl border border-gray-200 bg-white text-gray-600 text-sm font-semibold flex items-center justify-center gap-2 active:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />{t('results.export')}
          </button>
          <button
            onClick={handleRestart}
            className="py-3 rounded-xl border border-gray-200 bg-white text-gray-600 text-sm font-semibold flex items-center justify-center gap-2 active:bg-gray-50 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />{t('results.restart')}
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── TESTIMONIALS ──────────────────────────────────────
function TestimonialsSection() {
  const { t } = useTranslation();

  const testimonials = [
    {
      name: "Andry R.",
      role: t('testimonials.items.0.role'),
      text: t('testimonials.items.0.text'),
      avatar: "A",
      color: "#2563eb",
    },
    {
      name: "Sambatra M.",
      role: t('testimonials.items.1.role'),
      text: t('testimonials.items.1.text'),
      avatar: "S",
      color: "#7c3aed",
    },
    {
      name: "Tiana R.",
      role: t('testimonials.items.2.role'),
      text: t('testimonials.items.2.text'),
      avatar: "T",
      color: "#059669",
    },
  ];

  return (
    <section id="testimonials" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-5">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-100 mb-4">
            <Star className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">{t('testimonials.badge')}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">
            {t('testimonials.title')}
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg">
            {t('testimonials.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((item, i) => (
            <div
              key={i}
              className="rounded-2xl border border-gray-200 p-6 bg-white hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} className="w-4 h-4 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-6">"{item.text}"</p>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: item.color }}
                >
                  {item.avatar}
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-sm">{item.name}</div>
                  <div className="text-xs text-gray-500">{item.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA SECTION ───────────────────────────────────────
function CTASection({ onStart, onExploreMap }: { onStart: () => void; onExploreMap: () => void }) {
  const { t } = useTranslation();

  return (
    <section className="py-24 bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl bg-blue-500" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl bg-violet-500" />
      </div>

      <div className="relative max-w-3xl mx-auto px-5 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gray-700 bg-gray-800/50 backdrop-blur mb-8">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-gray-400 font-semibold">{t('cta.badge')}</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-black text-white mb-6 leading-tight">
          {t('cta.titleLine1')}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400"> {t('cta.titleLine2')}</span> ?
        </h2>

        <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
          {t('cta.description')}
        </p>

        <button
          onClick={onStart}
          className="group h-14 px-10 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold text-base flex items-center justify-center gap-3 shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 active:scale-95 transition-all mx-auto"
        >
          {t('cta.startNow')}
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          onClick={onExploreMap}
          className="group h-12 px-8 rounded-2xl border-2 border-gray-600 bg-transparent text-gray-300 font-bold text-sm flex items-center justify-center gap-3 hover:border-emerald-500 hover:text-emerald-400 active:scale-95 transition-all mx-auto mt-4"
        >
          <Map className="w-4 h-4" />
          {t('cta.exploreMap')}
        </button>

        <div className="flex items-center justify-center gap-6 mt-10 text-sm text-gray-500">
          <span className="flex items-center gap-2">
            <CheckCheck className="w-4 h-4 text-emerald-500" />
            {t('cta.free')}
          </span>
          <span className="flex items-center gap-2">
            <CheckCheck className="w-4 h-4 text-emerald-500" />
            {t('cta.noSignup')}
          </span>
          <span className="flex items-center gap-2">
            <CheckCheck className="w-4 h-4 text-emerald-500" />
            {t('cta.duration')}
          </span>
        </div>
      </div>
    </section>
  );
}

// ─── FOOTER ────────────────────────────────────────────
function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-12">
      <div className="max-w-6xl mx-auto px-5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-gray-900">Ori<span style={{ color: '#2563eb' }}>entation</span>.mg</span>
          </div>

          <p className="text-sm text-gray-500">
            {t('footer.copyright')}
          </p>

          <div className="flex items-center gap-4">
            <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
              <Globe className="w-4 h-4" />
            </a>
            <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
              <MessageCircle className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── MAIN APP ──────────────────────────────────────────
function QuizApp() {
  const { t } = useTranslation();
  const quizData = useTranslatedQuizData();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, AnswerValue>>({});
  const [isStarted, setIsStarted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('hero');

  // Sync HTML lang attribute with i18n language
  useEffect(() => {
    document.documentElement.lang = i18n.language?.substring(0, 2) || 'fr';
  }, [i18n.language]);

  const handleGoHome = useCallback(() => {
    setIsStarted(false);
    setIsCompleted(false);
    setCurrentIndex(0);
    setAnswers({});
    setRecommendations(null);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleNavigate = useCallback((section: string) => {
    setActiveSection(section);
    const el = document.getElementById(section);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleStartQuiz = useCallback(() => {
    setIsStarted(true);
    setTimeout(() => {
      const el = document.getElementById('quiz');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, []);

  const handleBackToQuestions = useCallback(() => {
    setIsCompleted(false);
    setTimeout(() => {
      const el = document.getElementById('quiz');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, []);

  const handleGoUniversities = useCallback(() => {
    navigate('/universities');
  }, [navigate]);

  const handleExport = useCallback(() => {
    const questions = quizData.questions;
    const results = {
      titre: quizData.titre,
      date: new Date().toISOString(),
      reponses: Object.entries(answers).map(([questionId, value]) => {
        const question = questions.find(q => q.id === parseInt(questionId));
        return { question: question?.question, partie: question?.partie, reponse: value };
      })
    };
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quiz-orientation-resultats.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [answers]);

  const handleAnalyzeIA = useCallback(async () => {
    if (Object.keys(answers).length !== quizData.nombre_questions) {
      alert(t('errors.answerAll'));
      return;
    }
    setIsAnalyzing(true);
    setError('');
    setRecommendations(null);
    try {
      const profil = Object.entries(answers).map(([id, value]) => ({
        question: quizData.questions.find(q => q.id === parseInt(id))?.question,
        reponse: Array.isArray(value) ? value.join(', ') : value
      }));

      const isFr = i18n.language?.startsWith('fr');
      const prompt = isFr
        ? `Tu es expert orientation post-bac Madagascar. Analyse ce profil bachelier:\n${JSON.stringify(profil, null, 2)}\nRecommande 3 filières universitaires publiques malgaches (ex: ESP, FLSH, FGES, ESSA, Médecine, ENI, ISPM).\nFormat JSON strict:\n{"domainePrincipal":"string","filieres":[{"nom":"string","univ":"string","pourquoi":"string","duree":"string"}],"conseils":"string"}`
        : `You are an expert in post-bac orientation in Madagascar. Analyze this baccalaureate student profile:\n${JSON.stringify(profil, null, 2)}\nRecommend 3 public Malagasy university programs (e.g., ESP, FLSH, FGES, ESSA, Medicine, ENI, ISPM).\nStrict JSON format:\n{"domainePrincipal":"string","filieres":[{"nom":"string","univ":"string","pourquoi":"string","duree":"string"}],"conseils":"string"}`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const data = await response.json();
      const text = data.candidates[0].content.parts[0].text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error(t('errors.invalidFormat'));
      setRecommendations(JSON.parse(jsonMatch[0]));
    } catch (err: any) {
      setError(err.message.includes('403') || err.message.includes('400')
        ? t('errors.apiKeyInvalid')
        : t('errors.aiError'));
    } finally {
      setIsAnalyzing(false);
    }
  }, [answers, t]);

  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setAnswers({});
    setIsCompleted(false);
    setRecommendations(null);
    setError('');
    setIsStarted(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Track active section on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.3 }
    );

    const sections = document.querySelectorAll('section[id]');
    sections.forEach(s => observer.observe(s));

    return () => observer.disconnect();
  }, [isStarted, isCompleted]);

  // Show full landing page when not started or not completed
  if (!isCompleted) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar onNavigate={handleNavigate} activeSection={activeSection} />

        <HeroSection onStart={handleStartQuiz} />
        <FeaturesSection />
        <HowItWorks />

        {isStarted && (
          <QuizSection
            answers={answers}
            setAnswers={setAnswers}
            currentIndex={currentIndex}
            setCurrentIndex={setCurrentIndex}
            setIsCompleted={setIsCompleted}
            handleGoHome={handleGoHome}
          />
        )}

        <TestimonialsSection />
        <CTASection onStart={handleStartQuiz} onExploreMap={handleGoUniversities} />
        <Footer />
      </div>
    );
  }

  // Results page
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onNavigate={handleNavigate} activeSection="results" />
      <div className="pt-16">
        <ResultsSection
          answers={answers}
          recommendations={recommendations}
          setRecommendations={setRecommendations}
          isAnalyzing={isAnalyzing}
          setIsAnalyzing={setIsAnalyzing}
          error={error}
          setError={setError}
          handleGoHome={handleGoHome}
          handleBackToQuestions={handleBackToQuestions}
          handleAnalyzeIA={handleAnalyzeIA}
          handleExport={handleExport}
          handleRestart={handleRestart}
        />
      </div>
      <div className="max-w-2xl mx-auto px-5 pb-8">
        <button
          onClick={handleGoUniversities}
          className="w-full py-4 rounded-2xl border border-gray-300 bg-white text-gray-800 font-bold text-sm flex items-center justify-center gap-2.5 active:scale-95 transition-all hover:border-emerald-400 hover:bg-emerald-50"
        >
          <Map className="w-4 h-4 text-emerald-600" />
          {t('results.exploreMap')}
        </button>
      </div>
      <Footer />
    </div>
  );
}

export default QuizApp;
