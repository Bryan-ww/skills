import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import { defineConfig, loadEnv, ConfigEnv } from 'vite';
import vueSetupExtend from 'vite-plugin-vue-setup-extend';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import topLevelAwait from 'vite-plugin-top-level-await';
import { createStyleImportPlugin, VxeTableResolve } from 'vite-plugin-style-import';
import viteCompression from 'vite-plugin-compression';
import copy from 'rollup-plugin-copy';
// @ts-ignore
import { svgBuilder } from '/@/components/IconSelector/index';
// @ts-ignore
import { ViewUiPlusResolver } from './build/viewui-resolver';

import dns from 'node:dns'
dns.setDefaultResultOrder('verbatim')

const pathResolve = (dir: string) => {
  return resolve(__dirname, '.', dir);
};

const alias: Record<string, string> = {
  '/@': pathResolve('./src/'),
  '@': pathResolve('./src/'),
  'vue-i18n': 'vue-i18n/dist/vue-i18n.cjs.js',
};

const viteConfig = defineConfig((mode: ConfigEnv) => {
  const env = loadEnv(mode.mode, process.cwd());
  // 判断是否开发环境
  const isDev = env.ENV === 'development'
  return {
    plugins: [
      vue(), // Vue 插件
      svgBuilder('./src/assets/icons/'), // 将 SVG 文件转换成 Vue 组件
      vueSetupExtend(), // setup语法糖增强插件
      AutoImport({
        imports: ['vue', 'vue-router', 'pinia'], // 自动导入的依赖库数组
        dts: './auto-imports.d.ts', // 自动导入类型定义文件路径
      }),
      Components({
        resolvers: [
          ViewUiPlusResolver(), // View UI Plus 按需引入
          // 自定义解析器，排除 babylon/modal.vue 避免与 view-ui-plus Modal 冲突
          {
            type: 'component',
            resolve: (name: string) => {
              // 如果组件名是 Modal，直接返回 view-ui-plus 的 Modal
              if (name === 'Modal') {
                return {
                  name: 'Modal',
                  from: 'view-ui-plus'
                }
              }
            }
          }
        ],
        // 排除 babylon/modal.vue 文件，避免自动扫描
        exclude: [/babylon\/modal\.vue$/]
      }),//复用组件
      createStyleImportPlugin({
        resolves: [VxeTableResolve()], // 配置vxetable 按需加载
      }),
      topLevelAwait({
        promiseExportName: '__tla', // TLA Promise 变量名
        promiseImportName: (i) => `__tla_${i}`, // TLA Promise 导入名
      }),
      viteCompression({
        deleteOriginFile: false, // 压缩后删除原来的文件
      }),
      copy({
        targets: [
          { src: 'node_modules/@liveqing/liveplayer-v3/dist/component/liveplayer-lib.min.js', dest: 'public/js' },
        ]
      })
    ],
    assetsInclude: ['**/*.mov'],
    root: process.cwd(), // 项目根目录
    resolve: { alias }, // 路径别名配置
    base: mode.command === 'serve' ? './' : env.VITE_PUBLIC_PATH,
    optimizeDeps: {
      include: ['element-plus/es/locale/lang/zh-cn', 'element-plus/es/locale/lang/en', 'video.js'],
      exclude: ['@liveqing/liveplayer'] // 避免冲突
    },
    server: {
      host: '0.0.0.0', // 服务器地址
      port: env.VITE_PORT as unknown as number, // 服务器端口号
      open: env.VITE_OPEN === 'true', // 是否自动打开浏览器
      hmr: true, // 启用热更新
      proxy: {
        '/api': {
          target: env.VITE_ADMIN_PROXY_PATH, // 目标服务器地址
          ws: true, // 是否启用 WebSocket
          changeOrigin: true, // 是否修改请求头中的 Origin 字段
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
        '/aigc': {
          target: 'http://192.168.2.151:8088',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/aigc/, '')
        },
        '^/ws/info/.*': {
          target: env.VITE_ADMIN_PROXY_PATH, // 目标服务器地址
          ws: true, // 是否启用 WebSocket
          changeOrigin: true,
        },
        '/maidao-portal': {
          target: 'http://10.105.1.40:8015',
          changeOrigin: true,
          logLevel: 'debug',
          rewrite: (path) => {
            return path;
          }
        }
      },
    },
    build: {
      outDir: 'dist', // 打包输出目录
      chunkSizeWarningLimit: 1500, // 代码分包阈值
      // 开发使用 esbuild 更快，生产环境打包使用 terser 可以删除更多注释
      minify: isDev ? 'esbuild' : 'terser',
      terserOptions: {
        compress: {
          drop_console: true, // 删除 console
          drop_debugger: true, // 删除 debugger
        },
        format: {
          comments: false // 删除所有注释
        }
      },
      rollupOptions: {
        output: {
          entryFileNames: `assets/[name].[hash].js`,
          chunkFileNames: `assets/[name].[hash].js`,
          assetFileNames: `assets/[name].[hash].[ext]`,
          compact: true,
          manualChunks: {
            vue: ['vue', 'vue-router', 'pinia'],
            echarts: ['echarts'],
          },
        },
      },
    },
    css: { preprocessorOptions: { css: { charset: false } } },
    define: {
      __VUE_I18N_LEGACY_API__: JSON.stringify(false),
      __VUE_I18N_FULL_INSTALL__: JSON.stringify(false),
      __INTLIFY_PROD_DEVTOOLS__: JSON.stringify(false),
      __PACKAGE_VERSION__: JSON.stringify(process.env.npm_package_version),
      __NEXT_NAME__: JSON.stringify(process.env.npm_package_name),
    },
  };
});

export default viteConfig;


