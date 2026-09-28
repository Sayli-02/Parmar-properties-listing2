"use client";

import * as React from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";

import type { Property } from "@/types";
import { getErrorMessage } from "@/lib/utils";
import { updatePropertyMedia } from "@/lib/api/properties";
import { deleteFile, storageFolders } from "@/lib/api/storage";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field } from "@/components/shared/field";
import { Spinner } from "@/components/shared/states";
import {
  MediaPicker,
  unchangedSelection,
  uploadSelection,
  type FileSelection,
} from "@/components/shared/media-picker";

/**
 * Brochure and RERA QR uploads. Kept apart from the details form because these
 * are file columns rather than validated text fields.
 */
export function PropertyFiles({
  property,
  onSaved,
}: {
  property: Property;
  onSaved?: () => void;
}) {
  const [brochure, setBrochure] =
    React.useState<FileSelection>(unchangedSelection);
  const [reraQr, setReraQr] = React.useState<FileSelection>(unchangedSelection);
  const [saving, setSaving] = React.useState(false);

  const dirty = brochure.kind !== "unchanged" || reraQr.kind !== "unchanged";

  async function handleSave() {
    setSaving(true);
    try {
      const [uploadedBrochure, uploadedQr] = await Promise.all([
        uploadSelection(brochure, storageFolders.propertyBrochure(property.id)),
        uploadSelection(reraQr, storageFolders.propertyRera(property.id)),
      ]);

      await updatePropertyMedia(property.id, {
        brochure: uploadedBrochure,
        reraQr: uploadedQr,
      });

      // Clean up whatever was replaced only after the row points elsewhere.
      if (uploadedBrochure !== undefined && property.brochure_path) {
        await deleteFile(property.brochure_path);
      }
      if (uploadedQr !== undefined && property.rera_qr_path) {
        await deleteFile(property.rera_qr_path);
      }

      setBrochure(unchangedSelection);
      setReraQr(unchangedSelection);
      toast.success("Files updated");
      onSaved?.();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documents</CardTitle>
        <CardDescription>
          The brochure buyers download, and the RERA QR code shown on the
          listing.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <Field
            label="Brochure"
            hint="PDF preferred. Replaces the current file when saved."
          >
            <MediaPicker
              variant="document"
              existingUrl={property.brochure_url}
              existingName={
                property.brochure_path?.split("/").pop() ?? "Brochure"
              }
              selection={brochure}
              onSelectionChange={setBrochure}
              disabled={saving}
              emptyLabel="Upload the brochure"
            />
          </Field>

          <Field
            label="RERA QR code"
            hint="Image of the QR code issued with your RERA registration."
          >
            <MediaPicker
              existingUrl={property.rera_qr_url}
              selection={reraQr}
              onSelectionChange={setReraQr}
              disabled={saving}
              emptyLabel="Upload the QR code"
            />
          </Field>
        </div>

        <div className="flex items-center justify-end gap-3">
          {dirty ? (
            <p className="text-xs text-muted-foreground">
              Changes are applied when you save.
            </p>
          ) : null}
          <Button type="button" onClick={handleSave} disabled={saving || !dirty}>
            {saving ? <Spinner /> : <Save />}
            Save files
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
