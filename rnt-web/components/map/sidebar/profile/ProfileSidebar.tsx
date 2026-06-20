"use client";

import { useEffect, useState } from "react";
import { MapSidebarShell } from "../MapSidebarShell";
import {
  followProfileApi,
  unfollowProfileApi,
  updateMyProfileApi,
  useProfileFollowList,
  usePublicProfile,
  type ProfileFollowListKind,
} from "@/features/profiles";
import { useCloudinaryUpload } from "@/features/uploads/hooks";
import { ProfileHeader } from "./ProfileHeader";
import { ProfileEditForm, type ProfileFormState } from "./ProfileEditForm";
import { ProfileContent } from "./ProfileContent";
import { ProfileFollowList } from "./ProfileFollowList";
import type { ProfileSidebarProps } from "./types";

export function ProfileSidebar({
  open,
  userId,
  currentUserId,
  fallbackEmail,
  canEdit = false,
  onOpenPin,
  onOpenProfile,
  onProfileSaved,
  onClose,
}: ProfileSidebarProps) {
  const { profile, isLoading, error, refetch, setProfile } = usePublicProfile(open ? userId : null);
  const { uploadImage } = useCloudinaryUpload();
  const [isEditing, setIsEditing] = useState(false);
  const [followListKind, setFollowListKind] = useState<ProfileFollowListKind | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isFollowPending, setIsFollowPending] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [followError, setFollowError] = useState<string | null>(null);
  const [form, setForm] = useState<ProfileFormState>({
    display_name: "",
    username: "",
    bio: "",
    location: "",
    website: "",
    avatar_url: "",
  });
  const followList = useProfileFollowList(
    open && userId && followListKind ? userId : null,
    followListKind,
  );

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

  useEffect(() => {
    setFollowError(null);
    setIsFollowPending(false);
    setFollowListKind(null);
  }, [userId]);

  if (!open && !userId) return null;

  const activeProfile =
    profile && String(profile.user.user_id) === String(userId) ? profile : null;
  const user = activeProfile?.user;
  const stats = activeProfile?.stats;
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
      const url = await uploadImage(file, "profiles");
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

  const handleToggleFollow = async () => {
    if (!user || canEdit || isFollowPending) return;

    const targetUserId = user.user_id;
    const wasFollowing = Boolean(activeProfile?.viewer_has_followed);

    setFollowError(null);
    setIsFollowPending(true);
    setProfile((current) => {
      if (!current || current.user.user_id !== targetUserId) {
        return current;
      }

      return {
        ...current,
        viewer_has_followed: !wasFollowing,
        stats: {
          ...current.stats,
          followers_count: Math.max(
            current.stats.followers_count + (wasFollowing ? -1 : 1),
            0,
          ),
        },
      };
    });

    try {
      const result = wasFollowing
        ? await unfollowProfileApi(targetUserId, currentUserId)
        : await followProfileApi(targetUserId, currentUserId);

      setProfile((current) => {
        if (!current || current.user.user_id !== targetUserId) {
          return current;
        }

        return {
          ...current,
          viewer_has_followed: result.following,
          stats: {
            ...current.stats,
            followers_count: result.followers_count,
          },
        };
      });
    } catch (followToggleError) {
      setProfile((current) => {
        if (!current || current.user.user_id !== targetUserId) {
          return current;
        }

        return {
          ...current,
          viewer_has_followed: wasFollowing,
          stats: {
            ...current.stats,
            followers_count: Math.max(
              current.stats.followers_count + (wasFollowing ? 1 : -1),
              0,
            ),
          },
        };
      });
      setFollowError(
        followToggleError instanceof Error
          ? followToggleError.message
          : "Failed to update follow state",
      );
    } finally {
      setIsFollowPending(false);
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
                viewerHasFollowed={activeProfile.viewer_has_followed}
                canEdit={canEdit}
                isEditing={isEditing}
                isFollowPending={isFollowPending}
                onToggleEdit={() => setIsEditing((v) => !v)}
                onToggleFollow={handleToggleFollow}
                onOpenFollowList={(kind) => {
                  setFollowListKind(kind);
                  setIsEditing(false);
                }}
              />
            )}

            {followError && !isEditing && (
              <div className="rounded-2xl border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-700">
                {followError}
              </div>
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

            {!isEditing && followListKind && (
              <ProfileFollowList
                kind={followListKind}
                users={followList.users}
                isLoading={followList.isLoading}
                isLoadingMore={followList.isLoadingMore}
                error={followList.error}
                hasMore={followList.hasMore}
                onBack={() => setFollowListKind(null)}
                onLoadMore={() => void followList.loadMore()}
                onOpenProfile={(nextUserId) => {
                  setFollowListKind(null);
                  onOpenProfile?.(nextUserId);
                }}
              />
            )}

            {!isEditing && !followListKind && (
              <ProfileContent
                content={activeProfile.content}
                onOpenPin={onOpenPin}
              />
            )}
          </>
        )}
      </div>
    </MapSidebarShell>
  );
}
