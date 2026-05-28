export interface ProfileSidebarProps {
  open: boolean;
  userId: string | null;
  fallbackEmail?: string;
  canEdit?: boolean;
  onClose: () => void;
}
