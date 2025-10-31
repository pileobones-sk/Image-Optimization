export enum Tab {
  BatchProcessor = 'Batch Processor',
  ImageGenerator = 'Image Generator',
  VideoGenerator = 'Video Generator',
  GroundedSearch = 'Grounded Search',
}

export interface OptimizedImage {
  format: 'webp' | 'avif' | 'png';
  blob: Blob;
  url: string;
}

export enum ProcessStatus {
  Pending,
  Analyzing,
  Optimizing,
  Editing,
  Done,
  Error,
}

export interface ImageFile {
  id: string;
  originalFile: File;
  originalUrl: string;
  newName: string;
  altText: string;
  status: ProcessStatus;
  errorMessage?: string;
  optimizedImages: OptimizedImage[];
  previewUrl: string;
}

export type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
export type VideoAspectRatio = "16:9" | "9:16";
