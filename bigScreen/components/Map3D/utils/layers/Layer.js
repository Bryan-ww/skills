export class Layer {
  constructor() {
    
  }
  show() {
  }
  hide() {
  }
  distanceChange(distance) {
  }
  destroy() {
  }
  disposeGroup(group) {
    if (group) {
      group.traverse(child => {
        if (child.isMesh) {
          this.disposeMesh(child)
        }
      })
    }
  }
  disposeMesh(mesh) {
    // 2. 清理几何体（释放顶点数据显存）
    if (mesh.geometry) {
      mesh.geometry.dispose();
    }

    // 3. 清理材质（释放着色器/ uniforms 资源）
    if (mesh.material) {
      // 多材质情况（数组）
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(material => {
          material.dispose();
          // 4. 清理纹理（最容易泄漏！释放图片显存）
          Object.values(material).forEach(val => {
            if (val && val.isTexture) val.dispose();
          });
        });
      } 
      // 单材质
      else {
        mesh.material.dispose();
        Object.values(mesh.material).forEach(val => {
          if (val && val.isTexture) val.dispose();
        });
      }
    }
  }
}