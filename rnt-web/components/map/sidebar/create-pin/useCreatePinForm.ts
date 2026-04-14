"use client";

import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useCloudinaryUpload } from "@/features/uploads/hooks";
import type { CreatePinInput } from "@/features/pins/types";
import type { CreatePinFormController, CreatePinFormState } from "./types";
import { createPinSchema } from "./validation";

const MAX_IMAGES = 10;

const initialFormState: CreatePinFormState = {
  title: "",
  category: "general",
  description: "",
  imageUrls: [],
  thumbnailIndex: null,
};

interface UseCreatePinFormOptions {
  latitude?: number;
  longitude?: number;
  onClose: () => void;
  onSubmit: (values: CreatePinInput) => Promise<void>;
}

function buildCreatePinPayload(
  values: CreatePinFormState,
  latitude: number,
  longitude: number
): CreatePinInput {
  const parsed = createPinSchema.safeParse({
    title: values.title,
    category: values.category,
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

  return {
    title: parsed.data.title,
    category: parsed.data.category,
    latitude,
    longitude,
    description: parsed.data.description || undefined,
    image_urls: parsed.data.imageUrls,
    thumbnail_url: thumbnailUrl,
    image_url: thumbnailUrl,
  };
}

export function useCreatePinForm({
  latitude,
  longitude,
  onClose,
  onSubmit,
}: UseCreatePinFormOptions): CreatePinFormController {
  const { uploadImage } = useCloudinaryUpload();
  const [form, setForm] = useState<CreatePinFormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const thumbnailUrl =
    form.thumbnailIndex !== null ? form.imageUrls[form.thumbnailIndex] : null;

  const selectedCountLabel = useMemo(
    () => `${form.imageUrls.length}/${MAX_IMAGES} uploaded`,
    [form.imageUrls.length]
  );

  const resetForm = () => {
    setError(null);
    setForm(initialFormState);
  };

  const updateTitle = (title: string) => {
    setForm((current) => ({ ...current, title }));
  };

  const updateDescription = (description: string) => {
    setForm((current) => ({ ...current, description }));
  };

  const updateCategory = (category: string) => {
    setForm((current) => ({ ...current, category }));
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

    if (latitude === undefined || longitude === undefined) {
      return;
    }

    try {
      setError(null);
      setIsSubmitting(true);
      const payload = buildCreatePinPayload(form, latitude, longitude);
      await onSubmit(payload);
      resetForm();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Failed to create pin"
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
    updateTitle,
    updateCategory,
    updateDescription,
    selectThumbnail,
    removeImage,
    submitForm,
    handleImageChange,
    handleClose,
  };
}
