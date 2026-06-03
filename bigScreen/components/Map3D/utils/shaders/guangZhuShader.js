
export const modifyGuangZhuShader = (material, uniforms) => {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader.replace('void main() {', () => {
      return `
        varying vec3 vWordPosition;
        void main() {
          vWordPosition = position;
        `
    })
    shader.fragmentShader = shader.fragmentShader.replace('void main() {', () => {
      return `
        varying vec3 vWordPosition;
        uniform float uStartZ;
        uniform float uHeight;
        uniform float uOpacity;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        void main() {
        `
    })
    shader.fragmentShader = shader.fragmentShader.replace('vec4 diffuseColor = vec4( diffuse, opacity );', () => {
      return `
        float t = vWordPosition.z / uHeight;
        float tempOpacity = smoothstep(0.0, 1.0, (uOpacity - t) * 0.9);
        vec3 tempColor = mix(uColor1, uColor2, t);
     
        vec4 diffuseColor = vec4( tempColor, tempOpacity );
        `
    })
  }
}
