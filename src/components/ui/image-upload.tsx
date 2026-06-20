import * as React from "react";
import { useState, useRef } from "react";
import { Card, CardContent } from "./card";
import { Button } from "./button";
import { Input } from "./input";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  onImagesSelect: (files: File[], previews: string[]) => void;
  onImageRemove: (index: number) => void;
  onImageClear: () => void;
  onStartAnalysis: () => void;
  previews?: string[];
  className?: string;
}

const ImageUpload = React.forwardRef<HTMLDivElement, ImageUploadProps>(
  (
    {
      onImagesSelect,
      onImageRemove,
      onImageClear,
      onStartAnalysis,
      previews,
      className,
      ...props
    },
    ref,
  ) => {
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const MAX_IMAGES = 4;

    const handleDrag = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === "dragenter" || e.type === "dragover") {
        setDragActive(true);
      } else if (e.type === "dragleave") {
        setDragActive(false);
      }
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files) {
        handleFiles(Array.from(e.dataTransfer.files));
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      if (e.target.files) {
        handleFiles(Array.from(e.target.files));
      }
    };

    const handleFiles = (files: File[]) => {
      // Filter for image files and validate
      const imageFiles = files.filter((file) => file.type.startsWith("image/"));
      const validFiles = imageFiles.filter(
        (file) => file.size <= 10 * 1024 * 1024,
      ); // 10MB limit

      if (imageFiles.length !== files.length) {
        alert("Please select only image files");
        return;
      }

      if (validFiles.length !== imageFiles.length) {
        alert("Some files exceed the 10MB limit and were skipped");
      }

      if (validFiles.length === 0) {
        return;
      }

      // Check if adding these files would exceed the limit
      const currentCount = previews?.length || 0;
      const totalCount = currentCount + validFiles.length;

      if (totalCount > MAX_IMAGES) {
        alert(
          `You can only upload up to ${MAX_IMAGES} images. Please remove some images first.`,
        );
        return;
      }

      // Create previews for all valid files
      const readers = validFiles.map((file) => {
        return new Promise<{ file: File; preview: string }>(
          (resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              resolve({ file, preview: reader.result as string });
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          },
        );
      });

      Promise.all(readers)
        .then((results) => {
          const files = results.map((r) => r.file);
          const previews = results.map((r) => r.preview);
          onImagesSelect(files, previews);
        })
        .catch((error) => {
          console.error("Error reading files:", error);
          alert("Error reading image files");
        });
    };

    const onButtonClick = () => {
      fileInputRef.current?.click();
    };

    const handleRemove = (index: number) => {
      onImageRemove(index);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };

    const handleClear = () => {
      onImageClear();
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };

    return (
      <div ref={ref} className={cn("w-full", className)} {...props}>
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple={true}
          onChange={handleChange}
          className="hidden"
        />

        {previews && previews.length > 0 ? (
          <div className="space-y-4">
            {/* Upload area for additional images */}
            {previews.length < MAX_IMAGES && (
              <Card
                className={cn(
                  "border-2 border-dashed transition-colors cursor-pointer",
                  dragActive
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50",
                  "min-h-[150px] flex items-center justify-center",
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={onButtonClick}
              >
                <CardContent className="p-6 text-center">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-muted-foreground"
                      >
                        <rect
                          x="3"
                          y="3"
                          width="18"
                          height="18"
                          rx="2"
                          ry="2"
                        ></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Add more images</p>
                      <p className="text-xs text-muted-foreground">
                        ({previews.length}/{MAX_IMAGES} uploaded)
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Add Images
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Image grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {previews.map((preview, index) => (
                <Card key={index} className="relative">
                  <CardContent className="p-3">
                    <div className="relative">
                      <img
                        src={preview}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-40 object-cover rounded-md"
                      />
                      <div className="absolute top-1 right-1 flex gap-1">
                        <Button
                          onClick={() => handleRemove(index)}
                          variant="destructive"
                          size="sm"
                          className="h-6 w-6 p-0"
                        >
                          ×
                        </Button>
                      </div>
                      <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        {index + 1}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Analysis and Clear buttons */}
            <div className="flex justify-center gap-2 pt-2">
              {previews && previews.length > 0 && (
                <Button
                  onClick={onStartAnalysis}
                  className="gap-2 bg-primary hover:bg-primary/90"
                  disabled={previews.length === 0}
                >
                  🤖 Start Analysis
                </Button>
              )}
              <Button onClick={handleClear} variant="outline" size="sm">
                Clear All Images
              </Button>
            </div>
          </div>
        ) : (
          <Card
            className={cn(
              "border-2 border-dashed transition-colors cursor-pointer",
              dragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50",
              "min-h-[200px] flex items-center justify-center",
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={onButtonClick}
          >
            <CardContent className="p-8 text-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-muted-foreground"
                  >
                    <rect
                      x="3"
                      y="3"
                      width="18"
                      height="18"
                      rx="2"
                      ry="2"
                    ></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-medium">
                    Drop images here or click to upload
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Supports: JPG, PNG, GIF, WebP (max 10MB per file, up to{" "}
                    {MAX_IMAGES} images)
                  </p>
                </div>
                <Button variant="outline">Select Images</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  },
);

ImageUpload.displayName = "ImageUpload";

export { ImageUpload };
