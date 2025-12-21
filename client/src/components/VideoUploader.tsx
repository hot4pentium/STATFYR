import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, Video, X } from "lucide-react";
import { toast } from "sonner";
import { requestVideoUpload, completeVideoUpload } from "@/lib/api";

interface VideoUploaderProps {
  teamId: string;
  userId: string;
  onUploadComplete?: () => void;
  compact?: boolean;
}

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export function VideoUploader({ teamId, userId, onUploadComplete, compact = false }: VideoUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("video/")) {
      toast.error("Please select a video file");
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Video must be less than 100MB");
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    try {
      // Request upload URL from backend
      const { uploadURL, videoId } = await requestVideoUpload(
        teamId,
        userId,
        file.name,
        file.size,
        file.type
      );

      setUploadProgress(30);

      // Upload directly to storage
      const uploadRes = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadRes.ok) {
        throw new Error("Upload failed");
      }

      setUploadProgress(80);

      // Notify backend that upload is complete to start transcoding
      await completeVideoUpload(videoId);

      setUploadProgress(100);
      toast.success("Video uploaded! Transcoding in progress...");
      onUploadComplete?.();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload video");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  if (compact) {
    return (
      <div className="relative">
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
          data-testid="input-video-file"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="gap-2"
          data-testid="button-upload-video"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {uploadProgress}%
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Upload Video
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="border border-dashed border-white/20 rounded-lg p-4 text-center">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
        data-testid="input-video-file"
      />
      
      {isUploading ? (
        <div className="space-y-2">
          <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Uploading... {uploadProgress}%</p>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all" 
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      ) : (
        <div 
          className="space-y-2 cursor-pointer hover:opacity-80 transition"
          onClick={() => fileInputRef.current?.click()}
        >
          <Video className="h-8 w-8 mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Click to upload a highlight video
          </p>
          <p className="text-xs text-muted-foreground/60">
            Max 100MB • Will be transcoded automatically
          </p>
        </div>
      )}
    </div>
  );
}
