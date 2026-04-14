import { ChangeEventHandler, FormEventHandler } from "react";
import type { CreatePinInput, Pin } from "@/features/pins/types";
import type { PendingPin } from "@/types/mapTypes";

export interface CreatePinSidebarProps {
  open: boolean;
  pendingPin: PendingPin | null;
  previewPin: Pin | null;
  onClose: () => void;
  onSubmit: (values: CreatePinInput) => Promise<void>;
  onViewDetails: () => void;
}

export interface CreatePinFormState {
  title: string;
  category: string;
  description: string;
  imageUrls: string[];
  thumbnailIndex: number | null;
}

export interface CreatePinFormController {
  form: CreatePinFormState;
  error: string | null;
  isSubmitting: boolean;
  isUploading: boolean;
  selectedCountLabel: string;
  thumbnailUrl: string | null;
  updateTitle: (title: string) => void;
  updateCategory: (category: string) => void;
  updateDescription: (description: string) => void;
  selectThumbnail: (index: number) => void;
  removeImage: (index: number) => void;
  submitForm: FormEventHandler<HTMLFormElement>;
  handleImageChange: ChangeEventHandler<HTMLInputElement>;
  handleClose: () => void;
}

export interface CreatePinPreviewCardProps {
  pin: Pin;
  onViewDetails: () => void;
}

export interface UploadedImageGridProps {
  imageUrls: string[];
  thumbnailIndex: number | null;
  onSelectThumbnail: (index: number) => void;
  onRemoveImage: (index: number) => void;
}
