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

export interface GradeReport {
  id: number;
  gradeId: number;
  studentId: number;
  subjectId: number;
  teacherId?: number;
  generationDate: Date;
  gradeSummary: {
    grade1?: number;
    grade2?: number;
    grade3?: number;
    finalGrade: number;
  };
  competencyScores: (number | null)[];
  feedback: string;
  status: 'Pendiente Aceptación' | 'Completado';
  signatureDate?: Date;
  studentAcceptanceDate?: Date;
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
  streamingLink?: string;
}

export interface NewsArticle {
  id: number;
  title: string;
  content: string;
  author: string;
  date: Date;
  imageUrl?: string;
  attachments?: { name: string; url: string; type: string }[];
}

export interface OfficialDocument {
  id: number;
  title: string;
  description: string;
  uploadDate: Date;
  author: string;
  file: { name: string; url: string; type: string };
}

export interface MeetingRecord {
  id: number;
  title: string;
  date: Date;
  startTime: string;
  endTime: string;
  details: string;
  attendees: {
    teachers: number[];
    students: number[];
    externals: string[];
  };
  streamingLink?: string;
}

// --- Student Professional Activity Types ---

export type ActivityType = 'Congreso' | 'Publicación' | 'Presentación' | 'Vinculación' | 'Rotación' | 'Otro';

interface BaseActivity {
  id: number;
  studentId: number;
  type: ActivityType;
  title: string;
  date: Date;
}

export interface CongressActivity extends BaseActivity {
  type: 'Congreso';
  location: string;
  participationType: 'Asistente' | 'Póster' | 'Presentación Oral';
}

export interface PublicationActivity extends BaseActivity {
  type: 'Publicación';
  journal: string;
  doiLink?: string;
}

export interface PresentationActivity extends BaseActivity {
    type: 'Presentación';
    eventName: string;
    location: string;
}

export interface EngagementActivity extends BaseActivity {
    type: 'Vinculación';
    description: string;
    hours: number;
}

export interface RotationActivity extends BaseActivity {
    type: 'Rotación';
    institution: string;
    supervisor: string;
    endDate: Date;
}

export interface OtherMeritActivity extends BaseActivity {
    type: 'Otro';
    description: string;
}

export type ProfessionalActivity = 
    | CongressActivity 
    | PublicationActivity 
    | PresentationActivity
    | EngagementActivity
    | RotationActivity
    | OtherMeritActivity;

// --- Teacher Professional Activity Types ---

export type TeacherActivityType = 'Congreso' | 'Publicación' | 'Presentación' | 'Investigación' | 'Docencia' | 'Otro';

interface BaseTeacherActivity {
  id: number;
  teacherId: number;
  type: TeacherActivityType;
  title: string;
  date: Date;
}

export interface TeacherCongressActivity extends BaseTeacherActivity {
  type: 'Congreso';
  location: string;
  participationType: 'Asistente' | 'Expositor' | 'Organizador';
}

export interface TeacherPublicationActivity extends BaseTeacherActivity {
  type: 'Publicación';
  journal: string;
  doiLink?: string;
}

export interface TeacherPresentationActivity extends BaseTeacherActivity {
    type: 'Presentación';
    eventName: string;
    location: string;
}

export interface TeacherResearchActivity extends BaseTeacherActivity {
    type: 'Investigación';
    project: string;
    role: string;
}

export interface TeacherTeachingActivity extends BaseTeacherActivity {
    type: 'Docencia';
    course: string;
    institution: string;
}

export interface TeacherOtherMeritActivity extends BaseTeacherActivity {
    type: 'Otro';
    description: string;
}

export type TeacherProfessionalActivity = 
    | TeacherCongressActivity 
    | TeacherPublicationActivity 
    | TeacherPresentationActivity
    | TeacherResearchActivity
    | TeacherTeachingActivity
    | TeacherOtherMeritActivity;


// --- Personal Document Type ---

export interface PersonalDocument {
  id: number;
  ownerId: number;
  ownerType: 'student' | 'teacher';
  title: string;
  description: string;
  uploadDate: Date;
  file: { name: string; url: string; type: string };
}
