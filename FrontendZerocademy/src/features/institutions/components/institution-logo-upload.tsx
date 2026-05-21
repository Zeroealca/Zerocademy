"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { uploadInstitutionLogo } from "@/features/institutions/api/institutions.api";
import { resolveAssetUrl } from "@/lib/resolve-asset-url";
import { ApiError } from "@/lib/api-error";
import { cn } from "@/lib/utils";

interface InstitutionLogoUploadProps {
  institutionId: string;
  currentLogoUrl?: string | null;
  disabled?: boolean;
  onUploaded?: (logoUrl: string) => void;
  className?: string;
}

export function InstitutionLogoUpload({
  institutionId,
  currentLogoUrl,
  disabled = false,
  onUploaded,
  className,
}: InstitutionLogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    resolveAssetUrl(currentLogoUrl),
  );
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPreviewUrl(resolveAssetUrl(currentLogoUrl));
  }, [currentLogoUrl]);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setError(null);
    setIsUploading(true);

    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    try {
      const institution = await uploadInstitutionLogo(institutionId, file);
      const resolved = resolveAssetUrl(institution.logoUrl);
      setPreviewUrl(resolved);
      onUploaded?.(institution.logoUrl ?? "");
    } catch (uploadError) {
      setPreviewUrl(resolveAssetUrl(currentLogoUrl));
      setError(
        uploadError instanceof ApiError
          ? uploadError.message
          : "No se pudo subir el logo. Inténtalo de nuevo.",
      );
    } finally {
      setIsUploading(false);
      if (localPreview.startsWith("blob:")) {
        URL.revokeObjectURL(localPreview);
      }
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <Label htmlFor={`logo-upload-${institutionId}`}>Logo de la institución</Label>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 p-2">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt=""
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <span className="text-center text-xs text-muted-foreground">
              Sin logo
            </span>
          )}
        </div>
        <div className="space-y-2">
          <input
            ref={inputRef}
            id={`logo-upload-${institutionId}`}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="sr-only"
            disabled={disabled || isUploading}
            onChange={handleFileChange}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || isUploading}
            onClick={() => inputRef.current?.click()}
          >
            {isUploading ? "Subiendo…" : "Seleccionar imagen"}
          </Button>
          <p className="text-xs text-muted-foreground">
            PNG, JPEG, WebP o GIF. Máx. 5 MB. Se optimiza a WebP conservando
            transparencia si la imagen la tiene.
          </p>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
