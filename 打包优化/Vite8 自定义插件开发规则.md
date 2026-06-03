### Vite8 自定义插件开发规则

Vite 插件本质上是一个返回对象的函数，这个对象包含了 Vite 在构建不同生命周期会调用的“钩子函数”。这个插件用到了以下几个核心钩子：

- **`apply: 'build'`**：指定这个插件只在生产构建时生效，开发模式下不运行。
- **`enforce: 'post'`**：指定插件的执行顺序为“后置”。这意味着它会在 Vite 内置插件和其他常规插件执行完之后再执行，确保能拿到完整的构建结果。
- **`configResolved(config)`**：Vite 配置解析完毕后触发。插件在这里读取项目的根目录、`src` 目录、`public` 目录、路径别名等配置，并缓存到全局状态 `state` 中，供后续使用。
- **`buildStart()`**：构建开始时触发。插件在这里加载“回收站清单”，用于后续的源码恢复逻辑。
- **`resolveId(source, importer)`**：模块解析时触发。插件在这里拦截静态资源的引用，如果发现引用的源码静态资源被之前的构建移到了回收站，就自动把它恢复回来，防止当前构建报错。
- **`generateBundle(_, bundle)`**：生成产物包时触发。此时 Vite 已经确定了哪些代码和资源被打包。插件遍历 `bundle`，把被 Vite 打包进去的 `src` 目录下的静态资源标记为“已使用”。
- **`closeBundle()`**：构建结束、产物写入磁盘后触发。**这是插件的核心！** 插件在这里扫描源码和 `dist` 产物，对比哪些资源没被引用，然后执行删除操作并生成报告。



### 2. 主题逻辑（相关函数）

插件的运行逻辑可以概括为“**收集全量资源 -> 多维提取引用 -> 标记已使用 -> 清理未使用**”。以下是按主题分类的关键函数：

#### A. 文件遍历与状态维护

- `walkFiles` / `walkTextFiles` / `walkDistTextFiles`：递归遍历目录，分别收集全量静态资源、源码文件、dist 产物文本文件。
- `restoreSourceFromTrashIfNeeded` / `moveSourceToTrash`：管理源码的“软删除”。不是直接 `rm`，而是移到 `.vite-unused-static-trash` 目录，防止误删。

#### B. 引用提取（核心：怎么知道代码里用了什么图片？）

- `extractReferencesByFileType`：分发器，根据文件后缀（`.vue`, `.css`, `.ts`）调用不同的提取逻辑。
- `extractTemplateReferences`：解析 Vue Template，提取 `src`, `href` 等属性和 `:src="xxx"` 绑定中的路径。
- `extractCssReferences`：用正则提取 CSS 中的 `url()` 和 `@import`。
- `extractScriptReferences`：**最复杂的部分**。使用 TypeScript 编译器 API 做 AST（抽象语法树）解析，提取 `import`, `require`, `new URL()` 以及自定义 Helper 函数调用（如 `getAssetsImage('xx')`）里的路径。

#### C. 表达式推导（核心：动态路径怎么办？）

- `evaluateExpressionPatterns`：处理 JS 里的动态拼接。比如 ``assets/${name}.png`` 或 `dir + '/a.png'`。它不求值运行结果，而是推导出路径模式（如 `assets/*.png`）。
- `combinePathPatterns`：合并左右表达式模式。
- `resolveIdentifierPatterns`：局部变量追溯。遇到变量时，去作用域链里找它之前的定义模式。

#### D. 路径匹配与清理

- `expandPatternToAbsoluteCandidates`：把代码里写的相对路径（如 `@/assets/a.png`）结合 Alias 和 Helper 规则，转换成磁盘上的绝对路径候选集。
- `markReferenceUsage`：拿提取出的路径（或 Glob 模式）去全量资源池里匹配，匹配上的就加入“已使用”集合。
- `removeFileAndEmptyDirs`：删除文件，并顺带清理因此变空的父目录。

------

### 3. 关键逻辑细节讲解

#### 细节一：如何识别动态引用？（表达式推导机制）

普通正则只能匹配写死的字符串，但前端经常写动态路径：

javascript

 复制 插入 新文件

```
const icon = `weatherWarning/${level}.gif`;
```

插件通过 `evaluateExpressionPatterns` 函数，把这行代码解析成一棵树：

1. 发现是个模板字符串，左边是 `weatherWarning/`（精确模式），中间是变量 `${level}`（未知，退化为通配符 `*`），右边是 `.gif`（精确模式）。
2. 合并后变成模式：`weatherWarning/*.gif`（Glob 模式）。
3. 最后匹配时，只要资源池里有 `weatherWarning/a.gif` 或 `weatherWarning/b.gif`，都会被这个模式命中，从而不被删除。

#### 细节二：Helper 函数的映射（自定义路径解析）

项目中常封装获取静态资源的函数：

javascript

 复制 插入 新文件

```
// 代码里这样写
<img :src="getAssetsImage('rain.png')" />

// 实际上它指向 public/assets/images/rain.png
```

插件怎么知道 `getAssetsImage` 对应哪个目录？靠配置 `helperPathResolvers`：

javascript

 复制 插入 新文件

```
helperPathResolvers: [
  { callee: 'getAssetsImage', roots: ['public/assets/images'] }
]
```

插件在 AST 中识别到 `getAssetsImage` 调用时，会把提取到的 `rain.png` 拼上 `roots`，生成真实的绝对路径候选。

#### 细节三：“三重保险”防误删

插件不是只看源码就删文件的，它在 `closeBundle` 中做了三重校验：

1. **Bundle 图谱保护**：通过 `generateBundle` 钩子，Vite 打包了谁，谁就是绝对安全的。
2. **源码扫描保护**：遍历 `src` 下的代码，用 AST 和正则提取引用。
3. **Dist 产物兜底保护**：遍历打包后的 `dist` 目录文本。因为有些资源可能在 JS 运行时动态拼出，源码静态分析漏了，但最终会出现在 HTML 或 JS 产物里，这一步能兜底。

只有同时没被这三重机制发现的静态资源，才会被判定为“未使用”。

#### 细节四：源码删除的“回收站”机制

如果开启了 `deleteUnusedSource`，插件绝不会直接 `fs.unlink` 删源码，而是 `moveSourceToTrash` 移动到 `.vite-unused-static-trash` 目录，并记录 `manifest.json`。
**为什么？** 因为静态分析可能出错。如果删错了，下次构建会直接报错 `Module not found`。有了回收站机制，下次构建时 `resolveId` 钩子发现找不到文件，会去回收站里 `restoreSourceFromTrashIfNeeded` 自动恢复，避免构建崩溃。

------

### 4. 其他详细讲解

#### A. 为什么需要 `normalizeFsPath`？

不同操作系统的路径分隔符不同（Windows 是 `\`，Mac/Linux 是 `/`）。而且 Windows 路径大小写不敏感。如果不统一处理，`C:\src\a.png` 和 `c:/src/a.png` 会被当成两个文件，导致匹配失败。`normalizeFsPath` 统一转成 `/` 并在 Windows 下转小写，保证了路径比较的准确性。

#### B. `looksLikeAssetReference` 的启发式过滤

在 JS 代码里，字符串无处不在（比如 `'not found'`）。如果提取所有字符串去匹配资源，会极大拖慢速度并可能误判。
这个函数是“资源判定”的门槛，规则是：

1. 必须有配置的静态资源后缀（如 `.png`）。
2. 必须长得像路径：包含 `/`，或者以 `./`、`@/` 开头。
3. 如果是 Helper 函数传参，可以放宽限制（允许裸文件名）。
   这样就能过滤掉 99% 的无关字符串。

#### C. 报告与日志

插件执行完会在 `dist/unused-static-report.json` 生成一份详细的报告，包含：

- 有多少资源被保护了（被哪一层保护）。
- 有多少资源未使用。
- 删除了多少字节的文件（格式化后的大小）。
- 具体未使用和已删除的文件清单。
  建议初次使用时，**不要开启 `deleteUnusedSource`**，先观察 `report.json` 里的 `unused` 列表，确认无误后再开启自动清理。

#### D. Rolldown 兼容

代码中引入了 `OutputBundle` from `rolldown`。Vite 正在将底层打包器从 Rollup 迁移到 Rolldown。这个插件在 `generateBundle` 钩子中处理产物时，兼容了不同打包器 `originalFileName` 和 `originalFileNames` 的数据结构，确保在 Vite 环境演进中依然可用。

希望这个拆解能帮你快速理解这个插件的精妙设计！如果有某个具体的函数或机制还想深入了解，随时告诉我。