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

export interface CreatePinPreviewCardProps {
  pin: Pin;
  onViewDetails: () => void;
}
