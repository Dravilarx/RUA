import { Student, Teacher, Subject, Grade, ActivityLog, Anotacion, CalendarEvent, NewsArticle, GradeReport } from './types';

// Placeholder base64 images for demonstration
const placeholderUserLight = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2E1YjRjYyIgc3Ryb2tlLXdpZHRoPSIxIiBzdHJva2UtbGluZWNhcD0icm9ybmQiIHN0cm9rZS1saWW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik01IDE3djItLTJhMiAyIDAgMCAwLTIgMmgyYTQgNCAwIDAgMCA0LTRIOWE0IDQgMCAwIDAgNC00aC0yYTIgMiAwIDAgMC0yIDJ6Ii8+PHBhdGggZD0iTTUgN2EyIDIgMCAwIDEgMi0yaDJhMiAyIDAgMCAxIDIgMnYyYTIgMiAwIDAgMS0yIDJoLTJhMiAyIDAgMCAxLTItMnoiLz48L3N2Zz4=';
const placeholderUserDark = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzQ3NTU2OSIgc3Ryb2tlLXdpZHRoPSIxIiBzdHJva2UtbGluZWNhcD0icm9ybmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik01IDE3djItLTJhMiAyIDAgMCAwLTIgMmgyYTQgNCAwIDAgMCA0LTRIOWE0IDQgMCAwIDAgNC00aC0yYTIgMiAwIDAgMC0yIDJ6Ii8+PHBhdGggZD0iTTUgN2EyIDIgMCAwIDEgMi0yaDJhMiAyIDAgMCAxIDIgMnYyYTIgMiAwIDAgMS0yIDJoLTJhMiAyIDAgMCAxLTItMnoiLz48L3N2Zz4=';
const placeholderNewsImage = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';


export const initialStudents: Student[] = [
  { id: 1, name: 'Ana', lastName: 'González', rut: '19.123.456-7', email: 'ana.gonzalez@email.com', photo: placeholderUserLight, admissionYear: 2022, phone: '+56912345678', undergradUniversity: 'Universidad de Chile', nationality: 'Chilena', birthDate: '1998-03-15' },
  { id: 2, name: 'Luis', lastName: 'Martínez', rut: '20.987.654-3', email: 'luis.martinez@email.com', photo: placeholderUserDark, admissionYear: 2023, phone: '+56987654321', undergradUniversity: 'P. Universidad Católica', nationality: 'Chilena', birthDate: '1999-11-20' },
  { id: 3, name: 'Carla', lastName: 'Soto', rut: '21.456.789-K', email: 'carla.soto@email.com', photo: placeholderUserLight, admissionYear: 2024, phone: '+56911223344', undergradUniversity: 'Universidad de Concepción', nationality: 'Chilena', birthDate: '2000-07-01' },
];

export const initialTeachers: Teacher[] = [
  { id: 1, name: 'Ricardo', lastName: 'Pérez', rut: '12.345.678-9', photo: placeholderUserDark, admissionYear: 2010, teacherType: 'Planta', postgradUniversity: 'Stanford University', email: 'ricardo.perez@grua.cl', phone: '+56955667788', birthDate: '1975-05-10' },
  { id: 2, name: 'Mónica', lastName: 'Herrera', rut: '14.876.543-2', photo: placeholderUserLight, admissionYear: 2015, teacherType: 'Colaborador', postgradUniversity: 'Harvard University', email: 'monica.herrera@grua.cl', phone: '+56933445566', birthDate: '1982-09-25' },
];

export const initialSubjects: Subject[] = [
    { id: 1, name: 'Anatomía Radiológica', code: 'RAD-101', teacherId: 1, credits: 10, semester: 1, description: 'Estudio detallado de la anatomía humana a través de imágenes radiológicas.' },
    { id: 2, name: 'Física de Radiaciones', code: 'RAD-102', teacherId: 2, credits: 8, semester: 1, description: 'Principios físicos de la radiación y su aplicación en el diagnóstico por imágenes.' },
    { id: 3, name: 'Procedimientos Especiales', code: 'RAD-201', teacherId: 1, credits: 12, semester: 3, description: 'Técnicas y protocolos para procedimientos radiológicos avanzados e intervencionistas.' },
];

export const initialGrades: Grade[] = [
  { id: 1, studentId: 1, subjectId: 1, grade1: 6.5, grade2: 6.1, grade3: 5.5, competencyScores: [7, 6, 5, 7, 6, 6, 5, 7], lastModified: '2024-05-10T10:00:00Z', isFinalized: true },
  { id: 2, studentId: 1, subjectId: 2, grade1: 5.8, grade2: 6.0, grade3: 6.0, competencyScores: [6, 6, 6, 6, 6, 6, 6, 6], lastModified: '2024-05-11T11:30:00Z', isFinalized: false },
  { id: 3, studentId: 2, subjectId: 1, grade1: 7.0, grade2: 7.0, grade3: 7.0, competencyScores: [7, 7, 7, 7, 7, 7, 7, 7], lastModified: '2024-05-12T09:00:00Z', isFinalized: true },
  { id: 4, studentId: 3, subjectId: 3, grade1: 3.9, grade2: 3.8, grade3: 3.5, competencyScores: [4, 4, 3, 4, 4, 3, 4, 5], lastModified: '2024-05-13T14:00:00Z', isFinalized: false },
  { id: 5, studentId: 2, subjectId: 2, grade1: 6.2, grade2: 6.3, competencyScores: [7, 6, 6, 7, 6, 6, 6, 6], lastModified: '2024-05-14T16:00:00Z', isFinalized: false },
];

export const initialGradeReports: GradeReport[] = [
    {
        id: 1,
        gradeId: 1,
        studentId: 1,
        subjectId: 1,
        teacherId: 1,
        generationDate: new Date('2024-05-10T10:05:00Z'),
        gradeSummary: { grade1: 6.5, grade2: 6.1, grade3: 5.5, finalGrade: 6.2 },
        competencyScores: [7, 6, 5, 7, 6, 6, 5, 7],
        feedback: "Ana demostró una sólida comprensión de la anatomía en las imágenes de TC y RM. Su desempeño en la prueba teórica fue notable. Se sugiere continuar reforzando la identificación de variantes anatómicas menos comunes. Excelente progreso durante la rotación.",
        status: 'Pendiente Aceptación',
        signatureDate: new Date('2024-05-11T09:00:00Z'),
    },
    {
        id: 2,
        gradeId: 3,
        studentId: 2,
        subjectId: 1,
        teacherId: 1,
        generationDate: new Date('2024-05-14T16:05:00Z'),
        gradeSummary: { grade1: 7.0, grade2: 7.0, grade3: 7.0, finalGrade: 7.0 },
        competencyScores: [7, 7, 7, 7, 7, 7, 7, 7],
        feedback: "Luis ha mostrado un dominio excepcional en todos los aspectos de la anatomía radiológica. Su juicio clínico es impecable y su capacidad de autoaprendizaje es un ejemplo para sus pares. Felicitaciones por un desempeño sobresaliente.",
        status: 'Completado',
        signatureDate: new Date('2024-05-15T11:00:00Z'),
        studentAcceptanceDate: new Date('2024-05-16T15:00:00Z'),
    }
];

export const initialActivityLog: ActivityLog[] = [
    { id: 1, timestamp: new Date(Date.now() - 3600000), description: 'Calificaciones para Anatomía Radiológica han sido publicadas.' },
    { id: 2, timestamp: new Date(Date.now() - 10800000), description: 'El docente Mónica Herrera actualizó su perfil.' },
    { id: 3, timestamp: new Date(Date.now() - 86400000), description: 'Nuevo alumno Carla Soto ha sido agregada.' },
];

export const initialAnotaciones: Anotacion[] = [
  { id: 1, studentId: 1, autorId: 1, timestamp: new Date('2024-03-15T09:00:00Z'), type: 'Positiva', text: 'Demostró excelente iniciativa durante la rotación de Radiología Pediátrica, mostrando gran interés y capacidad para aprender.' },
  { id: 2, studentId: 1, autorId: 2, timestamp: new Date('2024-04-22T14:30:00Z'), type: 'Observación', text: 'Se recomienda repasar los protocolos de contraste para tomografía computarizada, específicamente en pacientes con insuficiencia renal.' },
  { id: 3, studentId: 2, autorId: 1, timestamp: new Date('2024-05-10T11:00:00Z'), type: 'Positiva', text: 'Excelente presentación de caso clínico sobre patologías intersticiales pulmonares. Demostró dominio del tema y claridad en la exposición.' },
  { id: 4, studentId: 3, autorId: 2, timestamp: new Date('2024-05-18T16:00:00Z'), type: 'Negativa', text: 'Llegada tardía a la reunión clínica del día de hoy sin justificación previa.' },
];

const today = new Date();
const getNextDate = (day: number, monthOffset = 0) => {
    const date = new Date();
    date.setMonth(date.getMonth() + monthOffset);
    date.setDate(day);
    return date;
};

export const initialCalendarEvents: CalendarEvent[] = [
    { id: 1, title: 'Examen Final - Anatomía Radiológica', start: getNextDate(28), end: getNextDate(28), type: 'Examen' },
    { id: 2, title: 'Feriado: Día Nacional de los Pueblos Indígenas', start: new Date('2024-06-20T00:00:00'), end: new Date('2024-06-20T23:59:59'), type: 'Feriado' },
    { id: 3, title: 'Clase Magistral: "Avances en Resonancia Magnética"', start: getNextDate(15, 1), end: getNextDate(15, 1), type: 'Clase' },
    { id: 4, title: 'Congreso Chileno de Radiología', start: getNextDate(5, 2), end: getNextDate(7, 2), type: 'Evento' },
    { id: 5, title: 'Inicio Período de Vacaciones', start: getNextDate(15, 2), end: getNextDate(28, 2), type: 'Evento' },
];

export const initialNewsArticles: NewsArticle[] = [
  { 
    id: 1, 
    title: 'Proceso de Acreditación 2024', 
    content: 'Se informa a toda la comunidad académica que ha comenzado el proceso de autoevaluación con miras a la acreditación del programa para el período 2025-2029. Se invita a todos los estamentos a participar activamente en las reuniones y encuestas que se realizarán durante los próximos meses. Su participación es fundamental para el éxito de este proceso.', 
    author: 'Dirección de Postgrado', 
    date: new Date(Date.now() - 86400000 * 2), 
    imageUrl: 'https://images.unsplash.com/photo-1581092580424-3a213694157c?q=80&w=2070&auto=format&fit=crop&ixlib-rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
  },
  { 
    id: 2, 
    title: 'Nueva Alianza con Hospital Clínico', 
    content: 'Nos complace anunciar una nueva alianza estratégica con el Hospital Clínico Metropolitano, que permitirá a nuestros residentes acceder a rotaciones en unidades de alta especialización, incluyendo neurorradiología intervencionista y radiología mamaria avanzada. Esta colaboración fortalecerá la formación práctica y la exposición a casos complejos.', 
    author: 'Coordinación Académica', 
    date: new Date(Date.now() - 86400000 * 5), 
    imageUrl: 'https://images.unsplash.com/photo-1612534948600-b1d53bfc73a6?q=80&w=1974&auto=format&fit=crop&ixlib-rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
  },
  { 
    id: 3, 
    title: 'Seminario Internacional de Física Médica', 
    content: 'El próximo mes se llevará a cabo el Seminario Internacional de Física Médica en nuestro auditorio principal. Contaremos con la presencia de expositores de renombre mundial que discutirán los últimos avances en dosimetría, protección radiológica y control de calidad en imagenología. Las inscripciones ya están abiertas para toda la comunidad universitaria.', 
    author: 'Dr. Ricardo Pérez', 
    date: new Date(Date.now() - 86400000 * 10),
    imageUrl: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?q=80&w=2070&auto=format&fit=crop&ixlib-rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
  }
];