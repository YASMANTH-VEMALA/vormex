'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Award,
  Plus,
  ExternalLink,
  Calendar,
  CheckCircle,
  AlertCircle,
  Edit2,
  X,
  Building,
  Hash,
  Eye,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { Certificate } from '@/types/profile';

interface CertificatesGridProps {
  certificates: Certificate[];
  isOwner: boolean;
  onAddCertificate?: () => void;
  onEditCertificate?: (certificate: Certificate) => void;
}

export function CertificatesGrid({
  certificates,
  isOwner,
  onAddCertificate,
  onEditCertificate,
}: CertificatesGridProps) {
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);

  if (certificates.length === 0 && !isOwner) {
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
  };

  const formatFullDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const isExpired = (cert: Certificate) => {
    if (cert.doesNotExpire || !cert.expiryDate) return false;
    return new Date(cert.expiryDate) < new Date();
  };

  const isExpiringSoon = (cert: Certificate) => {
    if (cert.doesNotExpire || !cert.expiryDate) return false;
    const expiry = new Date(cert.expiryDate);
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    return expiry > new Date() && expiry <= threeMonthsFromNow;
  };

  // Check if URL is an image
  const isImageUrl = (url: string) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
    const lowercaseUrl = url.toLowerCase();
    return imageExtensions.some(ext => lowercaseUrl.includes(ext)) ||
      lowercaseUrl.includes('/certificates/') ||
      lowercaseUrl.includes('storage.bunnycdn.com');
  };

  return (
    <Card className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-none overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-white uppercase flex items-center gap-2">
          <Award className="w-4 h-4" />
          Licenses & Certifications
          <span className="text-xs font-medium text-neutral-500 ml-2">
            ({certificates.length})
          </span>
        </h2>

        {isOwner && onAddCertificate && (
          <button
            onClick={onAddCertificate}
            className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white hover:underline flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            Add New
          </button>
        )}
      </div>

      <div className="p-6">
        {certificates.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
            <div className="w-12 h-12 mx-auto mb-4 bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 flex items-center justify-center">
              <Award className="w-5 h-5 text-neutral-400" />
            </div>
            <p className="text-sm text-neutral-500 font-medium mb-4">No certifications added yet.</p>
            {isOwner && onAddCertificate && (
              <Button
                onClick={onAddCertificate}
                className="bg-black dark:bg-white text-white dark:text-black rounded-none text-xs font-bold uppercase tracking-wider px-6 py-3"
              >
                Add Your First Certification
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {certificates.map((cert, index) => (
              <motion.div
                key={cert.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group relative bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 p-5 hover:border-black dark:hover:border-white transition-colors"
              >
                <div className="flex gap-4">
                  {/* Icon */}
                  <div
                    className="w-12 h-12 shrink-0 flex items-center justify-center border border-neutral-200 dark:border-neutral-800"
                    style={{ backgroundColor: cert.color || '#525252' }}
                  >
                    <Award className="w-6 h-6 text-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wide truncate mb-1">
                      {cert.name}
                    </h4>
                    <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">
                      {cert.issuingOrg}
                    </p>

                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(cert.issueDate)}
                      </div>
                      {isExpired(cert) ? (
                        <span className="text-red-500">Expired</span>
                      ) : cert.doesNotExpire ? (
                        <span className="text-emerald-500">No Expiration</span>
                      ) : cert.expiryDate && (
                        <span>Exp: {formatDate(cert.expiryDate)}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="absolute top-4 right-4 flex gap-2">
                  {cert.credentialUrl && (
                    <button
                      onClick={() => setSelectedCertificate(cert)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {isOwner && onEditCertificate && (
                    <button
                      onClick={() => onEditCertificate(cert)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Certificate View Modal */}
      <Dialog.Root open={!!selectedCertificate} onOpenChange={(open) => !open && setSelectedCertificate(null)}>
        <AnimatePresence>
          {selectedCertificate && (
            <Dialog.Portal forceMount>
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
                  className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-black rounded-none shadow-2xl z-50 border border-neutral-200 dark:border-neutral-800"
                >
                  {/* Header */}
                  <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                    <Dialog.Title className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white uppercase flex items-center gap-2">
                      <div style={{ color: selectedCertificate.color || '#525252' }}>
                        <Award className="w-5 h-5" />
                      </div>
                      Certificate Details
                    </Dialog.Title>
                    <Dialog.Close asChild>
                      <button className="text-neutral-400 hover:text-black dark:hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                      </button>
                    </Dialog.Close>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {/* Certificate Image */}
                    {selectedCertificate.credentialUrl && isImageUrl(selectedCertificate.credentialUrl) ? (
                      <div className="mb-6 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2">
                        <img
                          src={selectedCertificate.credentialUrl}
                          alt={`${selectedCertificate.name} certificate`}
                          className="w-full h-auto object-contain max-h-[50vh]"
                        />
                      </div>
                    ) : selectedCertificate.credentialUrl && (
                      <div className="mb-6 p-4 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
                        <a
                          href={selectedCertificate.credentialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-black dark:text-white hover:underline"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Open Certificate Link
                        </a>
                      </div>
                    )}

                    {/* Certificate Details */}
                    <div>
                      <h3 className="text-2xl font-bold text-neutral-900 dark:text-white uppercase tracking-tight mb-2">
                        {selectedCertificate.name}
                      </h3>

                      <div className="flex items-center gap-2 text-neutral-500 mb-6">
                        <Building className="w-4 h-4" />
                        <span className="text-sm font-bold uppercase tracking-wider">{selectedCertificate.issuingOrg}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="p-4 border border-neutral-200 dark:border-neutral-800">
                          <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Issue Date</div>
                          <div className="text-sm font-bold text-neutral-900 dark:text-white uppercase">
                            {formatFullDate(selectedCertificate.issueDate)}
                          </div>
                        </div>
                        <div className="p-4 border border-neutral-200 dark:border-neutral-800">
                          <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Expiry Date</div>
                          <div className={`text-sm font-bold uppercase ${isExpired(selectedCertificate) ? 'text-red-500' : 'text-neutral-900 dark:text-white'
                            }`}>
                            {selectedCertificate.doesNotExpire ? 'No Expiration' : selectedCertificate.expiryDate ? formatFullDate(selectedCertificate.expiryDate) : 'N/A'}
                          </div>
                        </div>
                      </div>

                      {selectedCertificate.credentialId && (
                        <div className="p-4 border border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Credential ID</span>
                          <span className="font-mono text-xs font-bold">{selectedCertificate.credentialId}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </Dialog.Content>
            </Dialog.Portal>
          )}
        </AnimatePresence>
      </Dialog.Root>
    </Card>
  );
}
