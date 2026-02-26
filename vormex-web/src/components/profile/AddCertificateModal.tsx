'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Dialog from '@radix-ui/react-dialog';
import {
  X,
  Award,
  Loader2,
  Calendar,
  Building,
  Link as LinkIcon,
  Hash,
  Upload,
  Trash2,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { createCertificate, updateCertificate } from '@/lib/api/profile';
import { uploadCertificate } from '@/lib/api/posts';
import type { Certificate, CertificateInput } from '@/types/profile';

const CARD_COLORS = [
  { name: 'Neutral', value: '#525252' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Green', value: '#10b981' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
];

interface AddCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCertificateAdded: (certificate: Certificate) => void;
  certificateToEdit?: Certificate | null;
  onCertificateUpdated?: (certificate: Certificate) => void;
}

export function AddCertificateModal({
  isOpen,
  onClose,
  onCertificateAdded,
  certificateToEdit,
  onCertificateUpdated,
}: AddCertificateModalProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [issuingOrg, setIssuingOrg] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [doesNotExpire, setDoesNotExpire] = useState(false);
  const [credentialId, setCredentialId] = useState('');
  const [credentialUrl, setCredentialUrl] = useState('');
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [certificatePreview, setCertificatePreview] = useState<string | null>(null);
  const [uploadMethod, setUploadMethod] = useState<'url' | 'file'>('file');
  const [selectedColor, setSelectedColor] = useState(CARD_COLORS[0].value);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (certificateToEdit) {
        setName(certificateToEdit.name);
        setIssuingOrg(certificateToEdit.issuingOrg);
        setIssueDate(certificateToEdit.issueDate.split('T')[0]);
        setExpiryDate(certificateToEdit.expiryDate ? certificateToEdit.expiryDate.split('T')[0] : '');
        setDoesNotExpire(certificateToEdit.doesNotExpire);
        setCredentialId(certificateToEdit.credentialId || '');
        setCredentialUrl(certificateToEdit.credentialUrl || '');
        setSelectedColor(certificateToEdit.color || CARD_COLORS[0].value);

        // Preview setup
        if (certificateToEdit.credentialUrl) {
          if (certificateToEdit.credentialUrl.match(/\.(jpeg|jpg|png|webp)/i) ||
            certificateToEdit.credentialUrl.includes('bunnycdn')) {
            setCertificatePreview(certificateToEdit.credentialUrl);
            setUploadMethod('file');
          } else {
            setUploadMethod('url');
          }
        } else {
          setUploadMethod('file');
        }
      } else {
        resetForm();
      }
      setError(null);
    }
  }, [isOpen, certificateToEdit]);

  const resetForm = () => {
    setName('');
    setIssuingOrg('');
    setIssueDate('');
    setExpiryDate('');
    setDoesNotExpire(false);
    setCredentialId('');
    setCredentialUrl('');
    setCertificateFile(null);
    setCertificatePreview(null);
    setUploadMethod('file');
    setSelectedColor(CARD_COLORS[0].value);
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('File size should be less than 5MB');
        return;
      }

      setCertificateFile(file);
      setCertificatePreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleRemoveFile = () => {
    if (certificatePreview) {
      // Create new blob URLs should be revoked, but keep string URLs (from edit)
      if (certificatePreview.startsWith('blob:')) {
        URL.revokeObjectURL(certificatePreview);
      }
    }
    setCertificateFile(null);
    setCertificatePreview(null);
    setCredentialUrl(''); // Clear existing URL if removing
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Certificate name is required');
      return;
    }
    if (!issuingOrg.trim()) {
      setError('Issuing organization is required');
      return;
    }
    if (!issueDate) {
      setError('Issue date is required');
      return;
    }
    if (!doesNotExpire && expiryDate && new Date(expiryDate) < new Date(issueDate)) {
      setError('Expiry date cannot be before issue date');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let finalCredentialUrl = credentialUrl.trim();

      if (uploadMethod === 'file' && certificateFile) {
        setUploading(true);
        try {
          const result = await uploadCertificate(certificateFile);
          finalCredentialUrl = result.certificateUrl;
        } catch (uploadErr: any) {
          console.error('Failed to upload certificate:', uploadErr);
          setError('Failed to upload certificate image. Please try again.');
          setLoading(false);
          setUploading(false);
          return;
        }
        setUploading(false);
      } else if (uploadMethod === 'file' && certificatePreview && !certificateFile) {
        // Existing image from edit (no new file), keep existing URL
        finalCredentialUrl = certificateToEdit?.credentialUrl || '';
      }

      const certificateData: CertificateInput = {
        name: name.trim(),
        issuingOrg: issuingOrg.trim(),
        issueDate,
        expiryDate: doesNotExpire ? undefined : expiryDate || undefined,
        doesNotExpire,
        credentialId: credentialId.trim() || undefined,
        credentialUrl: finalCredentialUrl || undefined,
        color: selectedColor,
      };

      if (certificateToEdit && onCertificateUpdated) {
        const updated = await updateCertificate(certificateToEdit.id, certificateData);
        onCertificateUpdated(updated);
      } else {
        const certificate = await createCertificate(certificateData);
        onCertificateAdded(certificate);
      }
      handleClose();
    } catch (err: any) {
      console.error('Failed to save certificate:', err);
      setError(err.response?.data?.error || err.message || 'Failed to save certificate');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && handleClose()}>
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
                  className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg max-h-[90vh] overflow-y-auto z-50 px-4"
                >
                  <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 shadow-2xl">
                    {/* Header */}
                    <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                      <Dialog.Title className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white uppercase flex items-center gap-2">
                        <div style={{ color: selectedColor }}>
                          <Award className="w-5 h-5" />
                        </div>
                        {certificateToEdit ? 'Edit Certification' : 'Add Certification'}
                      </Dialog.Title>
                      <Dialog.Close asChild>
                        <button className="text-neutral-400 hover:text-black dark:hover:text-white transition-colors">
                          <X className="w-5 h-5" />
                        </button>
                      </Dialog.Close>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                      {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wide">
                          {error}
                        </div>
                      )}

                      {/* Name */}
                      <div>
                        <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5 block">Certificate Name</label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. AWS Solutions Architect"
                          className="w-full h-11 px-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-medium focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                        />
                      </div>

                      {/* Organization */}
                      <div>
                        <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5 block">Issuing Organization</label>
                        <div className="relative">
                          <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                          <input
                            type="text"
                            value={issuingOrg}
                            onChange={(e) => setIssuingOrg(e.target.value)}
                            placeholder="e.g. Amazon Web Services"
                            className="w-full h-11 pl-10 pr-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-medium focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                          />
                        </div>
                      </div>

                      {/* Dates */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5 block">Issue Date</label>
                          <input
                            type="date"
                            value={issueDate}
                            onChange={(e) => setIssueDate(e.target.value)}
                            className="w-full h-11 px-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-medium focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5 block">Expiry Date</label>
                          <input
                            type="date"
                            value={expiryDate}
                            onChange={(e) => setExpiryDate(e.target.value)}
                            disabled={doesNotExpire}
                            className="w-full h-11 px-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-medium focus:outline-none focus:border-black dark:focus:border-white transition-colors disabled:opacity-50"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div
                          onClick={() => setDoesNotExpire(!doesNotExpire)}
                          className={`w-4 h-4 border flex items-center justify-center cursor-pointer transition-colors ${doesNotExpire ? 'bg-black dark:bg-white border-black dark:border-white' : 'border-neutral-300 dark:border-neutral-700'}`}
                        >
                          {doesNotExpire && <Check className="w-3 h-3 text-white dark:text-black" />}
                        </div>
                        <span onClick={() => setDoesNotExpire(!doesNotExpire)} className="text-xs font-bold uppercase tracking-wide text-neutral-600 dark:text-neutral-400 cursor-pointer">This credential does not expire</span>
                      </div>

                      {/* Color Picker */}
                      <div>
                        <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2 block">Card Color</label>
                        <div className="flex flex-wrap gap-2">
                          {CARD_COLORS.map((color) => (
                            <button
                              key={color.value}
                              type="button"
                              onClick={() => setSelectedColor(color.value)}
                              className={`w-8 h-8 rounded-none border border-neutral-200 dark:border-neutral-800 flex items-center justify-center transition-transform hover:scale-105 ${selectedColor === color.value ? 'ring-2 ring-black dark:ring-white ring-offset-2 dark:ring-offset-black' : ''}`}
                              style={{ backgroundColor: color.value }}
                              title={color.name}
                            >
                              {selectedColor === color.value && <Check className="w-4 h-4 text-white drop-shadow-md" />}
                            </button>
                          ))}
                        </div>
                      </div>


                      {/* Credential ID & URL */}
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5 block">Credential ID (Optional)</label>
                          <div className="relative">
                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <input
                              type="text"
                              value={credentialId}
                              onChange={(e) => setCredentialId(e.target.value)}
                              className="w-full h-11 pl-10 pr-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-medium focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5 block">Credential URL / File</label>

                          <div className="flex gap-2 mb-3">
                            <button
                              type="button"
                              onClick={() => setUploadMethod('file')}
                              className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider border ${uploadMethod === 'file' ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white' : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800'}`}
                            >
                              Upload File
                            </button>
                            <button
                              type="button"
                              onClick={() => setUploadMethod('url')}
                              className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider border ${uploadMethod === 'url' ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white' : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800'}`}
                            >
                              Link URL
                            </button>
                          </div>

                          {uploadMethod === 'file' ? (
                            <div
                              onClick={() => fileInputRef.current?.click()}
                              className="border-2 border-dashed border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 h-32 flex flex-col items-center justify-center cursor-pointer hover:border-black dark:hover:border-white transition-colors group relative"
                            >
                              {certificatePreview ? (
                                <>
                                  <img src={certificatePreview} alt="Preview" className="h-full object-contain p-2" />
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleRemoveFile(); }}
                                    className="absolute top-2 right-2 p-1 bg-black text-white"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <Upload className="w-6 h-6 text-neutral-400 group-hover:text-black dark:group-hover:text-white mb-2" />
                                  <span className="text-xs font-bold uppercase text-neutral-500">Click to Upload</span>
                                </>
                              )}
                              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                            </div>
                          ) : (
                            <div className="relative">
                              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                              <input
                                type="url"
                                value={credentialUrl}
                                onChange={(e) => setCredentialUrl(e.target.value)}
                                placeholder="https://..."
                                className="w-full h-11 pl-10 pr-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-medium focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex gap-3 pt-2 border-t border-neutral-100 dark:border-neutral-800 mt-6">
                        <Button
                          type="button"
                          onClick={handleClose}
                          className="flex-1 py-4 bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white rounded-none text-xs font-bold uppercase tracking-wider hover:bg-neutral-50 dark:hover:bg-neutral-900"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={loading || uploading}
                          className="flex-[2] py-4 bg-black dark:bg-white text-white dark:text-black rounded-none text-xs font-bold uppercase tracking-wider hover:opacity-90 disabled:opacity-50"
                        >
                          {uploading ? 'Uploading...' : loading ? 'Saving...' : certificateToEdit ? 'Save Changes' : 'Add Certificate'}
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
