import { useTranslation } from 'react-i18next';
import { quizData } from '@/data/quizData';
import type { QuizData, Question } from '@/types/quiz';

export function useTranslatedQuizData(): QuizData {
  const { t } = useTranslation();

  const translatedQuestions: Question[] = quizData.questions.map((q) => ({
    ...q,
    question: t(`quizData.questions.${q.id}`),
    options: q.options
      ? q.options.map((_, idx) => t(`quizData.options.q${q.id}.${idx}`))
      : undefined,
  }));

  return {
    ...quizData,
    titre: t('quizData.title'),
    questions: translatedQuestions,
  };
}
