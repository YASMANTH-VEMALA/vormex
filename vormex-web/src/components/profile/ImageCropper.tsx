'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, RotateCw, Check, RefreshCw } from 'lucide-react';

interface ImageCropperProps {
  imageSrc: string;
  aspectRatio: number; // width/height ratio (1 for avatar, 4 for banner)
  onCropComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
  cropShape?: 'circle' | 'rectangle';
  minWidth?: number;
  minHeight?: number;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function ImageCropper({
  imageSrc,
  aspectRatio,
  onCropComplete,
  onCancel,
  cropShape = 'rectangle',
  minWidth = 100,
  minHeight = 100
}: ImageCropperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.1, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.1, 0.5));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    // Constrain movement within reasonable bounds
    const maxOffset = 200 * zoom;
    setPosition({
      x: Math.max(-maxOffset, Math.min(maxOffset, newX)),
      y: Math.max(-maxOffset, Math.min(maxOffset, newY))
    });
  }, [isDragging, dragStart, zoom]);

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({
        x: touch.clientX - position.x,
        y: touch.clientY - position.y
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    const newX = touch.clientX - dragStart.x;
    const newY = touch.clientY - dragStart.y;
    
    const maxOffset = 200 * zoom;
    setPosition({
      x: Math.max(-maxOffset, Math.min(maxOffset, newX)),
      y: Math.max(-maxOffset, Math.min(maxOffset, newY))
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleCrop = async () => {
    if (!imageRef.current || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      const image = imageRef.current;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      // Calculate output dimensions based on aspect ratio
      const outputWidth = aspectRatio >= 1 ? 800 : 400;
      const outputHeight = outputWidth / aspectRatio;
      
      canvas.width = outputWidth;
      canvas.height = outputHeight;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Apply circular mask for avatar
      if (cropShape === 'circle') {
        ctx.beginPath();
        ctx.arc(outputWidth / 2, outputHeight / 2, outputWidth / 2, 0, Math.PI * 2);
        ctx.clip();
      }

      // Calculate the crop area based on zoom and position
      const containerSize = Math.min(containerRef.current?.clientWidth || 400, containerRef.current?.clientHeight || 400);
      const cropSize = aspectRatio >= 1 
        ? { width: containerSize * 0.8, height: (containerSize * 0.8) / aspectRatio }
        : { width: (containerSize * 0.8) * aspectRatio, height: containerSize * 0.8 };

      // Save context state
      ctx.save();
      
      // Move to center of canvas
      ctx.translate(outputWidth / 2, outputHeight / 2);
      
      // Apply rotation
      ctx.rotate((rotation * Math.PI) / 180);
      
      // Calculate source dimensions
      const naturalWidth = image.naturalWidth;
      const naturalHeight = image.naturalHeight;
      
      // Calculate the visible portion of the image
      const scaleX = naturalWidth / (image.width * zoom);
      const scaleY = naturalHeight / (image.height * zoom);
      
      // Calculate source crop area
      const srcX = (naturalWidth / 2) - (position.x * scaleX);
      const srcY = (naturalHeight / 2) - (position.y * scaleY);
      
      // Draw the image
      ctx.drawImage(
        image,
        -outputWidth / 2,
        -outputHeight / 2,
        outputWidth,
        outputHeight
      );
      
      // Restore context
      ctx.restore();
      
      // Actually crop properly by redrawing with transforms
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (cropShape === 'circle') {
        ctx.beginPath();
        ctx.arc(outputWidth / 2, outputHeight / 2, outputWidth / 2, 0, Math.PI * 2);
        ctx.clip();
      }
      
      // Center the context
      ctx.translate(outputWidth / 2, outputHeight / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(zoom, zoom);
      ctx.translate(position.x / zoom, position.y / zoom);
      
      // Draw image centered
      const scale = Math.max(outputWidth / naturalWidth, outputHeight / naturalHeight);
      const scaledWidth = naturalWidth * scale;
      const scaledHeight = naturalHeight * scale;
      
      ctx.drawImage(
        image,
        -scaledWidth / 2,
        -scaledHeight / 2,
        scaledWidth,
        scaledHeight
      );

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            onCropComplete(blob);
          } else {
            throw new Error('Failed to create image blob');
          }
        },
        'image/jpeg',
        0.95
      );
    } catch (error) {
      console.error('Crop error:', error);
      setIsProcessing(false);
    }
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  // Calculate crop area dimensions
  const getCropAreaStyle = (): React.CSSProperties => {
    const size = 280;
    const width = aspectRatio >= 1 ? size : size * aspectRatio;
    const height = aspectRatio >= 1 ? size / aspectRatio : size;
    
    return {
      width: `${width}px`,
      height: `${height}px`,
      borderRadius: cropShape === 'circle' ? '50%' : '8px',
    };
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90"
    >
      <div className="relative w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">
            Crop Image
          </h3>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Crop Area */}
        <div
          ref={containerRef}
          className="relative w-full aspect-square bg-gray-900 rounded-xl overflow-hidden cursor-move select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Image */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            }}
          >
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Crop preview"
              className="max-w-none"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
              }}
              onLoad={handleImageLoad}
              draggable={false}
            />
          </div>

          {/* Overlay with crop window */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/60" />
            
            {/* Transparent crop area */}
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-white shadow-lg"
              style={{
                ...getCropAreaStyle(),
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
              }}
            >
              {/* Corner indicators */}
              <div className="absolute -left-1 -top-1 w-4 h-4 border-l-2 border-t-2 border-white" />
              <div className="absolute -right-1 -top-1 w-4 h-4 border-r-2 border-t-2 border-white" />
              <div className="absolute -left-1 -bottom-1 w-4 h-4 border-l-2 border-b-2 border-white" />
              <div className="absolute -right-1 -bottom-1 w-4 h-4 border-r-2 border-b-2 border-white" />
            </div>
          </div>

          {/* Loading indicator */}
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mt-4 px-2">
          {/* Zoom controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-32 h-1 bg-gray-700 rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-4
                  [&::-webkit-slider-thumb]:h-4
                  [&::-webkit-slider-thumb]:bg-white
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-webkit-slider-thumb]:shadow-md"
              />
              <span className="text-sm text-gray-400 w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
            </div>
            
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 3}
              className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
          </div>

          {/* Rotate & Reset */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleRotate}
              className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
              title="Rotate 90°"
            >
              <RotateCw className="w-5 h-5" />
            </button>
            <button
              onClick={handleReset}
              className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
              title="Reset"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCrop}
            disabled={isProcessing || !imageLoaded}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Apply
              </>
            )}
          </button>
        </div>

        {/* Instructions */}
        <p className="text-center text-sm text-gray-500 mt-4">
          Drag to reposition • Scroll or use slider to zoom • Click rotate to adjust orientation
        </p>
      </div>
    </motion.div>
  );
}
