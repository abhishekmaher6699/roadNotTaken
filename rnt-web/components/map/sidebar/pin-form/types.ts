import { ChangeEventHandler, FormEventHandler } from "react";
import type { CreatePinInput, UpdatePinInput } from "@/features/pins/types";

export interface PinFormState {
  title: string;
  category: string;
  address: string;
  status: string;
  accessLevel: string;
  description: string;
  imageUrls: string[];
  thumbnailIndex: number | null;
}

export type PinFormFieldKey = Exclude<
  keyof PinFormState,
  "imageUrls" | "thumbnailIndex"
>;

export interface PinFormController {
  form: PinFormState;
  error: string | null;
  isSubmitting: boolean;
  isUploading: boolean;
  selectedCountLabel: string;
  thumbnailUrl: string | null;
  updateField: <K extends PinFormFieldKey>(
    field: K,
    value: PinFormState[K]
  ) => void;
  selectThumbnail: (index: number) => void;
  removeImage: (index: number) => void;
  submitForm: FormEventHandler<HTMLFormElement>;
  handleImageChange: ChangeEventHandler<HTMLInputElement>;
  handleClose: () => void;
}

export interface UsePinFormOptions {
  latitude?: number;
  longitude?: number;
  initialValues?: Partial<PinFormState>;
  onClose: () => void;
  onSubmit: (values: CreatePinInput | UpdatePinInput) => Promise<void>;
}

export interface UploadedImageGridProps {
  imageUrls: string[];
  thumbnailIndex: number | null;
  onSelectThumbnail: (index: number) => void;
  onRemoveImage: (index: number) => void;
}
