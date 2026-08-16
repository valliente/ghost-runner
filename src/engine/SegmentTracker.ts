export interface RouteSegment {
  id: string;
  name: string;
  startDistanceMeters: number;
  endDistanceMeters: number;
  segmentRecordSeconds: number;
  segmentBestPaceMinKm: number;
}

export type SegmentStatus = 'UPCOMING' | 'ACTIVE' | 'COMPLETED';

export interface SegmentLiveState {
  segment: RouteSegment;
  status: SegmentStatus;
  distanceIntoSegment: number;
  remainingDistanceMeters: number;
  segmentElapsedSeconds: number;
  segmentTargetSeconds: number;
  deltaSeconds: number; // Negative = faster than PR, Positive = slower
}

export class SegmentTracker {
  private segments: RouteSegment[] = [];
  private activeSegmentIndex: number = -1;
  private segmentStartTimestamp: number = 0;
  private completedSegmentIds: Set<string> = new Set();

  constructor(segments: RouteSegment[] = []) {
    this.segments = segments.length > 0 ? segments : SegmentTracker.getDefaultSegments();
  }

  public static getDefaultSegments(): RouteSegment[] {
    return [
      {
        id: 'seg_neon_sprint_1',
        name: '⚡ Neon Hill Climb (400m)',
        startDistanceMeters: 1000,
        endDistanceMeters: 1400,
        segmentRecordSeconds: 82,
        segmentBestPaceMinKm: 3.42
      },
      {
        id: 'seg_cyber_bridge_2',
        name: '🌉 Cyber Bridge Dash (800m)',
        startDistanceMeters: 2500,
        endDistanceMeters: 3300,
        segmentRecordSeconds: 175,
        segmentBestPaceMinKm: 3.65
      }
    ];
  }

  public reset(): void {
    this.activeSegmentIndex = -1;
    this.segmentStartTimestamp = 0;
    this.completedSegmentIds.clear();
  }

  /**
   * Evaluates current runner distance and timestamp against segments.
   */
  public update(currentDistanceMeters: number, elapsedSeconds: number): SegmentLiveState | null {
    // 1. Check if currently in an active segment
    if (this.activeSegmentIndex >= 0) {
      const seg = this.segments[this.activeSegmentIndex];
      const distanceIntoSegment = currentDistanceMeters - seg.startDistanceMeters;
      const remainingDistanceMeters = Math.max(0, seg.endDistanceMeters - currentDistanceMeters);
      const segmentElapsedSeconds = elapsedSeconds - this.segmentStartTimestamp;

      // Target time for distance covered so far based on record
      const segLength = seg.endDistanceMeters - seg.startDistanceMeters;
      const expectedTimeForDist = (distanceIntoSegment / segLength) * seg.segmentRecordSeconds;
      const deltaSeconds = segmentElapsedSeconds - expectedTimeForDist;

      if (currentDistanceMeters >= seg.endDistanceMeters) {
        // Segment finished
        this.completedSegmentIds.add(seg.id);
        this.activeSegmentIndex = -1;

        return {
          segment: seg,
          status: 'COMPLETED',
          distanceIntoSegment: segLength,
          remainingDistanceMeters: 0,
          segmentElapsedSeconds,
          segmentTargetSeconds: seg.segmentRecordSeconds,
          deltaSeconds
        };
      }

      return {
        segment: seg,
        status: 'ACTIVE',
        distanceIntoSegment,
        remainingDistanceMeters,
        segmentElapsedSeconds,
        segmentTargetSeconds: expectedTimeForDist,
        deltaSeconds
      };
    }

    // 2. Check if entering any new segment
    for (let i = 0; i < this.segments.length; i++) {
      const seg = this.segments[i];
      if (this.completedSegmentIds.has(seg.id)) continue;

      if (currentDistanceMeters >= seg.startDistanceMeters && currentDistanceMeters < seg.endDistanceMeters) {
        this.activeSegmentIndex = i;
        this.segmentStartTimestamp = elapsedSeconds;

        return {
          segment: seg,
          status: 'ACTIVE',
          distanceIntoSegment: 0,
          remainingDistanceMeters: seg.endDistanceMeters - seg.startDistanceMeters,
          segmentElapsedSeconds: 0,
          segmentTargetSeconds: 0,
          deltaSeconds: 0
        };
      }
    }

    return null;
  }
}
