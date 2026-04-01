import BoundingRectangle from "@cesium/engine/Source/Core/BoundingRectangle.js";
import Cartesian2 from "@cesium/engine/Source/Core/Cartesian2.js";
import Cartesian3 from "@cesium/engine/Source/Core/Cartesian3.js";
import Frozen from "@cesium/engine/Source/Core/Frozen.js";
import defined from "@cesium/engine/Source/Core/defined.js";
import EllipsoidalOccluder from "@cesium/engine/Source/Core/EllipsoidalOccluder.js";
import Event from "@cesium/engine/Source/Core/Event.js";
import Matrix4 from "@cesium/engine/Source/Core/Matrix4.js";
import Billboard from "@cesium/engine/Source/Scene/Billboard.js";
import BillboardCollection from "@cesium/engine/Source/Scene/BillboardCollection.js";
import Label from "@cesium/engine/Source/Scene/Label.js";
import LabelCollection from "@cesium/engine/Source/Scene/LabelCollection.js";
import PointPrimitive from "@cesium/engine/Source/Scene/PointPrimitive.js";
import PointPrimitiveCollection from "@cesium/engine/Source/Scene/PointPrimitiveCollection.js";
import SceneMode from "@cesium/engine/Source/Scene/SceneMode.js";

import KDBush from "kdbush";

/**
 * Defines how screen space objects (billboards, points, labels) are clustered.
 *
 * @param {object} [options] An object with the following properties:
 * @param {boolean} [options.enabled=false] Whether or not to enable clustering.
 * @param {number} [options.pixelRange=80] The pixel range to extend the screen space bounding box.
 * @param {number} [options.minimumClusterSize=2] The minimum number of screen space objects that can be clustered.
 * @param {boolean} [options.clusterBillboards=true] Whether or not to cluster the billboards of an entity.
 * @param {boolean} [options.clusterLabels=true] Whether or not to cluster the labels of an entity.
 * @param {boolean} [options.clusterPoints=true] Whether or not to cluster the points of an entity.
 * @param {boolean} [options.show=true] Determines if the entities in the cluster will be shown.
 *
 * @alias BasePrimitiveCluster
 * @constructor
 *
 * @demo {@link https://sandcastle.cesium.com/index.html?src=Clustering.html|Cesium Sandcastle Clustering Demo}
 */
function BasePrimitiveCluster(options) {
  options = options ?? Frozen.EMPTY_OBJECT;

  this._enabled = options.enabled ?? false;
  this._pixelRange = options.pixelRange ?? 80;
  this._minimumClusterSize = options.minimumClusterSize ?? 2;
  this._clusterBillboards = options.clusterBillboards ?? true;
  this._clusterLabels = options.clusterLabels ?? true;
  this._clusterPoints = options.clusterPoints ?? true;

  this._labelCollection = undefined;
  this._billboardCollection = undefined;
  this._pointCollection = undefined;

  this._clusterBillboardCollection = undefined;
  this._clusterLabelCollection = undefined;
  this._clusterPointCollection = undefined;

  this._collectionIndicesByEntity = {};

  this._unusedLabelIndices = [];
  this._unusedBillboardIndices = [];
  this._unusedPointIndices = [];

  this._previousClusters = [];
  this._previousHeight = undefined;

  this._enabledDirty = false;
  this._clusterDirty = false;

  this._cluster = undefined;
  this._removeEventListener = undefined;

  this._clusterEvent = new Event();

  /**
   * Determines if entities in this collection will be shown.
   *
   * @type {boolean}
   * @default true
   */
  this.show = options.show ?? true;
}

function expandBoundingBox(bbox, pixelRange) {
  bbox.x -= pixelRange;
  bbox.y -= pixelRange;
  bbox.width += pixelRange * 2.0;
  bbox.height += pixelRange * 2.0;
}

const labelBoundingBoxScratch = new BoundingRectangle();

function getBoundingBox(item, coord, pixelRange, BasePrimitiveCluster, result) {
  if (defined(item._labelCollection) && BasePrimitiveCluster._clusterLabels) {
    result = Label.getScreenSpaceBoundingBox(item, coord, result);
  } else if (
    defined(item._billboardCollection) &&
    BasePrimitiveCluster._clusterBillboards
  ) {
    result = Billboard.getScreenSpaceBoundingBox(item, coord, result);
  } else if (
    defined(item._pointPrimitiveCollection) &&
    BasePrimitiveCluster._clusterPoints
  ) {
    result = PointPrimitive.getScreenSpaceBoundingBox(item, coord, result);
  }

  expandBoundingBox(result, pixelRange);

  if (
    BasePrimitiveCluster._clusterLabels &&
    !defined(item._labelCollection) &&
    defined(item.id) &&
    hasLabelIndex(BasePrimitiveCluster, item.id.id) &&
    defined(item.id._label)
  ) {
    const labelIndex =
      BasePrimitiveCluster._collectionIndicesByEntity[item.id.id].labelIndex;
    const label = BasePrimitiveCluster._labelCollection.get(labelIndex);
    const labelBBox = Label.getScreenSpaceBoundingBox(
      label,
      coord,
      labelBoundingBoxScratch,
    );
    expandBoundingBox(labelBBox, pixelRange);
    result = BoundingRectangle.union(result, labelBBox, result);
  }

  return result;
}

function addNonClusteredItem(item, BasePrimitiveCluster) {
  item.clusterShow = true;

  if (
    !defined(item._labelCollection) &&
    defined(item.id) &&
    hasLabelIndex(BasePrimitiveCluster, item.id.id) &&
    defined(item.id._label)
  ) {
    const labelIndex =
      BasePrimitiveCluster._collectionIndicesByEntity[item.id.id].labelIndex;
    const label = BasePrimitiveCluster._labelCollection.get(labelIndex);
    label.clusterShow = true;
  }
}

function addCluster(position, numPoints, ids, BasePrimitiveCluster) {
  const cluster = {
    billboard: BasePrimitiveCluster._clusterBillboardCollection.add(),
    label: BasePrimitiveCluster._clusterLabelCollection.add(),
    point: BasePrimitiveCluster._clusterPointCollection.add(),
  };

  cluster.billboard.show = false;
  cluster.point.show = false;
  cluster.label.show = true;
  cluster.label.text = numPoints.toLocaleString();
  cluster.label.id = ids;
  cluster.billboard.position =
    cluster.label.position =
    cluster.point.position =
      position;

  BasePrimitiveCluster._clusterEvent.raiseEvent(ids, cluster);
}

function hasLabelIndex(BasePrimitiveCluster, entityId) {
  return (
    defined(BasePrimitiveCluster) &&
    defined(BasePrimitiveCluster._collectionIndicesByEntity[entityId]) &&
    defined(BasePrimitiveCluster._collectionIndicesByEntity[entityId].labelIndex)
  );
}

function getScreenSpacePositions(
  collection,
  points,
  scene,
  occluder,
  BasePrimitiveCluster,
) {
  if (!defined(collection)) {
    return;
  }

  const length = collection.length;
  for (let i = 0; i < length; ++i) {
    const item = collection.get(i);
    item.clusterShow = false;

    if (
      !item.show ||
      (BasePrimitiveCluster._scene.mode === SceneMode.SCENE3D &&
        !occluder.isPointVisible(item.position))
    ) {
      continue;
    }

    // const canClusterLabels =
    //   BasePrimitiveCluster._clusterLabels && defined(item._labelCollection);
    // const canClusterBillboards =
    //   BasePrimitiveCluster._clusterBillboards && defined(item.id._billboard);
    // const canClusterPoints =
    //   BasePrimitiveCluster._clusterPoints && defined(item.id._point);
    // if (canClusterLabels && (canClusterPoints || canClusterBillboards)) {
    //   continue;
    // }

    const coord = item.computeScreenSpacePosition(scene);
    if (!defined(coord)) {
      continue;
    }

    points.push({
      index: i,
      collection: collection,
      clustered: false,
      coord: coord,
    });
  }
}

const pointBoundinRectangleScratch = new BoundingRectangle();
const totalBoundingRectangleScratch = new BoundingRectangle();
const neighborBoundingRectangleScratch = new BoundingRectangle();

function createDeclutterCallback(BasePrimitiveCluster) {
  return function (amount) {
    if ((defined(amount) && amount < 0.05) || !BasePrimitiveCluster.enabled) {
      return;
    }

    const scene = BasePrimitiveCluster._scene;

    const labelCollection = BasePrimitiveCluster._labelCollection;
    const billboardCollection = BasePrimitiveCluster._billboardCollection;
    const pointCollection = BasePrimitiveCluster._pointCollection;

    if (
      (!defined(labelCollection) &&
        !defined(billboardCollection) &&
        !defined(pointCollection)) ||
      (!BasePrimitiveCluster._clusterBillboards &&
        !BasePrimitiveCluster._clusterLabels &&
        !BasePrimitiveCluster._clusterPoints)
    ) {
      return;
    }

    let clusteredLabelCollection = BasePrimitiveCluster._clusterLabelCollection;
    let clusteredBillboardCollection =
      BasePrimitiveCluster._clusterBillboardCollection;
    let clusteredPointCollection = BasePrimitiveCluster._clusterPointCollection;

    if (defined(clusteredLabelCollection)) {
      clusteredLabelCollection.removeAll();
    } else {
      clusteredLabelCollection = BasePrimitiveCluster._clusterLabelCollection =
        new LabelCollection({
          scene: scene,
        });
    }

    if (defined(clusteredBillboardCollection)) {
      clusteredBillboardCollection.removeAll();
    } else {
      clusteredBillboardCollection = BasePrimitiveCluster._clusterBillboardCollection =
        new BillboardCollection({
          scene: scene,
        });
    }

    if (defined(clusteredPointCollection)) {
      clusteredPointCollection.removeAll();
    } else {
      clusteredPointCollection = BasePrimitiveCluster._clusterPointCollection =
        new PointPrimitiveCollection();
    }

    const pixelRange = BasePrimitiveCluster._pixelRange;
    const minimumClusterSize = BasePrimitiveCluster._minimumClusterSize;

    const clusters = BasePrimitiveCluster._previousClusters;
    const newClusters = [];

    const previousHeight = BasePrimitiveCluster._previousHeight;
    const currentHeight = scene.camera.positionCartographic.height;

    const ellipsoid = scene.ellipsoid;
    const cameraPosition = scene.camera.positionWC;
    const occluder = new EllipsoidalOccluder(ellipsoid, cameraPosition);

    const points = [];
    if (BasePrimitiveCluster._clusterLabels) {
      getScreenSpacePositions(
        labelCollection,
        points,
        scene,
        occluder,
        BasePrimitiveCluster,
      );
    }
    if (BasePrimitiveCluster._clusterBillboards) {
      getScreenSpacePositions(
        billboardCollection,
        points,
        scene,
        occluder,
        BasePrimitiveCluster,
      );
    }
    if (BasePrimitiveCluster._clusterPoints) {
      getScreenSpacePositions(
        pointCollection,
        points,
        scene,
        occluder,
        BasePrimitiveCluster,
      );
    }

    let i;
    let j;
    let length;
    let bbox;
    let neighbors;
    let neighborLength;
    let neighborIndex;
    let neighborPoint;
    let ids;
    let numPoints;

    let collection;
    let collectionIndex;

    if (points.length > 0) {
      const index = new KDBush(points.length, 64, Uint32Array);
      for (let p = 0; p < points.length; ++p) {
        index.add(points[p].coord.x, points[p].coord.y);
      }
      index.finish();

      if (currentHeight < previousHeight) {
        length = clusters.length;
        for (i = 0; i < length; ++i) {
          const cluster = clusters[i];

          if (!occluder.isPointVisible(cluster.position)) {
            continue;
          }

          const coord = Billboard._computeScreenSpacePosition(
            Matrix4.IDENTITY,
            cluster.position,
            Cartesian3.ZERO,
            Cartesian2.ZERO,
            scene,
          );
          if (!defined(coord)) {
            continue;
          }

          const factor = 1.0 - currentHeight / previousHeight;
          let width = (cluster.width = cluster.width * factor);
          let height = (cluster.height = cluster.height * factor);

          width = Math.max(width, cluster.minimumWidth);
          height = Math.max(height, cluster.minimumHeight);

          const minX = coord.x - width * 0.5;
          const minY = coord.y - height * 0.5;
          const maxX = coord.x + width;
          const maxY = coord.y + height;

          neighbors = index.range(minX, minY, maxX, maxY);
          neighborLength = neighbors.length;
          numPoints = 0;
          ids = [];

          for (j = 0; j < neighborLength; ++j) {
            neighborIndex = neighbors[j];
            neighborPoint = points[neighborIndex];
            if (!neighborPoint.clustered) {
              ++numPoints;

              collection = neighborPoint.collection;
              collectionIndex = neighborPoint.index;
              ids.push(collection.get(collectionIndex).id);
            }
          }

          if (numPoints >= minimumClusterSize) {
            addCluster(cluster.position, numPoints, ids, BasePrimitiveCluster);
            newClusters.push(cluster);

            for (j = 0; j < neighborLength; ++j) {
              points[neighbors[j]].clustered = true;
            }
          }
        }
      }

      length = points.length;
      for (i = 0; i < length; ++i) {
        const point = points[i];
        if (point.clustered) {
          continue;
        }

        point.clustered = true;

        collection = point.collection;
        collectionIndex = point.index;

        const item = collection.get(collectionIndex);
        bbox = getBoundingBox(
          item,
          point.coord,
          pixelRange,
          BasePrimitiveCluster,
          pointBoundinRectangleScratch,
        );
        const totalBBox = BoundingRectangle.clone(
          bbox,
          totalBoundingRectangleScratch,
        );

        neighbors = index.range(
          bbox.x,
          bbox.y,
          bbox.x + bbox.width,
          bbox.y + bbox.height,
        );
        neighborLength = neighbors.length;

        const clusterPosition = Cartesian3.clone(item.position);
        numPoints = 1;
        ids = [item.id];

        for (j = 0; j < neighborLength; ++j) {
          neighborIndex = neighbors[j];
          neighborPoint = points[neighborIndex];
          if (!neighborPoint.clustered) {
            const neighborItem = neighborPoint.collection.get(
              neighborPoint.index,
            );
            const neighborBBox = getBoundingBox(
              neighborItem,
              neighborPoint.coord,
              pixelRange,
              BasePrimitiveCluster,
              neighborBoundingRectangleScratch,
            );

            Cartesian3.add(
              neighborItem.position,
              clusterPosition,
              clusterPosition,
            );

            BoundingRectangle.union(totalBBox, neighborBBox, totalBBox);
            ++numPoints;

            ids.push(neighborItem.id);
          }
        }

        if (numPoints >= minimumClusterSize) {
          const position = Cartesian3.multiplyByScalar(
            clusterPosition,
            1.0 / numPoints,
            clusterPosition,
          );
          addCluster(position, numPoints, ids, BasePrimitiveCluster);
          newClusters.push({
            position: position,
            width: totalBBox.width,
            height: totalBBox.height,
            minimumWidth: bbox.width,
            minimumHeight: bbox.height,
          });

          for (j = 0; j < neighborLength; ++j) {
            points[neighbors[j]].clustered = true;
          }
        } else {
          addNonClusteredItem(item, BasePrimitiveCluster);
        }
      }
    }

    if (clusteredLabelCollection.length === 0) {
      clusteredLabelCollection.destroy();
      BasePrimitiveCluster._clusterLabelCollection = undefined;
    }

    if (clusteredBillboardCollection.length === 0) {
      clusteredBillboardCollection.destroy();
      BasePrimitiveCluster._clusterBillboardCollection = undefined;
    }

    if (clusteredPointCollection.length === 0) {
      clusteredPointCollection.destroy();
      BasePrimitiveCluster._clusterPointCollection = undefined;
    }

    BasePrimitiveCluster._previousClusters = newClusters;
    BasePrimitiveCluster._previousHeight = currentHeight;
  };
}

BasePrimitiveCluster.prototype._initialize = function (scene) {
  this._scene = scene;

  const cluster = createDeclutterCallback(this);
  this._cluster = cluster;
  this._removeEventListener = scene.camera.changed.addEventListener(cluster);
};

Object.defineProperties(BasePrimitiveCluster.prototype, {
  /**
   * Gets or sets whether clustering is enabled.
   * @memberof BasePrimitiveCluster.prototype
   * @type {boolean}
   */
  enabled: {
    get: function () {
      return this._enabled;
    },
    set: function (value) {
      this._enabledDirty = value !== this._enabled;
      this._enabled = value;
    },
  },
  /**
   * Gets or sets the pixel range to extend the screen space bounding box.
   * @memberof BasePrimitiveCluster.prototype
   * @type {number}
   */
  pixelRange: {
    get: function () {
      return this._pixelRange;
    },
    set: function (value) {
      this._clusterDirty = this._clusterDirty || value !== this._pixelRange;
      this._pixelRange = value;
    },
  },
  /**
   * Gets or sets the minimum number of screen space objects that can be clustered.
   * @memberof BasePrimitiveCluster.prototype
   * @type {number}
   */
  minimumClusterSize: {
    get: function () {
      return this._minimumClusterSize;
    },
    set: function (value) {
      this._clusterDirty =
        this._clusterDirty || value !== this._minimumClusterSize;
      this._minimumClusterSize = value;
    },
  },
  /**
   * Gets the event that will be raised when a new cluster will be displayed. The signature of the event listener is {@link BasePrimitiveCluster.newClusterCallback}.
   * @memberof BasePrimitiveCluster.prototype
   * @type {Event<BasePrimitiveCluster.newClusterCallback>}
   */
  clusterEvent: {
    get: function () {
      return this._clusterEvent;
    },
  },
  /**
   * Gets or sets whether clustering billboard entities is enabled.
   * @memberof BasePrimitiveCluster.prototype
   * @type {boolean}
   */
  clusterBillboards: {
    get: function () {
      return this._clusterBillboards;
    },
    set: function (value) {
      this._clusterDirty =
        this._clusterDirty || value !== this._clusterBillboards;
      this._clusterBillboards = value;
    },
  },
  /**
   * Gets or sets whether clustering labels entities is enabled.
   * @memberof BasePrimitiveCluster.prototype
   * @type {boolean}
   */
  clusterLabels: {
    get: function () {
      return this._clusterLabels;
    },
    set: function (value) {
      this._clusterDirty = this._clusterDirty || value !== this._clusterLabels;
      this._clusterLabels = value;
    },
  },
  /**
   * Gets or sets whether clustering point entities is enabled.
   * @memberof BasePrimitiveCluster.prototype
   * @type {boolean}
   */
  clusterPoints: {
    get: function () {
      return this._clusterPoints;
    },
    set: function (value) {
      this._clusterDirty = this._clusterDirty || value !== this._clusterPoints;
      this._clusterPoints = value;
    },
  },

  /**
   * Returns true when all clustered data has been rendered.
   * @memberof BasePrimitiveCluster.prototype
   * @type {boolean}
   * @readonly
   * @private
   */
  ready: {
    get: function () {
      return (
        !this._enabledDirty &&
        !this._clusterDirty &&
        (!defined(this._billboardCollection) ||
          this._billboardCollection.ready) &&
        (!defined(this._labelCollection) || this._labelCollection.ready)
      );
    },
  },
});

function createGetEntity(
  collectionProperty,
  CollectionConstructor,
  unusedIndicesProperty,
  entityIndexProperty,
) {
  return function (entity) {
    let collection = this[collectionProperty];

    if (!defined(this._collectionIndicesByEntity)) {
      this._collectionIndicesByEntity = {};
    }

    let entityIndices = this._collectionIndicesByEntity[entity.id];

    if (!defined(entityIndices)) {
      entityIndices = this._collectionIndicesByEntity[entity.id] = {
        billboardIndex: undefined,
        labelIndex: undefined,
        pointIndex: undefined,
      };
    }

    if (defined(collection) && defined(entityIndices[entityIndexProperty])) {
      return collection.get(entityIndices[entityIndexProperty]);
    }

    if (!defined(collection)) {
      collection = this[collectionProperty] = new CollectionConstructor({
        scene: this._scene,
      });
    }

    let index;
    let entityItem;

    const unusedIndices = this[unusedIndicesProperty];
    if (unusedIndices.length > 0) {
      index = unusedIndices.shift();
      entityItem = collection.get(index);
    } else {
      entityItem = collection.add();
      index = collection.length - 1;
    }

    entityIndices[entityIndexProperty] = index;

    const that = this;
    Promise.resolve().then(function () {
      that._clusterDirty = true;
    });

    return entityItem;
  };
}

function removeEntityIndicesIfUnused(BasePrimitiveCluster, entityId) {
  const indices = BasePrimitiveCluster._collectionIndicesByEntity[entityId];

  if (
    !defined(indices.billboardIndex) &&
    !defined(indices.labelIndex) &&
    !defined(indices.pointIndex)
  ) {
    delete BasePrimitiveCluster._collectionIndicesByEntity[entityId];
  }
}

/**
 * Returns a new {@link Label}.
 * @param {Entity} entity The entity that will use the returned {@link Label} for visualization.
 * @returns {Label} The label that will be used to visualize an entity.
 *
 * @private
 */
BasePrimitiveCluster.prototype.getLabel = createGetEntity(
  "_labelCollection",
  LabelCollection,
  "_unusedLabelIndices",
  "labelIndex",
);

/**
 * Removes the {@link Label} associated with an entity so it can be reused by another entity.
 * @param {Entity} entity The entity that will uses the returned {@link Label} for visualization.
 *
 * @private
 */
BasePrimitiveCluster.prototype.removeLabel = function (entity) {
  const entityIndices =
    this._collectionIndicesByEntity &&
    this._collectionIndicesByEntity[entity.id];
  if (
    !defined(this._labelCollection) ||
    !defined(entityIndices) ||
    !defined(entityIndices.labelIndex)
  ) {
    return;
  }

  const index = entityIndices.labelIndex;
  entityIndices.labelIndex = undefined;
  removeEntityIndicesIfUnused(this, entity.id);

  const label = this._labelCollection.get(index);
  label.show = false;
  label.text = "";
  label.id = undefined;

  this._unusedLabelIndices.push(index);

  this._clusterDirty = true;
};

/**
 * Returns a new {@link Billboard}.
 * @param {Entity} entity The entity that will use the returned {@link Billboard} for visualization.
 * @returns {Billboard} The label that will be used to visualize an entity.
 *
 * @private
 */
BasePrimitiveCluster.prototype.getBillboard = createGetEntity(
  "_billboardCollection",
  BillboardCollection,
  "_unusedBillboardIndices",
  "billboardIndex",
);

/**
 * Removes the {@link Billboard} associated with an entity so it can be reused by another entity.
 * @param {Entity} entity The entity that will uses the returned {@link Billboard} for visualization.
 *
 * @private
 */
BasePrimitiveCluster.prototype.removeBillboard = function (entity) {
  const entityIndices =
    this._collectionIndicesByEntity &&
    this._collectionIndicesByEntity[entity.id];
  if (
    !defined(this._billboardCollection) ||
    !defined(entityIndices) ||
    !defined(entityIndices.billboardIndex)
  ) {
    return;
  }

  const index = entityIndices.billboardIndex;
  entityIndices.billboardIndex = undefined;
  removeEntityIndicesIfUnused(this, entity.id);

  const billboard = this._billboardCollection.get(index);
  billboard.id = undefined;
  billboard.show = false;
  billboard.image = undefined;

  this._unusedBillboardIndices.push(index);

  this._clusterDirty = true;
};

/**
 * Returns a new {@link Point}.
 * @param {Entity} entity The entity that will use the returned {@link Point} for visualization.
 * @returns {Point} The label that will be used to visualize an entity.
 *
 * @private
 */
BasePrimitiveCluster.prototype.getPoint = createGetEntity(
  "_pointCollection",
  PointPrimitiveCollection,
  "_unusedPointIndices",
  "pointIndex",
);

/**
 * Removes the {@link Point} associated with an entity so it can be reused by another entity.
 * @param {Entity} entity The entity that will uses the returned {@link Point} for visualization.
 *
 * @private
 */
BasePrimitiveCluster.prototype.removePoint = function (entity) {
  const entityIndices =
    this._collectionIndicesByEntity &&
    this._collectionIndicesByEntity[entity.id];
  if (
    !defined(this._pointCollection) ||
    !defined(entityIndices) ||
    !defined(entityIndices.pointIndex)
  ) {
    return;
  }

  const index = entityIndices.pointIndex;
  entityIndices.pointIndex = undefined;
  removeEntityIndicesIfUnused(this, entity.id);

  const point = this._pointCollection.get(index);
  point.show = false;
  point.id = undefined;

  this._unusedPointIndices.push(index);

  this._clusterDirty = true;
};

function disableCollectionClustering(collection) {
  if (!defined(collection)) {
    return;
  }

  const length = collection.length;
  for (let i = 0; i < length; ++i) {
    collection.get(i).clusterShow = true;
  }
}

function updateEnable(BasePrimitiveCluster) {
  if (BasePrimitiveCluster.enabled) {
    return;
  }

  if (defined(BasePrimitiveCluster._clusterLabelCollection)) {
    BasePrimitiveCluster._clusterLabelCollection.destroy();
  }
  if (defined(BasePrimitiveCluster._clusterBillboardCollection)) {
    BasePrimitiveCluster._clusterBillboardCollection.destroy();
  }
  if (defined(BasePrimitiveCluster._clusterPointCollection)) {
    BasePrimitiveCluster._clusterPointCollection.destroy();
  }

  BasePrimitiveCluster._clusterLabelCollection = undefined;
  BasePrimitiveCluster._clusterBillboardCollection = undefined;
  BasePrimitiveCluster._clusterPointCollection = undefined;

  disableCollectionClustering(BasePrimitiveCluster._labelCollection);
  disableCollectionClustering(BasePrimitiveCluster._billboardCollection);
  disableCollectionClustering(BasePrimitiveCluster._pointCollection);
}

/**
 * Gets the draw commands for the clustered billboards/points/labels if enabled, otherwise,
 * queues the draw commands for billboards/points/labels created for entities.
 * @private
 */
BasePrimitiveCluster.prototype.update = function (frameState) {
  if (!this.show) {
    return;
  }

  // If clustering is enabled before the label collection is updated,
  // the glyphs haven't been created so the screen space bounding boxes
  // are incorrect.
  let commandList;
  const labelCollection = this._labelCollection;
  if (
    defined(labelCollection) &&
    labelCollection.length > 0 &&
    !labelCollection.ready
  ) {
    commandList = frameState.commandList;
    frameState.commandList = [];
    labelCollection.update(frameState);
    frameState.commandList = commandList;
  }

  // If clustering is enabled before the billboard collections are updated,
  // the images haven't been added to the image atlas so the screen space bounding boxes
  // are incorrect.
  const billboardCollection = this._billboardCollection;
  if (
    defined(billboardCollection) &&
    billboardCollection.length > 0 &&
    !billboardCollection.ready
  ) {
    commandList = frameState.commandList;
    frameState.commandList = [];
    billboardCollection.update(frameState);
    frameState.commandList = commandList;
  }

  if (this._enabledDirty) {
    this._enabledDirty = false;
    updateEnable(this);
    this._clusterDirty = true;
  }

  if (this._clusterDirty) {
    this._cluster();

    // Unless all existing billboards and labels were clustered, clustering will need to execute again next frame
    this._clusterDirty =
      (defined(labelCollection) && !labelCollection.ready) ||
      (defined(billboardCollection) && !billboardCollection.ready);
  }

  if (defined(this._clusterLabelCollection)) {
    this._clusterLabelCollection.update(frameState);
  }
  if (defined(this._clusterBillboardCollection)) {
    this._clusterBillboardCollection.update(frameState);
  }
  if (defined(this._clusterPointCollection)) {
    this._clusterPointCollection.update(frameState);
  }

  if (defined(labelCollection)) {
    labelCollection.update(frameState);
  }
  if (defined(billboardCollection)) {
    billboardCollection.update(frameState);
  }
  if (defined(this._pointCollection)) {
    this._pointCollection.update(frameState);
  }
};

/**
 * Destroys the WebGL resources held by this object.  Destroying an object allows for deterministic
 * release of WebGL resources, instead of relying on the garbage collector to destroy this object.
 * <p>
 * Unlike other objects that use WebGL resources, this object can be reused. For example, if a data source is removed
 * from a data source collection and added to another.
 * </p>
 */
BasePrimitiveCluster.prototype.destroy = function () {
  if (defined(this._removeEventListener)) {
    this._removeEventListener();
    this._removeEventListener = undefined;
  }

  this._labelCollection =
    this._labelCollection && this._labelCollection.destroy();
  this._billboardCollection =
    this._billboardCollection && this._billboardCollection.destroy();
  this._pointCollection =
    this._pointCollection && this._pointCollection.destroy();

  this._clusterLabelCollection =
    this._clusterLabelCollection && this._clusterLabelCollection.destroy();
  this._clusterBillboardCollection =
    this._clusterBillboardCollection &&
    this._clusterBillboardCollection.destroy();
  this._clusterPointCollection =
    this._clusterPointCollection && this._clusterPointCollection.destroy();

  this._labelCollection = undefined;
  this._billboardCollection = undefined;
  this._pointCollection = undefined;

  this._clusterBillboardCollection = undefined;
  this._clusterLabelCollection = undefined;
  this._clusterPointCollection = undefined;

  this._collectionIndicesByEntity = undefined;

  this._unusedLabelIndices = [];
  this._unusedBillboardIndices = [];
  this._unusedPointIndices = [];

  this._previousClusters = [];
  this._previousHeight = undefined;

  this._enabledDirty = false;
  this._pixelRangeDirty = false;
  this._minimumClusterSizeDirty = false;

  return undefined;
};

/**
 * A event listener function used to style clusters.
 * @callback BasePrimitiveCluster.newClusterCallback
 *
 * @param {Entity[]} clusteredEntities An array of the entities contained in the cluster.
 * @param {object} cluster An object containing the Billboard, Label, and Point
 * primitives that represent this cluster of entities.
 * @param {Billboard} cluster.billboard
 * @param {Label} cluster.label
 * @param {PointPrimitive} cluster.point
 *
 * @example
 * // The default cluster values.
 * dataSource.clustering.clusterEvent.addEventListener(function(entities, cluster) {
 *     cluster.label.show = true;
 *     cluster.label.text = entities.length.toLocaleString();
 * });
 */
export default BasePrimitiveCluster;
