

import React, { useState, useEffect, useMemo } from 'react';
import { initialStudents, initialTeachers, initialSubjects, initialGrades, initialActivityLog, initialAnotaciones, initialCalendarEvents, initialNewsArticles, initialGradeReports, initialOfficialDocuments, initialMeetingRecords, initialProfessionalActivities, initialTeacherProfessionalActivities, initialPersonalDocuments, initialSiteLog, initialQuickLinks, initialSurveys, surveyQuestions, initialUsers, initialGeneralSurveys, initialSurveyAssignments } from './data';
import type { Student, Teacher, Subject, Grade, ActivityLog, Anotacion, CalendarEvent, NewsArticle, GradeReport, OfficialDocument, MeetingRecord, ProfessionalActivity, TeacherProfessionalActivity, PersonalDocument, ActivityType, TeacherActivityType, SiteLog, QuickLink, Survey, SurveyAnswer, User, Role, GeneralSurvey, SurveyAssignment } from './types';

// @ts-ignore
const { jsPDF } = window.jspdf;
// @ts-ignore
if (window.jspdf && window.jspdf.jsPDF) {
    // @ts-ignore
    window.jspdf.autoTable = window.autoTable;
}


// --- Helper Functions ---

const exportGradesToPdf = (grades: Grade[], students: Student[], subjects: Subject[], teachers: Teacher[]) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Reporte de Calificaciones", 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Generado el: ${new Date().toLocaleDateString('es-CL')}`, 105, 26, { align: 'center' });
    
    const findStudent = (id: number) => students.find(s => s.id === id);
    const findSubject = (id: number) => subjects.find(s => s.id === id);
    const findTeacher = (id?: number) => teachers.find(t => t.id === id);

    // @ts-ignore
    doc.autoTable({
        startY: 35,
        head: [['Alumno', 'Asignatura', 'Docente a Cargo', 'Promedio', 'Estado']],
        body: grades.map(grade => {
            const student = findStudent(grade.studentId);
            const subject = findSubject(grade.subjectId);
            const teacher = findTeacher(subject?.teacherId);
            return [
                `${student?.name || ''} ${student?.lastName || ''}`,
                subject?.name || 'N/A',
                `${teacher?.name || ''} ${teacher?.lastName || 'No asignado'}`,
                calculateFinalGrade(grade),
                grade.isFinalized ? 'Finalizada' : 'En Progreso'
            ];
        })
    });
    
    doc.save('reporte_calificaciones.pdf');
};

const exportGradesToCsv = (grades: Grade[], students: Student[], subjects: Subject[], teachers: Teacher[]) => {
    const findStudent = (id: number) => students.find(s => s.id === id);
    const findSubject = (id: number) => subjects.find(s => s.id === id);
    const findTeacher = (id?: number) => teachers.find(t => t.id === id);

    let csvContent = "data:text/csv;charset=utf-8,";
    const header = ['Alumno', 'Asignatura', 'Docente a Cargo', 'Promedio', 'Estado'];
    csvContent += header.join(';') + '\r\n';

    grades.forEach(grade => {
        const student = findStudent(grade.studentId);
        const subject = findSubject(grade.subjectId);
        const teacher = findTeacher(subject?.teacherId);
        const row = [
            `"${student?.name || ''} ${student?.lastName || ''}"`,
            `"${subject?.name || 'N/A'}"`,
            `"${teacher?.name || ''} ${teacher?.lastName || 'No asignado'}"`,
            `"${calculateFinalGrade(grade).replace('.', ',')}"`, // Use comma for decimal in ES locale
            `"${grade.isFinalized ? 'Finalizada' : 'En Progreso'}"`
        ];
        csvContent += row.join(';') + '\r\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "reporte_calificaciones.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

const exportSurveysToCsv = (surveys: Survey[], students: Student[], subjects: Subject[], teachers: Teacher[]) => {
    let csvContent = "data:text/csv;charset=utf-8,";
    const headers = [
        "Alumno", "Asignatura", "Docente", "Fecha Completada",
        ...surveyQuestions.map(q => `"${q.text.replace(/"/g, '""')}"`)
    ];
    csvContent += headers.join(';') + '\r\n';

    surveys.forEach(survey => {
        const student = students.find(s => s.id === survey.studentId);
        const subject = subjects.find(s => s.id === survey.subjectId);
        const teacher = teachers.find(t => t.id === survey.teacherId);

        const answersMap = new Map(survey.answers.map(a => [a.questionId, a.answer]));
        
        const rowData = [
            `"${student?.name || ''} ${student?.lastName || ''}"`,
            `"${subject?.name || 'N/A'}"`,
            `"${teacher?.name || ''} ${teacher?.lastName || 'N/A'}"`,
            `"${survey.completionDate ? new Date(survey.completionDate).toLocaleString('es-CL') : 'N/A'}"`,
            ...surveyQuestions.map(q => `"${(answersMap.get(q.id) || '').toString().replace(/"/g, '""')}"`)
        ];
        csvContent += rowData.join(';') + '\r\n';
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "reporte_encuestas.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};


const generatePdfReport = (person: Student | Teacher, personType: 'student' | 'teacher', data: { gradeReports: GradeReport[], anotaciones: Anotacion[], activities: any[], subjects: Subject[] }) => {
    const doc = new jsPDF();
    const { gradeReports, anotaciones, activities, subjects } = data;

    // Common Header
    doc.setFontSize(20);
    doc.text("GRUA - Resumen de Expediente", 105, 20, { align: "center" });
    if (person.photo) {
        try {
            // Check if image is SVG, if so skip adding it to avoid jspdf errors
            if (!person.photo.startsWith('data:image/svg+xml')) {
                doc.addImage(person.photo, 'JPEG', 15, 30, 30, 30);
            }
        } catch(e) { console.error("Could not add image to PDF", e); }
    }
    doc.setFontSize(12);
    doc.text(`${person.name} ${person.lastName}`, 50, 35);
    doc.text(`RUT: ${person.rut}`, 50, 42);
    doc.text(`Email: ${person.email}`, 50, 49);

    let finalY = 70;

    if (personType === 'student') {
        // Grades section
        if (gradeReports.length > 0) {
            doc.setFontSize(16);
            doc.text("Resumen de Calificaciones", 15, finalY - 5);
            // @ts-ignore
            doc.autoTable({
                startY: finalY,
                head: [['Asignatura', 'Nota Final', 'Estado', 'Fecha Informe']],
                body: gradeReports.map((r: GradeReport) => {
                    const subject = subjects.find((s: Subject) => s.id === r.subjectId);
                    return [
                        subject?.name || 'N/A',
                        r.gradeSummary.finalGrade.toFixed(1),
                        r.status,
                        r.generationDate.toLocaleDateString('es-CL')
                    ];
                }),
            });
            // @ts-ignore
            finalY = doc.lastAutoTable.finalY + 15;
        }

        // Annotations section
        if (anotaciones.length > 0) {
            doc.setFontSize(16);
            doc.text("Anotaciones", 15, finalY - 5);
            // @ts-ignore
            doc.autoTable({
                startY: finalY,
                head: [['Fecha', 'Tipo', 'Descripción']],
                body: anotaciones.map((a: Anotacion) => [
                    a.timestamp.toLocaleDateString('es-CL'),
                    a.type,
                    doc.splitTextToSize(a.text, 120) // Wrap text
                ]),
                columnStyles: { 2: { cellWidth: 'auto' } },
            });
            // @ts-ignore
            finalY = doc.lastAutoTable.finalY + 15;
        }

        // Activities section
        if (activities.length > 0) {
            doc.setFontSize(16);
            doc.text("Actividades Profesionales", 15, finalY - 5);
            // @ts-ignore
            doc.autoTable({
                startY: finalY,
                head: [['Fecha', 'Tipo', 'Título']],
                body: activities.map((a: ProfessionalActivity) => [
                    new Date(a.date).toLocaleDateString('es-CL'),
                    a.type,
                    doc.splitTextToSize(a.title, 120)
                ]),
                 columnStyles: { 2: { cellWidth: 'auto' } },
            });
            // @ts-ignore
            finalY = doc.lastAutoTable.finalY + 15;
        }

    } else { // Teacher
        if (activities.length > 0) {
            doc.setFontSize(16);
            doc.text("Actividades Profesionales", 15, finalY - 5);
            // @ts-ignore
            doc.autoTable({
                startY: finalY,
                head: [['Fecha', 'Tipo', 'Título']],
                body: activities.map((a: TeacherProfessionalActivity) => [
                    new Date(a.date).toLocaleDateString('es-CL'),
                    a.type,
                    doc.splitTextToSize(a.title, 120)
                ]),
                columnStyles: { 2: { cellWidth: 'auto' } },
            });
            // @ts-ignore
            finalY = doc.lastAutoTable.finalY + 15;
        }
    }

    // Footer
    doc.setFontSize(8);
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(`Página ${i} de ${pageCount}`, 105, 290, { align: "center" });
    }
    doc.text(`Reporte generado el ${new Date().toLocaleString('es-CL')}`, 15, 290);
    
    doc.save(`resumen_${person.lastName}_${person.name}.pdf`);
};

const calculateAge = (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
};

const calculateResidencyYear = (admissionDate: string): string => {
    const admission = new Date(admissionDate);
    const current = new Date();
    const diffYears = current.getFullYear() - admission.getFullYear();
    if (diffYears >= 2) return 'R3';
    if (diffYears >= 1) return 'R2';
    return 'R1';
};

const calculateYearsWorked = (admissionDate: string): number => {
    const admission = new Date(admissionDate);
    const current = new Date();
    return current.getFullYear() - admission.getFullYear();
};

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

const calculateFinalGrade = (grade: Grade): string => {
    let competencyAvg = grade.grade2;

    // If grade2 (competency average) is not a valid number, try to calculate it from competencyScores
    if (typeof competencyAvg !== 'number') {
        const validScores = grade.competencyScores?.filter(
            (s): s is number => typeof s === 'number'
        );
        if (validScores && validScores.length > 0) {
            competencyAvg = validScores.reduce((sum, score) => sum + score, 0) / validScores.length;
        }
    }

    const components = [
        { value: grade.grade1, weight: 0.60 }, // Examen Teórico
        { value: competencyAvg, weight: 0.30 }, // Promedio Competencias
        { value: grade.grade3, weight: 0.10 }, // Actividad Docente
    ];

    // Filter for components that actually have a numeric grade
    const gradedComponents = components.filter(c => typeof c.value === 'number');

    if (gradedComponents.length === 0) {
        return 'N/A';
    }
    
    // Calculate the sum of weights for the available grades
    const totalWeight = gradedComponents.reduce((sum, c) => sum + c.weight, 0);
    
    // This should not happen if gradedComponents has items, but it's a safeguard
    if (totalWeight === 0) {
        return 'N/A'; 
    }

    // Calculate the weighted sum of the available grades
    const totalWeightedSum = gradedComponents.reduce((sum, c) => sum + c.value! * c.weight, 0);
    
    // Normalize the grade by dividing by the sum of available weights
    const finalGrade = totalWeightedSum / totalWeight;

    return finalGrade.toFixed(1);
};

const calculateCompetencyAverage = (grade: Grade): number | null => {
    let competencyAvg = grade.grade2;

    if (typeof competencyAvg !== 'number' || isNaN(competencyAvg)) {
        const validScores = grade.competencyScores?.filter(
            (s): s is number => typeof s === 'number'
        );
        if (validScores && validScores.length > 0) {
            competencyAvg = validScores.reduce((sum, score) => sum + score, 0) / validScores.length;
        } else {
            return null; // No average can be calculated
        }
    }
    return competencyAvg;
};

const validateField = (name: string, value: any): string => {
    const optionalFields = ['photo', 'teacherId', 'description', 'streamingLink', 'doiLink', 'link', 'linkText', 'postgradUniversity', 'nationality'];

    if (optionalFields.includes(name)) {
        if (!value) return '';
    } else {
        if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
            return 'Este campo es requerido.';
        }
    }
    
    switch (name) {
        case 'rut':
            if (!/^\d{1,2}\.\d{3}\.\d{3}-[\dKk]$/.test(value)) return 'Formato de RUT inválido. Ej: 12.345.678-9';
            break;
        case 'email':
            if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) return 'Formato de correo electrónico inválido.';
            break;
        case 'phone':
            if (!/^\+569\d{8}$/.test(value)) return 'Formato de teléfono inválido. Ej: +56912345678';
            break;
        case 'credits':
        case 'semester':
            if (isNaN(Number(value)) || Number(value) <= 0) return 'Debe ser un número positivo.';
            break;
        case 'url':
        case 'link':
        case 'doiLink':
        case 'streamingLink':
             if (value && !/^https?:\/\/[^\s$.?#].[^\s]*$/.test(value)) return 'URL inválida.';
            break;
    }
    return '';
};


// --- Helper Components & Icons ---
const Icon = ({ path, className = 'w-6 h-6' }: { path: string; className?: string }) => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path d={path} /></svg> );
const Icons = { dashboard: <Icon path="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />, students: <Icon path="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />, teachers: <Icon path="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />, subjects: <Icon path="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />, grades: <Icon path="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />, anotaciones_history: <Icon path="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />, studentFile: <Icon path="M3 5v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H5c-1.11 0-2 .9-2 2zm12 4c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3zm-9 8c0-2 4-3.1 6-3.1s6 1.1 6 3.1v1H6v-1z" />, teacherFile: <Icon path="M3 5v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H5c-1.11 0-2 .9-2 2zm12 4c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3zm-9 8c0-2 4-3.1 6-3.1s6 1.1 6 3.1v1H6v-1z" />, calendar: <Icon path="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z" />, news: <Icon path="M4 5v14h16V5H4zm2 12H6v-2h2v2zm0-4H6v-2h2v2zm0-4H6V7h2v2zm12 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2zm-4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2zm-4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z" />, documents: <Icon path="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />, meetings: <Icon path="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />, site_management: <Icon path="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49 1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49.42l.38-2.65c.61-.25 1.17-.59-1.69.98l2.49 1c.23.09.49 0 .61.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z" />, surveys: <Icon path="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-2 14h-2v-2h2v2zm0-4h-2V9h2v3zm4-2h-2V7h2v3z" />, logout: <Icon path="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />, plus: <Icon path="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />, edit: <Icon path="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />, delete: <Icon path="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />, download: <Icon path="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />, view: <Icon path="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5zm0 12.5c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />, pdf: <Icon path="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm-2.5.5h1v-1h-1v1zm7 4.5h-3V9h1.5v3H16v-3h1.5v6zm-7-4.5H13v-1H9.5v1z" className='w-5 h-5'/>, excel: <Icon path="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9.5 14.5h-2l-1-2.25L5.5 14.5h-2L6 11l-2.5-3.5h2l1 2.25L7.5 7.5h2L7 11l2.5 3.5zm7 0h-1.5v-1.5h-3V16H10V7.5h1.5v1.5h3V7.5H16v7z" className='w-5 h-5'/>, link: <Icon path="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />, search: <Icon path="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />, user_add: <Icon path="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />, sun: <Icon path="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM20 13h-3.07c.05-.33.07-.66.07-1s-.02-.67-.07-1H20v2zM15.93 15.93c-.49.49-1.09.89-1.74 1.19l1.41 1.41c.38.38 1 .38 1.38 0 .39-.38.39-1 0-1.38l-1.05-1.05zm-7.86 0l1.05 1.05c.38.38.38 1 0 1.38-.38.39-1 .39-1.38 0l-1.41-1.41c.65-.3 1.25-.7 1.74-1.19zM12 5.5c.34 0 .67.02 1 .07V3h-2v2.57c.33-.05.66-.07 1-.07zM8.07 8.07c.49-.49 1.09-.89 1.74-1.19L8.4 5.47c-.38-.38-1-.38-1.38 0-.39.38-.39 1 0 1.38l1.05 1.05zm7.86 0l-1.05-1.05c-.38-.38-.38-1 0-1.38.38-.39 1-.39 1.38 0l1.41 1.41c-.65.3-1.25.7-1.74 1.19zM4 11H.93c-.05.33-.07.66-.07 1s.02.67.07 1H4v-2z" />, moon: <Icon path="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-3.31 0-6-2.69-6-6 0-1.82.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z" />, desktop: <Icon path="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z" /> };
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => ( <div className={`bg-white dark:bg-secondary rounded-lg shadow p-6 ${className}`}>{children}</div> );
const Button: React.FC<{ children: React.ReactNode; onClick?: () => void; className?: string; type?: 'button' | 'submit' | 'reset'; disabled?: boolean; [key: string]: any; }> = ({ children, onClick, className = 'bg-primary hover:bg-primary-hover text-white', type = 'button', disabled = false, ...props }) => ( <button type={type} onClick={onClick} disabled={disabled} className={`px-4 py-2 rounded-md font-semibold transition-colors duration-200 flex items-center justify-center space-x-2 disabled:bg-slate-300 dark:disabled:bg-slate-700 dark:disabled:text-slate-400 disabled:cursor-not-allowed ${className}`} {...props}>{children}</button> );
const Modal: React.FC<{ children: React.ReactNode; title: string; onClose: () => void; size?: 'lg' | '2xl' | '4xl' | '6xl' }> = ({ children, title, onClose, size = 'lg' }) => { const sizeClasses = { lg: 'max-w-lg', '2xl': 'max-w-2xl', '4xl': 'max-w-4xl', '6xl': 'max-w-6xl' }; return ( <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start pt-10 overflow-y-auto" onClick={onClose}><div className={`bg-white dark:bg-secondary rounded-lg shadow-xl w-full ${sizeClasses[size]} mx-4 mb-10`} onClick={e => e.stopPropagation()}><div className="p-6 border-b dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white dark:bg-secondary rounded-t-lg z-10"><h3 className="text-xl font-bold text-dark-text dark:text-slate-200">{title}</h3><button onClick={onClose} className="text-3xl font-light text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 leading-none">&times;</button></div><div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div></div></div> ); };
const Input = (props: React.InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean }) => { const { hasError, ...rest } = props; return <input {...rest} className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 bg-white dark:bg-slate-700 text-dark-text dark:text-slate-200 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-500 ${hasError ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 dark:border-slate-600 focus:ring-primary'}`} />; };
const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement> & { hasError?: boolean }) => { const { hasError, ...rest } = props; return <select {...rest} className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 bg-white dark:bg-slate-700 text-dark-text dark:text-slate-200 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-500 ${hasError ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 dark:border-slate-600 focus:ring-primary'}`} /> };
const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { hasError?: boolean }) => { const { hasError, ...rest } = props; return <textarea {...rest} className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 bg-white dark:bg-slate-700 text-dark-text dark:text-slate-200 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-500 ${hasError ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 dark:border-slate-600 focus:ring-primary'}`} /> };
const FormRow: React.FC<{ label: string; children: React.ReactNode; error?: string }> = ({ label, children, error }) => ( <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-start"><label className="font-semibold pt-2 text-dark-text dark:text-slate-300">{label}</label><div className="md:col-span-2">{children}{error && <p className="text-red-500 text-xs mt-1">{error}</p>}</div></div> );
const competencyLabels = [ "Juicio Clínico y Razonamiento", "Conocimientos y Habilidades Técnicas", "Profesionalismo y Ética", "Comunicación y Habilidades Interpersonales", "Trabajo en Equipo y Colaboración", "Aprendizaje Continuo y Autoevaluación", "Gestión y Seguridad del Paciente", "Manejo de la Información" ];
const competencyScale = { 1: "Nunca", 2: "Rara Vez", 3: "Pocas Veces", 4: "A Veces", 5: "Frecuentemente", 6: "Generalmente", 7: "Casi Siempre" };
type View = 'DASHBOARD' | 'STUDENTS' | 'TEACHERS' | 'SUBJECTS' | 'GRADES' | 'ANOTACIONES_HISTORY' | 'STUDENT_FILES' | 'TEACHER_FILES' | 'CALENDAR' | 'NEWS' | 'DOCUMENTS' | 'MEETINGS' | 'SITE_MANAGEMENT' | 'SURVEYS';
type Permissions = { canCreate: boolean; canEdit: boolean; canDelete: boolean; views: View[]; };

// --- Modals ---
const ConfirmDeleteModal = ({ onConfirm, onCancel, title, message }: { onConfirm: () => void, onCancel: () => void, title: string, message: string }) => (
    <Modal title={title} onClose={onCancel} size="lg">
        <div className="space-y-4">
            <p className="dark:text-slate-300">{message}</p>
            <div className="flex justify-end space-x-2 pt-4">
                <Button onClick={onCancel} className="bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600">Cancelar</Button>
                <Button onClick={onConfirm} className="bg-red-600 hover:bg-red-700 text-white">Confirmar Eliminación</Button>
            </div>
        </div>
    </Modal>
);

const ImageDropzone: React.FC<{
    imageUrl: string | undefined;
    onImageSelect: (base64: string) => void;
}> = ({ imageUrl, onImageSelect }) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileSelect = async (file: File) => {
        if (file && file.type.startsWith('image/')) {
            const base64 = await fileToBase64(file);
            onImageSelect(base64);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files[0]);
            e.dataTransfer.clearData();
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    };
    
    const UserPlaceholderIcon = () => (
        <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-400 dark:text-slate-500 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path></svg>
        </div>
    );

    return (
        <div className="flex items-center space-x-4">
            {imageUrl ? 
                <img src={imageUrl} alt="Perfil" className="w-20 h-20 rounded-full object-cover bg-slate-200 dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 flex-shrink-0" /> :
                <UserPlaceholderIcon />
            }
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative w-full h-20 border-2 border-dashed rounded-lg flex items-center justify-center text-center cursor-pointer transition-colors
                    ${isDragging ? 'border-primary bg-primary-light/20' : 'border-slate-300 dark:border-slate-600 hover:border-primary dark:hover:border-primary-light'}`}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleChange}
                    className="hidden"
                    aria-label="Subir foto"
                />
                <div className="text-sm text-medium-text dark:text-slate-400 p-2">
                    <p>Arrastra una imagen aquí</p>
                    <p className="font-semibold">o haz clic para seleccionar</p>
                </div>
            </div>
        </div>
    );
};

const StudentFormModal = ({ student, onSave, onClose }: { student?: Student, onSave: (student: Student) => void, onClose: () => void }) => {
    const [formData, setFormData] = useState<Student>(student || { id: 0, name: '', lastName: '', rut: '', email: '', admissionDate: '', phone: '', undergradUniversity: '', nationality: '', birthDate: '', photo: '' });
    const [errors, setErrors] = useState<Partial<Record<keyof Student, string>>>({});
    const [touched, setTouched] = useState<Partial<Record<keyof Student, boolean>>>({});
    
    const runValidation = (fieldName: keyof Student, fieldValue: string) => {
        const error = validateField(fieldName, fieldValue);
        setErrors(prev => ({ ...prev, [fieldName]: error }));
        return error;
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name } = e.target as { name: keyof Student };
        if (!touched[name]) {
            setTouched(prev => ({ ...prev, [name]: true }));
        }
        runValidation(name, formData[name] as string);
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target as { name: keyof Student, value: string };
        setFormData({ ...formData, [name]: value });
        if (touched[name]) {
            runValidation(name, value);
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const formErrors: Partial<Record<keyof Student, string>> = {};
        let formIsValid = true;

        (Object.keys(formData) as Array<keyof Student>).forEach(key => {
            const error = validateField(key, formData[key] as string);
            if (error) {
                formErrors[key] = error;
                formIsValid = false;
            }
        });

        setTouched(Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
        setErrors(formErrors);

        if (formIsValid) {
            onSave(formData);
        }
    };
    
    return (<Modal title={student ? 'Editar Alumno' : 'Agregar Alumno'} onClose={onClose} size="2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormRow label="Foto">
                <ImageDropzone imageUrl={formData.photo} onImageSelect={(base64) => setFormData(prev => ({ ...prev, photo: base64 }))} />
            </FormRow>
            <FormRow label="Nombres" error={touched.name ? errors.name : ''}><Input name="name" value={formData.name} onChange={handleChange} onBlur={handleBlur} required hasError={touched.name && !!errors.name} /></FormRow>
            <FormRow label="Apellidos" error={touched.lastName ? errors.lastName : ''}><Input name="lastName" value={formData.lastName} onChange={handleChange} onBlur={handleBlur} required hasError={touched.lastName && !!errors.lastName}/></FormRow>
            <FormRow label="RUT" error={touched.rut ? errors.rut : ''}><Input name="rut" value={formData.rut} onChange={handleChange} onBlur={handleBlur} required placeholder="12.345.678-9" hasError={touched.rut && !!errors.rut}/></FormRow>
            <FormRow label="Email" error={touched.email ? errors.email : ''}><Input type="email" name="email" value={formData.email} onChange={handleChange} onBlur={handleBlur} required placeholder="ejemplo@email.com" hasError={touched.email && !!errors.email}/></FormRow>
            <FormRow label="Teléfono" error={touched.phone ? errors.phone : ''}><Input type="tel" name="phone" value={formData.phone} onChange={handleChange} onBlur={handleBlur} required placeholder="+56912345678" hasError={touched.phone && !!errors.phone}/></FormRow>
            <FormRow label="Fecha de Nacimiento" error={touched.birthDate ? errors.birthDate : ''}><Input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} onBlur={handleBlur} required hasError={touched.birthDate && !!errors.birthDate}/></FormRow>
            <FormRow label="Fecha de Admisión" error={touched.admissionDate ? errors.admissionDate : ''}><Input type="date" name="admissionDate" value={formData.admissionDate} onChange={handleChange} onBlur={handleBlur} required hasError={touched.admissionDate && !!errors.admissionDate}/></FormRow>
            <FormRow label="U. de Pregrado" error={touched.undergradUniversity ? errors.undergradUniversity : ''}><Input name="undergradUniversity" value={formData.undergradUniversity} onChange={handleChange} onBlur={handleBlur} required hasError={touched.undergradUniversity && !!errors.undergradUniversity}/></FormRow>
            <FormRow label="Nacionalidad" error={touched.nationality ? errors.nationality : ''}><Input name="nationality" value={formData.nationality} onChange={handleChange} onBlur={handleBlur} hasError={touched.nationality && !!errors.nationality}/></FormRow>
            <div className="flex justify-end space-x-2 pt-4"><Button onClick={onClose} className="bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600">Cancelar</Button><Button type="submit">Guardar</Button></div>
        </form>
    </Modal>);
};

const TeacherFormModal = ({ teacher, onSave, onClose }: { teacher?: Teacher, onSave: (teacher: Teacher) => void, onClose: () => void }) => {
    const [formData, setFormData] = useState<Teacher>(teacher || { id: 0, name: '', lastName: '', rut: '', email: '', admissionDate: '', phone: '', postgradUniversity: '', birthDate: '', photo: '', contractType: 'Planta', academicRank: 'Adjunto' });
    const [errors, setErrors] = useState<Partial<Record<keyof Teacher, string>>>({});
    const [touched, setTouched] = useState<Partial<Record<keyof Teacher, boolean>>>({});

    const runValidation = (fieldName: keyof Teacher, fieldValue: string) => {
        const error = validateField(fieldName, fieldValue);
        setErrors(prev => ({ ...prev, [fieldName]: error }));
        return error;
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name } = e.target as { name: keyof Teacher };
        if (!touched[name]) {
            setTouched(prev => ({ ...prev, [name]: true }));
        }
        runValidation(name, formData[name] as string);
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target as { name: keyof Teacher, value: any };
        setFormData({ ...formData, [name]: value });
        if (touched[name]) {
            runValidation(name, value);
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const formErrors: Partial<Record<keyof Teacher, string>> = {};
        let formIsValid = true;
        
        (Object.keys(formData) as Array<keyof Teacher>).forEach(key => {
            const error = validateField(key, formData[key] as string);
            if (error) {
                formErrors[key] = error;
                formIsValid = false;
            }
        });

        setTouched(Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
        setErrors(formErrors);

        if (formIsValid) {
            onSave(formData);
        }
    };
    
    return (<Modal title={teacher ? 'Editar Docente' : 'Agregar Docente'} onClose={onClose} size="2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormRow label="Foto">
                <ImageDropzone imageUrl={formData.photo} onImageSelect={(base64) => setFormData(prev => ({ ...prev, photo: base64 }))} />
            </FormRow>
            <FormRow label="Nombres" error={touched.name ? errors.name : ''}><Input name="name" value={formData.name} onChange={handleChange} onBlur={handleBlur} required hasError={touched.name && !!errors.name} /></FormRow>
            <FormRow label="Apellidos" error={touched.lastName ? errors.lastName : ''}><Input name="lastName" value={formData.lastName} onChange={handleChange} onBlur={handleBlur} required hasError={touched.lastName && !!errors.lastName}/></FormRow>
            <FormRow label="RUT" error={touched.rut ? errors.rut : ''}><Input name="rut" value={formData.rut} onChange={handleChange} onBlur={handleBlur} required placeholder="12.345.678-9" hasError={touched.rut && !!errors.rut}/></FormRow>
            <FormRow label="Email" error={touched.email ? errors.email : ''}><Input type="email" name="email" value={formData.email} onChange={handleChange} onBlur={handleBlur} required placeholder="ejemplo@email.com" hasError={touched.email && !!errors.email}/></FormRow>
            <FormRow label="Teléfono" error={touched.phone ? errors.phone : ''}><Input type="tel" name="phone" value={formData.phone} onChange={handleChange} onBlur={handleBlur} required placeholder="+56912345678" hasError={touched.phone && !!errors.phone}/></FormRow>
            <FormRow label="Fecha de Nacimiento" error={touched.birthDate ? errors.birthDate : ''}><Input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} onBlur={handleBlur} required hasError={touched.birthDate && !!errors.birthDate}/></FormRow>
            <FormRow label="Fecha de Incorporación" error={touched.admissionDate ? errors.admissionDate : ''}><Input type="date" name="admissionDate" value={formData.admissionDate} onChange={handleChange} onBlur={handleBlur} required hasError={touched.admissionDate && !!errors.admissionDate}/></FormRow>
            <FormRow label="U. de Postgrado" error={touched.postgradUniversity ? errors.postgradUniversity : ''}><Input name="postgradUniversity" value={formData.postgradUniversity} onChange={handleChange} onBlur={handleBlur} hasError={touched.postgradUniversity && !!errors.postgradUniversity}/></FormRow>
            <FormRow label="Tipo de Contrato"><Select name="contractType" value={formData.contractType} onChange={handleChange} onBlur={handleBlur}><option value="Planta">Planta</option><option value="Honorarios">Honorarios</option><option value="Ad Honorem">Ad Honorem</option></Select></FormRow>
            <FormRow label="Calidad Docente"><Select name="academicRank" value={formData.academicRank} onChange={handleChange} onBlur={handleBlur}><option value="Adjunto">Adjunto</option><option value="Titular">Titular</option><option value="Colaborador">Colaborador</option></Select></FormRow>
            <div className="flex justify-end space-x-2 pt-4"><Button onClick={onClose} className="bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600">Cancelar</Button><Button type="submit">Guardar</Button></div>
        </form>
    </Modal>);
};

const SubjectFormModal = ({ subject, teachers, onSave, onClose }: { subject?: Subject, teachers: Teacher[], onSave: (subject: Subject) => void, onClose: () => void }) => {
    const [formData, setFormData] = useState<Subject>(subject || { id: 0, name: '', code: '', teacherId: undefined, credits: 0, semester: 1, description: '' });
    const [errors, setErrors] = useState<Partial<Record<keyof Subject, string>>>({});
    const [touched, setTouched] = useState<Partial<Record<keyof Subject, boolean>>>({});
    
    const runValidation = (fieldName: keyof Subject, fieldValue: any) => {
        const error = validateField(fieldName, fieldValue);
        setErrors(prev => ({ ...prev, [fieldName]: error }));
        return error;
    };
    
    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name } = e.target as { name: keyof Subject };
        if (!touched[name]) {
            setTouched(prev => ({ ...prev, [name]: true }));
        }
        runValidation(name, formData[name]);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target as { name: keyof Subject, value: any };
        const parsedValue = name === 'teacherId' || name === 'credits' || name === 'semester' ? (value ? parseInt(value) : value) : value;
        setFormData({ ...formData, [name]: parsedValue });
        if (touched[name]) {
            runValidation(name, parsedValue);
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => { 
        e.preventDefault(); 
        const formErrors: Partial<Record<keyof Subject, string>> = {};
        let formIsValid = true;
        
        (Object.keys(formData) as Array<keyof Subject>).forEach(key => {
            const error = validateField(key, formData[key] as any);
            if (error) {
                formErrors[key] = error;
                formIsValid = false;
            }
        });

        setTouched(Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
        setErrors(formErrors);

        if (formIsValid) {
            onSave(formData);
        }
    };

    return (<Modal title={subject ? 'Editar Asignatura' : 'Agregar Asignatura'} onClose={onClose} size="2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormRow label="Nombre Asignatura" error={touched.name ? errors.name : ''}><Input name="name" value={formData.name} onChange={handleChange} onBlur={handleBlur} required hasError={touched.name && !!errors.name}/></FormRow>
            <FormRow label="Código" error={touched.code ? errors.code : ''}><Input name="code" value={formData.code} onChange={handleChange} onBlur={handleBlur} required hasError={touched.code && !!errors.code}/></FormRow>
            <FormRow label="Docente a Cargo" error={touched.teacherId ? errors.teacherId : ''}><Select name="teacherId" value={formData.teacherId} onChange={handleChange} onBlur={handleBlur} hasError={touched.teacherId && !!errors.teacherId}><option value="">Seleccione un docente</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.name} {t.lastName}</option>)}</Select></FormRow>
            <FormRow label="Créditos" error={touched.credits ? errors.credits : ''}><Input type="number" name="credits" value={formData.credits} onChange={handleChange} onBlur={handleBlur} required hasError={touched.credits && !!errors.credits}/></FormRow>
            <FormRow label="Semestre" error={touched.semester ? errors.semester : ''}><Input type="number" name="semester" value={formData.semester} onChange={handleChange} onBlur={handleBlur} required hasError={touched.semester && !!errors.semester}/></FormRow>
            <FormRow label="Descripción" error={touched.description ? errors.description : ''}><Textarea name="description" value={formData.description} onChange={handleChange} onBlur={handleBlur} rows={4} hasError={touched.description && !!errors.description}/></FormRow>
            <div className="flex justify-end space-x-2 pt-4"><Button onClick={onClose} className="bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600">Cancelar</Button><Button type="submit">Guardar</Button></div>
        </form>
    </Modal>);
}

const AddGradeModal = ({ students, subjects, onSave, onClose }: { students: Student[], subjects: Subject[], onSave: (studentId: number, subjectId: number) => void, onClose: () => void }) => {
    const [studentId, setStudentId] = useState<number | ''>('');
    const [subjectId, setSubjectId] = useState<number | ''>('');
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (studentId && subjectId) onSave(studentId, subjectId); };
    return (<Modal title="Agregar Calificación" onClose={onClose}>
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormRow label="Alumno"><Select value={studentId} onChange={e => setStudentId(Number(e.target.value))} required><option value="" disabled>Seleccione Alumno</option>{students.map(s => <option key={s.id} value={s.id}>{s.name} {s.lastName}</option>)}</Select></FormRow>
            <FormRow label="Asignatura"><Select value={subjectId} onChange={e => setSubjectId(Number(e.target.value))} required><option value="" disabled>Seleccione Asignatura</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></FormRow>
            <div className="flex justify-end space-x-2 pt-4"><Button onClick={onClose} className="bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600">Cancelar</Button><Button type="submit">Crear</Button></div>
        </form>
    </Modal>);
}

const EvaluationModal = ({ grade, student, subject, onSave, onClose }: { grade: Grade, student: Student, subject: Subject, onSave: (grade: Grade, summary: GradeReport['gradeSummary'], scores: (number | null)[], feedback: string) => void, onClose: () => void }) => {
    const [grades, setGrades] = useState({ theoretical: grade.grade1 ?? null, teacherActivity: grade.grade3 ?? null });
    const [competencyScores, setCompetencyScores] = useState<(number | null)[]>(grade.competencyScores || Array(8).fill(null));
    const [feedback, setFeedback] = useState('');
    
    const finalGradeDisplay = useMemo(() => {
        const tempGrade: Grade = {
            ...grade,
            grade1: grades.theoretical ?? undefined,
            grade3: grades.teacherActivity ?? undefined,
            competencyScores: competencyScores,
        };
        const result = calculateFinalGrade(tempGrade);
        return isNaN(parseFloat(result)) ? '0.0' : result;
    }, [grades, competencyScores, grade]);

    const handleGradeChange = (e: React.ChangeEvent<HTMLInputElement>) => { const { name, value } = e.target; setGrades(prev => ({ ...prev, [name]: value === '' ? null : parseFloat(value) })); };
    const handleCompetencyChange = (index: number, value: number) => { const newScores = [...competencyScores]; newScores[index] = value; setCompetencyScores(newScores); };
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const validCompetencies = competencyScores.filter(s => s !== null) as number[];
        const competencyAvg = validCompetencies.length > 0 ? validCompetencies.reduce((a, b) => a + b, 0) / validCompetencies.length : undefined;
        const gradeSummary = { grade1: grades.theoretical ?? undefined, grade2: competencyAvg, grade3: grades.teacherActivity ?? undefined, finalGrade: parseFloat(finalGradeDisplay) };
        onSave(grade, gradeSummary, competencyScores, feedback);
    };
    
    return (
        <Modal title={`Evaluación - ${student.name} ${student.lastName}`} onClose={onClose} size="4xl">
            <form onSubmit={handleSubmit} className="space-y-8">
                <Card><h3 className="text-xl font-bold mb-4">Calificaciones Ponderadas - {subject.name}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div><label className="font-semibold block mb-1 dark:text-slate-300">Examen Teórico (60%)</label><Input type="number" name="theoretical" value={grades.theoretical ?? ''} onChange={handleGradeChange} step="0.1" min="1" max="7" /></div>
                        <div><label className="font-semibold block mb-1 dark:text-slate-300">Actividad Docente (10%)</label><Input type="number" name="teacherActivity" value={grades.teacherActivity ?? ''} onChange={handleGradeChange} step="0.1" min="1" max="7" /></div>
                        <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-md text-center"><p className="text-sm text-medium-text dark:text-slate-400">Nota Final Ponderada</p><p className="font-bold text-2xl dark:text-white">{finalGradeDisplay}</p></div>
                    </div>
                </Card>
                <Card>
                    <h3 className="text-xl font-bold mb-2">Evaluación de Competencias (30%)</h3>
                    <p className="text-sm text-medium-text dark:text-slate-400 mb-4">Escala: 1=Nunca, 2=Rara Vez, 3=Pocas Veces, 4=A Veces, 5=Frecuentemente, 6=Generalmente, 7=Casi Siempre</p>
                    <div className="space-y-4">
                        {competencyLabels.map((label, index) => (
                            <div key={index} className="grid grid-cols-12 gap-2 items-center">
                                <label className="font-semibold col-span-12 md:col-span-4 dark:text-slate-300">{label}</label>
                                <div className="col-span-12 md:col-span-8 flex justify-start space-x-2 flex-wrap">
                                    {Object.entries(competencyScale).map(([val, desc]) => (
                                        <label key={val} className="flex items-center justify-center cursor-pointer" title={desc}>
                                            <input type="radio" name={`comp-${index}`} value={val} checked={competencyScores[index] === parseInt(val)} onChange={() => handleCompetencyChange(index, parseInt(val))} className="sr-only" />
                                            <span className={`w-10 h-10 rounded-md flex items-center justify-center border-2 transition-all ${competencyScores[index] === parseInt(val) ? 'bg-primary text-white border-primary-hover' : 'bg-white dark:bg-slate-600 dark:border-slate-500 hover:bg-primary-light border-slate-300'}`}>{val}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
                <Card><h3 className="text-xl font-bold mb-4">Feedback General y Comentarios</h3><Textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={6} placeholder="Escriba aquí sus comentarios sobre el desempeño del alumno..."/></Card>
                <div className="flex justify-end space-x-2 pt-4"><Button onClick={onClose} className="bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600">Cancelar</Button><Button type="submit">Guardar y Generar Informe</Button></div>
            </form>
        </Modal>
    );
};
const ReportViewerModal = ({ report, student, subject, onAccept, onClose }: { report: GradeReport, student: Student, subject: Subject, onAccept: (reportId: number) => void, onClose: () => void }) => {
    const [accepted, setAccepted] = useState(false);
    return (
        <Modal title={`Informe de Evaluación - ${student.name} ${student.lastName}`} onClose={onClose} size="2xl">
            <div className="space-y-6">
                <p className="text-center text-medium-text dark:text-slate-400">Generado el {report.generationDate.toLocaleDateString('es-CL')} para la asignatura <strong>{subject.name}</strong></p>
                <Card><h4 className="font-bold mb-2">Resumen de Calificaciones</h4><p className="dark:text-slate-300">Nota Final Ponderada: <strong className="text-lg">{report.gradeSummary.finalGrade.toFixed(2)}</strong></p></Card>
                <Card><h4 className="font-bold mb-2">Evaluación de Competencias</h4><ul className="list-disc list-inside space-y-1 dark:text-slate-300">{competencyLabels.map((i, index) => <li key={i}>{i}: <strong>{report.competencyScores[index] ? `${report.competencyScores[index]} (${competencyScale[report.competencyScores[index] as keyof typeof competencyScale]})` : 'No evaluado'}</strong></li>)}</ul></Card>
                <Card><h4 className="font-bold mb-2">Feedback del Docente</h4><p className="whitespace-pre-wrap dark:text-slate-300">{report.feedback || 'Sin comentarios.'}</p></Card>
                {report.status === 'Completado' ? (
                    <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/50 rounded-lg text-emerald-800 dark:text-emerald-300">Informe aceptado por el alumno el {report.studentAcceptanceDate?.toLocaleDateString('es-CL')}.</div>
                ) : (
                    <div className="border-t dark:border-slate-700 pt-6 space-y-4">
                        <label className="flex items-center space-x-3 cursor-pointer dark:text-slate-300">
                            <input type="checkbox" checked={accepted} onChange={() => setAccepted(!accepted)} className="sr-only peer" />
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 peer-checked:bg-primary peer-checked:border-primary ${accepted ? 'border-primary bg-primary' : 'border-slate-400 bg-white dark:bg-slate-600'}`}>
                                {accepted && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>}
                            </div>
                            <span>He leído y acepto el contenido de esta evaluación.</span>
                        </label>
                        <div className="flex justify-end"><Button onClick={() => onAccept(report.id)} disabled={!accepted}>Firmar y Aceptar Informe</Button></div>
                    </div>
                )}
            </div>
        </Modal>
    );
};


const AnotacionFormModal = ({ studentId, autorId, onSave, onClose }: { studentId: number, autorId: number, onSave: (anotacion: Anotacion) => void, onClose: () => void }) => {
    const [type, setType] = useState<'Positiva' | 'Negativa' | 'Observación'>('Observación');
    const [text, setText] = useState('');
    const [error, setError] = useState('');
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if(!text) { setError('La descripción es requerida.'); return; } onSave({ id: 0, studentId, autorId, timestamp: new Date(), type, text }); };
    return ( <Modal title="Agregar Anotación" onClose={onClose}> <form onSubmit={handleSubmit} className="space-y-4"> <FormRow label="Tipo de Anotación"> <Select value={type} onChange={e => setType(e.target.value as any)}> <option value="Observación">Observación</option> <option value="Positiva">Positiva</option> <option value="Negativa">Negativa</option> </Select> </FormRow> <FormRow label="Descripción" error={error}> <Textarea value={text} onChange={e => { setText(e.target.value); if(e.target.value) setError(''); }} rows={5} required hasError={!!error} /> </FormRow> <div className="flex justify-end space-x-2 pt-4"> <Button onClick={onClose} className="bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600">Cancelar</Button> <Button type="submit">Guardar Anotación</Button> </div> </form> </Modal> );
};

const PersonalDocumentFormModal = ({ ownerId, ownerType, onSave, onClose }: { ownerId: number, ownerType: 'student' | 'teacher', onSave: (doc: PersonalDocument) => void, onClose: () => void }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState<{ name: string; url: string; type: string; } | null>(null);
    const [errors, setErrors] = useState<{title?: string, file?: string}>({});
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); const newErrors: {title?: string, file?: string} = {}; if(!title) newErrors.title = 'El título es requerido.'; if(!file) newErrors.file = 'Debe seleccionar un archivo.'; if(Object.keys(newErrors).length > 0) { setErrors(newErrors); return; } onSave({ id: 0, ownerId, ownerType, title, description, uploadDate: new Date(), file: file! }); };
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => { const selectedFile = e.target.files?.[0]; if (selectedFile) { const base64 = await fileToBase64(selectedFile); setFile({ name: selectedFile.name, url: base64, type: selectedFile.type }); setErrors(prev => ({...prev, file: ''})); } };
    return ( <Modal title="Agregar Documento Personal" onClose={onClose}> <form onSubmit={handleSubmit} className="space-y-4"> <FormRow label="Título del Documento" error={errors.title}><Input value={title} onChange={e => { setTitle(e.target.value); if(e.target.value) setErrors(prev => ({...prev, title: ''})); }} required hasError={!!errors.title} /></FormRow> <FormRow label="Descripción"><Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} /></FormRow> <FormRow label="Archivo" error={errors.file}><Input type="file" onChange={handleFileChange} required hasError={!!errors.file} /></FormRow> {file && <p className="text-sm text-medium-text dark:text-slate-400">Archivo seleccionado: {file.name}</p>} <div className="flex justify-end space-x-2 pt-4"> <Button onClick={onClose} className="bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600">Cancelar</Button> <Button type="submit">Guardar Documento</Button> </div> </form> </Modal> );
};

const ProfessionalActivityFormModal = ({ personId, personType, onSave, onClose }: { personId: number, personType: 'student' | 'teacher', onSave: (activity: ProfessionalActivity | TeacherProfessionalActivity) => void, onClose: () => void }) => {
    const [type, setType] = useState<ActivityType | TeacherActivityType>(personType === 'student' ? 'Congreso' : 'Congreso');
    const [commonData, setCommonData] = useState({ title: '', date: '' });
    const [specificData, setSpecificData] = useState<any>({});
    
    const studentActivityTypes: ActivityType[] = ['Congreso', 'Publicación', 'Presentación', 'Rotación', 'Vinculación', 'Otro'];
    const teacherActivityTypes: TeacherActivityType[] = ['Congreso', 'Publicación', 'Presentación', 'Investigación', 'Docencia', 'Otro'];
    const activityTypes = personType === 'student' ? studentActivityTypes : teacherActivityTypes;

    const handleCommonChange = (e: React.ChangeEvent<HTMLInputElement>) => setCommonData({ ...commonData, [e.target.name]: e.target.value });
    const handleSpecificChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setSpecificData({ ...specificData, [e.target.name]: e.target.value });
    
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); const activityPayload = { id: 0, [personType === 'student' ? 'studentId' : 'teacherId']: personId, type, title: commonData.title, date: new Date(commonData.date), ...specificData, }; onSave(activityPayload as any); };

    const renderSpecificFields = () => {
        switch(type) {
            case 'Congreso':
                return <> <FormRow label="Ubicación"><Input name="location" value={specificData.location || ''} onChange={handleSpecificChange} required /></FormRow> <FormRow label="Tipo de Participación"> <Select name="participationType" value={specificData.participationType || (personType === 'student' ? 'Asistente' : 'Asistente')} onChange={handleSpecificChange}> {personType === 'student' ? <> <option>Asistente</option><option>Póster</option><option>Presentación Oral</option> </> : <> <option>Asistente</option><option>Expositor</option><option>Organizador</option> </>} </Select> </FormRow> </>];
            case 'Publicación':
                return <> <FormRow label="Revista/Journal"><Input name="journal" value={specificData.journal || ''} onChange={handleSpecificChange} required /></FormRow> <FormRow label="Link DOI (opcional)"><Input name="doiLink" value={specificData.doiLink || ''} onChange={handleSpecificChange} /></FormRow> </>];
            case 'Presentación':
                 return <> <FormRow label="Nombre del Evento"><Input name="eventName" value={specificData.eventName || ''} onChange={handleSpecificChange} required /></FormRow> <FormRow label="Ubicación"><Input name="location" value={specificData.location || ''} onChange={handleSpecificChange} required /></FormRow> </>]
            case 'Rotación': // Student only
                 return <> <FormRow label="Institución"><Input name="institution" value={specificData.institution || ''} onChange={handleSpecificChange} required /></FormRow> <FormRow label="Supervisor"><Input name="supervisor" value={specificData.supervisor || ''} onChange={handleSpecificChange} required /></FormRow> <FormRow label="Fecha de Término"><Input type="date" name="endDate" value={specificData.endDate || ''} onChange={handleSpecificChange} required /></FormRow> </>];
            case 'Investigación': // Teacher only
                return <> <FormRow label="Proyecto"><Input name="project" value={specificData.project || ''} onChange={handleSpecificChange} required /></FormRow> <FormRow label="Rol"><Input name="role" value={specificData.role || ''} onChange={handleSpecificChange} required /></FormRow> </>]
            default:
                return <FormRow label="Descripción"><Textarea name="description" value={specificData.description || ''} onChange={handleSpecificChange} required rows={4} /></FormRow>;
        }
    }
    
    return ( <Modal title="Agregar Actividad Profesional" onClose={onClose} size="2xl"> <form onSubmit={handleSubmit} className="space-y-4"> <FormRow label="Tipo de Actividad"> <Select value={type} onChange={e => { setType(e.target.value as any); setSpecificData({}); }}> {activityTypes.map(t => <option key={t} value={t}>{t}</option>)} </Select> </FormRow> <FormRow label="Título / Nombre"><Input name="title" value={commonData.title} onChange={handleCommonChange} required /></FormRow> <FormRow label="Fecha"><Input type="date" name="date" value={commonData.date} onChange={handleCommonChange} required /></FormRow> <hr className="my-4 dark:border-slate-700" /> {renderSpecificFields()} <div className="flex justify-end space-x-2 pt-4"> <Button onClick={onClose} className="bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600">Cancelar</Button> <Button type="submit">Guardar Actividad</Button> </div> </form> </Modal> );
};

const CalendarEventFormModal = ({ event, onSave, onClose }: { event?: CalendarEvent, onSave: (event: CalendarEvent) => void, onClose: () => void }) => {
    const [formData, setFormData] = useState<Partial<CalendarEvent>>(event || { title: '', start: new Date(), end: new Date(), type: 'Evento' });
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (!formData.title || !formData.start || !formData.end) return; onSave(formData as CalendarEvent); };
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const isDate = name === 'start' || name === 'end';
        setFormData({ ...formData, [name]: isDate ? new Date(value) : value });
    };

    return (
        <Modal title={event ? 'Editar Evento' : 'Agregar Evento'} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <FormRow label="Título"><Input name="title" value={formData.title} onChange={handleChange} required /></FormRow>
                <FormRow label="Inicio"><Input type="date" name="start" value={formData.start?.toISOString().split('T')[0]} onChange={handleChange} required /></FormRow>
                <FormRow label="Término"><Input type="date" name="end" value={formData.end?.toISOString().split('T')[0]} onChange={handleChange} required /></FormRow>
                <FormRow label="Tipo"><Select name="type" value={formData.type} onChange={handleChange}><option value="Evento">Evento</option><option value="Examen">Examen</option><option value="Clase">Clase</option><option value="Feriado">Feriado</option></Select></FormRow>
                <FormRow label="Link (Opcional)"><Input name="streamingLink" value={formData.streamingLink || ''} onChange={handleChange} /></FormRow>
                <div className="flex justify-end space-x-2 pt-4"><Button onClick={onClose} className="bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600">Cancelar</Button><Button type="submit">Guardar Evento</Button></div>
            </form>
        </Modal>
    );
};

const NewsArticleFormModal = ({ article, onSave, onClose }: { article?: NewsArticle, onSave: (article: NewsArticle) => void, onClose: () => void }) => {
    const [formData, setFormData] = useState<Partial<NewsArticle>>(article || { title: '', content: '', author: '', link: '', linkText: '' });
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) { const base64 = await fileToBase64(e.target.files[0]); setFormData({ ...formData, imageUrl: base64 }); } };
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if(!formData.title || !formData.author || !formData.content) return; onSave({ ...formData, date: new Date() } as NewsArticle); };
    
    return (
        <Modal title={article ? 'Editar Noticia' : 'Agregar Noticia'} onClose={onClose} size="2xl">
            <form onSubmit={handleSubmit} className="space-y-4">
                <FormRow label="Título"><Input name="title" value={formData.title} onChange={handleChange} required /></FormRow>
                <FormRow label="Autor"><Input name="author" value={formData.author} onChange={handleChange} required /></FormRow>
                <FormRow label="Contenido"><Textarea name="content" value={formData.content} onChange={handleChange} rows={10} required /></FormRow>
                <FormRow label="Imagen"><Input type="file" accept="image/*" onChange={handleImageChange} /></FormRow>
                {formData.imageUrl && <img src={formData.imageUrl} alt="Preview" className="w-full h-48 object-cover rounded-md" />}
                <FormRow label="Enlace (Opcional)"><Input name="link" value={formData.link || ''} onChange={handleChange} placeholder="https://ejemplo.com" /></FormRow>
                <FormRow label="Texto del Enlace"><Input name="linkText" value={formData.linkText || ''} onChange={handleChange} placeholder="Leer más..." /></FormRow>
                <div className="flex justify-end space-x-2 pt-4"><Button onClick={onClose} className="bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600">Cancelar</Button><Button type="submit">Publicar Noticia</Button></div>
            </form>
        </Modal>
    );
};

const MeetingRecordFormModal = ({ record, students, teachers, onSave, onClose }: { record?: MeetingRecord, students: Student[], teachers: Teacher[], onSave: (record: MeetingRecord) => void, onClose: () => void }) => {
    const [formData, setFormData] = useState<Partial<MeetingRecord>>(record || { title: '', details: '', attendees: { teachers: [], students: [], externals: [] } });
    const [externalsText, setExternalsText] = useState(record?.attendees?.externals.join(', ') || '');
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleAttendeeChange = (type: 'teachers' | 'students', selectedOptions: HTMLCollectionOf<HTMLOptionElement>) => {
        const selectedIds = Array.from(selectedOptions).map(option => parseInt(option.value));
        setFormData(prev => ({ ...prev, attendees: { ...prev.attendees!, [type]: selectedIds } }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const externals = externalsText.split(',').map(s => s.trim()).filter(Boolean);
        const finalData = { ...formData, attendees: { ...formData.attendees!, externals }, date: new Date(formData.date!) } as MeetingRecord;
        onSave(finalData);
    };

    return (
         <Modal title={record ? 'Editar Reunión' : 'Registrar Reunión'} onClose={onClose} size="2xl">
            <form onSubmit={handleSubmit} className="space-y-4">
                <FormRow label="Título"><Input name="title" value={formData.title} onChange={handleChange} required /></FormRow>
                <FormRow label="Fecha"><Input type="date" name="date" value={formData.date?.toString().split('T')[0]} onChange={handleChange} required /></FormRow>
                <div className="grid grid-cols-2 gap-4">
                    <FormRow label="Hora Inicio"><Input type="time" name="startTime" value={formData.startTime} onChange={handleChange} required /></FormRow>
                    <FormRow label="Hora Término"><Input type="time" name="endTime" value={formData.endTime} onChange={handleChange} required /></FormRow>
                </div>
                <FormRow label="Detalles"><Textarea name="details" value={formData.details} onChange={handleChange} rows={6} required /></FormRow>
                <FormRow label="Docentes Asistentes">
                    <select multiple className="w-full h-24 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-dark-text dark:text-slate-200" value={formData.attendees?.teachers.map(String)} onChange={(e) => handleAttendeeChange('teachers', e.target.selectedOptions)}>
                        {teachers.map(t => <option key={t.id} value={t.id}>{t.name} {t.lastName}</option>)}
                    </select>
                </FormRow>
                <FormRow label="Alumnos Asistentes">
                    <select multiple className="w-full h-24 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-dark-text dark:text-slate-200" value={formData.attendees?.students.map(String)} onChange={(e) => handleAttendeeChange('students', e.target.selectedOptions)}>
                        {students.map(s => <option key={s.id} value={s.id}>{s.name} {s.lastName}</option>)}
                    </select>
                </FormRow>
                <FormRow label="Link Reunión"><Input name="streamingLink" value={formData.streamingLink || ''} onChange={handleChange} placeholder="https://meet.example.com/..."/></FormRow>
                <FormRow label="Invitados Externos"><Input value={externalsText} onChange={e => setExternalsText(e.target.value)} placeholder="Separados por comas"/></FormRow>
                 <div className="flex justify-end space-x-2 pt-4"><Button onClick={onClose} className="bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600">Cancelar</Button><Button type="submit">Guardar Registro</Button></div>
            </form>
        </Modal>
    );
};

const QuickLinkFormModal = ({ link, onSave, onClose }: { link?: QuickLink; onSave: (link: QuickLink) => void; onClose: () => void; }) => {
    const [formData, setFormData] = useState(link || { id: 0, label: '', url: '' });
    const [errors, setErrors] = useState({label: '', url: ''});
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { setFormData({ ...formData, [e.target.name]: e.target.value }); setErrors({label:'', url:''}); };
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); const labelErr = validateField('label', formData.label); const urlErr = validateField('url', formData.url); if(labelErr || urlErr) { setErrors({label: labelErr, url: urlErr}); return; } onSave(formData); };

    return (
        <Modal title={link ? 'Editar Enlace Rápido' : 'Agregar Enlace Rápido'} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <FormRow label="Etiqueta" error={errors.label}><Input name="label" value={formData.label} onChange={handleChange} required hasError={!!errors.label} /></FormRow>
                <FormRow label="URL" error={errors.url}><Input type="url" name="url" value={formData.url} onChange={handleChange} required placeholder="https://ejemplo.com" hasError={!!errors.url} /></FormRow>
                <div className="flex justify-end space-x-2 pt-4"><Button onClick={onClose} className="bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600">Cancelar</Button><Button type="submit">Guardar Enlace</Button></div>
            </form>
        </Modal>
    );
};

const SurveyFormModal = ({ survey, student, subject, onSave, onClose }: { survey: Survey, student: Student, subject: Subject, onSave: (survey: Survey, answers: SurveyAnswer[]) => void, onClose: () => void }) => {
    const [answers, setAnswers] = useState<SurveyAnswer[]>(survey.answers || []);

    const handleAnswerChange = (questionId: number, answer: string) => {
        setAnswers(prev => {
            const existing = prev.find(a => a.questionId === questionId);
            if (existing) {
                return prev.map(a => a.questionId === questionId ? { ...a, answer } : a);
            }
            return [...prev, { questionId, answer }];
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(survey, answers);
    };

    return (
        <Modal title={`Encuesta: ${subject.name}`} onClose={onClose} size="6xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                <p className="dark:text-slate-300">Por favor, complete la siguiente encuesta para la asignatura <strong>{subject.name}</strong>, completada por <strong>{student.name} {student.lastName}</strong>.</p>
                <div className="space-y-8">
                    {surveyQuestions.map((q, index) => (
                        <Card key={q.id} className="bg-slate-50 dark:bg-slate-800/50">
                            <p className="font-bold text-dark-text dark:text-slate-200 block mb-4">{index + 1}. {q.text}</p>
                            {q.type === 'multiple-choice' && (
                                <div className="flex flex-wrap gap-x-6 gap-y-4">
                                    {q.options?.map(option => {
                                        const isChecked = answers.find(a => a.questionId === q.id)?.answer === option;
                                        return (
                                            <label key={option} className="flex items-center space-x-3 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name={`question-${q.id}`}
                                                    value={option}
                                                    checked={isChecked}
                                                    onChange={e => handleAnswerChange(q.id, e.target.value)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-5 h-5 rounded-full border-2 border-slate-400 bg-white dark:bg-slate-600 peer-checked:bg-primary peer-checked:border-primary peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-primary flex-shrink-0 flex items-center justify-center transition">
                                                    <div className="w-2 h-2 rounded-full bg-white scale-0 peer-checked:scale-100 transition-transform"></div>
                                                </div>
                                                <span className="text-dark-text dark:text-slate-300">{option}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                            {q.type === 'open-text' && (
                                <Textarea
                                    rows={4}
                                    value={answers.find(a => a.questionId === q.id)?.answer || ''}
                                    onChange={e => handleAnswerChange(q.id, e.target.value)}
                                    placeholder="Escriba su respuesta"
                                />
                            )}
                        </Card>
                    ))}
                </div>
                <div className="flex justify-end space-x-2 pt-4 border-t dark:border-slate-700">
                    <Button onClick={onClose} className="bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600">Cancelar</Button>
                    <Button type="submit">
                        Enviar Encuesta
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

const GeneralSurveyFormModal = ({ survey, onSave, onClose }: { survey?: GeneralSurvey, onSave: (survey: GeneralSurvey) => void, onClose: () => void }) => {
    const [formData, setFormData] = useState<Partial<GeneralSurvey>>(survey || { title: '', description: '', isLink: false, link: '' });
    const [errors, setErrors] = useState({title: '', link: ''});
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { setFormData({ ...formData, [e.target.name]: e.target.value }); setErrors({title: '', link: ''}); };
    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, isLink: e.target.checked });
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); const titleErr = validateField('title', formData.title); const linkErr = formData.isLink ? validateField('link', formData.link) : ''; if(titleErr || linkErr) { setErrors({title: titleErr, link: linkErr}); return; } onSave(formData as GeneralSurvey); };
    
    return (
        <Modal title={survey ? 'Editar Encuesta General' : 'Crear Encuesta General'} onClose={onClose} size="2xl">
            <form onSubmit={handleSubmit} className="space-y-4">
                <FormRow label="Título" error={errors.title}><Input name="title" value={formData.title} onChange={handleChange} required hasError={!!errors.title} /></FormRow>
                <FormRow label="Descripción"><Textarea name="description" value={formData.description} onChange={handleChange} rows={4} /></FormRow>
                <FormRow label="Tipo de Encuesta">
                    <label className="flex items-center space-x-3 cursor-pointer dark:text-slate-300">
                        <input type="checkbox" name="isLink" checked={!!formData.isLink} onChange={handleCheckboxChange} className="sr-only peer" />
                        <div className="w-5 h-5 rounded border-2 border-slate-400 bg-white dark:bg-slate-600 peer-checked:bg-primary peer-checked:border-primary peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-primary flex-shrink-0 flex items-center justify-center transition">
                            <svg className="w-3 h-3 text-white scale-0 peer-checked:scale-100 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <span>Es un enlace externo</span>
                    </label>
                </FormRow>
                {formData.isLink && (
                    <FormRow label="Enlace (URL)" error={errors.link}><Input name="link" value={formData.link} onChange={handleChange} placeholder="https://forms.gle/..." required={formData.isLink} hasError={!!errors.link} /></FormRow>
                )}
                 <p className="text-xs text-medium-text dark:text-slate-400">{!formData.isLink ? 'La encuesta interna usará el set de preguntas estándar de rotaciones.' : 'Los usuarios serán redirigidos a este enlace para completar la encuesta.'}</p>
                <div className="flex justify-end space-x-2 pt-4"><Button onClick={onClose} className="bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600">Cancelar</Button><Button type="submit">Guardar Encuesta</Button></div>
            </form>
        </Modal>
    );
}

const AssignSurveyModal = ({ survey, users, onSave, onClose }: { survey: GeneralSurvey, users: User[], onSave: (surveyId: number, userIds: string[]) => void, onClose: () => void }) => {
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

    const students = users.filter(u => u.type === 'Alumno');
    const teachers = users.filter(u => u.type === 'Docente');

    const handleUserToggle = (userId: string) => {
        setSelectedUserIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(userId)) {
                newSet.delete(userId);
            } else {
                newSet.add(userId);
            }
            return newSet;
        });
    };

    const handleSelectAll = (type: 'student' | 'teacher', checked: boolean) => {
        const usersToToggle = type === 'student' ? students : teachers;
        setSelectedUserIds(prev => {
            const newSet = new Set(prev);
            if (checked) {
                usersToToggle.forEach(user => newSet.add(user.id));
            } else {
                usersToToggle.forEach(user => newSet.delete(user.id));
            }
            return newSet;
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(survey.id, Array.from(selectedUserIds));
    };
    
    const allStudentsSelected = students.length > 0 && students.every(s => selectedUserIds.has(s.id));
    const allTeachersSelected = teachers.length > 0 && teachers.every(t => selectedUserIds.has(t.id));

    const CustomCheckbox = ({ checked, onChange, children }: { checked: boolean, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, children: React.ReactNode }) => (
        <label className="flex items-center space-x-3 cursor-pointer">
            <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
            <div className="w-5 h-5 rounded border-2 border-slate-400 bg-white dark:bg-slate-600 peer-checked:bg-primary peer-checked:border-primary peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-primary flex-shrink-0 flex items-center justify-center transition">
                <svg className="w-3 h-3 text-white scale-0 peer-checked:scale-100 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            </div>
            {children}
        </label>
    );

    return (
        <Modal title={`Asignar Encuesta: ${survey.title}`} onClose={onClose} size="4xl">
            <form onSubmit={handleSubmit} className="space-y-4">
                <p className="dark:text-slate-300">Seleccione los usuarios a los que desea asignar esta encuesta. Las encuestas aparecerán en el expediente personal de cada usuario seleccionado.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Teachers Column */}
                    <div>
                        <h4 className="font-bold text-lg mb-2 text-dark-text dark:text-slate-200">Docentes</h4>
                        <div className="border dark:border-slate-700 rounded-lg p-3">
                            <div className="pb-2 border-b dark:border-slate-700 mb-2">
                                <CustomCheckbox
                                    checked={allTeachersSelected}
                                    onChange={(e) => handleSelectAll('teacher', e.target.checked)}
                                >
                                    <span className="dark:text-slate-300">Seleccionar todos los docentes</span>
                                </CustomCheckbox>
                            </div>
                            <div className="max-h-64 overflow-y-auto space-y-1">
                                {teachers.map(user => (
                                    <div key={user.id} className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700">
                                        <CustomCheckbox
                                            checked={selectedUserIds.has(user.id)}
                                            onChange={() => handleUserToggle(user.id)}
                                        >
                                            <div className="flex items-center space-x-2 dark:text-slate-300">
                                                <img src={user.photo} className="w-8 h-8 rounded-full object-cover" alt="" />
                                                <span>{user.name} {user.lastName}</span>
                                            </div>
                                        </CustomCheckbox>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Students Column */}
                    <div>
                        <h4 className="font-bold text-lg mb-2 text-dark-text dark:text-slate-200">Alumnos</h4>
                         <div className="border dark:border-slate-700 rounded-lg p-3">
                             <div className="pb-2 border-b dark:border-slate-700 mb-2">
                                <CustomCheckbox
                                    checked={allStudentsSelected}
                                    onChange={(e) => handleSelectAll('student', e.target.checked)}
                                >
                                    <span className="dark:text-slate-300">Seleccionar todos los alumnos</span>
                                </CustomCheckbox>
                            </div>
                            <div className="max-h-64 overflow-y-auto space-y-1">
                                {students.map(user => (
                                    <div key={user.id} className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700">
                                        <CustomCheckbox
                                            checked={selectedUserIds.has(user.id)}
                                            onChange={() => handleUserToggle(user.id)}
                                        >
                                            <div className="flex items-center space-x-2 dark:text-slate-300">
                                                <img src={user.photo} className="w-8 h-8 rounded-full object-cover" alt="" />
                                                <span>{user.name} {user.lastName}</span>
                                            </div>
                                        </CustomCheckbox>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t dark:border-slate-700 mt-4">
                    <Button onClick={onClose} className="bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600">Cancelar</Button>
                    <Button type="submit" disabled={selectedUserIds.size === 0}>
                        Asignar Encuesta ({selectedUserIds.size} seleccionados)
                    </Button>
                </div>
            </form>
        </Modal>
    );
};


// --- Loading & Layout ---
const LoadingScreen: React.FC = () => ( <div className="flex items-center justify-center h-screen bg-light-bg dark:bg-slate-900"><div className="text-center"><h1 className="text-3xl font-bold text-primary">GRUA</h1><p className="text-medium-text dark:text-slate-400 mt-2">Gestión de Radiología Universidad de Antofagasta</p><div className="mt-8 border-4 border-slate-200 border-t-primary rounded-full w-12 h-12 animate-spin mx-auto"></div></div></div> );
const Sidebar: React.FC<{ currentView: View; setCurrentView: (view: View) => void, permissions: Permissions }> = ({ currentView, setCurrentView, permissions }) => { const navItems = [ { view: 'DASHBOARD', label: 'Dashboard', icon: Icons.dashboard }, { view: 'STUDENTS', label: 'Alumnos', icon: Icons.students }, { view: 'TEACHERS', label: 'Docentes', icon: Icons.teachers }, { view: 'SUBJECTS', label: 'Asignaturas', icon: Icons.subjects }, { view: 'GRADES', label: 'Calificaciones', icon: Icons.grades }, { view: 'ANOTACIONES_HISTORY', label: 'Historial Anotaciones', icon: Icons.anotaciones_history }, { view: 'STUDENT_FILES', label: 'Expediente Alumnos', icon: Icons.studentFile }, { view: 'TEACHER_FILES', label: 'Expediente Docentes', icon: Icons.teacherFile }, { view: 'SURVEYS', label: 'Gestión de Encuestas', icon: Icons.surveys }, { view: 'CALENDAR', label: 'Calendario', icon: Icons.calendar }, { view: 'NEWS', label: 'Noticias', icon: Icons.news }, { view: 'DOCUMENTS', label: 'Documentos Oficiales', icon: Icons.documents }, { view: 'MEETINGS', label: 'Registro de Reuniones', icon: Icons.meetings }, { view: 'SITE_MANAGEMENT', label: 'Gestión del Sitio', icon: Icons.site_management }, ] as const; const visibleNavItems = useMemo(() => navItems.filter(item => permissions.views.includes(item.view)), [permissions.views]); return ( <aside className="w-64 bg-secondary text-white flex flex-col"><div className="h-20 flex items-center justify-center text-2xl font-bold border-b border-slate-700">GRUA</div><nav className="flex-1 px-4 py-6 space-y-2">{visibleNavItems.map(item => ( <a key={item.view} href="#" onClick={(e) => { e.preventDefault(); setCurrentView(item.view); }} className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${ currentView === item.view ? 'bg-primary text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white' }`}>{React.cloneElement(item.icon, { className: 'w-6 h-6' })}<span>{item.label}</span></a> ))}</nav><div className="px-4 py-6 border-t border-slate-700"><a href="#" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white">{Icons.logout}<span>Cerrar Sesión</span></a></div></aside> ); };
// Fix: Define ThemeSwitcher component
const ThemeSwitcher: React.FC<{ theme: string; setTheme: (theme: string) => void }> = ({ theme, setTheme }) => {
    const themes = [
        { name: 'light', icon: Icons.sun },
        { name: 'dark', icon: Icons.moon },
        { name: 'system', icon: Icons.desktop },
    ];

    return (
        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-700 p-1 rounded-full">
            {themes.map(t => (
                <button
                    key={t.name}
                    onClick={() => setTheme(t.name)}
                    className={`p-2 rounded-full transition-colors ${
                        theme === t.name
                            ? 'bg-white dark:bg-slate-800 shadow text-primary'
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                    title={`Switch to ${t.name} theme`}
                >
                    {React.cloneElement(t.icon, { className: 'w-5 h-5' })}
                </button>
            ))}
        </div>
    );
};
const Header: React.FC<{ user: User, allUsers: User[], onUserChange: (userId: string) => void, students: Student[], teachers: Teacher[], subjects: Subject[], onSearchResultSelect: (item: any, type: string) => void, theme: string, setTheme: (theme: string) => void }> = ({ user, allUsers, onUserChange, students, teachers, subjects, onSearchResultSelect, theme, setTheme }) => {
    const teacherInfo = initialTeachers.find(t => t.id === user.originalId);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<{ students: Student[], teachers: Teacher[], subjects: Subject[] }>({ students: [], teachers: [], subjects: [] });
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        if (searchTerm.length < 2) {
            setSearchResults({ students: [], teachers: [], subjects: [] });
            return;
        }
        const lowerCaseTerm = searchTerm.toLowerCase();
        const filteredStudents = students.filter(s =>
            s.name.toLowerCase().includes(lowerCaseTerm) ||
            s.lastName.toLowerCase().includes(lowerCaseTerm) ||
            s.rut.includes(searchTerm)
        ).slice(0, 5);
        const filteredTeachers = teachers.filter(t =>
            t.name.toLowerCase().includes(lowerCaseTerm) ||
            t.lastName.toLowerCase().includes(lowerCaseTerm) ||
            t.rut.includes(searchTerm)
        ).slice(0, 5);
        const filteredSubjects = subjects.filter(sub =>
            sub.name.toLowerCase().includes(lowerCaseTerm) ||
            sub.code.toLowerCase().includes(lowerCaseTerm)
        ).slice(0, 5);
        setSearchResults({ students: filteredStudents, teachers: filteredTeachers, subjects: filteredSubjects });
    }, [searchTerm, students, teachers, subjects]);

    const handleSelect = (item: any, type: string) => {
        onSearchResultSelect(item, type);
        setSearchTerm('');
        setIsFocused(false);
    };

    const hasResults = searchResults.students.length > 0 || searchResults.teachers.length > 0 || searchResults.subjects.length > 0;

    return (
        <header className="h-20 bg-white dark:bg-secondary shadow-sm dark:shadow-none dark:border-b dark:border-slate-700 flex items-center justify-between px-8 gap-8">
            <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-dark-text dark:text-slate-200">Bienvenido, {user.name}</h1>
            </div>

            <div className="relative flex-1 max-w-xl mx-auto">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    {React.cloneElement(Icons.search, { className: 'w-5 h-5' })}
                </div>
                <Input
                    type="text"
                    placeholder="Buscar alumnos, docentes, asignaturas..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 200)} // Delay to allow click on results
                    className="pl-10 !py-2.5"
                />
                {isFocused && searchTerm.length > 1 && (
                    <div className="absolute top-full mt-2 w-full bg-white dark:bg-slate-800 rounded-lg shadow-xl z-50 border dark:border-slate-700 max-h-96 overflow-y-auto">
                        {hasResults ? (
                            <ul className="divide-y dark:divide-slate-700">
                                {searchResults.students.length > 0 && (
                                    <li>
                                        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900/50 text-xs font-bold uppercase text-slate-500">Alumnos</div>
                                        <ul>
                                            {searchResults.students.map(s => (
                                                <li key={`s-${s.id}`} onMouseDown={() => handleSelect(s, 'student')} className="px-4 py-3 hover:bg-primary-light dark:hover:bg-primary-light/10 cursor-pointer flex items-center space-x-3">
                                                    <img src={s.photo} className="w-8 h-8 rounded-full object-cover"/>
                                                    <div>
                                                      <p className="font-semibold text-dark-text dark:text-slate-200">{s.name} {s.lastName}</p>
                                                      <p className="text-sm text-medium-text dark:text-slate-400">{s.rut}</p>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </li>
                                )}
                                {searchResults.teachers.length > 0 && (
                                    <li>
                                        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900/50 text-xs font-bold uppercase text-slate-500">Docentes</div>
                                        <ul>
                                            {searchResults.teachers.map(t => (
                                                <li key={`t-${t.id}`} onMouseDown={() => handleSelect(t, 'teacher')} className="px-4 py-3 hover:bg-primary-light dark:hover:bg-primary-light/10 cursor-pointer flex items-center space-x-3">
                                                    <img src={t.photo} className="w-8 h-8 rounded-full object-cover"/>
                                                    <div>
                                                      <p className="font-semibold text-dark-text dark:text-slate-200">{t.name} {t.lastName}</p>
                                                      <p className="text-sm text-medium-text dark:text-slate-400">{t.rut}</p>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </li>
                                )}
                                {searchResults.subjects.length > 0 && (
                                    <li>
                                        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900/50 text-xs font-bold uppercase text-slate-500">Asignaturas</div>
                                        <ul>
                                            {searchResults.subjects.map(sub => (
                                                <li key={`sub-${sub.id}`} onMouseDown={() => handleSelect(sub, 'subject')} className="px-4 py-3 hover:bg-primary-light dark:hover:bg-primary-light/10 cursor-pointer">
                                                    <p className="font-semibold text-dark-text dark:text-slate-200">{sub.name}</p>
                                                    <p className="text-sm text-medium-text dark:text-slate-400">{sub.code}</p>
                                                </li>
                                            ))}
                                        </ul>
                                    </li>
                                )}
                            </ul>
                        ) : (
                            <div className="p-4 text-center text-medium-text dark:text-slate-400">No se encontraron resultados.</div>
                        )}
                    </div>
                )}
            </div>

            <div className="flex items-center space-x-4 flex-shrink-0">
                <ThemeSwitcher theme={theme} setTheme={setTheme} />
                <div className="flex items-center gap-2">
                    <label className="text-sm font-semibold whitespace-nowrap dark:text-slate-300">Simular Usuario:</label>
                    <Select value={user.id} onChange={(e) => onUserChange(e.target.value)} className="w-48">
                        {allUsers.map(u => <option key={u.id} value={u.id}>{u.name} {u.lastName} ({u.role})</option>)}
                    </Select>
                </div>
                <img src={user.photo} alt={`${user.name} ${user.lastName}`} className="w-12 h-12 rounded-full object-cover border-2 border-primary" />
            </div>
        </header>
    );
};
// Fix: Define missing page components
const StudentFilesPage: React.FC<{ 
    students: Student[], 
    grades: Grade[],
    subjects: Subject[],
    gradeReports: GradeReport[],
    anotaciones: Anotacion[],
    professionalActivities: ProfessionalActivity[],
    personalDocuments: PersonalDocument[],
    surveys: Survey[],
    surveyAssignments: SurveyAssignment[],
    generalSurveys: GeneralSurvey[],
    teachers: Teacher[],
    openModal: (modal: any) => void,
    permissions: Permissions,
    currentUser: User,
}> = ({ students, grades, subjects, gradeReports, anotaciones, professionalActivities, personalDocuments, surveys, surveyAssignments, generalSurveys, teachers, openModal, permissions, currentUser }) => {
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(
        currentUser.type === 'Alumno' ? students.find(s => s.id === currentUser.originalId) || null : null
    );
    const [searchTerm, setSearchTerm] = useState('');

    const filteredStudents = useMemo(() => {
        if (currentUser.type === 'Alumno') return [];
        return students.filter(s =>
            `${s.name} ${s.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.rut.includes(searchTerm)
        );
    }, [students, searchTerm, currentUser.type]);

    const studentData = useMemo(() => {
        if (!selectedStudent) return null;
        return {
            gradeReports: gradeReports.filter(r => r.studentId === selectedStudent.id),
            anotaciones: anotaciones.filter(a => a.studentId === selectedStudent.id).sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime()),
            activities: professionalActivities.filter(a => a.studentId === selectedStudent.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
            documents: personalDocuments.filter(d => d.ownerId === selectedStudent.id && d.ownerType === 'student').sort((a,b) => b.uploadDate.getTime() - a.uploadDate.getTime()),
            surveys: surveys.filter(s => s.studentId === selectedStudent.id && s.status === 'Completada'),
            assignedSurveys: surveyAssignments.filter(s => s.userId === `student-${selectedStudent.id}`),
        };
    }, [selectedStudent, gradeReports, anotaciones, professionalActivities, personalDocuments, surveys, surveyAssignments]);
    
    const [activeTab, setActiveTab] = useState('summary');
    
    const handleGeneratePdf = () => {
        if (!selectedStudent || !studentData) return;
        // FIX: The object literal passed to generatePdfReport had an extra 'grades' property and other excess properties from spreading studentData. This has been corrected to only pass the properties defined in the function's signature.
        generatePdfReport(selectedStudent, 'student', { gradeReports: studentData.gradeReports, anotaciones: studentData.anotaciones, activities: studentData.activities, subjects });
    };
    
    const tabs = [
        { id: 'summary', label: 'Resumen y Calificaciones' },
        { id: 'anotaciones', label: 'Anotaciones' },
        { id: 'activities', label: 'Actividades' },
        { id: 'documents', label: 'Documentos' },
        { id: 'surveys', label: 'Encuestas' },
    ];

    if (!selectedStudent) {
        return (
            <div>
                <PageTitle title="Expediente de Alumnos" />
                <Card>
                    <div className="mb-4">
                        <Input
                            type="text"
                            placeholder="Buscar alumno por nombre o RUT..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <ul className="space-y-2">
                        {filteredStudents.map(student => (
                            <li key={student.id} onClick={() => { setSelectedStudent(student); setActiveTab('summary'); }} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 cursor-pointer">
                                <img src={student.photo} alt="" className="w-12 h-12 rounded-full object-cover" />
                                <div>
                                    <p className="font-bold text-dark-text dark:text-slate-200">{student.name} {student.lastName}</p>
                                    <p className="text-sm text-medium-text dark:text-slate-400">{student.rut}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </Card>
            </div>
        );
    }

    return (
        <div>
             <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-4">
                    {currentUser.type !== 'Alumno' && <Button onClick={() => setSelectedStudent(null)} className="bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600">← Volver</Button>}
                    <h2 className="text-3xl font-bold text-dark-text dark:text-slate-200">Expediente de {selectedStudent.name} {selectedStudent.lastName}</h2>
                </div>
                <Button onClick={handleGeneratePdf}>{Icons.pdf}<span>Exportar Resumen PDF</span></Button>
            </div>

            <div className="flex space-x-6 items-start">
                {/* Left Sidebar Profile */}
                <Card className="w-1/4 sticky top-6">
                     <img src={selectedStudent.photo} alt="" className="w-32 h-32 rounded-full object-cover mx-auto mb-4 border-4 border-primary" />
                    <h3 className="text-xl font-bold text-center">{selectedStudent.name} {selectedStudent.lastName}</h3>
                    <p className="text-center text-medium-text dark:text-slate-400 mb-4">{selectedStudent.rut}</p>
                    <div className="space-y-2 text-sm border-t dark:border-slate-700 pt-4">
                         <p><strong>Email:</strong> {selectedStudent.email}</p>
                        <p><strong>Teléfono:</strong> {selectedStudent.phone}</p>
                         <p><strong>Año Residencia:</strong> {calculateResidencyYear(selectedStudent.admissionDate)}</p>
                        <p><strong>Edad:</strong> {calculateAge(selectedStudent.birthDate)} años</p>
                    </div>
                </Card>

                {/* Right Content */}
                <div className="w-3/4">
                    <div className="mb-6 flex border-b dark:border-slate-700">
                         {tabs.map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-6 py-3 font-semibold transition-colors ${activeTab === tab.id ? 'border-b-2 border-primary text-primary' : 'text-medium-text dark:text-slate-400 hover:text-dark-text dark:hover:text-slate-200'}`}>
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                     {activeTab === 'summary' && (
                        <Card>
                            <h3 className="text-xl font-bold mb-4">Informes de Calificaciones</h3>
                            {studentData?.gradeReports.map(report => {
                                const subject = subjects.find(s => s.id === report.subjectId);
                                return <div key={report.id} className="p-4 mb-4 border rounded-lg dark:border-slate-700"><div className="flex justify-between items-center"><p><strong>{subject?.name}</strong> - Final: {report.gradeSummary.finalGrade.toFixed(1)}</p><Button onClick={() => openModal({ type: 'VIEW_REPORT', data: { report, student: selectedStudent, subject } })}>Ver Informe</Button></div></div>
                            })}
                            {studentData?.gradeReports.length === 0 && <p className="text-medium-text dark:text-slate-400">No hay informes de notas finalizados.</p>}
                        </Card>
                    )}
                    {activeTab === 'anotaciones' && (
                         <Card>
                            {permissions.canCreate && <div className="flex justify-end mb-4"><Button onClick={() => openModal({ type: 'ADD_ANOTACION', data: { studentId: selectedStudent.id } })}>{Icons.plus}<span>Agregar Anotación</span></Button></div>}
                            <div className="space-y-4">
                                {studentData?.anotaciones.map(a => (
                                    <div key={a.id} className="p-4 border-l-4 rounded-r-lg bg-slate-50 dark:bg-slate-800/50" style={{ borderColor: a.type === 'Positiva' ? '#22c55e' : a.type === 'Negativa' ? '#ef4444' : '#f59e0b' }}>
                                        <p className="font-semibold">{a.type}</p>
                                        <p className="text-sm my-1 dark:text-slate-300">{a.text}</p>
                                        <p className="text-xs text-light-text dark:text-slate-500">{new Date(a.timestamp).toLocaleString('es-CL')} - por {teachers.find(t => t.id === a.autorId)?.name || 'N/A'}</p>
                                    </div>
                                ))}
                                {studentData?.anotaciones.length === 0 && <p className="text-medium-text dark:text-slate-400">No hay anotaciones registradas.</p>}
                            </div>
                        </Card>
                    )}
                    {activeTab === 'activities' && (
                        <Card>
                            {permissions.canCreate && <div className="flex justify-end mb-4"><Button onClick={() => openModal({ type: 'ADD_PROFESSIONAL_ACTIVITY', data: { personId: selectedStudent.id, personType: 'student' } })}>{Icons.plus}<span>Agregar Actividad</span></Button></div>}
                             {studentData?.activities.map(a => (<div key={a.id} className="p-3 mb-2 border rounded-md dark:border-slate-700"><strong>{new Date(a.date).toLocaleDateString('es-CL')} | {a.type}:</strong> {a.title}</div>))}
                            {studentData?.activities.length === 0 && <p className="text-medium-text dark:text-slate-400">No hay actividades profesionales registradas.</p>}
                        </Card>
                    )}
                     {activeTab === 'documents' && (
                         <Card>
                            {permissions.canCreate && <div className="flex justify-end mb-4"><Button onClick={() => openModal({ type: 'ADD_PERSONAL_DOCUMENT', data: { ownerId: selectedStudent.id, ownerType: 'student' } })}>{Icons.plus}<span>Agregar Documento</span></Button></div>}
                            {studentData?.documents.map(d => (<div key={d.id} className="p-3 mb-2 border rounded-md dark:border-slate-700 flex justify-between items-center"><div><p className="font-semibold">{d.title}</p><p className="text-sm text-medium-text dark:text-slate-400">{d.description}</p></div><a href={d.file.url} download={d.file.name} className="flex items-center space-x-2 px-3 py-1.5 rounded-md bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 text-sm font-semibold">{Icons.download}<span>Descargar</span></a></div>))}
                            {studentData?.documents.length === 0 && <p className="text-medium-text dark:text-slate-400">No hay documentos personales subidos.</p>}
                        </Card>
                    )}
                     {activeTab === 'surveys' && (
                        <Card>
                            <h3 className="text-xl font-bold mb-4">Encuestas Asignadas y Completadas</h3>
                            {studentData?.assignedSurveys.map(assignment => {
                                const surveyInfo = generalSurveys.find(s => s.id === assignment.surveyId);
                                if (!surveyInfo) return null;
                                return (
                                    <div key={assignment.id} className="p-4 mb-4 border rounded-lg dark:border-slate-700 flex justify-between items-center">
                                        <div>
                                            <p className="font-bold">{surveyInfo.title}</p>
                                            <p className={`text-sm font-semibold ${assignment.status === 'Completada' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>{assignment.status}</p>
                                        </div>
                                        {assignment.status === 'Incompleta' && !surveyInfo.isLink && (
                                            <Button onClick={() => openModal({ type: 'FILL_ROTATION_SURVEY', data: { student: selectedStudent, subject: {id: 0, name: surveyInfo.title, code: '', credits: 0, semester: 0, description: ''}, survey: {id: assignment.id, gradeId: 0, studentId: selectedStudent.id, subjectId: 0, status: 'Incompleta', answers: []} } })}>Completar Encuesta</Button>
                                        )}
                                        {assignment.status === 'Incompleta' && surveyInfo.isLink && (
                                            <a href={surveyInfo.link} target="_blank" rel="noopener noreferrer"><Button>Ir a la Encuesta</Button></a>
                                        )}
                                    </div>
                                )
                            })}
                            {studentData?.assignedSurveys.length === 0 && <p className="text-medium-text dark:text-slate-400">No hay encuestas generales asignadas.</p>}
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

const TeacherFilesPage: React.FC<{ 
    teachers: Teacher[],
    teacherProfessionalActivities: TeacherProfessionalActivity[],
    personalDocuments: PersonalDocument[],
    surveyAssignments: SurveyAssignment[],
    generalSurveys: GeneralSurvey[],
    openModal: (modal: any) => void,
    permissions: Permissions,
    currentUser: User,
}> = ({ teachers, teacherProfessionalActivities, personalDocuments, surveyAssignments, generalSurveys, openModal, permissions, currentUser }) => {
    const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(
        currentUser.type === 'Docente' ? teachers.find(t => t.id === currentUser.originalId) || null : null
    );
    const [searchTerm, setSearchTerm] = useState('');

    const filteredTeachers = useMemo(() => {
        if (currentUser.type === 'Docente') return [];
        return teachers.filter(t =>
            `${t.name} ${t.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.rut.includes(searchTerm)
        );
    }, [teachers, searchTerm, currentUser.type]);

    const teacherData = useMemo(() => {
        if (!selectedTeacher) return null;
        return {
            activities: teacherProfessionalActivities.filter(a => a.teacherId === selectedTeacher.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
            documents: personalDocuments.filter(d => d.ownerId === selectedTeacher.id && d.ownerType === 'teacher').sort((a,b) => b.uploadDate.getTime() - a.uploadDate.getTime()),
            assignedSurveys: surveyAssignments.filter(s => s.userId === `teacher-${selectedTeacher.id}`),
        };
    }, [selectedTeacher, teacherProfessionalActivities, personalDocuments, surveyAssignments]);

    const [activeTab, setActiveTab] = useState('activities');

    const handleGeneratePdf = () => {
        if (!selectedTeacher || !teacherData) return;
        generatePdfReport(selectedTeacher, 'teacher', { activities: teacherData.activities, gradeReports: [], anotaciones: [], subjects: [] });
    };
    
    const tabs = [
        { id: 'activities', label: 'Actividades Profesionales' },
        { id: 'documents', label: 'Documentos Personales' },
        { id: 'surveys', label: 'Encuestas' },
    ];

    if (!selectedTeacher) {
        return (
            <div>
                <PageTitle title="Expediente de Docentes" />
                <Card>
                    <div className="mb-4">
                        <Input
                            type="text"
                            placeholder="Buscar docente por nombre o RUT..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <ul className="space-y-2">
                        {filteredTeachers.map(teacher => (
                            <li key={teacher.id} onClick={() => { setSelectedTeacher(teacher); setActiveTab('activities'); }} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 cursor-pointer">
                                <img src={teacher.photo} alt="" className="w-12 h-12 rounded-full object-cover" />
                                <div>
                                    <p className="font-bold text-dark-text dark:text-slate-200">{teacher.name} {teacher.lastName}</p>
                                    <p className="text-sm text-medium-text dark:text-slate-400">{teacher.rut}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </Card>
            </div>
        );
    }
    
    return (
         <div>
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-4">
                    {currentUser.type !== 'Docente' && <Button onClick={() => setSelectedTeacher(null)} className="bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600">← Volver</Button>}
                    <h2 className="text-3xl font-bold text-dark-text dark:text-slate-200">Expediente de {selectedTeacher.name} {selectedTeacher.lastName}</h2>
                </div>
                 <Button onClick={handleGeneratePdf}>{Icons.pdf}<span>Exportar Resumen PDF</span></Button>
            </div>

            <div className="flex space-x-6 items-start">
                <Card className="w-1/4 sticky top-6">
                    <img src={selectedTeacher.photo} alt="" className="w-32 h-32 rounded-full object-cover mx-auto mb-4 border-4 border-primary" />
                    <h3 className="text-xl font-bold text-center">{selectedTeacher.name} {selectedTeacher.lastName}</h3>
                    <p className="text-center text-medium-text dark:text-slate-400 mb-4">{selectedTeacher.rut}</p>
                     <div className="space-y-2 text-sm border-t dark:border-slate-700 pt-4">
                         <p><strong>Email:</strong> {selectedTeacher.email}</p>
                        <p><strong>Teléfono:</strong> {selectedTeacher.phone}</p>
                         <p><strong>Calidad:</strong> {selectedTeacher.academicRank}</p>
                         <p><strong>Contrato:</strong> {selectedTeacher.contractType}</p>
                    </div>
                </Card>

                <div className="w-3/4">
                    <div className="mb-6 flex border-b dark:border-slate-700">
                         {tabs.map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-6 py-3 font-semibold transition-colors ${activeTab === tab.id ? 'border-b-2 border-primary text-primary' : 'text-medium-text dark:text-slate-400 hover:text-dark-text dark:hover:text-slate-200'}`}>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    
                     {activeTab === 'activities' && (
                         <Card>
                            {permissions.canCreate && <div className="flex justify-end mb-4"><Button onClick={() => openModal({ type: 'ADD_PROFESSIONAL_ACTIVITY', data: { personId: selectedTeacher.id, personType: 'teacher' } })}>{Icons.plus}<span>Agregar Actividad</span></Button></div>}
                             {teacherData?.activities.map(a => (<div key={a.id} className="p-3 mb-2 border rounded-md dark:border-slate-700"><strong>{new Date(a.date).toLocaleDateString('es-CL')} | {a.type}:</strong> {a.title}</div>))}
                            {teacherData?.activities.length === 0 && <p className="text-medium-text dark:text-slate-400">No hay actividades profesionales registradas.</p>}
                        </Card>
                    )}
                     {activeTab === 'documents' && (
                         <Card>
                            {permissions.canCreate && <div className="flex justify-end mb-4"><Button onClick={() => openModal({ type: 'ADD_PERSONAL_DOCUMENT', data: { ownerId: selectedTeacher.id, ownerType: 'teacher' } })}>{Icons.plus}<span>Agregar Documento</span></Button></div>}
                            {teacherData?.documents.map(d => (<div key={d.id} className="p-3 mb-2 border rounded-md dark:border-slate-700 flex justify-between items-center"><div><p className="font-semibold">{d.title}</p><p className="text-sm text-medium-text dark:text-slate-400">{d.description}</p></div><a href={d.file.url} download={d.file.name} className="flex items-center space-x-2 px-3 py-1.5 rounded-md bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 text-sm font-semibold">{Icons.download}<span>Descargar</span></a></div>))}
                            {teacherData?.documents.length === 0 && <p className="text-medium-text dark:text-slate-400">No hay documentos personales subidos.</p>}
                        </Card>
                    )}
                    {activeTab === 'surveys' && (
                        <Card>
                            <h3 className="text-xl font-bold mb-4">Encuestas Asignadas</h3>
                            {teacherData?.assignedSurveys.map(assignment => {
                                const surveyInfo = generalSurveys.find(s => s.id === assignment.surveyId);
                                if (!surveyInfo) return null;
                                return (
                                    <div key={assignment.id} className="p-4 mb-4 border rounded-lg dark:border-slate-700 flex justify-between items-center">
                                        <div>
                                            <p className="font-bold">{surveyInfo.title}</p>
                                            <p className={`text-sm font-semibold ${assignment.status === 'Completada' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>{assignment.status}</p>
                                        </div>
                                        {assignment.status === 'Incompleta' && surveyInfo.isLink && (
                                            <a href={surveyInfo.link} target="_blank" rel="noopener noreferrer"><Button>Ir a la Encuesta</Button></a>
                                        )}
                                    </div>
                                )
                            })}
                            {teacherData?.assignedSurveys.length === 0 && <p className="text-medium-text dark:text-slate-400">No hay encuestas asignadas.</p>}
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

const SiteManagementPage: React.FC<{
    users: User[],
    siteLog: SiteLog[],
    quickLinks: QuickLink[],
    onUpdateUserRole: (userId: string, role: Role) => void,
    openModal: (modal: any) => void,
    permissions: Permissions,
}> = ({ users, siteLog, quickLinks, onUpdateUserRole, openModal, permissions }) => {
    const [activeTab, setActiveTab] = useState('users');

    return (
        <div>
            <PageTitle title="Gestión del Sitio" />
            
            <div className="mb-6 flex border-b dark:border-slate-700">
                 {[{id: 'users', label: 'Gestión de Usuarios'}, {id: 'quicklinks', label: 'Enlaces Rápidos'}, {id: 'log', label: 'Registro de Actividad'}].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-6 py-3 font-semibold transition-colors ${activeTab === tab.id ? 'border-b-2 border-primary text-primary' : 'text-medium-text dark:text-slate-400 hover:text-dark-text dark:hover:text-slate-200'}`}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'users' && (
                <Card>
                    <h3 className="text-xl font-bold mb-4">Roles de Usuario</h3>
                    <table className="w-full text-left">
                        <thead><tr className="border-b dark:border-slate-700"><th className="p-4">Usuario</th><th className="p-4">Email</th><th className="p-4">Tipo</th><th className="p-4">Rol Asignado</th></tr></thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id} className="border-b dark:border-slate-700 last:border-0">
                                    <td className="p-4">{user.name} {user.lastName}</td>
                                    <td className="p-4">{user.email}</td>
                                    <td className="p-4">{user.type}</td>
                                    <td className="p-4">
                                        <Select value={user.role} onChange={(e) => onUpdateUserRole(user.id, e.target.value as Role)}>
                                            <option value="Alumno">Alumno</option>
                                            <option value="Docente">Docente</option>
                                            <option value="Administrador">Administrador</option>
                                        </Select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            )}
            
            {activeTab === 'quicklinks' && (
                <QuickLinksCard links={quickLinks} openModal={openModal} permissions={permissions} />
            )}
            
            {activeTab === 'log' && (
                <Card>
                    <h3 className="text-xl font-bold mb-4">Registro de Actividad del Sitio</h3>
                    <div className="max-h-96 overflow-y-auto">
                        <table className="w-full text-left">
                            <thead><tr className="border-b dark:border-slate-700 sticky top-0 bg-white dark:bg-secondary"><th className="p-4">Fecha</th><th className="p-4">Usuario</th><th className="p-4">Acción</th><th className="p-4">Descripción</th></tr></thead>
                            <tbody>
                                {siteLog.map(log => (
                                    <tr key={log.id} className="border-b dark:border-slate-700 last:border-0">
                                        <td className="p-4 whitespace-nowrap">{log.timestamp.toLocaleString('es-CL')}</td>
                                        <td className="p-4">{log.user}</td>
                                        <td className="p-4">{log.action}</td>
                                        <td className="p-4">{log.description}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

        </div>
    );
};

const SurveyManagementPage: React.FC<{
    surveys: Survey[],
    generalSurveys: GeneralSurvey[],
    surveyAssignments: SurveyAssignment[],
    students: Student[],
    teachers: Teacher[],
    subjects: Subject[],
    openModal: (modal: any) => void,
    permissions: Permissions,
}> = ({ surveys, generalSurveys, surveyAssignments, students, teachers, subjects, openModal, permissions }) => {
    const [activeTab, setActiveTab] = useState('general');
    
    const getSurveyStats = (surveyId: number) => {
        const assignments = surveyAssignments.filter(a => a.surveyId === surveyId);
        const completed = assignments.filter(a => a.status === 'Completada').length;
        return { total: assignments.length, completed };
    };

    return (
        <div>
            <PageTitle title="Gestión de Encuestas">
                {permissions.canCreate && <Button onClick={() => openModal({ type: 'ADD_GENERAL_SURVEY' })}>{Icons.plus}<span>Crear Encuesta General</span></Button>}
            </PageTitle>

            <div className="mb-6 flex border-b dark:border-slate-700">
                 {[{id: 'general', label: 'Encuestas Generales'}, {id: 'rotation', label: 'Resultados Encuestas de Rotación'}].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-6 py-3 font-semibold transition-colors ${activeTab === tab.id ? 'border-b-2 border-primary text-primary' : 'text-medium-text dark:text-slate-400 hover:text-dark-text dark:hover:text-slate-200'}`}>
                        {tab.label}
                    </button>
                ))}
            </div>
            
            {activeTab === 'general' && (
                <Card>
                    <table className="w-full text-left">
                        <thead><tr className="border-b dark:border-slate-700"><th className="p-4">Título</th><th className="p-4">Tipo</th><th className="p-4">Asignaciones</th><th className="p-4">Acciones</th></tr></thead>
                        <tbody>
                            {generalSurveys.map(survey => {
                                const stats = getSurveyStats(survey.id);
                                return (
                                    <tr key={survey.id} className="border-b dark:border-slate-700 last:border-0">
                                        <td className="p-4 font-bold">{survey.title}</td>
                                        <td className="p-4">{survey.isLink ? 'Externa (Link)' : 'Interna'}</td>
                                        <td className="p-4">{stats.completed} de {stats.total} completadas</td>
                                        <td className="p-4">
                                            <div className="flex space-x-2">
                                                <Button onClick={() => openModal({ type: 'ASSIGN_SURVEY', data: survey })} className="bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600">Asignar</Button>
                                                {permissions.canEdit && <Button onClick={() => openModal({ type: 'EDIT_GENERAL_SURVEY', data: survey })} className="p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-600" title="Editar">{Icons.edit}</Button>}
                                                {permissions.canDelete && <Button onClick={() => openModal({ type: 'DELETE_GENERAL_SURVEY', data: survey })} className="p-2 text-red-500 hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-500/20" title="Eliminar">{Icons.delete}</Button>}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </Card>
            )}
            
            {activeTab === 'rotation' && (
                <Card>
                    <div className="flex justify-end mb-4">
                        <Button onClick={() => exportSurveysToCsv(surveys, students, subjects, teachers)} disabled={surveys.length === 0} className="bg-green-600 hover:bg-green-700 text-white">{Icons.excel} <span>Exportar Resultados</span></Button>
                    </div>
                    <table className="w-full text-left">
                        <thead><tr className="border-b dark:border-slate-700"><th className="p-4">Alumno</th><th className="p-4">Asignatura</th><th className="p-4">Docente</th><th className="p-4">Fecha Completada</th><th className="p-4">Acciones</th></tr></thead>
                        <tbody>
                            {surveys.map(survey => {
                                const student = students.find(s => s.id === survey.studentId);
                                const subject = subjects.find(s => s.id === survey.subjectId);
                                const teacher = teachers.find(t => t.id === survey.teacherId);
                                return (
                                    <tr key={survey.id} className="border-b dark:border-slate-700 last:border-0">
                                        <td className="p-4">{student?.name} {student?.lastName}</td>
                                        <td className="p-4">{subject?.name}</td>
                                        <td className="p-4">{teacher?.name} {teacher?.lastName}</td>
                                        <td className="p-4">{survey.completionDate ? new Date(survey.completionDate).toLocaleDateString('es-CL') : 'N/A'}</td>
                                        <td className="p-4">
                                            <Button onClick={() => openModal({ type: 'VIEW_SURVEY_ANSWERS', data: { survey, student, subject } })}>{Icons.view} Ver Respuestas</Button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </Card>
            )}

        </div>
    );
};

const RenderView: React.FC<{ view: View, data: any }> = ({ view, data }) => { switch (view) { case 'DASHBOARD': return <Dashboard {...data} />; case 'STUDENTS': return <StudentListPage {...data} />; case 'TEACHERS': return <TeacherListPage {...data} />; case 'SUBJECTS': return <SubjectListPage {...data} />; case 'GRADES': return <GradeManagerPage {...data} />; case 'ANOTACIONES_HISTORY': return <AnotacionesHistoryPage {...data} />; case 'STUDENT_FILES': return <StudentFilesPage {...data} />; case 'TEACHER_FILES': return <TeacherFilesPage {...data} />; case 'CALENDAR': return <CalendarPage {...data} />; case 'NEWS': return <NewsPage {...data} />; case 'DOCUMENTS': return <OfficialDocumentsPage {...data} />; case 'MEETINGS': return <MeetingRecordsPage {...data} />; case 'SITE_MANAGEMENT': return <SiteManagementPage {...data} />; case 'SURVEYS': return <SurveyManagementPage {...data} />; default: return <Dashboard {...data} />; } };
const PageTitle = ({ title, children }: { title: string, children?: React.ReactNode }) => ( <div className="flex justify-between items-center mb-6"><h2 className="text-3xl font-bold text-dark-text dark:text-slate-200">{title}</h2><div>{children}</div></div> );

// --- Page Components ---
const Dashboard: React.FC<{ students: Student[]; grades: Grade[]; subjects: Subject[]; news: NewsArticle[]; calendarEvents: CalendarEvent[]; quickLinks: QuickLink[]; setCurrentView: (view: View) => void, openModal: (modal: any) => void, permissions: Permissions, currentUser: User }> = ({ students, grades, subjects, news, calendarEvents, quickLinks, setCurrentView, openModal, permissions, currentUser }) => {
    const isStudentView = currentUser.role === 'Alumno';

    const recentGrades = useMemo(() => {
        const allGrades = isStudentView 
            ? grades.filter(g => g.studentId === currentUser.originalId)
            : grades;
        return [...allGrades].sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()).slice(0, 5)
    }, [grades, isStudentView, currentUser.originalId]);
    
    const getStudentName = (id: number) => students.find(s => s.id === id)?.name || 'N/A';
    const getSubjectName = (id: number) => subjects.find(s => s.id === id)?.name || 'N/A';
    const upcomingEvents = useMemo(() => [...calendarEvents].filter(event => event.start >= new Date()).sort((a, b) => a.start.getTime() - b.start.getTime()).slice(0, 3), [calendarEvents]);
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                {isStudentView ? <StudentWelcomeBanner /> : <WelcomeBanner studentCount={students.length} />}
                <RecentGradesCard grades={recentGrades} getStudentName={getStudentName} getSubjectName={getSubjectName} isStudentView={isStudentView} />
                <NewsAndUpdates news={news} />
            </div>
            <div className="space-y-8">
                <UpcomingEventsCard events={upcomingEvents} />
                <QuickLinksCard links={quickLinks} openModal={openModal} permissions={permissions}/>
            </div>
        </div>
    );
};
const StudentWelcomeBanner: React.FC = () => (<div className="bg-gradient-to-r from-primary to-indigo-500 rounded-lg p-8 text-white shadow-lg"><h2 className="text-3xl font-bold">Tu Panel Académico</h2><p className="mt-2 text-indigo-200">Revisa tus calificaciones, eventos y noticias importantes aquí.</p></div>);
const WelcomeBanner: React.FC<{ studentCount: number }> = ({ studentCount }) => (<div className="bg-gradient-to-r from-primary to-indigo-500 rounded-lg p-8 text-white shadow-lg"><h2 className="text-3xl font-bold">¡Hola de nuevo!</h2><p className="mt-2 text-indigo-200">El sistema gestiona actualmente {studentCount} alumnos. Revisa las últimas actualizaciones y eventos.</p></div>);
const RecentGradesCard: React.FC<{ grades: Grade[], getStudentName: (id: number) => string, getSubjectName: (id: number) => string, isStudentView: boolean }> = ({ grades, getStudentName, getSubjectName, isStudentView }) => (<Card><h3 className="text-xl font-bold mb-4">{isStudentView ? 'Mis Calificaciones Recientes' : 'Calificaciones Recientes'}</h3><div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="border-b dark:border-slate-700">{!isStudentView && <th className="py-2 px-4 font-semibold text-dark-text dark:text-slate-300">Alumno</th>}<th className="py-2 px-4 font-semibold text-dark-text dark:text-slate-300">Asignatura</th><th className="py-2 px-4 font-semibold text-dark-text dark:text-slate-300">Promedio</th><th className="py-2 px-4 font-semibold text-dark-text dark:text-slate-300">Estado</th></tr></thead><tbody>{grades.length > 0 ? grades.map(grade => (<tr key={grade.id} className="border-b dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/50">{!isStudentView && <td className="py-3 px-4 text-dark-text dark:text-slate-300">{getStudentName(grade.studentId)}</td>}<td className="py-3 px-4 text-dark-text dark:text-slate-300">{getSubjectName(grade.subjectId)}</td><td className="py-3 px-4 font-medium text-dark-text dark:text-slate-300">{calculateFinalGrade(grade)}</td><td className="py-3 px-4"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${grade.isFinalized ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'}`}>{grade.isFinalized ? 'Finalizada' : 'En Progreso'}</span></td></tr>)) : (<tr><td colSpan={isStudentView ? 3 : 4} className="text-center p-8 text-medium-text dark:text-slate-400">{isStudentView ? 'No tienes calificaciones recientes.' : 'No hay calificaciones recientes.'}</td></tr>)}</tbody></table></div></Card>);
const NewsAndUpdates: React.FC<{ news: NewsArticle[] }> = ({ news }) => (<Card><h3 className="text-xl font-bold mb-4">Noticias y Anuncios</h3><div className="space-y-6">{news.slice(0, 2).map(article => (<div key={article.id} className="flex items-start space-x-4"><img src={article.imageUrl} alt={article.title} className="w-32 h-20 object-cover rounded-lg" /><div><h4 className="font-bold">{article.title}</h4><p className="text-sm text-medium-text dark:text-slate-400 mt-1">{article.content.substring(0, 100)}...</p><p className="text-xs text-light-text dark:text-slate-500 mt-2">{article.author} - {article.date.toLocaleDateString()}</p></div></div>))}</div></Card>);
const getEventTypeStyles = (type: CalendarEvent['type']) => { switch (type) { case 'Examen': return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700'; case 'Clase': return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700'; case 'Evento': return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-700'; case 'Feriado': return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700'; default: return 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'; }};
const UpcomingEventsCard: React.FC<{ events: CalendarEvent[] }> = ({ events }) => (<Card><h3 className="text-xl font-bold mb-4">Próximos Eventos</h3><ul className="space-y-4">{events.map(event => (<li key={event.id} className="flex items-center space-x-3"><div className="flex-shrink-0 w-12 text-center bg-primary-light dark:bg-primary-light/10 rounded-lg p-2"><p className="text-primary dark:text-primary-light font-bold text-lg leading-none">{event.start.getDate()}</p><p className="text-xs text-primary-hover dark:text-primary-light/80">{event.start.toLocaleString('es-CL', { month: 'short' })}</p></div><div><p className="font-semibold">{event.title}</p><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getEventTypeStyles(event.type).split(' ')[0]} ${getEventTypeStyles(event.type).split(' ')[1]} dark:${getEventTypeStyles(event.type).split(' ')[3]} dark:${getEventTypeStyles(event.type).split(' ')[4]}`}>{event.type}</span></div></li>))}</ul></Card>);
const ActivityLogCard: React.FC<{ log: ActivityLog[] }> = ({ log }) => (<Card><h3 className="text-xl font-bold mb-4">Actividad del Sistema</h3><ul className="space-y-4">{log.map(item => (<li key={item.id}><p className="text-sm">{item.description}</p><p className="text-xs text-light-text dark:text-slate-500">{item.timestamp.toLocaleString('es-CL')}</p></li>))}</ul></Card>);
const QuickLinksCard: React.FC<{ links: QuickLink[], openModal: (modal: any) => void, permissions: Permissions }> = ({ links, openModal, permissions }) => (<Card><h3 className="text-xl font-bold mb-4">Enlaces Rápidos</h3><ul className="space-y-3">{links.map((link) => (<li key={link.id} className="group flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 -mx-2 px-2 py-1 rounded-md"><a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-3 text-primary hover:underline hover:text-primary-hover transition-colors flex-1">{React.cloneElement(Icons.link, { className: 'w-5 h-5 flex-shrink-0' })}<span className="truncate">{link.label}</span></a>{permissions.canEdit && <div className="hidden group-hover:flex space-x-1 pl-2"><Button onClick={() => openModal({ type: 'EDIT_QUICK_LINK', data: link })} className="p-2 text-slate-500 bg-transparent hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-600" title="Editar">{React.cloneElement(Icons.edit, { className: 'w-4 h-4' })}</Button>{permissions.canDelete && <Button onClick={() => openModal({ type: 'DELETE_QUICK_LINK', data: link })} className="p-2 text-red-500 bg-transparent hover:bg-red-100 dark:hover:bg-red-500/20" title="Eliminar">{React.cloneElement(Icons.delete, { className: 'w-4 h-4' })}</Button>}</div>}</li>))}</ul>{permissions.canCreate && <div className="mt-4 border-t dark:border-slate-700 pt-3"><Button onClick={() => openModal({ type: 'ADD_QUICK_LINK' })} className="w-full bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600">{Icons.plus}<span>Agregar Enlace</span></Button></div>}</Card>);
const StudentListPage: React.FC<{ students: Student[]; openModal: (modal: any) => void, permissions: Permissions }> = ({ students, openModal, permissions }) => (<div><PageTitle title="Gestión de Alumnos">{permissions.canCreate && <Button onClick={() => openModal({ type: 'ADD_STUDENT' })}>{Icons.plus}<span>Agregar Alumno</span></Button>}</PageTitle> <Card><table className="w-full text-left"><thead><tr className="border-b dark:border-slate-700"><th className="p-4 font-semibold text-dark-text dark:text-slate-300"></th><th className="p-4 font-semibold text-dark-text dark:text-slate-300">Nombre</th><th className="p-4 font-semibold text-dark-text dark:text-slate-300">Año Residencia</th><th className="p-4 font-semibold text-dark-text dark:text-slate-300">Edad</th><th className="p-4 font-semibold text-dark-text dark:text-slate-300">Email</th><th className="p-4 font-semibold text-dark-text dark:text-slate-300">Teléfono</th>{(permissions.canEdit || permissions.canDelete) && <th className="p-4 font-semibold text-dark-text dark:text-slate-300">Acciones</th>}</tr></thead><tbody>{students.map(student => (<tr key={student.id} className="border-b dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/50"><td className="p-4"><img src={student.photo} alt="" className="w-10 h-10 rounded-full object-cover"/></td><td className="p-4 font-medium text-dark-text dark:text-slate-300">{student.name} {student.lastName}</td><td className="p-4 text-dark-text dark:text-slate-300">{calculateResidencyYear(student.admissionDate)}</td><td className="p-4 text-dark-text dark:text-slate-300">{calculateAge(student.birthDate)}</td><td className="p-4 text-dark-text dark:text-slate-300">{student.email}</td><td className="p-4 text-dark-text dark:text-slate-300">{student.phone}</td>{(permissions.canEdit || permissions.canDelete) && <td className="p-4"><div className="flex space-x-2">{permissions.canEdit && <Button onClick={() => openModal({ type: 'EDIT_STUDENT', data: student })} className="p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-600" title="Editar">{Icons.edit}</Button>}{permissions.canDelete && <Button onClick={() => openModal({ type: 'DELETE_STUDENT', data: student })} className="p-2 text-red-500 hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-500/20" title="Eliminar">{Icons.delete}</Button>}</div></td>}</tr>))}</tbody></table></Card></div>);
const TeacherListPage: React.FC<{ teachers: Teacher[]; openModal: (modal: any) => void, permissions: Permissions }> = ({ teachers, openModal, permissions }) => (<div><PageTitle title="Gestión de Docentes">{permissions.canCreate && <Button onClick={() => openModal({ type: 'ADD_TEACHER' })}>{Icons.plus}<span>Agregar Docente</span></Button>}</PageTitle> <Card><table className="w-full text-left"><thead><tr className="border-b dark:border-slate-700"><th className="p-4 font-semibold text-dark-text dark:text-slate-300"></th><th className="p-4 font-semibold text-dark-text dark:text-slate-300">Nombre</th><th className="p-4 font-semibold text-dark-text dark:text-slate-300">Calidad</th><th className="p-4 font-semibold text-dark-text dark:text-slate-300">Contrato</th><th className="p-4 font-semibold text-dark-text dark:text-slate-300">Años Servicio</th><th className="p-4 font-semibold text-dark-text dark:text-slate-300">Email</th>{(permissions.canEdit || permissions.canDelete) && <th className="p-4 font-semibold text-dark-text dark:text-slate-300">Acciones</th>}</tr></thead><tbody>{teachers.map(teacher => (<tr key={teacher.id} className="border-b dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/50"><td className="p-4"><img src={teacher.photo} alt="" className="w-10 h-10 rounded-full object-cover"/></td><td className="p-4 font-medium text-dark-text dark:text-slate-300">{teacher.name} {teacher.lastName}</td><td className="p-4 text-dark-text dark:text-slate-300">{teacher.academicRank}</td><td className="p-4 text-dark-text dark:text-slate-300">{teacher.contractType}</td><td className="p-4 text-dark-text dark:text-slate-300">{calculateYearsWorked(teacher.admissionDate)}</td><td className="p-4 text-dark-text dark:text-slate-300">{teacher.email}</td>{(permissions.canEdit || permissions.canDelete) && <td className="p-4"><div className="flex space-x-2">{permissions.canEdit && <Button onClick={() => openModal({ type: 'EDIT_TEACHER', data: teacher })} className="p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-600" title="Editar">{Icons.edit}</Button>}{permissions.canDelete && <Button onClick={() => openModal({ type: 'DELETE_TEACHER', data: teacher })} className="p-2 text-red-500 hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-500/20" title="Eliminar">{Icons.delete}</Button>}</div></td>}</tr>))}</tbody></table></Card></div>);
const SubjectListPage: React.FC<{ subjects: Subject[], teachers: Teacher[], openModal: (modal: any) => void, permissions: Permissions }> = ({ subjects, teachers, openModal, permissions }) => { const getTeacherName = (id?: number) => { if (!id) return 'No asignado'; const teacher = teachers.find(t => t.id === id); return teacher ? `${teacher.name} ${teacher.lastName}` : 'Desconocido'; }; return (<div><PageTitle title="Gestión de Asignaturas">{permissions.canCreate && <Button onClick={() => openModal({ type: 'ADD_SUBJECT' })}>{Icons.plus}<span>Agregar Asignatura</span></Button>}</PageTitle><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{subjects.map(subject => (<Card key={subject.id} className="flex flex-col"><div className="flex-1"><h3 className="font-bold text-lg">{subject.name}</h3><p className="text-sm text-medium-text dark:text-slate-400">{subject.code} - Semestre {subject.semester}</p><p className="mt-2 text-sm dark:text-slate-300">{subject.description}</p><div className="mt-4 pt-4 border-t dark:border-slate-700"><p className="text-sm dark:text-slate-300"><strong>Docente:</strong> {getTeacherName(subject.teacherId)}</p><p className="text-sm dark:text-slate-300"><strong>Créditos:</strong> {subject.credits}</p></div></div>{(permissions.canEdit || permissions.canDelete) && <div className="flex justify-end space-x-2 mt-4">{permissions.canEdit && <Button onClick={() => openModal({ type: 'EDIT_SUBJECT', data: subject })} className="p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-600" title="Editar">{Icons.edit}</Button>}{permissions.canDelete && <Button onClick={() => openModal({ type: 'DELETE_SUBJECT', data: subject })} className="p-2 text-red-500 hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-500/20" title="Eliminar">{Icons.delete}</Button>}</div>}</Card>))}</div></div>);};
const GradeManagerPage: React.FC<{ grades: Grade[], students: Student[], subjects: Subject[], teachers: Teacher[], openModal: (modal: any) => void, permissions: Permissions, currentUser: User }> = ({ grades, students, subjects, teachers, openModal, permissions, currentUser }) => {
    const isStudentView = currentUser.role === 'Alumno';

    const [filters, setFilters] = useState({ 
        studentId: isStudentView ? currentUser.originalId.toString() : '', 
        subjectId: '', 
        teacherId: '', 
        status: '', 
        competencyMin: '', 
        competencyMax: '' 
    });

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const filteredGrades = useMemo(() => {
        return grades.filter(grade => {
            const teacherSubjectIds = filters.teacherId ? subjects.filter(s => s.teacherId === parseInt(filters.teacherId)).map(s => s.id) : [];
            
            const studentMatch = !filters.studentId || grade.studentId === parseInt(filters.studentId);
            const subjectMatch = !filters.subjectId || grade.subjectId === parseInt(filters.subjectId);
            const teacherMatch = !filters.teacherId || teacherSubjectIds.includes(grade.subjectId);
            const statusMatch = !filters.status || (filters.status === 'finalized' && grade.isFinalized) || (filters.status === 'inProgress' && !grade.isFinalized);

            const competencyAvg = calculateCompetencyAverage(grade);
            const min = parseFloat(filters.competencyMin);
            const max = parseFloat(filters.competencyMax);

            const competencyMatch = (competencyAvg === null) 
                ? (isNaN(min) && isNaN(max))
                : ((isNaN(min) || competencyAvg >= min) && (isNaN(max) || competencyAvg <= max));

            return studentMatch && subjectMatch && teacherMatch && statusMatch && competencyMatch;
        });
    }, [grades, subjects, filters]);

    const findStudent = (id: number) => students.find(s => s.id === id);
    const findSubject = (id: number) => subjects.find(s => s.id === id);

    return (
        <div>
            <PageTitle title={isStudentView ? "Mis Calificaciones" : "Gestión de Calificaciones"}>
                {permissions.canCreate && <Button onClick={() => openModal({ type: 'ADD_GRADE' })}>{Icons.plus}<span>Agregar Calificación</span></Button>}
            </PageTitle>
            
            <Card className="mb-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
                    <div>
                        <label className="font-semibold text-sm block mb-1 dark:text-slate-300">Filtrar por Alumno</label>
                        <Select name="studentId" value={filters.studentId} onChange={handleFilterChange} disabled={isStudentView}>
                            {isStudentView 
                                ? <option value={currentUser.originalId}>{currentUser.name} {currentUser.lastName}</option>
                                : <>
                                    <option value="">Todos los Alumnos</option>
                                    {students.map(s => <option key={s.id} value={s.id}>{s.name} {s.lastName}</option>)}
                                  </>
                            }
                        </Select>
                    </div>
                     <div>
                        <label className="font-semibold text-sm block mb-1 dark:text-slate-300">Filtrar por Asignatura</label>
                        <Select name="subjectId" value={filters.subjectId} onChange={handleFilterChange}>
                            <option value="">Todas las Asignaturas</option>
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </Select>
                    </div>
                     <div>
                        <label className="font-semibold text-sm block mb-1 dark:text-slate-300">Filtrar por Docente</label>
                        <Select name="teacherId" value={filters.teacherId} onChange={handleFilterChange}>
                            <option value="">Todos los Docentes</option>
                            {teachers.map(t => <option key={t.id} value={t.id}>{t.name} {t.lastName}</option>)}
                        </Select>
                    </div>
                    <div>
                        <label className="font-semibold text-sm block mb-1 dark:text-slate-300">Filtrar por Estado</label>
                        <Select name="status" value={filters.status} onChange={handleFilterChange}>
                            <option value="">Todos los Estados</option>
                            <option value="finalized">Finalizada</option>
                            <option value="inProgress">En Progreso</option>
                        </Select>
                    </div>
                    <div className="lg:col-span-2">
                        <label className="font-semibold text-sm block mb-1 dark:text-slate-300">Rango Promedio Competencias</label>
                        <div className="flex items-center space-x-2">
                             <Input
                                type="number"
                                name="competencyMin"
                                placeholder="Mín (1.0)"
                                value={filters.competencyMin}
                                onChange={handleFilterChange}
                                step="0.1" min="1" max="7"
                            />
                            <span className="text-slate-500">-</span>
                            <Input
                                type="number"
                                name="competencyMax"
                                placeholder="Máx (7.0)"
                                value={filters.competencyMax}
                                onChange={handleFilterChange}
                                step="0.1" min="1" max="7"
                            />
                        </div>
                    </div>
                </div>
                 <div className="border-t dark:border-slate-700 mt-4 pt-4 flex justify-end space-x-2">
                    <Button onClick={() => exportGradesToPdf(filteredGrades, students, subjects, teachers)} className="bg-red-600 hover:bg-red-700 text-white" disabled={filteredGrades.length === 0}>
                        {Icons.pdf}<span>Exportar a PDF</span>
                    </Button>
                     <Button onClick={() => exportGradesToCsv(filteredGrades, students, subjects, teachers)} className="bg-green-600 hover:bg-green-700 text-white" disabled={filteredGrades.length === 0}>
                        {Icons.excel}<span>Exportar a Excel</span>
                    </Button>
                </div>
            </Card>

            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[1100px]">
                        <thead>
                            <tr className="border-b dark:border-slate-700">
                                {!isStudentView && <th className="p-4 font-semibold text-dark-text dark:text-slate-300 sticky left-0 bg-white dark:bg-secondary z-10 w-48 border-r dark:border-slate-700">Alumno</th>}
                                <th className={`p-4 font-semibold text-dark-text dark:text-slate-300 sticky ${isStudentView ? 'left-0' : 'left-48'} bg-white dark:bg-secondary z-10 w-64 border-r dark:border-slate-700`}>Asignatura</th>
                                <th className="p-4 font-semibold text-center text-dark-text dark:text-slate-300">Promedio Final</th>
                                <th className="p-4 font-semibold text-center text-dark-text dark:text-slate-300">Promedio Comp.</th>
                                <th className="p-4 font-semibold text-dark-text dark:text-slate-300">Estado</th>
                                <th className="p-4 font-semibold text-dark-text dark:text-slate-300">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredGrades.length > 0 ? filteredGrades.map(grade => {
                                const student = findStudent(grade.studentId);
                                const subject = findSubject(grade.subjectId);
                                return (
                                    <tr key={grade.id} className="border-b dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                        {!isStudentView && <td className="p-4 font-medium text-dark-text dark:text-slate-300 sticky left-0 bg-white dark:bg-secondary z-10 border-r dark:border-slate-700">{student?.name} {student?.lastName}</td>}
                                        <td className={`p-4 text-dark-text dark:text-slate-300 sticky ${isStudentView ? 'left-0' : 'left-48'} bg-white dark:bg-secondary z-10 border-r dark:border-slate-700`}>{subject?.name}</td>
                                        <td className="p-4 text-center font-bold text-dark-text dark:text-slate-200">{calculateFinalGrade(grade)}</td>
                                        <td className="p-4 text-center font-medium text-dark-text dark:text-slate-300">{calculateCompetencyAverage(grade)?.toFixed(1) || 'N/A'}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${grade.isFinalized ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'}`}>
                                                {grade.isFinalized ? 'Finalizada' : 'En Progreso'}
                                            </span>
                                        </td>
                                        <td className="p-4 flex space-x-2">
                                            {permissions.canEdit && <Button
                                                onClick={() => openModal({ type: 'EVALUATE_GRADE', data: { grade, student, subject } })}
                                                className="bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                                                disabled={!student || !subject}
                                            >
                                                <span>Evaluar</span>
                                            </Button>}
                                            {permissions.canDelete && <Button onClick={() => openModal({ type: 'DELETE_GRADE', data: grade })} className="p-2 text-red-500 hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-500/20" title="Eliminar">{Icons.delete}</Button>}
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr><td colSpan={isStudentView ? 5 : 6} className="text-center p-8 text-medium-text dark:text-slate-400">No se encontraron calificaciones con los filtros seleccionados.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};
const AnotacionesHistoryPage: React.FC<{ anotaciones: Anotacion[], students: Student[], teachers: Teacher[] }> = ({ anotaciones, students, teachers }) => {
    const [filters, setFilters] = useState({
        studentId: '',
        teacherId: '',
        type: '',
        startDate: '',
        endDate: '',
    });
    const [sortConfig, setSortConfig] = useState<{ key: keyof Anotacion | 'student' | 'author'; direction: 'ascending' | 'descending' }>({ key: 'timestamp', direction: 'descending' });

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    
    const clearFilters = () => {
        setFilters({ studentId: '', teacherId: '', type: '', startDate: '', endDate: '' });
    }

    const requestSort = (key: typeof sortConfig.key) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };
    
    const getStudent = (id: number) => students.find(s => s.id === id);
    const getTeacher = (id: number) => teachers.find(t => t.id === id);

    const filteredAndSortedAnotaciones = useMemo(() => {
        let sortableItems = [...anotaciones];
        
        // Filtering
        sortableItems = sortableItems.filter(item => {
            if (filters.studentId && item.studentId !== parseInt(filters.studentId)) return false;
            if (filters.teacherId && item.autorId !== parseInt(filters.teacherId)) return false;
            if (filters.type && item.type !== filters.type) return false;
            const itemDate = new Date(item.timestamp);
            if (filters.startDate) {
                const filterStartDate = new Date(filters.startDate);
                if (itemDate < filterStartDate) return false;
            }
            if (filters.endDate) {
                const filterEndDate = new Date(filters.endDate);
                filterEndDate.setHours(23, 59, 59, 999); // Include the whole day
                if (itemDate > filterEndDate) return false;
            }
            return true;
        });

        // Sorting
        sortableItems.sort((a, b) => {
            let aValue: any;
            let bValue: any;
            
            if (sortConfig.key === 'student') {
                aValue = getStudent(a.studentId)?.lastName || '';
                bValue = getStudent(b.studentId)?.lastName || '';
            } else if (sortConfig.key === 'author') {
                aValue = getTeacher(a.autorId)?.lastName || '';
                bValue = getTeacher(b.autorId)?.lastName || '';
            } else {
                aValue = a[sortConfig.key as keyof Anotacion];
                bValue = b[sortConfig.key as keyof Anotacion];
            }
            
            if (aValue < bValue) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });
        
        return sortableItems;
    }, [anotaciones, filters, sortConfig]);
    
    const getSortIcon = (key: typeof sortConfig.key) => {
        if (sortConfig.key !== key) return <span className="text-slate-400">↕</span>;
        return sortConfig.direction === 'ascending' ? '▲' : '▼';
    }

    return (
        <div>
            <PageTitle title="Historial de Anotaciones" />
            
            <Card className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="font-semibold text-sm block mb-1 dark:text-slate-300">Alumno</label>
                        <Select name="studentId" value={filters.studentId} onChange={handleFilterChange}><option value="">Todos</option>{students.map(s=><option key={s.id} value={s.id}>{s.name} {s.lastName}</option>)}</Select>
                    </div>
                    <div>
                        <label className="font-semibold text-sm block mb-1 dark:text-slate-300">Autor</label>
                        <Select name="teacherId" value={filters.teacherId} onChange={handleFilterChange}><option value="">Todos</option>{teachers.map(t=><option key={t.id} value={t.id}>{t.name} {t.lastName}</option>)}</Select>
                    </div>
                    <div>
                        <label className="font-semibold text-sm block mb-1 dark:text-slate-300">Tipo</label>
                        <Select name="type" value={filters.type} onChange={handleFilterChange}><option value="">Todos</option><option>Positiva</option><option>Negativa</option><option>Observación</option></Select>
                    </div>
                    <div>
                         <Button onClick={clearFilters} className="bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 w-full">Limpiar Filtros</Button>
                    </div>
                    <div className="lg:col-span-2">
                        <label className="font-semibold text-sm block mb-1 dark:text-slate-300">Rango de Fechas</label>
                        <div className="flex items-center space-x-2">
                            <Input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} max={filters.endDate || ''} />
                            <span className="text-slate-500">-</span>
                            <Input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} min={filters.startDate || ''} />
                        </div>
                    </div>
                </div>
            </Card>

            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b dark:border-slate-700">
                                <th className="p-4 font-semibold text-dark-text dark:text-slate-300">
                                    <button onClick={() => requestSort('timestamp')} className="flex items-center space-x-2"><span>Fecha</span><span>{getSortIcon('timestamp')}</span></button>
                                </th>
                                <th className="p-4 font-semibold text-dark-text dark:text-slate-300">
                                    <button onClick={() => requestSort('student')} className="flex items-center space-x-2"><span>Alumno</span><span>{getSortIcon('student')}</span></button>
                                </th>
                                <th className="p-4 font-semibold text-dark-text dark:text-slate-300">
                                    <button onClick={() => requestSort('author')} className="flex items-center space-x-2"><span>Autor</span><span>{getSortIcon('author')}</span></button>
                                </th>
                                <th className="p-4 font-semibold text-dark-text dark:text-slate-300">
                                     <button onClick={() => requestSort('type')} className="flex items-center space-x-2"><span>Tipo</span><span>{getSortIcon('type')}</span></button>
                                </th>
                                <th className="p-4 font-semibold text-dark-text dark:text-slate-300">Descripción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAndSortedAnotaciones.length > 0 ? filteredAndSortedAnotaciones.map(anotacion => {
                                const student = getStudent(anotacion.studentId);
                                const author = getTeacher(anotacion.autorId);
                                return (
                                    <tr key={anotacion.id} className="border-b dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                        <td className="p-4 text-dark-text dark:text-slate-300 align-top whitespace-nowrap">{new Date(anotacion.timestamp).toLocaleString('es-CL')}</td>
                                        <td className="p-4 text-dark-text dark:text-slate-300 align-top">{student ? `${student.name} ${student.lastName}` : 'Desconocido'}</td>
                                        <td className="p-4 text-dark-text dark:text-slate-300 align-top">{author ? `${author.name} ${author.lastName}` : 'Desconocido'}</td>
                                        <td className="p-4 text-dark-text dark:text-slate-300 align-top">
                                             <span className={`px-2 py-1 text-xs font-semibold rounded-full ${ anotacion.type === 'Positiva' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : anotacion.type === 'Negativa' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' }`}>
                                                {anotacion.type}
                                            </span>
                                        </td>
                                        <td className="p-4 text-dark-text dark:text-slate-300 align-top min-w-[300px]">{anotacion.text}</td>
                                    </tr>
                                );
                            }) : (
                                <tr><td colSpan={5} className="text-center p-8 text-medium-text dark:text-slate-400">No se encontraron anotaciones con los filtros seleccionados.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

const CalendarPage: React.FC<{ calendarEvents: CalendarEvent[], openModal: (modal: any) => void, permissions: Permissions }> = ({ calendarEvents, openModal, permissions }) => { const [currentDate, setCurrentDate] = useState(new Date()); const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1); const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0); const startDay = startOfMonth.getDay(); const daysInMonth = endOfMonth.getDate(); const days = Array.from({ length: startDay === 0 ? 6 : startDay - 1 }, () => null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1)); const eventsByDate = useMemo(() => { const map = new Map<number, CalendarEvent[]>(); calendarEvents.forEach(event => { if (event.start.getMonth() === currentDate.getMonth() && event.start.getFullYear() === currentDate.getFullYear()) { const day = event.start.getDate(); if (!map.has(day)) map.set(day, []); map.get(day)?.push(event); } }); return map; }, [calendarEvents, currentDate]); const changeMonth = (offset: number) => { setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1)); }; return (<div><PageTitle title="Calendario Académico"><div className="flex items-center space-x-4"><div className="flex items-center space-x-2"><Button onClick={() => changeMonth(-1)} className="bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600">‹</Button><h3 className="text-xl font-semibold w-48 text-center">{currentDate.toLocaleString('es-CL', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())}</h3><Button onClick={() => changeMonth(1)} className="bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600">›</Button></div>{permissions.canCreate &&<Button onClick={() => openModal({ type: 'ADD_EVENT' })}>{Icons.plus}<span>Agregar Evento</span></Button>}</div></PageTitle><Card><div className="grid grid-cols-7 text-center font-bold text-medium-text dark:text-slate-400">{['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => <div key={day} className="py-2">{day}</div>)}</div><div className="grid grid-cols-7 border-t border-l dark:border-slate-700">{days.map((day, index) => (<div key={index} className="h-36 border-r border-b dark:border-slate-700 p-2 flex flex-col">{day && <span className="font-semibold">{day}</span>}<div className="flex-1 overflow-y-auto text-xs space-y-1 mt-1">{day && eventsByDate.get(day)?.map(event => (<div key={event.id} className={`p-1 rounded border-l-4 ${getEventTypeStyles(event.type)}`}>{event.title}</div>))}</div></div>))}</div></Card></div>) };
const NewsPage: React.FC<{ news: NewsArticle[], openModal: (modal: any) => void, permissions: Permissions }> = ({ news, openModal, permissions }) => ( <div><PageTitle title="Noticias y Anuncios">{permissions.canCreate && <Button onClick={() => openModal({ type: 'ADD_NEWS' })}>{Icons.plus}<span>Agregar Noticia</span></Button>}</PageTitle><div className="grid grid-cols-1 md:grid-cols-2 gap-8">{news.map(article => ( <Card key={article.id}><img src={article.imageUrl} alt={article.title} className="w-full h-48 object-cover rounded-t-lg mb-4" /><h3 className="text-xl font-bold">{article.title}</h3><p className="text-xs text-medium-text dark:text-slate-400 mt-1 mb-2">{article.author} - {article.date.toLocaleDateString('es-CL')}</p><p className="text-dark-text dark:text-slate-300">{article.content}</p>{article.link && <a href={article.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline mt-2 inline-block">{article.linkText || 'Leer más'}</a>}{(permissions.canEdit || permissions.canDelete) && <div className="flex justify-end space-x-2 mt-4">{permissions.canEdit && <Button onClick={() => openModal({ type: 'EDIT_NEWS', data: article })} className="p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-600" title="Editar">{Icons.edit}</Button>}{permissions.canDelete && <Button onClick={() => openModal({ type: 'DELETE_NEWS', data: article })} className="p-2 text-red-500 hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-500/20" title="Eliminar">{Icons.delete}</Button>}</div>}</Card>))}</div></div> );
const OfficialDocumentsPage: React.FC<{ officialDocuments: OfficialDocument[] }> = ({ officialDocuments }) => ( <div><PageTitle title="Documentos Oficiales" /><Card><table className="w-full text-left"><thead><tr className="border-b dark:border-slate-700"><th className="p-4 font-semibold text-dark-text dark:text-slate-300">Título</th><th className="p-4 font-semibold text-dark-text dark:text-slate-300">Descripción</th><th className="p-4 font-semibold text-dark-text dark:text-slate-300">Fecha de Subida</th><th className="p-4 font-semibold text-dark-text dark:text-slate-300">Autor</th><th className="p-4 font-semibold text-dark-text dark:text-slate-300">Acciones</th></tr></thead><tbody>{officialDocuments.map(doc => (<tr key={doc.id} className="border-b dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/50"><td className="p-4 font-medium text-dark-text dark:text-slate-300">{doc.title}</td><td className="p-4 text-dark-text dark:text-slate-300">{doc.description}</td><td className="p-4 text-dark-text dark:text-slate-300">{doc.uploadDate.toLocaleDateString('es-CL')}</td><td className="p-4 text-dark-text dark:text-slate-300">{doc.author}</td><td className="p-4"><a href={doc.file.url} target="_blank" rel="noreferrer" className="flex items-center space-x-2 px-4 py-2 rounded-md bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 font-semibold transition-colors duration-200">{Icons.view}<span>Ver</span></a></td></tr>))}</tbody></table></Card></div> );
const MeetingRecordsPage: React.FC<{ meetingRecords: MeetingRecord[], students: Student[], teachers: Teacher[], openModal: (modal: any) => void, permissions: Permissions }> = ({ meetingRecords, students, teachers, openModal, permissions }) => { const getAttendees = (record: MeetingRecord) => { const teacherNames = record.attendees.teachers.map(id => teachers.find(t => t.id === id)?.name).filter(Boolean).join(', '); const studentNames = record.attendees.students.map(id => students.find(s => s.id === id)?.name).filter(Boolean).join(', '); return `Docentes: ${teacherNames || 'N/A'}. Alumnos: ${studentNames || 'N/A'}.`; }; return ( <div><PageTitle title="Registro de Reuniones">{permissions.canCreate && <Button onClick={() => openModal({ type: 'ADD_MEETING_RECORD' })}>{Icons.plus}<span>Registrar Reunión</span></Button>}</PageTitle><div className="space-y-6">{meetingRecords.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(record => (<Card key={record.id}><div className="flex justify-between items-start"><div className="flex-1"><h3 className="font-bold text-lg">{record.title}</h3><p className="text-sm text-medium-text dark:text-slate-400">{new Date(record.date).toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} | {record.startTime} - {record.endTime}</p><p className="mt-4 dark:text-slate-300">{record.details}</p><p className="text-sm mt-2"><strong className="text-dark-text dark:text-slate-200">Asistentes:</strong> <span className="text-medium-text dark:text-slate-400">{getAttendees(record)}</span></p>{record.streamingLink && <a href={record.streamingLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm mt-2 inline-block">Ver Grabación</a>}</div>{(permissions.canEdit || permissions.canDelete) && <div className="flex space-x-2 ml-4">{permissions.canEdit && <Button onClick={() => openModal({ type: 'EDIT_MEETING_RECORD', data: record })} className="p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-600" title="Editar">{Icons.edit}</Button>}{permissions.canDelete && <Button onClick={() => openModal({ type: 'DELETE_MEETING_RECORD', data: record })} className="p-2 text-red-500 hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-500/20" title="Eliminar">{Icons.delete}</Button>}</div>}</div></Card>))}</div></div> ); };
// --- APP ---
const App: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [currentView, setCurrentView] = useState<View>('DASHBOARD');
    const [modal, setModal] = useState<any>(null);

    // Data states
    const [students, setStudents] = useState<Student[]>(initialStudents);
    const [teachers, setTeachers] = useState<Teacher[]>(initialTeachers);
    const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
    const [grades, setGrades] = useState<Grade[]>(initialGrades);
    const [activityLog, setActivityLog] = useState<ActivityLog[]>(initialActivityLog);
    const [anotaciones, setAnotaciones] = useState<Anotacion[]>(initialAnotaciones);
    const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(initialCalendarEvents);
    const [news, setNews] = useState<NewsArticle[]>(initialNewsArticles);
    const [gradeReports, setGradeReports] = useState<GradeReport[]>(initialGradeReports);
    const [officialDocuments, setOfficialDocuments] = useState<OfficialDocument[]>(initialOfficialDocuments);
    const [meetingRecords, setMeetingRecords] = useState<MeetingRecord[]>(initialMeetingRecords);
    const [professionalActivities, setProfessionalActivities] = useState<ProfessionalActivity[]>(initialProfessionalActivities);
    const [teacherProfessionalActivities, setTeacherProfessionalActivities] = useState<TeacherProfessionalActivity[]>(initialTeacherProfessionalActivities);
    const [personalDocuments, setPersonalDocuments] = useState<PersonalDocument[]>(initialPersonalDocuments);
    const [siteLog, setSiteLog] = useState<SiteLog[]>(initialSiteLog);
    const [quickLinks, setQuickLinks] = useState<QuickLink[]>(initialQuickLinks);
    const [surveys, setSurveys] = useState<Survey[]>(initialSurveys);
    const [generalSurveys, setGeneralSurveys] = useState<GeneralSurvey[]>(initialGeneralSurveys);
    const [surveyAssignments, setSurveyAssignments] = useState<SurveyAssignment[]>(initialSurveyAssignments);
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [currentUser, setCurrentUser] = useState<User>(users.find(u => u.role === 'Administrador') || users[0]);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'system');

     // Permission logic
    const permissions: Permissions = useMemo(() => {
        const adminViews: View[] = ['DASHBOARD', 'STUDENTS', 'TEACHERS', 'SUBJECTS', 'GRADES', 'ANOTACIONES_HISTORY', 'STUDENT_FILES', 'TEACHER_FILES', 'CALENDAR', 'NEWS', 'DOCUMENTS', 'MEETINGS', 'SITE_MANAGEMENT', 'SURVEYS'];
        const teacherViews: View[] = ['DASHBOARD', 'STUDENTS', 'SUBJECTS', 'GRADES', 'ANOTACIONES_HISTORY', 'STUDENT_FILES', 'TEACHER_FILES', 'CALENDAR', 'NEWS', 'DOCUMENTS', 'MEETINGS', 'SURVEYS'];
        const studentViews: View[] = ['DASHBOARD', 'GRADES', 'STUDENT_FILES', 'CALENDAR', 'NEWS', 'DOCUMENTS'];

        switch (currentUser.role) {
            case 'Administrador':
                return { canCreate: true, canEdit: true, canDelete: true, views: adminViews };
            case 'Docente':
                return { canCreate: true, canEdit: true, canDelete: false, views: teacherViews };
            case 'Alumno':
                return { canCreate: false, canEdit: false, canDelete: false, views: studentViews };
            default:
                return { canCreate: false, canEdit: false, canDelete: false, views: [] };
        }
    }, [currentUser]);

    useEffect(() => {
        if (!permissions.views.includes(currentView)) {
            setCurrentView('DASHBOARD');
        }
    }, [permissions, currentView]);

    const handleLogAction = (action: string, description: string) => {
        const newLogEntry: SiteLog = {
            id: siteLog.length + 1,
            timestamp: new Date(),
            user: `${currentUser.name} ${currentUser.lastName} (${currentUser.role})`,
            action,
            description
        };
        setSiteLog(prev => [newLogEntry, ...prev]);
    }
    
    // Handlers
    const handleSaveStudent = (student: Student) => {
        if (student.id === 0) { // New student
            const newStudent = { ...student, id: students.length + 1 };
            setStudents([...students, newStudent]);
            handleLogAction("Crear Alumno", `Se creó el alumno: ${newStudent.name} ${newStudent.lastName}`);
        } else { // Edit student
            setStudents(students.map(s => s.id === student.id ? student : s));
            handleLogAction("Editar Alumno", `Se editó el alumno: ${student.name} ${student.lastName}`);
        }
        setModal(null);
    };
    const handleDeleteStudent = (student: Student) => { setStudents(students.filter(s => s.id !== student.id)); handleLogAction("Eliminar Alumno", `Se eliminó el alumno: ${student.name} ${student.lastName}`); setModal(null); };
    
    const handleSaveTeacher = (teacher: Teacher) => {
        if (teacher.id === 0) {
            const newTeacher = { ...teacher, id: teachers.length + 1 };
            setTeachers([...teachers, newTeacher]);
            handleLogAction("Crear Docente", `Se creó el docente: ${newTeacher.name} ${newTeacher.lastName}`);
        } else {
            setTeachers(teachers.map(t => t.id === teacher.id ? teacher : t));
            handleLogAction("Editar Docente", `Se editó el docente: ${teacher.name} ${teacher.lastName}`);
        }
        setModal(null);
    };
    const handleDeleteTeacher = (teacher: Teacher) => { setTeachers(teachers.filter(t => t.id !== teacher.id)); handleLogAction("Eliminar Docente", `Se eliminó el docente: ${teacher.name} ${teacher.lastName}`); setModal(null); };
    
    const handleSaveSubject = (subject: Subject) => {
        if (subject.id === 0) {
            const newSubject = { ...subject, id: subjects.length + 1 };
            setSubjects([...subjects, newSubject]);
            handleLogAction("Crear Asignatura", `Se creó la asignatura: ${newSubject.name}`);
        } else {
            setSubjects(subjects.map(s => s.id === subject.id ? subject : s));
            handleLogAction("Editar Asignatura", `Se editó la asignatura: ${subject.name}`);
        }
        setModal(null);
    };
    const handleDeleteSubject = (subject: Subject) => { setSubjects(subjects.filter(s => s.id !== subject.id)); handleLogAction("Eliminar Asignatura", `Se eliminó la asignatura: ${subject.name}`); setModal(null); };

    const handleAddGrade = (studentId: number, subjectId: number) => {
        if (grades.some(g => g.studentId === studentId && g.subjectId === subjectId)) {
            alert('Este alumno ya tiene una calificación para esta asignatura.');
            return;
        }
        const newGrade: Grade = {
            id: grades.length + 1,
            studentId,
            subjectId,
            competencyScores: [],
            lastModified: new Date().toISOString(),
            isFinalized: false
        };
        setGrades([...grades, newGrade]);
        const student = students.find(s=>s.id === studentId);
        const subject = subjects.find(s=>s.id === subjectId);
        handleLogAction("Crear Calificación", `Se creó una entrada de calificación para ${student?.name} ${student?.lastName} en ${subject?.name}`);
        setModal(null);
    };
    const handleDeleteGrade = (grade: Grade) => { setGrades(grades.filter(g => g.id !== grade.id)); handleLogAction("Eliminar Calificación", `Se eliminó una entrada de calificación (ID: ${grade.id})`); setModal(null); };
    
    const handleSaveEvaluation = (grade: Grade, summary: GradeReport['gradeSummary'], scores: (number | null)[], feedback: string) => {
        const updatedGrade = { ...grade, grade1: summary.grade1, grade2: summary.grade2, grade3: summary.grade3, competencyScores: scores, lastModified: new Date().toISOString(), isFinalized: true };
        setGrades(grades.map(g => g.id === grade.id ? updatedGrade : g));

        const newReport: GradeReport = {
            id: gradeReports.length + 1,
            gradeId: grade.id,
            studentId: grade.studentId,
            subjectId: grade.subjectId,
            teacherId: subjects.find(s => s.id === grade.subjectId)?.teacherId,
            generationDate: new Date(),
            gradeSummary: summary,
            competencyScores: scores,
            feedback: feedback,
            status: 'Pendiente Aceptación',
            signatureDate: new Date() // Docente firma al generar
        };
        setGradeReports(prev => [...prev.filter(r => r.gradeId !== grade.id), newReport]);
        const student = students.find(s=>s.id === grade.studentId);
        handleLogAction("Generar Informe", `Se generó un informe de evaluación para ${student?.name} ${student?.lastName}`);
        setModal(null);
    };

    const handleAcceptReport = (reportId: number) => {
        setGradeReports(gradeReports.map(r => r.id === reportId ? { ...r, status: 'Completado', studentAcceptanceDate: new Date() } : r));
        setModal(null);
    };

    const handleSaveAnotacion = (anotacion: Anotacion) => {
        const newAnotacion = { ...anotacion, id: anotaciones.length + 1, autorId: currentUser.originalId };
        setAnotaciones([newAnotacion, ...anotaciones]);
        const student = students.find(s=>s.id === anotacion.studentId);
        handleLogAction("Crear Anotación", `Se creó una anotación para ${student?.name} ${student?.lastName}`);
        setModal(null);
    };

    const handleSavePersonalDocument = (doc: PersonalDocument) => {
        const newDoc = { ...doc, id: personalDocuments.length + 1 };
        setPersonalDocuments([newDoc, ...personalDocuments]);
        handleLogAction("Subir Documento Personal", `Se subió el documento "${newDoc.title}"`);
        setModal(null);
    };

    const handleSaveProfessionalActivity = (activity: ProfessionalActivity | TeacherProfessionalActivity) => {
        if ('studentId' in activity) {
            const newActivity = { ...activity, id: professionalActivities.length + 1 };
            setProfessionalActivities([newActivity, ...professionalActivities]);
            handleLogAction("Agregar Actividad", `Se agregó una actividad para el alumno ID ${activity.studentId}`);
        } else {
            const newActivity = { ...activity, id: teacherProfessionalActivities.length + 1 };
            setTeacherProfessionalActivities([newActivity, ...teacherProfessionalActivities]);
            handleLogAction("Agregar Actividad", `Se agregó una actividad para el docente ID ${activity.teacherId}`);
        }
        setModal(null);
    };

    const handleSaveEvent = (event: CalendarEvent) => {
        if (event.id) {
            setCalendarEvents(calendarEvents.map(e => e.id === event.id ? event : e));
            handleLogAction("Editar Evento", `Se editó el evento: ${event.title}`);
        } else {
            const newEvent = { ...event, id: calendarEvents.length + 1 };
            setCalendarEvents([...calendarEvents, newEvent]);
            handleLogAction("Crear Evento", `Se creó el evento: ${newEvent.title}`);
        }
        setModal(null);
    };

    const handleSaveNews = (article: NewsArticle) => {
        if (article.id) {
            setNews(news.map(n => n.id === article.id ? article : n));
             handleLogAction("Editar Noticia", `Se editó la noticia: ${article.title}`);
        } else {
            const newArticle = { ...article, id: news.length + 1 };
            setNews([newArticle, ...news]);
             handleLogAction("Crear Noticia", `Se creó la noticia: ${newArticle.title}`);
        }
        setModal(null);
    };
    const handleDeleteNews = (article: NewsArticle) => { setNews(news.filter(n => n.id !== article.id)); handleLogAction("Eliminar Noticia", `Se eliminó la noticia: ${article.title}`); setModal(null); };
    
    const handleSaveMeetingRecord = (record: MeetingRecord) => {
        if (record.id) {
            setMeetingRecords(meetingRecords.map(r => r.id === record.id ? record : r));
            handleLogAction("Editar Reunión", `Se editó la reunión: ${record.title}`);
        } else {
            const newRecord = { ...record, id: meetingRecords.length + 1 };
            setMeetingRecords([newRecord, ...meetingRecords]);
            handleLogAction("Crear Reunión", `Se registró la reunión: ${newRecord.title}`);
        }
        setModal(null);
    };
    const handleDeleteMeetingRecord = (record: MeetingRecord) => { setMeetingRecords(meetingRecords.filter(r => r.id !== record.id)); handleLogAction("Eliminar Reunión", `Se eliminó la reunión: ${record.title}`); setModal(null); };

    const handleSaveQuickLink = (link: QuickLink) => {
        if (link.id) {
            setQuickLinks(quickLinks.map(l => l.id === link.id ? link : l));
            handleLogAction("Editar Enlace", `Se editó el enlace: ${link.label}`);
        } else {
            const newLink = { ...link, id: quickLinks.length + 1 };
            setQuickLinks([...quickLinks, newLink]);
            handleLogAction("Crear Enlace", `Se creó el enlace: ${newLink.label}`);
        }
        setModal(null);
    };
    const handleDeleteQuickLink = (link: QuickLink) => { setQuickLinks(quickLinks.filter(l => l.id !== link.id)); handleLogAction("Eliminar Enlace", `Se eliminó el enlace: ${link.label}`); setModal(null); };
    
    const handleSaveRotationSurvey = (survey: Survey, answers: SurveyAnswer[]) => {
        // This is for completing an internal survey (rotation or general)
        // If it was a general survey assignment, we update that instead
        const generalAssignment = surveyAssignments.find(a => a.id === survey.id && a.userId === `student-${survey.studentId}`);

        if (generalAssignment) {
             setSurveyAssignments(surveyAssignments.map(a => a.id === generalAssignment.id ? { ...a, answers, status: 'Completada', completionDate: new Date().toISOString() } : a));
             handleLogAction("Completar Encuesta", `El usuario ${currentUser.name} completó la encuesta general ID ${generalAssignment.surveyId}`);
        } else {
            // This is a rotation-specific survey tied to a Grade
            const completedSurvey = { ...survey, answers, status: 'Completada', completionDate: new Date().toISOString() } as Survey;
             if (surveys.some(s => s.id === survey.id)) {
                setSurveys(surveys.map(s => s.id === survey.id ? completedSurvey : s));
            } else {
                setSurveys([...surveys, completedSurvey]);
            }
            handleLogAction("Completar Encuesta", `El alumno ${students.find(s=>s.id === survey.studentId)?.name} completó la encuesta de rotación`);
        }
        setModal(null);
    };

    const handleSaveGeneralSurvey = (survey: GeneralSurvey) => {
        if (survey.id) {
            setGeneralSurveys(generalSurveys.map(s => s.id === survey.id ? survey : s));
             handleLogAction("Editar Encuesta General", `Se editó la encuesta: ${survey.title}`);
        } else {
            const newSurvey = { ...survey, id: generalSurveys.length + 1 };
            setGeneralSurveys([...generalSurveys, newSurvey]);
            handleLogAction("Crear Encuesta General", `Se creó la encuesta: ${newSurvey.title}`);
        }
        setModal(null);
    };

    const handleDeleteGeneralSurvey = (survey: GeneralSurvey) => {
        setGeneralSurveys(generalSurveys.filter(s => s.id !== survey.id));
        setSurveyAssignments(surveyAssignments.filter(a => a.surveyId !== survey.id)); // Also remove assignments
        handleLogAction("Eliminar Encuesta General", `Se eliminó la encuesta: ${survey.title}`);
        setModal(null);
    };

    const handleAssignSurvey = (surveyId: number, userIds: string[]) => {
        const existingUserIds = new Set(
            surveyAssignments.filter(a => a.surveyId === surveyId).map(a => a.userId)
        );
        const newAssignments = userIds
            .filter(userId => !existingUserIds.has(userId))
            .map((userId, index) => ({
                id: surveyAssignments.length + index + 1,
                surveyId,
                userId,
                status: 'Incompleta' as const,
                answers: [],
            }));
    
        if (newAssignments.length > 0) {
            setSurveyAssignments(prev => [...prev, ...newAssignments]);
            handleLogAction("Asignar Encuesta", `Se asignó la encuesta ID ${surveyId} a ${newAssignments.length} usuarios.`);
        }
        setModal(null);
    };
    
    const handleUpdateUserRole = (userId: string, role: Role) => {
        setUsers(users.map(u => u.id === userId ? { ...u, role } : u));
        const user = users.find(u => u.id === userId);
        if (user) {
            handleLogAction("Actualizar Rol", `Se actualizó el rol de ${user.name} ${user.lastName} a ${role}`);
        }
    };
    
    const handleSearchResultSelect = (item: any, type: string) => {
        switch(type) {
            case 'student':
                setCurrentView('STUDENT_FILES');
                // The StudentFilesPage component handles selection from its list.
                // A better implementation would pass the selected student directly,
                // but this requires significant state management changes (e.g., context).
                // For now, simply switching the view is the implemented behavior.
                break;
            case 'teacher':
                 setCurrentView('TEACHER_FILES');
                break;
            case 'subject':
                setCurrentView('SUBJECTS');
                break;
        }
    }


    useEffect(() => {
        const root = window.document.documentElement;
        const isDark =
            theme === 'dark' ||
            (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        
        root.classList.toggle('dark', isDark);
        localStorage.setItem('theme', theme);
    }, [theme]);
    
    // Simulate initial loading
    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 1500);
        return () => clearTimeout(timer);
    }, []);

    if (isLoading) {
        return <LoadingScreen />;
    }
    
    const openModal = (modalConfig: any) => setModal(modalConfig);
    const closeModal = () => setModal(null);
    
    const renderModal = () => {
        if (!modal) return null;
        switch (modal.type) {
            case 'ADD_STUDENT': return <StudentFormModal onSave={handleSaveStudent} onClose={closeModal} />;
            case 'EDIT_STUDENT': return <StudentFormModal student={modal.data} onSave={handleSaveStudent} onClose={closeModal} />;
            case 'DELETE_STUDENT': return <ConfirmDeleteModal onConfirm={() => handleDeleteStudent(modal.data)} onCancel={closeModal} title="Eliminar Alumno" message={`¿Está seguro que desea eliminar a ${modal.data.name} ${modal.data.lastName}? Esta acción no se puede deshacer.`} />;
            case 'ADD_TEACHER': return <TeacherFormModal onSave={handleSaveTeacher} onClose={closeModal} />;
            case 'EDIT_TEACHER': return <TeacherFormModal teacher={modal.data} onSave={handleSaveTeacher} onClose={closeModal} />;
            case 'DELETE_TEACHER': return <ConfirmDeleteModal onConfirm={() => handleDeleteTeacher(modal.data)} onCancel={closeModal} title="Eliminar Docente" message={`¿Está seguro que desea eliminar a ${modal.data.name} ${modal.data.lastName}?`} />;
            case 'ADD_SUBJECT': return <SubjectFormModal teachers={teachers} onSave={handleSaveSubject} onClose={closeModal} />;
            case 'EDIT_SUBJECT': return <SubjectFormModal subject={modal.data} teachers={teachers} onSave={handleSaveSubject} onClose={closeModal} />;
            case 'DELETE_SUBJECT': return <ConfirmDeleteModal onConfirm={() => handleDeleteSubject(modal.data)} onCancel={closeModal} title="Eliminar Asignatura" message={`¿Está seguro que desea eliminar la asignatura ${modal.data.name}?`} />;
            case 'ADD_GRADE': return <AddGradeModal students={students} subjects={subjects} onSave={handleAddGrade} onClose={closeModal} />;
            case 'DELETE_GRADE': return <ConfirmDeleteModal onConfirm={() => handleDeleteGrade(modal.data)} onCancel={closeModal} title="Eliminar Calificación" message="¿Está seguro que desea eliminar esta entrada de calificación?" />;
            case 'EVALUATE_GRADE': return <EvaluationModal grade={modal.data.grade} student={modal.data.student} subject={modal.data.subject} onSave={handleSaveEvaluation} onClose={closeModal} />;
            case 'VIEW_REPORT': return <ReportViewerModal report={modal.data.report} student={modal.data.student} subject={modal.data.subject} onAccept={handleAcceptReport} onClose={closeModal} />;
            case 'ADD_ANOTACION': return <AnotacionFormModal studentId={modal.data.studentId} autorId={currentUser.originalId} onSave={handleSaveAnotacion} onClose={closeModal} />;
            case 'ADD_PERSONAL_DOCUMENT': return <PersonalDocumentFormModal ownerId={modal.data.ownerId} ownerType={modal.data.ownerType} onSave={handleSavePersonalDocument} onClose={closeModal} />;
            case 'ADD_PROFESSIONAL_ACTIVITY': return <ProfessionalActivityFormModal personId={modal.data.personId} personType={modal.data.personType} onSave={handleSaveProfessionalActivity} onClose={closeModal} />;
            case 'ADD_EVENT': return <CalendarEventFormModal onSave={handleSaveEvent} onClose={closeModal} />;
            case 'EDIT_EVENT': return <CalendarEventFormModal event={modal.data} onSave={handleSaveEvent} onClose={closeModal} />;
            case 'ADD_NEWS': return <NewsArticleFormModal onSave={handleSaveNews} onClose={closeModal} />;
            case 'EDIT_NEWS': return <NewsArticleFormModal article={modal.data} onSave={handleSaveNews} onClose={closeModal} />;
            case 'DELETE_NEWS': return <ConfirmDeleteModal onConfirm={() => handleDeleteNews(modal.data)} onCancel={closeModal} title="Eliminar Noticia" message={`¿Está seguro de que desea eliminar la noticia "${modal.data.title}"?`} />;
            case 'ADD_MEETING_RECORD': return <MeetingRecordFormModal students={students} teachers={teachers} onSave={handleSaveMeetingRecord} onClose={closeModal} />;
            case 'EDIT_MEETING_RECORD': return <MeetingRecordFormModal record={modal.data} students={students} teachers={teachers} onSave={handleSaveMeetingRecord} onClose={closeModal} />;
            case 'DELETE_MEETING_RECORD': return <ConfirmDeleteModal onConfirm={() => handleDeleteMeetingRecord(modal.data)} onCancel={closeModal} title="Eliminar Reunión" message={`¿Está seguro de que desea eliminar el registro de la reunión "${modal.data.title}"?`} />;
            case 'ADD_QUICK_LINK': return <QuickLinkFormModal onSave={handleSaveQuickLink} onClose={closeModal} />;
            case 'EDIT_QUICK_LINK': return <QuickLinkFormModal link={modal.data} onSave={handleSaveQuickLink} onClose={closeModal} />;
            case 'DELETE_QUICK_LINK': return <ConfirmDeleteModal onConfirm={() => handleDeleteQuickLink(modal.data)} onCancel={closeModal} title="Eliminar Enlace Rápido" message={`¿Está seguro de que desea eliminar el enlace "${modal.data.label}"?`} />;
            case 'FILL_ROTATION_SURVEY': return <SurveyFormModal survey={modal.data.survey} student={modal.data.student} subject={modal.data.subject} onSave={handleSaveRotationSurvey} onClose={closeModal} />;
            case 'VIEW_SURVEY_ANSWERS': return <SurveyFormModal survey={modal.data.survey} student={modal.data.student} subject={modal.data.subject} onSave={() => {}} onClose={closeModal} />;
            case 'ADD_GENERAL_SURVEY': return <GeneralSurveyFormModal onSave={handleSaveGeneralSurvey} onClose={closeModal} />;
            case 'EDIT_GENERAL_SURVEY': return <GeneralSurveyFormModal survey={modal.data} onSave={handleSaveGeneralSurvey} onClose={closeModal} />;
            case 'DELETE_GENERAL_SURVEY': return <ConfirmDeleteModal onConfirm={() => handleDeleteGeneralSurvey(modal.data)} onCancel={closeModal} title="Eliminar Encuesta" message={`¿Está seguro que desea eliminar la encuesta "${modal.data.title}"? Se eliminarán también todas sus asignaciones.`} />;
            case 'ASSIGN_SURVEY': return <AssignSurveyModal survey={modal.data} users={users} onSave={handleAssignSurvey} onClose={closeModal} />;
            default: return null;
        }
    };

    const viewData = {
        students,
        teachers,
        subjects,
        grades,
        activityLog,
        anotaciones,
        calendarEvents,
        news,
        gradeReports,
        officialDocuments,
        meetingRecords,
        professionalActivities,
        teacherProfessionalActivities,
        personalDocuments,
        siteLog,
        quickLinks,
        surveys,
        generalSurveys,
        surveyAssignments,
        users,
        openModal,
        permissions,
        currentUser
    };

    return (
        <div className="flex h-screen bg-light-bg dark:bg-slate-900 text-dark-text dark:text-slate-300">
            <Sidebar currentView={currentView} setCurrentView={setCurrentView} permissions={permissions} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header 
                    user={currentUser} 
                    allUsers={users}
                    onUserChange={(userId) => setCurrentUser(users.find(u => u.id === userId)!)}
                    students={students}
                    teachers={teachers}
                    subjects={subjects}
                    onSearchResultSelect={handleSearchResultSelect}
                    theme={theme}
                    setTheme={setTheme}
                />
                <main className="flex-1 overflow-y-auto p-8">
                    <RenderView view={currentView} data={viewData} />
                </main>
            </div>
            {renderModal()}
        </div>
    );
};

export default App;
