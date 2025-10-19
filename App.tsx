
import React, { useState, FC, ChangeEvent, useMemo, useEffect, useRef } from 'react';
import { Student, Teacher, Subject, Grade, ActivityLog, Anotacion, CalendarEvent, NewsArticle, GradeReport } from './types';
import { initialStudents, initialTeachers, initialSubjects, initialGrades, initialActivityLog, initialAnotaciones, initialCalendarEvents, initialNewsArticles, initialGradeReports } from './data';

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
    return (grade1 * 0.6) + (grade2 * 0.3) + (grade3 * 0.1);
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

// --- Student Management Components ---
type StudentFormState = Omit<Student, 'id'>;

const StudentForm: FC<{ student?: Student; onSave: (student: StudentFormState, id?: number) => void; onCancel: () => void }> = ({ student, onSave, onCancel }) => {
  const initialFormState: StudentFormState = student 
    ? { ...student } 
    : { name: '', lastName: '', rut: '', email: '', admissionYear: new Date().getFullYear(), phone: '', undergradUniversity: '', nationality: '', photo: '', birthDate: '' };

  const [formState, setFormState] = useState(initialFormState);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
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

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-dark-text">Gestión de Alumnos</h1>
        <button onClick={() => { setEditingStudent(undefined); setIsModalOpen(true); }} className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded-lg flex items-center">
          <PlusIcon className="w-5 h-5 mr-2" />
          Nuevo Alumno
        </button>
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
    const { name, value } = e.target;
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

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-dark-text">Gestión de Docentes</h1>
                <button onClick={() => { setEditingTeacher(undefined); setIsModalOpen(true); }} className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded-lg flex items-center">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Nuevo Docente
                </button>
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
    const { name, value } = e.target;
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

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-dark-text">Gestión de Asignaturas</h1>
                <button onClick={() => { setEditingSubject(undefined); setIsModalOpen(true); }} className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded-lg flex items-center">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Nueva Asignatura
                </button>
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
    const { name, value } = e.target;
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

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-dark-text">Gestión de Calificaciones</h1>
        <button onClick={() => { setEditingGrade(undefined); setIsFormModalOpen(true); }} className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded-lg flex items-center">
          <PlusIcon className="w-5 h-5 mr-2" />
          Nueva Calificación
        </button>
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
    teacherMap: Map<number, string>
}> = ({ isOpen, onClose, data, onSendReport, onAcceptReport, student, subjectMap, teacherMap }) => {
    const [feedback, setFeedback] = useState("");

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
                             <h3 className="text-lg font-bold text-dark-text mb-3">Feedback del Docente</h3>
                             <textarea 
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                disabled={!isSending}
                                rows={8}
                                placeholder={isSending ? "Escriba aquí su feedback..." : "Sin feedback adicional."}
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


const StudentRecordPage: FC<{
    students: Student[];
    teachers: Teacher[];
    subjects: Subject[];
    grades: Grade[];
    anotaciones: Anotacion[];
    setAnotaciones: React.Dispatch<React.SetStateAction<Anotacion[]>>;
    gradeReports: GradeReport[];
    onOpenReportModal: (data: { grade: Grade, report: GradeReport }) => void;
    onAcceptReport: (reportId: number) => void;
    addActivityLog: (desc: string) => void;
}> = ({ students, teachers, subjects, grades, anotaciones, setAnotaciones, gradeReports, onOpenReportModal, onAcceptReport, addActivityLog }) => {
    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const teacherMap = useMemo(() => new Map(teachers.map(t => [t.id, `${t.name} ${t.lastName}`])), [teachers]);
    const subjectMap = useMemo(() => new Map(subjects.map(s => [s.id, s])), [subjects]);

    const selectedStudent = useMemo(() => students.find(s => s.id === selectedStudentId), [students, selectedStudentId]);

    const filteredStudents = useMemo(() =>
        students.filter(s =>
            `${s.name} ${s.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.rut.includes(searchTerm)
        ), [students, searchTerm]);

    const [activeTab, setActiveTab] = useState<'Calificaciones' | 'Anotaciones' | 'Reportes'>('Calificaciones');

    const studentGrades = useMemo(() => grades.filter(g => g.studentId === selectedStudentId), [grades, selectedStudentId]);
    const studentAnotaciones = useMemo(() => anotaciones.filter(a => a.studentId === selectedStudentId).sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime()), [anotaciones, selectedStudentId]);
    const studentReports = useMemo(() => gradeReports.filter(r => r.studentId === selectedStudentId).sort((a,b) => b.generationDate.getTime() - a.generationDate.getTime()), [gradeReports, selectedStudentId]);
    
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

    if (selectedStudent) {
        const { status, color } = getResidencyStatus(selectedStudent.admissionYear);
        const age = calculateAge(selectedStudent.birthDate);
        return (
            <div>
                 <button onClick={() => setSelectedStudentId(null)} className="flex items-center text-sm font-medium text-primary hover:text-primary-hover mb-6">
                    <ChevronLeftIcon className="w-5 h-5 mr-1" />
                    Volver a la lista de alumnos
                </button>
                <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                    <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-6">
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
                </div>

                <div className="border-b border-slate-200">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        <button onClick={() => setActiveTab('Calificaciones')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'Calificaciones' ? 'border-primary text-primary' : 'border-transparent text-medium-text hover:text-dark-text hover:border-slate-300'}`}>Calificaciones</button>
                        <button onClick={() => setActiveTab('Anotaciones')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'Anotaciones' ? 'border-primary text-primary' : 'border-transparent text-medium-text hover:text-dark-text hover:border-slate-300'}`}>Anotaciones</button>
                        <button onClick={() => setActiveTab('Reportes')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'Reportes' ? 'border-primary text-primary' : 'border-transparent text-medium-text hover:text-dark-text hover:border-slate-300'}`}>Reportes</button>
                    </nav>
                </div>
                
                <div className="mt-6">
                    {activeTab === 'Calificaciones' && (
                         <div className="bg-white shadow-md rounded-lg overflow-x-auto">
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
                                        <select value={newAnotacion.autorId} onChange={e => setNewAnotacion({...newAnotacion, autorId: parseInt(e.target.value)})} className="w-full p-2 border-slate-300 rounded-md shadow-sm">
                                            {teachers.map(t => <option key={t.id} value={t.id}>{t.name} {t.lastName}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-medium-text mb-1">Tipo</label>
                                        <select value={newAnotacion.type} onChange={e => setNewAnotacion({...newAnotacion, type: e.target.value as Anotacion['type']})} className="w-full p-2 border-slate-300 rounded-md shadow-sm">
                                            <option>Observación</option>
                                            <option>Positiva</option>
                                            <option>Negativa</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-medium-text mb-1">Descripción</label>
                                        <textarea value={newAnotacion.text} onChange={e => setNewAnotacion({...newAnotacion, text: e.target.value})} rows={4} className="w-full p-2 border-slate-300 rounded-md shadow-sm" required></textarea>
                                    </div>
                                    <button type="submit" className="w-full bg-primary hover:bg-primary-hover text-white rounded-md py-2 text-sm font-medium">Guardar Anotación</button>
                                </form>
                            </div>
                        </div>
                    )}
                     {activeTab === 'Reportes' && (
                         <div className="bg-white shadow-md rounded-lg overflow-x-auto">
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
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-4">
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
                </div>
            </div>
        )
    }

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                <h1 className="text-2xl font-bold text-dark-text">Expediente de Alumnos</h1>
                <div className="relative">
                    <input type="text" placeholder="Buscar alumno por nombre o RUT..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 rounded-full border border-slate-300 w-full sm:w-64" />
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-light-text" />
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
// FIX: Implement functional form for adding new calendar events.
const EventForm: FC<{ onSave: (event: Omit<CalendarEvent, 'id'>) => void; onCancel: () => void }> = ({ onSave, onCancel }) => {
  const [title, setTitle] = useState('');

  const toDateTimeLocal = (date: Date) => {
    const ten = (i: number) => (i < 10 ? '0' : '') + i;
    const YYYY = date.getFullYear();
    const MM = ten(date.getMonth() + 1);
    const DD = ten(date.getDate());
    const HH = ten(date.getHours());
    const II = ten(date.getMinutes());
    return `${YYYY}-${MM}-${DD}T${HH}:${II}`;
  };

  const [start, setStart] = useState(toDateTimeLocal(new Date()));
  const [end, setEnd] = useState(toDateTimeLocal(new Date()));
  const [type, setType] = useState<CalendarEvent['type']>('Evento');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (new Date(start) > new Date(end)) {
        alert("La fecha de inicio no puede ser posterior a la fecha de término.");
        return;
    }
    onSave({ title, start: new Date(start), end: new Date(end), type });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-medium-text mb-1">Título del Evento</label>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2 border-slate-300 rounded-md shadow-sm" required />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <label className="block text-sm font-medium text-medium-text mb-1">Inicio</label>
            <input type="datetime-local" value={start} onChange={e => setStart(e.target.value)} className="w-full p-2 border-slate-300 rounded-md shadow-sm" required />
        </div>
        <div>
            <label className="block text-sm font-medium text-medium-text mb-1">Término</label>
            <input type="datetime-local" value={end} onChange={e => setEnd(e.target.value)} className="w-full p-2 border-slate-300 rounded-md shadow-sm" required />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-medium-text mb-1">Tipo de Evento</label>
        <select value={type} onChange={e => setType(e.target.value as CalendarEvent['type'])} className="w-full p-2 border-slate-300 rounded-md shadow-sm">
            <option>Evento</option>
            <option>Examen</option>
            <option>Clase</option>
            <option>Feriado</option>
        </select>
      </div>
      <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onCancel} className="bg-white border border-slate-300 rounded-md py-2 px-4 text-sm font-medium text-dark-text hover:bg-slate-50">Cancelar</button>
            <button type="submit" className="bg-primary hover:bg-primary-hover text-white rounded-md py-2 px-4 text-sm font-medium">Agregar Evento</button>
      </div>
    </form>
  );
};

// --- Calendar Page ---
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
                                    <div className="text-dark-text text-sm">{event.title}</div>
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

// FIX: Implement functional form for adding new news articles with attachments.
const NewsForm: FC<{ onSave: (article: Omit<NewsArticle, 'id' | 'date'>) => void; onCancel: () => void }> = ({ onSave, onCancel }) => {
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
      const newAttachments = await Promise.all(Array.from(files).map(async file => {
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
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2 border-slate-300 rounded-md shadow-sm" required />
        </div>
        <div>
            <label className="block text-sm font-medium text-medium-text mb-1">Autor</label>
            <input type="text" value={author} onChange={e => setAuthor(e.target.value)} className="w-full p-2 border-slate-300 rounded-md shadow-sm" required />
        </div>
        <div>
            <label className="block text-sm font-medium text-medium-text mb-1">Contenido</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={6} className="w-full p-2 border-slate-300 rounded-md shadow-sm" required></textarea>
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
                        <span className="text-sm text-dark-text">{file.name}</span>
                        <button type="button" onClick={() => removeAttachment(index)} className="text-red-500 hover:text-red-700">
                            <TrashIcon className="w-4 h-4" />
                        </button>
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

// --- News Page ---
const NewsPage: FC<{
    articles: NewsArticle[],
    setArticles: React.Dispatch<React.SetStateAction<NewsArticle[]>>,
    addActivityLog: (desc: string) => void,
}> = ({ articles, setArticles, addActivityLog }) => {
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
                            <div>
                                <h4 className="font-semibold text-dark-text mb-2">Archivos Adjuntos:</h4>
                                <ul className="space-y-2">
                                    {selectedArticle.attachments.map((file, index) => (
                                        <li key={index}>
                                            <a href={file.url} download={file.name} className="text-primary hover:underline">{file.name}</a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nueva Noticia">
                 <NewsForm onSave={handleSave} onCancel={() => setIsModalOpen(false)} />
            </Modal>
        </>
    );
};

// --- Dashboard & Placeholder Components ---

const StatCard: FC<{ icon: React.ReactNode, title: string, value: string | number, color: string }> = ({ icon, title, value, color }) => (
    <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
        <div className={`rounded-full p-3 ${color}`}>
            {icon}
        </div>
        <div className="ml-4">
            <p className="text-sm text-medium-text font-medium">{title}</p>
            <p className="text-2xl font-bold text-dark-text">{value}</p>
        </div>
    </div>
);

type Page = 'Dashboard' | 'Alumnos' | 'Docentes' | 'Asignaturas' | 'Calificaciones' | 'Expediente Alumnos' | 'Calendario' | 'Noticias' | 'Configuracion';

const Dashboard: FC<{ 
    studentCount: number; 
    teacherCount: number; 
    subjectCount: number; 
    activityLog: ActivityLog[];
    calendarEvents: CalendarEvent[];
    newsArticles: NewsArticle[];
    setCurrentPage: (page: Page) => void;
}> = ({ studentCount, teacherCount, subjectCount, activityLog, calendarEvents, newsArticles, setCurrentPage }) => {
    
    const upcomingEvents = useMemo(() => 
        calendarEvents
            .filter(event => event.start >= new Date())
            .slice(0, 4), 
        [calendarEvents]
    );

    const latestNews = useMemo(() => newsArticles.slice(0, 2), [newsArticles]);

    const getEventTypeColor = (type: CalendarEvent['type']) => {
        switch(type) {
            case 'Examen': return 'bg-red-500';
            case 'Clase': return 'bg-blue-500';
            case 'Feriado': return 'bg-green-500';
            case 'Evento': return 'bg-amber-500';
        }
    };

    return (
        <div>
            <h1 className="text-2xl font-bold text-dark-text mb-6">Panel de Control</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <StatCard 
                    icon={<UsersIcon className="h-6 w-6 text-indigo-600" />} 
                    title="Alumnos Activos" 
                    value={studentCount} 
                    color="bg-indigo-100" 
                />
                <StatCard 
                    icon={<UserIcon className="h-6 w-6 text-green-600" />} 
                    title="Docentes" 
                    value={teacherCount} 
                    color="bg-green-100" 
                />
                <StatCard 
                    icon={<BookOpenIcon className="h-6 w-6 text-amber-600" />} 
                    title="Asignaturas" 
                    value={subjectCount} 
                    color="bg-amber-100" 
                />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
                <div className="xl:col-span-2 bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold text-dark-text mb-4">Actividad Reciente</h2>
                    <ul className="divide-y divide-slate-200">
                        {activityLog.length > 0 ? (
                            activityLog.slice(0, 5).map(log => (
                               <li key={log.id} className="py-3">
                                    <p className="text-sm text-dark-text">{log.description}</p>
                                    <p className="text-xs text-medium-text">{formatRelativeTime(log.timestamp)}</p>
                                </li>
                            ))
                        ) : (
                             <li className="py-3 text-sm text-medium-text">No hay actividad reciente.</li>
                        )}
                    </ul>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-dark-text">Próximos Eventos</h2>
                        <button onClick={() => setCurrentPage('Calendario')} className="text-sm font-semibold text-primary hover:text-primary-hover">
                            Ver todos
                        </button>
                    </div>
                     <ul className="space-y-3">
                        {upcomingEvents.length > 0 ? upcomingEvents.map(event => (
                            <li key={event.id} className="flex items-start space-x-3">
                                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5 ${getEventTypeColor(event.type)}`}></div>
                                <div>
                                    <p className="text-sm text-dark-text font-medium leading-tight">{event.title}</p>
                                    <p className="text-xs text-medium-text">{event.start.toLocaleDateString('es-CL', { day: 'numeric', month: 'long' })}</p>
                                </div>
                            </li>
                        )) : <p className="text-sm text-medium-text">No hay eventos próximos.</p>}
                    </ul>
                </div>
            </div>
            
            <div>
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-dark-text">Últimas Noticias</h2>
                    <button onClick={() => setCurrentPage('Noticias')} className="text-sm font-semibold text-primary hover:text-primary-hover">
                        Ver todas &rarr;
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {latestNews.map(article => (
                         <div key={article.id} className="bg-white rounded-lg shadow-md overflow-hidden flex">
                            <img src={article.imageUrl || 'https://via.placeholder.com/400x200'} alt={article.title} className="w-1/3 h-full object-cover"/>
                            <div className="p-4 flex flex-col">
                                <h3 className="text-md font-bold text-dark-text mb-1">{article.title}</h3>
                                <p className="text-xs text-medium-text mb-2">{article.date.toLocaleDateString('es-CL')}</p>
                                <p className="text-sm text-dark-text flex-grow hidden sm:block">{article.content.substring(0, 60)}...</p>
                                <button onClick={() => setCurrentPage('Noticias')} className="mt-2 text-sm font-semibold text-primary hover:text-primary-hover self-start">
                                    Leer más
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const PlaceholderPage: FC<{ title: string }> = ({ title }) => (
    <div>
        <h1 className="text-2xl font-bold text-dark-text">{title}</h1>
        <p className="text-medium-text mt-4">Esta sección está en construcción.</p>
    </div>
);


// --- Main App Component ---

const App: FC = () => {
    const [currentPage, setCurrentPage] = useState<Page>('Dashboard');
    const [students, setStudents] = useState<Student[]>(initialStudents);
    const [teachers, setTeachers] = useState<Teacher[]>(initialTeachers);
    const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
    const [grades, setGrades] = useState<Grade[]>(initialGrades);
    const [anotaciones, setAnotaciones] = useState<Anotacion[]>(initialAnotaciones);
    const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(initialCalendarEvents);
    const [newsArticles, setNewsArticles] = useState<NewsArticle[]>(initialNewsArticles);
    const [gradeReports, setGradeReports] = useState<GradeReport[]>(initialGradeReports);
    const [activityLog, setActivityLog] = useState<ActivityLog[]>(initialActivityLog);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    const [reportModalData, setReportModalData] = useState<{ grade: Grade; report?: GradeReport } | null>(null);

    const studentMap = useMemo(() => new Map<number, Student>(students.map(s => [s.id, s])), [students]);
    const teacherMap = useMemo(() => new Map<number, string>(teachers.map(t => [t.id, `${t.name} ${t.lastName}`])), [teachers]);
    const subjectMap = useMemo(() => new Map<number, Subject>(subjects.map(s => [s.id, s])), [subjects]);

    const addActivityLog = (description: string) => {
        const newLog: ActivityLog = {
            id: Date.now(),
            timestamp: new Date(),
            description: description
        };
        setActivityLog(prev => [newLog, ...prev]);
    };
    
    const handleSendReport = (gradeId: number, feedback: string) => {
        const grade = grades.find(g => g.id === gradeId);
        if (!grade) return;
        
        const finalGrade = calculateFinalGrade(grade);
        if (finalGrade === null) {
            alert("No se pueden finalizar calificaciones incompletas.");
            return;
        }

        const studentName = studentMap.get(grade.studentId)?.name || 'N/A';
        const subject = subjectMap.get(grade.subjectId);
        
        const newReport: GradeReport = {
            id: Date.now(),
            gradeId: grade.id,
            studentId: grade.studentId,
            subjectId: grade.subjectId,
            teacherId: subject?.teacherId,
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
        setGrades(prev => prev.map(g => g.id === gradeId ? { ...g, isFinalized: true, lastModified: new Date().toISOString() } : g));
        addActivityLog(`Reporte para ${studentName} en ${subject?.name} ha sido enviado.`);
        setReportModalData(null);
    };
    
    const handleAcceptReport = (reportId: number) => {
        const report = gradeReports.find(r => r.id === reportId);
        if (!report) return;

        setGradeReports(prev => prev.map(r =>
            r.id === reportId
                ? { ...r, status: 'Completado', studentAcceptanceDate: new Date() }
                : r
        ));
        const student = studentMap.get(report.studentId);
        const subject = subjectMap.get(report.subjectId);
        addActivityLog(`Reporte de ${subject?.name} para ${student?.name} ha sido aceptado por el alumno.`);
    };
    
    const renderPage = () => {
        switch (currentPage) {
            case 'Dashboard':
                return <Dashboard 
                    studentCount={students.length} 
                    teacherCount={teachers.length} 
                    subjectCount={subjects.length} 
                    activityLog={activityLog}
                    calendarEvents={calendarEvents}
                    newsArticles={newsArticles}
                    setCurrentPage={setCurrentPage}
                />;
            case 'Alumnos':
                return <StudentsPage students={students} setStudents={setStudents} addActivityLog={addActivityLog} />;
            case 'Docentes':
                return <TeachersPage teachers={teachers} setTeachers={setTeachers} addActivityLog={addActivityLog} />;
            case 'Asignaturas':
                return <SubjectsPage subjects={subjects} setSubjects={setSubjects} teachers={teachers} addActivityLog={addActivityLog} />;
            case 'Calificaciones':
                return <GradesPage 
                    grades={grades} 
                    setGrades={setGrades} 
                    students={students} 
                    subjects={subjects} 
                    gradeReports={gradeReports} 
                    onOpenReportModal={setReportModalData}
                    addActivityLog={addActivityLog} 
                />;
            case 'Expediente Alumnos':
                return <StudentRecordPage 
                    students={students} 
                    teachers={teachers} 
                    subjects={subjects} 
                    grades={grades} 
                    anotaciones={anotaciones} 
                    setAnotaciones={setAnotaciones} 
                    gradeReports={gradeReports}
                    onOpenReportModal={setReportModalData}
                    onAcceptReport={handleAcceptReport}
                    addActivityLog={addActivityLog} 
                />;
            case 'Calendario':
                return <CalendarPage events={calendarEvents} setEvents={setCalendarEvents} addActivityLog={addActivityLog} />;
            case 'Noticias':
                return <NewsPage articles={newsArticles} setArticles={setNewsArticles} addActivityLog={addActivityLog} />;
            case 'Configuracion':
                return <PlaceholderPage title="Configuración" />;
            default:
                return <div>Página no encontrada</div>;
        }
    };

    const NavLink: FC<{ icon: React.ReactElement<{ className?: string }>; label: Page }> = ({ icon, label }) => (
        <a
            href="#"
            onClick={(e) => {
                e.preventDefault();
                setCurrentPage(label);
                setIsSidebarOpen(false);
            }}
            className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${currentPage === label ? 'bg-primary text-white' : 'text-slate-200 hover:bg-secondary'}`}
        >
            {React.cloneElement(icon, { className: 'w-5 h-5 mr-3' })}
            {label}
        </a>
    );

    const sidebarContent = (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-center h-16 border-b border-slate-700">
          <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 7L12 12L22 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 22V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M20 4.5L12 9L4 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M17 9.5V14.5L12 17.5L7 14.5V9.5L12 12L17 9.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <h1 className="text-xl font-bold text-white ml-3">GRUA</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
            <NavLink icon={<MenuIcon />} label="Dashboard" />
            <NavLink icon={<UsersIcon />} label="Alumnos" />
            <NavLink icon={<UserIcon />} label="Docentes" />
            <NavLink icon={<BookOpenIcon />} label="Asignaturas" />
            <NavLink icon={<ClipboardIcon />} label="Calificaciones" />
            <NavLink icon={<FolderIcon />} label="Expediente Alumnos" />
            <NavLink icon={<CalendarIcon />} label="Calendario" />
            <NavLink icon={<NewspaperIcon />} label="Noticias" />
        </nav>
        <div className="p-4 border-t border-slate-700">
          <NavLink icon={<SettingsIcon />} label="Configuracion" />
        </div>
      </div>
    );
    
    return (
        <div className="flex h-screen bg-light-bg">
            {/* Mobile Sidebar */}
            <div className={`fixed inset-0 z-40 bg-gray-900 bg-opacity-75 transition-opacity lg:hidden ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsSidebarOpen(false)}></div>
            <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-secondary transform transition-transform lg:hidden ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
              {sidebarContent}
            </div>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex lg:flex-shrink-0 w-64 bg-secondary">
              {sidebarContent}
            </aside>
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="flex justify-between items-center p-4 bg-white border-b border-slate-200">
                   <button className="lg:hidden text-dark-text" onClick={() => setIsSidebarOpen(true)} aria-label="Abrir menú">
                      <MenuIcon className="w-6 h-6" />
                   </button>
                    <div className="relative hidden md:block">
                        <input type="text" placeholder="Buscar..." className="pl-10 pr-4 py-2 rounded-full border border-slate-300 w-64" />
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-light-text" />
                    </div>
                    <div className="flex items-center space-x-4">
                        <button className="text-dark-text" aria-label="Notificaciones">
                          <BellIcon className="w-6 h-6" />
                        </button>
                    </div>
                </header>
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-light-bg p-6">
                    {renderPage()}
                </main>
            </div>
            {reportModalData && (
                 <ReportModal 
                    isOpen={!!reportModalData}
                    onClose={() => setReportModalData(null)}
                    data={reportModalData}
                    onSendReport={handleSendReport}
                    onAcceptReport={handleAcceptReport}
                    student={studentMap.get(reportModalData.grade.studentId)}
                    subjectMap={subjectMap}
                    teacherMap={teacherMap}
                />
            )}
        </div>
    );
};

export default App;
