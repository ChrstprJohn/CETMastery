export async function ensureProfile(prisma, user) {
  const metadata = user.user_metadata ?? {};
  const firstName = text(metadata.given_name, 120) ?? text(metadata.first_name, 120);
  const lastName = text(metadata.family_name, 120) ?? text(metadata.last_name, 120);
  try {
    return await prisma.profile.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        displayName: text(metadata.full_name, 120) ?? text(metadata.name, 120) ?? text([firstName, lastName].filter(Boolean).join(' '), 120),
        firstName,
        lastName,
        avatarUrl: avatar(metadata.avatar_url) ?? avatar(metadata.picture),
        locale: locale(metadata.locale),
      },
      update: {},
    });
  } catch (error) {
    // Simultaneous OAuth callbacks can both attempt the first profile insert.
    if (error.code === 'P2002') return prisma.profile.findUniqueOrThrow({ where: { id: user.id } });
    throw error;
  }
}

function text(value, limit) {
  return typeof value === 'string' ? Array.from(value.trim()).slice(0, limit).join('') || null : null;
}

function avatar(value) {
  if (typeof value !== 'string' || value.length > 2048) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

function locale(value) {
  if (typeof value !== 'string' || value.length > 35) return null;
  try { return Intl.getCanonicalLocales(value.trim())[0] ?? null; }
  catch { return null; }
}
