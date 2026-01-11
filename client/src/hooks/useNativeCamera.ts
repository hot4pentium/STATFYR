import { useState, useCallback } from "react";
import { takePhoto, pickFromGallery, isNative } from "@/lib/capacitor";
import { toast } from "sonner";

interface UseNativeCameraOptions {
  onPhotoTaken?: (dataUrl: string) => void;
  maxSizeMB?: number;
}

export function useNativeCamera(options: UseNativeCameraOptions = {}) {
  const { onPhotoTaken, maxSizeMB = 5 } = options;
  const [isCapturing, setIsCapturing] = useState(false);

  const handleNativePhoto = useCallback(async () => {
    if (!isNative) {
      return null;
    }

    setIsCapturing(true);
    try {
      const dataUrl = await takePhoto();
      if (dataUrl) {
        onPhotoTaken?.(dataUrl);
        return dataUrl;
      }
      return null;
    } catch (error) {
      console.error("Camera error:", error);
      toast.error("Failed to capture photo");
      return null;
    } finally {
      setIsCapturing(false);
    }
  }, [onPhotoTaken]);

  const handleGalleryPick = useCallback(async () => {
    if (!isNative) {
      return null;
    }

    setIsCapturing(true);
    try {
      const dataUrl = await pickFromGallery();
      if (dataUrl) {
        onPhotoTaken?.(dataUrl);
        return dataUrl;
      }
      return null;
    } catch (error) {
      console.error("Gallery picker error:", error);
      toast.error("Failed to pick image");
      return null;
    } finally {
      setIsCapturing(false);
    }
  }, [onPhotoTaken]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return null;

    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`Image must be less than ${maxSizeMB}MB`);
      return null;
    }

    setIsCapturing(true);
    const reader = new FileReader();
    
    return new Promise<string | null>((resolve) => {
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setIsCapturing(false);
        onPhotoTaken?.(dataUrl);
        resolve(dataUrl);
      };
      reader.onerror = () => {
        setIsCapturing(false);
        toast.error("Failed to load image");
        resolve(null);
      };
      reader.readAsDataURL(file);
    });
  }, [onPhotoTaken, maxSizeMB]);

  return {
    isNative,
    isCapturing,
    handleNativePhoto,
    handleGalleryPick,
    handleFileInput,
  };
}
