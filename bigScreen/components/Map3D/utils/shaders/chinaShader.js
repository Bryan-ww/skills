
export const modifyChinaTopShader = (material, uniforms) => {
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
        uniform float uTime; // 时间变量
        uniform vec3 uColor; // 流光颜色
        varying vec2 vUv;
        void main() {
        `
    })
    shader.fragmentShader = shader.fragmentShader.replace('vec4 diffuseColor = vec4( diffuse, opacity );', () => {
      return `
        vec4 diffuseColor = vec4( diffuse, opacity );
        // 流光的位置，随着时间变化，在x方向移动
        // float flow = mod(vUv.x + abs(sin(uTime)), 1.0);
        // float flow = vUv.x * abs(sin(uTime));
        // 混合流光颜色和底色
        float flow = abs(sin(vUv.x - uTime / 2.0));
     
        vec3 finalColor = mix(diffuseColor.rgb, uColor, flow);
        diffuseColor.rgb = finalColor;
        `
    })
  }
}
