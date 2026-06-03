<template>
  <div ref="container" class="player">
    <div style="width: 100%; padding-top: 56.25%; position: relative"></div>
    <div class="player-buttons-box" id="buttonsBox">
      <div class="buttons-box-left">
        <span v-if="!playing" class="player-btn icon-play" @click="playBtnClick">播放</span>
        <span v-if="playing" class="player-btn icon-pause" @click="pause">暂停</span>
        <span class="player-btn icon-stop" @click="destroy">停止</span>
        <template v-if="hasAudio">
          <span v-if="isNotMute" class="player-btn icon-audio" @click="mute()">静音</span>
          <span v-if="!isNotMute" class="player-btn icon-audio-mute" @click="cancelMute()">取消静音</span>
        </template>
      </div>
      <div class="buttons-box-right">
        <span v-if="hasControl" class="player-btn icon-control" @click="controlCloud = !controlCloud">云台</span>
        <span v-if="hasTalk" class="player-btn icon-talk" @click="talkCloud = !talkCloud">语音对讲</span>
        <span class="player-btn icon-screenshot" @click="screenshot">截图</span>
        <span class="player-btn icon-refresh" @click="playBtnClick">刷新</span>
        <span v-if="!fullscreen" class="player-btn icon-full" @click="fullscreenSwich">全屏</span>
        <span v-if="fullscreen" class="player-btn icon-not-full" @click="fullscreenSwich">退出全屏</span>
      </div>
    </div>
    <div class="kbps-btn-box">
      <div class="name-box">{{ videoName }}</div>
      <div class="kbps-btn">{{ kBps }} kb/s</div>
      <el-icon v-if="showClose" class="close" @click="removeVideo">
        <Close />
      </el-icon>
    </div>
    <div v-if="controlCloud" class="player-control-box">
      <div class="control-title">
        云台控制
        <el-icon class="close" @click="controlCloud = false">
          <Close />
        </el-icon>
      </div>
      <div class="control-wrapper">
        <div class="control-btn control-top" @mousedown="ptzCamera('up')" @mouseup="ptzCamera('stop')">
          <el-icon>
            <ArrowUpBold />
          </el-icon>
        </div>
        <div class="control-btn control-right" @mousedown="ptzCamera('right')" @mouseup="ptzCamera('stop')">
          <el-icon>
            <ArrowRightBold />
          </el-icon>
        </div>
        <div class="control-btn control-bottom" @mousedown="ptzCamera('down')" @mouseup="ptzCamera('stop')">
          <el-icon>
            <ArrowDownBold />
          </el-icon>
        </div>
        <div class="control-btn control-left" @mousedown="ptzCamera('left')" @mouseup="ptzCamera('stop')">
          <el-icon>
            <ArrowLeftBold />
          </el-icon>
        </div>
      </div>
      <div class="control-speed">
        <el-slider v-model="controlSpeed" :max="100"></el-slider>
      </div>
      <div class="ptz-btn-box">
        <span class="ptz-btn" @mousedown="ptzCamera('zoomin')" @mouseup="ptzCamera('stop')">
          <el-icon>
            <ZoomIn />
          </el-icon>
        </span>
        变倍
        <span class="ptz-btn" @mousedown="ptzCamera('zoomout')" @mouseup="ptzCamera('stop')">
          <el-icon>
            <ZoomOut />
          </el-icon>
        </span>
      </div>
    </div>
    <div v-if="talkCloud" class="player-control-box">
      <div class="control-title">
        语音对讲
        <el-icon class="close" @click="talkCloud = false">
          <Close />
        </el-icon>
      </div>
      <div class="talk-speed">
        <el-switch v-model="broadcastMode" :disabled="broadcastStatus !== -1" active-color="#409EFF" active-text="喊话" inactive-text="对讲" :width="56"></el-switch>
      </div>
      <div class="talk-speed">
        <el-button @click="broadcastStatusClick()" :type="getBroadcastStatus()" :disabled="broadcastStatus === -2" circle icon="Microphone" />
      </div>
      <div class="talk-speed">
        <span v-if="broadcastStatus === -2">正在释放资源</span>
        <span v-if="broadcastStatus === -1">点击开始对讲</span>
        <span v-if="broadcastStatus === 0">等待接通中...</span>
        <span v-if="broadcastStatus === 1">请说话</span>
      </div>
    </div>
  </div>
</template>

<script>
  import { Close, ArrowUpBold, ArrowRightBold, ArrowDownBold, ArrowLeftBold, ZoomIn, ZoomOut, Microphone } from '@element-plus/icons-vue';
  const jessibucaPlayer = {};

  export default {
    name: 'jessibuca',
    components: {
      Close,
      ArrowUpBold,
      ArrowRightBold,
      ArrowDownBold,
      ArrowLeftBold,
      ZoomIn,
      ZoomOut,
      Microphone,
    },
    data() {
      return {
        playing: false,
        isNotMute: false,
        quieting: false,
        fullscreen: false,
        loaded: false, // mute
        speed: 0,
        performance: '', // 工作情况
        kBps: 0,
        btnDom: null,
        videoInfo: null,
        volume: 1,
        rotate: 0,
        vod: true, // 点播
        forceNoOffscreen: false,
        controlCloud: false,
        controlSpeed: 30,
        talkCloud: false,
        broadcastMode: true,
        broadcastRtc: null,
        broadcastStatus: -1, // -2 正在释放资源 -1 默认状态 0 等待接通 1 接通成功
      };
    },
    props: {
      videoUrl: {
        type: String,
        default: '',
      },
      videoName: {
        type: String,
        default: '',
      },
      error: {
        type: String,
        default: '',
      },
      height: {
        type: String,
        default: '',
      },
      id: {
        type: [String, Number],
        default: '',
      },
      hasAudio: {
        // 是否有音频
        type: Boolean,
        default: true,
      },
      hasControl: {
        // 是否显示云台
        type: Boolean,
        default: false,
      },
      hasTalk: {
        // 是否显示语音对讲
        type: Boolean,
        default: false,
      },
      showClose: {
        // 是否显示关闭按钮
        type: Boolean,
        default: true,
      },
    },

    created() {
      this.$nextTick(() => {
        this.updatePlayerDomSize();
        window.onresize = this.updatePlayerDomSize;
        this.btnDom = document.getElementById('buttonsBox');
      });
    },

    watch: {
      videoUrl: {
        handler(val, _) {
          this.$nextTick(() => {
            this.play(val);
          });
        },
        immediate: true,
      },
    },

    methods: {
      updatePlayerDomSize() {
        const dom = this.$refs.container;
        let width = dom.parentNode.clientWidth;
        let height = (9 / 16) * width;
        if (height > dom.clientHeight) {
          height = dom.clientHeight;
          width = (16 / 9) * height;
        }
        if (width > 0 && height > 0) {
          dom.style.width = width + 'px';
          dom.style.height = height + 'px';
          dom.style.paddingTop = 0;
        }
      },
      create() {
        const dom = this.$refs.container;
        const options = {
          container: dom,
          autoWasm: true,
          background: '',
          controlAutoHide: false,
          debug: false,
          decoder: 'static/js/jessibuca/decoder.js',
          forceNoOffscreen: false,
          hasAudio: typeof this.hasAudio == 'undefined' ? true : this.hasAudio,
          heartTimeout: 5,
          heartTimeoutReplay: true,
          heartTimeoutReplayTimes: 3,
          hiddenAutoPause: false,
          hotKey: true,
          isFlv: false,
          isFullResize: false,
          isNotMute: this.isNotMute,
          isResize: false,
          keepScreenOn: true,
          loadingText: '请稍等, 视频加载中......',
          loadingTimeout: 10,
          loadingTimeoutReplay: true,
          loadingTimeoutReplayTimes: 3,
          openWebglAlignment: false,
          operateBtns: {
            fullscreen: false,
            screenshot: false,
            play: false,
            audio: false,
            record: false,
          },
          recordType: 'mp4',
          rotate: 0,
          showBandwidth: false,
          supportDblclickFullscreen: false,
          timeout: 10,
          useMSE: true,
          useWCS: false,
          useWebFullScreen: true,
          videoBuffer: 0.1,
          wasmDecodeErrorReplay: true,
          wcsUseVideoRender: true,
        };
        console.log('id ->  ', this.id);
        jessibucaPlayer[this.id] = new window.Jessibuca({ ...options });
        const jessibuca = jessibucaPlayer[this.id];
        const _this = this;
        jessibuca.on('pause', function () {
          _this.playing = false;
        });
        jessibuca.on('play', function () {
          _this.playing = true;
        });
        jessibuca.on('fullscreen', function (msg) {
          _this.fullscreen = msg;
        });
        jessibuca.on('mute', function (msg) {
          _this.isNotMute = !msg;
        });
        jessibuca.on('performance', function (performance) {
          let show = '卡顿';
          if (performance === 2) {
            show = '非常流畅';
          } else if (performance === 1) {
            show = '流畅';
          }
          _this.performance = show;
        });
        jessibuca.on('kBps', function (kBps) {
          _this.kBps = Math.round(kBps);
        });
        jessibuca.on('videoInfo', function (msg) {
          console.log('Jessibuca -> videoInfo: ', msg);
        });
        jessibuca.on('audioInfo', function (msg) {
          console.log('Jessibuca -> audioInfo: ', msg);
        });
        jessibuca.on('error', function (msg) {
          console.log('Jessibuca -> error: ', msg);
        });
        jessibuca.on('timeout', function (msg) {
          console.log('Jessibuca -> timeout: ', msg);
        });
        jessibuca.on('loadingTimeout', function (msg) {
          console.log('Jessibuca -> timeout: ', msg);
        });
        jessibuca.on('delayTimeout', function (msg) {
          console.log('Jessibuca -> timeout: ', msg);
        });
        jessibuca.on('playToRenderTimes', function (msg) {
          console.log('Jessibuca -> playToRenderTimes: ', msg);
        });
      },
      playBtnClick: function (event) {
        this.play(this.videoUrl);
      },
      play: function (url) {
        console.log('Jessibuca -> url: ', url);
        if (jessibucaPlayer[this.id]) {
          this.destroy();
        }
        this.create();
        jessibucaPlayer[this.id].on('play', () => {
          this.playing = true;
          this.loaded = true;
          this.quieting = jessibuca.quieting;
        });
        if (jessibucaPlayer[this.id].hasLoaded()) {
          jessibucaPlayer[this.id].play(url);
        } else {
          jessibucaPlayer[this.id].on('load', () => {
            jessibucaPlayer[this.id].play(url);
          });
        }
      },
      pause: function () {
        if (jessibucaPlayer[this.id]) {
          jessibucaPlayer[this.id].pause();
        }
        this.playing = false;
        this.err = '';
        this.performance = '';
      },
      screenshot: function () {
        if (jessibucaPlayer[this.id]) {
          jessibucaPlayer[this.id].screenshot();
        }
      },
      mute: function () {
        if (jessibucaPlayer[this.id]) {
          jessibucaPlayer[this.id].mute();
        }
      },
      cancelMute: function () {
        if (jessibucaPlayer[this.id]) {
          jessibucaPlayer[this.id].cancelMute();
        }
      },
      destroy: function () {
        if (jessibucaPlayer[this.id]) {
          jessibucaPlayer[this.id].destroy();
        }
        if (document.getElementById('buttonsBox') == null) {
          this.$refs.container.appendChild(this.btnDom);
        }
        jessibucaPlayer[this.id] = null;
        this.playing = false;
        this.err = '';
        this.performance = '';
      },
      fullscreenSwich: function () {
        const isFull = this.isFullscreen();
        jessibucaPlayer[this.id].setFullscreen(!isFull);
        this.fullscreen = !isFull;
      },
      isFullscreen: function () {
        return document.fullscreenElement || document.msFullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || false;
      },
      ptzCamera: function (command) {
        this.$emit('controlUpdate', {
          command: command,
          horizonSpeed: parseInt((this.controlSpeed * 255) / 100),
          verticalSpeed: parseInt((this.controlSpeed * 255) / 100),
          zoomSpeed: parseInt((this.controlSpeed * 16) / 100),
        });
      },
      removeVideo() {
        const index = this.id - 1;
        this.$emit('removeVideo', index);
      },
      getBroadcastStatus() {
        if (this.broadcastStatus == -2) {
          return 'primary';
        }
        if (this.broadcastStatus == -1) {
          return 'primary';
        }
        if (this.broadcastStatus == 0) {
          return 'warning';
        }
        if (this.broadcastStatus == 1) {
          return 'danger';
        }
      },
      broadcastStatusClick() {
        if (this.broadcastStatus == -1) {
          // 默认状态， 开始
          this.broadcastStatus = 0;
          // 发起语音对讲
          this.$emit('talk', this.broadcastMode);
        } else if (this.broadcastStatus === 1) {
          this.broadcastStatus = -1;
          this.broadcastRtc.close();
        }
      },
    },

    unmounted() {
      if (jessibucaPlayer[this.id]) {
        jessibucaPlayer[this.id].destroy();
      }
      this.playing = false;
      this.loaded = false;
      this.performance = '';
    },
  };
</script>

<style lang="scss" scoped>
  .player {
    position: relative;
    margin: 0 auto;
    width: 100% !important;
    height: 100% !important;
    cursor: pointer;
    background-color: #fff;
    .kbps-btn-box {
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: absolute;
      height: 32px;
      left: 0;
      right: 0;
      top: -32px;
      padding: 7px;
      z-index: 9;
      line-height: 1.2;
      box-sizing: border-box;
      color: #fff;
      background-color: rgba(43, 51, 63, 0.7);
      transition: all 0.5s;
      .kbps-btn {
        font-size: 12px;
      }
      .name-box {
        flex: 1;
        font-size: 12px;
        overflow: hidden;
      }
      .close {
        display: inline-block;
        margin-left: 12px;
        width: 30px;
        height: 30px;
        text-align: center;
      }
    }
    .player-buttons-box {
      width: 100%;
      height: 32px;
      background-color: rgba(0, 0, 0, 0.7);
      position: absolute;
      display: flex;
      justify-content: space-between;
      left: 0;
      bottom: -32px;
      user-select: none;
      z-index: 10;
      transition: all 0.5s;
      .buttons-box-left {
        display: flex;
        margin-left: 10px;
        padding: 7px 0;
      }
      .buttons-box-right {
        display: flex;
        padding: 7px 0;
        margin-right: 10px;
      }
      .player-btn {
        display: inline-flex;
        width: 18px;
        height: 18px;
        margin: 0 6px;
        font-size: 0;
        cursor: pointer;
        &.icon-play {
          background: url('@/static/images/icon/player/icon-play.png') center no-repeat;
          background-size: auto 100%;
        }
        &.icon-pause {
          background: url('@/static/images/icon/player/icon-pause.png') center no-repeat;
          background-size: auto 100%;
        }
        &.icon-stop {
          background: url('@/static/images/icon/player/icon-stop.png') center no-repeat;
          background-size: auto 100%;
        }
        &.icon-audio {
          background: url('@/static/images/icon/player/icon-audio.png') center no-repeat;
          background-size: auto 100%;
        }
        &.icon-audio-mute {
          background: url('@/static/images/icon/player/icon-audio-mute.png') center no-repeat;
          background-size: auto 100%;
        }
        &.icon-screenshot {
          background: url('@/static/images/icon/player/icon-screenshot.png') center no-repeat;
          background-size: auto 100%;
        }
        &.icon-control {
          background: url('@/static/images/icon/player/icon-control.png') center no-repeat;
          background-size: auto 100%;
        }
        &.icon-talk {
          background: url('@/static/images/icon/player/icon-talk.png') center no-repeat;
          background-size: auto 100%;
        }
        &.icon-refresh {
          background: url('@/static/images/icon/player/icon-refresh.png') center no-repeat;
          background-size: auto 100%;
        }
        &.icon-full {
          background: url('@/static/images/icon/player/icon-fullscreen.png') center no-repeat;
          background-size: auto 100%;
        }
        &.icon-not-full {
          background: url('@/static/images/icon/player/icon-not-fullscreen.png') center no-repeat;
          background-size: auto 100%;
        }
      }
    }
    &:hover {
      .kbps-btn-box {
        top: 0;
      }
      .player-buttons-box {
        bottom: 0;
      }
    }
    .player-control-box {
      position: absolute;
      right: 10px;
      bottom: 32px;
      display: block;
      opacity: 1;
      width: 140px;
      padding-bottom: 10px;
      border: 1px solid #018dff;
      background: rgba(0, 0, 0, 0.5);
      z-index: 1;
      text-align: center;
      .control-title {
        position: relative;
        margin-bottom: 10px;
        padding: 5px 0;
        color: #fff;
        border-bottom: 1px solid #018dff;
        .close {
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 30px;
          height: 30px;
        }
      }
      .control-wrapper {
        position: relative;
        display: inline-block;
        width: 100px;
        height: 100px;
        border-radius: 100%;
        &::after {
          content: '';
          position: absolute;
          top: 26%;
          left: 26%;
          width: 48%;
          height: 48%;
          background: #fff;
          border-radius: 100%;
          border: 1px solid #018dff;
          cursor: auto;
        }
        .control-btn {
          display: flex;
          justify-content: center;
          position: absolute;
          width: 44%;
          height: 44%;
          cursor: pointer;
          border: 1px solid #018dff;
          box-sizing: border-box;
          transition: all 0.3s linear;
          background: #fff;
          > i {
            font-size: 26px;
            color: #018dff;
          }
          &.control-top {
            top: -8%;
            left: 27%;
            padding: 10px 10px 6px 6px;
            transform: rotate(-45deg);
            border-radius: 5px 100% 5px 0;
            > i {
              transform: rotate(45deg);
            }
          }

          &.control-right {
            top: 27%;
            right: -8%;
            padding: 10px 10px 6px 6px;
            transform: rotate(45deg);
            border-radius: 5px 100% 5px 0;
            > i {
              transform: rotate(-45deg);
            }
          }
          &.control-bottom {
            left: 27%;
            bottom: -8%;
            padding: 6px 10px 10px 6px;
            transform: rotate(45deg);
            border-radius: 0 5px 100% 5px;
            > i {
              transform: rotate(-45deg);
            }
          }
          &.control-left {
            top: 27%;
            left: -8%;
            padding: 6px 6px 10px 10px;
            transform: rotate(45deg);
            border-radius: 5px 0 5px 100%;
            > i {
              transform: rotate(-45deg);
            }
          }
        }
      }
      .control-speed {
        padding: 0 20px;
      }
      .ptz-btn-box {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0px 20px;
        color: #fff;
        .ptz-btn {
          display: inline-block;
          height: 22px;
          line-height: 22px;
          font-size: 22px;
        }
      }
      .talk-speed {
        padding: 0 20px;
        color: #fff;
        :deep(.el-switch) {
          left: 25px;
          width: 56px;
          --el-switch-off-color: #14cb8e;
          &.is-checked {
            left: 3px;
          }
          .el-switch__label--left,
          .el-switch__label--right {
            display: none;
            z-index: 2;
            color: #fff;
            &.is-active {
              display: inline-block;
            }
          }
          .el-switch__label--left {
            margin-right: -47px;
          }
          .el-switch__label--right {
            margin-left: -47px;
          }
          .el-switch__label * {
            font-size: 12px;
          }
        }
        :deep(.el-button) {
          padding: 24px;
          margin: 10px 0;
          font-size: 32px;
        }
      }
    }
    :deep(video) {
      width: 100%;
      height: 100%;
    }
  }
</style>
