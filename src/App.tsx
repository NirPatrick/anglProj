/// <reference types="vite/client" />
import { useState, useCallback, useMemo } from 'react';
import { quizData } from '@/data/quizData';
import type { Question, AnswerValue } from '@/types/quiz';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  Edit3
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const partieIcons: Record<string, React.ReactNode> = {
  "Profil Académique": <GraduationCap className="w-4 h-4" />,
  "Personnalité": <User className="w-4 h-4" />,
  "Aspirations": <Target className="w-4 h-4" />,
  "Contexte Madagascar": <MapPin className="w-4 h-4" />,
};

const partieHexColors: Record<string, string> = {
  "Profil Académique": "#2563eb",
  "Personnalité": "#7c3aed",
  "Aspirations": "#059669",
  "Contexte Madagascar": "#ea580c",
};

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;;

function App() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, AnswerValue>>({});
  const [isStarted, setIsStarted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [error, setError] = useState('');

  const questions = quizData.questions;
  const currentQuestion = questions[currentIndex];
  const currentColor = partieHexColors[currentQuestion?.partie] ?? "#2563eb";

  const progress = useMemo(() => {
    return ((currentIndex + 1) / questions.length) * 100;
  }, [currentIndex, questions.length]);

  const answeredCount = Object.keys(answers).length;

  const handleAnswer = useCallback((value: AnswerValue) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
  }, [currentQuestion?.id]);

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsCompleted(true);
    }
  }, [currentIndex, questions.length]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setAnswers({});
    setIsCompleted(false);
    setRecommendations(null);
    setError('');
    setIsStarted(false);
  }, []);

  const handleStart = useCallback(() => {
    setIsStarted(true);
  }, []);

  const handleGoHome = useCallback(() => {
    setIsStarted(false);
    setIsCompleted(false);
    setCurrentIndex(0);
    setAnswers({});
    setRecommendations(null);
    setError('');
  }, []);

  const handleBackToQuestions = useCallback(() => {
    setIsCompleted(false);
    setCurrentIndex(questions.length - 1);
  }, [questions.length]);

  const handleExport = useCallback(() => {
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
  }, [answers, questions]);

  const handleAnalyzeIA = useCallback(async () => {
    if (Object.keys(answers).length !== quizData.nombre_questions) {
      alert('Répondez à toutes les questions !');
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

      const prompt = `Tu es expert orientation post-bac Madagascar. Analyse ce profil bachelier:

${JSON.stringify(profil, null, 2)}

Recommande 3 filières universitaires publiques malgaches (ex: ESP, FLSH, FGES, ESSA, Médecine, ENI, ISPM).
Format JSON strict:
{
  "domainePrincipal": "string",
  "filieres": [
    {
      "nom": "string", 
      "univ": "string", 
      "pourquoi": "string", 
      "duree": "string"
    }
  ],
  "conseils": "string"
}`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

      const data = await response.json();
      const text = data.candidates[0].content.parts[0].text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Format de réponse invalide');
      setRecommendations(JSON.parse(jsonMatch[0]));
    } catch (err: any) {
      setError(err.message.includes('403') || err.message.includes('400') ?
        "Clé API invalide. Obtenez-en une gratuite sur aistudio.google.com" :
        'Erreur IA. Vérifiez votre connexion internet.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [answers]);

  const renderQuestionInput = (question: Question) => {
    const value = answers[question.id];

    switch (question.type) {
      case 'choix_unique':
        return (
          <RadioGroup value={value as string} onValueChange={handleAnswer} className="space-y-2">
            {question.options?.map((option, idx) => (
              <div
                key={idx}
                onClick={() => handleAnswer(option)}
                className={cn(
                  "flex items-center gap-3 rounded-xl border-2 px-4 py-3 cursor-pointer transition-all duration-150",
                  value === option
                    ? "border-current bg-opacity-5"
                    : "border-gray-100 hover:border-gray-200 bg-white"
                )}
                style={value === option ? { borderColor: currentColor, backgroundColor: `${currentColor}08` } : {}}
              >
                <div
                  className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                    value === option ? "border-current" : "border-gray-300"
                  )}
                  style={value === option ? { borderColor: currentColor } : {}}
                >
                  {value === option && (
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: currentColor }} />
                  )}
                </div>
                <Label className="flex-1 cursor-pointer text-sm font-normal text-gray-700 leading-snug">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'choix_multiple':
        const selectedValues = (value as string[]) || [];
        const maxChoices = question.max_choix || question.options?.length || 1;
        return (
          <div className="space-y-2">
            <p className="text-xs text-gray-400 mb-3">
              Jusqu'à {maxChoices} choix
              {selectedValues.length > 0 && <span className="ml-1 font-medium" style={{ color: currentColor }}>• {selectedValues.length}/{maxChoices}</span>}
            </p>
            {question.options?.map((option, idx) => {
              const isSelected = selectedValues.includes(option);
              const canSelect = isSelected || selectedValues.length < maxChoices;
              return (
                <div
                  key={idx}
                  onClick={() => {
                    if (isSelected) handleAnswer(selectedValues.filter(v => v !== option));
                    else if (canSelect) handleAnswer([...selectedValues, option]);
                  }}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border-2 px-4 py-3 transition-all duration-150",
                    isSelected ? "border-current" : "border-gray-100 bg-white",
                    canSelect ? "cursor-pointer hover:border-gray-200" : "opacity-40 cursor-not-allowed"
                  )}
                  style={isSelected ? { borderColor: currentColor, backgroundColor: `${currentColor}08` } : {}}
                >
                  <div
                    className={cn(
                      "w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all",
                      isSelected ? "border-current" : "border-gray-300"
                    )}
                    style={isSelected ? { borderColor: currentColor, backgroundColor: currentColor } : {}}
                  >
                    {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <Label className="flex-1 text-sm font-normal text-gray-700 leading-snug cursor-pointer">{option}</Label>
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
            placeholder="Écrivez votre réponse ici..."
            className="min-h-[120px] resize-none border-2 border-gray-100 rounded-xl focus:border-blue-400 text-sm text-gray-700"
          />
        );

      default:
        return null;
    }
  };

  // ─── WELCOME SCREEN ────────────────────────────────────────────────
  if (!isStarted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Top accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500" />

        <div className="flex-1 flex flex-col justify-center px-5 py-10 max-w-md mx-auto w-full">
          {/* Icon */}
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center mb-6 shadow-lg shadow-blue-200">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-2">
            Orientation<br />Post-Bac
          </h1>
          <p className="text-gray-400 text-sm mb-8">
            {quizData.nombre_questions} questions · Analyse IA · Adapté Madagascar
          </p>

          {/* Categories */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            {Object.entries(partieIcons).map(([partie, icon]) => (
              <div key={partie} className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-3 shadow-sm">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${partieHexColors[partie]}15`, color: partieHexColors[partie] }}>
                  {icon}
                </div>
                <span className="text-xs font-medium text-gray-600 leading-tight">{partie}</span>
              </div>
            ))}
          </div>

          {/* Features */}
          <div className="space-y-2 mb-8">
            {[
              "Résultats personnalisés selon ton profil",
              "Recommandations d'universités malgaches",
              "100% gratuit, propulsé par Google Gemini"
            ].map((feat, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                {feat}
              </div>
            ))}
          </div>

          <button
            onClick={handleStart}
            className="w-full h-14 rounded-2xl bg-blue-600 text-white font-semibold text-base flex items-center justify-center gap-2 shadow-lg shadow-blue-200 active:scale-95 transition-transform"
          >
            Commencer
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // ─── RESULTS SCREEN ────────────────────────────────────────────────
  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500" />

        <div className="max-w-lg mx-auto px-5 py-8 space-y-5">
          {/* Header with Home button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-green-500 flex items-center justify-center shadow-lg shadow-green-200">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Quiz terminé !</h2>
                <p className="text-sm text-gray-400">{answeredCount} réponses enregistrées</p>
              </div>
            </div>
            <button
              onClick={handleGoHome}
              className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-300 active:bg-gray-50 transition-all"
              title="Retour à l'accueil"
            >
              <Home className="w-5 h-5" />
            </button>
          </div>

          {/* Answers summary */}
          <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Récapitulatif</span>
              <button
                onClick={handleBackToQuestions}
                className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Modifier mes réponses
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
              {Object.entries(answers).map(([questionId, value]) => {
                const question = questions.find(q => q.id === parseInt(questionId));
                if (!question) return null;
                return (
                  <div key={questionId} className="px-4 py-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: partieHexColors[question.partie] }} />
                      <span className="text-xs font-medium" style={{ color: partieHexColors[question.partie] }}>{question.partie}</span>
                    </div>
                    <p className="text-xs font-medium text-gray-700 mb-0.5">{question.question}</p>
                    <p className="text-xs text-gray-400">{Array.isArray(value) ? value.join(', ') : value}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Analysis */}
          {!recommendations ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Analyse IA</h3>
              <p className="text-sm text-gray-400 mb-5">Recommandations personnalisées basées sur ton profil</p>

              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-xs px-4 py-3 rounded-xl mb-4">
                  {error}
                </div>
              )}

              <button
                onClick={handleAnalyzeIA}
                disabled={isAnalyzing}
                className="w-full h-13 py-4 rounded-2xl bg-emerald-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 active:scale-95 transition-all disabled:opacity-70"
              >
                {isAnalyzing ? (
                  <><Loader2 className="w-5 h-5 animate-spin" />Analyse en cours...</>
                ) : (
                  <><Sparkles className="w-5 h-5" />Obtenir mes recommandations</>
                )}
              </button>
              <p className="text-xs text-gray-300 mt-3">Google Gemini · Gratuit · Sans backend</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Domain */}
              <div className="bg-emerald-500 rounded-2xl p-5 text-white">
                <p className="text-emerald-100 text-xs font-medium mb-1 uppercase tracking-wider">Domaine recommandé</p>
                <h3 className="text-xl font-bold">{recommendations.domainePrincipal}</h3>
              </div>

              {/* Filières */}
              {recommendations.filieres?.map((filiere: any, idx: number) => (
                <div key={idx} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700">{filiere.univ}</span>
                        <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-gray-100 text-gray-500">{filiere.duree}</span>
                      </div>
                      <h4 className="font-bold text-gray-900 text-base">{filiere.nom}</h4>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <span className="text-emerald-600 font-bold text-sm">{idx + 1}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">{filiere.pourquoi}</p>
                </div>
              ))}

              {/* Conseils */}
              {recommendations.conseils && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-orange-500" />
                    <span className="font-bold text-gray-900 text-sm">Conseils pour Madagascar</span>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-wrap">{recommendations.conseils}</p>
                </div>
              )}

              <button
                onClick={() => setRecommendations(null)}
                className="w-full py-3 rounded-xl border-2 border-gray-100 text-gray-400 text-sm font-medium flex items-center justify-center gap-2 active:bg-gray-50 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />Relancer l'analyse
              </button>
            </div>
          )}

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleExport}
              className="py-3 rounded-xl border-2 border-gray-100 text-gray-500 text-sm font-medium flex items-center justify-center gap-2 active:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />Exporter
            </button>
            <button
              onClick={handleRestart}
              className="py-3 rounded-xl border-2 border-gray-100 text-gray-500 text-sm font-medium flex items-center justify-center gap-2 active:bg-gray-50 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />Recommencer
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── QUIZ SCREEN ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Progress bar at top */}
      <div className="h-1 w-full bg-gray-100">
        <div
          className="h-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%`, backgroundColor: currentColor }}
        />
      </div>

      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-5 py-6">
        {/* Header with Home button */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ backgroundColor: `${currentColor}12` }}>
            <span style={{ color: currentColor }}>{partieIcons[currentQuestion.partie]}</span>
            <span className="text-xs font-semibold" style={{ color: currentColor }}>{currentQuestion.partie}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-300 font-medium">
              {currentIndex + 1} / {questions.length}
            </span>
            <button
              onClick={handleGoHome}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-300 active:bg-gray-50 transition-all"
              title="Retour à l'accueil"
            >
              <Home className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Question */}
        <div className="flex-1">
          <h2 className="text-lg font-bold text-gray-900 leading-snug mb-6">
            {currentQuestion.question}
          </h2>

          {renderQuestionInput(currentQuestion)}
        </div>

        {/* Navigation */}
        <div className="pt-6 space-y-4">
          {/* Dots */}
          <div className="flex justify-center gap-1.5">
            {questions.map((q, idx) => {
              const isCurrent = idx === currentIndex;
              const isAnswered = !!answers[q.id];
              return (
                <button
                  key={q.id}
                  onClick={() => idx <= currentIndex && setCurrentIndex(idx)}
                  disabled={idx > currentIndex}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: isCurrent ? 20 : 6,
                    height: 6,
                    backgroundColor: isCurrent
                      ? currentColor
                      : isAnswered
                      ? `${partieHexColors[q.partie]}60`
                      : '#e5e7eb',
                  }}
                />
              );
            })}
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="w-12 h-12 rounded-xl border-2 border-gray-400 flex items-center justify-center text-gray-500 disabled:opacity-30 active:bg-gray-50 transition-colors flex-shrink-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={handleNext}
              disabled={!answers[currentQuestion.id]}
              className="flex-1 h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 text-white shadow-lg active:scale-95 transition-all disabled:opacity-30 disabled:shadow-none"
              style={{ backgroundColor: currentColor, boxShadow: `0 8px 24px ${currentColor}30` }}
            >
              {currentIndex === questions.length - 1 ? (
                <>Terminer <CheckCircle2 className="w-4 h-4" /></>
              ) : (
                <>Suivant <ChevronRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;