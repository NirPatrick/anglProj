export type QuestionType = 'choix_unique' | 'choix_multiple' | 'texte' | 'echelle';

export interface Question {
  id: number;
  partie: string;
  question: string;
  type: QuestionType;
  options?: string[];
  max_choix?: number;
  min?: number;
  max?: number;
  labels?: string[];
  conditionnel?: boolean;
  depend_de?: number;
}

export interface QuizData {
  titre: string;
  nombre_questions: number;
  questions: Question[];
}

export type AnswerValue = string | string[] | number;

export interface Answer {
  questionId: number;
  value: AnswerValue;
}

export interface QuizState {
  currentQuestionIndex: number;
  answers: Record<number, AnswerValue>;
  isCompleted: boolean;
}
