declare module 'gpxparser' {
  export interface GpxPoint {
    lat: number;
    lon: number;
    ele: number;
    time: Date | string;
  }

  export interface GpxTrack {
    name: string;
    comment: string;
    desc: string;
    src: string;
    number: string;
    link: string;
    type: string;
    points: GpxPoint[];
    distance: {
      total: number;
      cumul: number[];
    };
    elevation: {
      max: number;
      min: number;
      pos: number;
      neg: number;
      avg: number;
    };
  }

  export default class GpxParser {
    xmlSource: string;
    metadata: any;
    waypoints: any[];
    tracks: GpxTrack[];
    routes: any[];
    parse(xmlString: string): void;
  }
}
