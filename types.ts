export interface Student {
  id: number;
  name: string;
  lastName: string;
  rut: string;
  email: string;
  photo?: string;
  admissionYear: number;
  phone: string;
  undergradUniversity: string;
  nationality: string;
  birthDate: string;
}

export interface Teacher {
  id: number;
  name: string;
  lastName: string;
  rut: string;
  photo?: string;
  admissionYear: number;
  teacherType: 'Planta' | 'Colaborador' | 'Adjunto';
  postgradUniversity: string;
  email: string;
  phone: string;
  birthDate: string;
}

export interface Subject {
    id: number;
    name: string;
    code: string;
    teacherId?: number;
    credits: number;
    semester: number;
    description: string;
}

export interface Grade {
  id: number;
  studentId: number;
  subjectId: number;
  grade1?: number;
  grade2?: number;
  grade3?: number;
  competencyScores?: (number | null)[];
  lastModified: string;
  isFinalized: boolean;
}

export interface ActivityLog {
  id: number;
  timestamp: Date;
  description: string;
}

export interface Anotacion {
  id: number;
  studentId: number;
  autorId: number; // teacherId
  timestamp: Date;
  type: 'Positiva' | 'Negativa' | 'Observación';
  text: string;
}

export interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  type: 'Examen' | 'Clase' | 'Feriado' | 'Evento';
}

export interface NewsArticle {
  id: number;
  title: string;
  content: string;
  author: string;
  date: Date;
  imageUrl?: string;
}
