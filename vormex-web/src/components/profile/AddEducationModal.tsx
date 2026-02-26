'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Dialog from '@radix-ui/react-dialog';
import {
    X,
    GraduationCap,
    BookOpen,
    Calendar,
    Award,
    Loader2,
    Check,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { createEducation } from '@/lib/api/profile';
import type { EducationInput, Education } from '@/types/profile';

interface AddEducationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onEducationAdded: (education: Education) => void;
}

export function AddEducationModal({
    isOpen,
    onClose,
    onEducationAdded,
}: AddEducationModalProps) {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<EducationInput>({
        school: '',
        degree: '',
        fieldOfStudy: '',
        startDate: '',
        endDate: '',
        isCurrent: false,
        grade: '',
        activities: '',
        description: '',
    });

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: checked,
            ...(name === 'isCurrent' && checked ? { endDate: '' } : {}),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.school.trim()) {
            setError('School/University name is required');
            return;
        }
        if (!formData.degree.trim()) {
            setError('Degree is required');
            return;
        }
        if (!formData.startDate) {
            setError('Start date is required');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const education = await createEducation(formData);
            onEducationAdded(education);
            // Reset form
            setFormData({
                school: '',
                degree: '',
                fieldOfStudy: '',
                startDate: '',
                endDate: '',
                isCurrent: false,
                grade: '',
                activities: '',
                description: '',
            });
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to add education');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={onClose}>
            <Dialog.Portal>
                <AnimatePresence>
                    {isOpen && (
                        <>
                            <Dialog.Overlay asChild>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm z-50 transition-opacity"
                                />
                            </Dialog.Overlay>

                            <Dialog.Content asChild>
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.98, y: 10 }}
                                    transition={{ duration: 0.2 }}
                                    className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl z-50 px-4"
                                >
                                    <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 shadow-2xl">
                                        {/* Header */}
                                        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                                            <Dialog.Title className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white uppercase">
                                                Add Education
                                            </Dialog.Title>
                                            <Dialog.Close asChild>
                                                <button className="text-neutral-400 hover:text-black dark:hover:text-white transition-colors">
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </Dialog.Close>
                                        </div>

                                        {/* Form */}
                                        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                                            {error && (
                                                <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wide">
                                                    {error}
                                                </div>
                                            )}

                                            {/* School Name */}
                                            <div>
                                                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5 block">School / University</label>
                                                <div className="relative">
                                                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                                    <input
                                                        type="text"
                                                        name="school"
                                                        value={formData.school}
                                                        onChange={handleChange}
                                                        placeholder="e.g. Stanford University"
                                                        className="w-full h-11 pl-10 pr-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-medium focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Degree */}
                                                <div>
                                                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5 block">Degree</label>
                                                    <div className="relative">
                                                        <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                                        <input
                                                            type="text"
                                                            name="degree"
                                                            value={formData.degree}
                                                            onChange={handleChange}
                                                            placeholder="e.g. Bachelor's"
                                                            className="w-full h-11 pl-10 pr-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-medium focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Field of Study */}
                                                <div>
                                                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5 block">Field of Study</label>
                                                    <div className="relative">
                                                        <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                                        <input
                                                            type="text"
                                                            name="fieldOfStudy"
                                                            value={formData.fieldOfStudy}
                                                            onChange={handleChange}
                                                            placeholder="e.g. Computer Science"
                                                            className="w-full h-11 pl-10 pr-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-medium focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Dates grid */}
                                            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-neutral-100 dark:border-neutral-800">
                                                <div>
                                                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5 block">Start Date</label>
                                                    <div className="relative">
                                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                                        <input
                                                            type="date"
                                                            name="startDate"
                                                            value={formData.startDate}
                                                            onChange={handleChange}
                                                            className="w-full h-11 pl-10 pr-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-medium focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5 block">End Date</label>
                                                    <div className="relative">
                                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                                        <input
                                                            type="date"
                                                            name="endDate"
                                                            value={formData.endDate || ''}
                                                            onChange={handleChange}
                                                            disabled={formData.isCurrent}
                                                            className="w-full h-11 pl-10 pr-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-medium focus:outline-none focus:border-black dark:focus:border-white transition-colors disabled:opacity-50"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Currently Studying Toggle */}
                                            <div>
                                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                                    <div className={`w-4 h-4 border flex items-center justify-center transition-colors ${formData.isCurrent ? 'bg-black dark:bg-white border-black dark:border-white' : 'border-neutral-300 dark:border-neutral-700'}`}>
                                                        {formData.isCurrent && <Check className="w-3 h-3 text-white dark:text-black" />}
                                                        <input type="checkbox" name="isCurrent" checked={formData.isCurrent} onChange={handleCheckboxChange} className="hidden" />
                                                    </div>
                                                    <span className="text-xs font-bold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">I am currently studying here</span>
                                                </label>
                                            </div>

                                            {/* Grade */}
                                            <div>
                                                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5 block">Grade / GPA</label>
                                                <div className="relative">
                                                    <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                                    <input
                                                        type="text"
                                                        name="grade"
                                                        value={formData.grade || ''}
                                                        onChange={handleChange}
                                                        placeholder="e.g. 3.8 GPA"
                                                        className="w-full h-11 pl-10 pr-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-medium focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                                                    />
                                                </div>
                                            </div>

                                            {/* Activities */}
                                            <div>
                                                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5 block">Activities & Societies</label>
                                                <textarea
                                                    name="activities"
                                                    value={formData.activities || ''}
                                                    onChange={handleChange}
                                                    placeholder="e.g. Computer Science Club, Student Government..."
                                                    rows={2}
                                                    className="w-full p-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-medium focus:outline-none focus:border-black dark:focus:border-white transition-colors resize-none"
                                                />
                                            </div>

                                            {/* Description */}
                                            <div>
                                                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5 block">Description</label>
                                                <textarea
                                                    name="description"
                                                    value={formData.description || ''}
                                                    onChange={handleChange}
                                                    placeholder="Describe your coursework, achievements, etc..."
                                                    rows={4}
                                                    className="w-full p-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-medium focus:outline-none focus:border-black dark:focus:border-white transition-colors resize-none"
                                                />
                                            </div>

                                            {/* Footer Buttons */}
                                            <div className="flex gap-3 pt-2">
                                                <Button
                                                    type="button"
                                                    onClick={onClose}
                                                    className="flex-1 py-4 bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white rounded-none text-xs font-bold uppercase tracking-wider hover:bg-neutral-50 dark:hover:bg-neutral-900"
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    type="submit"
                                                    disabled={saving}
                                                    className="flex-[2] py-4 bg-black dark:bg-white text-white dark:text-black rounded-none text-xs font-bold uppercase tracking-wider hover:opacity-90 disabled:opacity-50"
                                                >
                                                    {saving ? (
                                                        <>
                                                            <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                                                            Adding...
                                                        </>
                                                    ) : (
                                                        'Add Education'
                                                    )}
                                                </Button>
                                            </div>
                                        </form>
                                    </div>
                                </motion.div>
                            </Dialog.Content>
                        </>
                    )}
                </AnimatePresence>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
