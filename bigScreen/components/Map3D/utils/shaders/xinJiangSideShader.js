
export const modifyXinJiangSideShader = (material, uniforms) => {
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
        uniform float uTime; // 时间变量
        uniform vec3 uColor; // 流光颜色
        void main() {
        `
    })
    shader.fragmentShader = shader.fragmentShader.replace('vec4 diffuseColor = vec4( diffuse, opacity );', () => {
      return `
        vec4 diffuseColor = vec4( diffuse, opacity );
        // 混合流光颜色和底色
        float flow = abs(sin(vWordPosition.y - uTime / 1.5));
     
        vec3 finalColor = mix(diffuseColor.rgb, uColor, flow);
        diffuseColor.rgb = finalColor;
        `
    })
  }
}
