const MINUTE = 60_000;
const MESSAGE_ROTATION_INTERVAL = 5 * MINUTE;

export type CatState =
  | 'sleeping'
  | 'playing'
  | 'looking_at_door'
  | 'waiting'
  | 'angry'
  | 'given_up_on_you';

export interface CatMessage {
  state: CatState;
  text: string;
  tooltip: string;
}

export function getCatState(remainingMilliseconds: number): CatState {
  if (remainingMilliseconds > 120 * MINUTE) {
    return 'sleeping';
  }

  if (remainingMilliseconds > 60 * MINUTE) {
    return 'playing';
  }

  if (remainingMilliseconds > 15 * MINUTE) {
    return 'looking_at_door';
  }

  if (remainingMilliseconds >= -30 * MINUTE) {
    return 'waiting';
  }

  if (remainingMilliseconds >= -90 * MINUTE) {
    return 'angry';
  }

  return 'given_up_on_you';
}

export function getCatMessage(
  catName: string,
  remainingMilliseconds: number,
  now: Date,
): CatMessage {
  const state = getCatState(remainingMilliseconds);
  const isOvertime = remainingMilliseconds < 0;

  const totalMinutes = isOvertime
    ? Math.floor(-remainingMilliseconds / MINUTE)
    : Math.ceil(remainingMilliseconds / MINUTE);

  const duration =
    isOvertime && totalMinutes === 0
      ? 'less than 1 min'
      : formatDuration(totalMinutes);

  const messages: Record<CatState, string[]> = {
    sleeping: [
      `🐈 ${catName} · Napping until you get home.`,
      `🐈 ${catName} · ${duration} left. Time for another nap.`,
      `🐈 ${catName} · Currently working on a dream.`,
      `🐈 ${catName} · Do not disturb the loaf.`,
    ],
    playing: [
      `🐈 ${catName} · The cardboard box is winning.`,
      `🐈 ${catName} · ${duration} until the human returns.`,
      `🐈 ${catName} · Hunting a very suspicious sock.`,
      `🐈 ${catName} · Your absence has become a side quest.`,
    ],
    looking_at_door: [
      `🐈 ${catName} · Was that your key?`,
      `🐈 ${catName} · ${duration} until home.`,
      `🐈 ${catName} · Door inspection in progress.`,
      `🐈 ${catName} · Listening for familiar footsteps.`,
    ],
    waiting: isOvertime
      ? [
          `🐈 ${catName} expected you ${duration} ago.`,
          `🐈 ${catName} · The welcome committee is still waiting.`,
          `🐈 ${catName} · ${duration} late. Probably just traffic.`,
          `🐈 ${catName} · Checking the door. Again.`,
        ]
      : [
          `🐈 ${catName} · ${duration} until home.`,
          `🐈 ${catName} · Your usual spot is being kept warm.`,
          `🐈 ${catName} · Ready for the welcome-home headbutt.`,
          `🐈 ${catName} · The door has my full attention.`,
        ],
    angry: [
      `🐈 ${catName} is beginning to question your priorities.`,
      `🐈 Another "quick fix"?`,
      `🐈 ${catName} · Your keyboard gets a lot of attention.`,
      `🐈 ${catName} · ${duration} late. This will be remembered.`,
    ],
    given_up_on_you: [
      `🐈 ${catName} · Fine. Your chair is mine now.`,
      `🐈 ${catName} · I live alone now, apparently.`,
      `🐈 ${catName} · ${duration} late. The human is a myth.`,
      `🐈 ${catName} · You may apply for forgiveness on arrival.`,
    ],
  };

  const candidates = messages[state];
  const rotationSlot = Math.floor(now.getTime() / MESSAGE_ROTATION_INTERVAL);
  const messageIndex = rotationSlot % candidates.length;

  const tooltip =
    remainingMilliseconds === 0
      ? `It's home time! ${catName} is waiting.`
      : isOvertime
        ? `${duration} past your expected home time.`
        : `${duration} until your expected home time.`;

  return {
    state,
    text: candidates[messageIndex],
    tooltip: `${tooltip} Code faster. Your cat is waiting.`,
  };
}

function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes} min`;
  }

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes} min`;
}
