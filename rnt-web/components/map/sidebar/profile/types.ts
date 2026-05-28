export interface ProfileSidebarProps {
  open: boolean;
  userId: string | null;
  fallbackEmail?: string;
  canEdit?: boolean;
  onOpenPin?: (pinId: string) => void;
  onProfileSaved?: (avatarUrl: string | null) => void;
  onClose: () => void;
}
