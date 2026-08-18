export const VOLUMETRIC_NEON_FRAG = `
#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;
uniform vec2 lightPosition; // Normalized 0..1 screen coords
uniform vec3 lightColor;    // RGB neon color tint
uniform float rayDensity;
uniform float decay;
uniform float weight;
uniform float exposure;

varying vec2 outTexCoord;
uniform sampler2D uMainSampler;

void main(void) {
    vec2 textCoo = outTexCoord;
    vec2 deltaTextCoord = textCoo - lightPosition;
    deltaTextCoord *= 1.0 / float(16) * rayDensity;
    
    vec4 color = texture2D(uMainSampler, textCoo);
    float illuminationDecay = 1.0;
    
    // Sample 16 ray steps along light vector
    for(int i = 0; i < 16; i++) {
        textCoo -= deltaTextCoord;
        vec4 sampleColor = texture2D(uMainSampler, textCoo);
        sampleColor *= illuminationDecay * weight;
        color += sampleColor;
        illuminationDecay *= decay;
    }
    
    // Apply neon tint and exposure
    vec3 finalColor = color.rgb * lightColor * exposure;
    gl_FragColor = vec4(finalColor, color.a);
}
`;

export interface NeonLightSource {
  id: string;
  x: number; // Screen X
  y: number; // Screen Y
  color: [number, number, number]; // Normalized RGB
  intensity: number;
  radius: number;
}

export class VolumetricLightRenderer {
  private lights: NeonLightSource[] = [];
  public width: number = 800;
  public height: number = 450;

  constructor(width: number = 800, height: number = 450) {
    this.width = width;
    this.height = height;
  }

  public addLight(light: NeonLightSource): void {
    this.lights.push(light);
  }

  public clearLights(): void {
    this.lights = [];
  }

  /**
   * Calculates dynamic drop-shadow offset and distortion on ground plane based on light source.
   */
  public calculateShadowOffset(runnerX: number, runnerY: number): { offsetX: number; offsetY: number; scaleX: number; alpha: number } {
    if (this.lights.length === 0) {
      return { offsetX: 0, offsetY: 12, scaleX: 1.0, alpha: 0.4 };
    }

    // Find closest active light
    let closestDist = Infinity;
    let closestLight = this.lights[0];

    for (const light of this.lights) {
      const dx = runnerX - light.x;
      const dy = runnerY - light.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < closestDist) {
        closestDist = dist;
        closestLight = light;
      }
    }

    const dirX = (runnerX - closestLight.x) / Math.max(1, closestDist);
    const shadowOffsetX = dirX * Math.min(35, closestDist * 0.15);
    const shadowOffsetY = 14 + Math.abs(dirX) * 2;
    const shadowAlpha = Math.max(0.2, Math.min(0.65, 1.0 - closestDist / closestLight.radius));

    return {
      offsetX: shadowOffsetX,
      offsetY: shadowOffsetY,
      scaleX: 1.0 + Math.abs(dirX) * 0.4,
      alpha: shadowAlpha
    };
  }

  /**
   * Procedural canvas fall-back rendering of volumetric glow cones.
   */
  public renderLightCones(ctx: CanvasRenderingContext2D): void {
    for (const light of this.lights) {
      const grad = ctx.createRadialGradient(light.x, light.y, 4, light.x, light.y, light.radius);
      const [r, g, b] = light.color.map((c) => Math.round(c * 255));
      grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${light.intensity * 0.8})`);
      grad.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, ${light.intensity * 0.3})`);
      grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(light.x, light.y, light.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
