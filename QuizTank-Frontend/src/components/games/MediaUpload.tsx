import { useRef, useState, DragEvent, ChangeEvent, TouchEvent } from "react";
import { Image, X, Plus, Video, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface MediaFile {
    id: string;
    url: string;
    type: "image" | "video";
    name: string;
}

interface MediaUploadProps {
    files: MediaFile[];
    onChange: (files: MediaFile[]) => void;
    maxFiles?: number;
    accept?: string;
    className?: string;
    placeholder?: string;
    onUpload?: (file: File) => Promise<string>;
    disabled?: boolean;
    maxSize?: number; // Size in MB
}

export function MediaUpload({
    files,
    onChange,
    maxFiles = 1,
    accept = "image/*,video/*",
    className,
    placeholder = "Click to upload",
    onUpload,
    disabled = false,
    maxSize = 20, // Default 20MB
}: MediaUploadProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    const handleDragStart = (e: DragEvent<HTMLDivElement>, index: number) => {
        if (disabled) return;
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", index.toString());
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>, index: number) => {
        e.preventDefault(); // Necessary to allow dropping
        if (disabled || draggedIndex === null || draggedIndex === index) return;

        const newFiles = [...files];
        const draggedItem = newFiles[draggedIndex];
        newFiles.splice(draggedIndex, 1);
        newFiles.splice(index, 0, draggedItem);

        onChange(newFiles);
        setDraggedIndex(index);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    // Touch support for mobile
    const handleTouchStart = (index: number) => {
        if (disabled) return;
        setDraggedIndex(index);
    };

    const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
        if (disabled || draggedIndex === null) return;
        // Prevent scrolling while dragging
        if (e.cancelable) e.preventDefault();

        const touch = e.touches[0];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        const item = target?.closest('[data-index]');

        if (item && item instanceof HTMLElement && item.dataset.index) {
            const hoverIndex = parseInt(item.dataset.index);
            if (!isNaN(hoverIndex) && hoverIndex !== draggedIndex) {
                const newFiles = [...files];
                const draggedItem = newFiles[draggedIndex];
                newFiles.splice(draggedIndex, 1);
                newFiles.splice(hoverIndex, 0, draggedItem);

                onChange(newFiles);
                setDraggedIndex(hoverIndex);
            }
        }
    };

    const handleTouchEnd = () => {
        setDraggedIndex(null);
    };

    const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
        if (disabled) return;
        const selectedFiles = e.target.files;
        if (!selectedFiles) return;

        // Check file sizes
        const validFiles: File[] = [];
        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            if (file.size > maxSize * 1024 * 1024) {
                toast.error(`File ${file.name} exceeds ${maxSize}MB limit`);
                continue;
            }
            validFiles.push(file);
        }

        if (validFiles.length === 0) {
            if (inputRef.current) inputRef.current.value = "";
            return;
        }

        if (onUpload) {
            setIsUploading(true);
            try {
                const newFiles: MediaFile[] = [];
                // Process sequentially to maintain order and limit concurrency if needed
                for (let i = 0; i < validFiles.length; i++) {
                    const file = validFiles[i];
                    try {
                        const url = await onUpload(file);
                        newFiles.push({
                            id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                            url: url,
                            type: file.type.startsWith("video/") ? "video" : "image",
                            name: file.name,
                        });
                    } catch (err) {
                        console.error(`Failed to upload ${file.name}`, err);
                        toast.error(`Failed to upload ${file.name}`);
                    }
                }

                if (isSingleMode) {
                    if (newFiles.length > 0) onChange([newFiles[0]]);
                } else {
                    onChange([...files, ...newFiles]);
                }
            } finally {
                setIsUploading(false);
                if (inputRef.current) inputRef.current.value = "";
            }
            return;
        }

        // In single mode, replace the existing file
        if (isSingleMode) {
            // Revoke old file URL if exists
            if (files[0]) {
                URL.revokeObjectURL(files[0].url);
            }
            const file = validFiles[0];
            if (file) {
                const newFile: MediaFile = {
                    id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    url: URL.createObjectURL(file),
                    type: file.type.startsWith("video/") ? "video" : "image",
                    name: file.name,
                };
                onChange([newFile]);
            }
        } else {
            // Multi-file mode: add files up to max
            const remainingSlots = maxFiles - files.length;
            const filesToAdd = validFiles.slice(0, remainingSlots);

            const newFiles: MediaFile[] = filesToAdd.map((file) => ({
                id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                url: URL.createObjectURL(file),
                type: file.type.startsWith("video/") ? "video" : "image",
                name: file.name,
            }));

            onChange([...files, ...newFiles]);
        }

        // Reset input so the same file can be selected again
        if (inputRef.current) {
            inputRef.current.value = "";
        }
    };

    const handleRemove = (id: string) => {
        if (disabled) return;
        const file = files.find((f) => f.id === id);
        if (file) {
            URL.revokeObjectURL(file.url);
        }
        onChange(files.filter((f) => f.id !== id));
    };

    const canAddMore = files.length < maxFiles;
    const isSingleMode = maxFiles === 1;

    // Single file mode
    if (isSingleMode) {
        const file = files[0];

        return (
            <div className={cn("relative", className)}>
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={disabled}
                />

                {file ? (
                    <div
                        onClick={() => window.open(file.url, '_blank')}
                        className={cn(
                            "relative bg-muted rounded-lg h-40 overflow-hidden group border-2 border-transparent transition-colors flex items-center justify-center cursor-pointer",
                            !disabled && "hover:border-primary"
                        )}
                    >
                        <div className="aspect-[4/3] h-full overflow-hidden">
                            {file.type === "video" ? (
                                <video
                                    src={file.url}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <img
                                    src={file.url}
                                    alt={file.name}
                                    className="w-full h-full object-cover"
                                />
                            )}
                        </div>
                        {!disabled && (
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        inputRef.current?.click();
                                    }}
                                    className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-colors"
                                >
                                    <Image className="h-5 w-5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemove(file.id);
                                    }}
                                    className="bg-destructive/80 hover:bg-destructive text-white p-2 rounded-lg transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    !disabled && (
                        <div
                            onClick={() => inputRef.current?.click()}
                            className="bg-muted rounded-lg h-40 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors border-2 border-transparent hover:border-primary"
                        >
                            <Image className="h-8 w-8 text-muted-foreground mb-2" />
                            <span className="text-sm text-muted-foreground">{placeholder}</span>
                        </div>
                    )
                )}

                {isUploading && (
                    <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center rounded-lg z-10">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                )}
            </div>
        );
    }

    // Multi-file mode
    return (
        <div className={cn("space-y-2 relative", className)}>
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                multiple
                onChange={handleFileSelect}
                className="hidden"
                disabled={disabled}
            />

            {files.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {files.map((file, index) => (
                        <div
                            key={file.id}
                            data-index={index}
                            draggable={!disabled}
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragEnd={handleDragEnd}
                            onTouchStart={() => handleTouchStart(index)}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                            onClick={() => window.open(file.url, '_blank')}
                            className={cn(
                                "relative aspect-square bg-muted rounded-lg overflow-hidden group border-2 border-transparent transition-colors cursor-pointer touch-none select-none",
                                !disabled && "hover:border-primary",
                                draggedIndex === index && "opacity-50 border-primary border-dashed"
                            )}
                        >
                            {file.type === "video" ? (
                                <div className="relative w-full h-full">
                                    <video
                                        src={file.url}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <Video className="h-6 w-6 text-white drop-shadow-lg" />
                                    </div>
                                </div>
                            ) : (
                                <img
                                    src={file.url}
                                    alt={file.name}
                                    className="w-full h-full object-cover"
                                />
                            )}
                            {!disabled && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemove(file.id);
                                    }}
                                    className="absolute top-1 right-1 bg-destructive/80 hover:bg-destructive text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {canAddMore && !disabled && (
                <div
                    onClick={() => inputRef.current?.click()}
                    className="bg-muted rounded-lg h-[120px] flex flex-col items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors border-2 border-dashed border-muted-foreground/20 hover:border-primary hover:border-solid"
                >
                    <Plus className="h-6 w-6 text-muted-foreground mb-1" />
                    <span className="text-sm text-muted-foreground">
                        Add media ({files.length}/{maxFiles})
                    </span>
                </div>
            )}

            {!canAddMore && !disabled && (
                <p className="text-xs text-muted-foreground text-center">
                    Maximum of {maxFiles} files reached
                </p>
            )}

            {isUploading && (
                <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center rounded-lg z-10 !mt-0">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )}
        </div>
    );
}
