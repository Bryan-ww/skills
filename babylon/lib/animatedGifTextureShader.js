import * as BABYLON from "@babylonjs/core";


const vertexShader = `
// Attributes
attribute vec2 position;

// Transform matrix to offset the patch
uniform mat3 world;

// Output
varying vec2 vUV;

void main(void) {
    // We chose position from 0 to 1 to simplify to matrix computation
    // So the UVs will be a straight match
    vUV = position;

    // Transform to the requested patch location
    vec3 wPosition = vec3(position, 1) * world;

    // Go back from 0 to 1 to -1 to 1 for clip space coordinates
    wPosition = wPosition * 2.0 - 1.0;

    // Assign the location (depth is disabled in the pipeline)
    gl_Position = vec4(wPosition.xy, 0.0, 1.0);
}`;

const fragmentShader = `
// Inputs from vertex
varying vec2 vUV;

// Color Lookup
uniform sampler2D textureSampler;

// Color mix
uniform vec4 color;

void main(void) 
{
    // We simply display the color from the texture
    vec2 uv = vec2(vUV.x, 1.0 - vUV.y);
    vec4 finalColor = texture2D(textureSampler, vUV) * color;

    // With a pinch of alpha testing as defined in the data
    // Else everything could have been handled in a texSubImage2d.
    if (color.a == 1. && finalColor.a == 0.) {
        discard;
    }

    gl_FragColor = finalColor;
}`;

export const AnimatedGifShaderConfiguration = {
    name: "Patch",
    vertexShader,
    fragmentShader,
    samplerNames: ["textureSampler"],
    uniformNames: ["world", "color"],
}

