
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { toast } from "sonner";

interface ImageUploaderProps {
  onImageUploaded: (imageData: string) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUploaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (!file.type.match('image.*')) {
      toast.error('Please upload an image file');
      return;
    }

    setIsLoading(true);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        onImageUploaded(e.target.result as string);
      }
      setIsLoading(false);
    };
    
    reader.onerror = () => {
      toast.error('Failed to read file');
      setIsLoading(false);
    };
    
    reader.readAsDataURL(file);
  };

  return (
    <div
      className={`w-full rounded-xl border-2 border-dashed p-8 text-center transition-all 
        ${isDragging ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="h-14 w-14 rounded-full bg-secondary/50 flex items-center justify-center">
          <Upload size={24} className="text-primary" />
        </div>
        
        <div>
          <h3 className="text-lg font-medium">Upload Post Screenshot</h3>
          <p className="text-muted-foreground mt-1">
            Drag and drop your screenshot, or click to browse
          </p>
        </div>
        
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="secondary"
          disabled={isLoading}
          className="relative"
        >
          {isLoading ? 'Processing...' : 'Select Image'}
        </Button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileInput}
          disabled={isLoading}
        />
      </div>
    </div>
  );
};

export default ImageUploader;
