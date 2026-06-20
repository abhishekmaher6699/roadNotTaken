export interface ProfileSidebarProps {
  open: boolean;
  userId: string | null;
  currentUserId?: string;
  fallbackEmail?: string;
  canEdit?: boolean;
  onOpenPin?: (pinId: string, commentId?: number) => void;
  onOpenProfile?: (userId: string) => void;
  onProfileSaved?: (avatarUrl: string | null) => void;
  onClose: () => void;
}
