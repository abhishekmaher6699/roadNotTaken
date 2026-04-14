import type { Pin } from "@/features/pins/types";

export interface PinDetailsSidebarProps {
  open: boolean;
  pin: Pin | null;
  currentUserId: string;
  onClose: () => void;
  onDelete: (pinId: string) => Promise<void>;
}
