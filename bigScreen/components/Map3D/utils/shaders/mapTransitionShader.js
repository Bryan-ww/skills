
export const mapTransitionShader = (material, uniforms) => {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader.replace('void main() {', () => {
      return `
        varying vec3 vWordPosition;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vWordPosition = (modelMatrix * vec4(position, 1.0)).xyz;
        `
    })
    shader.fragmentShader = shader.fragmentShader.replace('void main() {', () => {
      return `
        varying vec3 vWordPosition;
        varying vec2 vUv;
        uniform sampler2D uTexture1;
        uniform sampler2D uTexture2;
        uniform float uRatio;
        void main() {
        `
    })
    shader.fragmentShader = shader.fragmentShader.replace('vec4 diffuseColor = vec4( diffuse, opacity );', () => {
      return `
        vec4 texture1 = texture2D(uTexture1, vUv);
        vec4 texture2 = texture2D(uTexture2, vUv);
        vec4 diffuseColor = mix(texture1, texture2, uRatio);
        // vec4 diffuseColor = vec4(1.0, 0.0, 0.0, 1.0);
        `
    })
  }
}
