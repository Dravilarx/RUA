
import React, { useState, useEffect, useMemo } from 'react';
import { initialStudents, initialTeachers, initialSubjects, initialGrades, initialActivityLog, initialAnotaciones, initialCalendarEvents, initialNewsArticles, initialGradeReports, initialOfficialDocuments, initialMeetingRecords, initialProfessionalActivities, initialTeacherProfessionalActivities, initialPersonalDocuments, initialSiteLog, initialQuickLinks, initialSurveys, surveyQuestions, initialUsers } from './data';
import type { Student, Teacher, Subject, Grade, ActivityLog, Anotacion, CalendarEvent, NewsArticle, GradeReport, OfficialDocument, MeetingRecord, ProfessionalActivity, TeacherProfessionalActivity, PersonalDocument, ActivityType, TeacherActivityType, SiteLog, QuickLink, Survey, SurveyAnswer, User, Role } from './types';

// @ts-ignore
const { jsPDF } = window.jspdf;

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
            finalY = doc.lastAutoTable.finalY + 15;
        }

        // Annotations section
        if (anotaciones.length > 0) {
            doc.setFontSize(16);
            doc.text("Anotaciones", 15, finalY - 5);
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
            finalY = doc.lastAutoTable.finalY + 15;
        }

        // Activities section
        if (activities.length > 0) {
            doc.setFontSize(16);
            doc.text("Actividades Profesionales", 15, finalY - 5);
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
            finalY = doc.lastAutoTable.finalY + 15;
        }

    } else { // Teacher
        if (activities.length > 0) {
            doc.setFontSize(16);
            doc.text("Actividades Profesionales", 15, finalY - 5);
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

const validateField = (name: string, value: string): string => {
    if (!value) return 'Este campo es requerido.';
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
    }
    return '';
};


// --- Helper Components & Icons ---
const Icon = ({ path, className = 'w-6 h-6' }: { path: string; className?: string }) => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path d={path} /></svg> );
const Icons = { dashboard: <Icon path="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />, students: <Icon path="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />, teachers: <Icon path="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />, subjects: <Icon path="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />, grades: <Icon path="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />, studentFile: <Icon path="M3 5v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H5c-1.11 0-2 .9-2 2zm12 4c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3zm-9 8c0-2 4-3.1 6-3.1s6 1.1 6 3.1v1H6v-1z" />, teacherFile: <Icon path="M3 5v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H5c-1.11 0-2 .9-2 2zm12 4c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3zm-9 8c0-2 4-3.1 6-3.1s6 1.1 6 3.1v1H6v-1z" />, calendar: <Icon path="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z" />, news: <Icon path="M4 5v14h16V5H4zm2 12H6v-2h2v2zm0-4H6v-2h2v2zm0-4H6V7h2v2zm12 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2zm-4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2zm-4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z" />, documents: <Icon path="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />, meetings: <Icon path="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />, site_management: <Icon path="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49.42l.38-2.65c.61-.25 1.17-.59-1.69.98l2.49 1c.23.09.49 0 .61.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z" />, surveys: <Icon path="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-2 14h-2v-2h2v2zm0-4h-2V9h2v3zm4-2h-2V7h2v3z" />, logout: <Icon path="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />, plus: <Icon path="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />, edit: <Icon path="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />, delete: <Icon path="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />, download: <Icon path="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />, view: <Icon path="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5zm0 12.5c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />, pdf: <Icon path="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm-2.5.5h1v-1h-1v1zm7 4.5h-3V9h1.5v3H16v-3h1.5v6zm-7-4.5H13v-1H9.5v1z" className='w-5 h-5'/>, excel: <Icon path="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9.5 14.5h-2l-1-2.25L5.5 14.5h-2L6 11l-2.5-3.5h2l1 2.25L7.5 7.5h2L7 11l2.5 3.5zm7 0h-1.5v-1.5h-3V16H10V7.5h1.5v1.5h3V7.5H16v7z" className='w-5 h-5'/>, link: <Icon path="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />, search: <Icon path="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" /> };
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => ( <div className={`bg-white rounded-lg shadow p-6 ${className}`}>{children}</div> );
const Button: React.FC<{ children: React.ReactNode; onClick?: () => void; className?: string; type?: 'button' | 'submit' | 'reset'; disabled?: boolean; [key: string]: any; }> = ({ children, onClick, className = 'bg-primary hover:bg-primary-hover text-white', type = 'button', disabled = false, ...props }) => ( <button type={type} onClick={onClick} disabled={disabled} className={`px-4 py-2 rounded-md font-semibold transition-colors duration-200 flex items-center justify-center space-x-2 disabled:bg-slate-300 disabled:cursor-not-allowed ${className}`} {...props}>{children}</button> );
const Modal: React.FC<{ children: React.ReactNode; title: string; onClose: () => void; size?: 'lg' | '2xl' | '4xl' | '6xl' }> = ({ children, title, onClose, size = 'lg' }) => { const sizeClasses = { lg: 'max-w-lg', '2xl': 'max-w-2xl', '4xl': 'max-w-4xl', '6xl': 'max-w-6xl' }; return ( <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start pt-10 overflow-y-auto" onClick={onClose}><div className={`bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]} mx-4 mb-10`} onClick={e => e.stopPropagation()}><div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white rounded-t-lg z-10"><h3 className="text-xl font-bold text-dark-text">{title}</h3><button onClick={onClose} className="text-3xl font-light text-slate-400 hover:text-slate-700 leading-none">&times;</button></div><div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div></div></div> ); };
const Input = (props: React.InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean }) => { const { hasError, ...rest } = props; return <input {...rest} className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 bg-white text-dark-text disabled:bg-slate-100 disabled:text-slate-500 ${hasError ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-primary'}`} />; };
const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => ( <select {...props} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white text-dark-text disabled:bg-slate-100 disabled:text-slate-500" /> );
const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => ( <textarea {...props} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white text-dark-text disabled:bg-slate-100 disabled:text-slate-500" /> );
const FormRow: React.FC<{ label: string; children: React.ReactNode; error?: string }> = ({ label, children, error }) => ( <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-start"><label className="font-semibold pt-2">{label}</label><div className="md:col-span-2">{children}{error && <p className="text-red-500 text-xs mt-1">{error}</p>}</div></div> );
const competencyLabels = [ "Juicio Clínico y Razonamiento", "Conocimientos y Habilidades Técnicas", "Profesionalismo y Ética", "Comunicación y Habilidades Interpersonales", "Trabajo en Equipo y Colaboración", "Aprendizaje Continuo y Autoevaluación", "Gestión y Seguridad del Paciente", "Manejo de la Información" ];
const competencyScale = { 1: "Nunca", 2: "Rara Vez", 3: "Pocas Veces", 4: "A Veces", 5: "Frecuentemente", 6: "Generalmente", 7: "Casi Siempre" };
type View = 'DASHBOARD' | 'STUDENTS' | 'TEACHERS' | 'SUBJECTS' | 'GRADES' | 'STUDENT_FILES' | 'TEACHER_FILES' | 'CALENDAR' | 'NEWS' | 'DOCUMENTS' | 'MEETINGS' | 'SITE_MANAGEMENT' | 'SURVEYS';
type Permissions = { canCreate: boolean; canEdit: boolean; canDelete: boolean; views: View[]; };

// --- Modals ---
const ConfirmDeleteModal = ({ onConfirm, onCancel, title, message }: { onConfirm: () => void, onCancel: () => void, title: string, message: string }) => (
    <Modal title={title} onClose={onCancel} size="lg">
        <div className="space-y-4">
            <p>{message}</p>
            <div className="flex justify-end space-x-2 pt-4">
                <Button onClick={onCancel} className="bg-slate-200 text-slate-800 hover:bg-slate-300">Cancelar</Button>
                <Button onClick={onConfirm} className="bg-red-600 hover:bg-red-700 text-white">Confirmar Eliminación</Button>
            </div>
        </div>
    </Modal>
);

const StudentFormModal = ({ student, onSave, onClose }: { student?: Student, onSave: (student: Student) => void, onClose: () => void }) => {
    const [formData, setFormData] = useState<Student>(student || { id: 0, name: '', lastName: '', rut: '', email: '', admissionDate: '', phone: '', undergradUniversity: '', nationality: '', birthDate: '', photo: '' });
    const [errors, setErrors] = useState<Partial<Record<keyof Student, string>>>({});
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) { const base64 = await fileToBase64(e.target.files[0]); setFormData({ ...formData, photo: base64 }); } };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Partial<Record<keyof Student, string>> = {};
        if (!formData.name) newErrors.name = 'El nombre es requerido.';
        if (!formData.lastName) newErrors.lastName = 'El apellido es requerido.';
        const rutError = validateField('rut', formData.rut);
        if (rutError) newErrors.rut = rutError;
        const emailError = validateField('email', formData.email);
        if (emailError) newErrors.email = emailError;
        const phoneError = validateField('phone', formData.phone);
        if (phoneError) newErrors.phone = phoneError;
        if (!formData.birthDate) newErrors.birthDate = 'La fecha de nacimiento es requerida.';
        if (!formData.admissionDate) newErrors.admissionDate = 'La fecha de admisión es requerida.';
        if (!formData.undergradUniversity) newErrors.undergradUniversity = 'La universidad de pregrado es requerida.';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        onSave(formData);
    };
    
    return (<Modal title={student ? 'Editar Alumno' : 'Agregar Alumno'} onClose={onClose} size="2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormRow label="Foto"><div className="flex items-center space-x-4"><img src={formData.photo} alt="Perfil" className="w-16 h-16 rounded-full object-cover bg-slate-200" /><Input type="file" accept="image/*" onChange={handlePhotoChange} /></div></FormRow>
            <FormRow label="Nombres" error={errors.name}><Input name="name" value={formData.name} onChange={handleChange} required hasError={!!errors.name} /></FormRow>
            <FormRow label="Apellidos" error={errors.lastName}><Input name="lastName" value={formData.lastName} onChange={handleChange} required hasError={!!errors.lastName}/></FormRow>
            <FormRow label="RUT" error={errors.rut}><Input name="rut" value={formData.rut} onChange={handleChange} required placeholder="12.345.678-9" hasError={!!errors.rut}/></FormRow>
            <FormRow label="Email" error={errors.email}><Input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="ejemplo@email.com" hasError={!!errors.email}/></FormRow>
            <FormRow label="Teléfono" error={errors.phone}><Input type="tel" name="phone" value={formData.phone} onChange={handleChange} required placeholder="+56912345678" hasError={!!errors.phone}/></FormRow>
            <FormRow label="Fecha de Nacimiento" error={errors.birthDate}><Input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} required hasError={!!errors.birthDate}/></FormRow>
            <FormRow label="Fecha de Admisión" error={errors.admissionDate}><Input type="date" name="admissionDate" value={formData.admissionDate} onChange={handleChange} required hasError={!!errors.admissionDate}/></FormRow>
            <FormRow label="U. de Pregrado" error={errors.undergradUniversity}><Input name="undergradUniversity" value={formData.undergradUniversity} onChange={handleChange} required hasError={!!errors.undergradUniversity}/></FormRow>
            <div className="flex justify-end space-x-2 pt-4"><Button onClick={onClose} className="bg-slate-200 text-slate-800 hover:bg-slate-300">Cancelar</Button><Button type="submit">Guardar</Button></div>
        </form>
    </Modal>);
};

const TeacherFormModal = ({ teacher, onSave, onClose }: { teacher?: Teacher, onSave: (teacher: Teacher) => void, onClose: () => void }) => {
    const [formData, setFormData] = useState<Teacher>(teacher || { id: 0, name: '', lastName: '', rut: '', email: '', admissionDate: '', phone: '', postgradUniversity: '', birthDate: '', photo: '', contractType: 'Planta', academicRank: 'Adjunto' });
    const [errors, setErrors] = useState<Partial<Record<keyof Teacher, string>>>({});
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) { const base64 = await fileToBase64(e.target.files[0]); setFormData({ ...formData, photo: base64 }); } };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Partial<Record<keyof Teacher, string>> = {};
        if (!formData.name) newErrors.name = 'El nombre es requerido.';
        if (!formData.lastName) newErrors.lastName = 'El apellido es requerido.';
        const rutError = validateField('rut', formData.rut);
        if (rutError) newErrors.rut = rutError;
        const emailError = validateField('email', formData.email);
        if (emailError) newErrors.email = emailError;
        const phoneError = validateField('phone', formData.phone);
        if (phoneError) newErrors.phone = phoneError;
        if (!formData.birthDate) newErrors.birthDate = 'La fecha de nacimiento es requerida.';
        if (!formData.admissionDate) newErrors.admissionDate = 'La fecha de incorporación es requerida.';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        onSave(formData);
    };
    
    return (<Modal title={teacher ? 'Editar Docente' : 'Agregar Docente'} onClose={onClose} size="2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormRow label="Foto"><div className="flex items-center space-x-4"><img src={formData.photo} alt="Perfil" className="w-16 h-16 rounded-full object-cover bg-slate-200" /><Input type="file" accept="image/*" onChange={handlePhotoChange} /></div></FormRow>
            <FormRow label="Nombres" error={errors.name}><Input name="name" value={formData.name} onChange={handleChange} required hasError={!!errors.name} /></FormRow>
            <FormRow label="Apellidos" error={errors.lastName}><Input name="lastName" value={formData.lastName} onChange={handleChange} required hasError={!!errors.lastName}/></FormRow>
            <FormRow label="RUT" error={errors.rut}><Input name="rut" value={formData.rut} onChange={handleChange} required placeholder="12.345.678-9" hasError={!!errors.rut}/></FormRow>
            <FormRow label="Email" error={errors.email}><Input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="ejemplo@email.com" hasError={!!errors.email}/></FormRow>
            <FormRow label="Teléfono" error={errors.phone}><Input type="tel" name="phone" value={formData.phone} onChange={handleChange} required placeholder="+56912345678" hasError={!!errors.phone}/></FormRow>
            <FormRow label="Fecha de Nacimiento" error={errors.birthDate}><Input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} required hasError={!!errors.birthDate}/></FormRow>
            <FormRow label="Fecha de Incorporación" error={errors.admissionDate}><Input type="date" name="admissionDate" value={formData.admissionDate} onChange={handleChange} required hasError={!!errors.admissionDate}/></FormRow>
            <FormRow label="Tipo de Contrato"><Select name="contractType" value={formData.contractType} onChange={handleChange}><option value="Planta">Planta</option><option value="Honorarios">Honorarios</option><option value="Ad Honorem">Ad Honorem</option></Select></FormRow>
            <FormRow label="Calidad Docente"><Select name="academicRank" value={formData.academicRank} onChange={handleChange}><option value="Adjunto">Adjunto</option><option value="Titular">Titular</option><option value="Colaborador">Colaborador</option></Select></FormRow>
            <div className="flex justify-end space-x-2 pt-4"><Button onClick={onClose} className="bg-slate-200 text-slate-800 hover:bg-slate-300">Cancelar</Button><Button type="submit">Guardar</Button></div>
        </form>
    </Modal>);
};

const SubjectFormModal = ({ subject, teachers, onSave, onClose }: { subject?: Subject, teachers: Teacher[], onSave: (subject: Subject) => void, onClose: () => void }) => {
    const [formData, setFormData] = useState<Subject>(subject || { id: 0, name: '', code: '', teacherId: undefined, credits: 0, semester: 1, description: '' });
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: name === 'teacherId' || name === 'credits' || name === 'semester' ? parseInt(value) : value });
    };
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(formData); };

    return (<Modal title={subject ? 'Editar Asignatura' : 'Agregar Asignatura'} onClose={onClose} size="2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormRow label="Nombre Asignatura"><Input name="name" value={formData.name} onChange={handleChange} required /></FormRow>
            <FormRow label="Código"><Input name="code" value={formData.code} onChange={handleChange} required /></FormRow>
            <FormRow label="Docente a Cargo"><Select name="teacherId" value={formData.teacherId} onChange={handleChange}><option value="">Seleccione un docente</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.name} {t.lastName}</option>)}</Select></FormRow>
            <FormRow label="Créditos"><Input type="number" name="credits" value={formData.credits} onChange={handleChange} required /></FormRow>
            <FormRow label="Semestre"><Input type="number" name="semester" value={formData.semester} onChange={handleChange} required /></FormRow>
            <FormRow label="Descripción"><Textarea name="description" value={formData.description} onChange={handleChange} rows={4}/></FormRow>
            <div className="flex justify-end space-x-2 pt-4"><Button onClick={onClose} className="bg-slate-200 text-slate-800 hover:bg-slate-300">Cancelar</Button><Button type="submit">Guardar</Button></div>
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
            <div className="flex justify-end space-x-2 pt-4"><Button onClick={onClose} className="bg-slate-200 text-slate-800 hover:bg-slate-300">Cancelar</Button><Button type="submit">Crear</Button></div>
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
                        <div><label className="font-semibold block mb-1">Examen Teórico (60%)</label><Input type="number" name="theoretical" value={grades.theoretical ?? ''} onChange={handleGradeChange} step="0.1" min="1" max="7" /></div>
                        <div><label className="font-semibold block mb-1">Actividad Docente (10%)</label><Input type="number" name="teacherActivity" value={grades.teacherActivity ?? ''} onChange={handleGradeChange} step="0.1" min="1" max="7" /></div>
                        <div className="bg-slate-100 p-4 rounded-md text-center"><p className="text-sm text-medium-text">Nota Final Ponderada</p><p className="font-bold text-2xl">{finalGradeDisplay}</p></div>
                    </div>
                </Card>
                <Card>
                    <h3 className="text-xl font-bold mb-2">Evaluación de Competencias (30%)</h3>
                    <p className="text-sm text-medium-text mb-4">Escala: 1=Nunca, 2=Rara Vez, 3=Pocas Veces, 4=A Veces, 5=Frecuentemente, 6=Generalmente, 7=Casi Siempre</p>
                    <div className="space-y-4">
                        {competencyLabels.map((label, index) => (
                            <div key={index} className="grid grid-cols-12 gap-2 items-center">
                                <label className="font-semibold col-span-12 md:col-span-4">{label}</label>
                                <div className="col-span-12 md:col-span-8 flex justify-start space-x-2 flex-wrap">
                                    {Object.entries(competencyScale).map(([val, desc]) => (
                                        <label key={val} className="flex items-center justify-center cursor-pointer" title={desc}>
                                            <input type="radio" name={`comp-${index}`} value={val} checked={competencyScores[index] === parseInt(val)} onChange={() => handleCompetencyChange(index, parseInt(val))} className="sr-only" />
                                            <span className={`w-10 h-10 rounded-md flex items-center justify-center border-2 transition-all ${competencyScores[index] === parseInt(val) ? 'bg-primary text-white border-primary-hover' : 'bg-white hover:bg-primary-light border-slate-300'}`}>{val}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
                <Card><h3 className="text-xl font-bold mb-4">Feedback General y Comentarios</h3><Textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={6} placeholder="Escriba aquí sus comentarios sobre el desempeño del alumno..."/></Card>
                <div className="flex justify-end space-x-2 pt-4"><Button onClick={onClose} className="bg-slate-200 text-slate-800 hover:bg-slate-300">Cancelar</Button><Button type="submit">Guardar y Generar Informe</Button></div>
            </form>
        </Modal>
    );
};
const ReportViewerModal = ({ report, student, subject, onAccept, onClose }: { report: GradeReport, student: Student, subject: Subject, onAccept: (reportId: number) => void, onClose: () => void }) => { const [accepted, setAccepted] = useState(false); return ( <Modal title={`Informe de Evaluación - ${student.name} ${student.lastName}`} onClose={onClose} size="2xl"><div className="space-y-6"><p className="text-center text-medium-text">Generado el {report.generationDate.toLocaleDateString('es-CL')} para la asignatura <strong>{subject.name}</strong></p><Card><h4 className="font-bold mb-2">Resumen de Calificaciones</h4><p>Nota Final Ponderada: <strong className="text-lg">{report.gradeSummary.finalGrade.toFixed(2)}</strong></p></Card><Card><h4 className="font-bold mb-2">Evaluación de Competencias</h4><ul className="list-disc list-inside space-y-1">{competencyLabels.map((i, index) => <li key={i}>{i}: <strong>{report.competencyScores[index] ? `${report.competencyScores[index]} (${competencyScale[report.competencyScores[index] as keyof typeof competencyScale]})` : 'No evaluado'}</strong></li>)}</ul></Card><Card><h4 className="font-bold mb-2">Feedback del Docente</h4><p className="whitespace-pre-wrap">{report.feedback || 'Sin comentarios.'}</p></Card>{report.status === 'Completado' ? ( <div className="text-center p-4 bg-emerald-50 rounded-lg text-emerald-800">Informe aceptado por el alumno el {report.studentAcceptanceDate?.toLocaleDateString('es-CL')}.</div> ) : ( <div className="border-t pt-6 space-y-4"><label className="flex items-center space-x-3"><input type="checkbox" checked={accepted} onChange={() => setAccepted(!accepted)} className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary" /><span>He leído y acepto el contenido de esta evaluación.</span></label><div className="flex justify-end"><Button onClick={() => onAccept(report.id)} disabled={!accepted}>Firmar y Aceptar Informe</Button></div></div> )}</div></Modal> ); };

const AnotacionFormModal = ({ studentId, autorId, onSave, onClose }: { studentId: number, autorId: number, onSave: (anotacion: Anotacion) => void, onClose: () => void }) => {
    const [type, setType] = useState<'Positiva' | 'Negativa' | 'Observación'>('Observación');
    const [text, setText] = useState('');
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave({ id: 0, studentId, autorId, timestamp: new Date(), type, text }); };
    return ( <Modal title="Agregar Anotación" onClose={onClose}> <form onSubmit={handleSubmit} className="space-y-4"> <FormRow label="Tipo de Anotación"> <Select value={type} onChange={e => setType(e.target.value as any)}> <option value="Observación">Observación</option> <option value="Positiva">Positiva</option> <option value="Negativa">Negativa</option> </Select> </FormRow> <FormRow label="Descripción"> <Textarea value={text} onChange={e => setText(e.target.value)} rows={5} required /> </FormRow> <div className="flex justify-end space-x-2 pt-4"> <Button onClick={onClose} className="bg-slate-200 text-slate-800 hover:bg-slate-300">Cancelar</Button> <Button type="submit">Guardar Anotación</Button> </div> </form> </Modal> );
};

const PersonalDocumentFormModal = ({ ownerId, ownerType, onSave, onClose }: { ownerId: number, ownerType: 'student' | 'teacher', onSave: (doc: PersonalDocument) => void, onClose: () => void }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState<{ name: string; url: string; type: string; } | null>(null);
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => { const selectedFile = e.target.files?.[0]; if (selectedFile) { const base64 = await fileToBase64(selectedFile); setFile({ name: selectedFile.name, url: base64, type: selectedFile.type }); } };
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (!file) { alert("Por favor, seleccione un archivo."); return; } onSave({ id: 0, ownerId, ownerType, title, description, uploadDate: new Date(), file }); };
    return ( <Modal title="Agregar Documento Personal" onClose={onClose}> <form onSubmit={handleSubmit} className="space-y-4"> <FormRow label="Título del Documento"><Input value={title} onChange={e => setTitle(e.target.value)} required /></FormRow> <FormRow label="Descripción"><Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} /></FormRow> <FormRow label="Archivo"><Input type="file" onChange={handleFileChange} required /></FormRow> {file && <p className="text-sm text-medium-text">Archivo seleccionado: {file.name}</p>} <div className="flex justify-end space-x-2 pt-4"> <Button onClick={onClose} className="bg-slate-200 text-slate-800 hover:bg-slate-300">Cancelar</Button> <Button type="submit">Guardar Documento</Button> </div> </form> </Modal> );
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
    
    return ( <Modal title="Agregar Actividad Profesional" onClose={onClose} size="2xl"> <form onSubmit={handleSubmit} className="space-y-4"> <FormRow label="Tipo de Actividad"> <Select value={type} onChange={e => { setType(e.target.value as any); setSpecificData({}); }}> {activityTypes.map(t => <option key={t} value={t}>{t}</option>)} </Select> </FormRow> <FormRow label="Título / Nombre"><Input name="title" value={commonData.title} onChange={handleCommonChange} required /></FormRow> <FormRow label="Fecha"><Input type="date" name="date" value={commonData.date} onChange={handleCommonChange} required /></FormRow> <hr className="my-4" /> {renderSpecificFields()} <div className="flex justify-end space-x-2 pt-4"> <Button onClick={onClose} className="bg-slate-200 text-slate-800 hover:bg-slate-300">Cancelar</Button> <Button type="submit">Guardar Actividad</Button> </div> </form> </Modal> );
};

const CalendarEventFormModal = ({ event, onSave, onClose }: { event?: CalendarEvent, onSave: (event: CalendarEvent) => void, onClose: () => void }) => {
    const [formData, setFormData] = useState<Partial<CalendarEvent>>(event || { title: '', start: new Date(), end: new Date(), type: 'Evento' });
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const isDate = name === 'start' || name === 'end';
        setFormData({ ...formData, [name]: isDate ? new Date(value) : value });
    };
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(formData as CalendarEvent); };

    return (
        <Modal title={event ? 'Editar Evento' : 'Agregar Evento'} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <FormRow label="Título"><Input name="title" value={formData.title} onChange={handleChange} required /></FormRow>
                <FormRow label="Inicio"><Input type="date" name="start" value={formData.start?.toISOString().split('T')[0]} onChange={handleChange} required /></FormRow>
                <FormRow label="Término"><Input type="date" name="end" value={formData.end?.toISOString().split('T')[0]} onChange={handleChange} required /></FormRow>
                <FormRow label="Tipo"><Select name="type" value={formData.type} onChange={handleChange}><option value="Evento">Evento</option><option value="Examen">Examen</option><option value="Clase">Clase</option><option value="Feriado">Feriado</option></Select></FormRow>
                <FormRow label="Link (Opcional)"><Input name="streamingLink" value={formData.streamingLink || ''} onChange={handleChange} /></FormRow>
                <div className="flex justify-end space-x-2 pt-4"><Button onClick={onClose} className="bg-slate-200 text-slate-800 hover:bg-slate-300">Cancelar</Button><Button type="submit">Guardar Evento</Button></div>
            </form>
        </Modal>
    );
};

const NewsArticleFormModal = ({ article, onSave, onClose }: { article?: NewsArticle, onSave: (article: NewsArticle) => void, onClose: () => void }) => {
    const [formData, setFormData] = useState<Partial<NewsArticle>>(article || { title: '', content: '', author: '', link: '', linkText: '' });
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) { const base64 = await fileToBase64(e.target.files[0]); setFormData({ ...formData, imageUrl: base64 }); } };
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave({ ...formData, date: new Date() } as NewsArticle); };
    
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
                <div className="flex justify-end space-x-2 pt-4"><Button onClick={onClose} className="bg-slate-200 text-slate-800 hover:bg-slate-300">Cancelar</Button><Button type="submit">Publicar Noticia</Button></div>
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
                    <select multiple className="w-full h-24 px-3 py-2 border border-slate-300 rounded-md bg-white text-dark-text" value={formData.attendees?.teachers.map(String)} onChange={(e) => handleAttendeeChange('teachers', e.target.selectedOptions)}>
                        {teachers.map(t => <option key={t.id} value={t.id}>{t.name} {t.lastName}</option>)}
                    </select>
                </FormRow>
                <FormRow label="Alumnos Asistentes">
                    <select multiple className="w-full h-24 px-3 py-2 border border-slate-300 rounded-md bg-white text-dark-text" value={formData.attendees?.students.map(String)} onChange={(e) => handleAttendeeChange('students', e.target.selectedOptions)}>
                        {students.map(s => <option key={s.id} value={s.id}>{s.name} {s.lastName}</option>)}
                    </select>
                </FormRow>
                <FormRow label="Link Reunión"><Input name="streamingLink" value={formData.streamingLink || ''} onChange={handleChange} placeholder="https://meet.example.com/..."/></FormRow>
                <FormRow label="Invitados Externos"><Input value={externalsText} onChange={e => setExternalsText(e.target.value)} placeholder="Separados por comas"/></FormRow>
                 <div className="flex justify-end space-x-2 pt-4"><Button onClick={onClose} className="bg-slate-200 text-slate-800 hover:bg-slate-300">Cancelar</Button><Button type="submit">Guardar Registro</Button></div>
            </form>
        </Modal>
    );
};

const QuickLinkFormModal = ({ link, onSave, onClose }: { link?: QuickLink; onSave: (link: QuickLink) => void; onClose: () => void; }) => {
    const [formData, setFormData] = useState(link || { id: 0, label: '', url: '' });
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(formData); };

    return (
        <Modal title={link ? 'Editar Enlace Rápido' : 'Agregar Enlace Rápido'} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <FormRow label="Etiqueta"><Input name="label" value={formData.label} onChange={handleChange} required /></FormRow>
                <FormRow label="URL"><Input type="url" name="url" value={formData.url} onChange={handleChange} required placeholder="https://ejemplo.com" /></FormRow>
                <div className="flex justify-end space-x-2 pt-4"><Button onClick={onClose} className="bg-slate-200 text-slate-800 hover:bg-slate-300">Cancelar</Button><Button type="submit">Guardar Enlace</Button></div>
            </form>
        </Modal>
    );
};

const SurveyFormModal = ({ survey, student, subject, onSave, onClose }: { survey: Survey, student: Student, subject: Subject, onSave: (survey: Survey, answers: SurveyAnswer[]) => void, onClose: () => void }) => {
    const [answers, setAnswers] = useState<SurveyAnswer[]>([]);
    const allQuestionsAnswered = useMemo(() => answers.length === surveyQuestions.length, [answers]);

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
        if (!allQuestionsAnswered) {
            alert('Por favor, responda todas las preguntas antes de enviar.');
            return;
        }
        onSave(survey, answers);
    };

    return (
        <Modal title={`Encuesta: ${subject.name}`} onClose={onClose} size="6xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                <p>Por favor, complete la siguiente encuesta para la asignatura <strong>{subject.name}</strong>, completada por <strong>{student.name} {student.lastName}</strong>.</p>
                <div className="space-y-8">
                    {surveyQuestions.map((q, index) => (
                        <Card key={q.id} className="bg-slate-50">
                            <label className="font-bold text-dark-text block mb-4">{index + 1}. {q.text}</label>
                            {q.type === 'multiple-choice' && (
                                <div className="flex flex-wrap gap-4">
                                    {q.options?.map(option => (
                                        <label key={option} className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-slate-200">
                                            <input
                                                type="radio"
                                                name={`question-${q.id}`}
                                                value={option}
                                                onChange={e => handleAnswerChange(q.id, e.target.value)}
                                                required
                                                className="h-4 w-4 text-primary focus:ring-primary border-slate-300"
                                            />
                                            <span>{option}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                            {q.type === 'open-text' && (
                                <Textarea
                                    rows={4}
                                    onChange={e => handleAnswerChange(q.id, e.target.value)}
                                    placeholder="Escriba su respuesta"
                                    required
                                />
                            )}
                        </Card>
                    ))}
                </div>
                <div className="flex justify-end space-x-2 pt-4 border-t">
                    <Button onClick={onClose} className="bg-slate-200 text-slate-800 hover:bg-slate-300">Cancelar</Button>
                    <Button type="submit" disabled={!allQuestionsAnswered} title={!allQuestionsAnswered ? 'Debe responder todas las preguntas' : ''}>
                        Enviar Encuesta
                    </Button>
                </div>
            </form>
        </Modal>
    );
};


// --- Loading & Layout ---
const LoadingScreen: React.FC = () => ( <div className="flex items-center justify-center h-screen bg-light-bg"><div className="text-center"><h1 className="text-3xl font-bold text-primary">GRUA</h1><p className="text-medium-text mt-2">Gestión de Radiología Universidad de Antofagasta</p><div className="mt-8 border-4 border-slate-200 border-t-primary rounded-full w-12 h-12 animate-spin mx-auto"></div></div></div> );
const Sidebar: React.FC<{ currentView: View; setCurrentView: (view: View) => void, permissions: Permissions }> = ({ currentView, setCurrentView, permissions }) => { const navItems = [ { view: 'DASHBOARD', label: 'Dashboard', icon: Icons.dashboard }, { view: 'STUDENTS', label: 'Alumnos', icon: Icons.students }, { view: 'TEACHERS', label: 'Docentes', icon: Icons.teachers }, { view: 'SUBJECTS', label: 'Asignaturas', icon: Icons.subjects }, { view: 'GRADES', label: 'Calificaciones', icon: Icons.grades }, { view: 'STUDENT_FILES', label: 'Expediente Alumnos', icon: Icons.studentFile }, { view: 'TEACHER_FILES', label: 'Expediente Docentes', icon: Icons.teacherFile }, { view: 'SURVEYS', label: 'Gestión de Encuestas', icon: Icons.surveys }, { view: 'CALENDAR', label: 'Calendario', icon: Icons.calendar }, { view: 'NEWS', label: 'Noticias', icon: Icons.news }, { view: 'DOCUMENTS', label: 'Documentos Oficiales', icon: Icons.documents }, { view: 'MEETINGS', label: 'Registro de Reuniones', icon: Icons.meetings }, { view: 'SITE_MANAGEMENT', label: 'Gestión del Sitio', icon: Icons.site_management }, ] as const; const visibleNavItems = useMemo(() => navItems.filter(item => permissions.views.includes(item.view)), [permissions.views]); return ( <aside className="w-64 bg-secondary text-white flex flex-col"><div className="h-20 flex items-center justify-center text-2xl font-bold border-b border-slate-700">GRUA</div><nav className="flex-1 px-4 py-6 space-y-2">{visibleNavItems.map(item => ( <a key={item.view} href="#" onClick={(e) => { e.preventDefault(); setCurrentView(item.view); }} className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${ currentView === item.view ? 'bg-primary text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white' }`}>{React.cloneElement(item.icon, { className: 'w-6 h-6' })}<span>{item.label}</span></a> ))}</nav><div className="px-4 py-6 border-t border-slate-700"><a href="#" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white">{Icons.logout}<span>Cerrar Sesión</span></a></div></aside> ); };
const Header: React.FC<{ user: User, allUsers: User[], onUserChange: (userId: string) => void, students: Student[], teachers: Teacher[], subjects: Subject[], onSearchResultSelect: (item: any, type: string) => void }> = ({ user, allUsers, onUserChange, students, teachers, subjects, onSearchResultSelect }) => {
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
        <header className="h-20 bg-white shadow-sm flex items-center justify-between px-8 gap-8">
            <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-dark-text">Bienvenido, {user.name}</h1>
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
                    <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-xl z-50 border max-h-96 overflow-y-auto">
                        {hasResults ? (
                            <ul className="divide-y">
                                {searchResults.students.length > 0 && (
                                    <li>
                                        <div className="px-4 py-2 bg-slate-50 text-xs font-bold uppercase text-slate-500">Alumnos</div>
                                        <ul>
                                            {searchResults.students.map(s => (
                                                <li key={`s-${s.id}`} onMouseDown={() => handleSelect(s, 'student')} className="px-4 py-3 hover:bg-primary-light cursor-pointer flex items-center space-x-3">
                                                    <img src={s.photo} className="w-8 h-8 rounded-full object-cover"/>
                                                    <div>
                                                      <p className="font-semibold text-dark-text">{s.name} {s.lastName}</p>
                                                      <p className="text-sm text-medium-text">{s.rut}</p>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </li>
                                )}
                                {searchResults.teachers.length > 0 && (
                                    <li>
                                        <div className="px-4 py-2 bg-slate-50 text-xs font-bold uppercase text-slate-500">Docentes</div>
                                        <ul>
                                            {searchResults.teachers.map(t => (
                                                <li key={`t-${t.id}`} onMouseDown={() => handleSelect(t, 'teacher')} className="px-4 py-3 hover:bg-primary-light cursor-pointer flex items-center space-x-3">
                                                    <img src={t.photo} className="w-8 h-8 rounded-full object-cover"/>
                                                    <div>
                                                      <p className="font-semibold text-dark-text">{t.name} {t.lastName}</p>
                                                      <p className="text-sm text-medium-text">{t.rut}</p>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </li>
                                )}
                                {searchResults.subjects.length > 0 && (
                                    <li>
                                        <div className="px-4 py-2 bg-slate-50 text-xs font-bold uppercase text-slate-500">Asignaturas</div>
                                        <ul>
                                            {searchResults.subjects.map(sub => (
                                                <li key={`sub-${sub.id}`} onMouseDown={() => handleSelect(sub, 'subject')} className="px-4 py-3 hover:bg-primary-light cursor-pointer">
                                                    <p className="font-semibold text-dark-text">{sub.name}</p>
                                                    <p className="text-sm text-medium-text">{sub.code}</p>
                                                </li>
                                            ))}
                                        </ul>
                                    </li>
                                )}
                            </ul>
                        ) : (
                            <div className="p-4 text-center text-medium-text">No se encontraron resultados.</div>
                        )}
                    </div>
                )}
            </div>

            <div className="flex items-center space-x-4 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <label className="text-sm font-semibold whitespace-nowrap">Simular Usuario:</label>
                    <Select value={user.id} onChange={(e) => onUserChange(e.target.value)} className="w-48">
                        {allUsers.map(u => <option key={u.id} value={u.id}>{u.name} {u.lastName} ({u.role})</option>)}
                    </Select>
                </div>
                <img src={user.photo} alt={`${user.name} ${user.lastName}`} className="w-12 h-12 rounded-full object-cover border-2 border-primary" />
            </div>
        </header>
    );
};
const RenderView: React.FC<{ view: View, data: any }> = ({ view, data }) => { switch (view) { case 'DASHBOARD': return <Dashboard {...data} />; case 'STUDENTS': return <StudentListPage {...data} />; case 'TEACHERS': return <TeacherListPage {...data} />; case 'SUBJECTS': return <SubjectListPage {...data} />; case 'GRADES': return <GradeManagerPage {...data} />; case 'STUDENT_FILES': return <StudentFilesPage {...data} />; case 'TEACHER_FILES': return <TeacherFilesPage {...data} />; case 'CALENDAR': return <CalendarPage {...data} />; case 'NEWS': return <NewsPage {...data} />; case 'DOCUMENTS': return <OfficialDocumentsPage {...data} />; case 'MEETINGS': return <MeetingRecordsPage {...data} />; case 'SITE_MANAGEMENT': return <SiteManagementPage {...data} />; case 'SURVEYS': return <SurveyManagementPage {...data} />; default: return <Dashboard {...data} />; } };
const PageTitle = ({ title, children }: { title: string, children?: React.ReactNode }) => ( <div className="flex justify-between items-center mb-6"><h2 className="text-3xl font-bold text-dark-text">{title}</h2><div>{children}</div></div> );

// --- Page Components ---
const Dashboard: React.FC<{ students: Student[]; grades: Grade[]; subjects: Subject[]; news: NewsArticle[]; calendarEvents: CalendarEvent[]; quickLinks: QuickLink[]; setCurrentView: (view: View) => void, openModal: (modal: any) => void, permissions: Permissions }> = ({ students, grades, subjects, news, calendarEvents, quickLinks, setCurrentView, openModal, permissions }) => { const recentGrades = useMemo(() => [...grades].sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()).slice(0, 5), [grades]); const getStudentName = (id: number) => students.find(s => s.id === id)?.name || 'N/A'; const getSubjectName = (id: number) => subjects.find(s => s.id === id)?.name || 'N/A'; const upcomingEvents = useMemo(() => [...calendarEvents].filter(event => event.start >= new Date()).sort((a, b) => a.start.getTime() - b.start.getTime()).slice(0, 3), [calendarEvents]); return ( <div className="grid grid-cols-1 lg:grid-cols-3 gap-8"><div className="lg:col-span-2 space-y-8"><WelcomeBanner studentCount={students.length} /><RecentGradesCard grades={recentGrades} getStudentName={getStudentName} getSubjectName={getSubjectName} /><NewsAndUpdates news={news} /></div><div className="space-y-8"><UpcomingEventsCard events={upcomingEvents} /><QuickLinksCard links={quickLinks} openModal={openModal} permissions={permissions}/></div></div> ); };
const WelcomeBanner: React.FC<{ studentCount: number }> = ({ studentCount }) => (<div className="bg-gradient-to-r from-primary to-indigo-500 rounded-lg p-8 text-white shadow-lg"><h2 className="text-3xl font-bold">¡Hola de nuevo!</h2><p className="mt-2 text-indigo-200">Actualmente tienes {studentCount} alumnos bajo tu supervisión. Revisa las últimas actualizaciones y eventos.</p></div>);
const RecentGradesCard: React.FC<{ grades: Grade[], getStudentName: (id: number) => string, getSubjectName: (id: number) => string }> = ({ grades, getStudentName, getSubjectName }) => (<Card><h3 className="text-xl font-bold mb-4">Calificaciones Recientes</h3><div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="border-b"><th className="py-2 px-4 font-semibold text-dark-text">Alumno</th><th className="py-2 px-4 font-semibold text-dark-text">Asignatura</th><th className="py-2 px-4 font-semibold text-dark-text">Promedio</th><th className="py-2 px-4 font-semibold text-dark-text">Estado</th></tr></thead><tbody>{grades.map(grade => (<tr key={grade.id} className="border-b last:border-0 hover:bg-slate-50"><td className="py-3 px-4 text-dark-text">{getStudentName(grade.studentId)}</td><td className="py-3 px-4 text-dark-text">{getSubjectName(grade.subjectId)}</td><td className="py-3 px-4 font-medium text-dark-text">{calculateFinalGrade(grade)}</td><td className="py-3 px-4"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${grade.isFinalized ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{grade.isFinalized ? 'Finalizada' : 'En Progreso'}</span></td></tr>))}</tbody></table></div></Card>);
const NewsAndUpdates: React.FC<{ news: NewsArticle[] }> = ({ news }) => (<Card><h3 className="text-xl font-bold mb-4">Noticias y Anuncios</h3><div className="space-y-6">{news.slice(0, 2).map(article => (<div key={article.id} className="flex items-start space-x-4"><img src={article.imageUrl} alt={article.title} className="w-32 h-20 object-cover rounded-lg" /><div><h4 className="font-bold">{article.title}</h4><p className="text-sm text-medium-text mt-1">{article.content.substring(0, 100)}...</p><p className="text-xs text-light-text mt-2">{article.author} - {article.date.toLocaleDateString()}</p></div></div>))}</div></Card>);
const getEventTypeStyles = (type: CalendarEvent['type']) => { switch (type) { case 'Examen': return 'bg-red-100 text-red-800 border-red-300'; case 'Clase': return 'bg-blue-100 text-blue-800 border-blue-300'; case 'Evento': return 'bg-purple-100 text-purple-800 border-purple-300'; case 'Feriado': return 'bg-green-100 text-green-800 border-green-300'; default: return 'bg-slate-100 text-slate-800 border-slate-300'; }};
const UpcomingEventsCard: React.FC<{ events: CalendarEvent[] }> = ({ events }) => (<Card><h3 className="text-xl font-bold mb-4">Próximos Eventos</h3><ul className="space-y-4">{events.map(event => (<li key={event.id} className="flex items-center space-x-3"><div className="flex-shrink-0 w-12 text-center bg-primary-light rounded-lg p-2"><p className="text-primary font-bold text-lg leading-none">{event.start.getDate()}</p><p className="text-xs text-primary-hover">{event.start.toLocaleString('es-CL', { month: 'short' })}</p></div><div><p className="font-semibold">{event.title}</p><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getEventTypeStyles(event.type).split(' ')[0]} ${getEventTypeStyles(event.type).split(' ')[1]}`}>{event.type}</span></div></li>))}</ul></Card>);
const ActivityLogCard: React.FC<{ log: ActivityLog[] }> = ({ log }) => (<Card><h3 className="text-xl font-bold mb-4">Actividad del Sistema</h3><ul className="space-y-4">{log.map(item => (<li key={item.id}><p className="text-sm">{item.description}</p><p className="text-xs text-light-text">{item.timestamp.toLocaleString('es-CL')}</p></li>))}</ul></Card>);
const QuickLinksCard: React.FC<{ links: QuickLink[], openModal: (modal: any) => void, permissions: Permissions }> = ({ links, openModal, permissions }) => (<Card><h3 className="text-xl font-bold mb-4">Enlaces Rápidos</h3><ul className="space-y-3">{links.map((link) => (<li key={link.id} className="group flex items-center justify-between hover:bg-slate-50 -mx-2 px-2 py-1 rounded-md"><a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-3 text-primary hover:underline hover:text-primary-hover transition-colors flex-1">{React.cloneElement(Icons.link, { className: 'w-5 h-5 flex-shrink-0' })}<span className="truncate">{link.label}</span></a>{permissions.canEdit && <div className="hidden group-hover:flex space-x-1 pl-2"><Button onClick={() => openModal({ type: 'EDIT_QUICK_LINK', data: link })} className="p-2 text-slate-500 bg-transparent hover:bg-slate-200" title="Editar">{React.cloneElement(Icons.edit, { className: 'w-4 h-4' })}</Button>{permissions.canDelete && <Button onClick={() => openModal({ type: 'DELETE_QUICK_LINK', data: link })} className="p-2 text-red-500 bg-transparent hover:bg-red-100" title="Eliminar">{React.cloneElement(Icons.delete, { className: 'w-4 h-4' })}</Button>}</div>}</li>))}</ul>{permissions.canCreate && <div className="mt-4 border-t pt-3"><Button onClick={() => openModal({ type: 'ADD_QUICK_LINK' })} className="w-full bg-slate-200 text-slate-800 hover:bg-slate-300">{Icons.plus}<span>Agregar Enlace</span></Button></div>}</Card>);
const StudentListPage: React.FC<{ students: Student[]; openModal: (modal: any) => void, permissions: Permissions }> = ({ students, openModal, permissions }) => (<div><PageTitle title="Gestión de Alumnos">{permissions.canCreate && <Button onClick={() => openModal({ type: 'ADD_STUDENT' })}>{Icons.plus}<span>Agregar Alumno</span></Button>}</PageTitle> <Card><table className="w-full text-left"><thead><tr className="border-b"><th className="p-4 font-semibold text-dark-text"></th><th className="p-4 font-semibold text-dark-text">Nombre</th><th className="p-4 font-semibold text-dark-text">Año Residencia</th><th className="p-4 font-semibold text-dark-text">Edad</th><th className="p-4 font-semibold text-dark-text">Email</th><th className="p-4 font-semibold text-dark-text">Teléfono</th>{(permissions.canEdit || permissions.canDelete) && <th className="p-4 font-semibold text-dark-text">Acciones</th>}</tr></thead><tbody>{students.map(student => (<tr key={student.id} className="border-b last:border-0 hover:bg-slate-50"><td className="p-4"><img src={student.photo} alt="" className="w-10 h-10 rounded-full object-cover"/></td><td className="p-4 font-medium text-dark-text">{student.name} {student.lastName}</td><td className="p-4 text-dark-text">{calculateResidencyYear(student.admissionDate)}</td><td className="p-4 text-dark-text">{calculateAge(student.birthDate)}</td><td className="p-4 text-dark-text">{student.email}</td><td className="p-4 text-dark-text">{student.phone}</td>{(permissions.canEdit || permissions.canDelete) && <td className="p-4"><div className="flex space-x-2">{permissions.canEdit && <Button onClick={() => openModal({ type: 'EDIT_STUDENT', data: student })} className="p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-800" title="Editar">{Icons.edit}</Button>}{permissions.canDelete && <Button onClick={() => openModal({ type: 'DELETE_STUDENT', data: student })} className="p-2 text-red-500 hover:bg-red-100 hover:text-red-700" title="Eliminar">{Icons.delete}</Button>}</div></td>}</tr>))}</tbody></table></Card></div>);
const TeacherListPage: React.FC<{ teachers: Teacher[]; openModal: (modal: any) => void, permissions: Permissions }> = ({ teachers, openModal, permissions }) => (<div><PageTitle title="Gestión de Docentes">{permissions.canCreate && <Button onClick={() => openModal({ type: 'ADD_TEACHER' })}>{Icons.plus}<span>Agregar Docente</span></Button>}</PageTitle> <Card><table className="w-full text-left"><thead><tr className="border-b"><th className="p-4 font-semibold text-dark-text"></th><th className="p-4 font-semibold text-dark-text">Nombre</th><th className="p-4 font-semibold text-dark-text">Calidad</th><th className="p-4 font-semibold text-dark-text">Contrato</th><th className="p-4 font-semibold text-dark-text">Años Servicio</th><th className="p-4 font-semibold text-dark-text">Email</th>{(permissions.canEdit || permissions.canDelete) && <th className="p-4 font-semibold text-dark-text">Acciones</th>}</tr></thead><tbody>{teachers.map(teacher => (<tr key={teacher.id} className="border-b last:border-0 hover:bg-slate-50"><td className="p-4"><img src={teacher.photo} alt="" className="w-10 h-10 rounded-full object-cover"/></td><td className="p-4 font-medium text-dark-text">{teacher.name} {teacher.lastName}</td><td className="p-4 text-dark-text">{teacher.academicRank}</td><td className="p-4 text-dark-text">{teacher.contractType}</td><td className="p-4 text-dark-text">{calculateYearsWorked(teacher.admissionDate)}</td><td className="p-4 text-dark-text">{teacher.email}</td>{(permissions.canEdit || permissions.canDelete) && <td className="p-4"><div className="flex space-x-2">{permissions.canEdit && <Button onClick={() => openModal({ type: 'EDIT_TEACHER', data: teacher })} className="p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-800" title="Editar">{Icons.edit}</Button>}{permissions.canDelete && <Button onClick={() => openModal({ type: 'DELETE_TEACHER', data: teacher })} className="p-2 text-red-500 hover:bg-red-100 hover:text-red-700" title="Eliminar">{Icons.delete}</Button>}</div></td>}</tr>))}</tbody></table></Card></div>);
const SubjectListPage: React.FC<{ subjects: Subject[], teachers: Teacher[], openModal: (modal: any) => void, permissions: Permissions }> = ({ subjects, teachers, openModal, permissions }) => { const getTeacherName = (id?: number) => { if (!id) return 'No asignado'; const teacher = teachers.find(t => t.id === id); return teacher ? `${teacher.name} ${teacher.lastName}` : 'Desconocido'; }; return (<div><PageTitle title="Gestión de Asignaturas">{permissions.canCreate && <Button onClick={() => openModal({ type: 'ADD_SUBJECT' })}>{Icons.plus}<span>Agregar Asignatura</span></Button>}</PageTitle><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{subjects.map(subject => (<Card key={subject.id} className="flex flex-col"><div className="flex-1"><h3 className="font-bold text-lg">{subject.name}</h3><p className="text-sm text-medium-text">{subject.code} - Semestre {subject.semester}</p><p className="mt-2 text-sm">{subject.description}</p><div className="mt-4 pt-4 border-t"><p className="text-sm"><strong>Docente:</strong> {getTeacherName(subject.teacherId)}</p><p className="text-sm"><strong>Créditos:</strong> {subject.credits}</p></div></div>{(permissions.canEdit || permissions.canDelete) && <div className="flex justify-end space-x-2 mt-4">{permissions.canEdit && <Button onClick={() => openModal({ type: 'EDIT_SUBJECT', data: subject })} className="p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-800" title="Editar">{Icons.edit}</Button>}{permissions.canDelete && <Button onClick={() => openModal({ type: 'DELETE_SUBJECT', data: subject })} className="p-2 text-red-500 hover:bg-red-100 hover:text-red-700" title="Eliminar">{Icons.delete}</Button>}</div>}</Card>))}</div></div>);};
const GradeManagerPage: React.FC<{ grades: Grade[], students: Student[], subjects: Subject[], teachers: Teacher[], openModal: (modal: any) => void, permissions: Permissions }> = ({ grades, students, subjects, teachers, openModal, permissions }) => {
    const [filters, setFilters] = useState({ studentId: '', subjectId: '', teacherId: '' });

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const filteredGrades = useMemo(() => {
        return grades.filter(grade => {
            const teacherSubjectIds = filters.teacherId ? subjects.filter(s => s.teacherId === parseInt(filters.teacherId)).map(s => s.id) : [];
            
            const studentMatch = !filters.studentId || grade.studentId === parseInt(filters.studentId);
            const subjectMatch = !filters.subjectId || grade.subjectId === parseInt(filters.subjectId);
            const teacherMatch = !filters.teacherId || teacherSubjectIds.includes(grade.subjectId);

            return studentMatch && subjectMatch && teacherMatch;
        });
    }, [grades, subjects, filters]);

    const findStudent = (id: number) => students.find(s => s.id === id);
    const findSubject = (id: number) => subjects.find(s => s.id === id);

    return (
        <div>
            <PageTitle title="Gestión de Calificaciones">
                {permissions.canCreate && <Button onClick={() => openModal({ type: 'ADD_GRADE' })}>{Icons.plus}<span>Agregar Calificación</span></Button>}
            </PageTitle>
            
            <Card className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label className="font-semibold text-sm">Filtrar por Alumno</label>
                        <Select name="studentId" value={filters.studentId} onChange={handleFilterChange}>
                            <option value="">Todos los Alumnos</option>
                            {students.map(s => <option key={s.id} value={s.id}>{s.name} {s.lastName}</option>)}
                        </Select>
                    </div>
                     <div>
                        <label className="font-semibold text-sm">Filtrar por Asignatura</label>
                        <Select name="subjectId" value={filters.subjectId} onChange={handleFilterChange}>
                            <option value="">Todas las Asignaturas</option>
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </Select>
                    </div>
                     <div>
                        <label className="font-semibold text-sm">Filtrar por Docente</label>
                        <Select name="teacherId" value={filters.teacherId} onChange={handleFilterChange}>
                            <option value="">Todos los Docentes</option>
                            {teachers.map(t => <option key={t.id} value={t.id}>{t.name} {t.lastName}</option>)}
                        </Select>
                    </div>
                </div>
                 <div className="border-t mt-4 pt-4 flex justify-end space-x-2">
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
                    <table className="w-full text-left min-w-[900px]">
                        <thead>
                            <tr className="border-b">
                                <th className="p-4 font-semibold text-dark-text sticky left-0 bg-white z-10 w-48 border-r">Alumno</th>
                                <th className="p-4 font-semibold text-dark-text sticky left-48 bg-white z-10 w-64 border-r">Asignatura</th>
                                <th className="p-4 font-semibold text-center text-dark-text">Promedio</th>
                                <th className="p-4 font-semibold text-dark-text">Estado</th>
                                <th className="p-4 font-semibold text-dark-text">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredGrades.length > 0 ? filteredGrades.map(grade => {
                                const student = findStudent(grade.studentId);
                                const subject = findSubject(grade.subjectId);
                                return (
                                    <tr key={grade.id} className="border-b last:border-0 hover:bg-slate-50">
                                        <td className="p-4 font-medium text-dark-text sticky left-0 bg-white z-10 border-r">{student?.name} {student?.lastName}</td>
                                        <td className="p-4 text-dark-text sticky left-48 bg-white z-10 border-r">{subject?.name}</td>
                                        <td className="p-4 text-center font-bold text-dark-text">{calculateFinalGrade(grade)}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${grade.isFinalized ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                                {grade.isFinalized ? 'Finalizada' : 'En Progreso'}
                                            </span>
                                        </td>
                                        <td className="p-4 flex space-x-2">
                                            {permissions.canEdit && <Button
                                                onClick={() => openModal({ type: 'EVALUATE_GRADE', data: { grade, student, subject } })}
                                                className="bg-slate-200 text-slate-800 hover:bg-slate-300"
                                                disabled={!student || !subject}
                                            >
                                                <span>Evaluar</span>
                                            </Button>}
                                            {permissions.canDelete && <Button onClick={() => openModal({ type: 'DELETE_GRADE', data: grade })} className="p-2 text-red-500 hover:bg-red-100 hover:text-red-700" title="Eliminar">{Icons.delete}</Button>}
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr><td colSpan={5} className="text-center p-8 text-medium-text">No se encontraron calificaciones con los filtros seleccionados.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};
const CalendarPage: React.FC<{ calendarEvents: CalendarEvent[], openModal: (modal: any) => void, permissions: Permissions }> = ({ calendarEvents, openModal, permissions }) => { const [currentDate, setCurrentDate] = useState(new Date()); const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1); const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0); const startDay = startOfMonth.getDay(); const daysInMonth = endOfMonth.getDate(); const days = Array.from({ length: startDay === 0 ? 6 : startDay - 1 }, () => null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1)); const eventsByDate = useMemo(() => { const map = new Map<number, CalendarEvent[]>(); calendarEvents.forEach(event => { if (event.start.getMonth() === currentDate.getMonth() && event.start.getFullYear() === currentDate.getFullYear()) { const day = event.start.getDate(); if (!map.has(day)) map.set(day, []); map.get(day)?.push(event); } }); return map; }, [calendarEvents, currentDate]); const changeMonth = (offset: number) => { setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1)); }; return (<div><PageTitle title="Calendario Académico"><div className="flex items-center space-x-4"><div className="flex items-center space-x-2"><Button onClick={() => changeMonth(-1)} className="bg-slate-200 text-slate-800 hover:bg-slate-300">‹</Button><h3 className="text-xl font-semibold w-48 text-center">{currentDate.toLocaleString('es-CL', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())}</h3><Button onClick={() => changeMonth(1)} className="bg-slate-200 text-slate-800 hover:bg-slate-300">›</Button></div>{permissions.canCreate &&<Button onClick={() => openModal({ type: 'ADD_EVENT' })}>{Icons.plus}<span>Agregar Evento</span></Button>}</div></PageTitle><Card><div className="grid grid-cols-7 text-center font-bold text-medium-text">{['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => <div key={day} className="py-2">{day}</div>)}</div><div className="grid grid-cols-7 border-t border-l">{days.map((day, index) => (<div key={index} className="h-36 border-r border-b p-2 flex flex-col">{day && <span className="font-semibold">{day}</span>}<div className="flex-1 overflow-y-auto text-xs space-y-1 mt-1">{day && eventsByDate.get(day)?.map(event => (<div key={event.id} className={`p-1 rounded border-l-4 ${getEventTypeStyles(event.type)}`}>{event.title}</div>))}</div></div>))}</div></Card></div>) };
const NewsPage: React.FC<{ news: NewsArticle[], openModal: (modal: any) => void, permissions: Permissions }> = ({ news, openModal, permissions }) => ( <div><PageTitle title="Noticias y Anuncios">{permissions.canCreate && <Button onClick={() => openModal({ type: 'ADD_NEWS' })}>{Icons.plus}<span>Agregar Noticia</span></Button>}</PageTitle><div className="grid grid-cols-1 md:grid-cols-2 gap-8">{news.map(article => ( <Card key={article.id}><img src={article.imageUrl} alt={article.title} className="w-full h-48 object-cover rounded-t-lg mb-4" /><h3 className="text-xl font-bold">{article.title}</h3><p className="text-xs text-medium-text mt-1 mb-2">{article.author} - {article.date.toLocaleDateString('es-CL')}</p><p className="text-dark-text">{article.content}</p>{article.link && <a href={article.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline mt-2 inline-block">{article.linkText || 'Leer más'}</a>}{(permissions.canEdit || permissions.canDelete) && <div className="flex justify-end space-x-2 mt-4">{permissions.canEdit && <Button onClick={() => openModal({ type: 'EDIT_NEWS', data: article })} className="p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-800" title="Editar">{Icons.edit}</Button>}{permissions.canDelete && <Button onClick={() => openModal({ type: 'DELETE_NEWS', data: article })} className="p-2 text-red-500 hover:bg-red-100 hover:text-red-700" title="Eliminar">{Icons.delete}</Button>}</div>}</Card> ))}</div></div> );
const OfficialDocumentsPage: React.FC<{ officialDocuments: OfficialDocument[] }> = ({ officialDocuments }) => ( <div><PageTitle title="Documentos Oficiales" /><Card><table className="w-full text-left"><thead><tr className="border-b"><th className="p-4 font-semibold text-dark-text">Título</th><th className="p-4 font-semibold text-dark-text">Descripción</th><th className="p-4 font-semibold text-dark-text">Fecha de Subida</th><th className="p-4 font-semibold text-dark-text">Autor</th><th className="p-4 font-semibold text-dark-text">Acciones</th></tr></thead><tbody>{officialDocuments.map(doc => (<tr key={doc.id} className="border-b last:border-0 hover:bg-slate-50"><td className="p-4 font-medium text-dark-text">{doc.title}</td><td className="p-4 text-dark-text">{doc.description}</td><td className="p-4 text-dark-text">{doc.uploadDate.toLocaleDateString('es-CL')}</td><td className="p-4 text-dark-text">{doc.author}</td><td className="p-4"><a href={doc.file.url} target="_blank" rel="noreferrer" className="flex items-center space-x-2 px-4 py-2 rounded-md bg-slate-200 text-slate-800 hover:bg-slate-300 font-semibold transition-colors duration-200">{Icons.view}<span>Ver</span></a></td></tr>))}</tbody></table></Card></div> );
const MeetingRecordsPage: React.FC<{ meetingRecords: MeetingRecord[], students: Student[], teachers: Teacher[], openModal: (modal: any) => void, permissions: Permissions }> = ({ meetingRecords, students, teachers, openModal, permissions }) => { const getAttendees = (record: MeetingRecord) => { const teacherNames = record.attendees.teachers.map(id => teachers.find(t => t.id === id)?.name).filter(Boolean).join(', '); const studentNames = record.attendees.students.map(id => students.find(s => s.id === id)?.name).filter(Boolean).join(', '); return `Docentes: ${teacherNames || 'N/A'}. Alumnos: ${studentNames || 'N/A'}.`; }; return ( <div><PageTitle title="Registro de Reuniones">{permissions.canCreate && <Button onClick={() => openModal({ type: 'ADD_MEETING' })}>{Icons.plus}<span>Registrar Reunión</span></Button>}</PageTitle><div className="space-y-6">{meetingRecords.map(record => ( <Card key={record.id}><h3 className="text-xl font-bold">{record.title}</h3><p className="text-sm text-medium-text">{record.date.toLocaleDateString('es-CL')} | {record.startTime} - {record.endTime}</p><p className="mt-2">{record.details}</p><p className="mt-4 text-sm font-semibold">Asistentes:</p><p className="text-sm">{getAttendees(record)}</p>{(permissions.canEdit || permissions.canDelete) && <div className="flex justify-end space-x-2 mt-4">{permissions.canEdit && <Button onClick={() => openModal({ type: 'EDIT_MEETING', data: record })} className="p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-800" title="Editar">{Icons.edit}</Button>}{permissions.canDelete && <Button onClick={() => openModal({ type: 'DELETE_MEETING', data: record })} className="p-2 text-red-500 hover:bg-red-100 hover:text-red-700" title="Eliminar">{Icons.delete}</Button>}</div>}</Card> ))}</div></div> ); };
const SiteManagementPage: React.FC<{ siteLog: SiteLog[], users: User[], onUpdateUserRole: (userId: string, role: Role) => void }> = ({ siteLog, users, onUpdateUserRole }) => { const [activeTab, setActiveTab] = useState<'users' | 'logs'>('users'); return ( <div className="space-y-8"> <PageTitle title="Gestión del Sitio" /> <Card> <div className="border-b border-slate-200 mb-4"> <nav className="flex space-x-4" aria-label="Tabs"> <button onClick={() => setActiveTab('users')} className={`px-3 py-2 font-medium text-sm rounded-t-lg ${activeTab === 'users' ? 'border-b-2 border-primary text-primary' : 'text-slate-500 hover:text-slate-700'}`}> Gestión de Usuarios </button> <button onClick={() => setActiveTab('logs')} className={`px-3 py-2 font-medium text-sm rounded-t-lg ${activeTab === 'logs' ? 'border-b-2 border-primary text-primary' : 'text-slate-500 hover:text-slate-700'}`}> Log de Acciones </button> </nav> </div> {activeTab === 'users' && <UserManagementTable users={users} onUpdateUserRole={onUpdateUserRole} />} {activeTab === 'logs' && <SiteLogTable siteLog={siteLog} />} </Card> </div> ); };
const UserManagementTable: React.FC<{ users: User[], onUpdateUserRole: (userId: string, role: Role) => void }> = ({ users, onUpdateUserRole }) => { return ( <table className="w-full text-left"> <thead> <tr className="border-b"> <th className="p-4 font-semibold text-dark-text">Nombre</th> <th className="p-4 font-semibold text-dark-text">Email</th> <th className="p-4 font-semibold text-dark-text">Tipo</th> <th className="p-4 font-semibold text-dark-text">Rol</th> </tr> </thead> <tbody> {users.map(user => ( <tr key={user.id} className="border-b last:border-0 hover:bg-slate-50"> <td className="p-4 font-medium text-dark-text">{user.name} {user.lastName}</td> <td className="p-4 text-dark-text">{user.email}</td> <td className="p-4 text-dark-text">{user.type}</td> <td className="p-4"> <Select value={user.role} onChange={(e) => onUpdateUserRole(user.id, e.target.value as Role)} > <option value="Administrador">Administrador</option> <option value="Docente">Docente</option> <option value="Alumno">Alumno</option> </Select> </td> </tr> ))} </tbody> </table> ); };
const SiteLogTable: React.FC<{ siteLog: SiteLog[] }> = ({ siteLog }) => { return ( <table className="w-full text-left"> <thead> <tr className="border-b"> <th className="p-4 font-semibold text-dark-text">Fecha y Hora</th> <th className="p-4 font-semibold text-dark-text">Usuario</th> <th className="p-4 font-semibold text-dark-text">Acción</th> <th className="p-4 font-semibold text-dark-text">Descripción</th> </tr> </thead> <tbody> {[...siteLog].reverse().map(log => ( <tr key={log.id} className="border-b last:border-0 hover:bg-slate-50"> <td className="p-4 text-dark-text">{log.timestamp.toLocaleString('es-CL')}</td> <td className="p-4 text-dark-text">{log.user}</td> <td className="p-4"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${log.action.includes('Crear') ? 'bg-green-100 text-green-800' : log.action.includes('Eliminar') ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>{log.action}</span></td> <td className="p-4 text-dark-text">{log.description}</td> </tr> ))} {siteLog.length === 0 && <tr><td colSpan={4} className="text-center p-8 text-medium-text">No hay acciones registradas.</td></tr>} </tbody> </table> ); };
const StudentFilesPage: React.FC<any> = ({ students, anotaciones, professionalActivities, personalDocuments, gradeReports, subjects, surveys, openModal, permissions, currentUser, selectedFileId }) => { const visibleStudents = permissions.canEdit ? students : students.filter((s: Student) => s.id === currentUser.originalId); return ( <FilesPage title="Expediente de Alumnos" persons={visibleStudents} getAnotaciones={id => anotaciones.filter((a: Anotacion) => a.studentId === id)} getProfessionalActivities={id => professionalActivities.filter((a: ProfessionalActivity) => a.studentId === id)} getPersonalDocuments={id => personalDocuments.filter((doc: PersonalDocument) => doc.ownerType === 'student' && doc.ownerId === id)} getGradeReports={id => gradeReports.filter((r: GradeReport) => r.studentId === id)} getSurveys={id => surveys.filter((s: Survey) => s.studentId === id)} subjects={subjects} openModal={openModal} personType="student" permissions={permissions} selectedFileId={selectedFileId} /> );};
const TeacherFilesPage: React.FC<any> = ({ teachers, teacherProfessionalActivities, personalDocuments, openModal, permissions, selectedFileId }) => ( <FilesPage title="Expediente de Docentes" persons={teachers} getAnotaciones={() => []} getProfessionalActivities={id => teacherProfessionalActivities.filter((a: TeacherProfessionalActivity) => a.teacherId === id)} getPersonalDocuments={id => personalDocuments.filter((doc: PersonalDocument) => doc.ownerType === 'teacher' && doc.ownerId === id)} openModal={openModal} personType="teacher" permissions={permissions} selectedFileId={selectedFileId} />);
const SurveyManagementPage: React.FC<{ surveys: Survey[], students: Student[], subjects: Subject[], teachers: Teacher[] }> = ({ surveys, students, subjects, teachers }) => {
    const [filters, setFilters] = useState({ subjectId: '', teacherId: '' });
    const completedSurveys = useMemo(() => surveys.filter(s => s.status === 'Completada'), [surveys]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const filteredSurveys = useMemo(() => {
        return completedSurveys.filter(survey => {
            const subjectMatch = !filters.subjectId || survey.subjectId === parseInt(filters.subjectId);
            const teacherMatch = !filters.teacherId || survey.teacherId === parseInt(filters.teacherId);
            return subjectMatch && teacherMatch;
        });
    }, [completedSurveys, filters]);
    
    const findStudent = (id: number) => students.find(s => s.id === id);
    const findSubject = (id: number) => subjects.find(s => s.id === id);
    const findTeacher = (id?: number) => teachers.find(t => t.id === id);

    return (
        <div>
            <PageTitle title="Gestión de Encuestas" />
            <Card className="mb-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                    <div>
                        <label className="font-semibold text-sm">Filtrar por Asignatura</label>
                        <Select name="subjectId" value={filters.subjectId} onChange={handleFilterChange}>
                            <option value="">Todas las Asignaturas</option>
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </Select>
                    </div>
                     <div>
                        <label className="font-semibold text-sm">Filtrar por Docente</label>
                        <Select name="teacherId" value={filters.teacherId} onChange={handleFilterChange}>
                            <option value="">Todos los Docentes</option>
                            {teachers.map(t => <option key={t.id} value={t.id}>{t.name} {t.lastName}</option>)}
                        </Select>
                    </div>
                    <div className="md:col-start-3 flex justify-end">
                        <Button onClick={() => exportSurveysToCsv(filteredSurveys, students, subjects, teachers)} className="bg-green-600 hover:bg-green-700 text-white" disabled={filteredSurveys.length === 0}>
                            {Icons.excel}<span>Exportar a Excel</span>
                        </Button>
                    </div>
                </div>
            </Card>
            <Card>
                 <table className="w-full text-left">
                    <thead>
                        <tr className="border-b">
                            <th className="p-4 font-semibold text-dark-text">Alumno</th>
                            <th className="p-4 font-semibold text-dark-text">Asignatura</th>
                            <th className="p-4 font-semibold text-dark-text">Docente</th>
                            <th className="p-4 font-semibold text-dark-text">Fecha Completada</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSurveys.length > 0 ? filteredSurveys.map(survey => {
                            const student = findStudent(survey.studentId);
                            const subject = findSubject(survey.subjectId);
                            const teacher = findTeacher(survey.teacherId);
                            return (
                                <tr key={survey.id} className="border-b last:border-0 hover:bg-slate-50">
                                    <td className="p-4 font-medium text-dark-text">{student?.name} {student?.lastName}</td>
                                    <td className="p-4 text-dark-text">{subject?.name}</td>
                                    <td className="p-4 text-dark-text">{teacher?.name} {teacher?.lastName}</td>
                                    <td className="p-4 text-dark-text">{survey.completionDate ? new Date(survey.completionDate).toLocaleString('es-CL') : 'N/A'}</td>
                                </tr>
                            );
                        }) : (
                            <tr><td colSpan={4} className="text-center p-8 text-medium-text">No se encontraron encuestas completadas con los filtros seleccionados.</td></tr>
                        )}
                    </tbody>
                </table>
            </Card>
        </div>
    );
};

const FilesPage: React.FC<any> = ({ title, persons, getAnotaciones, getProfessionalActivities, getPersonalDocuments, getGradeReports, getSurveys, subjects, openModal, personType, permissions, selectedFileId }) => {
    const [selectedPerson, setSelectedPerson] = useState<(Student | Teacher) | null>(null);
    
    useEffect(() => {
        if (selectedFileId) {
            const personToSelect = persons.find((p: any) => p.id === selectedFileId);
            if (personToSelect) {
                setSelectedPerson(personToSelect);
            }
        } else if (!selectedPerson && persons.length > 0) {
             setSelectedPerson(persons[0]);
        }
    }, [selectedFileId, persons]);

    useEffect(() => { 
        if (persons.length > 0) {
            const currentSelectionExists = persons.some((p: any) => p.id === selectedPerson?.id);
            if (!currentSelectionExists) {
                 setSelectedPerson(persons[0]);
            }
        } else {
             setSelectedPerson(null);
        }
    }, [persons]);

    return (
        <div><PageTitle title={title} /><div className="flex space-x-8 items-start"><div className="w-1/4"><Card><ul className="space-y-2 max-h-[70vh] overflow-y-auto">{persons.map((person: Student | Teacher) => ( <li key={person.id}><button onClick={() => setSelectedPerson(person)} className={`w-full text-left px-4 py-2 rounded-lg ${selectedPerson?.id === person.id ? 'bg-primary text-white' : 'hover:bg-slate-100'}`}>{person.name} {person.lastName}</button></li> ))}</ul></Card></div><div className="w-3/4">{selectedPerson ? ( <PersonProfile person={selectedPerson} anotaciones={getAnotaciones(selectedPerson.id)} activities={getProfessionalActivities(selectedPerson.id)} documents={getPersonalDocuments(selectedPerson.id)} gradeReports={getGradeReports ? getGradeReports(selectedPerson.id) : []} surveys={getSurveys ? getSurveys(selectedPerson.id) : []} subjects={subjects} openModal={openModal} personType={personType} permissions={permissions}/> ) : ( <Card><p>Seleccione una persona para ver su expediente.</p></Card> )}</div></div></div>
    );
};

const PersonProfile: React.FC<any> = ({ person, anotaciones, activities, documents, gradeReports, surveys, subjects, openModal, personType, permissions }) => {
    
    const studentTabs = ['Resumen', 'Informes', 'Anotaciones', 'Actividad', 'Documentos', 'Encuestas'];
    const teacherTabs = ['Resumen', 'Actividad', 'Documentos'];
    const availableTabs = personType === 'student' ? studentTabs : teacherTabs;
    
    const [activeTab, setActiveTab] = useState(availableTabs[0]);
    
    useEffect(() => { setActiveTab(availableTabs[0]); }, [person]);

    const handleDownloadPdf = () => {
        const reportData = {
            gradeReports,
            anotaciones,
            activities,
            subjects
        };
        generatePdfReport(person, personType, reportData);
    };

    const TabButton: React.FC<{label: string; children: React.ReactNode}> = ({ label, children }) => ( <button onClick={() => setActiveTab(label)} className={`px-4 py-2 font-semibold border-b-2 transition-colors flex items-center space-x-2 ${activeTab === label ? 'border-primary text-primary' : 'border-transparent text-medium-text hover:text-dark-text'}`}>{children}</button> );
    const handleAddClick = () => {
        switch(activeTab) {
            case 'Anotaciones': openModal({ type: 'ADD_ANOTACION', data: { studentId: person.id } }); break;
            case 'Actividad': openModal({ type: 'ADD_ACTIVITY', data: { personId: person.id, personType } }); break;
            case 'Documentos': openModal({ type: 'ADD_DOCUMENT', data: { personId: person.id, personType } }); break;
        }
    };
    const getAddButtonText = () => {
         switch(activeTab) {
            case 'Anotaciones': return 'Agregar Anotación';
            case 'Actividad': return 'Agregar Actividad';
            case 'Documentos': return 'Agregar Documento';
            default: return '';
        }
    }

    const renderTabContent = () => {
        const recentReports = [...(gradeReports || [])].sort((a,b) => b.generationDate.getTime() - a.generationDate.getTime()).slice(0, 2);
        const recentAnotaciones = [...anotaciones].sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 2);
        const recentActivities = [...activities].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 2);
        const recentDocuments = [...documents].sort((a,b) => b.uploadDate.getTime() - a.uploadDate.getTime()).slice(0, 2);

        switch(activeTab) {
            case 'Resumen': return ( <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"> {personType === 'student' && recentReports.length > 0 && <Card> <h4 className="font-bold mb-2">Informes Recientes</h4> <FullReportList reports={recentReports} subjects={subjects} openModal={openModal} person={person} permissions={permissions}/> </Card>} {personType === 'student' && recentAnotaciones.length > 0 && <Card> <h4 className="font-bold mb-2">Anotaciones Recientes</h4> <FullAnotacionList anotaciones={recentAnotaciones} /> </Card>} {recentActivities.length > 0 && <Card> <h4 className="font-bold mb-2">Actividad Reciente</h4> <FullActivityList activities={recentActivities} /> </Card>} {recentDocuments.length > 0 && <Card> <h4 className="font-bold mb-2">Documentos Recientes</h4> <FullDocumentList documents={recentDocuments} /> </Card>} </div> );
            case 'Informes': return <Card> <FullReportList reports={gradeReports} subjects={subjects} openModal={openModal} person={person} permissions={permissions}/> </Card>;
            case 'Anotaciones': return <Card> <FullAnotacionList anotaciones={anotaciones} /> </Card>;
            case 'Actividad': return <Card> <FullActivityList activities={activities} /> </Card>;
            case 'Documentos': return <Card> <FullDocumentList documents={documents} /> </Card>;
            case 'Encuestas': return <Card> <FullSurveyList surveys={surveys} subjects={subjects} student={person} openModal={openModal} permissions={permissions}/> </Card>;
            default: return null;
        }
    };

    const FullReportList = ({ reports, subjects, openModal, person, permissions }: any) => ( <ul className="space-y-3">{reports.map((r: GradeReport) => { const subject = subjects.find((s: Subject) => s.id === r.subjectId); return (<li key={r.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg"><div className="font-medium">{subject?.name} - {r.generationDate.toLocaleDateString('es-CL')}</div><div><span className={`px-2 py-1 text-xs font-semibold rounded-full mr-4 ${r.status === 'Completado' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{r.status}</span>{permissions.canEdit && <Button onClick={() => openModal({ type: 'VIEW_REPORT', data: { report: r, student: person, subject } })} className="bg-white border border-primary text-primary hover:bg-primary-light">Ver y Firmar</Button>}</div></li>)})}</ul> );
    const FullAnotacionList = ({ anotaciones }: any) => ( <ul className="space-y-4 max-h-96 overflow-y-auto">{anotaciones.map((a: Anotacion) => <li key={a.id} className="border-l-4 pl-4 data-[type=Positiva]:border-green-500 data-[type=Negativa]:border-red-500 data-[type=Observación]:border-yellow-500" data-type={a.type}><p>{a.text}</p><p className="text-xs text-light-text mt-1">{a.timestamp.toLocaleDateString('es-CL')} - {a.type}</p></li>)}</ul> );
    const FullActivityList = ({ activities }: any) => (  <ul className="space-y-2">{activities.map((a: any) => <li key={a.id}>{a.title} ({a.type}) - {new Date(a.date).toLocaleDateString('es-CL')}</li>)}</ul> );
    const FullDocumentList = ({ documents }: any) => ( <ul className="space-y-2">{documents.map((d: PersonalDocument) => <li key={d.id} className="flex items-center justify-between"><a href={d.file.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">{d.file.name}</a></li>)}</ul> );
    const FullSurveyList = ({ surveys, subjects, student, openModal, permissions }: { surveys: Survey[], subjects: Subject[], student: Student, openModal: (modal: any) => void, permissions: Permissions }) => {
        const incompleteSurveys = surveys.filter((s: Survey) => s.status === 'Incompleta');

        return (
            <div>
                {incompleteSurveys.length > 0 && permissions.canEdit && (
                    <div className="p-4 mb-4 bg-amber-50 border-l-4 border-amber-400 text-amber-700 rounded-md" role="alert">
                        <h4 className="font-bold">Encuestas Pendientes</h4>
                        <p>Tiene {incompleteSurveys.length} encuesta(s) pendiente(s) por completar. Su feedback es muy importante para la mejora continua del programa.</p>
                    </div>
                )}
                <ul className="space-y-3">
                    {surveys.length === 0 && <p className="text-medium-text">No hay encuestas disponibles para este alumno.</p>}
                    {surveys.map((s: Survey) => {
                        const subject = subjects.find((sub: Subject) => sub.id === s.subjectId);
                        return (
                            <li key={s.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                <div className="font-medium">{subject?.name}</div>
                                <div>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full mr-4 ${s.status === 'Completada' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>{s.status}</span>
                                    {s.status === 'Incompleta' && permissions.canEdit && (
                                        <Button onClick={() => openModal({ type: 'COMPLETE_SURVEY', data: { survey: s, student, subject } })} className="bg-primary text-white">Completar</Button>
                                    )}
                                </div>
                            </li>
                        )
                    })}
                </ul>
            </div>
        );
    };
    
    const incompleteSurveysCount = useMemo(() => personType === 'student' ? surveys.filter((s: Survey) => s.status === 'Incompleta').length : 0, [surveys, personType]);

    return (
        <div className="space-y-6">
            <Card className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                    <img src={person.photo} alt="" className="w-24 h-24 rounded-full object-cover border-4 border-primary-light bg-slate-200"/>
                    <div><h3 className="text-2xl font-bold">{person.name} {person.lastName}</h3><p className="text-medium-text">{person.email}</p><p className="text-medium-text">{person.phone}</p></div>
                </div>
                <div>
                    <Button onClick={handleDownloadPdf} className="bg-slate-600 hover:bg-slate-700 text-white">
                        {React.cloneElement(Icons.download, { className: 'w-5 h-5' })}
                        <span>Descargar Resumen PDF</span>
                    </Button>
                </div>
            </Card>
            
            <div className="bg-white rounded-lg shadow">
                 <div className="border-b border-slate-200 flex justify-between items-center px-6">
                    <nav className="flex space-x-2">
                        {availableTabs.map(tab => (
                            <TabButton key={tab} label={tab}>
                                <span>{tab}</span>
                                {tab === 'Encuestas' && incompleteSurveysCount > 0 && <span className="ml-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{incompleteSurveysCount}</span>}
                            </TabButton>
                        ))}
                    </nav>
                     {permissions.canCreate && activeTab !== 'Resumen' && activeTab !== 'Informes' && activeTab !== 'Encuestas' && <Button onClick={handleAddClick} className="bg-slate-200 text-slate-800 hover:bg-slate-300 my-2">{Icons.plus}<span>{getAddButtonText()}</span></Button> }
                </div>
                <div className="p-6"> {renderTabContent()} </div>
            </div>
        </div>
    );
};

// --- App Component & Main Logic ---
const App: React.FC = () => {
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
    const [users, setUsers] = useState<User[]>(initialUsers);
    
    const [currentView, setCurrentView] = useState<View>('DASHBOARD');
    const [isLoading, setIsLoading] = useState(true);
    const [modal, setModal] = useState<{ type: string; data?: any } | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(users.find(u => u.role === 'Administrador') || users[0]);
    const [selectedFileId, setSelectedFileId] = useState<number | null>(null);
    
    const permissions = useMemo<Permissions>(() => {
        if (!currentUser) return { canCreate: false, canEdit: false, canDelete: false, views: [] };
        switch(currentUser.role) {
            case 'Administrador':
                return { canCreate: true, canEdit: true, canDelete: true, views: ['DASHBOARD', 'STUDENTS', 'TEACHERS', 'SUBJECTS', 'GRADES', 'STUDENT_FILES', 'TEACHER_FILES', 'SURVEYS', 'CALENDAR', 'NEWS', 'DOCUMENTS', 'MEETINGS', 'SITE_MANAGEMENT'] };
            case 'Docente':
                 return { canCreate: true, canEdit: true, canDelete: false, views: ['DASHBOARD', 'STUDENTS', 'TEACHERS', 'SUBJECTS', 'GRADES', 'STUDENT_FILES', 'TEACHER_FILES', 'SURVEYS', 'CALENDAR', 'NEWS', 'DOCUMENTS', 'MEETINGS'] };
            case 'Alumno':
                 return { canCreate: false, canEdit: true, canDelete: false, views: ['DASHBOARD', 'STUDENT_FILES', 'CALENDAR', 'NEWS', 'DOCUMENTS'] };
            default:
                 return { canCreate: false, canEdit: false, canDelete: false, views: [] };
        }
    }, [currentUser]);

    useEffect(() => { const timer = setTimeout(() => setIsLoading(false), 500); return () => clearTimeout(timer); }, []);

    const logAction = (action: string, description: string) => {
        const user = currentUser ? `${currentUser.name} ${currentUser.lastName}` : "Sistema";
        const newLog: SiteLog = { id: Date.now(), timestamp: new Date(), user, action, description };
        setSiteLog(prev => [...prev, newLog]);
    };
    
    const navigateTo = (view: View) => {
        setSelectedFileId(null);
        setCurrentView(view);
    };

    // --- Data Handlers ---
    const handleSaveStudent = (student: Student) => { const isNew = student.id === 0; setStudents(prev => isNew ? [...prev, { ...student, id: Date.now() }] : prev.map(s => s.id === student.id ? student : s)); setModal(null); logAction(isNew ? 'Crear Alumno' : 'Editar Alumno', `${student.name} ${student.lastName}`); };
    const handleDeleteStudent = (student: Student) => { setStudents(prev => prev.filter(s => s.id !== student.id)); setModal(null); logAction('Eliminar Alumno', `${student.name} ${student.lastName}`); };
    const handleSaveTeacher = (teacher: Teacher) => { const isNew = teacher.id === 0; setTeachers(prev => isNew ? [...prev, { ...teacher, id: Date.now() }] : prev.map(t => t.id === teacher.id ? teacher : t)); setModal(null); logAction(isNew ? 'Crear Docente' : 'Editar Docente', `${teacher.name} ${teacher.lastName}`); };
    const handleDeleteTeacher = (teacher: Teacher) => { setTeachers(prev => prev.filter(t => t.id !== teacher.id)); setModal(null); logAction('Eliminar Docente', `${teacher.name} ${teacher.lastName}`); };
    const handleSaveSubject = (subject: Subject) => { const isNew = subject.id === 0; setSubjects(prev => isNew ? [...prev, { ...subject, id: Date.now() }] : prev.map(s => s.id === subject.id ? subject : s)); setModal(null); logAction(isNew ? 'Crear Asignatura' : 'Editar Asignatura', subject.name); };
    const handleDeleteSubject = (subject: Subject) => { setSubjects(prev => prev.filter(s => s.id !== subject.id)); setModal(null); logAction('Eliminar Asignatura', subject.name); };
    const handleAddGrade = (studentId: number, subjectId: number) => { const newGrade: Grade = { id: Date.now(), studentId, subjectId, lastModified: new Date().toISOString(), isFinalized: false }; setGrades(prev => [...prev, newGrade]); setModal(null); const studentName = students.find(s=>s.id === studentId)?.name; const subjectName = subjects.find(s=>s.id === subjectId)?.name; logAction('Crear Calificación', `Para ${studentName} en ${subjectName}`); };
    const handleDeleteGrade = (grade: Grade) => { setGrades(prev => prev.filter(g => g.id !== grade.id)); setModal(null); const studentName = students.find(s=>s.id === grade.studentId)?.name; const subjectName = subjects.find(s=>s.id === grade.subjectId)?.name; logAction('Eliminar Calificación', `Para ${studentName} en ${subjectName}`);};
    const handleGenerateReport = ( grade: Grade, gradeSummary: GradeReport['gradeSummary'], competencyScores: (number | null)[], feedback: string ) => { setGrades(prev => prev.map(g => g.id === grade.id ? { ...g, grade1: gradeSummary.grade1, grade2: gradeSummary.grade2, grade3: gradeSummary.grade3, competencyScores, isFinalized: true, lastModified: new Date().toISOString() } : g)); setGradeReports(prev => [...prev, { id: Date.now(), gradeId: grade.id, studentId: grade.studentId, subjectId: grade.subjectId, teacherId: teachers[0].id, generationDate: new Date(), gradeSummary, competencyScores, feedback, status: 'Pendiente Aceptación', signatureDate: new Date(), }]); const studentName = students.find(s=>s.id === grade.studentId)?.name; logAction('Generar Informe', `Para ${studentName}`); const existingSurvey = surveys.find(s => s.gradeId === grade.id); if (!existingSurvey) { const subject = subjects.find(s => s.id === grade.subjectId); const newSurvey: Survey = { id: Date.now(), gradeId: grade.id, studentId: grade.studentId, subjectId: grade.subjectId, teacherId: subject?.teacherId, status: 'Incompleta', answers: [] }; setSurveys(prev => [...prev, newSurvey]); } setModal(null); };
    const handleAcceptReport = (reportId: number) => { setGradeReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'Completado', studentAcceptanceDate: new Date() } : r)); setModal(null); const studentName = students.find(s=>s.id === gradeReports.find(r=>r.id === reportId)!.studentId)?.name; logAction('Aceptar Informe', `Por ${studentName}`); };
    const handleSaveAnotacion = (anotacion: Anotacion) => { setAnotaciones(prev => [...prev, { ...anotacion, id: Date.now(), timestamp: new Date() }]); setModal(null); const studentName = students.find(s=>s.id === anotacion.studentId)?.name; logAction('Crear Anotación', `Para ${studentName}`); };
    const handleSaveProfessionalActivity = (activity: ProfessionalActivity | TeacherProfessionalActivity) => { if ('studentId' in activity) { setProfessionalActivities(prev => [...prev, { ...activity, id: Date.now() }]); } else { setTeacherProfessionalActivities(prev => [...prev, { ...activity, id: Date.now() }]); } setModal(null); logAction('Crear Actividad Profesional', activity.title); };
    const handleSavePersonalDocument = (document: PersonalDocument) => { setPersonalDocuments(prev => [...prev, { ...document, id: Date.now(), uploadDate: new Date() }]); setModal(null); logAction('Subir Documento', document.title); };
    const handleSaveCalendarEvent = (event: CalendarEvent) => { const isNew = !event.id; setCalendarEvents(prev => isNew ? [...prev, { ...event, id: Date.now() }] : prev.map(e => e.id === event.id ? event : e)); setModal(null); logAction(isNew ? 'Crear Evento' : 'Editar Evento', event.title); };
    const handleDeleteCalendarEvent = (event: CalendarEvent) => { setCalendarEvents(prev => prev.filter(e => e.id !== event.id)); setModal(null); logAction('Eliminar Evento', event.title); };
    const handleSaveNewsArticle = (article: NewsArticle) => { const isNew = !article.id; setNews(prev => isNew ? [...prev, { ...article, id: Date.now() }] : prev.map(a => a.id === article.id ? article : a)); setModal(null); logAction(isNew ? 'Crear Noticia' : 'Editar Noticia', article.title); };
    const handleDeleteNewsArticle = (article: NewsArticle) => { setNews(prev => prev.filter(a => a.id !== article.id)); setModal(null); logAction('Eliminar Noticia', article.title); };
    const handleSaveMeetingRecord = (record: MeetingRecord) => { const isNew = !record.id; setMeetingRecords(prev => isNew ? [...prev, { ...record, id: Date.now() }] : prev.map(r => r.id === record.id ? record : r)); setModal(null); logAction(isNew ? 'Crear Reunión' : 'Editar Reunión', record.title); };
    const handleDeleteMeetingRecord = (record: MeetingRecord) => { setMeetingRecords(prev => prev.filter(r => r.id !== record.id)); setModal(null); logAction('Eliminar Reunión', record.title); };
    const handleSaveQuickLink = (link: QuickLink) => { const isNew = link.id === 0; setQuickLinks(prev => isNew ? [...prev, { ...link, id: Date.now() }] : prev.map(l => l.id === link.id ? link : l)); setModal(null); logAction(isNew ? 'Crear Enlace Rápido' : 'Editar Enlace Rápido', link.label); };
    const handleDeleteQuickLink = (link: QuickLink) => { setQuickLinks(prev => prev.filter(l => l.id !== link.id)); setModal(null); logAction('Eliminar Enlace Rápido', link.label); };
    const handleSaveSurvey = (survey: Survey, answers: SurveyAnswer[]) => { setSurveys(prev => prev.map(s => s.id === survey.id ? { ...s, status: 'Completada', completionDate: new Date().toISOString(), answers } : s)); setModal(null); const studentName = students.find(s => s.id === survey.studentId)?.name; const subjectName = subjects.find(s => s.id === survey.subjectId)?.name; logAction('Completar Encuesta', `Alumno: ${studentName}, Asignatura: ${subjectName}`); };
    const handleUpdateUserRole = (userId: string, role: Role) => { setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u)); logAction('Actualizar Rol de Usuario', `Usuario ID: ${userId}, Nuevo Rol: ${role}`); };
    const handleUserChange = (userId: string) => { const newCurrentUser = users.find(u => u.id === userId); if (newCurrentUser) { setCurrentUser(newCurrentUser); if (!permissions.views.includes(currentView)) { setCurrentView('DASHBOARD'); } } };
    
    const handleGlobalSearchSelect = (item: Student | Teacher | Subject, type: 'student' | 'teacher' | 'subject') => {
        if (type === 'student') {
            setSelectedFileId(item.id);
            setCurrentView('STUDENT_FILES');
        } else if (type === 'teacher') {
            setSelectedFileId(item.id);
            setCurrentView('TEACHER_FILES');
        } else if (type === 'subject') {
            setCurrentView('SUBJECTS');
        }
    };
    
    useEffect(() => {
        if (currentUser && !permissions.views.includes(currentView)) {
            setCurrentView('DASHBOARD');
        }
    }, [currentUser, permissions, currentView]);


    // FIX: Changed `onUpdateUserRole` to `onUpdateUserRole: handleUpdateUserRole` because `onUpdateUserRole` is not defined.
    const dataContext = { students, teachers, subjects, grades, activityLog, anotaciones, calendarEvents, news, gradeReports, officialDocuments, meetingRecords, professionalActivities, teacherProfessionalActivities, personalDocuments, siteLog, quickLinks, surveys, users, openModal: setModal, setCurrentView: navigateTo, permissions, currentUser, onUpdateUserRole: handleUpdateUserRole, selectedFileId };
    
    if (isLoading || !currentUser) return <LoadingScreen />;

    return (
        <div className="flex h-screen bg-light-bg text-dark-text">
            <Sidebar currentView={currentView} setCurrentView={navigateTo} permissions={permissions} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header user={currentUser} allUsers={users} onUserChange={handleUserChange} students={students} teachers={teachers} subjects={subjects} onSearchResultSelect={handleGlobalSearchSelect}/>
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-8">
                    <RenderView view={currentView} data={dataContext} />
                </main>
            </div>
            {modal?.type.startsWith('DELETE_') && <ConfirmDeleteModal title={`Eliminar ${modal.type.split('_')[1].toLowerCase()}`} message="¿Está seguro que desea eliminar este registro? Esta acción no se puede deshacer." onCancel={() => setModal(null)} onConfirm={() => {
                switch(modal.type) {
                    case 'DELETE_STUDENT': handleDeleteStudent(modal.data); break;
                    case 'DELETE_TEACHER': handleDeleteTeacher(modal.data); break;
                    case 'DELETE_SUBJECT': handleDeleteSubject(modal.data); break;
                    case 'DELETE_GRADE': handleDeleteGrade(modal.data); break;
                    case 'DELETE_EVENT': handleDeleteCalendarEvent(modal.data); break;
                    case 'DELETE_NEWS': handleDeleteNewsArticle(modal.data); break;
                    case 'DELETE_MEETING': handleDeleteMeetingRecord(modal.data); break;
                    case 'DELETE_QUICK_LINK': handleDeleteQuickLink(modal.data); break;
                }
            }} />}
            {modal?.type === 'ADD_STUDENT' && <StudentFormModal onSave={handleSaveStudent} onClose={() => setModal(null)} />}
            {modal?.type === 'EDIT_STUDENT' && <StudentFormModal student={modal.data} onSave={handleSaveStudent} onClose={() => setModal(null)} />}
            {modal?.type === 'ADD_TEACHER' && <TeacherFormModal onSave={handleSaveTeacher} onClose={() => setModal(null)} />}
            {modal?.type === 'EDIT_TEACHER' && <TeacherFormModal teacher={modal.data} onSave={handleSaveTeacher} onClose={() => setModal(null)} />}
            {modal?.type === 'ADD_SUBJECT' && <SubjectFormModal teachers={teachers} onSave={handleSaveSubject} onClose={() => setModal(null)} />}
            {modal?.type === 'EDIT_SUBJECT' && <SubjectFormModal subject={modal.data} teachers={teachers} onSave={handleSaveSubject} onClose={() => setModal(null)} />}
            {modal?.type === 'ADD_GRADE' && <AddGradeModal students={students} subjects={subjects} onSave={handleAddGrade} onClose={() => setModal(null)} />}
            {modal?.type === 'EVALUATE_GRADE' && <EvaluationModal grade={modal.data.grade} student={modal.data.student} subject={modal.data.subject} onSave={handleGenerateReport} onClose={() => setModal(null)} />}
            {modal?.type === 'VIEW_REPORT' && <ReportViewerModal report={modal.data.report} student={modal.data.student} subject={modal.data.subject} onAccept={handleAcceptReport} onClose={() => setModal(null)} />}
            {modal?.type === 'ADD_ANOTACION' && <AnotacionFormModal studentId={modal.data.studentId} autorId={teachers[0].id} onSave={handleSaveAnotacion} onClose={() => setModal(null)} />}
            {modal?.type === 'ADD_ACTIVITY' && <ProfessionalActivityFormModal personId={modal.data.personId} personType={modal.data.personType} onSave={handleSaveProfessionalActivity} onClose={() => setModal(null)} />}
            {modal?.type === 'ADD_DOCUMENT' && <PersonalDocumentFormModal ownerId={modal.data.personId} ownerType={modal.data.personType} onSave={handleSavePersonalDocument} onClose={() => setModal(null)} />}
            {modal?.type === 'ADD_EVENT' && <CalendarEventFormModal onSave={handleSaveCalendarEvent} onClose={() => setModal(null)} />}
            {modal?.type === 'EDIT_EVENT' && <CalendarEventFormModal event={modal.data} onSave={handleSaveCalendarEvent} onClose={() => setModal(null)} />}
            {modal?.type === 'ADD_NEWS' && <NewsArticleFormModal onSave={handleSaveNewsArticle} onClose={() => setModal(null)} />}
            {modal?.type === 'EDIT_NEWS' && <NewsArticleFormModal article={modal.data} onSave={handleSaveNewsArticle} onClose={() => setModal(null)} />}
            {modal?.type === 'ADD_MEETING' && <MeetingRecordFormModal students={students} teachers={teachers} onSave={handleSaveMeetingRecord} onClose={() => setModal(null)} />}
            {modal?.type === 'EDIT_MEETING' && <MeetingRecordFormModal record={modal.data} students={students} teachers={teachers} onSave={handleSaveMeetingRecord} onClose={() => setModal(null)} />}
            {modal?.type === 'ADD_QUICK_LINK' && <QuickLinkFormModal onSave={handleSaveQuickLink} onClose={() => setModal(null)} />}
            {modal?.type === 'EDIT_QUICK_LINK' && <QuickLinkFormModal link={modal.data} onSave={handleSaveQuickLink} onClose={() => setModal(null)} />}
            {modal?.type === 'COMPLETE_SURVEY' && <SurveyFormModal survey={modal.data.survey} student={modal.data.student} subject={modal.data.subject} onSave={handleSaveSurvey} onClose={() => setModal(null)} />}
        </div>
    );
};

export default App;
