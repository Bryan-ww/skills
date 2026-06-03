import { createEmpty, extend } from 'ol/extent.js';
import { createIconLayerByType } from './createIconLayer'


const circleDistanceMultiplier = 1
const circleFootSeparation = 28
const circleStartAngle = Math.PI / 2;

export class ExtendClusterLayer {
  constructor(map) {
    this.map = map
    this.layer = null
    this.clusterFeature = null
    this.clusterLayer = null
    this.clusterPopup = null
    this.tempList = []
  }
  removeLayer() {
    if (this.layer) {
      this.map.removeLayer(this.layer)
      this.layer = null
    }
    this.clusterFeature = null
    if (this.clusterLayer) {
      this.clusterLayer.setOpacity(1)
    }
    this.clusterPopup?.hide()
  }
  /**
   * 创建图层
   * @param {Feature[]} clusterMembers 
   * @param {Feature} clusterFeature 
   */
  createLayer(clusterMembers, clusterFeature, cluster, popupConfig) {
    if (this.clusterFeature) {
      if (this.clusterFeature.ol_uid === clusterFeature.ol_uid) {
        return
      } else {
        this.removeLayer()
      }
    }
    if (clusterMembers.length > 1 && !this.layer) {
      this.clusterFeature = clusterFeature

      const extent = createEmpty();
      clusterMembers.forEach((feature) =>
        extend(extent, feature.getGeometry().getExtent()),
      );
      const view = this.map.getView();
      const resolution = this.map.getView().getResolution();
      if (view.getZoom() === view.getMaxZoom()) {
        const center = clusterMembers[0].getGeometry().getCoordinates()
        const points = generatePointsCircle(clusterMembers.length, center, resolution)
        const memberData = clusterMembers[0].get('data')
        const type = memberData?.type
        const tempList = points.map((point, index) => {
          const feature = clusterMembers[index]
          const originData = feature.get('data')
          return {
            ...originData,
            lnglat: point
          }
        })
       
        const { popup, currentDeviceTarget, clusterPopup } = popupConfig
        this.clusterPopup = clusterPopup
        // if (currentDeviceTarget) {
        //   const popupData = tempList.find((item) => item.id === currentDeviceTarget.id)
        //   if (popupData) {
        //     popup.setPosition(popupData.lnglat)
        //   }
        // }
        this.showClusterPopup(clusterPopup, tempList, center, currentDeviceTarget)

        // cluster.setOpacity(0.4)
        // this.clusterLayer = cluster
        // this.layer = createIconLayerByType(type, tempList, { notUseCluster: true })
        // this.layer.setZIndex(400)
        // this.map.addLayer(this.layer)
      } else {
        view.fit(extent, { duration: 500, padding: [50, 50, 50, 50] });
      }
    }
  }
  showClusterPopup(clusterPopup, list, lnglat, currentDeviceTarget) {
    let listHtml = ''
    this.tempList = list
    
    list.forEach((item, index) => {
      const active = item.id === currentDeviceTarget?.id ? 'active' : ''
      let onlineHtml = ''
      if (item.properties?.onlineStatus) {
        onlineHtml = item.properties.onlineStatus === 'ONLINE' ?
        `<span style="color: #37ec37; margin-left: 0.1rem;">在线</span>` :
        `<span style="color: red; margin-left: 0.1rem;">离线</span>`
      }
      listHtml += `
        <div class="item ${active}" data-index="${index}">
          ${item.name || item.properties?.name || ''}
          ${onlineHtml}
        </div>
      `
    })
    const html = `<div>${listHtml}</div>`
    clusterPopup.show(lnglat, html);
  }
}

export function generatePointsCircle(count, clusterCenter, resolution) {
  const circumference =
    circleDistanceMultiplier * circleFootSeparation * (2 + count);
  let legLength = circumference / (Math.PI * 2);
  const angleStep = (Math.PI * 2) / count;
  const res = [];
  let angle;

  legLength = Math.max(legLength, 55) * resolution; // Minimum distance to get outside the cluster icon.

  for (let i = 0; i < count; ++i) {
    // Clockwise, like spiral.
    angle = circleStartAngle + i * angleStep;
    res.push([
      clusterCenter[0] + legLength * Math.cos(angle),
      clusterCenter[1] + legLength * Math.sin(angle),
    ]);
  }

  return res;
}
