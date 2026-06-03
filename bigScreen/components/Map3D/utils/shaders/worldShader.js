
export const modifyWorldShader = (material, uniforms) => {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader.replace('void main() {', () => {
      return `
        varying vec3 vWordPosition;
        void main() {
          vWordPosition = (modelMatrix * vec4(position, 1.0)).xyz;
        `
    })
    shader.fragmentShader = shader.fragmentShader.replace('void main() {', () => {
      return `
        varying vec3 vWordPosition;
        uniform float uRadius;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        void main() {
        `
    })
    shader.fragmentShader = shader.fragmentShader.replace('vec4 diffuseColor = vec4( diffuse, opacity );', () => {
      return `
        vec4 diffuseColor = vec4( diffuse, opacity );
        float d = distance(vWordPosition.xz, vec2(0, 0));
        if (d > uRadius || d < -uRadius) {
          diffuseColor.rgb = uColor2;
        } else {
          diffuseColor.rgb = mix(uColor1, uColor2, d / uRadius);
        }
        `
    })
  }
}
