"use client";

import { useEffect, useState } from "react";
import { MapSidebarShell } from "../MapSidebarShell";
import { updateMyProfileApi, usePublicProfile } from "@/features/profiles";
import { useCloudinaryUpload } from "@/features/uploads/hooks";
import { ProfileHeader } from "./ProfileHeader";
import { ProfileEditForm, type ProfileFormState } from "./ProfileEditForm";
import { ProfileContent } from "./ProfileContent";
import type { ProfileSidebarProps } from "./types";

export function ProfileSidebar({
  open,
  userId,
  fallbackEmail,
  canEdit = false,
  onOpenPin,
  onProfileSaved,
  onClose,
}: ProfileSidebarProps) {
  const { profile, isLoading, error, refetch } = usePublicProfile(open ? userId : null);
  const { uploadImage } = useCloudinaryUpload();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [form, setForm] = useState<ProfileFormState>({
    display_name: "",
    username: "",
    bio: "",
    location: "",
    website: "",
    avatar_url: "",
  });

  useEffect(() => {
    const user = profile?.user;
    if (!user || isEditing) return;

    setForm({
      display_name: user.display_name ?? "",
      username: user.username ?? "",
      bio: user.bio ?? "",
      location: user.location ?? "",
      website: user.website ?? "",
      avatar_url: user.avatar_url ?? "",
    });
  }, [isEditing, profile?.user]);

  if (!open && !userId) return null;

  const user = profile?.user;
  const stats = profile?.stats;
  const displayName =
    user?.display_name || user?.username || (user ? "Anonymous" : "Profile");

  const saveProfile = async () => {
    setIsSaving(true);
    try {
      setEditError(null);
      const savedProfile = await updateMyProfileApi(form);
      await refetch();
      onProfileSaved?.(savedProfile.avatar_url);
      setIsEditing(false);
    } catch (saveError) {
      setEditError(
        saveError instanceof Error ? saveError.message : "Failed to save profile",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setEditError(null);
      setIsUploadingAvatar(true);
      const url = await uploadImage(file);
      setForm((current) => ({ ...current, avatar_url: url }));
    } catch (uploadError) {
      setEditError(
        uploadError instanceof Error ? uploadError.message : "Avatar upload failed",
      );
    } finally {
      setIsUploadingAvatar(false);
      event.target.value = "";
    }
  };

  return (
    <MapSidebarShell
      open={open}
      title="Profile"
      description="Member identity and contribution stats."
      onClose={onClose}
      side="right"
    >
      <div className="space-y-3 pb-4">
        {isLoading && (
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-500">
            Loading profile...
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {user && stats && (
          <>
            {!isEditing && (
              <ProfileHeader
                user={user}
                stats={stats}
                canEdit={canEdit}
                isEditing={isEditing}
                onToggleEdit={() => setIsEditing((v) => !v)}
              />
            )}

            {isEditing && (
              <section className="rounded-2xl border border-neutral-200 bg-white p-4">
                <ProfileEditForm
                  form={form}
                  displayName={displayName}
                  isSaving={isSaving}
                  isUploadingAvatar={isUploadingAvatar}
                  editError={editError}
                  onChange={(field, value) =>
                    setForm((current) => ({ ...current, [field]: value }))
                  }
                  onAvatarUpload={handleAvatarUpload}
                  onSubmit={() => void saveProfile()}
                  onCancel={() => setIsEditing(false)}
                />
              </section>
            )}

            {!isEditing && (
              <ProfileContent
                content={profile.content}
                onOpenPin={onOpenPin}
              />
            )}
          </>
        )}
      </div>
    </MapSidebarShell>
  );
}
