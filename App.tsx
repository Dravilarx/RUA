

import React, { useState, FC, ChangeEvent, useMemo, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Student, Teacher, Subject, Grade, ActivityLog, Anotacion, CalendarEvent, NewsArticle, GradeReport, OfficialDocument, MeetingRecord, ProfessionalActivity, ActivityType, TeacherProfessionalActivity, TeacherActivityType, PersonalDocument } from './types';
import { initialStudents, initialTeachers, initialSubjects, initialGrades, initialActivityLog, initialAnotaciones, initialCalendarEvents, initialNewsArticles, initialGradeReports, initialOfficialDocuments, initialMeetingRecords, initialProfessionalActivities, initialTeacherProfessionalActivities, initialPersonalDocuments } from './data';

// --- Helper & Utility Functions ---

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const getResidencyStatus = (admissionYear: number): { status: string; color: string } => {
  const currentYear = new Date().getFullYear();
  const yearsSinceAdmission = currentYear - admissionYear;
  if (yearsSinceAdmission < 1) {
    return { status: 'R1', color: 'bg-blue-200 text-blue-800' };
  } else if (yearsSinceAdmission < 2) {
    return { status: 'R2', color: 'bg-green-200 text-green-800' };
  } else {
    return { status: 'R3', color: 'bg-indigo-200 text-indigo-800' };
  }
};

const calculateAge = (birthDate: string): number | null => {
  if (!birthDate) return null;
  const today = new Date();
  const birthDateObj = new Date(birthDate);
  let age = today.getFullYear() - birthDateObj.getFullYear();
  const m = today.getMonth() - birthDateObj.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDateObj.getDate())) {
    age--;
  }
  return age;
};

const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return `Hace ${Math.floor(interval)} años`;
    interval = seconds / 2592000;
    if (interval > 1) return `Hace ${Math.floor(interval)} meses`;
    interval = seconds / 86400;
    if (interval > 1) return `Hace ${Math.floor(interval)} días`;
    interval = seconds / 3600;
    if (interval > 1) return `Hace ${Math.floor(interval)} horas`;
    interval = seconds / 60;
    if (interval > 1) return `Hace ${Math.floor(interval)} minutos`;
    return `Hace ${Math.floor(seconds)} segundos`;
};

const calculateFinalGrade = (grade: Pick<Grade, 'grade1' | 'grade2' | 'grade3'>) => {
    const { grade1, grade2, grade3 } = grade;
    if (grade1 == null || grade2 == null || grade3 == null) {
      return null;
    }
    // Formula corrected to sum up to 100%
    const final = (grade1 * 0.6) + (grade2 * 0.3) + (grade3 * 0.1);
    // Ensure grade is within 1.0-7.0 range
    return Math.max(1.0, Math.min(7.0, final));
};


// --- Export Utilities ---
const exportToCSV = (headers: {key: string, label: string}[], data: any[], filename: string) => {
    const csvRows = [];
    // Add headers
    csvRows.push(headers.map(h => h.label).join(','));

    // Add data rows
    for (const row of data) {
        const values = headers.map(header => {
            const val = header.key.split('.').reduce((o, i) => o ? o[i] : '', row); // handle nested keys
            const escaped = ('' + (val ?? '')).replace(/"/g, '""');
            return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};

const exportToPDF = (headers: {key: string, label: string}[], data: any[], title: string) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write('<html><head><title>' + title + '</title>');
        printWindow.document.write('<style>body{font-family:sans-serif;margin:2em}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background-color:#f2f2f2}</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write('<h1>' + title + '</h1>');
        printWindow.document.write('<table><thead><tr>');
        headers.forEach(h => {
            printWindow.document.write('<th>' + h.label + '</th>');
        });
        printWindow.document.write('</tr></thead><tbody>');
        data.forEach(row => {
            printWindow.document.write('<tr>');
            headers.forEach(header => {
                const val = header.key.split('.').reduce((o, i) => o ? o[i] : '', row);
                printWindow.document.write('<td>' + (val ?? '') + '</td>');
            });
            printWindow.document.write('</tr>');
        });
        printWindow.document.write('</tbody></table>');
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    }
};


// --- SVG Icons ---

const MenuIcon: FC<{ className?: string }> = ({ className }) => (
    <svg className={className} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
);
const UserIcon: FC<{ className?: string }> = ({ className }) => (
    <svg className={className} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);
const UsersIcon: FC<{ className?: string }> = ({ className }) => (
    <svg className={className} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
);
const BookOpenIcon: FC<{ className?: string }> = ({ className }) => (
    <svg className={className} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
);
const ClipboardIcon: FC<{ className?: string }> = ({ className }) => (
    <svg className={className} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
);
const FolderIcon: FC<{ className?: string }> = ({ className }) => (
    <svg className={className} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
);
const SettingsIcon: FC<{ className?: string }> = ({ className }) => (
    <svg className={className} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
);
const SearchIcon: FC<{ className?: string }> = ({ className }) => (
    <svg className={className} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);
const BellIcon: FC<{ className?: string }> = ({ className }) => (
    <svg className={className} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
);
const PlusIcon: FC<{ className?: string }> = ({ className }) => (
    <svg className={className} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);
const EditIcon: FC<{ className?: string }> = ({ className }) => (
    <svg className={className} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
);
const TrashIcon: FC<{ className?: string }> = ({ className }) => (
    <svg className={className} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
);
const CloseIcon: FC<{ className?: string }> = ({ className }) => (
    <svg className={className} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);
const UploadIcon: FC<{ className?: string }> = ({ className }) => (
    <svg className={className} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
);
const CheckSquareIcon: FC<{ className?: string }> = ({ className }) => (
    <svg className={className} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
);
const ChevronLeftIcon: FC<{ className?: string }> = ({ className }) => (
    <svg className={className} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><polyline points="15 18 9 12 15 6"></polyline></svg>
);
const CalendarIcon: FC<{ className?: string }> = ({ className }) => (
    <svg className={className} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
);
const NewspaperIcon: FC<{ className?: string }> = ({ className }) => (
    <svg className={className} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2h-2v-2h2"></path><path d="M8 2v20"></path><path d="M14 2v6h6"></path><path d="M14 10h6"></path><path d="M14 14h6"></path><path d="M14 18h6"></path></svg>
);
const SendIcon: FC<{ className?: string }> = ({ className }) => (
    <svg className={className} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
);
const FileTextIcon: FC<{ className?: string }> = ({ className }) => (
    <svg className={className} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
);
const BriefcaseIcon: FC<{ className?: string }> = ({ className }) => (
    <svg className={className} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
);
const LinkIcon: FC<{ className?: string }> = ({ className }) => (
    <svg className={className} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"></path></svg>
);
const AwardIcon: FC<{ className?: string }> = ({ className }) => (
    <svg className={className} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 17 17 23 15.79 13.88"></polyline></svg>
);
const DownloadIcon: FC<{ className?: string }> = ({ className }) => (
    <svg className={className} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
);
const SparklesIcon: FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" height="1em" width="1em"><path d="M10 3.5a1.5 1.5 0 0 1 3 0V5h1.5a1.5 1.5 0 0 1 0 3H13v1.5a1.5 1.5 0 0 1-3 0V8h-1.5a1.5 1.5 0 0 1 0-3H10V3.5ZM6 11a1 1 0 0 1 2 0v1h1a1 1 0 0 1 0 2H8v1a1 1 0 0 1-2 0v-1H5a1 1 0 0 1 0-2h1v-1Z M12.5 13.5a1 1 0 0 1 2 0v1h1a1 1 0 0 1 0 2h-1v1a1 1 0 0 1-2 0v-1h-1a1 1 0 0 1 0-2h1v-1Z"></path></svg>
);

// --- Generic Components ---

const Modal: FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode, size?: 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' }> = ({ isOpen, onClose, title, children, size = '2xl' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    'md': 'max-w-md',
    'lg': 'max-w-lg',
    'xl': 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" aria-modal="true" role="dialog">
      <div className={`bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col`}>
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold text-dark-text">{title}</h3>
          <button onClick={onClose} className="text-medium-text hover:text-dark-text" aria-label="Cerrar modal">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

const FilePreviewModal: FC<{ file: { name: string; url: string; type: string } | null; onClose: () => void; }> = ({ file, onClose }) => {
    if (!file) return null;

    return (
        <Modal isOpen={!!file} onClose={onClose} title={file.name} size="5xl">
            <div className="w-full h-[75vh]">
                {file.type.startsWith('image/') ? (
                    <img src={file.url} alt={file.name} className="max-w-full max-h-full mx-auto object-contain" />
                ) : file.type === 'application/pdf' ? (
                    <iframe src={file.url} title={file.name} className="w-full h-full border-0"></iframe>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full bg-slate-100 rounded-lg">
                        <p className="text-lg text-medium-text">No se puede previsualizar este tipo de archivo.</p>
                        <p className="text-sm text-light-text">({file.type})</p>
                        <a href={file.url} download={file.name} className="mt-4 bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded-lg">
                            Descargar Archivo
                        </a>
                    </div>
                )}
            </div>
        </Modal>
    );
};

const ImageUploader: FC<{ photo?: string; onPhotoChange: (base64: string) => void }> = ({ photo, onPhotoChange }) => {
  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && ['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      const base64 = await blobToBase64(file);
      onPhotoChange(base64);
    }
  };

  return (
    <div className="flex items-center space-x-4">
      <img src={photo || 'https://via.placeholder.com/100'} alt="Perfil" className="w-20 h-20 rounded-full object-cover bg-slate-200" />
      <label className="cursor-pointer bg-white border border-slate-300 rounded-md py-2 px-3 text-sm font-medium text-dark-text hover:bg-slate-50">
        <UploadIcon className="w-4 h-4 inline mr-2" />
        Cambiar Foto
        <input type="file" className="hidden" accept=".jpg,.jpeg,.png" onChange={handleFileChange} />
      </label>
    </div>
  );
};

const ExportDropdown: FC<{ 
    data: any[]; 
    headers: {key: string, label: string}[]; 
    filename: string; 
    title: string; 
}> = ({ data, headers, filename, title }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleExportCSV = () => {
        exportToCSV(headers, data, filename);
        setIsOpen(false);
    };

    const handleExportPDF = () => {
        exportToPDF(headers, data, title);
        setIsOpen(false);
    };

    if (data.length === 0) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="bg-white border border-slate-300 text-dark-text font-semibold py-2 px-4 rounded-lg flex items-center hover:bg-slate-50 text-sm"
            >
                <DownloadIcon className="w-4 h-4 mr-2" />
                Exportar
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 ring-1 ring-black ring-opacity-5">
                    <div className="py-1">
                        <a href="#" onClick={(e) => { e.preventDefault(); handleExportCSV(); }} className="block px-4 py-2 text-sm text-dark-text hover:bg-slate-100">
                            Exportar a CSV
                        </a>
                        <a href="#" onClick={(e) => { e.preventDefault(); handleExportPDF(); }} className="block px-4 py-2 text-sm text-dark-text hover:bg-slate-100">
                            Exportar a PDF
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Student Management Components ---
type StudentFormState = Omit<Student, 'id'>;

const StudentForm: FC<{ student?: Student; onSave: (student: StudentFormState, id?: number) => void; onCancel: () => void }> = ({ student, onSave, onCancel }) => {
  const initialFormState: StudentFormState = student 
    ? { ...student } 
    : { name: '', lastName: '', rut: '', email: '', admissionYear: new Date().getFullYear(), phone: '', undergradUniversity: '', nationality: '', photo: '', birthDate: '' };

  const [formState, setFormState] = useState(initialFormState);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.currentTarget;
    setFormState(prev => ({ ...prev, [name]: value }));
  };
  
  const handlePhotoChange = (base64: string) => {
    setFormState(prev => ({ ...prev, photo: base64 }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formState, student?.id);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
       <ImageUploader photo={formState.photo} onPhotoChange={handlePhotoChange} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-medium-text mb-1">Nombres</label>
          <input type="text" name="name" value={formState.name} onChange={handleChange} className="w-full border-slate-300 rounded-md shadow-sm" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-medium-text mb-1">Apellidos</label>
          <input type="text" name="lastName" value={formState.lastName} onChange={handleChange} className="w-full border-slate-300 rounded-md shadow-sm" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-medium-text mb-1">RUT</label>
          <input type="text" name="rut" value={formState.rut} onChange={handleChange} className="w-full border-slate-300 rounded-md shadow-sm" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-medium-text mb-1">Email</label>
          <input type="email" name="email" value={formState.email} onChange={handleChange} className="w-full border-slate-300 rounded-md shadow-sm" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-medium-text mb-1">Fecha de Nacimiento</label>
          <input type="date" name="birthDate" value={formState.birthDate} onChange={handleChange} className="w-full border-slate-300 rounded-md shadow-sm" required />
        </div>
         <div>
          <label className="block text-sm font-medium text-medium-text mb-1">Año de Ingreso</label>
          <input type="number" name="admissionYear" value={formState.admissionYear} onChange={handleChange} className="w-full border-slate-300 rounded-md shadow-sm" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-medium-text mb-1">Teléfono</label>
          <input type="tel" name="phone" value={formState.phone} onChange={handleChange} className="w-full border-slate-300 rounded-md shadow-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-medium-text mb-1">Universidad Pregrado</label>
          <input type="text" name="undergradUniversity" value={formState.undergradUniversity} onChange={handleChange} className="w-full border-slate-300 rounded-md shadow-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-medium-text mb-1">Nacionalidad</label>
          <input type="text" name="nationality" value={formState.nationality} onChange={handleChange} className="w-full border-slate-300 rounded-md shadow-sm" />
        </div>
      </div>
      <div className="flex justify-end space-x-3 pt-4">
        <button type="button" onClick={onCancel} className="bg-white border border-slate-300 rounded-md py-2 px-4 text-sm font-medium text-dark-text hover:bg-slate-50">Cancelar</button>
        <button type="submit" className="bg-primary hover:bg-primary-hover text-white rounded-md py-2 px-4 text-sm font-medium">Guardar Cambios</button>
      </div>
    </form>
  );
};


const StudentsPage: FC<{ students: Student[], setStudents: React.Dispatch<React.SetStateAction<Student[]>>, addActivityLog: (desc: string) => void }> = ({ students, setStudents, addActivityLog }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | undefined>(undefined);

  const handleSave = (studentData: Omit<Student, 'id'>, id?: number) => {
    if (id !== undefined) {
      setStudents(prev => prev.map(s => s.id === id ? { ...s, ...studentData } : s));
      addActivityLog(`Datos del alumno ${studentData.name} ${studentData.lastName} han sido actualizados.`);
    } else {
      const newStudent = { ...studentData, id: Date.now() };
      setStudents(prev => [...prev, newStudent]);
      addActivityLog(`Nuevo alumno ${newStudent.name} ${newStudent.lastName} ha sido agregado.`);
    }
    setIsModalOpen(false);
    setEditingStudent(undefined);
  };
  
  const handleEdit = (student: Student) => {
      setEditingStudent(student);
      setIsModalOpen(true);
  }

  const handleDelete = (student: Student) => {
    if (window.confirm('¿Está seguro de que desea eliminar a este alumno?')) {
        setStudents(prev => prev.filter(s => s.id !== student.id));
        addActivityLog(`Alumno ${student.name} ${student.lastName} ha sido eliminado.`);
    }
  }
  
  const exportHeaders = [
    { key: 'name', label: 'Nombres' },
    { key: 'lastName', label: 'Apellidos' },
    { key: 'rut', label: 'RUT' },
    { key: 'email', label: 'Email' },
    { key: 'birthDate', label: 'Fecha de Nacimiento' },
    { key: 'admissionYear', label: 'Año de Ingreso' },
    { key: 'status', label: 'Estado Residencia' },
    { key: 'phone', label: 'Teléfono' },
    { key: 'undergradUniversity', label: 'Universidad Pregrado' },
    { key: 'nationality', label: 'Nacionalidad' },
  ];

  const exportData = students.map(student => ({
      ...student,
      status: getResidencyStatus(student.admissionYear).status,
  }));


  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-dark-text">Gestión de Alumnos</h1>
        <div className="flex items-center space-x-2">
            <ExportDropdown 
                data={exportData}
                headers={exportHeaders}
                filename="alumnos"
                title="Lista de Alumnos"
            />
            <button onClick={() => { setEditingStudent(undefined); setIsModalOpen(true); }} className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded-lg flex items-center">
              <PlusIcon className="w-5 h-5 mr-2" />
              Nuevo Alumno
            </button>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-medium-text uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-medium-text uppercase tracking-wider">RUT</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-medium-text uppercase tracking-wider">Edad</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-medium-text uppercase tracking-wider">Año Ingreso</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-medium-text uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-medium-text uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {students.map(student => {
                const { status, color } = getResidencyStatus(student.admissionYear);
                const age = calculateAge(student.birthDate);
                return (
                    <tr key={student.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                    <img className="h-10 w-10 rounded-full object-cover" src={student.photo || 'https://via.placeholder.com/40'} alt="" />
                                </div>
                                <div className="ml-4">
                                    <div className="text-sm font-medium text-dark-text">{student.name} {student.lastName}</div>
                                    <div className="text-sm text-medium-text">{student.email}</div>
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-medium-text">{student.rut}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-medium-text">{age !== null ? `${age} años` : 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-medium-text">{student.admissionYear}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${color}`}>
                                {status}
                            </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                             <button onClick={() => handleEdit(student)} className="text-primary hover:text-primary-hover"><EditIcon className="w-5 h-5"/></button>
                             <button onClick={() => handleDelete(student)} className="text-red-600 hover:text-red-800"><TrashIcon className="w-5 h-5"/></button>
                        </td>
                    </tr>
                );
            })}
          </tbody>
        </table>
      </div>

       <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingStudent ? 'Editar Alumno' : 'Nuevo Alumno'}>
        <StudentForm student={editingStudent} onSave={handleSave} onCancel={() => { setIsModalOpen(false); setEditingStudent(undefined); }} />
      </Modal>
    </>
  );
};

// --- Teacher Management Components ---
type TeacherFormState = Omit<Teacher, 'id'>;

const TeacherForm: FC<{ teacher?: Teacher; onSave: (teacher: TeacherFormState, id?: number) => void; onCancel: () => void }> = ({ teacher, onSave, onCancel }) => {
  const initialFormState: TeacherFormState = teacher 
    ? { ...teacher } 
    : { name: '', lastName: '', rut: '', admissionYear: new Date().getFullYear(), teacherType: 'Colaborador', postgradUniversity: '', email: '', phone: '', photo: '', birthDate: '' };

  const [formState, setFormState] = useState(initialFormState);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.currentTarget;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (base64: string) => {
    setFormState(prev => ({ ...prev, photo: base64 }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formState, teacher?.id);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
        <ImageUploader photo={formState.photo} onPhotoChange={handlePhotoChange} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-medium text-medium-text mb-1">Nombres</label>
                <input type="text" name="name" value={formState.name} onChange={handleChange} className="w-full border-slate-300 rounded-md shadow-sm" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-medium-text mb-1">Apellidos</label>
                <input type="text" name="lastName" value={formState.lastName} onChange={handleChange} className="w-full border-slate-300 rounded-md shadow-sm" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-medium-text mb-1">RUT</label>
                <input type="text" name="rut" value={formState.rut} onChange={handleChange} className="w-full border-slate-300 rounded-md shadow-sm" required />
            </div>
             <div>
                <label className="block text-sm font-medium text-medium-text mb-1">Fecha de Nacimiento</label>
                <input type="date" name="birthDate" value={formState.birthDate} onChange={handleChange} className="w-full border-slate-300 rounded-md shadow-sm" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-medium-text mb-1">Año de Ingreso</label>
                <input type="number" name="admissionYear" value={formState.admissionYear} onChange={handleChange} className="w-full border-slate-300 rounded-md shadow-sm" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-medium-text mb-1">Tipo Docente</label>
                <select name="teacherType" value={formState.teacherType} onChange={handleChange} className="w-full border-slate-300 rounded-md shadow-sm">
                    <option>Planta</option>
                    <option>Colaborador</option>
                    <option>Adjunto</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-medium-text mb-1">Universidad Postgrado</label>
                <input type="text" name="postgradUniversity" value={formState.postgradUniversity} onChange={handleChange} className="w-full border-slate-300 rounded-md shadow-sm" />
            </div>
            <div>
                <label className="block text-sm font-medium text-medium-text mb-1">Email</label>
                <input type="email" name="email" value={formState.email} onChange={handleChange} className="w-full border-slate-300 rounded-md shadow-sm" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-medium-text mb-1">Teléfono</label>
                <input type="tel" name="phone" value={formState.phone} onChange={handleChange} className="w-full border-slate-300 rounded-md shadow-sm" />
            </div>
        </div>
        <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onCancel} className="bg-white border border-slate-300 rounded-md py-2 px-4 text-sm font-medium text-dark-text hover:bg-slate-50">Cancelar</button>
            <button type="submit" className="bg-primary hover:bg-primary-hover text-white rounded-md py-2 px-4 text-sm font-medium">Guardar Cambios</button>
        </div>
    </form>
  );
};

const TeachersPage: FC<{ teachers: Teacher[], setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>, addActivityLog: (desc: string) => void }> = ({ teachers, setTeachers, addActivityLog }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState<Teacher | undefined>(undefined);

    const handleSave = (teacherData: Omit<Teacher, 'id'>, id?: number) => {
        if (id !== undefined) {
            setTeachers(prev => prev.map(t => t.id === id ? { ...t, ...teacherData } : t));
            addActivityLog(`Datos del docente ${teacherData.name} ${teacherData.lastName} han sido actualizados.`);
        } else {
            const newTeacher = { ...teacherData, id: Date.now() };
            setTeachers(prev => [...prev, newTeacher]);
            addActivityLog(`Nuevo docente ${newTeacher.name} ${newTeacher.lastName} ha sido agregado.`);
        }
        setIsModalOpen(false);
        setEditingTeacher(undefined);
    };

    const handleEdit = (teacher: Teacher) => {
        setEditingTeacher(teacher);
        setIsModalOpen(true);
    }
  
    const handleDelete = (teacher: Teacher) => {
      if (window.confirm('¿Está seguro de que desea eliminar a este docente?')) {
          setTeachers(prev => prev.filter(t => t.id !== teacher.id));
          addActivityLog(`Docente ${teacher.name} ${teacher.lastName} ha sido eliminado.`);
      }
    }
    
    const exportHeaders = [
        { key: 'name', label: 'Nombres' },
        { key: 'lastName', label: 'Apellidos' },
        { key: 'rut', label: 'RUT' },
        { key: 'email', label: 'Email' },
        { key: 'birthDate', label: 'Fecha de Nacimiento' },
        { key: 'teacherType', label: 'Tipo Docente' },
        { key: 'admissionYear', label: 'Año de Ingreso' },
        { key: 'phone', label: 'Teléfono' },
        { key: 'postgradUniversity', label: 'Universidad Postgrado' },
    ];

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-dark-text">Gestión de Docentes</h1>
                <div className="flex items-center space-x-2">
                    <ExportDropdown 
                        data={teachers}
                        headers={exportHeaders}
                        filename="docentes"
                        title="Lista de Docentes"
                    />
                    <button onClick={() => { setEditingTeacher(undefined); setIsModalOpen(true); }} className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded-lg flex items-center">
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Nuevo Docente
                    </button>
                </div>
            </div>
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-medium-text uppercase tracking-wider">Nombre</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-medium-text uppercase tracking-wider">Edad</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-medium-text uppercase tracking-wider">Tipo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-medium-text uppercase tracking-wider">Años de Experiencia</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-medium-text uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {teachers.map(teacher => {
                            const age = calculateAge(teacher.birthDate);
                            return (
                                <tr key={teacher.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <img className="h-10 w-10 rounded-full object-cover" src={teacher.photo || 'https://via.placeholder.com/40'} alt="" />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-dark-text">{teacher.name} {teacher.lastName}</div>
                                                <div className="text-sm text-medium-text">{teacher.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-medium-text">{age !== null ? `${age} años` : 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-medium-text">{teacher.teacherType}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-medium-text">{new Date().getFullYear() - teacher.admissionYear} años</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                         <button onClick={() => handleEdit(teacher)} className="text-primary hover:text-primary-hover"><EditIcon className="w-5 h-5"/></button>
                                         <button onClick={() => handleDelete(teacher)} className="text-red-600 hover:text-red-800"><TrashIcon className="w-5 h-5"/></button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTeacher ? 'Editar Docente' : 'Nuevo Docente'}>
                <TeacherForm teacher={editingTeacher} onSave={handleSave} onCancel={() => { setIsModalOpen(false); setEditingTeacher(undefined); }} />
            </Modal>
        </>
    );
};

// --- Subject Management Components ---
type SubjectFormState = Omit<Subject, 'id'>;

const SubjectForm: FC<{ subject?: Subject; onSave: (subject: SubjectFormState, id?: number) => void; onCancel: () => void, teachers: Teacher[] }> = ({ subject, onSave, onCancel, teachers }) => {
  const initialFormState: SubjectFormState = subject 
    ? { ...subject } 
    : { name: '', code: '', credits: 0, semester: 1, description: '', teacherId: undefined };

  const [formState, setFormState] = useState(initialFormState);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.currentTarget;
    let processedValue: string | number | undefined = value;
    if (name === 'credits' || name === 'semester') {
        processedValue = parseInt(value, 10) || 0;
    } else if (name === 'teacherId') {
        processedValue = value ? parseInt(value, 10) : undefined;
    }
    setFormState(prev => ({ ...prev, [name]: processedValue }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formState, subject?.id);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-medium-text mb-1">Nombre Asignatura</label>
                <input type="text" name="name" value={formState.name} onChange={handleChange} placeholder="Ej: Cardiología Avanzada I" className="w-full p-2 border-slate-300 rounded-md shadow-sm" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-medium-text mb-1">Código Asignatura</label>
                <input type="text" name="code" value={formState.code} onChange={handleChange} placeholder="Ej: CAR-301" className="w-full p-2 border-slate-300 rounded-md shadow-sm" required />
            </div>
             <div>
                <label className="block text-sm font-medium text-medium-text mb-1">Docente Asignado</label>
                <select name="teacherId" value={formState.teacherId || ''} onChange={handleChange} className="w-full p-2 border-slate-300 rounded-md shadow-sm">
                    <option value="">Sin asignar</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name} {t.lastName}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-medium-text mb-1">Créditos</label>
                <input type="number" name="credits" value={formState.credits} onChange={handleChange} placeholder="Ej: 10" className="w-full p-2 border-slate-300 rounded-md shadow-sm" required />
            </div>
            <div className="md:col-span-2">
                <label className="block text-sm font-medium text-medium-text mb-1">Semestre</label>
                <input type="number" name="semester" value={formState.semester} onChange={handleChange} placeholder="Ej: 3" className="w-full p-2 border-slate-300 rounded-md shadow-sm" required />
            </div>
            <div className="md:col-span-2">
                <label className="block text-sm font-medium text-medium-text mb-1">Descripción (puede añadir objetivos aquí)</label>
                <textarea name="description" value={formState.description} onChange={handleChange} rows={4} placeholder="Contenidos principales y objetivos de la asignatura..." className="w-full p-2 border-slate-300 rounded-md shadow-sm"></textarea>
            </div>
        </div>
        <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onCancel} className="bg-white border border-slate-300 rounded-md py-2 px-4 text-sm font-medium text-dark-text hover:bg-slate-50">Cancelar</button>
            <button type="submit" className="bg-primary hover:bg-primary-hover text-white rounded-md py-2 px-4 text-sm font-medium">Guardar Cambios</button>
        </div>
    </form>
  );
};

const SubjectsPage: FC<{ subjects: Subject[], setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>, teachers: Teacher[], addActivityLog: (desc: string) => void }> = ({ subjects, setSubjects, teachers, addActivityLog }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSubject, setEditingSubject] = useState<Subject | undefined>(undefined);

    const handleSave = (subjectData: SubjectFormState, id?: number) => {
        if (id !== undefined) {
            setSubjects(prev => prev.map(s => s.id === id ? { id, ...subjectData } : s));
            addActivityLog(`Asignatura "${subjectData.name}" ha sido actualizada.`);
        } else {
            const newSubject = { ...subjectData, id: Date.now() };
            setSubjects(prev => [...prev, newSubject]);
            addActivityLog(`Nueva asignatura "${newSubject.name}" ha sido agregada.`);
        }
        setIsModalOpen(false);
        setEditingSubject(undefined);
    };

    const handleEdit = (subject: Subject) => {
        setEditingSubject(subject);
        setIsModalOpen(true);
    }
  
    const handleDelete = (subject: Subject) => {
      if (window.confirm('¿Está seguro de que desea eliminar esta asignatura?')) {
          setSubjects(prev => prev.filter(s => s.id !== subject.id));
          addActivityLog(`Asignatura "${subject.name}" ha sido eliminada.`);
      }
    }
    
    const teacherMap = useMemo(() => new Map(teachers.map(t => [t.id, `${t.name} ${t.lastName}`])), [teachers]);
    
    const exportHeaders = [
        { key: 'name', label: 'Nombre Asignatura' },
        { key: 'code', label: 'Código' },
        { key: 'teacherName', label: 'Docente Asignado' },
        { key: 'credits', label: 'Créditos' },
        { key: 'semester', label: 'Semestre' },
        { key: 'description', label: 'Descripción' },
    ];

    const exportData = subjects.map(subject => ({
        ...subject,
        teacherName: subject.teacherId ? teacherMap.get(subject.teacherId) : 'Sin asignar',
    }));

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-dark-text">Gestión de Asignaturas</h1>
                <div className="flex items-center space-x-2">
                    <ExportDropdown 
                        data={exportData}
                        headers={exportHeaders}
                        filename="asignaturas"
                        title="Lista de Asignaturas"
                    />
                    <button onClick={() => { setEditingSubject(undefined); setIsModalOpen(true); }} className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded-lg flex items-center">
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Nueva Asignatura
                    </button>
                </div>
            </div>
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-medium-text uppercase tracking-wider">Nombre Asignatura</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-medium-text uppercase tracking-wider">Código</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-medium-text uppercase tracking-wider">Créditos</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-medium-text uppercase tracking-wider">Semestre</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-medium-text uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {subjects.map(subject => (
                            <tr key={subject.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-dark-text">{subject.name}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-medium-text">{subject.code}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-medium-text">{subject.credits}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-medium-text">{subject.semester}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                     <button onClick={() => handleEdit(subject)} className="text-primary hover:text-primary-hover"><EditIcon className="w-5 h-5"/></button>
                                     <button onClick={() => handleDelete(subject)} className="text-red-600 hover:text-red-800"><TrashIcon className="w-5 h-5"/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingSubject ? 'Editar Asignatura' : 'Nueva Asignatura'}>
                <SubjectForm subject={editingSubject} onSave={handleSave} onCancel={() => { setIsModalOpen(false); setEditingSubject(undefined); }} teachers={teachers} />
            </Modal>
        </>
    );
};

// --- Grades Management Components ---

const COMPETENCY_CRITERIA = [
  "1. Profesionalismo: Cumple tareas puntualmente, resuelve problemas y reconoce sus errores, corrigiendo su conducta por iniciativa propia.",
  "2. Ética y responsabilidad: Adhiere y actúa acorde a principios éticos, con actitud de servicio y honestidad.",
  "3. Trato con pacientes y personal de salud: Es empático y respetuoso con quienes lo rodean.",
  "4. Conocimientos: Actualizado, extenso e integrado a la práctica.",
  "5. Habilidades y destrezas: Seguro, prolijo, criterioso. Reconoce sus limitations minimizando riesgos. Logra comprensión del problema médico y empatiza con el paciente.",
  "6. Capacidad de trabajo en equipo y comunicación: Se gana el respeto y confianza de sus pacientes y pares, en base a una comunicación directa, adecuada al oyente y de respeto mutuo.",
  "7. Juicio Clínico: Sintetiza la información de manera lógica, fluida y organizada, logrando buenos diagnósticos orientados a soluciones.",
  "8. Autoaprendizaje: Capaz de aprender por sí mismo conocimientos, habilidades, valores y actitudes, ya sea a través del estudio o experiencia.",
];

const COMPETENCY_LABELS = ["Nunca", "Rara Vez", "Pocas veces", "A veces", "Frecuentemente", "Generalmente", "Siempre"];


const CompetencyEvaluationModal: FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (scores: (number | null)[], average: number) => void;
  initialScores?: (number | null)[];
}> = ({ isOpen, onClose, onSave, initialScores }) => {
  const [scores, setScores] = useState<(number | null)[]>(initialScores || Array(8).fill(null));

  useEffect(() => {
      if (isOpen) {
          setScores(initialScores || Array(8).fill(null));
      }
  }, [isOpen, initialScores]);

  const handleScoreChange = (criterionIndex: number, score: number) => {
    const newScores = [...scores];
    newScores[criterionIndex] = score;
    setScores(newScores);
  };

  const { average, allScored } = useMemo(() => {
    const validScores = scores.filter((s): s is number => s !== null && s !== undefined);
    if (validScores.length < scores.length) {
      return { average: null, allScored: false };
    }
    const sum = validScores.reduce((acc, curr) => acc + curr, 0);
    return { average: sum / scores.length, allScored: true };
  }, [scores]);

  const handleSave = () => {
    if (average !== null && allScored) {
        onSave(scores, average);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Evaluación de Competencias" size="4xl">
        <div className="space-y-4">
            <div className="grid grid-cols-[3fr_repeat(7,1fr)] gap-x-2 text-center text-xs font-bold text-medium-text border-b pb-2">
                <div className="text-left">Criterio</div>
                {COMPETENCY_LABELS.map((label, index) => <div key={index}>{index + 1}. {label}</div>)}
            </div>
            {COMPETENCY_CRITERIA.map((criterion, index) => (
                <div key={index} className="grid grid-cols-[3fr_repeat(7,1fr)] gap-x-2 items-center hover:bg-slate-50 py-2 rounded">
                    <div className="text-sm text-dark-text text-left pr-4">{criterion}</div>
                    {COMPETENCY_LABELS.map((_, scoreIndex) => (
                        <div key={scoreIndex} className="flex justify-center">
                            <input
                                type="radio"
                                name={`criterion-${index}`}
                                value={scoreIndex + 1}
                                checked={scores[index] === scoreIndex + 1}
                                onChange={() => handleScoreChange(index, scoreIndex + 1)}
                                className="form-radio h-4 w-4 text-primary focus:ring-primary-light"
                            />
                        </div>
                    ))}
                </div>
            ))}
            <div className="flex justify-between items-center pt-4 border-t mt-4">
                 <div className="text-lg font-bold text-dark-text">
                    Promedio: <span className={average !== null ? 'text-primary' : 'text-medium-text'}>{average !== null ? average.toFixed(2) : 'N/A'}</span>
                 </div>
                 <div className="flex items-center space-x-3">
                    <button type="button" onClick={onClose} className="bg-white border border-slate-300 rounded-md py-2 px-4 text-sm font-medium text-dark-text hover:bg-slate-50">Cancelar</button>
                    <button 
                        type="button" 
                        onClick={handleSave}
                        disabled={!allScored}
                        className="bg-primary hover:bg-primary-hover text-white rounded-md py-2 px-4 text-sm font-medium disabled:bg-slate-300 disabled:cursor-not-allowed"
                    >
                        Guardar Evaluación
                    </button>
                 </div>
            </div>
        </div>
    </Modal>
  );
};


type GradeFormState = Omit<Grade, 'id'>;

const GradeForm: FC<{ 
    grade?: Grade; 
    students: Student[];
    subjects: Subject[];
    onSave: (grade: GradeFormState, id?: number) => void; 
    onCancel: () => void 
}> = ({ grade, students, subjects, onSave, onCancel }) => {
  const initialFormState: GradeFormState = grade 
    ? { ...grade } 
    : { studentId: students[0]?.id || 0, subjectId: subjects[0]?.id || 0, grade1: undefined, grade2: undefined, grade3: undefined, competencyScores: Array(8).fill(null), lastModified: new Date().toISOString(), isFinalized: false };

  const [formState, setFormState] = useState(initialFormState);
  const [isCompetencyModalOpen, setIsCompetencyModalOpen] = useState(false);

  useEffect(() => {
    if(grade) {
        setFormState(grade);
    } else {
        // Reset form for new entry, ensuring studentId and subjectId are valid
        setFormState({
            studentId: students[0]?.id || 0, 
            subjectId: subjects[0]?.id || 0, 
            grade1: undefined, 
            grade2: undefined, 
            grade3: undefined, 
            competencyScores: Array(8).fill(null), 
            lastModified: new Date().toISOString(), 
            isFinalized: false
        });
    }
  }, [grade, students, subjects]);


  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.currentTarget;
    let processedValue: string | number | undefined = value;
    if (name === 'studentId' || name === 'subjectId') {
        processedValue = parseInt(value, 10);
    } else if (name === 'grade1' || name === 'grade3') {
        processedValue = value === '' ? undefined : parseFloat(value);
    }
    setFormState(prev => ({ ...prev, [name]: processedValue }));
  };
  
  const handleSaveCompetencies = (scores: (number | null)[], average: number) => {
    setFormState(prev => ({
        ...prev,
        competencyScores: scores,
        grade2: average
    }));
    setIsCompetencyModalOpen(false);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.studentId || !formState.studentId) {
        alert('Por favor, seleccione un alumno y una asignatura.');
        return;
    }
    onSave({ ...formState, lastModified: new Date().toISOString() }, grade?.id);
  };

  return (
    <>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-medium-text mb-1">Alumno</label>
              <select name="studentId" value={formState.studentId} onChange={handleChange} className="w-full border-slate-300 rounded-md shadow-sm" required disabled={!!grade}>
                <option value="" disabled>Seleccione un alumno</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name} {s.lastName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-medium-text mb-1">Asignatura</label>
              <select name="subjectId" value={formState.subjectId} onChange={handleChange} className="w-full border-slate-300 rounded-md shadow-sm" required disabled={!!grade}>
                <option value="" disabled>Seleccione una asignatura</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <div>
              <label className="block text-sm font-medium text-medium-text mb-1">Prueba Teórica (60%)</label>
              <input type="number" name="grade1" value={formState.grade1 ?? ''} onChange={handleChange} step="0.1" min="1.0" max="7.0" className="w-full border-slate-300 rounded-md shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-medium-text mb-1">Competencias (30%)</label>
              <div className="flex items-center space-x-2">
                 <input type="number" name="grade2" value={formState.grade2?.toFixed(2) ?? ''} step="0.01" min="1.0" max="7.0" className="w-full border-slate-300 rounded-md shadow-sm bg-slate-100" readOnly />
                 <button type="button" onClick={() => setIsCompetencyModalOpen(true)} className="text-primary hover:text-primary-hover p-2 rounded-md bg-primary-light"><CheckSquareIcon className="w-5 h-5"/></button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-medium-text mb-1">Presentación (10%)</label>
              <input type="number" name="grade3" value={formState.grade3 ?? ''} onChange={handleChange} step="0.1" min="1.0" max="7.0" className="w-full border-slate-300 rounded-md shadow-sm" />
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onCancel} className="bg-white border border-slate-300 rounded-md py-2 px-4 text-sm font-medium text-dark-text hover:bg-slate-50">Cancelar</button>
            <button type="submit" className="bg-primary hover:bg-primary-hover text-white rounded-md py-2 px-4 text-sm font-medium">Guardar Calificación</button>
          </div>
        </form>
        <CompetencyEvaluationModal 
            isOpen={isCompetencyModalOpen}
            onClose={() => setIsCompetencyModalOpen(false)}
            onSave={handleSaveCompetencies}
            initialScores={formState.competencyScores}
        />
    </>
  );
};

const GradesPage: FC<{ 
    grades: Grade[], 
    setGrades: React.Dispatch<React.SetStateAction<Grade[]>>,
    students: Student[],
    subjects: Subject[],
    gradeReports: GradeReport[];
    onOpenReportModal: (data: { grade: Grade, report?: GradeReport }) => void;
    addActivityLog: (desc: string) => void;
}> = ({ grades, setGrades, students, subjects, gradeReports, onOpenReportModal, addActivityLog }) => {
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<Grade | undefined>(undefined);
  const [isCompetencyModalOpen, setIsCompetencyModalOpen] = useState(false);
  const [evaluatingGrade, setEvaluatingGrade] = useState<Grade | undefined>(undefined);

  const studentMap = useMemo(() => new Map<number, Student>(students.map(s => [s.id, s])), [students]);
  const subjectMap = useMemo(() => new Map<number, Subject>(subjects.map(s => [s.id, s])), [subjects]);

  const handleSave = (gradeData: Omit<Grade, 'id'>, id?: number) => {
    const studentName = studentMap.get(gradeData.studentId)?.name || 'N/A';
    const subjectName = subjectMap.get(gradeData.subjectId)?.name || 'N/A';

    if (id !== undefined) {
      setGrades(prev => prev.map(g => g.id === id ? { id, ...gradeData } : g));
    } else {
      setGrades(prev => [...prev, { ...gradeData, id: Date.now() }]);
    }
    addActivityLog(`Calificación para ${studentName} en ${subjectName} ha sido guardada.`);
    setIsFormModalOpen(false);
    setEditingGrade(undefined);
  };
  
  const handleEdit = (grade: Grade) => {
      setEditingGrade(grade);
      setIsFormModalOpen(true);
  }

  const handleDelete = (grade: Grade) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta calificación?')) {
        const studentName = studentMap.get(grade.studentId)?.name || 'N/A';
        const subjectName = subjectMap.get(grade.subjectId)?.name || 'N/A';
        setGrades(prev => prev.filter(g => g.id !== grade.id));
        addActivityLog(`Calificación para ${studentName} en ${subjectName} ha sido eliminada.`);
    }
  }

  const handleOpenCompetencyModal = (grade: Grade) => {
    setEvaluatingGrade(grade);
    setIsCompetencyModalOpen(true);
  };

  const handleSaveCompetencies = (scores: (number | null)[], average: number) => {
    if (evaluatingGrade) {
        const updatedGrade = { ...evaluatingGrade, grade2: average, competencyScores: scores, lastModified: new Date().toISOString() };
        setGrades(prev => prev.map(g => g.id === evaluatingGrade.id ? updatedGrade : g));
        const studentName = studentMap.get(updatedGrade.studentId)?.name || 'N/A';
        const subjectName = subjectMap.get(updatedGrade.subjectId)?.name || 'N/A';
        addActivityLog(`Evaluación de competencias para ${studentName} en ${subjectName} ha sido actualizada.`);
    }
    setIsCompetencyModalOpen(false);
    setEvaluatingGrade(undefined);
  };
  
  const getGradeColor = (grade: number) => {
    if (grade < 4.0) return 'text-red-600 font-bold';
    if (grade >= 6.0) return 'text-green-600 font-bold';
    return 'text-dark-text';
  }

  const exportHeaders = [
    { key: 'studentName', label: 'Alumno' },
    { key: 'subjectName', label: 'Asignatura' },
    { key: 'grade1', label: 'Prueba Teórica (60%)' },
    { key: 'grade2', label: 'Competencias (30%)' },
    { key: 'grade3', label: 'Presentación (10%)' },
    { key: 'finalGrade', label: 'Nota Final' },
    { key: 'status', label: 'Estado' },
  ];

  const exportData = grades.map(grade => {
    const student = studentMap.get(grade.studentId);
    const subject = subjectMap.get(grade.subjectId);
    const finalGrade = calculateFinalGrade(grade);
    const report = gradeReports.find(r => r.gradeId === grade.id);
    const areAllGradesIn = grade.grade1 != null && grade.grade2 != null && grade.grade3 != null;

    let statusText: string;
    if (report?.status === 'Completado') statusText = 'Completado';
    else if (report?.status === 'Pendiente Aceptación') statusText = 'Pendiente Aceptación';
    else if (areAllGradesIn) statusText = 'Notas OK';
    else statusText = 'En curso';

    return {
        studentName: student ? `${student.name} ${student.lastName}` : 'N/A',
        subjectName: subject ? subject.name : 'N/A',
        grade1: grade.grade1?.toFixed(1) ?? 'N/A',
        grade2: grade.grade2?.toFixed(1) ?? 'N/A',
        grade3: grade.grade3?.toFixed(1) ?? 'N/A',
        finalGrade: finalGrade !== null ? finalGrade.toFixed(1) : 'N/A',
        status: statusText,
    };
  });

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-dark-text">Gestión de Calificaciones</h1>
        <div className="flex items-center space-x-2">
            <ExportDropdown 
                data={exportData}
                headers={exportHeaders}
                filename="calificaciones"
                title="Reporte de Calificaciones"
            />
            <button onClick={() => { setEditingGrade(undefined); setIsFormModalOpen(true); }} className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded-lg flex items-center">
              <PlusIcon className="w-5 h-5 mr-2" />
              Nueva Calificación
            </button>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-medium-text uppercase tracking-wider">Nombre Alumno</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-medium-text uppercase tracking-wider">Asignatura</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-medium-text uppercase tracking-wider">Prueba Teórica (60%)</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-medium-text uppercase tracking-wider">Competencias (30%)</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-medium-text uppercase tracking-wider">Presentación (10%)</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-medium-text uppercase tracking-wider">Nota Final</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-medium-text uppercase tracking-wider">Estado</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-medium-text uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {grades.map(grade => {
                const student = studentMap.get(grade.studentId);
                const subject = subjectMap.get(grade.subjectId);
                const finalGrade = calculateFinalGrade(grade);
                const report = gradeReports.find(r => r.gradeId === grade.id);
                const areAllGradesIn = grade.grade1 != null && grade.grade2 != null && grade.grade3 != null;

                let statusText: string;
                let statusColor: string;
                let actionButton: React.ReactNode = null;

                if (report?.status === 'Completado') {
                    statusText = 'Completado';
                    statusColor = 'bg-green-100 text-green-800';
                    actionButton = <button onClick={() => onOpenReportModal({ grade, report })} className="text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold py-1 px-3 rounded-full">Ver Reporte</button>;
                } else if (report?.status === 'Pendiente Aceptación') {
                    statusText = 'Pendiente Aceptación';
                    statusColor = 'bg-amber-100 text-amber-800';
                    actionButton = <button onClick={() => onOpenReportModal({ grade, report })} className="text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold py-1 px-3 rounded-full">Ver Reporte</button>;
                } else if (areAllGradesIn) {
                    statusText = 'Notas OK';
                    statusColor = 'bg-indigo-100 text-indigo-800';
                    actionButton = <button onClick={() => onOpenReportModal({ grade })} className="text-sm bg-primary text-white hover:bg-primary-hover font-semibold py-1 px-3 rounded-full">Enviar Feedback</button>;
                } else {
                    statusText = 'En curso';
                    statusColor = 'bg-slate-100 text-slate-800';
                }

                return (
                    <tr key={grade.id} className={`${grade.isFinalized ? 'bg-slate-50' : 'hover:bg-slate-50'}`}>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-dark-text">{student?.name} {student?.lastName}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-medium-text">{subject?.name || 'N/A'}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-center text-medium-text">{grade.grade1?.toFixed(1) ?? '-'}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-center text-medium-text">
                            <div className="flex items-center justify-center space-x-2">
                                <span>{grade.grade2?.toFixed(1) ?? '-'}</span>
                                <button onClick={() => handleOpenCompetencyModal(grade)} className="text-primary hover:text-primary-hover disabled:text-slate-300 disabled:cursor-not-allowed" aria-label="Evaluar Competencias" disabled={!!report}>
                                    <CheckSquareIcon className="w-4 h-4"/>
                                </button>
                            </div>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-center text-medium-text">{grade.grade3?.toFixed(1) ?? '-'}</td>
                        <td className={`px-3 py-4 whitespace-nowrap text-sm text-center ${finalGrade !== null ? getGradeColor(finalGrade) : 'text-medium-text'}`}>
                            {finalGrade !== null ? finalGrade.toFixed(1) : '-'}
                        </td>
                         <td className="px-4 py-4 whitespace-nowrap text-center">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}`}>
                                {statusText}
                            </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium">
                            <div className="flex items-center justify-center space-x-2">
                                {actionButton}
                                {!report && (
                                    <>
                                        <button onClick={() => handleEdit(grade)} className="text-primary hover:text-primary-hover"><EditIcon className="w-5 h-5"/></button>
                                        <button onClick={() => handleDelete(grade)} className="text-red-600 hover:text-red-800"><TrashIcon className="w-5 h-5"/></button>
                                    </>
                                )}
                            </div>
                        </td>
                    </tr>
                );
            })}
          </tbody>
        </table>
      </div>

       <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={editingGrade ? 'Editar Calificación' : 'Nueva Calificación'}>
        <GradeForm 
            grade={editingGrade} 
            students={students}
            subjects={subjects}
            onSave={handleSave} 
            onCancel={() => { setIsFormModalOpen(false); setEditingGrade(undefined); }} 
        />
      </Modal>

       <CompetencyEvaluationModal 
            isOpen={isCompetencyModalOpen}
            onClose={() => setIsCompetencyModalOpen(false)}
            onSave={handleSaveCompetencies}
            initialScores={evaluatingGrade?.competencyScores}
        />
    </>
  );
};

// --- Student Record Module ---

const ReportModal: FC<{
    isOpen: boolean,
    onClose: () => void,
    data: { grade: Grade, report?: GradeReport } | null,
    onSendReport: (gradeId: number, feedback: string) => void,
    onAcceptReport: (reportId: number) => void,
    student: Student | undefined,
    subjectMap: Map<number, Subject>,
    teacherMap: Map<number, string>,
    ai: GoogleGenAI;
}> = ({ isOpen, onClose, data, onSendReport, onAcceptReport, student, subjectMap, teacherMap, ai }) => {
    const [feedback, setFeedback] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        if(data) {
            setFeedback(data.report?.feedback || "");
        }
    }, [data]);

    if (!data || !student) return null;
    
    const { grade, report } = data;
    const subject = subjectMap.get(grade.subjectId);
    const teacher = teacherMap.get(subject?.teacherId || -1);

    const isSending = !report; // We are in the process of creating the report
    const finalGradeSummary = report ? report.gradeSummary : {
        grade1: grade.grade1,
        grade2: grade.grade2,
        grade3: grade.grade3,
        finalGrade: calculateFinalGrade(grade) || 0
    };
    
    const handleSend = () => {
        onSendReport(grade.id, feedback);
    };

    const handleAccept = () => {
        if (report) {
            onAcceptReport(report.id);
            onClose();
        }
    };
    
    const handleGenerateFeedback = async () => {
        setIsGenerating(true);
        setFeedback("Generando feedback con IA...");

        const finalGrade = calculateFinalGrade(grade);
        if (finalGrade === null) {
            setFeedback("Error: No se pueden generar comentarios para calificaciones incompletas.");
            setIsGenerating(false);
            return;
        }
        
        const competencyDetails = COMPETENCY_CRITERIA.map((criterion, index) => 
            `- ${criterion.split(':')[0]}: ${grade.competencyScores?.[index] ?? 'N/A'}/7`
        ).join('\n');

        const prompt = `
            Eres un asistente para docentes universitarios. Tu tarea es redactar un feedback constructivo y profesional para un alumno de postgrado en Radiología. Basa tu feedback en los siguientes datos:
            - Asignatura: ${subject?.name || 'N/A'}
            - Nota Prueba Teórica (escala 1-7, 60%): ${grade.grade1?.toFixed(1) ?? 'N/A'}
            - Nota Evaluación de Competencias (escala 1-7, 30%): ${grade.grade2?.toFixed(1) ?? 'N/A'}
            - Nota Presentación (escala 1-7, 10%): ${grade.grade3?.toFixed(1) ?? 'N/A'}
            - Nota Final: ${finalGrade.toFixed(1)}
            - Evaluación detallada de competencias (escala 1-7, donde 7 es 'Siempre'):
              ${competencyDetails}

            El feedback debe ser alentador pero honesto, destacando puntos fuertes y áreas de mejora. No debe exceder las 100 palabras. Sé formal y respetuoso.
        `;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            setFeedback(response.text);
        } catch (error) {
            console.error("Error generating feedback:", error);
            setFeedback("Hubo un error al generar el feedback. Por favor, inténtelo de nuevo.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Reporte de Evaluación - ${subject?.name}`} size="5xl">
            <div className="space-y-6">
                {/* Header */}
                <div className="p-4 border rounded-lg bg-slate-50">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <p className="font-semibold text-medium-text">Alumno</p>
                            <p className="text-dark-text">{student.name} {student.lastName}</p>
                        </div>
                        <div>
                            <p className="font-semibold text-medium-text">Asignatura</p>
                            <p className="text-dark-text">{subject?.name}</p>
                        </div>
                        <div>
                            <p className="font-semibold text-medium-text">Docente</p>
                            <p className="text-dark-text">{teacher || 'Sin Asignar'}</p>
                        </div>
                        <div>
                            <p className="font-semibold text-medium-text">Fecha Generación</p>
                            <p className="text-dark-text">{report ? new Date(report.generationDate).toLocaleDateString('es-CL') : 'Pendiente'}</p>
                        </div>
                    </div>
                </div>

                {/* Grades & Feedback */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 space-y-4">
                        <div className="bg-white p-4 rounded-lg shadow-md border">
                            <h3 className="text-lg font-bold text-dark-text mb-3">Resumen de Notas</h3>
                            <ul className="space-y-2 text-sm">
                                <li className="flex justify-between"><span>Prueba Teórica (60%):</span> <span className="font-semibold">{finalGradeSummary.grade1?.toFixed(1)}</span></li>
                                <li className="flex justify-between"><span>Competencias (30%):</span> <span className="font-semibold">{finalGradeSummary.grade2?.toFixed(1)}</span></li>
                                <li className="flex justify-between"><span>Presentación (10%):</span> <span className="font-semibold">{finalGradeSummary.grade3?.toFixed(1)}</span></li>
                                <li className="flex justify-between border-t pt-2 mt-2 font-bold text-base"><span>Nota Final:</span> <span className="text-primary">{finalGradeSummary.finalGrade.toFixed(1)}</span></li>
                            </ul>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-md border">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-lg font-bold text-dark-text">Feedback del Docente</h3>
                                {isSending && (
                                     <button onClick={handleGenerateFeedback} disabled={isGenerating} className="text-sm font-semibold text-primary hover:text-primary-hover disabled:text-slate-400 flex items-center">
                                        <SparklesIcon className="w-4 h-4 mr-1" />
                                        {isGenerating ? 'Generando...' : 'Generar con IA'}
                                    </button>
                                )}
                            </div>
                             <textarea 
                                value={feedback}
                                onChange={(e) => setFeedback(e.currentTarget.value)}
                                disabled={!isSending || isGenerating}
                                rows={8}
                                placeholder={isSending ? "Escriba aquí su feedback o genérelo con IA." : "Sin feedback adicional."}
                                className="w-full p-2 border-slate-300 rounded-md shadow-sm disabled:bg-slate-100"
                            />
                        </div>
                    </div>
                    
                    {/* Competencies */}
                    <div className="lg:col-span-2 bg-white p-4 rounded-lg shadow-md border">
                        <h3 className="text-lg font-bold text-dark-text mb-3">Evaluación de Competencias</h3>
                        <div className="space-y-2">
                           {COMPETENCY_CRITERIA.map((criterion, index) => (
                               <div key={index} className="p-2 rounded-md hover:bg-slate-50 border-b last:border-b-0">
                                   <p className="text-sm text-dark-text mb-1">{criterion}</p>
                                   <div className="flex items-center space-x-2">
                                        <p className="text-xs font-semibold text-primary w-24">Puntaje: {grade.competencyScores?.[index] ?? 'N/A'}/7</p>
                                        <div className="w-full bg-slate-200 rounded-full h-2.5">
                                            <div className="bg-primary h-2.5 rounded-full" style={{ width: `${((grade.competencyScores?.[index] || 0) / 7) * 100}%` }}></div>
                                        </div>
                                   </div>
                               </div>
                           ))}
                        </div>
                    </div>
                </div>
                 {/* Footer & Signature */}
                <div className="flex justify-between items-center pt-4 border-t mt-4">
                     <div>
                        <p className="font-semibold">Estado del Reporte:</p>
                        {report?.status === 'Completado' ? (
                             <span className="text-green-600 font-bold flex items-center"><CheckSquareIcon className="w-5 h-5 mr-2" />Completado y Aceptado por alumno el {new Date(report.studentAcceptanceDate!).toLocaleDateString('es-CL')}</span>
                        ) : report?.status === 'Pendiente Aceptación' ? (
                            <span className="text-amber-600 font-bold flex items-center"><CheckSquareIcon className="w-5 h-5 mr-2" />Enviado, Pendiente de Aceptación el {new Date(report.signatureDate!).toLocaleDateString('es-CL')}</span>
                        ) : (
                             <span className="text-slate-600 font-bold">Pendiente de Envío</span>
                        )}
                     </div>
                     <div className="flex items-center space-x-3">
                        <button type="button" onClick={onClose} className="bg-white border border-slate-300 rounded-md py-2 px-4 text-sm font-medium text-dark-text hover:bg-slate-50">Cerrar</button>
                        {isSending && (
                            <button 
                                type="button" 
                                onClick={handleSend}
                                disabled={isGenerating || !feedback.trim()}
                                className="bg-primary hover:bg-primary-hover text-white rounded-md py-2 px-4 text-sm font-medium disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center"
                            >
                                <SendIcon className="w-5 h-5 mr-2" />
                                Enviar
                            </button>
                        )}
                         {report?.status === 'Pendiente Aceptación' && (
                            <button 
                                type="button" 
                                onClick={handleAccept}
                                className="bg-green-600 hover:bg-green-700 text-white rounded-md py-2 px-4 text-sm font-medium flex items-center"
                            >
                                <CheckSquareIcon className="w-5 h-5 mr-2" />
                                Aceptar Reporte
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
};


const ProfessionalActivityForm: FC<{
    studentId: number;
    onSave: (activity: Omit<ProfessionalActivity, 'id'>) => void;
    onCancel: () => void;
}> = ({ studentId, onSave, onCancel }) => {
    const [activityType, setActivityType] = useState<ActivityType>('Congreso');
    const [formData, setFormData] = useState<any>({
        title: '',
        date: new Date().toISOString().split('T')[0]
    });

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.currentTarget;
        const isNumber = (e.currentTarget as HTMLInputElement).type === 'number';
        setFormData((prev: any) => ({
            ...prev,
            [name]: isNumber ? parseInt(value) : value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const activityData = {
            ...formData,
            studentId: studentId,
            type: activityType,
            date: new Date(formData.date),
            endDate: formData.endDate ? new Date(formData.endDate) : undefined,
        };
        onSave(activityData);
    };

    const commonFields = (
         <>
            <div>
                <label className="block text-sm font-medium text-medium-text mb-1">Título / Nombre</label>
                <input type="text" name="title" onChange={handleChange} value={formData.title || ''} className="w-full p-2 border-slate-300 rounded-md shadow-sm" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-medium-text mb-1">Fecha</label>
                <input type="date" name="date" onChange={handleChange} value={formData.date || ''} className="w-full p-2 border-slate-300 rounded-md shadow-sm" required />
            </div>
        </>
    );

    const renderSpecificFields = () => {
        switch(activityType) {
            case 'Congreso':
                return (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-medium-text mb-1">Lugar</label>
                            <input type="text" name="location" onChange={handleChange} value={formData.location || ''} className="w-full p-2 border-slate-300 rounded-md shadow-sm" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-medium-text mb-1">Tipo de Participación</label>
                            <select name="participationType" onChange={handleChange} value={formData.participationType || 'Asistente'} className="w-full p-2 border-slate-300 rounded-md shadow-sm">
                                <option>Asistente</option>
                                <option>Póster</option>
                                <option>Presentación Oral</option>
                            </select>
                        </div>
                    </>
                );
            case 'Publicación':
                return (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-medium-text mb-1">Revista / Conferencia</label>
                            <input type="text" name="journal" onChange={handleChange} value={formData.journal || ''} className="w-full p-2 border-slate-300 rounded-md shadow-sm" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-medium-text mb-1">DOI / Link</label>
                            <input type="text" name="doiLink" onChange={handleChange} value={formData.doiLink || ''} className="w-full p-2 border-slate-300 rounded-md shadow-sm" />
                        </div>
                    </>
                );
            case 'Presentación':
                 return (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-medium-text mb-1">Nombre del Evento</label>
                            <input type="text" name="eventName" onChange={handleChange} value={formData.eventName || ''} className="w-full p-2 border-slate-300 rounded-md shadow-sm" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-medium-text mb-1">Lugar</label>
                            <input type="text" name="location" onChange={handleChange} value={formData.location || ''} className="w-full p-2 border-slate-300 rounded-md shadow-sm" />
                        </div>
                    </>
                );
            case 'Vinculación':
                return (
                     <>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-medium-text mb-1">Descripción</label>
                            <textarea name="description" onChange={handleChange} value={formData.description || ''} className="w-full p-2 border-slate-300 rounded-md shadow-sm" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-medium-text mb-1">Horas</label>
                            <input type="number" name="hours" onChange={handleChange} value={formData.hours || ''} className="w-full p-2 border-slate-300 rounded-md shadow-sm" />
                        </div>
                    </>
                );
            case 'Rotación':
                 return (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-medium-text mb-1">Fecha de Término</label>
                            <input type="date" name="endDate" onChange={handleChange} value={formData.endDate || ''} className="w-full p-2 border-slate-300 rounded-md shadow-sm" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-medium-text mb-1">Institución</label>
                            <input type="text" name="institution" onChange={handleChange} value={formData.institution || ''} className="w-full p-2 border-slate-300 rounded-md shadow-sm" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-medium-text mb-1">Supervisor</label>
                            <input type="text" name="supervisor" onChange={handleChange} value={formData.supervisor || ''} className="w-full p-2 border-slate-300 rounded-md shadow-sm" />
                        </div>
                    </>
                );
            case 'Otro':
                return (
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-medium-text mb-1">Descripción</label>
                        <textarea name="description" onChange={handleChange} value={formData.description || ''} className="w-full p-2 border-slate-300 rounded-md shadow-sm" required />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-medium-text mb-1">Tipo de Actividad</label>
                <select value={activityType} onChange={e => setActivityType(e.currentTarget.value as ActivityType)} className="w-full p-2 border-slate-300 rounded-md shadow-sm">
                    <option>Congreso</option>
                    <option>Publicación</option>
                    <option>Presentación</option>
                    <option>Vinculación</option>
                    <option>Rotación</option>
                    <option>Otro</option>
                </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
               {commonFields}
               {renderSpecificFields()}
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className="bg-white border border-slate-300 rounded-md py-2 px-4 text-sm font-medium text-dark-text hover:bg-slate-50">Cancelar</button>
                <button type="submit" className="bg-primary hover:bg-primary-hover text-white rounded-md py-2 px-4 text-sm font-medium">Guardar Actividad</button>
            </div>
        </form>
    );
};

const PersonalDocumentForm: FC<{ 
    onSave: (document: Omit<PersonalDocument, 'id' | 'ownerId' | 'ownerType'>) => void; 
    onCancel: () => void;
    onPreviewFile: (file: { name: string; url: string; type: string }) => void;
}> = ({ onSave, onCancel, onPreviewFile }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState<{ name: string; url: string; type: string } | null>(null);

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const uploadedFile = e.target.files?.[0];
        if (uploadedFile) {
            const base64Url = await blobToBase64(uploadedFile);
            setFile({ name: uploadedFile.name, url: base64Url, type: uploadedFile.type });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            alert("Por favor, adjunte un archivo.");
            return;
        }
        onSave({ title, description, file, uploadDate: new Date() });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-medium-text mb-1">Título del Documento</label>
                <input type="text" value={title} onChange={e => setTitle(e.currentTarget.value)} className="w-full p-2 border-slate-300 rounded-md shadow-sm" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-medium-text mb-1">Descripción</label>
                <textarea value={description} onChange={e => setDescription(e.currentTarget.value)} rows={4} className="w-full p-2 border-slate-300 rounded-md shadow-sm" required></textarea>
            </div>
            <div>
                <label className="block text-sm font-medium text-medium-text mb-1">Archivo</label>
                <input type="file" onChange={handleFileChange} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-primary hover:file:bg-blue-100" required />
                {file && (
                    <div className="flex items-center justify-between text-sm text-medium-text mt-2 bg-slate-100 p-2 rounded-md">
                        <span>{file.name}</span>
                        <button type="button" onClick={() => onPreviewFile(file)} className="text-primary hover:underline font-semibold">Previsualizar</button>
                    </div>
                )}
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className="bg-white border border-slate-300 rounded-md py-2 px-4 text-sm font-medium text-dark-text hover:bg-slate-50">Cancelar</button>
                <button type="submit" className="bg-primary hover:bg-primary-hover text-white rounded-md py-2 px-4 text-sm font-medium">Guardar Documento</button>
            </div>
        </form>
    );
};

const StudentRecordPage: FC<{
    students: Student[];
    teachers: Teacher[];
    subjects: Subject[];
    grades: Grade[];
    anotaciones: Anotacion[];
    setAnotaciones: React.Dispatch<React.SetStateAction<Anotacion[]>>;
    gradeReports: GradeReport[];
    professionalActivities: ProfessionalActivity[];
    setProfessionalActivities: React.Dispatch<React.SetStateAction<ProfessionalActivity[]>>;
    personalDocuments: PersonalDocument[];
    setPersonalDocuments: React.Dispatch<React.SetStateAction<PersonalDocument[]>>;
    onOpenReportModal: (data: { grade: Grade, report: GradeReport }) => void;
    onAcceptReport: (reportId: number) => void;
    addActivityLog: (desc: string) => void;
    onPreviewFile: (file: { name: string; url: string; type: string }) => void;
    ai: GoogleGenAI;
}> = ({ students, teachers, subjects, grades, anotaciones, setAnotaciones, gradeReports, professionalActivities, setProfessionalActivities, personalDocuments, setPersonalDocuments, onOpenReportModal, onAcceptReport, addActivityLog, onPreviewFile, ai }) => {
    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
    const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
    const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
    const [analysisContent, setAnalysisContent] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isImprovingText, setIsImprovingText] = useState(false);

    const teacherMap = useMemo(() => new Map(teachers.map(t => [t.id, `${t.name} ${t.lastName}`])), [teachers]);
    const subjectMap = useMemo(() => new Map(subjects.map(s => [s.id, s])), [subjects]);

    const selectedStudent = useMemo(() => students.find(s => s.id === selectedStudentId), [students, selectedStudentId]);

    const filteredStudents = useMemo(() =>
        students.filter(s =>
            `${s.name} ${s.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.rut.includes(searchTerm)
        ), [students, searchTerm]);

    const [activeTab, setActiveTab] = useState<'Calificaciones' | 'Anotaciones' | 'Reportes' | 'Actividad Profesional' | 'Documentos Personales'>('Calificaciones');

    const studentGrades = useMemo(() => grades.filter(g => g.studentId === selectedStudentId), [grades, selectedStudentId]);
    const studentAnotaciones = useMemo(() => anotaciones.filter(a => a.studentId === selectedStudentId).sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime()), [anotaciones, selectedStudentId]);
    const studentReports = useMemo(() => gradeReports.filter(r => r.studentId === selectedStudentId).sort((a,b) => b.generationDate.getTime() - a.generationDate.getTime()), [gradeReports, selectedStudentId]);
    const studentProfessionalActivities = useMemo(() => professionalActivities.filter(a => a.studentId === selectedStudentId).sort((a,b) => b.date.getTime() - a.date.getTime()), [professionalActivities, selectedStudentId]);
    const studentPersonalDocuments = useMemo(() => personalDocuments.filter(d => d.ownerType === 'student' && d.ownerId === selectedStudentId).sort((a,b) => b.uploadDate.getTime() - a.uploadDate.getTime()), [personalDocuments, selectedStudentId]);
    
    const [newAnotacion, setNewAnotacion] = useState({ type: 'Observación' as Anotacion['type'], text: '', autorId: teachers[0]?.id || 0 });

    const handleAddAnotacion = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAnotacion.text.trim() || !newAnotacion.autorId || !selectedStudentId) return;
        const newEntry: Anotacion = {
            id: Date.now(),
            studentId: selectedStudentId,
            autorId: newAnotacion.autorId,
            timestamp: new Date(),
            type: newAnotacion.type,
            text: newAnotacion.text.trim()
        };
        setAnotaciones(prev => [newEntry, ...prev]);
        addActivityLog(`Nueva anotación para ${selectedStudent?.name} ${selectedStudent?.lastName}.`);
        setNewAnotacion({ type: 'Observación', text: '', autorId: teachers[0]?.id || 0 });
    };

    const handleImproveAnotation = async () => {
        if (!newAnotacion.text.trim()) return;
        setIsImprovingText(true);
        const originalText = newAnotacion.text;
        setNewAnotacion(prev => ({ ...prev, text: "Mejorando texto..."}));
        const prompt = `
            Eres un asistente de redacción. Mejora el siguiente texto para que sea más claro, profesional y constructivo. Mantén la idea original. El texto es una anotación para el expediente de un alumno de postgrado.
            Texto original: "${originalText}"
            Texto mejorado:
        `;
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            setNewAnotacion(prev => ({...prev, text: response.text }));
        } catch (error) {
            console.error("Error improving text:", error);
            setNewAnotacion(prev => ({...prev, text: originalText + " (Error al mejorar)" }));
        } finally {
            setIsImprovingText(false);
        }
    };
    
    const handleAnalyzePerformance = async () => {
        if (!selectedStudent) return;
        setIsAnalyzing(true);
        setIsAnalysisModalOpen(true);
        setAnalysisContent("Analizando desempeño del alumno con IA...");

        const gradesSummary = studentGrades.map(g => {
            const subjectName = subjectMap.get(g.subjectId)?.name || 'N/A';
            const finalGrade = calculateFinalGrade(g);
            return `${subjectName}: ${finalGrade ? finalGrade.toFixed(1) : 'Incompleta'}`;
        }).join('\n');

        const annotationsSummary = studentAnotaciones.map(a => 
            `- ${a.type} (${a.timestamp.toLocaleDateString('es-CL')}): ${a.text}`
        ).join('\n');

        const prompt = `
            Eres un director de programa de postgrado en Radiología. Tu tarea es analizar el expediente de un alumno y generar un resumen de su desempeño académico y profesional. El resumen debe ser objetivo y conciso.

            Datos del Alumno:
            - Nombre: ${selectedStudent.name} ${selectedStudent.lastName}
            - Año de Ingreso: ${selectedStudent.admissionYear}

            Calificaciones (Asignatura: Nota Final):
            ${gradesSummary || 'Sin calificaciones registradas.'}

            Anotaciones:
            ${annotationsSummary || 'Sin anotaciones registradas.'}

            Basándote en estos datos, redacta un resumen de no más de 150 palabras que incluya:
            1. Un resumen general del rendimiento académico (destacando consistencia, áreas de fortaleza o debilidad).
            2. Un análisis de las anotaciones, mencionando patrones de comportamiento (iniciativa, responsabilidad, áreas de mejora).
            3. Una conclusión general sobre la trayectoria del alumno hasta la fecha.
        `;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: prompt,
            });
            setAnalysisContent(response.text);
        } catch (error) {
            console.error("Error analyzing performance:", error);
            setAnalysisContent("Hubo un error al analizar el desempeño. Por favor, inténtelo de nuevo.");
        } finally {
            setIsAnalyzing(false);
        }
    };


    const handleSaveActivity = (activityData: Omit<ProfessionalActivity, 'id'>) => {
        const newActivity = { ...activityData, id: Date.now() } as ProfessionalActivity;
        setProfessionalActivities(prev => [newActivity, ...prev]);
        addActivityLog(`Nueva actividad profesional registrada para ${selectedStudent?.name} ${selectedStudent?.lastName}.`);
        setIsActivityModalOpen(false);
    };
    
    const handleSaveDocument = (docData: Omit<PersonalDocument, 'id' | 'ownerId' | 'ownerType'>) => {
        if(!selectedStudentId) return;
        const newDocument = {
            ...docData,
            id: Date.now(),
            ownerId: selectedStudentId,
            ownerType: 'student' as const
        };
        setPersonalDocuments(prev => [newDocument, ...prev]);
        addActivityLog(`Nuevo documento personal subido para ${selectedStudent?.name} ${selectedStudent?.lastName}.`);
        setIsDocumentModalOpen(false);
    }


    const getAnotacionTypeColor = (type: Anotacion['type']) => {
        switch(type) {
            case 'Positiva': return 'bg-green-100 text-green-800 border-green-300';
            case 'Negativa': return 'bg-red-100 text-red-800 border-red-300';
            case 'Observación': return 'bg-blue-100 text-blue-800 border-blue-300';
            default: return 'bg-slate-100 text-slate-800 border-slate-300';
        }
    };

    const handleViewReport = (report: GradeReport) => {
        const grade = grades.find(g => g.id === report.gradeId);
        if (grade) {
            onOpenReportModal({ grade, report });
        }
    };
    
    const renderActivityDetails = (activity: ProfessionalActivity) => {
        const common = <p className="text-sm text-medium-text">{activity.date.toLocaleDateString('es-CL')}</p>;
        switch (activity.type) {
            case 'Congreso':
                return <>{common}<p className="text-sm text-dark-text">{activity.location} - <span className="font-semibold">{activity.participationType}</span></p></>;
            case 'Publicación':
                return <>{common}<p className="text-sm text-dark-text italic">{activity.journal}</p>{activity.doiLink && <a href={activity.doiLink} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">Ver Publicación</a>}</>;
            case 'Rotación':
                return <>{common}<p className="text-sm text-dark-text">{activity.institution} (Supervisor: {activity.supervisor})</p><p className="text-xs text-medium-text">Término: {activity.endDate.toLocaleDateString('es-CL')}</p></>;
            case 'Presentación':
                 return <>{common}<p className="text-sm text-dark-text">{activity.eventName} ({activity.location})</p></>;
            default:
                return <>{common}<p className="text-sm text-dark-text">{activity.description}</p></>;
        }
    };
    
    const getActivityIcon = (type: ActivityType) => {
        switch(type) {
            case 'Congreso': return <BriefcaseIcon className="w-5 h-5 text-indigo-500" />;
            case 'Publicación': return <FileTextIcon className="w-5 h-5 text-green-500" />;
            case 'Presentación': return <UsersIcon className="w-5 h-5 text-blue-500" />;
            case 'Rotación': return <UserIcon className="w-5 h-5 text-amber-500" />;
            default: return <AwardIcon className="w-5 h-5 text-slate-500" />;
        }
    }


    if (selectedStudent) {
        const { status, color } = getResidencyStatus(selectedStudent.admissionYear);
        const age = calculateAge(selectedStudent.birthDate);
        return (
            <>
                <button onClick={() => setSelectedStudentId(null)} className="flex items-center text-sm font-medium text-primary hover:text-primary-hover mb-6">
                    <ChevronLeftIcon className="w-5 h-5 mr-1" />
                    Volver a la lista de alumnos
                </button>
                <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                     <div className="flex flex-col sm:flex-row justify-between items-start space-y-4 sm:space-y-0 sm:space-x-6">
                        <div className="flex items-start space-x-6">
                            <img src={selectedStudent.photo} alt="Foto de perfil" className="w-24 h-24 rounded-full object-cover" />
                            <div>
                                <div className="flex items-center space-x-3">
                                    <h1 className="text-2xl font-bold text-dark-text">{selectedStudent.name} {selectedStudent.lastName}</h1>
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${color}`}>{status}</span>
                                </div>
                                <p className="text-medium-text">{selectedStudent.rut}</p>
                                 <p className="text-sm text-medium-text mt-2">
                                    {age} años | Ingreso: {selectedStudent.admissionYear} | {selectedStudent.email}
                                </p>
                            </div>
                        </div>
                        <button onClick={handleAnalyzePerformance} className="bg-primary-light text-primary font-semibold py-2 px-4 rounded-lg flex items-center hover:bg-indigo-200 text-sm disabled:opacity-50" disabled={isAnalyzing}>
                            <SparklesIcon className="w-5 h-5 mr-2" />
                            {isAnalyzing ? 'Analizando...' : 'Analizar Desempeño con IA'}
                        </button>
                    </div>
                </div>

                <div className="border-b border-slate-200">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        <button onClick={() => setActiveTab('Calificaciones')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'Calificaciones' ? 'border-primary text-primary' : 'border-transparent text-medium-text hover:text-dark-text hover:border-slate-300'}`}>Calificaciones</button>
                        <button onClick={() => setActiveTab('Anotaciones')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'Anotaciones' ? 'border-primary text-primary' : 'border-transparent text-medium-text hover:text-dark-text hover:border-slate-300'}`}>Anotaciones</button>
                        <button onClick={() => setActiveTab('Reportes')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'Reportes' ? 'border-primary text-primary' : 'border-transparent text-medium-text hover:text-dark-text hover:border-slate-300'}`}>Reportes</button>
                        <button onClick={() => setActiveTab('Actividad Profesional')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'Actividad Profesional' ? 'border-primary text-primary' : 'border-transparent text-medium-text hover:text-dark-text hover:border-slate-300'}`}>Actividad Profesional</button>
                        <button onClick={() => setActiveTab('Documentos Personales')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'Documentos Personales' ? 'border-primary text-primary' : 'border-transparent text-medium-text hover:text-dark-text hover:border-slate-300'}`}>Documentos Personales</button>
                    </nav>
                </div>
                
                <div className="mt-6">
                    {activeTab === 'Calificaciones' && (
                         <div className="bg-white shadow-md rounded-lg overflow-x-auto">
                            <div className="flex justify-end p-4">
                                <ExportDropdown 
                                    data={studentGrades.map(grade => {
                                        const subject = subjectMap.get(grade.subjectId);
                                        const teacher = teacherMap.get(subject?.teacherId || -1);
                                        const finalGrade = calculateFinalGrade(grade);
                                        const report = gradeReports.find(r => r.gradeId === grade.id);
                                        const areAllGradesIn = grade.grade1 != null && grade.grade2 != null && grade.grade3 != null;
                                        let statusText = 'En curso';
                                        if (report?.status === 'Completado') statusText = 'Completado';
                                        else if (report?.status === 'Pendiente Aceptación') statusText = 'Pendiente Aceptación';
                                        else if (areAllGradesIn) statusText = 'Notas OK';
                                        return {
                                            subjectName: subject?.name || 'N/A',
                                            teacherName: teacher || 'Sin asignar',
                                            finalGrade: finalGrade?.toFixed(1) || '-',
                                            status: statusText,
                                        };
                                    })}
                                    headers={[
                                        {key: 'subjectName', label: 'Asignatura'},
                                        {key: 'teacherName', label: 'Docente'},
                                        {key: 'finalGrade', label: 'Nota Final'},
                                        {key: 'status', label: 'Estado'},
                                    ]}
                                    filename={`calificaciones_${selectedStudent.name}_${selectedStudent.lastName}`}
                                    title={`Calificaciones de ${selectedStudent.name} ${selectedStudent.lastName}`}
                                />
                            </div>
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-medium-text uppercase tracking-wider">Asignatura</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-medium-text uppercase tracking-wider">Docente</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-medium-text uppercase tracking-wider">Nota Final</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-medium-text uppercase tracking-wider">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {studentGrades.map(grade => {
                                        const subject = subjectMap.get(grade.subjectId);
                                        const teacher = teacherMap.get(subject?.teacherId || -1);
                                        const finalGrade = calculateFinalGrade(grade);
                                        const report = gradeReports.find(r => r.gradeId === grade.id);
                                        const areAllGradesIn = grade.grade1 != null && grade.grade2 != null && grade.grade3 != null;

                                        let statusText = 'En curso';
                                        if (report?.status === 'Completado') {
                                            statusText = 'Completado';
                                        } else if (report?.status === 'Pendiente Aceptación') {
                                            statusText = 'Pendiente Aceptación';
                                        } else if (areAllGradesIn) {
                                            statusText = 'Notas OK';
                                        }

                                        return (
                                            <tr key={grade.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-dark-text">{subject?.name || 'N/A'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-medium-text">{teacher || 'Sin asignar'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-dark-text">{finalGrade?.toFixed(1) || '-'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-medium-text">{statusText}</td>
                                            </tr>
                                        )
                                    })}
                                    {studentGrades.length === 0 && (<tr><td colSpan={4} className="text-center py-4 text-medium-text">No hay calificaciones registradas.</td></tr>)}
                                </tbody>
                            </table>
                        </div>
                    )}
                     {activeTab === 'Anotaciones' && (
                        <div>
                            <div className="flex justify-end mb-4">
                                <ExportDropdown 
                                    data={studentAnotaciones.map(a => ({
                                        type: a.type,
                                        author: teacherMap.get(a.autorId) || 'Desconocido',
                                        date: a.timestamp.toLocaleDateString('es-CL'),
                                        text: a.text
                                    }))}
                                    headers={[
                                        {key: 'type', label: 'Tipo'},
                                        {key: 'author', label: 'Autor'},
                                        {key: 'date', label: 'Fecha'},
                                        {key: 'text', label: 'Descripción'}
                                    ]}
                                    filename={`anotaciones_${selectedStudent.name}_${selectedStudent.lastName}`}
                                    title={`Anotaciones de ${selectedStudent.name} ${selectedStudent.lastName}`}
                                />
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 space-y-4">
                                    {studentAnotaciones.map(anotacion => (
                                        <div key={anotacion.id} className={`p-4 rounded-lg border ${getAnotacionTypeColor(anotacion.type)}`}>
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="flex items-center space-x-2">
                                                <span className="font-bold text-sm">{anotacion.type}</span>
                                                <span className="text-xs text-medium-text">&bull;</span>
                                                <span className="text-xs text-medium-text"> {teacherMap.get(anotacion.autorId) || 'Desconocido'}</span>
                                                </div>
                                                <p className="text-xs text-medium-text">{anotacion.timestamp.toLocaleDateString()}</p>
                                            </div>
                                            <p className="text-sm text-dark-text">{anotacion.text}</p>
                                        </div>
                                    ))}
                                    {studentAnotaciones.length === 0 && <p className="text-medium-text">No hay anotaciones para este alumno.</p>}
                                </div>
                                <div className="bg-white p-4 rounded-lg shadow-md h-fit">
                                    <h3 className="text-lg font-semibold text-dark-text mb-4">Agregar Anotación</h3>
                                    <form onSubmit={handleAddAnotacion} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-medium-text mb-1">Autor</label>
                                            <select value={newAnotacion.autorId} onChange={e => setNewAnotacion({...newAnotacion, autorId: parseInt(e.currentTarget.value)})} className="w-full p-2 border-slate-300 rounded-md shadow-sm">
                                                {teachers.map(t => <option key={t.id} value={t.id}>{t.name} {t.lastName}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-medium-text mb-1">Tipo</label>
                                            <select value={newAnotacion.type} onChange={e => setNewAnotacion({...newAnotacion, type: e.currentTarget.value as Anotacion['type']})} className="w-full p-2 border-slate-300 rounded-md shadow-sm">
                                                <option>Observación</option>
                                                <option>Positiva</option>
                                                <option>Negativa</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-medium-text mb-1">Descripción</label>
                                            <textarea value={newAnotacion.text} onChange={e => setNewAnotacion({...newAnotacion, text: e.currentTarget.value})} rows={4} className="w-full p-2 border-slate-300 rounded-md shadow-sm" required></textarea>
                                            <button type="button" onClick={handleImproveAnotation} disabled={isImprovingText || !newAnotacion.text} className="text-xs mt-1 text-primary hover:underline disabled:text-slate-400 flex items-center">
                                                <SparklesIcon className="w-3 h-3 mr-1" />
                                                {isImprovingText ? 'Mejorando...' : 'Mejorar con IA'}
                                            </button>
                                        </div>
                                        <button type="submit" className="w-full bg-primary hover:bg-primary-hover text-white rounded-md py-2 text-sm font-medium">Guardar Anotación</button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}
                     {activeTab === 'Reportes' && (
                         <div className="bg-white shadow-md rounded-lg overflow-x-auto">
                            <div className="flex justify-end p-4">
                                <ExportDropdown 
                                    data={studentReports.map(report => ({
                                        subjectName: subjectMap.get(report.subjectId)?.name || 'N/A',
                                        generationDate: new Date(report.generationDate).toLocaleDateString('es-CL'),
                                        status: report.status,
                                    }))}
                                    headers={[
                                        {key: 'subjectName', label: 'Asignatura'},
                                        {key: 'generationDate', label: 'Fecha Generación'},
                                        {key: 'status', label: 'Estado'},
                                    ]}
                                    filename={`reportes_${selectedStudent.name}_${selectedStudent.lastName}`}
                                    title={`Reportes de ${selectedStudent.name} ${selectedStudent.lastName}`}
                                />
                            </div>
                           <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-medium-text uppercase tracking-wider">Asignatura</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-medium-text uppercase tracking-wider">Fecha Generación</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-medium-text uppercase tracking-wider">Estado</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-medium-text uppercase tracking-wider">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {studentReports.map(report => {
                                        const subject = subjectMap.get(report.subjectId);
                                        return (
                                            <tr key={report.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-dark-text">{subject?.name || 'N/A'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-medium-text">{new Date(report.generationDate).toLocaleDateString('es-CL')}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                        report.status === 'Completado' ? 'bg-green-100 text-green-800' :
                                                        'bg-amber-100 text-amber-800'}`
                                                    }>
                                                        {report.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                                    <button onClick={() => handleViewReport(report)} className="font-medium text-primary hover:text-primary-hover">
                                                        Ver Reporte
                                                    </button>
                                                    {report.status === 'Pendiente Aceptación' && (
                                                        <button onClick={() => onAcceptReport(report.id)} className="font-medium text-green-600 hover:text-green-800 bg-green-100 hover:bg-green-200 py-1 px-3 rounded-full">
                                                            Aceptar
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                    {studentReports.length === 0 && (<tr><td colSpan={4} className="text-center py-4 text-medium-text">No hay reportes generados para este alumno.</td></tr>)}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {activeTab === 'Actividad Profesional' && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <ExportDropdown 
                                    data={studentProfessionalActivities.map(a => ({...a, date: a.date.toLocaleDateString('es-CL')}))}
                                    headers={[
                                        {key: 'title', label: 'Título'},
                                        {key: 'type', label: 'Tipo'},
                                        {key: 'date', label: 'Fecha'},
                                    ]}
                                    filename={`actividad_profesional_${selectedStudent.name}_${selectedStudent.lastName}`}
                                    title={`Actividad Profesional de ${selectedStudent.name} ${selectedStudent.lastName}`}
                                />
                                <button onClick={() => setIsActivityModalOpen(true)} className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded-lg flex items-center text-sm">
                                    <PlusIcon className="w-4 h-4 mr-2" />
                                    Agregar Actividad
                                </button>
                            </div>
                            <div className="space-y-4">
                                {studentProfessionalActivities.map(activity => (
                                     <div key={activity.id} className="bg-white p-4 rounded-lg shadow-md border flex items-start space-x-4">
                                        <div className="flex-shrink-0 bg-slate-100 p-2 rounded-full">
                                            {getActivityIcon(activity.type)}
                                        </div>
                                        <div className="flex-grow">
                                            <h3 className="font-bold text-dark-text">{activity.title}</h3>
                                            {renderActivityDetails(activity)}
                                        </div>
                                        <span className="text-xs font-semibold text-medium-text bg-slate-100 px-2 py-1 rounded-full">{activity.type}</span>
                                    </div>
                                ))}
                                {studentProfessionalActivities.length === 0 && <p className="text-center py-8 text-medium-text">No hay actividades profesionales registradas.</p>}
                            </div>
                        </div>
                    )}
                     {activeTab === 'Documentos Personales' && (
                        <div>
                             <div className="flex justify-between items-center mb-4">
                                <ExportDropdown 
                                    data={studentPersonalDocuments.map(d => ({...d, uploadDate: new Date(d.uploadDate).toLocaleDateString('es-CL')}))}
                                    headers={[
                                        {key: 'title', label: 'Título'},
                                        {key: 'description', label: 'Descripción'},
                                        {key: 'uploadDate', label: 'Fecha de Subida'},
                                    ]}
                                    filename={`documentos_${selectedStudent.name}_${selectedStudent.lastName}`}
                                    title={`Documentos de ${selectedStudent.name} ${selectedStudent.lastName}`}
                                />
                                <button onClick={() => setIsDocumentModalOpen(true)} className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded-lg flex items-center text-sm">
                                    <PlusIcon className="w-4 h-4 mr-2" />
                                    Subir Documento
                                </button>
                            </div>
                             <div className="bg-white shadow-md rounded-lg overflow-hidden">
                                <table className="min-w-full divide-y divide-slate-200">
                                     <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-medium-text uppercase tracking-wider">Título</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-medium-text uppercase tracking-wider">Fecha de Subida</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-medium-text uppercase tracking-wider">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-200">
                                        {studentPersonalDocuments.map(doc => (
                                            <tr key={doc.id}>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-medium text-dark-text">{doc.title}</p>
                                                    <p className="text-sm text-medium-text">{doc.description}</p>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-medium-text">{new Date(doc.uploadDate).toLocaleDateString('es-CL')}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                                    <button onClick={() => onPreviewFile(doc.file)} className="text-primary hover:text-primary-hover">Previsualizar</button>
                                                    <a href={doc.file.url} download={doc.file.name} className="text-primary hover:text-primary-hover">Descargar</a>
                                                </td>
                                            </tr>
                                        ))}
                                        {studentPersonalDocuments.length === 0 && (<tr><td colSpan={3} className="text-center py-4 text-medium-text">No hay documentos personales.</td></tr>)}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
                <Modal isOpen={isAnalysisModalOpen} onClose={() => setIsAnalysisModalOpen(false)} title={`Análisis de Desempeño: ${selectedStudent.name} ${selectedStudent.lastName}`}>
                    <div className="whitespace-pre-wrap text-dark-text bg-slate-50 p-4 rounded-md">
                        {analysisContent}
                    </div>
                </Modal>
                <Modal isOpen={isActivityModalOpen} onClose={() => setIsActivityModalOpen(false)} title="Registrar Actividad Profesional">
                    <ProfessionalActivityForm 
                        studentId={selectedStudentId}
                        onSave={handleSaveActivity}
                        onCancel={() => setIsActivityModalOpen(false)}
                    />
                </Modal>
                 <Modal isOpen={isDocumentModalOpen} onClose={() => setIsDocumentModalOpen(false)} title="Subir Documento Personal">
                    <PersonalDocumentForm onSave={handleSaveDocument} onCancel={() => setIsDocumentModalOpen(false)} onPreviewFile={onPreviewFile} />
                </Modal>
            </>
        )
    }

    const exportHeaders = [
        { key: 'name', label: 'Nombres' },
        { key: 'lastName', label: 'Apellidos' },
        { key: 'rut', label: 'RUT' },
        { key: 'status', label: 'Estado Residencia' },
    ];
    const exportData = filteredStudents.map(student => ({
        ...student,
        status: getResidencyStatus(student.admissionYear).status,
    }));

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                <h1 className="text-2xl font-bold text-dark-text">Expediente de Alumnos</h1>
                <div className="flex items-center space-x-2">
                    <div className="relative">
                        <input type="text" placeholder="Buscar alumno por nombre o RUT..." value={searchTerm} onChange={e => setSearchTerm(e.currentTarget.value)} className="pl-10 pr-4 py-2 rounded-full border border-slate-300 w-full sm:w-64" />
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-light-text" />
                    </div>
                     <ExportDropdown 
                        data={exportData}
                        headers={exportHeaders}
                        filename="lista_expedientes_alumnos"
                        title="Lista de Expedientes de Alumnos"
                    />
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredStudents.map(student => {
                    const { status, color } = getResidencyStatus(student.admissionYear);
                    return (
                        <div key={student.id} className="bg-white rounded-lg shadow-md p-4 text-center flex flex-col items-center">
                            <img src={student.photo} alt="Foto de perfil" className="w-20 h-20 rounded-full object-cover mb-3" />
                            <p className="font-semibold text-dark-text">{student.name} {student.lastName}</p>
                            <p className="text-sm text-medium-text">{student.rut}</p>
                            <span className={`mt-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${color}`}>{status}</span>
                            <button onClick={() => setSelectedStudentId(student.id)} className="mt-4 w-full bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded-lg text-sm">
                                Ver Expediente
                            </button>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};

const EventForm: FC<{ event?: CalendarEvent, onSave: (event: Omit<CalendarEvent, 'id'>) => void; onCancel: () => void }> = ({ event, onSave, onCancel }) => {
  const [title, setTitle] = useState(event?.title || '');

  const toDateTimeLocal = (date: Date) => {
    const ten = (i: number) => (i < 10 ? '0' : '') + i;
    const YYYY = date.getFullYear();
    const MM = ten(date.getMonth() + 1);
    const DD = ten(date.getDate());
    const HH = ten(date.getHours());
    const II = ten(date.getMinutes());
    return `${YYYY}-${MM}-${DD}T${HH}:${II}`;
  };

  const [start, setStart] = useState(toDateTimeLocal(event?.start || new Date()));
  const [end, setEnd] = useState(toDateTimeLocal(event?.end || new Date()));
  const [type, setType] = useState<CalendarEvent['type']>(event?.type || 'Evento');
  const [streamingLink, setStreamingLink] = useState(event?.streamingLink || '');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (new Date(start) > new Date(end)) {
        alert("La fecha de inicio no puede ser posterior a la fecha de término.");
        return;
    }
    onSave({ title, start: new Date(start), end: new Date(end), type, streamingLink });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-medium-text mb-1">Título del Evento</label>
        <input type="text" value={title} onChange={e => setTitle(e.currentTarget.value)} className="w-full p-2 border-slate-300 rounded-md shadow-sm" required />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <label className="block text-sm font-medium text-medium-text mb-1">Inicio</label>
            <input type="datetime-local" value={start} onChange={e => setStart(e.currentTarget.value)} className="w-full p-2 border-slate-300 rounded-md shadow-sm" required />
        </div>
        <div>
            <label className="block text-sm font-medium text-medium-text mb-1">Término</label>
            <input type="datetime-local" value={end} onChange={e => setEnd(e.currentTarget.value)} className="w-full p-2 border-slate-300 rounded-md shadow-sm" required />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-medium-text mb-1">Tipo de Evento</label>
        <select value={type} onChange={e => setType(e.currentTarget.value as CalendarEvent['type'])} className="w-full p-2 border-slate-300 rounded-md shadow-sm">
            <option>Evento</option>
            <option>Examen</option>
            <option>Clase</option>
            <option>Feriado</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-medium-text mb-1">Link de Reunión (Opcional)</label>
        <input type="url" value={streamingLink} onChange={e => setStreamingLink(e.currentTarget.value)} placeholder="https://meet.example.com/..." className="w-full p-2 border-slate-300 rounded-md shadow-sm" />
      </div>
      <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onCancel} className="bg-white border border-slate-300 rounded-md py-2 px-4 text-sm font-medium text-dark-text hover:bg-slate-50">Cancelar</button>
            <button type="submit" className="bg-primary hover:bg-primary-hover text-white rounded-md py-2 px-4 text-sm font-medium">Agregar Evento</button>
      </div>
    </form>
  );
};

const CalendarPage: FC<{
    events: CalendarEvent[],
    setEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>,
    addActivityLog: (desc: string) => void,
}> = ({ events, setEvents, addActivityLog }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleSave = (eventData: Omit<CalendarEvent, 'id'>) => {
        const newEvent = { ...eventData, id: Date.now() };
        setEvents(prev => [...prev, newEvent].sort((a, b) => a.start.getTime() - b.start.getTime()));
        addActivityLog(`Nuevo evento '${newEvent.title}' ha sido agregado al calendario.`);
        setIsModalOpen(false);
    };

    const groupedEvents = useMemo(() => {
        return events.reduce((acc, event) => {
            const month = event.start.toLocaleString('es-CL', { month: 'long', year: 'numeric' });
            if (!acc[month]) {
                acc[month] = [];
            }
            acc[month].push(event);
            return acc;
        }, {} as Record<string, CalendarEvent[]>);
    }, [events]);
    
    const getEventTypeColor = (type: CalendarEvent['type']) => {
        switch(type) {
            case 'Examen': return 'bg-red-500';
            case 'Clase': return 'bg-blue-500';
            case 'Feriado': return 'bg-green-500';
            case 'Evento': return 'bg-amber-500';
        }
    };
    
    const formatDateRange = (start: Date, end: Date) => {
        const startStr = start.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
        if (start.toDateString() === end.toDateString()) {
            return startStr;
        }
        const endStr = end.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
        return `${startStr} - ${endStr}`;
    };

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-dark-text">Calendario Académico</h1>
                <button onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded-lg flex items-center">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Agregar Evento
                </button>
            </div>
             <div className="bg-white shadow-md rounded-lg p-6">
                {Object.entries(groupedEvents).map(([month, monthEvents]) => (
                    <div key={month} className="mb-8 last:mb-0">
                        <h2 className="text-lg font-semibold text-dark-text capitalize border-b pb-2 mb-4">{month}</h2>
                        <ul className="space-y-3">
                            {monthEvents.map(event => (
                                <li key={event.id} className="flex items-center space-x-4 p-2 rounded-md hover:bg-slate-50">
                                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${getEventTypeColor(event.type)}`}></div>
                                    <div className="font-semibold text-medium-text w-28 text-sm">{formatDateRange(event.start, event.end)}</div>
                                    <div className="text-dark-text text-sm flex-grow">{event.title}</div>
                                    {event.streamingLink && (
                                        <a href={event.streamingLink} target="_blank" rel="noopener noreferrer" title="Unirse a la reunión" className="text-primary hover:text-primary-hover">
                                            <LinkIcon className="w-5 h-5"/>
                                        </a>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
             <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nuevo Evento">
                <EventForm onSave={handleSave} onCancel={() => setIsModalOpen(false)} />
            </Modal>
        </>
    );
};

const NewsForm: FC<{ 
    onSave: (article: Omit<NewsArticle, 'id' | 'date'>) => void; 
    onCancel: () => void;
    onPreviewFile: (file: { name: string; url: string; type: string }) => void;
}> = ({ onSave, onCancel, onPreviewFile }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('Dirección de Postgrado');
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [attachments, setAttachments] = useState<{ name: string; url: string; type: string }[]>([]);

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await blobToBase64(file);
      setImageUrl(base64);
    }
  };

  const handleAttachmentUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newAttachments = await Promise.all(Array.from(files).map(async (file: File) => {
          const base64 = await blobToBase64(file);
          return { name: file.name, url: base64, type: file.type };
      }));
      setAttachments(prev => [...prev, ...newAttachments]);
    }
  };

  const removeAttachment = (index: number) => {
      setAttachments(prev => prev.filter((_, i) => i !== index));
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ title, content, author, imageUrl, attachments });
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
        <div>
            <label className="block text-sm font-medium text-medium-text mb-1">Título</label>
            <input type="text" value={title} onChange={e => setTitle(e.currentTarget.value)} className="w-full p-2 border-slate-300 rounded-md shadow-sm" required />
        </div>
        <div>
            <label className="block text-sm font-medium text-medium-text mb-1">Autor</label>
            <input type="text" value={author} onChange={e => setAuthor(e.currentTarget.value)} className="w-full p-2 border-slate-300 rounded-md shadow-sm" required />
        </div>
        <div>
            <label className="block text-sm font-medium text-medium-text mb-1">Contenido</label>
            <textarea value={content} onChange={e => setContent(e.currentTarget.value)} rows={6} className="w-full p-2 border-slate-300 rounded-md shadow-sm" required></textarea>
        </div>
        <div>
            <label className="block text-sm font-medium text-medium-text mb-1">Imagen de Portada</label>
            <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-primary hover:file:bg-blue-100"/>
            {imageUrl && <img src={imageUrl} alt="preview" className="mt-2 h-32 w-auto rounded"/>}
        </div>
        <div>
            <label className="block text-sm font-medium text-medium-text mb-1">Archivos Adjuntos (.pdf, .doc, .xls)</label>
            <input type="file" multiple onChange={handleAttachmentUpload} accept=".pdf,.doc,.docx,.xls,.xlsx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-primary hover:file:bg-blue-100"/>
            <div className="mt-2 space-y-2">
                {attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-slate-100 p-2 rounded">
                        <span className="text-sm text-dark-text truncate pr-2">{file.name}</span>
                        <div className='flex items-center space-x-2 flex-shrink-0'>
                            <button type='button' onClick={() => onPreviewFile(file)} className='text-primary hover:underline text-sm font-semibold'>Ver</button>
                            <button type="button" onClick={() => removeAttachment(index)} className="text-red-500 hover:text-red-700">
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onCancel} className="bg-white border border-slate-300 rounded-md py-2 px-4 text-sm font-medium text-dark-text hover:bg-slate-50">Cancelar</button>
            <button type="submit" className="bg-primary hover:bg-primary-hover text-white rounded-md py-2 px-4 text-sm font-medium">Publicar Noticia</button>
      </div>
    </form>
  );
};

const NewsPage: FC<{
    articles: NewsArticle[],
    setArticles: React.Dispatch<React.SetStateAction<NewsArticle[]>>,
    addActivityLog: (desc: string) => void,
    onPreviewFile: (file: { name: string; url: string; type: string }) => void;
}> = ({ articles, setArticles, addActivityLog, onPreviewFile }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

    const handleSave = (articleData: Omit<NewsArticle, 'id'|'date'>) => {
        const newArticle = { ...articleData, id: Date.now(), date: new Date() };
        setArticles(prev => [newArticle, ...prev]);
        addActivityLog(`Nueva noticia '${newArticle.title}' ha sido publicada.`);
        setIsModalOpen(false);
    };

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-dark-text">Noticias y Anuncios</h1>
                <button onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded-lg flex items-center">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Publicar Noticia
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.map(article => (
                    <div key={article.id} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
                        <img src={article.imageUrl || 'https://via.placeholder.com/400x200'} alt={article.title} className="w-full h-48 object-cover"/>
                        <div className="p-4 flex flex-col flex-grow">
                            <h3 className="text-lg font-bold text-dark-text mb-2">{article.title}</h3>
                            <p className="text-xs text-medium-text mb-2">{article.author} &bull; {article.date.toLocaleDateString('es-CL')}</p>
                            <p className="text-sm text-dark-text flex-grow">{article.content.substring(0, 100)}...</p>
                            <button onClick={() => setSelectedArticle(article)} className="mt-4 text-sm font-semibold text-primary hover:text-primary-hover self-start">
                                Leer más &rarr;
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            
            <Modal isOpen={!!selectedArticle} onClose={() => setSelectedArticle(null)} title={selectedArticle?.title || ''} size="3xl">
                {selectedArticle && (
                    <div className="space-y-4">
                        <img src={selectedArticle.imageUrl || 'https://via.placeholder.com/800x400'} alt={selectedArticle.title} className="w-full h-64 object-cover rounded-lg"/>
                        <p className="text-sm text-medium-text">{selectedArticle.author} &bull; {selectedArticle.date.toLocaleDateString('es-CL')}</p>
                        <p className="text-dark-text whitespace-pre-wrap">{selectedArticle.content}</p>
                        {selectedArticle.attachments && selectedArticle.attachments.length > 0 && (
                            <div className='pt-4 border-t'>
                                <h4 className="font-semibold text-dark-text mb-2">Archivos Adjuntos:</h4>
                                <ul className="space-y-2">
                                    {selectedArticle.attachments.map((file, index) => (
                                        <li key={index} className="flex items-center justify-between bg-slate-100 p-2 rounded-md">
                                            <span className='text-sm text-dark-text'>{file.name}</span>
                                            <div className='space-x-4'>
                                                <button onClick={() => onPreviewFile(file)} className="text-primary hover:underline text-sm font-semibold">Previsualizar</button>
                                                <a href={file.url} download={file.name} className="text-primary hover:underline text-sm font-semibold">Descargar</a>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nueva Noticia">
                 <NewsForm onSave={handleSave} onCancel={() => setIsModalOpen(false)} onPreviewFile={onPreviewFile} />
            </Modal>
        </>
    );
};

// --- Official Documents Module ---

const DocumentForm: FC<{ 
    onSave: (document: Omit<OfficialDocument, 'id'>) => void; 
    onCancel: () => void;
    onPreviewFile: (file: { name: string; url: string; type: string }) => void;
}> = ({ onSave, onCancel, onPreviewFile }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [author, setAuthor] = useState('');
    const [file, setFile] = useState<{ name: string; url: string; type: string } | null>(null);

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const uploadedFile = e.target.files?.[0];
        if (uploadedFile) {
            const base64Url = await blobToBase64(uploadedFile);
            setFile({ name: uploadedFile.name, url: base64Url, type: uploadedFile.type });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            alert("Por favor, adjunte un archivo.");
            return;
        }
        onSave({ title, description, author, file, uploadDate: new Date() });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-medium-text mb-1">Título del Documento</label>
                <input type="text" value={title} onChange={e => setTitle(e.currentTarget.value)} className="w-full p-2 border-slate-300 rounded-md shadow-sm" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-medium-text mb-1">Autor / Origen</label>
                <input type="text" value={author} onChange={e => setAuthor(e.currentTarget.value)} placeholder="Ej: Dirección de Postgrado" className="w-full p-2 border-slate-300 rounded-md shadow-sm" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-medium-text mb-1">Descripción</label>
                <textarea value={description} onChange={e => setDescription(e.currentTarget.value)} rows={4} className="w-full p-2 border-slate-300 rounded-md shadow-sm" required></textarea>
            </div>
            <div>
                <label className="block text-sm font-medium text-medium-text mb-1">Archivo</label>
                <input type="file" onChange={handleFileChange} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-primary hover:file:bg-blue-100" required />
                {file && (
                     <div className="flex items-center justify-between text-sm text-medium-text mt-2 bg-slate-100 p-2 rounded-md">
                        <span>{file.name}</span>
                        <button type="button" onClick={() => onPreviewFile(file)} className="text-primary hover:underline font-semibold">Previsualizar</button>
                    </div>
                )}
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className="bg-white border border-slate-300 rounded-md py-2 px-4 text-sm font-medium text-dark-text hover:bg-slate-50">Cancelar</button>
                <button type="submit" className="bg-primary hover:bg-primary-hover text-white rounded-md py-2 px-4 text-sm font-medium">Guardar Documento</button>
            </div>
        </form>
    );
};

const OfficialDocumentsPage: FC<{
    documents: OfficialDocument[],
    setDocuments: React.Dispatch<React.SetStateAction<OfficialDocument[]>>,
    addActivityLog: (desc: string) => void,
    onPreviewFile: (file: { name: string; url: string; type: string }) => void;
}> = ({ documents, setDocuments, addActivityLog, onPreviewFile }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleSave = (documentData: Omit<OfficialDocument, 'id'>) => {
        const newDocument = { ...documentData, id: Date.now() };
        setDocuments(prev => [newDocument, ...prev].sort((a,b) => b.uploadDate.getTime() - a.uploadDate.getTime()));
        addActivityLog(`Nuevo documento oficial '${newDocument.title}' ha sido agregado.`);
        setIsModalOpen(false);
    };
    
    const exportHeaders = [
        { key: 'title', label: 'Título' },
        { key: 'description', label: 'Descripción' },
        { key: 'author', label: 'Autor' },
        { key: 'uploadDate', label: 'Fecha de Subida' },
    ];

    const exportData = documents.map(doc => ({
        ...doc,
        uploadDate: new Date(doc.uploadDate).toLocaleDateString('es-CL'),
    }));

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-dark-text">Documentos Oficiales</h1>
                <div className="flex items-center space-x-2">
                    <ExportDropdown 
                        data={exportData}
                        headers={exportHeaders}
                        filename="documentos_oficiales"
                        title="Documentos Oficiales"
                    />
                    <button onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded-lg flex items-center">
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Subir Documento
                    </button>
                </div>
            </div>
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-medium-text uppercase tracking-wider">Título</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-medium-text uppercase tracking-wider">Autor</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-medium-text uppercase tracking-wider">Fecha de Subida</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-medium-text uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {documents.map(doc => (
                            <tr key={doc.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-dark-text">{doc.title}</div>
                                    <div className="text-sm text-medium-text truncate max-w-xs">{doc.description}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-medium-text">{doc.author}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-medium-text">{new Date(doc.uploadDate).toLocaleDateString('es-CL')}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                     <button onClick={() => onPreviewFile(doc.file)} className="text-primary hover:text-primary-hover">Previsualizar</button>
                                    <a href={doc.file.url} download={doc.file.name} className="text-primary hover:text-primary-hover">
                                        Descargar
                                    </a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nuevo Documento Oficial">
                <DocumentForm onSave={handleSave} onCancel={() => setIsModalOpen(false)} onPreviewFile={onPreviewFile} />
            </Modal>
        </>
    );
};

// --- Meeting Records Module ---

const MeetingForm: FC<{
    onSave: (meeting: Omit<MeetingRecord, 'id'>) => void;
    onCancel: () => void;
    students: Student[];
    teachers: Teacher[];
}> = ({ onSave, onCancel, students, teachers }) => {
    const [formState, setFormState] = useState<Omit<MeetingRecord, 'id'>>({
        title: '',
        date: new Date(),
        startTime: '09:00',
        endTime: '10:00',
        details: '',
        attendees: { teachers: [], students: [], externals: [] },
        streamingLink: ''
    });
    const [externalsInput, setExternalsInput] = useState('');

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.currentTarget;
        setFormState(prev => ({...prev, [name]: value }));
    };

    const handleMultiSelectChange = (e: ChangeEvent<HTMLSelectElement>, type: 'teachers' | 'students') => {
        const selectedIds = Array.from(e.currentTarget.selectedOptions, option => parseInt(option.value));
        setFormState(prev => ({
            ...prev,
            attendees: { ...prev.attendees, [type]: selectedIds }
        }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const externals = externalsInput.split(',').map(s => s.trim()).filter(Boolean);
        onSave({ ...formState, attendees: { ...formState.attendees, externals } });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-medium-text mb-1">Título de la Reunión</label>
                <input type="text" name="title" value={formState.title} onChange={handleChange} className="w-full p-2 border-slate-300 rounded-md shadow-sm" required />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-medium-text mb-1">Fecha</label>
                    <input type="date" name="date" value={formState.date.toISOString().split('T')[0]} onChange={e => setFormState(p => ({...p, date: new Date(e.currentTarget.value)}))} className="w-full p-2 border-slate-300 rounded-md shadow-sm" required />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-medium-text mb-1">Hora Inicio</label>
                    <input type="time" name="startTime" value={formState.startTime} onChange={handleChange} className="w-full p-2 border-slate-300 rounded-md shadow-sm" required />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-medium-text mb-1">Hora Término</label>
                    <input type="time" name="endTime" value={formState.endTime} onChange={handleChange} className="w-full p-2 border-slate-300 rounded-md shadow-sm" required />
                 </div>
             </div>
             <div>
                <label className="block text-sm font-medium text-medium-text mb-1">Detalles / Puntos Tratados</label>
                <textarea name="details" value={formState.details} onChange={handleChange} rows={5} className="w-full p-2 border-slate-300 rounded-md shadow-sm" required></textarea>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-medium-text mb-1">Asistentes (Docentes)</label>
                    <select multiple value={formState.attendees.teachers.map(String)} onChange={e => handleMultiSelectChange(e, 'teachers')} className="w-full h-32 p-2 border-slate-300 rounded-md shadow-sm">
                        {teachers.map(t => <option key={t.id} value={t.id}>{t.name} {t.lastName}</option>)}
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-medium-text mb-1">Asistentes (Alumnos)</label>
                    <select multiple value={formState.attendees.students.map(String)} onChange={e => handleMultiSelectChange(e, 'students')} className="w-full h-32 p-2 border-slate-300 rounded-md shadow-sm">
                        {students.map(s => <option key={s.id} value={s.id}>{s.name} {s.lastName}</option>)}
                    </select>
                </div>
             </div>
             <div>
                <label className="block text-sm font-medium text-medium-text mb-1">Asistentes Externos (separados por coma)</label>
                <input type="text" value={externalsInput} onChange={e => setExternalsInput(e.currentTarget.value)} className="w-full p-2 border-slate-300 rounded-md shadow-sm" />
            </div>
             <div>
                <label className="block text-sm font-medium text-medium-text mb-1">Link de Reunión (Opcional)</label>
                <input type="url" name="streamingLink" value={formState.streamingLink} onChange={handleChange} placeholder="https://meet.example.com/..." className="w-full p-2 border-slate-300 rounded-md shadow-sm" />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className="bg-white border border-slate-300 rounded-md py-2 px-4 text-sm font-medium text-dark-text hover:bg-slate-50">Cancelar</button>
                <button type="submit" className="bg-primary hover:bg-primary-hover text-white rounded-md py-2 px-4 text-sm font-medium">Guardar Reunión</button>
            </div>
        </form>
    );
};

const MeetingRecordsPage: FC<{
    meetings: MeetingRecord[];
    setMeetings: React.Dispatch<React.SetStateAction<MeetingRecord[]>>;
    students: Student[];
    teachers: Teacher[];
    addActivityLog: (desc: string) => void;
    ai: GoogleGenAI;
}> = ({ meetings, setMeetings, students, teachers, addActivityLog, ai }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [summaryModalContent, setSummaryModalContent] = useState<{title: string, content: string} | null>(null);
    const [isSummarizing, setIsSummarizing] = useState<number | null>(null);
    
    const studentMap = useMemo(() => new Map(students.map(s => [s.id, `${s.name} ${s.lastName}`])), [students]);
    const teacherMap = useMemo(() => new Map(teachers.map(t => [t.id, `${t.name} ${t.lastName}`])), [teachers]);

    const handleSave = (meetingData: Omit<MeetingRecord, 'id'>) => {
        const newMeeting = { ...meetingData, id: Date.now() };
        setMeetings(prev => [newMeeting, ...prev].sort((a,b) => b.date.getTime() - a.date.getTime()));
        addActivityLog(`Nuevo registro de reunión '${newMeeting.title}' ha sido agregado.`);
        setIsModalOpen(false);
    };

    const handleSummarize = async (meeting: MeetingRecord) => {
        setIsSummarizing(meeting.id);
        setSummaryModalContent({ title: `Resumen de: ${meeting.title}`, content: "Generando resumen con IA..." });
        
        const teacherAttendees = meeting.attendees.teachers.map(id => teacherMap.get(id)).filter(Boolean).join(', ');
        const studentAttendees = meeting.attendees.students.map(id => studentMap.get(id)).filter(Boolean).join(', ');

        const prompt = `
            Eres un asistente administrativo. Tu tarea es resumir el siguiente registro de una reunión académica.
            - Título: ${meeting.title}
            - Fecha: ${new Date(meeting.date).toLocaleDateString('es-CL')}
            - Detalles: ${meeting.details}
            - Asistentes Docentes: ${teacherAttendees || 'Ninguno'}
            - Asistentes Alumnos: ${studentAttendees || 'Ninguno'}
            - Asistentes Externos: ${meeting.attendees.externals.join(', ') || 'Ninguno'}

            Genera un resumen conciso en formato de lista (bullet points) de los puntos clave tratados en la reunión.
        `;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            setSummaryModalContent({ title: `Resumen de: ${meeting.title}`, content: response.text });
        } catch(error) {
            console.error("Error summarizing meeting:", error);
            setSummaryModalContent({ title: `Resumen de: ${meeting.title}`, content: "Hubo un error al generar el resumen." });
        } finally {
            setIsSummarizing(null);
        }
    };
    
    const exportHeaders = [
        { key: 'title', label: 'Título' },
        { key: 'date', label: 'Fecha' },
        { key: 'startTime', label: 'Hora Inicio' },
        { key: 'endTime', label: 'Hora Término' },
        { key: 'details', label: 'Detalles' },
        { key: 'teacherAttendees', label: 'Docentes Asistentes' },
        { key: 'studentAttendees', label: 'Alumnos Asistentes' },
        { key: 'externalAttendees', label: 'Asistentes Externos' },
    ];

    const exportData = meetings.map((m: MeetingRecord) => ({
        ...m,
        date: new Date(m.date).toLocaleDateString('es-CL'),
        teacherAttendees: m.attendees.teachers.map(id => teacherMap.get(id)).join(', '),
        studentAttendees: m.attendees.students.map(id => studentMap.get(id)).join(', '),
        externalAttendees: m.attendees.externals.join(', '),
    }));

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-dark-text">Registro de Reuniones</h1>
                 <div className="flex items-center space-x-2">
                    <ExportDropdown 
                        data={exportData}
                        headers={exportHeaders}
                        filename="registro_reuniones"
                        title="Registro de Reuniones"
                    />
                    <button onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded-lg flex items-center">
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Registrar Reunión
                    </button>
                </div>
            </div>
            <div className="space-y-4">
                {meetings.map(meeting => (
                    <div key={meeting.id} className="bg-white p-4 rounded-lg shadow-md border">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-dark-text">{meeting.title}</h3>
                                <p className="text-sm text-medium-text">{new Date(meeting.date).toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} &bull; {meeting.startTime} - {meeting.endTime}</p>
                            </div>
                             <button onClick={() => handleSummarize(meeting)} disabled={isSummarizing === meeting.id} className="text-sm font-semibold text-primary hover:text-primary-hover disabled:text-slate-400 flex items-center">
                                <SparklesIcon className="w-4 h-4 mr-1" />
                                {isSummarizing === meeting.id ? 'Resumiendo...' : 'Resumir con IA'}
                            </button>
                        </div>
                        <p className="text-sm text-dark-text mt-2 whitespace-pre-wrap">{meeting.details}</p>
                        <div className="text-xs text-medium-text mt-3 pt-3 border-t">
                            <p><strong>Asistentes:</strong> {
                                [...meeting.attendees.teachers.map(id => teacherMap.get(id)), ...meeting.attendees.students.map(id => studentMap.get(id)), ...meeting.attendees.externals].filter(Boolean).join(', ')
                            }</p>
                        </div>
                    </div>
                ))}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Registrar Nueva Reunión">
                <MeetingForm onSave={handleSave} onCancel={() => setIsModalOpen(false)} students={students} teachers={teachers} />
            </Modal>
             <Modal isOpen={!!summaryModalContent} onClose={() => setSummaryModalContent(null)} title={summaryModalContent?.title || ''}>
                <div className="whitespace-pre-wrap text-dark-text bg-slate-50 p-4 rounded-md">
                    {summaryModalContent?.content}
                </div>
            </Modal>
        </>
    );
};


// --- Teacher Record Module ---
const TeacherProfessionalActivityForm: FC<{
    teacherId: number;
    onSave: (activity: Omit<TeacherProfessionalActivity, 'id'>) => void;
    onCancel: () => void;
}> = ({ teacherId, onSave, onCancel }) => {
    const [activityType, setActivityType] = useState<TeacherActivityType>('Congreso');
    const [formData, setFormData] = useState<any>({
        title: '',
        date: new Date().toISOString().split('T')[0]
    });

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.currentTarget;
        const isNumber = (e.currentTarget as HTMLInputElement).type === 'number';
        setFormData((prev: any) => ({
            ...prev,
            [name]: isNumber ? parseInt(value) : value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const activityData = {
            ...formData,
            teacherId: teacherId,
            type: activityType,
            date: new Date(formData.date),
        };
        onSave(activityData);
    };
    
    const commonFields = (
         <>
            <div>
                <label className="block text-sm font-medium text-medium-text mb-1">Título / Nombre</label>
                <input type="text" name="title" onChange={handleChange} value={formData.title || ''} className="w-full p-2 border-slate-300 rounded-md shadow-sm" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-medium-text mb-1">Fecha</label>
                <input type="date" name="date" onChange={handleChange} value={formData.date || ''} className="w-full p-2 border-slate-300 rounded-md shadow-sm" required />
            </div>
        </>
    );

    const renderSpecificFields = () => {
        switch(activityType) {
            case 'Congreso':
                return (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-medium-text mb-1">Lugar</label>
                            <input type="text" name="location" onChange={handleChange} value={formData.location || ''} className="w-full p-2 border-slate-300 rounded-md shadow-sm" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-medium-text mb-1">Tipo de Participación</label>
                            <select name="participationType" onChange={handleChange} value={formData.participationType || 'Asistente'} className="w-full p-2 border-slate-300 rounded-md shadow-sm">
                                <option>Asistente</option>
                                <option>Expositor</option>
                                <option>Organizador</option>
                            </select>
                        </div>
                    </>
                );
            case 'Publicación':
                return (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-medium-text mb-1">Revista / Conferencia</label>
                            <input type="text" name="journal" onChange={handleChange} value={formData.journal || ''} className="w-full p-2 border-slate-300 rounded-md shadow-sm" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-medium-text mb-1">DOI / Link</label>
                            <input type="text" name="doiLink" onChange={handleChange} value={formData.doiLink || ''} className="w-full p-2 border-slate-300 rounded-md shadow-sm" />
                        </div>
                    </>
                );
            case 'Presentación':
                 return (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-medium-text mb-1">Nombre del Evento</label>
                            <input type="text" name="eventName" onChange={handleChange} value={formData.eventName || ''} className="w-full p-2 border-slate-300 rounded-md shadow-sm" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-medium-text mb-1">Lugar</label>
                            <input type="text" name="location" onChange={handleChange} value={formData.location || ''} className="w-full p-2 border-slate-300 rounded-md shadow-sm" />
                        </div>
                    </>
                );
            case 'Investigación':
                 return (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-medium-text mb-1">Proyecto</label>
                            <input type="text" name="project" onChange={handleChange} value={formData.project || ''} className="w-full p-2 border-slate-300 rounded-md shadow-sm" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-medium-text mb-1">Rol</label>
                            <input type="text" name="role" onChange={handleChange} value={formData.role || ''} className="w-full p-2 border-slate-300 rounded-md shadow-sm" />
                        </div>
                    </>
                );
             case 'Docencia':
                 return (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-medium-text mb-1">Curso / Asignatura</label>
                            <input type="text" name="course" onChange={handleChange} value={formData.course || ''} className="w-full p-2 border-slate-300 rounded-md shadow-sm" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-medium-text mb-1">Institución</label>
                            <input type="text" name="institution" onChange={handleChange} value={formData.institution || ''} className="w-full p-2 border-slate-300 rounded-md shadow-sm" />
                        </div>
                    </>
                );
            case 'Otro':
                return (
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-medium-text mb-1">Descripción</label>
                        <textarea name="description" onChange={handleChange} value={formData.description || ''} className="w-full p-2 border-slate-300 rounded-md shadow-sm" required />
                    </div>
                );
            default:
                return null;
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-medium-text mb-1">Tipo de Actividad</label>
                <select value={activityType} onChange={e => setActivityType(e.currentTarget.value as TeacherActivityType)} className="w-full p-2 border-slate-300 rounded-md shadow-sm">
                    <option>Congreso</option>
                    <option>Publicación</option>
                    <option>Presentación</option>
                    <option>Investigación</option>
                    <option>Docencia</option>
                    <option>Otro</option>
                </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
               {commonFields}
               {renderSpecificFields()}
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className="bg-white border border-slate-300 rounded-md py-2 px-4 text-sm font-medium text-dark-text hover:bg-slate-50">Cancelar</button>
                <button type="submit" className="bg-primary hover:bg-primary-hover text-white rounded-md py-2 px-4 text-sm font-medium">Guardar Actividad</button>
            </div>
        </form>
    );
};


const TeacherRecordPage: FC<{
    teachers: Teacher[];
    subjects: Subject[];
    teacherProfessionalActivities: TeacherProfessionalActivity[];
    setTeacherProfessionalActivities: React.Dispatch<React.SetStateAction<TeacherProfessionalActivity[]>>;
    personalDocuments: PersonalDocument[];
    setPersonalDocuments: React.Dispatch<React.SetStateAction<PersonalDocument[]>>;
    addActivityLog: (desc: string) => void;
    onPreviewFile: (file: { name: string; url: string; type: string }) => void;
}> = ({ teachers, subjects, teacherProfessionalActivities, setTeacherProfessionalActivities, personalDocuments, setPersonalDocuments, addActivityLog, onPreviewFile }) => {
    const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'Asignaturas' | 'Actividad Profesional' | 'Documentos Personales'>('Asignaturas');
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
    const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);

    const selectedTeacher = useMemo(() => teachers.find(t => t.id === selectedTeacherId), [teachers, selectedTeacherId]);

    const filteredTeachers = useMemo(() =>
        teachers.filter(t =>
            `${t.name} ${t.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.rut.includes(searchTerm)
        ), [teachers, searchTerm]);

    const teacherSubjects = useMemo(() => subjects.filter(s => s.teacherId === selectedTeacherId), [subjects, selectedTeacherId]);
    const teacherActivities = useMemo(() => teacherProfessionalActivities.filter(a => a.teacherId === selectedTeacherId).sort((a,b) => b.date.getTime() - a.date.getTime()), [teacherProfessionalActivities, selectedTeacherId]);
    const teacherDocuments = useMemo(() => personalDocuments.filter(d => d.ownerType === 'teacher' && d.ownerId === selectedTeacherId).sort((a,b) => b.uploadDate.getTime() - a.uploadDate.getTime()), [personalDocuments, selectedTeacherId]);

    const handleSaveActivity = (activityData: Omit<TeacherProfessionalActivity, 'id'>) => {
        const newActivity = { ...activityData, id: Date.now() } as TeacherProfessionalActivity;
        setTeacherProfessionalActivities(prev => [newActivity, ...prev]);
        addActivityLog(`Nueva actividad profesional registrada para ${selectedTeacher?.name} ${selectedTeacher?.lastName}.`);
        setIsActivityModalOpen(false);
    };

    const handleSaveDocument = (docData: Omit<PersonalDocument, 'id' | 'ownerId' | 'ownerType'>) => {
        if(!selectedTeacherId) return;
        const newDocument = {
            ...docData,
            id: Date.now(),
            ownerId: selectedTeacherId,
            ownerType: 'teacher' as const
        };
        setPersonalDocuments(prev => [newDocument, ...prev]);
        addActivityLog(`Nuevo documento personal subido para ${selectedTeacher?.name} ${selectedTeacher?.lastName}.`);
        setIsDocumentModalOpen(false);
    }
    
     if (selectedTeacher) {
        const age = calculateAge(selectedTeacher.birthDate);
        return (
             <>
                <button onClick={() => setSelectedTeacherId(null)} className="flex items-center text-sm font-medium text-primary hover:text-primary-hover mb-6">
                    <ChevronLeftIcon className="w-5 h-5 mr-1" />
                    Volver a la lista de docentes
                </button>
                <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                     <div className="flex items-start space-x-6">
                        <img src={selectedTeacher.photo} alt="Foto de perfil" className="w-24 h-24 rounded-full object-cover" />
                        <div>
                            <div className="flex items-center space-x-3">
                                <h1 className="text-2xl font-bold text-dark-text">{selectedTeacher.name} {selectedTeacher.lastName}</h1>
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-200 text-slate-800`}>{selectedTeacher.teacherType}</span>
                            </div>
                            <p className="text-medium-text">{selectedTeacher.rut}</p>
                             <p className="text-sm text-medium-text mt-2">
                                {age} años | {selectedTeacher.email}
                            </p>
                        </div>
                    </div>
                </div>
                 <div className="border-b border-slate-200">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        <button onClick={() => setActiveTab('Asignaturas')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'Asignaturas' ? 'border-primary text-primary' : 'border-transparent text-medium-text hover:text-dark-text hover:border-slate-300'}`}>Asignaturas Dictadas</button>
                        <button onClick={() => setActiveTab('Actividad Profesional')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'Actividad Profesional' ? 'border-primary text-primary' : 'border-transparent text-medium-text hover:text-dark-text hover:border-slate-300'}`}>Actividad Profesional</button>
                        <button onClick={() => setActiveTab('Documentos Personales')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'Documentos Personales' ? 'border-primary text-primary' : 'border-transparent text-medium-text hover:text-dark-text hover:border-slate-300'}`}>Documentos Personales</button>
                    </nav>
                </div>
                <div className="mt-6">
                    {activeTab === 'Asignaturas' && (
                        <div className="bg-white shadow-md rounded-lg overflow-hidden">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-medium-text uppercase tracking-wider">Asignatura</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-medium-text uppercase tracking-wider">Código</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-medium-text uppercase tracking-wider">Semestre</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {teacherSubjects.map(subject => (
                                        <tr key={subject.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-dark-text">{subject.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-medium-text">{subject.code}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-medium-text">{subject.semester}</td>
                                        </tr>
                                    ))}
                                    {teacherSubjects.length === 0 && (<tr><td colSpan={3} className="text-center py-4 text-medium-text">No tiene asignaturas asignadas.</td></tr>)}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {activeTab === 'Actividad Profesional' && (
                        <div>
                            <div className="flex justify-end mb-4">
                                <button onClick={() => setIsActivityModalOpen(true)} className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded-lg flex items-center text-sm">
                                    <PlusIcon className="w-4 h-4 mr-2" />
                                    Agregar Actividad
                                </button>
                            </div>
                            <div className="space-y-4">
                                {teacherActivities.map(activity => (
                                     <div key={activity.id} className="bg-white p-4 rounded-lg shadow-md border">
                                        <h3 className="font-bold text-dark-text">{activity.title}</h3>
                                        <p className="text-sm text-medium-text">{new Date(activity.date).toLocaleDateString('es-CL')}</p>
                                    </div>
                                ))}
                                {teacherActivities.length === 0 && <p className="text-center py-8 text-medium-text">No hay actividades profesionales registradas.</p>}
                            </div>
                        </div>
                    )}
                    {activeTab === 'Documentos Personales' && (
                         <div>
                            <div className="flex justify-end mb-4">
                                <button onClick={() => setIsDocumentModalOpen(true)} className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded-lg flex items-center text-sm">
                                    <PlusIcon className="w-4 h-4 mr-2" />
                                    Subir Documento
                                </button>
                            </div>
                             <div className="bg-white shadow-md rounded-lg overflow-hidden">
                                <table className="min-w-full divide-y divide-slate-200">
                                     <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-medium-text uppercase tracking-wider">Título</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-medium-text uppercase tracking-wider">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-200">
                                        {teacherDocuments.map(doc => (
                                            <tr key={doc.id}>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-medium text-dark-text">{doc.title}</p>
                                                    <p className="text-sm text-medium-text">{doc.description}</p>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                                    <button onClick={() => onPreviewFile(doc.file)} className="text-primary hover:text-primary-hover">Previsualizar</button>
                                                </td>
                                            </tr>
                                        ))}
                                        {teacherDocuments.length === 0 && (<tr><td colSpan={2} className="text-center py-4 text-medium-text">No hay documentos.</td></tr>)}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
                 <Modal isOpen={isActivityModalOpen} onClose={() => setIsActivityModalOpen(false)} title="Registrar Actividad Profesional">
                    <TeacherProfessionalActivityForm 
                        teacherId={selectedTeacherId}
                        onSave={handleSaveActivity}
                        onCancel={() => setIsActivityModalOpen(false)}
                    />
                </Modal>
                <Modal isOpen={isDocumentModalOpen} onClose={() => setIsDocumentModalOpen(false)} title="Subir Documento Personal">
                    <PersonalDocumentForm onSave={handleSaveDocument} onCancel={() => setIsDocumentModalOpen(false)} onPreviewFile={onPreviewFile} />
                </Modal>
            </>
        );
     }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-dark-text">Expediente de Docentes</h1>
                <div className="relative">
                    <input type="text" placeholder="Buscar docente..." value={searchTerm} onChange={e => setSearchTerm(e.currentTarget.value)} className="pl-10 pr-4 py-2 rounded-full border border-slate-300 w-64" />
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-light-text" />
                </div>
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredTeachers.map(teacher => (
                    <div key={teacher.id} className="bg-white rounded-lg shadow-md p-4 text-center flex flex-col items-center">
                        <img src={teacher.photo} alt="Foto de perfil" className="w-20 h-20 rounded-full object-cover mb-3" />
                        <p className="font-semibold text-dark-text">{teacher.name} {teacher.lastName}</p>
                        <p className="text-sm text-medium-text">{teacher.rut}</p>
                        <button onClick={() => setSelectedTeacherId(teacher.id)} className="mt-4 w-full bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded-lg text-sm">
                            Ver Expediente
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

type Page = 'Dashboard' | 'Alumnos' | 'Docentes' | 'Asignaturas' | 'Calificaciones' | 'Expediente Alumnos' | 'Expediente Docentes' | 'Calendario' | 'Noticias' | 'Documentos Oficiales' | 'Registro de Reuniones';

const App: FC = () => {
  const [page, setPage] = useState<Page>('Dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Data states
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [teachers, setTeachers] = useState<Teacher[]>(initialTeachers);
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
  const [grades, setGrades] = useState<Grade[]>(initialGrades);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>(initialActivityLog);
  const [anotaciones, setAnotaciones] = useState<Anotacion[]>(initialAnotaciones);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(initialCalendarEvents);
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>(initialNewsArticles);
  const [gradeReports, setGradeReports] = useState<GradeReport[]>(initialGradeReports);
  const [officialDocuments, setOfficialDocuments] = useState<OfficialDocument[]>(initialOfficialDocuments);
  const [meetingRecords, setMeetingRecords] = useState<MeetingRecord[]>(initialMeetingRecords);
  const [professionalActivities, setProfessionalActivities] = useState<ProfessionalActivity[]>(initialProfessionalActivities);
  const [teacherProfessionalActivities, setTeacherProfessionalActivities] = useState<TeacherProfessionalActivity[]>(initialTeacherProfessionalActivities);
  const [personalDocuments, setPersonalDocuments] = useState<PersonalDocument[]>(initialPersonalDocuments);

  const [reportModalData, setReportModalData] = useState<{ grade: Grade, report?: GradeReport } | null>(null);
  const [previewFile, setPreviewFile] = useState<{ name: string; url: string; type: string } | null>(null);

  const addActivityLog = (description: string) => {
      const newLog: ActivityLog = { id: Date.now(), timestamp: new Date(), description };
      setActivityLog(prev => [newLog, ...prev.slice(0, 4)]);
  };
  
  const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.API_KEY as string }), []);


  const handleOpenReportModal = (data: { grade: Grade, report?: GradeReport }) => {
    setReportModalData(data);
  };

  const handleSendReport = (gradeId: number, feedback: string) => {
    const grade = grades.find(g => g.id === gradeId);
    if (!grade) return;

    const finalGrade = calculateFinalGrade(grade);
    if(finalGrade === null) return;

    const student = students.find(s => s.id === grade.studentId);
    const subject = subjects.find(s => s.id === grade.subjectId);
    if (!student || !subject) return;

    const newReport: GradeReport = {
        id: Date.now(),
        gradeId,
        studentId: student.id,
        subjectId: subject.id,
        teacherId: subject.teacherId,
        generationDate: new Date(),
        gradeSummary: {
            grade1: grade.grade1,
            grade2: grade.grade2,
            grade3: grade.grade3,
            finalGrade: finalGrade,
        },
        competencyScores: grade.competencyScores || [],
        feedback: feedback,
        status: 'Pendiente Aceptación',
        signatureDate: new Date(),
    };
    
    setGradeReports(prev => [...prev, newReport]);
    addActivityLog(`Reporte para ${student.name} en ${subject.name} enviado.`);
    setReportModalData(null);
    console.log(`Simulando envío de email a ${student.email}: Su reporte de ${subject.name} ha sido enviado.`);

  };
  
  const handleAcceptReport = (reportId: number) => {
      setGradeReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'Completado', studentAcceptanceDate: new Date() } : r));
      const report = gradeReports.find(r => r.id === reportId);
      if (report) {
          const student = students.find(s => s.id === report.studentId);
          addActivityLog(`Reporte de ${student?.name} ${student?.lastName} ha sido aceptado.`);
      }
  };


  const renderPage = () => {
    switch (page) {
      case 'Dashboard':
        const recentGrades = grades
            .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
            .slice(0, 5);

        return (
            <div>
                 <h1 className="text-2xl font-bold text-dark-text mb-6">Dashboard</h1>
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main content: News and upcoming events */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* News Section */}
                        <div>
                            <h2 className="text-xl font-semibold text-dark-text mb-4">Últimas Noticias</h2>
                            <div className="space-y-4">
                            {newsArticles.slice(0, 2).map(article => (
                                <div key={article.id} className="bg-white p-4 rounded-lg shadow-md flex items-start space-x-4">
                                <img src={article.imageUrl} alt={article.title} className="w-32 h-20 object-cover rounded"/>
                                <div>
                                    <h3 className="font-bold text-dark-text">{article.title}</h3>
                                    <p className="text-xs text-medium-text mb-1">{article.author} &bull; {article.date.toLocaleDateString('es-CL')}</p>
                                    <p className="text-sm text-dark-text">{article.content.substring(0,80)}...</p>
                                </div>
                                </div>
                            ))}
                            </div>
                        </div>
                        {/* Upcoming Events Section */}
                        <div>
                            <h2 className="text-xl font-semibold text-dark-text mb-4">Próximos Eventos</h2>
                            <div className="bg-white p-4 rounded-lg shadow-md">
                                <ul className="space-y-3">
                                {calendarEvents.filter(e => e.start > new Date()).slice(0, 4).map(event => (
                                     <li key={event.id} className="flex items-center space-x-3">
                                        <div className="bg-primary-light text-primary font-bold p-2 rounded-md flex flex-col items-center justify-center h-12 w-12">
                                            <span className="text-xs uppercase">{event.start.toLocaleString('es-CL', { month: 'short' })}</span>
                                            <span className="text-lg">{event.start.getDate()}</span>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-dark-text text-sm">{event.title}</p>
                                            <p className="text-xs text-medium-text">{event.type}</p>
                                        </div>
                                    </li>
                                ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Right sidebar: Activity and recent grades */}
                    <div className="space-y-6">
                        {/* Activity Log */}
                        <div>
                            <h2 className="text-xl font-semibold text-dark-text mb-4">Actividad Reciente</h2>
                            <div className="bg-white p-4 rounded-lg shadow-md">
                                <ul className="space-y-3">
                                {activityLog.map(log => (
                                    <li key={log.id}>
                                        <p className="text-sm text-dark-text">{log.description}</p>
                                        <p className="text-xs text-light-text">{formatRelativeTime(log.timestamp)}</p>
                                    </li>
                                ))}
                                </ul>
                            </div>
                        </div>
                         {/* Recent Grades */}
                        <div>
                            <h2 className="text-xl font-semibold text-dark-text mb-4">Calificaciones Recientes</h2>
                             <div className="bg-white p-4 rounded-lg shadow-md">
                                <ul className="space-y-3">
                                    {recentGrades.map(grade => {
                                        const student = students.find(s => s.id === grade.studentId);
                                        const subject = subjects.find(s => s.id === grade.subjectId);
                                        const finalGrade = calculateFinalGrade(grade);
                                        if (!student || !subject) return null;
                                        return (
                                            <li key={grade.id} className="flex justify-between items-center">
                                                <div>
                                                    <p className="text-sm font-medium text-dark-text">{student.name} {student.lastName}</p>
                                                    <p className="text-xs text-medium-text">{subject.name}</p>
                                                </div>
                                                <span className={`text-sm font-bold ${finalGrade !== null && finalGrade < 4.0 ? 'text-red-600' : 'text-dark-text'}`}>
                                                    {finalGrade?.toFixed(1) || '-'}
                                                </span>
                                            </li>
                                        )
                                    })}
                                </ul>
                            </div>
                        </div>
                    </div>
                 </div>
            </div>
        );
      case 'Alumnos': return <StudentsPage students={students} setStudents={setStudents} addActivityLog={addActivityLog}/>;
      case 'Docentes': return <TeachersPage teachers={teachers} setTeachers={setTeachers} addActivityLog={addActivityLog}/>;
      case 'Asignaturas': return <SubjectsPage subjects={subjects} setSubjects={setSubjects} teachers={teachers} addActivityLog={addActivityLog}/>;
      case 'Calificaciones': return <GradesPage grades={grades} setGrades={setGrades} students={students} subjects={subjects} gradeReports={gradeReports} onOpenReportModal={handleOpenReportModal} addActivityLog={addActivityLog}/>;
      case 'Expediente Alumnos': return <StudentRecordPage students={students} teachers={teachers} subjects={subjects} grades={grades} anotaciones={anotaciones} setAnotaciones={setAnotaciones} gradeReports={gradeReports} professionalActivities={professionalActivities} setProfessionalActivities={setProfessionalActivities} personalDocuments={personalDocuments} setPersonalDocuments={setPersonalDocuments} onOpenReportModal={setReportModalData} onAcceptReport={handleAcceptReport} addActivityLog={addActivityLog} onPreviewFile={setPreviewFile} ai={ai} />;
      case 'Expediente Docentes': return <TeacherRecordPage teachers={teachers} subjects={subjects} teacherProfessionalActivities={teacherProfessionalActivities} setTeacherProfessionalActivities={setTeacherProfessionalActivities} personalDocuments={personalDocuments} setPersonalDocuments={setPersonalDocuments} addActivityLog={addActivityLog} onPreviewFile={setPreviewFile} />;
      case 'Calendario': return <CalendarPage events={calendarEvents} setEvents={setCalendarEvents} addActivityLog={addActivityLog}/>;
      case 'Noticias': return <NewsPage articles={newsArticles} setArticles={setNewsArticles} addActivityLog={addActivityLog} onPreviewFile={setPreviewFile} />;
      case 'Documentos Oficiales': return <OfficialDocumentsPage documents={officialDocuments} setDocuments={setOfficialDocuments} addActivityLog={addActivityLog} onPreviewFile={setPreviewFile} />;
      case 'Registro de Reuniones': return <MeetingRecordsPage meetings={meetingRecords} setMeetings={setMeetingRecords} students={students} teachers={teachers} addActivityLog={addActivityLog} ai={ai} />;
      default: return <div>Página no encontrada</div>;
    }
  };

  const navItems: { name: Page, icon: React.ReactElement }[] = [
    { name: 'Dashboard', icon: <MenuIcon className="w-5 h-5"/> },
    { name: 'Alumnos', icon: <UserIcon className="w-5 h-5"/> },
    { name: 'Docentes', icon: <UsersIcon className="w-5 h-5"/> },
    { name: 'Asignaturas', icon: <BookOpenIcon className="w-5 h-5"/> },
    { name: 'Calificaciones', icon: <ClipboardIcon className="w-5 h-5"/> },
    { name: 'Expediente Alumnos', icon: <FolderIcon className="w-5 h-5"/> },
    { name: 'Expediente Docentes', icon: <FolderIcon className="w-5 h-5"/> },
    { name: 'Calendario', icon: <CalendarIcon className="w-5 h-5"/> },
    { name: 'Noticias', icon: <NewspaperIcon className="w-5 h-5"/> },
    { name: 'Documentos Oficiales', icon: <FileTextIcon className="w-5 h-5"/> },
    { name: 'Registro de Reuniones', icon: <BriefcaseIcon className="w-5 h-5"/> },
  ];

  const Sidebar = () => (
      <aside className={`fixed top-0 left-0 z-40 w-64 h-screen pt-20 transition-transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} bg-secondary sm:translate-x-0`}>
        <div className="h-full px-3 pb-4 overflow-y-auto">
            <ul className="space-y-2 font-medium">
                {navItems.map(item => (
                    <li key={item.name}>
                        <a href="#" onClick={() => { setPage(item.name); setIsSidebarOpen(false); }} className={`flex items-center p-2 rounded-lg text-white hover:bg-slate-700 ${page === item.name ? 'bg-primary' : ''}`}>
                            {item.icon}
                            <span className="ml-3">{item.name}</span>
                        </a>
                    </li>
                ))}
            </ul>
        </div>
      </aside>
  );

  return (
    <div className="min-h-screen">
      <nav className="fixed top-0 z-50 w-full bg-secondary border-b border-slate-700">
        <div className="px-3 py-3 lg:px-5 lg:pl-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-start">
              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} type="button" className="inline-flex items-center p-2 text-sm text-gray-400 rounded-lg sm:hidden hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-gray-600">
                <MenuIcon className="w-6 h-6"/>
              </button>
              <a href="#" onClick={() => setPage('Dashboard')} className="flex ml-2 md:mr-24">
                <span className="self-center text-xl font-semibold sm:text-2xl whitespace-nowrap text-white">GRUA</span>
              </a>
            </div>
            <div className="flex items-center space-x-4">
                <button className="text-gray-400 hover:text-white relative">
                    <BellIcon className="w-6 h-6"/>
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                </button>
                <img className="w-8 h-8 rounded-full" src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="user photo" />
            </div>
          </div>
        </div>
      </nav>

      <Sidebar />
      
      <main className="p-4 sm:ml-64">
        <div className="pt-20">
          {renderPage()}
        </div>
      </main>
{/* FIX: Corrected the props for ReportModal, restored the end of the file, and added a default export. */}
      <ReportModal 
          isOpen={!!reportModalData}
          onClose={() => setReportModalData(null)}
          data={reportModalData}
          onSendReport={handleSendReport}
          onAcceptReport={handleAcceptReport}
          student={students.find(s => s.id === reportModalData?.grade.studentId)}
          subjectMap={new Map(subjects.map(s => [s.id, s]))}
          teacherMap={new Map(teachers.map(t => [t.id, `${t.name} ${t.lastName}`]))}
          ai={ai}
      />

      <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
    </div>
  );
};

export default App;
