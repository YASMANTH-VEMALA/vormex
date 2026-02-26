'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Crop,
  Sun,
  Contrast,
  Droplets,
  Check,
  Undo2,
  Download,
} from 'lucide-react';

interface ImageEditorProps {
  isOpen: boolean;
  imageUrl: string;
  onClose: () => void;
  onSave: (editedImage: Blob) => void;
}

interface ImageFilters {
  brightness: number;
  contrast: number;
  saturation: number;
}

export function ImageEditor({ isOpen, imageUrl, onClose, onSave }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [filters, setFilters] = useState<ImageFilters>({
    brightness: 100,
    contrast: 100,
    saturation: 100,
  });
  const [activeTab, setActiveTab] = useState<'adjust' | 'filters'>('adjust');
  const [isSaving, setIsSaving] = useState(false);

  // Preset filters
  const presetFilters = [
    { name: 'Original', brightness: 100, contrast: 100, saturation: 100 },
    { name: 'Vivid', brightness: 105, contrast: 115, saturation: 130 },
    { name: 'Warm', brightness: 105, contrast: 100, saturation: 110 },
    { name: 'Cool', brightness: 100, contrast: 105, saturation: 90 },
    { name: 'B&W', brightness: 100, contrast: 110, saturation: 0 },
    { name: 'Vintage', brightness: 95, contrast: 90, saturation: 80 },
    { name: 'Drama', brightness: 90, contrast: 130, saturation: 110 },
    { name: 'Fade', brightness: 110, contrast: 85, saturation: 90 },
  ];

  // Load image when URL changes
  useEffect(() => {
    if (!imageUrl) return;
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImage(img);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Draw image on canvas with transformations
  useEffect(() => {
    if (!image || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate dimensions based on rotation
    const isRotated90or270 = rotation === 90 || rotation === 270;
    const displayWidth = isRotated90or270 ? image.height : image.width;
    const displayHeight = isRotated90or270 ? image.width : image.height;

    // Set canvas size
    const maxWidth = 600;
    const maxHeight = 500;
    const scale = Math.min(maxWidth / displayWidth, maxHeight / displayHeight, 1);
    
    canvas.width = displayWidth * scale;
    canvas.height = displayHeight * scale;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply transformations
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

    // Apply filters
    ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%)`;

    // Draw image centered
    const drawWidth = image.width * scale;
    const drawHeight = image.height * scale;
    ctx.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);

    ctx.restore();
  }, [image, rotation, flipH, flipV, filters]);

  const handleRotateRight = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleRotateLeft = () => {
    setRotation((prev) => (prev - 90 + 360) % 360);
  };

  const handleFlipHorizontal = () => {
    setFlipH((prev) => !prev);
  };

  const handleFlipVertical = () => {
    setFlipV((prev) => !prev);
  };

  const handleReset = () => {
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setFilters({ brightness: 100, contrast: 100, saturation: 100 });
  };

  const handleSave = async () => {
    if (!canvasRef.current || !image) return;
    
    setIsSaving(true);
    
    try {
      // Create a full-resolution canvas for export
      const exportCanvas = document.createElement('canvas');
      const ctx = exportCanvas.getContext('2d');
      if (!ctx) return;

      const isRotated90or270 = rotation === 90 || rotation === 270;
      exportCanvas.width = isRotated90or270 ? image.height : image.width;
      exportCanvas.height = isRotated90or270 ? image.width : image.height;

      ctx.translate(exportCanvas.width / 2, exportCanvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%)`;
      ctx.drawImage(image, -image.width / 2, -image.height / 2);

      exportCanvas.toBlob((blob) => {
        if (blob) {
          onSave(blob);
        }
        setIsSaving(false);
      }, 'image/jpeg', 0.9);
    } catch (error) {
      console.error('Error saving image:', error);
      setIsSaving(false);
    }
  };

  const applyPresetFilter = (preset: typeof presetFilters[0]) => {
    setFilters({
      brightness: preset.brightness,
      contrast: preset.contrast,
      saturation: preset.saturation,
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl"
            style={{
              background: '#1a1a1a',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">Edit Image</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  <Undo2 className="w-4 h-4" />
                  Reset
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-gray-700 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-300" />
                </button>
              </div>
            </div>

            {/* Canvas Preview */}
            <div className="flex items-center justify-center p-6 bg-gray-900 min-h-[350px]">
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-[350px] rounded-lg"
                style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
              />
            </div>

            {/* Transform Tools */}
            <div className="flex items-center justify-center gap-4 p-4 border-t border-gray-700">
              <button
                onClick={handleRotateLeft}
                className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <RotateCcw className="w-5 h-5 text-gray-300" />
                <span className="text-xs text-gray-400">Rotate Left</span>
              </button>
              <button
                onClick={handleRotateRight}
                className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <RotateCw className="w-5 h-5 text-gray-300" />
                <span className="text-xs text-gray-400">Rotate Right</span>
              </button>
              <button
                onClick={handleFlipHorizontal}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-colors ${
                  flipH ? 'bg-blue-600' : 'hover:bg-gray-700'
                }`}
              >
                <FlipHorizontal className="w-5 h-5 text-gray-300" />
                <span className="text-xs text-gray-400">Flip H</span>
              </button>
              <button
                onClick={handleFlipVertical}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-colors ${
                  flipV ? 'bg-blue-600' : 'hover:bg-gray-700'
                }`}
              >
                <FlipVertical className="w-5 h-5 text-gray-300" />
                <span className="text-xs text-gray-400">Flip V</span>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-t border-gray-700">
              <button
                onClick={() => setActiveTab('adjust')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'adjust'
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Adjust
              </button>
              <button
                onClick={() => setActiveTab('filters')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'filters'
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Filters
              </button>
            </div>

            {/* Adjustment Controls */}
            {activeTab === 'adjust' && (
              <div className="p-4 space-y-4">
                {/* Brightness */}
                <div className="flex items-center gap-4">
                  <Sun className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-gray-400">Brightness</span>
                      <span className="text-xs text-gray-400">{filters.brightness}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="150"
                      value={filters.brightness}
                      onChange={(e) => setFilters({ ...filters, brightness: Number(e.target.value) })}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>
                </div>

                {/* Contrast */}
                <div className="flex items-center gap-4">
                  <Contrast className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-gray-400">Contrast</span>
                      <span className="text-xs text-gray-400">{filters.contrast}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="150"
                      value={filters.contrast}
                      onChange={(e) => setFilters({ ...filters, contrast: Number(e.target.value) })}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>
                </div>

                {/* Saturation */}
                <div className="flex items-center gap-4">
                  <Droplets className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-gray-400">Saturation</span>
                      <span className="text-xs text-gray-400">{filters.saturation}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={filters.saturation}
                      onChange={(e) => setFilters({ ...filters, saturation: Number(e.target.value) })}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Filter Presets */}
            {activeTab === 'filters' && (
              <div className="p-4">
                <div className="grid grid-cols-4 gap-2">
                  {presetFilters.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => applyPresetFilter(preset)}
                      className={`p-2 rounded-lg text-center transition-all ${
                        filters.brightness === preset.brightness &&
                        filters.contrast === preset.contrast &&
                        filters.saturation === preset.saturation
                          ? 'bg-blue-600 ring-2 ring-blue-400'
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      <div 
                        className="w-full aspect-square rounded-lg mb-1 bg-gray-600"
                        style={{
                          filter: `brightness(${preset.brightness}%) contrast(${preset.contrast}%) saturate(${preset.saturation}%)`,
                          backgroundImage: image ? `url(${imageUrl})` : undefined,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }}
                      />
                      <span className="text-xs text-gray-300">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-end gap-3 p-4 border-t border-gray-700">
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isSaving ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Apply Changes
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
