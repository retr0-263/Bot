import { useCallback, useState } from 'react';
import { imageUploadService, ImageUploadOptions, CompressedImage } from '../services/imageUploadService';

export interface ImageUploadState {
  files: File[];
  uploading: boolean;
  error: string | null;
  progress: number;
}

/**
 * Hook for image upload with compression preview
 */
export function useImageUpload() {
  const [state, setState] = useState<ImageUploadState>({
    files: [],
    uploading: false,
    error: null,
    progress: 0,
  });

  const addFiles = useCallback((newFiles: File[]) => {
    setState((prev) => ({
      ...prev,
      files: [...prev.files, ...newFiles],
      error: null,
    }));
  }, []);

  const removeFile = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
    }));
  }, []);

  const clearFiles = useCallback(() => {
    setState((prev) => ({
      ...prev,
      files: [],
    }));
  }, []);

  const validateFiles = useCallback(
    async (minImages: number = 4) => {
      const result = await imageUploadService.validateImageBatch(state.files, minImages);
      if (!result.valid) {
        setState((prev) => ({
          ...prev,
          error: result.error || 'Invalid images',
        }));
        return false;
      }
      return true;
    },
    [state.files]
  );

  const uploadFiles = useCallback(
    async (bucket: string = 'products', path: string = '') => {
      try {
        setState((prev) => ({
          ...prev,
          uploading: true,
          error: null,
        }));

        const results = await imageUploadService.uploadMultipleImages(
          state.files,
          bucket,
          path
        );

        setState((prev) => ({
          ...prev,
          uploading: false,
          progress: 100,
        }));

        return results;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        setState((prev) => ({
          ...prev,
          uploading: false,
          error: errorMessage,
        }));
        throw error;
      }
    },
    [state.files]
  );

  const getCompressionPreview = useCallback(
    async (fileIndex: number, options?: ImageUploadOptions) => {
      const file = state.files[fileIndex];
      if (!file) return null;

      try {
        const compressed = await imageUploadService.getCompressionPreview(file, options);
        return compressed;
      } catch (error) {
        console.error('Compression preview failed:', error);
        return null;
      }
    },
    [state.files]
  );

  return {
    ...state,
    addFiles,
    removeFile,
    clearFiles,
    validateFiles,
    uploadFiles,
    getCompressionPreview,
  };
}

/**
 * Hook for image metadata retrieval
 */
export function useImageMetadata(file: File | null) {
  const [metadata, setMetadata] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMetadata = useCallback(async (imageFile: File) => {
    try {
      setLoading(true);
      const data = await imageUploadService.getImageMetadata(imageFile);
      setMetadata(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metadata');
    } finally {
      setLoading(false);
    }
  }, []);

  return { metadata, loading, error, loadMetadata };
}

/**
 * Hook for image validation (4-image minimum)
 */
export function useImageValidation() {
  const [validationResult, setValidationResult] = useState<any>(null);
  const [validating, setValidating] = useState(false);

  const validate = useCallback(
    async (files: File[], minImages: number = 4) => {
      try {
        setValidating(true);
        const result = await imageUploadService.validateImageBatch(files, minImages);
        setValidationResult(result);
        return result;
      } catch (error) {
        console.error('Validation error:', error);
        return {
          valid: false,
          validImages: [],
          invalidImages: [],
          error: error instanceof Error ? error.message : 'Validation failed',
        };
      } finally {
        setValidating(false);
      }
    },
    []
  );

  return { validationResult, validating, validate };
}
