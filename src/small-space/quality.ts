import type { LayoutStatus } from './types.ts';

export interface ReviewGateResult {
  geometry: boolean;
  functional: boolean;
  visual: boolean;
  distinctiveness: boolean;
  reason?: string;
}

export function advanceLayoutStatus(current: LayoutStatus, gates: ReviewGateResult): { status: LayoutStatus; rejectionReason?: string } {
  if (current === 'rejected') return { status: 'rejected', rejectionReason: gates.reason ?? 'already rejected' };
  if (!gates.geometry) return { status: 'rejected', rejectionReason: gates.reason ?? 'geometry review failed' };
  if (!gates.functional) return { status: 'rejected', rejectionReason: gates.reason ?? 'functional review failed' };
  if (!gates.visual) return { status: 'rejected', rejectionReason: gates.reason ?? 'visual review failed' };
  if (!gates.distinctiveness) return { status: 'rejected', rejectionReason: gates.reason ?? 'distinctiveness review failed' };
  return { status: 'approved' };
}
