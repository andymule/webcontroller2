// client/src/GlowPipeline.js
import Phaser from "phaser";

const fragShader = `
precision mediump float;
uniform sampler2D uMainSampler;
varying vec2 outTexCoord;

void main() {
    vec4 color = texture2D(uMainSampler, outTexCoord);
    float brightness = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    float glow = smoothstep(0.6, 1.0, brightness) * 0.5;
    gl_FragColor = vec4(color.rgb + glow, color.a);
}
`;

// Note: Extend from Phaser.Renderer.WebGL.Pipelines.PostFXPipeline
export default class GlowPipeline extends Phaser.Renderer.WebGL.Pipelines
  .PostFXPipeline {
  constructor(game) {
    super({
      game: game,
      name: "GlowPipeline",
      fragShader: fragShader,
    });
  }
}
