
import { openDB } from 'idb';


const storeName = 'largeFile'
const dbPromise = openDB('largeFileDatabase', 1, {
  // 数据库版本升级时触发（首次创建也会触发）
  upgrade(db) {
    // 如果不存在 "largeFile" 对象仓库，则创建
    if (!db.objectStoreNames.contains(storeName)) {
      // 创建对象仓库，指定主键为 'id'
      const store = db.createObjectStore(storeName, { keyPath: 'id' });
    } else {

    }
    console.log('largeFile 仓库创建成功');
  },
});

// 2. 新增数据（使用事务）
export async function addLargeFile(data) {
  // 获取数据库实例
  const db = await dbPromise;
  // 开启读写事务（指定操作的对象仓库 ）
  const tx = db.transaction(storeName, 'readwrite');
  // 获取对象仓库
  const store = tx.objectStore(storeName);
  // 添加数据
  await store.add(data);
  // 等待事务完成
  await tx.done;
  console.log('添加成功');
}

// 3. 查询数据（按主键）
export async function getLargeFileById(id) {
  const db = await dbPromise;
  // 开启只读事务
  const tx = db.transaction(storeName, 'readonly');
  const store = tx.objectStore(storeName);
  // 按主键查询
  const file = await store.get(id);
  await tx.done;
  return file;
}

// 5. 更新数据
export async function updateLargeFile(data) {
  const db = await dbPromise;
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  // put() 方法：存在则更新，不存在则新增
  await store.put(data);
  await tx.done;
  console.log('文件更新成功');
}

// 6. 删除数据
export async function deleteLargeFile(id) {
  const db = await dbPromise;
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  await store.delete(id);
  await tx.done;
  console.log('文件删除成功');
}

export const cacheLargeFile = async (url) => {
  if (!url) {
    return
  }
  const exist = await getLargeFileById(url)
  if (exist) {
    return
  }
  fetch(url, {
    config: { cache: 'force-cache' }
  })
  .then(res => res.blob())
  .then(async (blob) => {
    addLargeFile({ id: url, blob: blob })
  })
}

export const cacheLargeFiles = async (urls) => {
  urls.forEach(url => {
    cacheLargeFile(url)
  })
}

export const getLargeFileCacheUrl = async (path) => {
  const data = await getLargeFileById(path)
  if (data) {
    return window.URL.createObjectURL(data.blob)
  }
  return null
}