import { useState, type ChangeEvent, type FormEvent } from 'react';
import { LogOut } from 'lucide-react';
import { ME_ID } from '@/data/mockData';
import { useSocial } from '@/state/SocialContext';
import { Modal } from '@/components/Modal';
import { supabase } from '@/supabase';

const USERNAME_PATTERN = /^[a-z0-9._]{3,24}$/;
const BIO_MAX = 160;

interface EditProfileModalProps {
  onClose: () => void;
  onSaved: () => void;
}

export function EditProfileModal({ onClose, onSaved }: EditProfileModalProps) {
  const { getUser, updateProfile } = useSocial();
  const me = getUser(ME_ID);
  const [name, setName] = useState(me?.name ?? '');
  const [username, setUsername] = useState(me?.username ?? '');
  const [bio, setBio] = useState(me?.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState(me?.avatarUrl ?? '');
  const [avatarError, setAvatarError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState('');

  const trimmedName = name.trim();
  const trimmedUsername = username.trim().toLowerCase();
  const usernameValid = USERNAME_PATTERN.test(trimmedUsername);
  const canSave = trimmedName.length > 0 && usernameValid;

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setAvatarError('Choose an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Image must be 5 MB or smaller.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
        setAvatarError('');
      }
    };
    reader.onerror = () => setAvatarError('Could not read this image.');
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSave || saving) return;
    if (!supabase) {
      setSaveError('Profile service is not configured.');
      return;
    }

    setSaving(true);
    setSaveError('');
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!authData.user) throw new Error('You must be signed in to save your profile.');

      const { data: profile, error } = await supabase
        .from('profiles')
        .update({
          username: trimmedUsername,
          full_name: trimmedName,
          avatar_url: avatarUrl || null,
          bio: bio.trim(),
        })
        .eq('id', authData.user.id)
        .select('username, full_name, avatar_url, bio')
        .single();
      if (error) throw error;

      updateProfile({
        name: profile.full_name || profile.username,
        username: profile.username,
        bio: profile.bio ?? '',
        avatarUrl: profile.avatar_url ?? undefined,
      });
      onSaved();
      onClose();
    } catch (error: unknown) {
      console.error('[Profile] failed to save profile', error);
      setSaveError(error instanceof Error ? error.message : 'Unable to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    if (!supabase || signingOut) return;
    setSigningOut(true);
    setSignOutError('');
    const { error } = await supabase.auth.signOut();
    setSigningOut(false);
    if (error) {
      setSignOutError(error.message);
      return;
    }
    onClose();
  };

  const fieldClass =
    'w-full rounded-xl border border-fog-300 bg-paper-100 px-4 py-3 text-[15px] text-charcoal-900 placeholder:text-charcoal-500/70 transition focus:border-charcoal-500 focus:outline-none';
  const labelClass = 'mb-2 block text-sm font-medium text-charcoal-700';

  return (
    <Modal title="Edit profile" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <div
            aria-hidden="true"
            className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-fog-200 text-lg font-medium text-charcoal-800"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              name.trim().slice(0, 1).toUpperCase()
            )}
          </div>
          <div>
            <label
              htmlFor="profile-avatar"
              className="inline-flex cursor-pointer rounded-full border border-fog-300 px-4 py-2 text-sm font-medium text-charcoal-800 transition hover:bg-paper-200"
            >
              Change photo
            </label>
            <input
              id="profile-avatar"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="sr-only"
            />
            <p className="mt-1 text-xs text-charcoal-500">Image up to 5 MB</p>
            {avatarError && <p role="alert" className="mt-1 text-xs text-charcoal-800">{avatarError}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="profile-name" className={labelClass}>
            Name
          </label>
          <input
            id="profile-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={40}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="profile-username" className={labelClass}>
            Username
          </label>
          <div className="flex items-center rounded-xl border border-fog-300 bg-paper-100 transition focus-within:border-charcoal-500">
            <span className="pl-4 text-[15px] text-charcoal-500">@</span>
            <input
              id="profile-username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              maxLength={24}
              className="w-full bg-transparent px-1 py-3 text-[15px] text-charcoal-900 focus:outline-none"
            />
          </div>
          <p className={`mt-2 text-xs ${usernameValid || !username ? 'text-charcoal-500' : 'text-charcoal-800'}`}>
            3 to 24 characters: letters, numbers, dots or underscores.
          </p>
        </div>

        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <label htmlFor="profile-bio" className="text-sm font-medium text-charcoal-700">
              Bio
            </label>
            <span className="text-xs tabular-nums text-charcoal-500">
              {BIO_MAX - bio.length} left
            </span>
          </div>
          <textarea
            id="profile-bio"
            value={bio}
            onChange={(event) => setBio(event.target.value.slice(0, BIO_MAX))}
            rows={3}
            className={`${fieldClass} resize-none leading-relaxed`}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-fog-200 pt-5">
          <button
            type="button"
            onClick={() => void handleSignOut()}
            disabled={signingOut || !supabase}
            className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <LogOut aria-hidden="true" className="h-4 w-4" />
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
          {saveError && (
            <p role="alert" className="w-full text-right text-xs text-red-700">
              {saveError}
            </p>
          )}
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-full px-4 py-2 text-sm font-medium text-charcoal-600 transition hover:text-charcoal-900"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSave || saving}
            className="rounded-full bg-charcoal-900 px-6 py-2 text-sm font-medium text-paper-50 transition hover:bg-charcoal-700 disabled:cursor-not-allowed disabled:bg-fog-300 disabled:text-charcoal-500"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
        {signOutError && (
          <p role="alert" className="-mt-3 text-right text-xs text-red-700">
            {signOutError}
          </p>
        )}
      </form>
    </Modal>
  );
}
