type ProfileCompletionInput = {
  displayName?: string | null;
  photoURL?: string | null;
  bio?: string | null;
  class?: string | null;
  school?: string | null;
  city?: string | null;
};

export function calculateProfileCompletion(profile: ProfileCompletionInput) {
  const fields = [
    profile.displayName,
    profile.photoURL,
    profile.bio,
    profile.class,
    profile.school,
    profile.city,
  ];

  const completed = fields.filter(Boolean).length;

  return Math.round((completed / fields.length) * 100);
}