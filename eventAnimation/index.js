
import * as THREE from "three";
import TWEEN from "@tweenjs/tween.js";
// 首次进入动画
// 定义一个函数，用于实现相机动画效果
function eventAnimation(camera, controls) {
    // 创建一个TWEEN动画，将相机的位置从当前位置移动到(-5, 250, 150)，持续时间为1500毫秒
    new TWEEN.Tween(camera.clone().position)
        .to(new THREE.Vector3(-5, 250, 150), 1500)
        // 设置动画的缓动函数为正弦函数
        .easing(TWEEN.Easing.Sinusoidal.InOut)
        // 在动画更新时，更新相机的位置，并设置相机控件的观察目标为(-5, 0, 10)，并更新相机控件
        .onUpdate((e) => {
            camera.position.copy(e);
            controls.target.set(-5, 0, 10);
            controls.update();
        })
        // 在动画完成时，设置相机控件的最大和最小观察距离
        .onComplete(() => {
            // 限制相机控件最大和最小观察距离
            controls.minDistance = 80;
            controls.maxDistance = 600;
        })
        // 启动动画
        .start();
}

export { eventAnimation }
