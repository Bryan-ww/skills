<!--
 * @Descripttion: 代码编辑器
 * @version: 1.0
 * @Author: sakuya
 * @Date: 2022年5月20日21:46:29
 * @LastEditors: 
 * @LastEditTime: 
-->

<template>
	<div class="code-editor" :style="{ height: _height }">
		<textarea ref="textarea" v-model="contentValue"></textarea>
	</div>
</template>

<script>
import { markRaw, nextTick } from 'vue';

// 框架
import CodeMirror from 'codemirror';
import 'codemirror/lib/codemirror.css';

// 主题
import 'codemirror/theme/idea.css';
import 'codemirror/theme/darcula.css';

// 功能
import 'codemirror/addon/selection/active-line';

const modeLoaders = {
	sql: () => import('codemirror/mode/sql/sql.js'),
	go: () => import('codemirror/mode/go/go.js'),
	velocity: () => import('codemirror/mode/velocity/velocity.js'),
	javascript: () => import('codemirror/mode/javascript/javascript.js'),
};

const loadedModes = new Set();

export default {
	props: {
		modelValue: {
			type: String,
			default: '',
		},
		mode: {
			type: String,
			default: 'go',
		},
		height: {
			type: [String, Number],
			default: 300,
		},
		options: {
			type: Object,
			default: () => {},
		},
		theme: {
			type: String,
			default: 'idea',
		},
		readOnly: {
			type: Boolean,
			default: false,
		},
	},
	data() {
		return {
			contentValue: this.modelValue,
			coder: null,
			opt: {
				theme: this.theme, //主题
				styleActiveLine: true, //高亮当前行
				lineNumbers: true, //行号
				lineWrapping: false, //自动换行
				tabSize: 4, //Tab缩进
				indentUnit: 4, //缩进单位
				indentWithTabs: true, //自动缩进
				mode: this.mode, //语言
				readOnly: this.readOnly, //只读
				...this.options,
			},
		};
	},
	computed: {
		_height() {
			return Number(this.height) ? Number(this.height) + 'px' : this.height;
		},
	},
	watch: {
		modelValue(val) {
			this.contentValue = val;
			if (this.coder && val !== this.coder.getValue()) {
				this.coder.setValue(val);
			}
		},
		mode: {
			handler(val) {
				this.updateMode(val);
			},
		},
		readOnly(val) {
			if (this.coder) {
				this.coder.setOption('readOnly', val);
			}
		},
	},
	async mounted() {
		await this.init();
	},
	methods: {
		async ensureModeLoaded(mode) {
			if (!mode || loadedModes.has(mode)) return;
			const loader = modeLoaders[mode];
			if (loader) {
				await loader();
				loadedModes.add(mode);
			}
		},
		async init() {
			await this.ensureModeLoaded(this.opt.mode);
			await nextTick();
			this.coder = markRaw(CodeMirror.fromTextArea(this.$refs.textarea, this.opt));
			this.coder.on('change', (coder) => {
				this.contentValue = coder.getValue();
				this.$emit('update:modelValue', this.contentValue);
			});
		},
		async updateMode(mode) {
			if (!this.coder) return;
			await this.ensureModeLoaded(mode);
			this.coder.setOption('mode', mode);
		},
		formatStrInJson(strValue) {
			return JSON.stringify(JSON.parse(strValue), null, 4);
		},
	},
};
</script>

<style scoped>
.code-editor {
	font-size: 14px;
	border: 1px solid #ddd;
	line-height: 150%;
}
.code-editor:deep(.CodeMirror) {
	height: 100%;
}
</style>
