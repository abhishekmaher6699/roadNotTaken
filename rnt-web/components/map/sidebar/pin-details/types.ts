import type { Pin } from "@/features/pins/types";

export interface PinDetailsSidebarProps {
  open: boolean;
  pin: Pin | null;
  currentUserId: string;
  onClose: () => void;
  onEdit: () => void;
  onDelete: (pinId: string) => Promise<void>;
  onToggleLike: (pin: Pin) => Promise<void>;
}
