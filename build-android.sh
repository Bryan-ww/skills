#!/bin/bash

# ==================== 配置项（和你的项目对应） ====================
APP_ID="__UNI____"          # 你的 uniapp appid
PACKAGE_NAME="com.xxx.app"  # 安卓包名
APP_NAME="你的应用名称"
VERSION_NAME="1.0.0"
VERSION_CODE="100"
# ==================================================================

# 接收参数 --debug
DEBUG="false"
if [[ "$1" == "--debug" ]]; then
  DEBUG="true"
fi

echo "========================================"
echo " 开始构建 uniApp Android 本地工程"
echo " 调试模式：$DEBUG"
echo "========================================"

# 1. 编译 app-plus 产出安卓离线工程
if [[ "$DEBUG" == "true" ]]; then
  npm run build:app-plus -- --platform android --debug
else
  npm run build:app-plus -- --platform android
fi

# 2. 复制到 android 目录（Android Studio 直接打开）
echo "复制 Android 工程到 ./android 目录..."
rm -rf ./android
mkdir -p ./android
cp -rf ./unpackage/dist/build/app-plus/android/* ./android/

# 3. 自动配置包名、版本、appid（企业级必备）
echo "自动配置包名、版本、AppID..."

# 修改 app/build.gradle
sed -i "" "s/applicationId .*/applicationId \"$PACKAGE_NAME\"/g" ./android/app/build.gradle
sed -i "" "s/versionName .*/versionName \"$VERSION_NAME\"/g" ./android/app/build.gradle
sed -i "" "s/versionCode .*/versionCode $VERSION_CODE/g" ./android/app/build.gradle

# 修改 dcloud_appid
sed -i "" "s/dcloud_appid\".*\"/dcloud_appid\"$APP_ID\"/g" ./android/app/src/main/res/values/strings.xml

echo "========================================"
echo "✅ 构建完成！"
echo "📁 Android Studio 直接打开：./android"
echo "========================================"
