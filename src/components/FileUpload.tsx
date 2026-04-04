import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileSpreadsheet, AlertCircle, Files } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";

interface FileUploadProps {
  onUpload: (file: File) => void;
  uploading: boolean;
  progress: number;
  error: string | null;
  multiple?: boolean;
  onUploadMultiple?: (files: File[]) => void;
}

const MAX_SIZE = 50 * 1024 * 1024; // 50MB
const ACCEPTED = {
  "text/csv": [".csv"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "application/vnd.ms-excel": [".xls"],
};

export function FileUpload({ onUpload, uploading, progress, error, multiple = false, onUploadMultiple }: FileUploadProps) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted.length === 0) return;
      if (multiple && onUploadMultiple && accepted.length > 1) {
        onUploadMultiple(accepted);
      } else if (accepted.length > 0) {
        onUpload(accepted[0]);
      }
    },
    [onUpload, multiple, onUploadMultiple]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    maxSize: MAX_SIZE,
    multiple,
    disabled: uploading,
  });

  const rejected = fileRejections.length > 0;

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
          isDragActive
            ? "border-primary bg-primary/5 scale-[1.02]"
            : rejected || error
            ? "border-destructive/50 bg-destructive/5"
            : "border-border hover:border-primary/40 hover:bg-card/60"
        } ${uploading ? "pointer-events-none opacity-70" : ""}`}
      >
        <input {...getInputProps()} />
        <AnimatePresence mode="wait">
          {uploading ? (
            <motion.div
              key="uploading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5 text-primary animate-pulse-glow" />
              </div>
              <p className="text-sm text-muted-foreground">Uploading... {progress}%</p>
              <Progress value={progress} className="h-1.5 max-w-48 mx-auto" />
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                {multiple ? <Files className="w-5 h-5 text-primary" /> : <Upload className="w-5 h-5 text-primary" />}
              </div>
              <p className="text-sm font-medium text-foreground">
                {isDragActive ? "Drop file(s) here" : multiple ? "Drag & drop multiple files or click" : "Drag & drop or click"}
              </p>
              <p className="text-xs text-muted-foreground">CSV, XLSX, XLS — Max 50MB{multiple ? " each" : ""}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {(error || rejected) && (
        <div className="flex items-center gap-2 text-xs text-destructive">
          <AlertCircle className="w-3 h-3" />
          <span>{error || "Invalid file type or too large"}</span>
        </div>
      )}
    </div>
  );
}
