
import { BaseTexture } from "@babylonjs/core/Materials/Textures/baseTexture";
import { Constants } from "@babylonjs/core/Engines/constants";
import { PrecisionDate } from "@babylonjs/core/Misc/precisionDate";
import { EffectWrapper, EffectRenderer } from "@babylonjs/core/Materials/effectRenderer";
import "@babylonjs/core/Engines/Extensions/engine.rawTexture";
import { AnimatedGifShaderConfiguration } from "./animatedGifTextureShader";
import { parseGIF, decompressFrames } from "gifuct-js";
export class AnimatedGifTexture extends BaseTexture {
    _onLoad

    _frames = null;
    _currentFrame
    _previousFrame
    _nextFrameIndex = 0;
    _previousDate

    _patchEffectWrapper;
    _patchEffectRenderer;
    _renderLoopCallback

    _renderTarget;
    constructor(url, engine, onLoad = null) {
        super(engine);

        this.name = url;
        this._onLoad = onLoad;

        this._createInternalTexture();
        this._createRenderer();
        this._createRenderLoopCallback();
        this._loadGifTexture();
    }

    _createInternalTexture() {
        this._texture = this._engine.createRawTexture(null, 1, 1, Constants.TEXTUREFORMAT_RGBA, false, false, Constants.TEXTURE_BILINEAR_SAMPLINGMODE, null, Constants.TEXTURETYPE_UNSIGNED_INT);

        // Do not be ready before the data has been loaded
        this._texture.isReady = false;

        // Setups compatibility with gl1
        this.wrapU = Constants.TEXTURE_CLAMP_ADDRESSMODE;
        this.wrapV = Constants.TEXTURE_CLAMP_ADDRESSMODE;
        this.wrapR = Constants.TEXTURE_CLAMP_ADDRESSMODE;
        this.anisotropicFilteringLevel = 1;
    }

    _createRenderer() {
        // Creates a wrapper around our custom shader
        this._patchEffectWrapper = new EffectWrapper({
            ...AnimatedGifShaderConfiguration,
            engine: this._engine,
        });

        // Creates a dedicated fullscreen renderer for the frame blit
        this._patchEffectRenderer = new EffectRenderer(this._engine, {
            positions: [1, 1, 0, 1, 0, 0, 1, 0]
        });
    }

    _createRenderLoopCallback() {
        this._renderLoopCallback = () => {
            this._renderFrame();
        };
    }

    _loadGifTexture() {
        // Defines what happens after we read the data from the url
        const callback = (buffer) => {
            this._parseGifData(buffer);
            this._createGifResources();

            // Start Rendering the sequence of frames
            this._engine.runRenderLoop(this._renderLoopCallback);
        };

        // Load the array buffer from the Gif file
        this._engine._loadFile(this.name, callback, undefined, undefined, true);
    }

    _parseGifData(buffer) {
        const gifData = parseGIF(buffer);
        this._frames = decompressFrames(gifData, true);
    }

    _createGifResources() {
        for (let frame of this._frames) {
            frame.texture = this._engine.createRawTexture(new Uint8Array(frame.patch.buffer),
                frame.dims.width,
                frame.dims.height,
                Constants.TEXTUREFORMAT_RGBA,
                false,
                true,
                Constants.TEXTURE_NEAREST_SAMPLINGMODE,
                null,
                Constants.TEXTURETYPE_UNSIGNED_INT);
            const sx = frame.dims.width / this._frames[0].dims.width;
            const sy = frame.dims.height / this._frames[0].dims.height;
            const tx = frame.dims.left / this._frames[0].dims.width;
            // As we render from the bottom, the translation needs to be computed accordingly
            const ty = (this._frames[0].dims.height - (frame.dims.top + frame.dims.height)) / this._frames[0].dims.height;
            frame.worldMatrix = new Float32Array([
                sx, 0, tx,
                0, sy, ty,
                0, 0, 1,
            ]);

            // Ensures webgl 1 compat
            this._engine.updateTextureWrappingMode(frame.texture, Constants.TEXTURE_CLAMP_ADDRESSMODE, Constants.TEXTURE_CLAMP_ADDRESSMODE);
        }

        // Creates our main render target based on the Gif dimensions
        this._renderTarget = this._engine.createRenderTargetTexture(this._frames[0].dims, {
            format: Constants.TEXTUREFORMAT_RGBA,
            generateDepthBuffer: false,
            generateMipMaps: false,
            generateStencilBuffer: false,
            samplingMode: Constants.TEXTURE_BILINEAR_SAMPLINGMODE,
            type: Constants.TEXTURETYPE_UNSIGNED_BYTE
        });

        // Release the extra resources from the current internal texture
        this._engine._releaseTexture(this._texture);

        // Swap our internal texture by our new render target one
        this._renderTarget.texture._swapAndDie(this._texture);

        // And adapt its data
        this._engine.updateTextureWrappingMode(this._texture, Constants.TEXTURE_CLAMP_ADDRESSMODE, Constants.TEXTURE_CLAMP_ADDRESSMODE);
        this._texture.width = this._frames[0].dims.width;
        this._texture.height = this._frames[0].dims.height;
        this._texture.isReady = false;
    }

    _renderFrame() {
        // Keep the current frame as long as specified in the Gif data
        if (this._currentFrame && (PrecisionDate.Now - this._previousDate) < this._currentFrame.delay) {
            return;
        }

        // Replace the current frame
        this._currentFrame = this._frames[this._nextFrameIndex];

        // Patch the texture
        this._drawPatch();

        // Recall the current draw time for this frame.
        this._previousDate = PrecisionDate.Now;

        // Update the next frame index
        this._nextFrameIndex++;
        if (this._nextFrameIndex >= this._frames.length) {
            this._nextFrameIndex = 0;
        }
    }
    _drawPatch() {
        // The texture is only ready when we are able to render
        if (!this._patchEffectWrapper.effect.isReady()) {
            return;
        }

        // Get the current frame
        const frame = this._currentFrame;

        // Record the old viewport
        const oldViewPort = this._engine.currentViewport;

        // Clear the previous frame if requested in the Gif data
        if (this._previousFrame && (this._previousFrame.disposalType === 2 || this._nextFrameIndex === 0)) {
            // We need to apply our special inputs to the effect when it renders
            this._patchEffectWrapper.onApplyObservable.addOnce(() => {
                this._patchEffectWrapper.effect.setFloat4("color", 0, 0, 0, 0);
                this._patchEffectWrapper.effect.setMatrix3x3("world", this._previousFrame.worldMatrix);
                this._patchEffectWrapper.effect._bindTexture("textureSampler", this._previousFrame.texture);
            });

            this._patchEffectRenderer.render(this._patchEffectWrapper, this._renderTarget);
        }

        // We need to apply our special inputs to the effect when it renders
        this._patchEffectWrapper.onApplyObservable.addOnce(() => {
            this._patchEffectWrapper.effect.setFloat4("color", 1, 1, 1, 1);
            this._patchEffectWrapper.effect.setMatrix3x3("world", frame.worldMatrix);
            this._patchEffectWrapper.effect._bindTexture("textureSampler", frame.texture);
        });

        this._patchEffectRenderer.render(this._patchEffectWrapper, this._renderTarget);

        this._previousFrame = frame;

        this._engine.setViewport(oldViewPort);

        if (!this._texture.isReady) {
            this._texture.isReady = true;
            this._onLoad && this._onLoad();
        }
    }
    dispose() {
        this._engine.stopRenderLoop(this._renderLoopCallback);

        this._patchEffectWrapper.dispose();
        this._patchEffectRenderer.dispose();

        for (let frame of this._frames) {
            frame.texture.dispose();
        }
        this._renderTarget.dispose();

        super.dispose();
    }
}