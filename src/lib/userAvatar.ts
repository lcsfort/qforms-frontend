type AvatarUser = {
  name?: string | null;
  email: string;
  avatarUrl?: string | null;
  googleAvatarUrl?: string | null;
};

export function getUserInitials(user: AvatarUser): string {
  const name = (user.name ?? "").trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  const emailLocalPart = user.email.split("@")[0] ?? "";
  return emailLocalPart.slice(0, 2).toUpperCase() || "U";
}

export function getUserAvatarUrl(user: AvatarUser): string | null {
  const customAvatar = (user.avatarUrl ?? "").trim();
  if (customAvatar) return customAvatar;
  const googleAvatar = (user.googleAvatarUrl ?? "").trim();
  if (googleAvatar) return googleAvatar;
  return null;
}
