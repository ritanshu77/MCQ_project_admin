export interface BilingualText {
  en: string;
  hi: string;
}

export interface Option {
  text: BilingualText;
  key: string; // 'A', 'B', 'C', 'D', 'E'
}

export interface Question {
  _id: string;
  questionText: BilingualText;
  options: Option[];
  correctOptionKey: string;
  explanation?: BilingualText;
  subjectId?: string;
  unitId?: string;
  chapterId?: string;
  subjectName?: string;
  unitName?: string;
  chapterName?: string;
  difficulty: string;
  questionNumber: number;
  status: string;
}

export interface Subject {
  subjectId: string;
  nameEn: string;
  nameHi: string;
}

export interface Unit {
  unitId: string;
  name: BilingualText;
  chapters: Chapter[];
}

export interface Chapter {
  _id: string;
  name: BilingualText;
}

export const initialFormState = {
  questionNumber: 1,
  questionText: { en: '', hi: '' },
  options: [
    { text: { en: '', hi: '' }, key: 'A' },
    { text: { en: '', hi: '' }, key: 'B' },
    { text: { en: '', hi: '' }, key: 'C' },
    { text: { en: '', hi: '' }, key: 'D' },
  ],
  correctOptionKey: 'A',
  explanation: { en: '', hi: '' },
  subjectId: '',
  unitId: '',
  chapterId: '',
  difficulty: 'medium',
  status: 'active'
};
