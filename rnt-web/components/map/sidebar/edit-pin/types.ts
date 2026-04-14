import type { Pin, UpdatePinInput } from "@/features/pins/types";

export interface EditPinSidebarProps {
  open: boolean;
  pin: Pin | null;
  onClose: () => void;
  onSubmit: (pinId: string, values: UpdatePinInput) => Promise<void>;
}
