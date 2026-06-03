import { Group, Vector2 } from 'three';
import { drawMeshLine, drawLineSegments2 } from './drawLine';
import { mergeMultipleLineCoordinates } from './util';
import { roadColor } from './config';

export function createRoadGroup(options) {
  const {
    groupedRoadData,
    lineType,
    color,
    sizes,
    hideSDAndGD,
    mergeRoadCoordinates,
    roadWidth,
    pointCenter,
    isJT = false,
    subCenterRoadLineMaterials,
  } = options;

  const groupedRoads = mergeRoadCoordinates ? mergeMultipleLineCoordinates(groupedRoadData) : groupedRoadData;
  const lineGroup = new Group();

  if (lineType === 'meshLine') {
    for (const key of Object.keys(groupedRoads)) {
      if (key.length === 4 && hideSDAndGD) {
        continue;
      }
      const material = isJT && subCenterRoadLineMaterials
        ? (color === roadColor.jtsd ? subCenterRoadLineMaterials.sd[key] : subCenterRoadLineMaterials.gd[key]) || null
        : null;
      const line = drawMeshLine(
        groupedRoads[key],
        {
          color,
          lineWidth: roadWidth,
          resolution: new Vector2(sizes.width, sizes.height),
        },
        {
          center: pointCenter,
          transformed: true,
          material,
        }
      );
      line.roadName = key;
      lineGroup.add(line);
    }
  } else {
    for (const key of Object.keys(groupedRoads)) {
      if (key.length === 4 && hideSDAndGD) {
        continue;
      }
      const list = groupedRoads[key];
      const material = isJT && subCenterRoadLineMaterials
        ? (color === roadColor.jtsd ? subCenterRoadLineMaterials.sd[key] : subCenterRoadLineMaterials.gd[key]) || null
        : null;
      const line = drawLineSegments2(
        list,
        {
          color,
          linewidth: roadWidth,
        },
        {
          center: pointCenter,
          transformed: true,
          jsJT: isJT,
          material,
        }
      );
      line.roadName = key;
      lineGroup.add(line);
    }
  }

  return lineGroup;
}
