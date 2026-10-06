export function getRemainingMilliseconds(homeTime: string, now: Date): number {
  if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(homeTime)) {
    throw new Error('homeTime must use the HH:mm format.');
  }

  const [hours, minutes] = homeTime.split(':').map(Number);

  const target = new Date(now.getTime());
  target.setHours(hours, minutes, 0, 0);

  return target.getTime() - now.getTime();
}
