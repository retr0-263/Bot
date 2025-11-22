// Image upload service with compression and optimization
export interface ImageUploadOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1
  format?: 'webp' | 'jpeg' | 'png';
}

export interface CompressedImage {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  format: string;
  blob: Blob;
  dataUrl?: string;
}

export interface ImageMetadata {
  width: number;
  height: number;
  size: number;
  format: string;
  dataUrl: string;
}

class ImageUploadService {
  private readonly SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  private readonly ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly ALLOWED_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];

  /**
   * Validate image file
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    if (!this.ALLOWED_FORMATS.includes(file.type)) {
      return {
        valid: false,
        error: 'Only JPEG, PNG, and WebP formats are supported',
      };
    }

    if (file.size > this.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File size must be less than ${this.MAX_FILE_SIZE / 1024 / 1024}MB`,
      };
    }

    return { valid: true };
  }

  /**
   * Get image metadata (dimensions, size, etc)
   */
  async getImageMetadata(file: File): Promise<ImageMetadata | null> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          resolve({
            width: img.width,
            height: img.height,
            size: file.size,
            format: file.type,
            dataUrl: e.target?.result as string,
          });
        };
        img.onerror = () => resolve(null);
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * Compress image with canvas API
   */
  async compressImage(
    file: File,
    options: ImageUploadOptions = {}
  ): Promise<CompressedImage> {
    const {
      maxWidth = 1200,
      maxHeight = 1200,
      quality = 0.8,
      format = 'webp',
    } = options;

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();

        img.onload = () => {
          // Calculate dimensions
          let { width, height } = img;
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width *= ratio;
            height *= ratio;
          }

          // Create canvas and compress
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Convert to blob
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Could not compress image'));
                return;
              }

              resolve({
                originalSize: file.size,
                compressedSize: blob.size,
                compressionRatio: (
                  ((file.size - blob.size) / file.size) * 100
                ).toFixed(2) as any,
                format,
                blob,
                dataUrl: canvas.toDataURL(`image/${format}`),
              });
            },
            `image/${format}`,
            quality
          );
        };

        img.onerror = () => reject(new Error('Could not load image'));
        img.src = e.target?.result as string;
      };

      reader.onerror = () => reject(new Error('Could not read file'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Generate thumbnail
   */
  async generateThumbnail(file: File, size: number = 200): Promise<string> {
    const compressed = await this.compressImage(file, {
      maxWidth: size,
      maxHeight: size,
      quality: 0.7,
    });
    return compressed.dataUrl || '';
  }

  /**
   * Upload image to Supabase Storage
   */
  async uploadImage(
    file: File,
    bucket: string = 'products',
    path: string = ''
  ): Promise<{ url: string; path: string }> {
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${file.name}`;
    const filePath = path ? `${path}/${fileName}` : fileName;

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', bucket);
      formData.append('path', filePath);

      const response = await fetch(`${this.SUPABASE_URL}/functions/v1/bot-media`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.ANON_KEY}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        url: data.url,
        path: filePath,
      };
    } catch (error) {
      console.error('Image upload error:', error);
      throw error;
    }
  }

  /**
   * Upload multiple images
   */
  async uploadMultipleImages(
    files: File[],
    bucket: string = 'products',
    path: string = ''
  ): Promise<Array<{ url: string; path: string; file: File }>> {
    const uploadPromises = files.map((file) =>
      this.uploadImage(file, bucket, path).then((result) => ({
        ...result,
        file,
      }))
    );

    return Promise.all(uploadPromises);
  }

  /**
   * Delete image from Supabase Storage
   */
  async deleteImage(path: string, bucket: string = 'products'): Promise<void> {
    try {
      const response = await fetch(
        `${this.SUPABASE_URL}/functions/v1/bot-media?bucket=${bucket}&path=${encodeURIComponent(path)}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.ANON_KEY}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Image delete error:', error);
      throw error;
    }
  }

  /**
   * Get compression preview (without uploading)
   */
  async getCompressionPreview(
    file: File,
    options?: ImageUploadOptions
  ): Promise<CompressedImage> {
    return this.compressImage(file, options);
  }

  /**
   * Check if image meets minimum dimensions
   */
  async validateDimensions(
    file: File,
    minWidth: number = 400,
    minHeight: number = 400
  ): Promise<{ valid: boolean; width: number; height: number; error?: string }> {
    const metadata = await this.getImageMetadata(file);
    if (!metadata) {
      return {
        valid: false,
        width: 0,
        height: 0,
        error: 'Could not read image dimensions',
      };
    }

    if (metadata.width < minWidth || metadata.height < minHeight) {
      return {
        valid: false,
        width: metadata.width,
        height: metadata.height,
        error: `Image must be at least ${minWidth}x${minHeight}px`,
      };
    }

    return {
      valid: true,
      width: metadata.width,
      height: metadata.height,
    };
  }

  /**
   * Batch validate images for 4-image minimum
   */
  async validateImageBatch(
    files: File[],
    minImages: number = 4,
    minDimensions: { width: number; height: number } = { width: 400, height: 400 }
  ): Promise<{
    valid: boolean;
    validImages: File[];
    invalidImages: Array<{ file: File; error: string }>;
    error?: string;
  }> {
    if (files.length < minImages) {
      return {
        valid: false,
        validImages: [],
        invalidImages: [],
        error: `Please upload at least ${minImages} images`,
      };
    }

    const validImages: File[] = [];
    const invalidImages: Array<{ file: File; error: string }> = [];

    for (const file of files) {
      const fileValidation = this.validateFile(file);
      if (!fileValidation.valid) {
        invalidImages.push({ file, error: fileValidation.error! });
        continue;
      }

      const dimensionValidation = await this.validateDimensions(
        file,
        minDimensions.width,
        minDimensions.height
      );

      if (!dimensionValidation.valid) {
        invalidImages.push({
          file,
          error: dimensionValidation.error!,
        });
      } else {
        validImages.push(file);
      }
    }

    return {
      valid: validImages.length >= minImages,
      validImages,
      invalidImages,
      error:
        validImages.length < minImages
          ? `Need ${minImages - validImages.length} more valid images`
          : undefined,
    };
  }
}

export const imageUploadService = new ImageUploadService();
