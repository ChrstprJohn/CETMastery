export async function ensureProfile(prisma, user) {
  const name = user.user_metadata?.full_name;
  try {
    return await prisma.profile.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        displayName: typeof name === 'string' ? name.trim().slice(0, 120) || null : null,
      },
      update: {},
    });
  } catch (error) {
    // Simultaneous OAuth callbacks can both attempt the first profile insert.
    if (error.code === 'P2002') return prisma.profile.findUniqueOrThrow({ where: { id: user.id } });
    throw error;
  }
}
