import type { LayoutRecord } from './types.ts';

export function layoutStrategySignature(layout: Pick<LayoutRecord, 'furniture' | 'zones' | 'priorityTags'>): string {
  const furniture = layout.furniture
    .filter((item) => item.type !== 'door' && item.type !== 'window')
    .map((item) => `${item.type}:${item.rotationDeg}:${Math.round(item.xMm / 100)}:${Math.round(item.yMm / 100)}`)
    .sort()
    .join('|');
  return `${furniture}::zones=${[...layout.zones].sort().join(',')}::priority=${[...layout.priorityTags].sort().join(',')}`;
}

export function distinctivenessScore(layout: Pick<LayoutRecord, 'furniture' | 'zones' | 'priorityTags'>, peers: readonly LayoutRecord[]): number {
  const signature = layoutStrategySignature(layout);
  const duplicate = peers.some((peer) => layoutStrategySignature(peer) === signature);
  return duplicate ? 0 : 1;
}
