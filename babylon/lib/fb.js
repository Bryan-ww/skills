import * as BABYLON from "@babylonjs/core";


const vertexShader_c = `
// 顶点着色器（vertexShader.glsl）
precision highp float;
attribute vec3 position;
attribute vec2 uv;
varying vec2 vUV;
uniform mat4 worldViewProjection;

void main() {
    vUV = uv;
    gl_Position = worldViewProjection * vec4(position, 1.0);
}
    `

const fragmentShader_c = `
    // 片元着色器（fragmentShader.glsl）
precision highp float;
varying vec2 vUV;
uniform sampler2D textureFront;
uniform sampler2D textureBack;

void main() {
    if (gl_FrontFacing) {
        gl_FragColor = texture2D(textureFront, vUV);
    } else {
        gl_FragColor = texture2D(textureBack, vUV);
    }
}
    `




export const fb_shaderMaterial = (name, scene) => {
    return new BABYLON.ShaderMaterial(name, scene, {
        vertexSource: vertexShader_c,
        fragmentSource: fragmentShader_c,
    }, {
        attributes: ["position", "normal", "uv"],
        uniforms: ["world", "worldViewProjection"],
    });

}

