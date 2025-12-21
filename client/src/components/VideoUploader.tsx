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
  const [uploadStatus, setUploadStatus] = useState("");
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
    setUploadProgress(5);
    setUploadStatus("Preparing upload...");

    try {
      // Request upload URL from backend
      const { uploadURL, videoId } = await requestVideoUpload(
        teamId,
        userId,
        file.name,
        file.size,
        file.type
      );

      setUploadProgress(10);
      setUploadStatus("Uploading video...");

      // Upload directly to storage with progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadURL);
        xhr.setRequestHeader("Content-Type", file.type);
        
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 70) + 10;
            setUploadProgress(Math.min(percentComplete, 80));
          }
        };
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error("Upload failed"));
          }
        };
        
        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.send(file);
      });

      setUploadProgress(85);
      setUploadStatus("Starting video processing...");

      // Notify backend that upload is complete to start transcoding
      await completeVideoUpload(videoId);

      setUploadProgress(100);
      setUploadStatus("Complete!");
      
      toast.success("Video uploaded successfully!", {
        description: "Your video is now being converted. This takes about a minute.",
        duration: 5000,
      });
      onUploadComplete?.();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload video", {
        description: "Please check your connection and try again.",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadStatus("");
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
              <span className="max-w-[100px] truncate">{uploadStatus || `${uploadProgress}%`}</span>
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
        <div className="space-y-3">
          <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
          <p className="text-sm font-medium">{uploadStatus}</p>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300" 
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">{uploadProgress}% complete</p>
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
