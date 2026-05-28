import { getInitial } from "./utils";

export interface ProfileFormState {
  display_name: string;
  username: string;
  bio: string;
  location: string;
  website: string;
  avatar_url: string;
}

interface ProfileEditFormProps {
  form: ProfileFormState;
  displayName: string;
  isSaving: boolean;
  isUploadingAvatar: boolean;
  editError: string | null;
  onChange: (field: keyof ProfileFormState, value: string) => void;
  onAvatarUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function ProfileEditForm({
  form,
  displayName,
  isSaving,
  isUploadingAvatar,
  editError,
  onChange,
  onAvatarUpload,
  onSubmit,
  onCancel,
}: ProfileEditFormProps) {
  return (
    <form
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-neutral-950">Edit profile</p>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50"
        >
          Cancel
        </button>
      </div>
      {editError && (
        <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
          {editError}
        </p>
      )}

      <label className="block">
        <span className="text-[11px] font-semibold text-neutral-500">
          Profile picture
        </span>
        <div className="mt-1 flex items-center gap-3">
          {form.avatar_url ? (
            <img
              src={form.avatar_url}
              alt=""
              className="h-12 w-12 shrink-0 rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-sm font-semibold text-neutral-500">
              {getInitial(displayName)}
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={onAvatarUpload}
            disabled={isUploadingAvatar}
            className="min-w-0 flex-1 text-xs text-neutral-600 file:mr-3 file:rounded-full file:border-0 file:bg-neutral-950 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white disabled:opacity-60"
          />
        </div>
        {isUploadingAvatar && (
          <span className="mt-1 block text-xs text-neutral-500">
            Uploading...
          </span>
        )}
      </label>

      <label className="block">
        <span className="text-[11px] font-semibold text-neutral-500">
          Display name
        </span>
        <input
          value={form.display_name}
          onChange={(e) => onChange("display_name", e.target.value)}
          className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400"
        />
      </label>

      <label className="block">
        <span className="text-[11px] font-semibold text-neutral-500">
          Username
        </span>
        <input
          value={form.username}
          onChange={(e) => onChange("username", e.target.value)}
          className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400"
        />
      </label>

      <label className="block">
        <span className="text-[11px] font-semibold text-neutral-500">Bio</span>
        <textarea
          value={form.bio}
          onChange={(e) => onChange("bio", e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400"
        />
      </label>

      <label className="block">
        <span className="text-[11px] font-semibold text-neutral-500">
          Location
        </span>
        <input
          value={form.location}
          onChange={(e) => onChange("location", e.target.value)}
          className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400"
        />
      </label>

      <label className="block">
        <span className="text-[11px] font-semibold text-neutral-500">
          Website
        </span>
        <input
          value={form.website}
          onChange={(e) => onChange("website", e.target.value)}
          className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400"
        />
      </label>

      <button
        type="submit"
        disabled={isSaving || isUploadingAvatar}
        className="w-full rounded-full bg-neutral-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:bg-neutral-300"
      >
        {isSaving ? "Saving..." : "Save profile"}
      </button>
    </form>
  );
}
