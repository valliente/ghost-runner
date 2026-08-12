import Phaser from 'phaser';

const CRTFragShader = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform sampler2D uMainSampler;
varying vec2 outTexCoord;
uniform vec2 uResolution;
uniform float uTime;

void main() {
  vec2 uv = outTexCoord;

  // CRT Barrel Curvature distortion
  vec2 cc = uv - 0.5;
  float dist = dot(cc, cc);
  uv = uv + cc * dist * 0.08;

  // Vignette boundary check
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  // Chromatic Aberration
  float shift = 0.002;
  vec4 colorR = texture2D(uMainSampler, vec2(uv.x + shift, uv.y));
  vec4 colorG = texture2D(uMainSampler, uv);
  vec4 colorB = texture2D(uMainSampler, vec2(uv.x - shift, uv.y));

  vec4 col = vec4(colorR.r, colorG.g, colorB.b, colorG.a);

  // Scanline overlay
  float scanline = sin(uv.y * uResolution.y * 1.5 + uTime * 5.0) * 0.06;
  col.rgb -= scanline;

  // Subtle CRT Flicker
  col.rgb *= 0.97 + 0.03 * sin(uTime * 10.0);

  gl_FragColor = col;
}
`;

const BasePostFX = (Phaser.Renderer.WebGL as any)?.Pipelines?.PostFXPipeline || (Phaser.Renderer.WebGL as any)?.PostFXPipeline;

export class CRTPostFilter extends (BasePostFX || class {}) {
  private _time: number = 0;

  constructor(game: Phaser.Game) {
    super({
      game,
      name: 'CRTPostFilter',
      frag: CRTFragShader
    });
  }

  onPreRender() {
    this._time += 0.016;
    if (typeof (this as any).set1f === 'function') {
      (this as any).set1f('uTime', this._time);
      (this as any).set2f('uResolution', 800, 450);
    }
  }
}
