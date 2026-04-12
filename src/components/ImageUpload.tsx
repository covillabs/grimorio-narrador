import { useState, useRef } from "react";
import { Upload, X } from "lucide-react";
import { uploadImage } from "@/lib/supabase-helpers";

interface ImageUploadProps {
  currentUrl?: string | null;
  folder: string;
  onUpload: (url: string) => void;
  onRemove?: () => void;
  className?: string;
}

export function ImageUpload({ currentUrl, folder, onUpload, onRemove, className = "" }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const url = await uploadImage(file, folder);
    if (url) onUpload(url);
    setUploading(false);
  };

  return (
    <div className={`relative group ${className}`}>
      {currentUrl ? (
        <div className="relative">
          <img src={currentUrl} alt="" className="w-full h-full object-cover rounded-md" />
          <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-md">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="p-2 bg-secondary rounded-full hover:bg-primary transition-colors"
            >
              <Upload className="w-4 h-4" />
            </button>
            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="p-2 bg-secondary rounded-full hover:bg-destructive transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full h-full border-2 border-dashed border-border rounded-md flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors min-h-[120px]"
        >
          <Upload className="w-6 h-6" />
          <span className="text-xs">{uploading ? "Enviando..." : "Upload"}</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />
    </div>
  );
}
