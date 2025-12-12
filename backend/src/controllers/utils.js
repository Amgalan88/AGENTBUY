function safeUser(user) {
  return {
    id: user.id || user._id, // Support both Prisma (id) and Mongoose (_id)
    phone: user.phone,
    email: user.email,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
    roles: user.roles,
    cardBalance: user.cardBalance,
    cardProgress: user.cardProgress,
    defaultCargoId: user.defaultCargoId,
  };
}

module.exports = { safeUser };
