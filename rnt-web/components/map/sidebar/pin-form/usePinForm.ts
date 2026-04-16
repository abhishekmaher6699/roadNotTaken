"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useCloudinaryUpload } from "@/features/uploads/hooks";
import type { CreatePinInput, UpdatePinInput } from "@/features/pins";
import type {
  PinFormController,
  PinFormFieldKey,
  PinFormState,
  UsePinFormOptions,
} from "./types";
import { pinFormSchema } from "./validation";

const MAX_IMAGES = 10;

const initialFormState: PinFormState = {
  title: "",
  category: "general",
  address: "",
  status: "active",
  accessLevel: "public",
  description: "",
  imageUrls: [],
  thumbnailIndex: null,
};

function parseFormValues(values: PinFormState) {
  const parsed = pinFormSchema.safeParse({
    title: values.title,
    category: values.category,
    address: values.address,
    status: values.status,
    accessLevel: values.accessLevel,
    description: values.description || undefined,
    imageUrls: values.imageUrls,
    thumbnailIndex: values.thumbnailIndex ?? undefined,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid form data");
  }

  const thumbnailUrl =
    parsed.data.thumbnailIndex !== undefined
      ? parsed.data.imageUrls[parsed.data.thumbnailIndex]
      : undefined;

  return { parsed: parsed.data, thumbnailUrl };
}

function buildCreatePinPayload(
  values: PinFormState,
  latitude: number,
  longitude: number
): CreatePinInput {
  const { parsed, thumbnailUrl } = parseFormValues(values);

  return {
    title: parsed.title,
    category: parsed.category,
    address: parsed.address,
    status: parsed.status,
    access_level: parsed.accessLevel,
    latitude,
    longitude,
    description: parsed.description || undefined,
    image_urls: parsed.imageUrls,
    thumbnail_url: thumbnailUrl,
    image_url: thumbnailUrl,
  };
}

function buildUpdatePinPayload(values: PinFormState): UpdatePinInput {
  const { parsed, thumbnailUrl } = parseFormValues(values);

  return {
    title: parsed.title,
    category: parsed.category,
    address: parsed.address,
    status: parsed.status,
    access_level: parsed.accessLevel,
    description: parsed.description || undefined,
    image_urls: parsed.imageUrls,
    thumbnail_url: thumbnailUrl,
    image_url: thumbnailUrl,
  };
}

export function usePinForm({
  latitude,
  longitude,
  initialValues,
  onClose,
  onSubmit,
}: UsePinFormOptions): PinFormController {
  const { uploadImage } = useCloudinaryUpload();
  const [form, setForm] = useState<PinFormState>({
    ...initialFormState,
    ...initialValues,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const thumbnailUrl =
    form.thumbnailIndex !== null ? form.imageUrls[form.thumbnailIndex] : null;

  const selectedCountLabel = useMemo(
    () => `${form.imageUrls.length}/${MAX_IMAGES} uploaded`,
    [form.imageUrls.length]
  );

  useEffect(() => {
    setForm({
      ...initialFormState,
      ...initialValues,
    });
    setError(null);
  }, [initialValues]);

  const resetForm = () => {
    setError(null);
    setForm({
      ...initialFormState,
      ...initialValues,
    });
  };

  const updateField = <K extends PinFormFieldKey>(
    field: K,
    value: PinFormState[K]
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const selectThumbnail = (index: number) => {
    setForm((current) => ({ ...current, thumbnailIndex: index }));
  };

  const removeImage = (index: number) => {
    setForm((current) => {
      const nextImages = current.imageUrls.filter(
        (_, imageIndex) => imageIndex !== index
      );

      let nextThumbnailIndex = current.thumbnailIndex;
      if (current.thumbnailIndex === index) {
        nextThumbnailIndex = nextImages.length > 0 ? 0 : null;
      } else if (
        current.thumbnailIndex !== null &&
        current.thumbnailIndex > index
      ) {
        nextThumbnailIndex = current.thumbnailIndex - 1;
      }

      return {
        ...current,
        imageUrls: nextImages,
        thumbnailIndex: nextThumbnailIndex,
      };
    });
  };

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);

    if (files.length === 0) {
      return;
    }

    if (form.imageUrls.length + files.length > MAX_IMAGES) {
      setError(`You can upload at most ${MAX_IMAGES} images`);
      event.target.value = "";
      return;
    }

    try {
      setError(null);
      setIsUploading(true);
      const uploadedUrls = await Promise.all(
        files.map((file) => uploadImage(file))
      );

      setForm((current) => ({
        ...current,
        imageUrls: [...current.imageUrls, ...uploadedUrls],
        thumbnailIndex:
          current.thumbnailIndex ?? (uploadedUrls.length > 0 ? 0 : null),
      }));
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Image upload failed"
      );
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setError(null);
      setIsSubmitting(true);
      const payload =
        latitude !== undefined && longitude !== undefined
          ? buildCreatePinPayload(form, latitude, longitude)
          : buildUpdatePinPayload(form);
      await onSubmit(payload);
      resetForm();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Failed to save pin"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return {
    form,
    error,
    isSubmitting,
    isUploading,
    selectedCountLabel,
    thumbnailUrl,
    updateField,
    selectThumbnail,
    removeImage,
    submitForm,
    handleImageChange,
    handleClose,
  };
}
