export interface ProfileSidebarProps {
  open: boolean;
  userId: string | null;
  fallbackEmail?: string;
  onClose: () => void;
}
