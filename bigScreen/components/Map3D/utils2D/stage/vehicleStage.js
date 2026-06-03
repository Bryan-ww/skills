import { watch } from 'vue';
import LayerGroup from 'ol/layer/Group.js';
import Stage from './Stage.js';
import { useVehicleStore } from '@/views/bigScreen/components/MapTab/stores/useVehicle.js';
import { createIconLayer } from '@/views/bigScreen/components/Map3D/utils2D/createIconLayer.js';
import { INFRAS_TYPE } from '@/views/bigScreen/components/Map3D/utils/infrasData.js';

export default class VehicleStage extends Stage {
  name = 'VehicleStage';
  constructor(map) {
    super(map);
    this.name = VehicleStage.name;
    // 车辆图层
    this.vehicleLayer = null;
    this.vehicleStore = useVehicleStore();
    this.stopVehicleWatch = watch(
      () => this.vehicleStore.listHasLocation,
      (newVal) => {
        this.removeVehicleLayer();
        if (newVal.length > 0) {
          this.createVehicleLayer(newVal);
        }
      },
    );
  }
  createVehicleLayer(list) {
    const layers = [];
    layers.push(
      createIconLayer({
        list: list,
        type: INFRAS_TYPE.VEHICLE,
        fullIcon: '/assets/images/map-marker/car/car-map.png',
        anchor: [0.5, 2.4],
      })
    );
    const layerGroup = new LayerGroup({
      layers: layers,
    });

    this.vehicleLayer = layerGroup;
    this.map.addLayer(this.vehicleLayer);
  }
  removeVehicleLayer() {
    this.map.removeLayer(this.vehicleLayer);
    this.vehicleLayer = null;
  }
  show() {}
  hide() {
    this.removeVehicleLayer();
  }
  destroy() {
    this.stopVehicleWatch();
    this.removeVehicleLayer();
  }
}
