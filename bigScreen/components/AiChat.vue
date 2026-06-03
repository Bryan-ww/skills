<template>
  <div v-show="isShowChat" ref="containerEl" class="pointer-events w-full h-full top-0 left-0 fixed z-50">
    
    <div class="ai-chat-container pointer-events-auto ai-chat-container-extra">
      <div class="ai-chat-content" @click.stop="">
        <!-- 数字人容器 -->
        <div id="AI_AVATAR_CONTAINER"></div>

        <div class="ai-sender">
          <img class="img1" src="@/assets/AIImages/ai-tip.png" v-if="chatList.length === 0" />
          <div class="avatar-box">
            <img src="@/assets/AIImages/ai_avatar_v2.png" @click="handleChange" />
          </div>
        </div>
        <div style="width: calc(100%); position: relative">
          <div v-if="chatList.length > 0" class="ai-chat-list">
            <BubbleList
              ref="bubbleListRef"
              :list="chatList"
              id="bubbleListID"
              max-height="45vh"
              :trigger-indices="triggerIndices"
              @click="onClick"
              @complete="onComplete"
            >
              <template #avatar="{ item }"></template>
            </BubbleList>
            <img class="ai-close" src="@/assets/AIImages/ai-close1.png" @click="handleChange" />
          </div>
          <div v-else class="welcome-content">
            <div style="color: white; font-size: 0.3rem; text-align: center; margin-bottom: 0.4rem">Hi~有什么需要我做的吗？</div>
            <div style="margin: 0 auto; display: flex; justify-content: center; margin-bottom: 0.4rem">
              <img style="margin-left: -0.4rem; width: 3.8rem" src="@/assets/AIImages/line.png" alt="" />
            </div>
            <div style="text-align: center; font-size: 0.16rem">
              <p>我是疆悦，专为您答疑解惑。可快速快速生成项目管理报告、查洵</p>
              <p>异常数据等，助您高效获取信息，快来体验吧~</p>
            </div>
            <div style="margin-top: 0.4rem; text-align: center; display: flex; justify-content: center; font-size: 0.16rem">
              <div class="btn-bg">您可以这样问：</div>
            </div>
            <div style="text-align: center; display: flex; justify-content: center">
              <div style="margin-top: 0.2rem; width: 5rem; font-size: 0.14rem; position: relative">
                <img class="img-yuan" style="margin-top: 0.2rem; width: 5rem" src="@/assets/AIImages/yuan.png" alt="" />
                <div class="left1 btn-bg">生成3月份报告</div>
                <div class="left2 btn-bg">新疆维吾尔自治区总体情况及收费规模是多少？</div>
                <div class="right1 btn-bg">省内通行交易争议数据多少，涉及的金额是多少？</div>
                <div class="right2 btn-bg">新疆维吾尔自治区总体情况，基础设施，实体门架多少个？</div>
              </div>
            </div>
          </div>
          <!-- allowSpeech 是否允许语音输入 -->
          <Sender
            v-model="sendText"
            :input-style="inputStyle"
            :style="style"
            placeholder="请输入您想了解的问题"
            :loading="isLoading || submitLoading"
            @submit="handleSubmit"
            @recordingChange="handleRecordChange"
            @cancel="handleCancel"
            :allowSpeech="false"
          />
          <!-- <div v-if="isRecording">语音识别中……</div> -->
        </div>
        <div class="display-human">
          <el-switch v-model="showAIGirl" class="big-switch"  size="large" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { useEventbus } from '@/hooks/useEventbus';
  import { ref, watch, onMounted, computed } from 'vue';
  import { BubbleList, Sender, useXStream } from 'vue-element-plus-x';
  import { useWindowSize } from '@vueuse/core';
  import { AiAvatar } from '@/stores/app';

  const myEventBus = useEventbus();
 

  defineOptions({
    name: 'AIChat',
  });

  const showAIGirl = ref(true)

  const aiAvatar = new AiAvatar();

  watch(showAIGirl, (newVal) => {
    aiAvatar.avatar.setVisible(newVal);
  })
 
  // 获取窗口尺寸
  const { height: windowHeight } = useWindowSize();

  const initialY = computed(() => Math.max(0, Math.floor(windowHeight.value) - 200));

  const inputStyle = {
    background: 'rgba(0, 35, 60, 0.9)',
    color: '#FFFFFF',
    fontSize: '0.16rem',
  };
  const style = {
    background: 'rgba(0, 35, 60, 0.9)',
    color: '#FFFFFF',
  };

  const { startStream, cancel, data, error, isLoading } = useXStream();
  const chatList = ref([]);
  const sendText = ref('');
  const isShowChat = ref(false);

  const isComplete = ref(false);
  const bubbleListRef = ref();
  const userName = ref('difyuser' + Math.random().toString(36).substr(2, 9));
  const task_id = ref('');
  const triggerIndices = ref('only-last');

 
  const submitLoading = ref(false);
  const handleSubmit = async (event) => {
    submitLoading.value = true;
    if (chatList.value.length > 0 && chatList.value[chatList.value.length - 1].loading === true) {
      chatList.value[chatList.value.length - 1].content = '已停止';
      chatList.value[chatList.value.length - 1].loading = false;
      cancel();
      await handleCancel();
    }
    chatList.value.push(
      {
        key: new Date().valueOf(), // 唯一标识
        role: 'user', // user | ai 自行更据模型定义
        placement: 'end', // start | end 气泡位置
        content: event, // 消息内容 流式接受的时候，只需要改这个值即可
        loading: false, // 当前气泡的加载状态
        shape: 'corner', // 气泡的形状
        // variant: 'outlined', // 气泡的样式
        isMarkdown: true, // 是否渲染为 markdown
        typing: false, // 是否开启打字器效果 该属性不会和流式接受冲突
        isFog: false, // 是否开启打字雾化效果，该效果 v1.1.6 新增，且在 typing 为 true 时生效，该效果会覆盖 typing 的 suffix 属性
        // avatar: 'https://avatars.githubusercontent.com/u/76239030?v=4',
        // avatarSize: '24px', // 头像占位大小
        // avatarGap: '12px', // 头像与气泡之间的距离
        maxWidth: '95%',
      },
      {
        key: new Date().valueOf(), // 唯一标识
        role: 'ai', // user | ai 自行更据模型定义
        placement: 'start', // start | end 气泡位置
        content: '', // 消息内容 流式接受的时候，只需要改这个值即可
        loading: true, // 当前气泡的加载状态
        shape: 'corner', // 气泡的形状
        variant: 'filled', // 气泡的样式
        isMarkdown: true, // 是否渲染为 markdown
        typing: false, // 是否开启打字器效果 该属性不会和流式接受冲突
        isFog: true, // 是否开启打字雾化效果，该效果 v1.1.6 新增，且在 typing 为 true 时生效，该效果会覆盖 typing 的 suffix 属性
        // avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
        // avatarSize: '24px', // 头像占位大小
        // avatarGap: '12px', // 头像与气泡之间的距离
        noStyle: true,
        maxWidth: '95%',
      }
    );
    sendText.value = '';
    scrollBottom();

    await askAIQuestion(event, {
      baogao_req: 'second',
    });
  };
  const askAIQuestion = async (question, otherInput = {}) => {
    // http://xwtmp.ops.xjjtkj.cn/api/v1/emom_qa/chat
    const response = await fetch('http://192.168.2.75:8000/api/v1/emom_qa/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
      }),
    });
    const readableStream = response.body;
    await startStream({ readableStream });
    if (!isLoading.value) {
      submitLoading.value = false;
    }
  };
  const dilogVisible = ref(false);

  const dialogCancel = () => {
    dilogVisible.value = false;
  };
  let currClickDom;
  const onClick = (event, index) => {
    const target = event.target;
    if (target.id == 'dialogSubmit') {
      currClickDom = target;
    }
  };

  const onComplete = (event, index) => {
    isComplete.value = true;
  };

  const handleCancel = async () => {
    if (task_id.value === '') return;
    if (typeof task_id.value !== 'string' || task_id.value.trim() === '') {
      console.error('Invalid task_id:', task_id.value);
      return;
    }
    try {
      const response = await fetch(`/dify/v1/chat-messages/${task_id.value}/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_APP_KEY}`,
        },
        // Add an empty JSON body
        body: JSON.stringify({
          user: userName.value,
        }),
      });
      cancel();
      if (chatList.value.length > 0 && chatList.value[chatList.value.length - 1].loading === true) {
        chatList.value[chatList.value.length - 1].content = '已停止';
        chatList.value[chatList.value.length - 1].loading = false;
      }
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Cancel request failed:', error);
    }
  };

  watch(
    () => data.value,
    (newValue) => {
      if (Array.isArray(newValue) && newValue.length > 0) {
        let text = '';
        for (let index = 0; index < newValue.length; index++) {
          const chunk = newValue[index].data;
          try {
            const parsedChunk = JSON.parse(chunk);
            if (parsedChunk.status === 'completed') {
              chatList.value.forEach((item) => {
                item.false = true;
              });
              aiAvatar.speekText(text);
              console.log('ai最终答案', text);
            } else {
              if (Array.isArray(parsedChunk)) {
                parsedChunk.forEach((item) => {
                  if (item.content) {
                    text += item.content;
                    chatList.value[chatList.value.length - 1].content = text;
                    chatList.value[chatList.value.length - 1].loading = false;
                    chatList.value[chatList.value.length - 1].key = parsedChunk.message_id;
                  }
                });
              }
            }
            task_id.value = parsedChunk.task_id;
            if (parsedChunk.status === 'error') {
              const text = '服务器繁忙，请稍后再试。';
              chatList.value[chatList.value.length - 1].content = text;
              chatList.value[chatList.value.length - 1].loading = false;
              chatList.value[chatList.value.length - 1].key = parsedChunk.message_id;
              aiAvatar.speekText(text);
            }
          } catch (error) {
            console.error('解析数据时出错:', error);
          }
        }
      }
    },
    { deep: true }
  );

  watch(
    () => error.value,
    () => {
      console.log('------------------');
      console.log(error.value);
    }
  );

  const scrollBottom = () => {
    setTimeout(() => {
      bubbleListRef.value.scrollToBottom();
    });
  };

  const handleChange = () => {
    isShowChat.value = !isShowChat.value;
    if (isShowChat.value) {
      chatList.value = chatList.value.map((item, index) => {
        item.typing = false;
        return item;
      });

      if (!aiAvatar.connected) {
        aiAvatar.connectAvatar({
          url: import.meta.env.VITE_AVATAR_BASE_URL,
          container: document.getElementById('AI_AVATAR_CONTAINER'),
        })
      }
    } else {
      aiAvatar.cancelActiveBroadcast();
    }
  };

  const initBubbleData = (text) => {
    isShowChat.value = true;
    if (isShowChat.value) {
      chatList.value = chatList.value.map((item, index) => {
        item.typing = false;
        return item;
      });
    }
    handleSubmit(text);
  };

  const open = () => {
    isShowChat.value = true;
  };

  const close = () => {
    isShowChat.value = false;
    chatList.value = [];
  };

  const handleRecordChange = (status) => {};

  const createChatAnswerItem = (content = '') => {
    chatList.value.push({
      key: new Date().valueOf(), // 唯一标识
      role: 'ai', // user | ai 自行更据模型定义
      placement: 'start', // start | end 气泡位置
      content: content, // 消息内容 流式接受的时候，只需要改这个值即可
      loading: true, // 当前气泡的加载状态
      shape: 'corner', // 气泡的形状
      variant: 'filled', // 气泡的样式
      isMarkdown: true, // 是否渲染为 markdown
      typing: true, // 是否开启打字器效果 该属性不会和流式接受冲突
      isFog: true, // 是否开启打字雾化效果，该效果 v1.1.6 新增，且在 typing 为 true 时生效，该效果会覆盖 typing 的 suffix 属性
      avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
      avatarSize: '24px', // 头像占位大小
      avatarGap: '12px', // 头像与气泡之间的距离
      noStyle: true,
      maxWidth: '95%',
    });
  };

  onMounted(() => {
    myEventBus.customDataOn('showAiChat', () => {
      handleChange();
    });
  });

  onBeforeUnmount(() => {
    myEventBus.customOff('showAiChat');

    if (aiAvatar.connected) {
      aiAvatar.disconnectAvatar();
    }
  });

  defineExpose({
    initBubbleData,
    createChatAnswerItem,
    open,
    close,
  });
</script>

<style scoped lang="scss">
  #AI_AVATAR_CONTAINER {
    position: absolute;
    bottom: -30px;
    left: -430px;
    width: 400px;
    height: 600px;
    z-index: 101;
    pointer-events: none;
  }

  .ai-drag-logo {
    width: 120px;
    height: 150px;
    position: fixed;
    z-index: 100;

    img {
      width: 100%;
      height: 100%;
      width: 120px;
      height: 120px;
    }
  }
  .ai-chat-container {
    width: 100%;
    height: 100%;

    .display-human {
      display: flex;
      align-items: center;
      height: 0.5rem;
      width: 0.8rem;
      font-size: 0.16rem;
      cursor: pointer;
      margin-left: 0.55rem;
    }

    :deep() {
      .big-switch {
        transform: scale(1.4);
        transform-origin: 70% 50%;

        .el-switch__core {
          border: none !important;
        }
      }
      .el-sender-content {
        padding-block: 0.12rem;
        padding-inline-start: 0.16rem;
        padding-inline-end: 0.12rem;

        .el-button {
          font-size: 0.16rem;
          width: 0.26rem;
          height: 0.26rem;
          padding: 0.08rem;
        }
      }
    }

    .ai-chat-content {
      color: #ffffff;
      position: fixed;
      bottom: 0.8rem;
      left: 0;
      right: 0;
      padding: 0.2rem;
      width: 40%;
      min-width: 5rem;
      margin: 0 auto;
      display: flex;
      align-items: flex-end;
      z-index: 99999;
      .ai-chat-list {
        background-image: url('@/assets/AIImages/kuang.png');
        background-repeat: no-repeat;
        background-size: 100% 100%; /* 强制拉伸填充（可能失真） */
        border-radius: 0.15rem;
        position: relative;
        padding: 0.4rem 0.4rem 0.4rem 0.6rem;
        box-sizing: border-box;
        margin-bottom: 0.2rem;
        min-height: 3rem;
        backdrop-filter: blur(20px);

        :deep() {
          .markdown-content {
            p {
              margin: 0;
            }
          }
          .el-bubble-loading-wrap {
            margin-top: -0.2rem;
            gap: 0.1rem !important;
            .dot {
              width: 0.1rem !important;
              height: 0.1rem !important;
            }
          }
          .el-bubble-start {
            .el-bubble-content {
              max-width: 100%;
              width: 100%;
              .typer-content.markdown-content {
                max-width: 100%;
                width: 100%;
                overflow-x: auto;
              }
            }
            .typer-content {
              display: inline-block;
              color: #ffffff !important;

              line-height: 0.3rem;
              font-size: 0.14rem;
            }
          }
          .el-bubble-end {
            .typer-content {
              color: #ffffff !important;
            }

            .el-bubble-content-filled {
              font-size: 0.14rem;
              background-color: #0088ff !important;
              line-height: 0.2rem;
              border-radius: 0.15rem 0.05rem 0.15rem 0.15rem;
              padding: 0.1rem 0.16rem 0.1rem 0.16rem;
            }
          }
        }

        .avatar-wrapper {
          width: 0.4rem;
          height: 0.4rem;
          img {
            width: 100%;
            height: 100%;
            border-radius: 50%;
          }
        }

        .ai-close {
          width: 0.24rem;
          height: 0.24rem;
          position: absolute;
          top: -0.12rem;
          right: -0.12rem;
        }
      }

      .ai-sender {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-end;
        width: 1.5rem;
        position: absolute;
        left: -1.2rem;

        .img1 {
          width: 1.24rem;
          margin-bottom: 0.12rem;
        }

        .avatar-box {
          border-radius: 50%;
          overflow: hidden;
          width: 0.45rem;
          height: 0.45rem;

          img {
            width: 100%;
            height: 100%;
          }
        }
      }

      .welcome-content {
        .tip-item {
          background-color: #0088ff !important;
          padding: 11px 16px 10px 25px;
          border-radius: 4.71px 23.56px 23.56px 23.56px;
          font-size: 12px;
          font-weight: 900;
          margin-top: 20px;
          width: fit-content;
        }
      }
    }

    :deep() {
      .el-bubble-list {
        scrollbar-gutter: stable;
      }
      .el-sender:after {
        border: 2px solid rgba(0, 136, 255, 1) !important;
      }
      .el-sender-action-list {
        .el-send-button:last-child {
          padding-right: 0.1rem !important;
          //border-right: 1px solid #9e9e9e;
        }
      }
    }
  }

  .ai-chat-container-extra {
    width: 100%;
    height: 100%;
    position: fixed;
    z-index: 100;
    background: linear-gradient(to right, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.8) 50%, rgba(0, 0, 0, 0.3));
  }
  :deep() {
    .placeholder {
      background-color: #ffd54f; /* 中等明度的黄色 */
      color: #212121; /* 深灰黑 */
    }
    .tableSpace {
      width: 100%;
      overflow-x: auto;
      position: relative;
      table {
        min-width: 100% !important;
        border-collapse: collapse;
        width: 100% !important;
        text-align: center;
      }
      thead {
        th {
          padding: 10px;
          min-width: 100px !important;
          border: 1px solid #ffffff !important;
          &:nth-child(1) {
            min-width: 100px !important;
          }
          &:nth-child(2) {
            min-width: 160px !important;
          }
        }
      }
      tbody {
        td {
          padding: 10px;
          min-width: 100px;
          border: 1px solid #ffffff !important;
          &:nth-child(1) {
            min-width: 100px !important;
          }
          &:nth-child(2) {
            min-width: 160px !important;
          }
        }
      }
    }
    #dialogSubmit {
      background-color: rgba(42, 130, 228, 1);
      padding: 10px 30px;
      display: inline-block;
      border-radius: 5px;
      font-weight: bolder;
      cursor: pointer;
    }
    .btn-bg {
      width: 423px;
      border: 1px solid;
      border-image-source: linear-gradient(180deg, rgba(152, 121, 224, 0.07) 1%, rgba(11, 8, 37, 1) 99.88%);
      position: relative;
      padding: 10px;
      border-radius: 6px;
      background: transparent;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(to right, #8f41e9, #578aef);
        border-radius: 10px;
        padding: 2px;
        -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
        -webkit-mask-composite: destination-out;
        mask-composite: exclude;
        z-index: -1;
      }
    }
    .left1 {
      position: absolute;
      top: 0.05rem;
      width: 1.6rem;
      left: -0.35rem;
    }
    .left2 {
      position: absolute;
      left: -3rem;
      top: 0.7rem;
      width: 3.9rem;
    }
    .right1 {
      position: absolute;
      right: -2.55rem;
      top: 0.05rem;
      width: 3.8rem;
    }
    .right2 {
      position: absolute;
      right: -3.5rem;
      top: 0.7rem;
      width: 4.4rem;
    }
    .img-yuan {
      -webkit-user-select: none; /* Chrome, Safari, Opera */
      -moz-user-select: none; /* Firefox */
      -ms-user-select: none; /* Internet Explorer/Edge */
      user-select: none; /* Standard syntax */
      position: relative;
      z-index: -10;
    }
  }
  .pointer-events {
    pointer-events: none;
  }
  .pointer-events-auto {
    pointer-events: auto;
  }
</style>
