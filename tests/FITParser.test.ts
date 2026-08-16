import { describe, it, expect } from 'vitest';
import { FITParserService } from '../src/services/FITParserService';

describe('FITParserService', () => {
  it('should throw error on malformed or too small buffer', () => {
    const tinyBuffer = new ArrayBuffer(5);
    expect(() => FITParserService.parseFIT(tinyBuffer)).toThrow('Invalid FIT file: buffer size too small');
  });

  it('should throw error on invalid header signature', () => {
    const buffer = new ArrayBuffer(16);
    const view = new DataView(buffer);
    view.setUint8(0, 14); // header size
    view.setUint8(8, 65); // 'A'
    view.setUint8(9, 66); // 'B'
    view.setUint8(10, 67); // 'C'
    view.setUint8(11, 68); // 'D'
    expect(() => FITParserService.parseFIT(buffer)).toThrow('Missing .FIT header signature');
  });

  it('should decode a valid binary FIT header and return a GhostVector', () => {
    const buffer = new ArrayBuffer(64);
    const view = new DataView(buffer);
    view.setUint8(0, 14); // 14-byte header
    view.setUint8(1, 0x10); // protocol 1.0
    view.setUint16(2, 2100, true); // profile 21.00
    view.setUint32(4, 50, true); // data size 50 bytes

    // .FIT signature
    view.setUint8(8, 0x2e); // '.'
    view.setUint8(9, 0x46); // 'F'
    view.setUint8(10, 0x49); // 'I'
    view.setUint8(11, 0x54); // 'T'

    const vector = FITParserService.parseFIT(buffer);
    expect(vector).toBeDefined();
    expect(vector.points).toBeDefined();
    expect(vector.points.length).toBeGreaterThan(0);
    expect(vector.totalDistance).toBeGreaterThan(0);
  });
});
