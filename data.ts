import { Student, Teacher, Subject, Grade, ActivityLog, Anotacion, CalendarEvent, NewsArticle, GradeReport, OfficialDocument, MeetingRecord, ProfessionalActivity, TeacherProfessionalActivity, PersonalDocument, SiteLog, QuickLink, Survey, User } from './types';

// Placeholder base64 images for demonstration
const placeholderUserLight = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2E1YjRjYyIgc3Ryb2tlLXdpZHRoPSIxIiBzdHJva2UtbGluZWNhcD0icm9ybmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik01IDE3djItLTJhMiAyIDAgMCAwLTIgMmgyYTQgNCAwIDAgMCA0LTRIOWE0IDQgMCAwIDAgNC00aC0yYTIgMiAwIDAgMC0yIDJ6Ii8+PHBhdGggZD0iTTUgN2EyIDIgMCAwIDEgMi0yaDJhMiAyIDAgMCAxIDIgMnYyYTIgMiAwIDAgMS0yIDJoLTJhMiAyIDAgMCAxLTItMnoiLz48L3N2Zz4=';
const placeholderUserDark = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzQ3NTU2OSIgc3Ryb2tlLXdpZHRoPSIxIiBzdHJva2UtbGluZWNhcD0icm9ybmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik01IDE3djItLTJhMiAyIDAgMCAwLTIgMmgyYTQgNCAwIDAgMCA0LTRIOWE0IDQgMCAwIDAgNC00aC0yYTIgMiAwIDAgMC0yIDJ6Ii8+PHBhdGggZD0iTTUgN2EyIDIgMCAwIDEgMi0yaDJhMiAyIDAgMCAxIDIgMnYyYTIgMiAwIDAgMS0yIDJoLTJhMiAyIDAgMCAxLTItMnoiLz48L3N2Zz4=';
const placeholderNewsImage = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';


export const initialStudents: Student[] = [
  { id: 1, name: 'Ana', lastName: 'González', rut: '19.123.456-7', email: 'ana.gonzalez@email.com', photo: placeholderUserLight, admissionDate: '2022-03-01', phone: '+56912345678', undergradUniversity: 'Universidad de Chile', nationality: 'Chilena', birthDate: '1998-03-15' },
  { id: 2, name: 'Luis', lastName: 'Martínez', rut: '20.987.654-3', email: 'luis.martinez@email.com', photo: placeholderUserDark, admissionDate: '2023-03-01', phone: '+56987654321', undergradUniversity: 'P. Universidad Católica', nationality: 'Chilena', birthDate: '1999-11-20' },
  { id: 3, name: 'Carla', lastName: 'Soto', rut: '21.456.789-K', email: 'carla.soto@email.com', photo: placeholderUserLight, admissionDate: '2024-03-01', phone: '+56911223344', undergradUniversity: 'Universidad de Concepción', nationality: 'Chilena', birthDate: '2000-07-01' },
  { id: 4, name: 'Diego', lastName: 'Rojas', rut: '19.888.777-6', email: 'diego.rojas@email.com', photo: placeholderUserDark, admissionDate: '2022-03-01', phone: '+56922334455', undergradUniversity: 'Universidad de Valparaíso', nationality: 'Chilena', birthDate: '1997-08-22' },
  { id: 5, name: 'Valentina', lastName: 'Flores', rut: '20.555.444-1', email: 'valentina.flores@email.com', photo: placeholderUserLight, admissionDate: '2023-03-01', phone: '+56933445566', undergradUniversity: 'Universidad Austral de Chile', nationality: 'Chilena', birthDate: '1999-01-30' },
];

export const initialTeachers: Teacher[] = [
  { id: 1, name: 'Ricardo', lastName: 'Pérez', rut: '12.345.678-9', photo: placeholderUserDark, admissionDate: '2010-03-01', contractType: 'Planta', academicRank: 'Titular', postgradUniversity: 'Stanford University', email: 'ricardo.perez@grua.cl', phone: '+56955667788', birthDate: '1975-05-10' },
  { id: 2, name: 'Mónica', lastName: 'Herrera', rut: '14.876.543-2', photo: placeholderUserLight, admissionDate: '2015-03-15', contractType: 'Honorarios', academicRank: 'Adjunto', postgradUniversity: 'Harvard University', email: 'monica.herrera@grua.cl', phone: '+56933445566', birthDate: '1982-09-25' },
  { id: 3, name: 'Carolina', lastName: 'Lagos', rut: '15.111.222-3', photo: placeholderUserLight, admissionDate: '2018-08-01', contractType: 'Planta', academicRank: 'Adjunto', postgradUniversity: 'Universidad de Chile', email: 'carolina.lagos@grua.cl', phone: '+56944556677', birthDate: '1985-12-05' },
];

export const initialSubjects: Subject[] = [
    { id: 1, name: 'Anatomía Radiológica', code: 'RAD-101', teacherId: 1, credits: 10, semester: 1, description: 'Estudio detallado de la anatomía humana a través de imágenes radiológicas.' },
    { id: 2, name: 'Física de Radiaciones', code: 'RAD-102', teacherId: 2, credits: 8, semester: 1, description: 'Principios físicos de la radiación y su aplicación en el diagnóstico por imágenes.' },
    { id: 3, name: 'Procedimientos Especiales', code: 'RAD-201', teacherId: 1, credits: 12, semester: 3, description: 'Técnicas y protocolos para procedimientos radiológicos avanzados e intervencionistas.' },
    { id: 4, name: 'Neurorradiología', code: 'RAD-301', teacherId: 3, credits: 15, semester: 5, description: 'Diagnóstico por imágenes de patologías del sistema nervioso central.' },
    { id: 5, name: 'Radiología Pediátrica', code: 'RAD-302', teacherId: 2, credits: 10, semester: 5, description: 'Particularidades del diagnóstico por imágenes en la población pediátrica.' },
    { id: 6, name: 'Protección Radiológica', code: 'RAD-103', teacherId: 1, credits: 6, semester: 2, description: 'Fundamentos de la protección radiológica para pacientes y personal.' },
];

export const initialGrades: Grade[] = [
  { id: 1, studentId: 1, subjectId: 1, grade1: 6.5, grade2: 6.1, grade3: 5.5, competencyScores: [7, 6, 5, 7, 6, 6, 5, 7], lastModified: '2024-05-10T10:00:00Z', isFinalized: true },
  { id: 2, studentId: 1, subjectId: 2, grade1: 5.8, grade2: 6.0, grade3: 6.0, competencyScores: [6, 6, 6, 6, 6, 6, 6, 6], lastModified: '2024-05-11T11:30:00Z', isFinalized: false },
  { id: 3, studentId: 2, subjectId: 1, grade1: 7.0, grade2: 7.0, grade3: 7.0, competencyScores: [7, 7, 7, 7, 7, 7, 7, 7], lastModified: '2024-05-12T09:00:00Z', isFinalized: true },
  { id: 4, studentId: 3, subjectId: 3, grade1: 3.9, grade2: 3.8, grade3: 3.5, competencyScores: [4, 4, 3, 4, 4, 3, 4, 5], lastModified: '2024-05-13T14:00:00Z', isFinalized: false },
  { id: 5, studentId: 2, subjectId: 2, grade1: 6.2, grade2: 6.3, competencyScores: [7, 6, 6, 7, 6, 6, 6, 6], lastModified: '2024-05-14T16:00:00Z', isFinalized: false },
  { id: 6, studentId: 4, subjectId: 4, grade1: 6.8, grade2: 6.5, grade3: 7.0, competencyScores: [7, 7, 6, 7, 6, 7, 7, 7], lastModified: '2024-05-15T10:00:00Z', isFinalized: true },
  { id: 7, studentId: 5, subjectId: 5, grade1: 6.0, grade2: 5.5, competencyScores: [6, 6, 5, 6, 6, 5, 6, 6], lastModified: '2024-05-16T12:00:00Z', isFinalized: false },
  { id: 8, studentId: 1, subjectId: 3, competencyScores: [], lastModified: '2024-05-17T09:00:00Z', isFinalized: false },
  { id: 9, studentId: 3, subjectId: 1, grade1: 5.0, competencyScores: [5, 5, 5, 5, 5, 5, 5, 5], lastModified: '2024-05-18T15:00:00Z', isFinalized: false },
  { id: 10, studentId: 4, subjectId: 6, grade1: 6.9, grade2: 7.0, grade3: 6.8, competencyScores: [7, 7, 7, 7, 7, 7, 7, 7], lastModified: '2024-05-19T11:00:00Z', isFinalized: true },
  { id: 11, studentId: 5, subjectId: 2, grade1: 5.5, grade2: 5.8, competencyScores: [6, 5, 6, 5, 6, 6, 5, 6], lastModified: '2024-05-20T10:00:00Z', isFinalized: false },
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
    },
    {
        id: 3,
        gradeId: 6,
        studentId: 4,
        subjectId: 4,
        teacherId: 3,
        generationDate: new Date('2024-05-15T10:05:00Z'),
        gradeSummary: { grade1: 6.8, grade2: 6.5, grade3: 7.0, finalGrade: 6.7 },
        competencyScores: [7, 7, 6, 7, 6, 7, 7, 7],
        feedback: "Diego tiene una excelente capacidad para interpretar estudios complejos de neurorradiología. Su presentación de caso fue clara y concisa. Debe seguir trabajando en la velocidad de informe.",
        status: 'Pendiente Aceptación',
        signatureDate: new Date('2024-05-16T09:00:00Z'),
    }
];

export const initialActivityLog: ActivityLog[] = [
    { id: 1, timestamp: new Date(Date.now() - 3600000), description: 'Calificaciones para Anatomía Radiológica han sido publicadas.' },
    { id: 2, timestamp: new Date(Date.now() - 10800000), description: 'El docente Mónica Herrera actualizó su perfil.' },
    { id: 3, timestamp: new Date(Date.now() - 86400000), description: 'Nuevo alumno Carla Soto ha sido agregada.' },
    { id: 4, timestamp: new Date(Date.now() - 86400000 * 2), description: 'Informe de notas para Diego Rojas ha sido generado.' },
    { id: 5, timestamp: new Date(Date.now() - 86400000 * 3), description: 'Nueva asignatura "Neurorradiología" ha sido creada.' },
];

export const initialSiteLog: SiteLog[] = [];

export const initialAnotaciones: Anotacion[] = [
  { id: 1, studentId: 1, autorId: 1, timestamp: new Date('2024-03-15T09:00:00Z'), type: 'Positiva', text: 'Demostró excelente iniciativa durante la rotación de Radiología Pediátrica, mostrando gran interés y capacidad para aprender.' },
  { id: 2, studentId: 1, autorId: 2, timestamp: new Date('2024-04-22T14:30:00Z'), type: 'Observación', text: 'Se recomienda repasar los protocolos de contraste para tomografía computarizada, específicamente en pacientes con insuficiencia renal.' },
  { id: 3, studentId: 2, autorId: 1, timestamp: new Date('2024-05-10T11:00:00Z'), type: 'Positiva', text: 'Excelente presentación de caso clínico sobre patologías intersticiales pulmonares. Demostró dominio del tema y claridad en la exposición.' },
  { id: 4, studentId: 3, autorId: 2, timestamp: new Date('2024-05-18T16:00:00Z'), type: 'Negativa', text: 'Llegada tardía a la reunión clínica del día de hoy sin justificación previa.' },
  { id: 5, studentId: 4, autorId: 3, timestamp: new Date('2024-04-10T10:00:00Z'), type: 'Positiva', text: 'Participación proactiva en la discusión de casos clínicos complejos, aportando bibliografía relevante.' },
  { id: 6, studentId: 5, autorId: 2, timestamp: new Date('2024-05-05T15:00:00Z'), type: 'Observación', text: 'Mejorar la técnica de comunicación con pacientes pediátricos para reducir la necesidad de sedación.' },
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
    { id: 3, title: 'Clase Magistral: "Avances en Resonancia Magnética"', start: getNextDate(15, 1), end: getNextDate(15, 1), type: 'Clase', streamingLink: 'https://meet.example.com/clase-magistral' },
    { id: 4, title: 'Congreso Chileno de Radiología', start: getNextDate(5, 2), end: getNextDate(7, 2), type: 'Evento' },
    { id: 5, title: 'Inicio Período de Vacaciones', start: getNextDate(15, 2), end: getNextDate(28, 2), type: 'Evento' },
    { id: 6, title: 'Revisión de Portafolios R1', start: getNextDate(10), end: getNextDate(10), type: 'Evento' },
    { id: 7, title: 'Examen Teórico - Física de Radiaciones', start: getNextDate(22), end: getNextDate(22), type: 'Examen' },
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
    imageUrl: 'https://images.unsplash.com/photo-1612534948600-b1d53bfc73a6?q=80&w=1974&auto=format&fit=crop&ixlib-rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    link: 'https://www.hospital-clinico.cl',
    linkText: 'Leer más en el sitio del Hospital'
  },
  { 
    id: 3, 
    title: 'Seminario Internacional de Física Médica', 
    content: 'El próximo mes se llevará a cabo el Seminario Internacional de Física Médica en nuestro auditorio principal. Contaremos con la presencia de expositores de renombre mundial que discutirán los últimos avances en dosimetría, protección radiológica y control de calidad en imagenología. Las inscripciones ya están abiertas para toda la comunidad universitaria.', 
    author: 'Dr. Ricardo Pérez', 
    date: new Date(Date.now() - 86400000 * 10),
    imageUrl: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
  },
  {
    id: 4,
    title: 'Resultados Beca de Investigación 2024',
    content: 'Se han publicado los resultados de la Beca de Investigación para Residentes 2024. Felicitamos a la Dra. Ana González por adjudicarse el fondo con su proyecto "Inteligencia Artificial para la detección precoz de metástasis hepáticas". Agradecemos a todos los postulantes por su excelente participación.',
    author: 'Comité de Investigación',
    date: new Date(Date.now() - 86400000 * 15),
    imageUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?q=80&w=2070&auto=format&fit=crop&ixlib-rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
  }
];

export const initialOfficialDocuments: OfficialDocument[] = [
  {
    id: 1,
    title: 'Reglamento General de Postgrado',
    description: 'Versión actualizada del reglamento que rige a todos los programas de postgrado de la universidad.',
    uploadDate: new Date('2024-03-01T10:00:00Z'),
    author: 'Dirección de Postgrado',
    file: { name: 'Reglamento_Postgrado_2024.pdf', url: 'data:application/pdf;base64,JVBERi0xLjcKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFIvTGFuZyhlcy1DTClgPj4KZW5kb2JqCjIgMCBvYmoKPDwvVHlwZS9QYWdlcy9Db3VudCAxL0tpZHNbMyAwIFJdPj4KZW5kb2JqCjMgMCBvYmoKPDwvVHlwZS9QYWdlL1BhcmVudCAyIDAgUi9SZXNvdXJjZXM8PC9Gb250PDwvRjEgNSAwIFI+Pj4+L01lZGlhQm94WzAgMCA1OTUgODQyXS9Db250ZW50cyA0IDAgUi9Hcm91cDw8L1R5cGUvR3JvdXAvUy9UcmFuc3BhcmVuY3kvQ1MvRGV2aWNlUkdCPj4vVGFicy9TPj4KZW5kb2JqCjQgMCBvYmoKPDwvRmlsdGVyL0ZsYXRlRGVjb2RlL0xlbmd0aCA4Nj4+CnN0cmVhbQp4nE2NQQrCMBBF95JgMNiAIOJd6gM8g2fQI7hQ4l5c6E08gYfQo1t0V8e9/5v8M1/MHEw5BwzD4C4Yl5/Ax47rJpBGNjFzFcMKUXgQkb0mKl8oT+nUuGlJGksr8d9o3rXbFqW3J+llx/gV4dM13t5FzD2rF6tFC4MlLmwuuI3+3t9s2xMwcA+L0aTd+k/s2Yl0pS4T2l57Ydcr+my5lOAkXKvH4GvCEQo5HBCfKGO8N8AYaHTDAZW5kb3N0cmVhbQplbmRvYmoKNSAwIG9iago8PC9UeXBlL0ZvbnQvU3VidHlwZS9UeXBlMS9CYXNlRm9udC9IZWx2ZXRpY2E+PgplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDE1IDAwMDAwIG4gCjAwMDAwMDAwNzAgMDAwMDAgbiAKMDAwMDAwMDA5MyAwMDAwMCBuIAowMDAwMDAwMjg0IDAwMDAwIG4gCjAwMDAwMDA0MDMgMDAwMDAgbiAKdHJhaWxlcgo8PC9TaXplIDYvUm9vdCAxIDAgUj4+CnN0YXJ0eHJlZgo0NTIKJSVFT0YK', type: 'application/pdf' }
  },
  {
    id: 2,
    title: 'Protocolo de Bioseguridad',
    description: 'Protocolo actualizado para el manejo de equipos y pacientes en el contexto de la bioseguridad hospitalaria.',
    uploadDate: new Date('2024-04-15T14:30:00Z'),
    author: 'Comité de Bioseguridad',
    file: { name: 'Protocolo_Bioseguridad.pdf', url: 'data:application/pdf;base64,JVBERi0xLjcKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFIvTGFuZyhlcy1DTClgPj4KZW5kb2JqCjIgMCBvYmoKPDwvVHlwZS9QYWdlcy9Db3VudCAxL0tpZHNbMyAwIFJdPj4KZW5kb2JqCjMgMCBvYmoKPDwvVHlwZS9QYWdlL1BhcmVudCAyIDAgUi9SZXNvdXJjZXM8PC9Gb250PDwvRjEgNSAwIFI+Pj4+L01lZGlhQm94WzAgMCA1OTUgODQyXS9Db250ZW50cyA0IDAgUi9Hcm91cDw8L1R5cGUvR3JvdXAvUy9UcmFuc3BhcmVuY3kvQ1MvRGV2aWNlUkdCPj4vVGFicy9TPj4KZW5kb2JqCjQgMCBvYmoKPDwvRmlsdGVyL0ZsYXRlRGVjb2RlL0xlbmd0aCA4Nj4+CnN0cmVhbQp4nE2NQQrCMBBF95JgMNiAIOJd6gM8g2fQI7hQ4l5c6E08gYfQo1t0V8e9/5v8M1/MHEw5BwzD4C4Yl5/Ax47rJpBGNjFzFcMKUXgQkb0mKl8oT+nUuGlJGksr8d9o3rXbFqW3J+llx/gV4dM13t5FzD2rF6tFC4MlLmwuuI3+3t9s2xMwcA+L0aTd+k/s2Yl0pS4T2l57Ydcr+my5lOAkXKvH4GvCEQo5HBCfKGO8N8AYaHTDAZW5kb3N0cmVhbQplbmRvYmoKNSAwIG9iago8PC9UeXBlL0ZvbnQvU3VidHlwZS9UeXBlMS9CYXNlRm9udC9IZWx2ZXRpY2E+PgplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDE1IDAwMDAwIG4gCjAwMDAwMDAwNzAgMDAwMDAgbiAKMDAwMDAwMDA5MyAwMDAwMCBuIAowMDAwMDAwMjg0IDAwMDAwIG4gCjAwMDAwMDA0MDMgMDAwMDAgbiAKdHJhaWxlcgo8PC9TaXplIDYvUm9vdCAxIDAgUj4+CnN0YXJ0eHJlZgo0NTIKJSVFT0YK', type: 'application/pdf' }
  }
];

export const initialMeetingRecords: MeetingRecord[] = [
  {
    id: 1,
    title: 'Reunión de Planificación Semestral',
    date: new Date('2024-07-25T00:00:00Z'),
    startTime: '10:00',
    endTime: '12:30',
    details: 'Se discutieron los objetivos para el segundo semestre, la asignación de rotaciones y el calendario de exámenes.',
    attendees: {
      teachers: [1, 2],
      students: [1, 2, 3],
      externals: [],
    },
    streamingLink: 'https://meet.example.com/planificacion-2024-s2'
  },
  {
    id: 2,
    title: 'Análisis de Casos Clínicos Complejos',
    date: new Date('2024-08-05T00:00:00Z'),
    startTime: '09:00',
    endTime: '10:30',
    details: 'Revisión de casos de neurorradiología y musculoesquelético. Presentan Dr. Pérez y Residente Ana González.',
    attendees: {
      teachers: [1],
      students: [1, 2],
      externals: ['Dr. Juanito Perez (Neurorradiólogo invitado)'],
    },
  },
  {
    id: 3,
    title: 'Comité de Currículo',
    date: new Date('2024-08-12T00:00:00Z'),
    startTime: '15:00',
    endTime: '16:30',
    details: 'Revisión de la malla curricular para el próximo año. Se discute la incorporación de un nuevo curso electivo sobre inteligencia artificial en radiología.',
    attendees: {
      teachers: [1, 2, 3],
      students: [],
      externals: [],
    },
  }
];

export const initialProfessionalActivities: ProfessionalActivity[] = [
    {
        id: 1,
        studentId: 1,
        type: 'Congreso',
        title: 'Congreso Chileno de Radiología',
        date: new Date('2024-10-20T00:00:00Z'),
        location: 'Santiago, Chile',
        participationType: 'Póster',
    },
    {
        id: 2,
        studentId: 1,
        type: 'Publicación',
        title: 'Análisis de patrones de realce en gliomas de alto grado mediante perfusión por RM',
        date: new Date('2024-08-15T00:00:00Z'),
        journal: 'Revista Chilena de Radiología',
        doiLink: '10.1016/j.rchira.2024.08.001',
    },
    {
        id: 3,
        studentId: 2,
        type: 'Rotación',
        title: 'Rotación en Radiología Pediátrica',
        date: new Date('2024-06-01T00:00:00Z'),
        endDate: new Date('2024-06-30T00:00:00Z'),
        institution: 'Hospital Clínico UC Christus',
        supervisor: 'Dra. Isabela Reyes',
    },
    {
        id: 4,
        studentId: 2,
        type: 'Presentación',
        title: 'Presentación de caso: "Manejo endovascular de MAV cerebral"',
        date: new Date('2024-09-05T00:00:00Z'),
        eventName: 'Reunión Clínica Semanal',
        location: 'Auditorio Hospital Regional',
    },
    {
        id: 5,
        studentId: 4,
        type: 'Congreso',
        title: 'Simposio Latinoamericano de Neurorradiología',
        date: new Date('2024-11-10T00:00:00Z'),
        location: 'Buenos Aires, Argentina',
        participationType: 'Asistente',
    },
    {
        id: 6,
        studentId: 5,
        type: 'Presentación',
        title: 'Ecografía en el paciente pediátrico: Desafíos y soluciones',
        date: new Date('2024-07-15T00:00:00Z'),
        eventName: 'Jornadas de Radiología Pediátrica',
        location: 'Hospital de Niños',
    }
];

export const initialTeacherProfessionalActivities: TeacherProfessionalActivity[] = [
    {
        id: 1,
        teacherId: 1,
        type: 'Publicación',
        title: 'Deep Learning for Early Detection of Lung Nodules in CT Scans',
        date: new Date('2023-11-20T00:00:00Z'),
        journal: 'Journal of Digital Imaging',
        doiLink: '10.1007/s10278-023-0081-3',
    },
    {
        id: 2,
        teacherId: 2,
        type: 'Congreso',
        title: 'Radiological Society of North America (RSNA) Annual Meeting',
        date: new Date('2023-11-26T00:00:00Z'),
        location: 'Chicago, IL, USA',
        participationType: 'Expositor',
    },
    {
        id: 3,
        teacherId: 1,
        type: 'Investigación',
        title: 'Fondo Nacional de Desarrollo Científico y Tecnológico (FONDECYT)',
        date: new Date('2024-03-15T00:00:00Z'),
        project: 'Optimización de secuencias de resonancia magnética para la caracterización de lesiones hepáticas',
        role: 'Investigador Principal',
    },
    {
        id: 4,
        teacherId: 3,
        type: 'Docencia',
        title: 'Curso de postgrado en Neurorradiología Avanzada',
        date: new Date('2024-03-01T00:00:00Z'),
        course: 'Neurorradiología Avanzada',
        institution: 'Universidad de Antofagasta',
    }
];

export const initialPersonalDocuments: PersonalDocument[] = [
    {
        id: 1,
        ownerId: 1,
        ownerType: 'student',
        title: 'Certificado de Título',
        description: 'Certificado de Médico Cirujano de la Universidad de Chile.',
        uploadDate: new Date('2022-03-10T00:00:00Z'),
        file: { name: 'Cert_Titulo_Ana_Gonzalez.pdf', url: 'data:application/pdf;base64,JVBERi0xLjcKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFIvTGFuZyhlcy1DTClgPj4KZW5kb2JqCjIgMCBvYmoKPDwvVHlwZS9QYWdlcy9Db3VudCAxL0tpZHNbMyAwIFJdPj4KZW5kb2JqCjMgMCBvYmoKPDwvVHlwZS9QYWdlL1BhcmVudCAyIDAgUi9SZXNvdXJjZXM8PC9Gb250PDwvRjEgNSAwIFI+Pj4+L01lZGlhQm94WzAgMCA1OTUgODQyXS9Db250ZW50cyA0IDAgUi9Hcm91cDw8L1R5cGUvR3JvdXAvUy9UcmFuc3BhcmVuY3kvQ1MvRGV2aWNlUkdCPj4vVGFicy9TPj4KZW5kb2JqCjQgMCBvYmoKPDwvRmlsdGVyL0ZsYXRlRGVjb2RlL0xlbmd0aCA4Nj4+CnN0cmVhbQp4nE2NQQrCMBBF95JgMNiAIOJd6gM8g2fQI7hQ4l5c6E08gYfQo1t0V8e9/5v8M1/MHEw5BwzD4C4Yl5/Ax47rJpBGNjFzFcMKUXgQkb0mKl8oT+nUuGlJGksr8d9o3rXbFqW3J+llx/gV4dM13t5FzD2rF6tFC4MlLmwuuI3+3t9s2xMwcA+L0aTd+k/s2Yl0pS4T2l57Ydcr+my5lOAkXKvH4GvCEQo5HBCfKGO8N8AYaHTDAZW5kb3N0cmVhbQplbmRvYmoKNSAwIG9iago8PC9UeXBlL0ZvbnQvU3VidHlwZS9UeXBlMS9CYXNlRm9udC9IZWx2ZXRpY2E+PgplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDE1IDAwMDAwIG4gCjAwMDAwMDAwNzAgMDAwMDAgbiAKMDAwMDAwMDA5MyAwMDAwMCBuIAowMDAwMDAwMjg0IDAwMDAwIG4gCjAwMDAwMDA0MDMgMDAwMDAgbiAKdHJhaWxlcgo8PC9TaXplIDYvUm9vdCAxIDAgUj4+CnN0YXJ0eHJlZgo0NTIKJSVFT0YK', type: 'application/pdf' }
    },
    {
        id: 2,
        ownerId: 1,
        ownerType: 'teacher',
        title: 'Certificado de Postgrado',
        description: 'Doctorado en Física Médica, Stanford University.',
        uploadDate: new Date('2010-06-20T00:00:00Z'),
        file: { name: 'Cert_PhD_Ricardo_Perez.pdf', url: 'data:application/pdf;base64,JVBERi0xLjcKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFIvTGFuZyhlcy1DTClgPj4KZW5kb2JqCjIgMCBvYmoKPDwvVHlwZS9QYWdlcy9Db3VudCAxL0tpZHNbMyAwIFJdPj4KZW5kb2JqCjMgMCBvYmoKPDwvVHlwZS9QYWdlL1BhcmVudCAyIDAgUi9SZXNvdXJjZXM8PC9Gb250PDwvRjEgNSAwIFI+Pj4+L01lZGlhQm94WzAgMCA1OTUgODQyXS9Db250ZW50cyA0IDAgUi9Hcm91cDw8L1R5cGUvR3JvdXAvUy9UcmFuc3BhcmVuY3kvQ1MvRGV2aWNlUkdCPj4vVGFicy9TPj4KZW5kb2JqCjQgMCBvYmoKPDwvRmlsdGVyL0ZsYXRlRGVjb2RlL0xlbmd0aCA4Nj4+CnN0cmVhbQp4nE2NQQrCMBBF95JgMNiAIOJd6gM8g2fQI7hQ4l5c6E08gYfQo1t0V8e9/5v8M1/MHEw5BwzD4C4Yl5/Ax47rJpBGNjFzFcMKUXgQkb0mKl8oT+nUuGlJGksr8d9o3rXbFqW3J+llx/gV4dM13t5FzD2rF6tFC4MlLmwuuI3+3t9s2xMwcA+L0aTd+k/s2Yl0pS4T2l57Ydcr+my5lOAkXKvH4GvCEQo5HBCfKGO8N8AYaHTDAZW5kb3N0cmVhbQplbmRvYmoKNSAwIG9iago8PC9UeXBlL0ZvbnQvU3VidHlwZS9UeXBlMS9CYXNlRm9udC9IZWx2ZXRpY2E+PgplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDE1IDAwMDAwIG4gCjAwMDAwMDAwNzAgMDAwMDAgbiAKMDAwMDAwMDA5MyAwMDAwMCBuIAowMDAwMDAwMjg0IDAwMDAwIG4gCjAwMDAwMDA0MDMgMDAwMDAgbiAKdHJhaWxlcgo8PC9TaXplIDYvUm9vdCAxIDAgUj4+CnN0YXJ0eHJlZgo0NTIKJSVFT0YK', type: 'application/pdf' }
    },
    {
        id: 3,
        ownerId: 4,
        ownerType: 'student',
        title: 'Certificado de Título',
        description: 'Certificado de Médico Cirujano de la Universidad de Valparaíso.',
        uploadDate: new Date('2022-03-12T00:00:00Z'),
        file: { name: 'Cert_Titulo_Diego_Rojas.pdf', url: 'data:application/pdf;base64,JVBERi0xLjcKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFIvTGFuZyhlcy1DTClgPj4KZW5kb2JqCjIgMCBvYmoKPDwvVHlwZS9QYWdlcy9Db3VudCAxL0tpZHNbMyAwIFJdPj4KZW5kb2JqCjMgMCBvYmoKPDwvVHlwZS9QYWdlL1BhcmVudCAyIDAgUi9SZXNvdXJjZXM8PC9Gb250PDwvRjEgNSAwIFI+Pj4+L01lZGlhQm94WzAgMCA1OTUgODQyXS9Db250ZW50cyA0IDAgUi9Hcm91cDw8L1R5cGUvR3JvdXAvUy9UcmFuc3BhcmVuY3kvQ1MvRGV2aWNlUkdCPj4vVGFicy9TPj4KZW5kb2JqCjQgMCBvYmoKPDwvRmlsdGVyL0ZsYXRlRGVjb2RlL0xlbmd0aCA4Nj4+CnN0cmVhbQp4nE2NQQrCMBBF95JgMNiA IOJd6gM8g2fQI7hQ4l5c6E08gYfQo1t0V8e9/5v8M1/MHEw5BwzD4C4Yl5/Ax47rJpBGNjFzFcMKUXgQkb0mKl8oT+nUuGlJGksr8d9o3rXbFqW3J+llx/gV4dM13t5FzD2rF6tFC4MlLmwuuI3+3t9s2xMwcA+L0aTd+k/s2Yl0pS4T2l57Ydcr+my5lOAkXKvH4GvCEQo5HBCfKGO8N8AYaHTDAZW5kb3N0cmVhbQplbmRvYmoKNSAwIG9iago8PC9UeXBlL0ZvbnQvU3VidHlwZS9UeXBlMS9CYXNlRm9udC9IZWx2ZXRpY2E+PgplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDE1IDAwMDAwIG4gCjAwMDAwMDAwNzAgMDAwMDAgbiAKMDAwMDAwMDA5MyAwMDAwMCBuIAowMDAwMDAwMjg0IDAwMDAwIG4gCjAwMDAwMDA0MDMgMDAwMDAgbiAKdHJhaWxlcgo8PC9TaXplIDYvUm9vdCAxIDAgUj4+CnN0YXJ0eHJlZgo0NTIKJSVFT0YK', type: 'application/pdf' }
    },
    {
        id: 4,
        ownerId: 3,
        ownerType: 'teacher',
        title: 'Certificado de Postgrado',
        description: 'Postítulo en Neurorradiología, Universidad de Chile.',
        uploadDate: new Date('2018-07-20T00:00:00Z'),
        file: { name: 'Cert_Postitulo_Carolina_Lagos.pdf', url: 'data:application/pdf;base64,JVBERi0xLjcKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFIvTGFuZyhlcy1DTClgPj4KZW5kb2JqCjIgMCBvYmoKPDwvVHlwZS9QYWdlcy9Db3VudCAxL0tpZHNbMyAwIFJdPj4KZW5kb2JqCjMgMCBvYmoKPDwvVHlwZS9QYWdlL1BhcmVudCAyIDAgUi9SZXNvdXJjZXM8PC9Gb250PDwvRjEgNSAwIFI+Pj4+L01lZGlhQm94WzAgMCA1OTUgODQyXS9Db250ZW50cyA0IDAgUi9Hcm91cDw8L1R5cGUvR3JvdXAvUy9UcmFuc3BhcmVuY3kvQ1MvRGV2aWNlUkdCPj4vVGFicy9TPj4KZW5kb2JqCjQgMCBvYmoKPDwvRmlsdGVyL0ZsYXRlRGVjb2RlL0xlbmd0aCA4Nj4+CnN0cmVhbQp4nE2NQQrCMBBF95JgMNiAIOJd6gM8g2fQI7hQ4l5c6E08gYfQo1t0V8e9/5v8M1/MHEw5BwzD4C4Yl5/Ax47rJpBGNjFzFcMKUXgQkb0mKl8oT+nUuGlJGksr8d9o3rXbFqW3J+llx/gV4dM13t5FzD2rF6tFC4MlLmwuuI3+3t9s2xMwcA+L0aTd+k/s2Yl0pS4T2l57Ydcr+my5lOAkXKvH4GvCEQo5HBCfKGO8N8AYaHTDAZW5kb3N0cmVhbQplbmRvYmoKNSAwIG9iago8PC9UeXBlL0ZvbnQvU3VidHlwZS9UeXBlMS9CYXNlRm9udC9IZWx2ZXRpY2E+PgplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDE1IDAwMDAwIG4gCjAwMDAwMDAwNzAgMDAwMDAgbiAKMDAwMDAwMDA5MyAwMDAwMCBuIAowMDAwMDAwMjg0IDAwMDAwIG4gCjAwMDAwMDA0MDMgMDAwMDAgbiAKdHJhaWxlcgo8PC9TaXplIDYvUm9vdCAxIDAgUj4+CnN0YXJ0eHJlZgo0NTIKJSVFT0YK', type: 'application/pdf' }
    }
];

export const initialQuickLinks: QuickLink[] = [
  { id: 1, label: 'RSNA (Radiological Society of North America)', url: 'https://www.rsna.org/' },
  { id: 2, label: 'ACR (American College of Radiology)', url: 'https://www.acr.org/' },
  { id: 3, label: 'PubMed - National Library of Medicine', url: 'https://pubmed.ncbi.nlm.nih.gov/' },
  { id: 4, label: 'UpToDate - Clinical Decision Support', url: 'https://www.uptodate.com/' },
  { id: 5, label: 'SERAM (Sociedad Española de Radiología Médica)', url: 'https://seram.es/' }
];

export const surveyQuestions = [
    { id: 1, type: 'multiple-choice', text: 'Al iniciar la asignatura/rotación el docente dio a conocer en un lenguaje claro la planificación de la asignatura, considerando objetivos, competencias a desarrollar, contenidos y metodología de evaluación.', options: ['Siempre', 'Algunas veces', 'Nunca', 'No aplica'] },
    { id: 2, type: 'multiple-choice', text: 'Las actividades pedagógicas propuestas por el docente permitieron ejercitar las competencias que este programa de formación promueve.', options: ['Siempre', 'Algunas veces', 'Nunca', 'No aplica'] },
    { id: 3, type: 'multiple-choice', text: 'El docente desarrolló estrategias que ayudaron a potenciar habilidades de comunicación y trabajo en equipo.', options: ['Siempre', 'Algunas veces', 'Nunca', 'No aplica'] },
    { id: 4, type: 'multiple-choice', text: 'El docente promovió la realización de procedimientos clínicos de acuerdo al nivel de conocimientos y competencias adquiridas por el residente, ajustándose a las competencias u objetivos por cumplir en esta asignatura.', options: ['Siempre', 'Algunas veces', 'Nunca', 'No aplica'] },
    { id: 5, type: 'multiple-choice', text: 'Las actividades propuestas por el docente permitieron mantener el interés y motivación durante el desarrollo de la asignatura/rotación', options: ['Siempre', 'Algunas veces', 'Nunca', 'No aplica'] },
    { id: 6, type: 'multiple-choice', text: 'Las actividades propuestas por el docente promovieron la reflexión análisis disciplinar', options: ['Siempre', 'Algunas veces', 'Nunca', 'No aplica'] },
    { id: 7, type: 'multiple-choice', text: 'Las actividades propuestas por el docente facilitaron el aprendizaje y fortalecimiento de destrezas técnicas.', options: ['Siempre', 'Algunas veces', 'Nunca', 'No aplica'] },
    { id: 8, type: 'multiple-choice', text: 'El docente dominaba las temáticas que desarrolló durante la rotación, utilizando la medicina basada en la evidencia y no sólo la experiencia.', options: ['Siempre', 'Algunas veces', 'Nunca', 'No aplica'] },
    { id: 9, type: 'multiple-choice', text: 'El docente verificó constantemente el grado de aprendizaje en cada una de las actividades desarrolladas, entregando retroalimentación constante.', options: ['Siempre', 'Algunas veces', 'Nunca', 'No aplica'] },
    { id: 10, type: 'multiple-choice', text: 'El docente tuvo disposición para aclarar dudas y responder respuestas.', options: ['Siempre', 'Algunas veces', 'Nunca', 'No aplica'] },
    { id: 11, type: 'multiple-choice', text: 'El docente estuvo disponible y dedicó el tiempo necesario para la realización de distintas actividades y supervisión directa.', options: ['Siempre', 'Algunas veces', 'Nunca', 'No aplica'] },
    { id: 12, type: 'multiple-choice', text: 'El docente demostró un trato respetuoso con los residentes, equipo de salud y pacientes durante la rotación', options: ['Siempre', 'Algunas veces', 'Nunca', 'No aplica'] },
    { id: 13, type: 'multiple-choice', text: 'El material de estudio recomendado para la rotación fue pertinente, actualizado y relevante para profundizar el conocimiento de la disciplina.', options: ['Siempre', 'Algunas veces', 'Nunca', 'No aplica'] },
    { id: 14, type: 'multiple-choice', text: 'El docente explicó el proceso evacuativo, es decir, con que procedimientos, cuándo se realizarían y sus respectivas ponderaciones.', options: ['Siempre', 'Algunas veces', 'Nunca', 'No aplica'] },
    { id: 15, type: 'multiple-choice', text: 'El docente al finalizar la evaluación retro alimenta el desempeño alcanzado, mencionando aspectos positivos y aspectos a mejorar.', options: ['Siempre', 'Algunas veces', 'Nunca', 'No aplica'] },
    { id: 16, type: 'multiple-choice', text: 'Las evaluaciones realizadas fueron adecuadas y coherentes con las actividades desarrolladas durante la rotación.', options: ['Siempre', 'Algunas veces', 'Nunca', 'No aplica'] },
    { id: 17, type: 'multiple-choice', text: 'El docente calificó considerando los criterios específicos de evaluación que están establecidos para esta rotación', options: ['Siempre', 'Algunas veces', 'Nunca', 'No aplica'] },
    { id: 18, type: 'multiple-choice', text: 'El docente entregó las calificaciones dentro del plazo reglamentario establecido.', options: ['Siempre', 'Algunas veces', 'Nunca', 'No aplica'] },
    { id: 19, type: 'multiple-choice', text: 'El docente mantuvo actualizado el archivo personal del residente.', options: ['Siempre', 'Algunas veces', 'Nunca', 'No aplica'] },
    { id: 20, type: 'multiple-choice', text: 'El docente incluyó en el archivo personal del residente todas las actividades realizadas y su cumplimiento, las evaluaciones y los trabajos desarrollados durante el transcurso de la rotación.', options: ['Siempre', 'Algunas veces', 'Nunca', 'No aplica'] },
    { id: 21, type: 'multiple-choice', text: 'Los recursos (equipamiento, infraestructura, materiales clínicos) utilizados durante la rotación fueron suficientes y adecuados.', options: ['Siempre', 'Algunas veces', 'Nunca', 'No aplica'] },
    { id: 22, type: 'open-text', text: '¿Qué aspectos considera Ud., que pueden mejorarse para el desarrollo de la rotación?' },
    { id: 23, type: 'open-text', text: '¿Qué aspectos considera positivos y destacaría de la rotación?' },
    { id: 24, type: 'open-text', text: 'Mencione que aspectos no han sido considerados en esta encuesta y podrían ser útiles de evaluar.' }
];

export const initialSurveys: Survey[] = [];

const studentUsers: User[] = initialStudents.map(s => ({
    id: `student-${s.id}`,
    name: s.name,
    lastName: s.lastName,
    email: s.email,
    type: 'Alumno',
    originalId: s.id,
    role: 'Alumno',
    photo: s.photo,
}));

const teacherUsers: User[] = initialTeachers.map(t => ({
    id: `teacher-${t.id}`,
    name: t.name,
    lastName: t.lastName,
    email: t.email,
    type: 'Docente',
    originalId: t.id,
    role: 'Docente',
    photo: t.photo,
}));

// Designate the first teacher as Administrator by default
if (teacherUsers.length > 0) {
    teacherUsers[0].role = 'Administrador';
}


export const initialUsers: User[] = [...studentUsers, ...teacherUsers];