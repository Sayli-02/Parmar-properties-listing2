"use client";

import * as React from "react";
import { Image as ImageIcon, Star, Trash, Upload } from "lucide-react";
import { toast } from "sonner";

import type { PropertyImage } from "@/types";
import { MAX_IMAGE_SIZE_MB } from "@/lib/constants";
import { getErrorMessage, isValidImageFile } from "@/lib/utils";
import { useResource } from "@/lib/hooks/use-resource";
import {
  addPropertyImage,
  deletePropertyImage,
  listPropertyImages,
  reorderPropertyImages,
  setPrimaryImage,
  updatePropertyImageAlt,
} from "@/lib/api/property-images";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  EmptyState,
  ErrorState,
  LoadingBlock,
  Spinner,
} from "@/components/shared/states";
import { ConfirmDialog, useConfirm } from "@/components/shared/confirm-dialog";
import { OrderControls, moveItem } from "@/components/shared/order-controls";

export function ImagesManager({
  propertyId,
  onChanged,
}: {
  propertyId: string;
  onChanged?: () => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const confirm = useConfirm<PropertyImage>();

  const fetchImages = React.useCallback(
    () => listPropertyImages(propertyId),
    [propertyId]
  );

  const {
    data: images,
    setData: setImages,
    loading,
    error,
    reload,
  } = useResource<PropertyImage[]>(fetchImages, []);

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;

    const selected = Array.from(files);
    const rejected: string[] = [];
    const accepted: File[] = [];

    for (const file of selected) {
      const problem = isValidImageFile(file, MAX_IMAGE_SIZE_MB);
      if (problem) rejected.push(`${file.name}: ${problem}`);
      else accepted.push(file);
    }

    if (rejected.length > 0) {
      toast.error("Some files were skipped", {
        description: rejected.join("\n"),
      });
    }
    if (accepted.length === 0) return;

    setUploading(true);
    let uploaded = 0;
    try {
      // Sequential so display_order stays predictable.
      for (const file of accepted) {
        await addPropertyImage(propertyId, file);
        uploaded += 1;
      }
      toast.success(
        `${uploaded} ${uploaded === 1 ? "image" : "images"} uploaded`
      );
    } catch (caught) {
      toast.error(getErrorMessage(caught));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
      reload();
      onChanged?.();
    }
  }

  async function handleMove(from: number, to: number) {
    const next = moveItem(images, from, to);
    if (next === images) return;

    setImages(next);
    setBusy(true);
    try {
      await reorderPropertyImages(next.map((image) => image.id));
      onChanged?.();
    } catch (caught) {
      toast.error(getErrorMessage(caught));
      reload();
    } finally {
      setBusy(false);
    }
  }

  async function handleSetPrimary(image: PropertyImage) {
    setBusy(true);
    try {
      await setPrimaryImage(propertyId, image.id);
      toast.success("Primary image updated");
      reload();
      onChanged?.();
    } catch (caught) {
      toast.error(getErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  async function handleAltSave(image: PropertyImage, altText: string) {
    if ((image.alt_text ?? "") === altText) return;

    try {
      await updatePropertyImageAlt(image.id, altText);
      setImages((current) =>
        current.map((item) =>
          item.id === image.id ? { ...item, alt_text: altText || null } : item
        )
      );
    } catch (caught) {
      toast.error(getErrorMessage(caught));
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div className="space-y-1.5">
          <CardTitle>Gallery</CardTitle>
          <CardDescription>
            The primary image is used on listing cards. Arrange the rest with the
            arrows.
          </CardDescription>
        </div>
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(event) => void handleUpload(event.target.files)}
          />
          <Button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? <Spinner /> : <Upload />}
            Upload images
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : loading ? (
          <LoadingBlock label="Loading images…" />
        ) : images.length === 0 ? (
          <EmptyState
            icon={<ImageIcon />}
            title="No images yet"
            description={`Upload JPEG, PNG or WebP files up to ${MAX_IMAGE_SIZE_MB}MB each. You can select several at once.`}
            action={
              <Button
                type="button"
                variant="outline"
                onClick={() => inputRef.current?.click()}
              >
                <Upload />
                Upload images
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {images.map((image, index) => (
              <div
                key={image.id}
                className="overflow-hidden rounded-lg border border-border"
              >
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt={image.alt_text ?? ""}
                    className="aspect-video w-full bg-muted object-cover"
                  />
                  {image.is_primary ? (
                    <Badge
                      variant="warning"
                      className="absolute top-2 left-2 shadow-sm"
                    >
                      <Star className="fill-current" />
                      Primary
                    </Badge>
                  ) : null}
                </div>

                <div className="space-y-2 p-3">
                  <Input
                    defaultValue={image.alt_text ?? ""}
                    placeholder="Alt text for accessibility"
                    aria-label="Image alt text"
                    onBlur={(event) =>
                      void handleAltSave(image, event.target.value.trim())
                    }
                  />

                  <div className="flex items-center justify-between gap-2">
                    <OrderControls
                      index={index}
                      total={images.length}
                      disabled={busy}
                      onMove={handleMove}
                    />
                    <div className="flex items-center gap-1">
                      {!image.is_primary ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={busy}
                          onClick={() => void handleSetPrimary(image)}
                        >
                          <Star />
                          Primary
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Delete image"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => confirm.ask(image)}
                      >
                        <Trash />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <ConfirmDialog
        open={confirm.open}
        onOpenChange={confirm.setOpen}
        title="Delete this image?"
        description="The file is removed from storage and cannot be recovered."
        confirmLabel="Delete image"
        destructive
        onConfirm={async () => {
          if (!confirm.target) return;
          try {
            await deletePropertyImage(confirm.target);
            toast.success("Image deleted");
            reload();
            onChanged?.();
          } catch (caught) {
            toast.error(getErrorMessage(caught));
          }
        }}
      />
    </Card>
  );
}
