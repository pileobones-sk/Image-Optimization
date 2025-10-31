import React, { useState, useCallback, useRef } from 'react';
import { ImageFile, ProcessStatus, OptimizedImage } from '../types';
import { analyzeImage } from '../services/geminiService';
import { fileToBase64, dataUrlToBlob } from '../utils/fileUtils';
import ImageCard from './ImageCard';
import Spinner from './common/Spinner';
import Button from './common/Button';
import Icon from './common/Icon';

declare const JSZip: any;

const ImageBatchProcessor: React.FC = () => {
  const [imageFiles, setImageFiles] = useState<ImageFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [useProMode, setUseProMode] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newImageFiles: ImageFile[] = Array.from(files)
        // FIX: Add explicit type `File` to the `file` parameter to fix type inference issues.
        .filter((file: File) => file.type.startsWith('image/'))
        .map((file: File) => {
          const id = `${file.name}-${file.lastModified}`;
          const originalUrl = URL.createObjectURL(file);
          return {
            id,
            originalFile: file,
            originalUrl,
            newName: file.name.split('.').slice(0, -1).join('.'),
            altText: '',
            status: ProcessStatus.Pending,
            optimizedImages: [],
            previewUrl: originalUrl
          };
        });
      setImageFiles(prev => [...prev, ...newImageFiles]);
      processImages(newImageFiles);
    }
  };

  const processImages = useCallback(async (filesToProcess: ImageFile[]) => {
    setIsProcessing(true);
    for (const imageFile of filesToProcess) {
      // 1. Analyze with Gemini
      try {
        setImageFiles(prev => prev.map(f => f.id === imageFile.id ? { ...f, status: ProcessStatus.Analyzing } : f));
        const base64 = await fileToBase64(imageFile.originalFile);
        const { description, keywords } = await analyzeImage(base64, imageFile.originalFile.type, useProMode);
        
        const fileExtension = imageFile.originalFile.name.split('.').pop();
        setImageFiles(prev => prev.map(f => f.id === imageFile.id ? { ...f, altText: description, newName: `${keywords}.${fileExtension}` } : f));
      } catch (e) {
        console.error("Analysis failed for", imageFile.originalFile.name, e);
        setImageFiles(prev => prev.map(f => f.id === imageFile.id ? { ...f, status: ProcessStatus.Error, errorMessage: 'AI analysis failed.' } : f));
        continue;
      }

      // 2. Optimize images
      try {
        setImageFiles(prev => prev.map(f => f.id === imageFile.id ? { ...f, status: ProcessStatus.Optimizing } : f));
        const optimized = await optimizeImage(imageFile.originalUrl);
        setImageFiles(prev => prev.map(f => f.id === imageFile.id ? { ...f, status: ProcessStatus.Done, optimizedImages: optimized } : f));
      } catch (e) {
        console.error("Optimization failed for", imageFile.originalFile.name, e);
        setImageFiles(prev => prev.map(f => f.id === imageFile.id ? { ...f, status: ProcessStatus.Error, errorMessage: 'Image optimization failed.' } : f));
      }
    }
    setIsProcessing(false);
  }, [useProMode]);

  const optimizeImage = (imageUrl: string): Promise<OptimizedImage[]> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('Could not get canvas context');
        ctx.drawImage(img, 0, 0);

        const formats: Array<'webp' | 'avif' | 'png'> = ['webp', 'avif', 'png'];
        const promises = formats.map(format => 
          new Promise<OptimizedImage>(async (res) => {
            const dataUrl = canvas.toDataURL(`image/${format}`, 0.9);
            const blob = await dataUrlToBlob(dataUrl);
            res({ format, blob, url: URL.createObjectURL(blob) });
          })
        );
        resolve(Promise.all(promises));
      };
      img.onerror = reject;
      img.src = imageUrl;
    });
  };

  const handleUpdate = useCallback((updatedFile: Partial<ImageFile> & { id: string }) => {
    setImageFiles(prev => prev.map(f => f.id === updatedFile.id ? { ...f, ...updatedFile } : f));
  }, []);

  const handleDownloadZip = useCallback(async () => {
    setIsDownloading(true);
    const zip = new JSZip();
    const manifest = [];

    for (const imageFile of imageFiles) {
        if(imageFile.status === ProcessStatus.Done) {
            const previewBlob = await dataUrlToBlob(imageFile.previewUrl);
            const fileExtension = imageFile.newName.split('.').pop() || 'jpg';
            const baseName = imageFile.newName.replace(`.${fileExtension}`, '');
            
            zip.file(`${baseName}.${fileExtension}`, previewBlob);
            
            manifest.push({
                filename: `${baseName}.${fileExtension}`,
                alt_text: imageFile.altText,
                // In a real app, this would be the cloud URL
                generated_link: `(local file) ${baseName}.${fileExtension}`,
            });

            for(const opt of imageFile.optimizedImages) {
                 zip.file(`${baseName}.${opt.format}`, opt.blob);
            }
        }
    }

    const csvContent = "filename,alt_text,generated_link\n" + manifest.map(row => `"${row.filename}","${row.alt_text.replace(/"/g, '""')}","${row.generated_link}"`).join("\n");
    zip.file('manifest.csv', csvContent);

    zip.generateAsync({ type: 'blob' }).then(content => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = 'processed_images.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsDownloading(false);
    });
  }, [imageFiles]);

  const triggerFileInput = () => fileInputRef.current?.click();

  return (
    <div className="space-y-6">
      <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-xl text-center">
        <h2 className="text-xl font-bold mb-2">Image Batch Processor</h2>
        <p className="text-gray-400 mb-6">Upload a folder of images to analyze, rename, and optimize them with AI.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                // @ts-ignore: webkitdirectory is a non-standard attribute
                webkitdirectory="true" 
                directory="true"
                onChange={handleFileChange}
                accept="image/*"
            />
            <Button onClick={triggerFileInput} disabled={isProcessing} icon={<Icon icon="folder" />}>
                Upload Folder
            </Button>
            <div className="flex items-center space-x-2">
                <label htmlFor="pro-mode-toggle" className="text-sm font-medium text-gray-300">
                    Enable Deep Analysis (Pro Mode)
                </label>
                <input
                    id="pro-mode-toggle"
                    type="checkbox"
                    checked={useProMode}
                    onChange={(e) => setUseProMode(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-gray-700"
                />
            </div>
        </div>
      </div>

      {isProcessing && imageFiles.every(f => f.status !== ProcessStatus.Done) && <Spinner text="Initial processing of images..."/>}

      {imageFiles.length > 0 && (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {imageFiles.map(file => (
                <ImageCard key={file.id} imageFile={file} onUpdate={handleUpdate} />
            ))}
            </div>
            <div className="flex justify-center mt-8">
                <Button onClick={handleDownloadZip} isLoading={isDownloading} icon={<Icon icon="download" />} disabled={imageFiles.every(f => f.status !== ProcessStatus.Done)}>
                    Download All as ZIP
                </Button>
            </div>
        </>
      )}
    </div>
  );
};

export default ImageBatchProcessor;