// Per-instance socket registry. Cross-instance presence facts (who's online) are
// derived from the User.status field in Mongo, which every instance updates,
// so "is user X online" stays correct even with multiple server processes.
const userSockets = new Map<string, Set<string>>();

export function addSocket(userId: string, socketId: string): number {
  const set = userSockets.get(userId) ?? new Set<string>();
  set.add(socketId);
  userSockets.set(userId, set);
  return set.size;
}

export function removeSocket(userId: string, socketId: string): number {
  const set = userSockets.get(userId);
  if (!set) return 0;
  set.delete(socketId);
  if (set.size === 0) {
    userSockets.delete(userId);
    return 0;
  }
  userSockets.set(userId, set);
  return set.size;
}

export function isUserConnectedLocally(userId: string): boolean {
  return (userSockets.get(userId)?.size ?? 0) > 0;
}
