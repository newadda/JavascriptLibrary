var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _OGIS_instances, _OGIS_initMultiSelect;
import OlMap from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import Overlay from 'ol/Overlay.js';
import Feature from 'ol/Feature.js';
import { Point, LineString } from 'ol/geom';
import OSM from 'ol/source/OSM.js';
// interaction
import { Draw, Modify, Snap } from 'ol/interaction.js';
import Select from 'ol/interaction/Select.js';
import { createBox, } from 'ol/interaction/Draw.js';
import { get } from 'ol/proj.js';
// style
import { Circle, Fill, Stroke, Style, Text } from 'ol/style.js';
//etc
import GeoJSON from 'ol/format/GeoJSON.js';
import { WKT } from 'ol/format.js';
////////// Utils
class OGisUtils {
    static testBaseLayer() {
        return new TileLayer({ source: new OSM() });
    }
    /**
     *  Geojson 객체를 VectorSource로 만듬
     */
    static createVectorSourceWithGeojson(geojsonObject) {
        return new VectorSource({
            features: new GeoJSON().readFeatures(geojsonObject),
        });
    }
    static createDefaultStyle(feature) {
        const styles = {
            'Point': new Style({
                image: new Circle({
                    radius: 7,
                    fill: new Fill({
                        color: 'black',
                    }),
                    stroke: new Stroke({
                        color: 'white',
                        width: 2,
                    }),
                }),
            })
        };
        const geometry = feature.getGeometry();
        if (geometry instanceof Point) {
            return styles[Point.name];
        }
    }
    static getCentroid(points) {
        var area = 0, cx = 0, cy = 0;
        for (var i = 0; i < points.length; i++) {
            var j = (i + 1) % points.length;
            var pt1 = points[i];
            var pt2 = points[j];
            var x1 = pt1[0];
            var x2 = pt2[0];
            var y1 = pt1[1];
            var y2 = pt2[1];
            area += x1 * y2;
            area -= y1 * x2;
            cx += ((x1 + x2) * ((x1 * y2) - (x2 * y1)));
            cy += ((y1 + y2) * ((x1 * y2) - (x2 * y1)));
        }
        area /= 2;
        area = Math.abs(area);
        cx = cx / (6.0 * area);
        cy = cy / (6.0 * area);
        return {
            x: Math.abs(cx),
            y: Math.abs(cy)
        };
    }
}
// 빈 vector layer 
function emptyVectorLayer() {
    const source = new VectorSource();
    const layerVector = new VectorLayer({
        source: source,
        style: {
            'fill-color': 'rgba(255, 255, 255, 0.2)',
            'stroke-color': '#ffcc33',
            'stroke-width': 2,
            'circle-radius': 7,
            'circle-fill-color': '#ffcc33',
        },
    });
    return layerVector;
}
const FeatureType = Object.freeze({
    Point: 'Point',
    LineString: 'LineString',
    Polygon: 'Polygon',
    PolygonBox: 'PolygonBox'
});
class OGISProperty {
    constructor() {
        this.center = [126.75186297386847,
            37.42218873353694];
        this.zoom = 12;
        this.projection = 'EPSG:4326';
    }
}
/**
 * 만들어야 될 기능
 * - 다중선택시 콜백과 페이지 던지기
 *  - layer 정보과 피처를 같이 던져야 한다.
 * - 단일 선택시 UI
 * - 편집
 *  - 피쳐 편집
 *  - 피쳐 생성(포인트, 라인, 폴리곤)
 * - 연결된 정보 뷰(사라지지 않고 연결되었다.)
 *
 */
class OverlayManager {
    constructor(overlay) {
        this.overlay = overlay;
    }
    overlayerClose() {
        this.overlay.setPosition(undefined);
    }
}
const defaultMultiSelectContainer = (overlayManager, featureList) => {
    const container = document.createElement('div');
    container.style.width = '300px';
    container.style.backgroundColor = '#ff00ff';
    console.log("featureList", featureList);
    for (const feature of featureList) {
        let child = document.createElement('div');
        const geometry = feature.getGeometry();
        if (geometry) {
            child.innerHTML = new WKT().writeGeometry(geometry);
        }
        child.onclick = () => { overlayManager.overlayerClose(); };
        container.appendChild(child);
    }
    return container;
};
class ConnectInfoViewData {
}
class OGIS {
    constructor(target, options = new OGISProperty()) {
        _OGIS_instances.add(this);
        //// 멀티셀렉트
        this.multiSelectContainer = defaultMultiSelectContainer; // 멀티셀렉트시 생성 UI
        //// 가상뷰, 떠있는 정보뷰를 위한
        this.connectFeatureInfoHash = new Map();
        this._stayInfoViewMap = new OlMap();
        this.connectFeatureInfoLayer = new VectorLayer({
            source: new VectorSource(),
            style: {
                'fill-color': 'rgba(255, 0, 0, 0.9)',
                'stroke-color': 'rgba(255, 0, 0, 0.9)',
                'stroke-width': 1,
                'circle-radius': 7,
                'circle-fill-color': '#ffcc33',
                'stroke-line-dash': [2, 3]
            },
            zIndex: 100
        });
        this._targetElement = target;
        this.init(options);
        __classPrivateFieldGet(this, _OGIS_instances, "m", _OGIS_initMultiSelect).call(this);
        this.initConnectInfoView();
    }
    init(options) {
        var _a;
        Object.assign(options, new OGISProperty());
        this._mapView = new View(options);
        // 범위지정
        const extent = (_a = get(this._mapView.getProjection())) === null || _a === void 0 ? void 0 : _a.getExtent().slice();
        if (extent) {
            extent[0] += extent[0];
            extent[2] += extent[2];
        }
        // 맵 만들기
        this._map = new OlMap({
            target: this._targetElement,
            layers: [new TileLayer({ source: new OSM() })],
            view: this._mapView,
        });
    }
    /*  ===================== 계속 존재하는 정보뷰 ======================== */
    initConnectInfoView() {
        this._map.addLayer(this.connectFeatureInfoLayer);
    }
    connectInfoViewOn(feature, viewCreater) {
        var _a, _b;
        const view = viewCreater(feature);
        const geometry = feature.getGeometry();
        /// 내부의 중심을 구한다.
        let originPosition;
        if (geometry.getType() === 'Point' || geometry.getType() === 'LineString') {
            originPosition = geometry.getFirstCoordinate();
        }
        else {
            const centroid = OGisUtils.getCentroid(geometry.getCoordinates());
            console.log("centroid", centroid);
            originPosition = [centroid.x, centroid.y];
            /*
            const coordinates = geometry.getCoordinates()!;
           
            const xCollection=[] as number[];
            const yCollection=[] as number[];
           
            for(let i=0;i< coordinates.length;i++)
            {
               
              xCollection.push(Number(coordinates[i][0]))
              yCollection.push(Number(coordinates[i][1]))
            }
      
            const centerX = (Math.min(...xCollection)+Math.max(...xCollection) )/2
            const centerY = (Math.min(...yCollection)+Math.max(...yCollection) )/2
            originPosition = [centerX,centerY]
          */
        }
        // 띄울 좌표
        let pixel = this._map.getPixelFromCoordinate(originPosition);
        let floatingCoordinate = originPosition;
        if (pixel) {
            pixel[0] -= 5;
            pixel[1] -= 5;
            floatingCoordinate = this._map.getCoordinateFromPixel(pixel);
        }
        const virtualLineString = new Feature({
            geometry: new LineString([
                originPosition, floatingCoordinate
            ]),
        });
        (_a = this.connectFeatureInfoLayer.getSource()) === null || _a === void 0 ? void 0 : _a.addFeature(virtualLineString);
        let position;
        if (position === undefined) {
            position = virtualLineString.getGeometry().getLastCoordinate();
        }
        const overlay = new Overlay({
            element: view,
            position: position,
            positioning: 'bottom-center',
            autoPan: {
                animation: {
                    duration: 250,
                },
            },
        });
        (_b = this._map) === null || _b === void 0 ? void 0 : _b.addOverlay(overlay);
        const superMap = this._map;
        const draggable = ($target) => {
            let isPress = false, preCoo = null;
            $target.onmousedown = start;
            $target.onmouseup = end;
            // $target.onmouseout = end;
            // 상위 영역
            // window.onmousemove = move;
            superMap.on('pointermove', (e) => {
                if (!isPress)
                    return;
                if (preCoo === null) {
                    preCoo = e.coordinate;
                }
                const deletaX = preCoo[0] - e.coordinate[0];
                const deletaY = preCoo[1] - e.coordinate[1];
                console.info(deletaX + deletaY);
                const overlayPosition = overlay.getPosition();
                const movedX = overlayPosition[0] - deletaX;
                const movedY = overlayPosition[1] - deletaY;
                overlay.setPosition([
                    movedX,
                    movedY,
                ]);
                virtualLineString.getGeometry().setCoordinates([virtualLineString.getGeometry().getFirstCoordinate(),
                    [
                        movedX, movedY
                    ]]);
                preCoo = e.coordinate;
            });
            function start(e) {
                isPress = true;
            }
            function end() {
                isPress = false;
                preCoo = null;
            }
        };
        draggable(view);
        /// feature 좌표 변경에 대해 연결된 정보뷰의 라인도 움직이게 한다.
        feature.on("change", e => {
            console.log("change", e);
            virtualLineString.getGeometry().setCoordinates([e.target.getGeometry().getFirstCoordinate(),
                virtualLineString.getGeometry().getLastCoordinate()
            ]);
        });
        const data = new ConnectInfoViewData();
        data.virtualFeature = virtualLineString;
        data.overLay = overlay;
        this.connectFeatureInfoHash.set(feature, data);
    }
    connectInfoViewOff(feature) {
        var _a, _b;
        const data = this.connectFeatureInfoHash.get(feature);
        if (data) {
            if (data.overLay) {
                (_a = this._map) === null || _a === void 0 ? void 0 : _a.removeOverlay(data.overLay);
            }
            if (data.virtualFeature) {
                (_b = this.connectFeatureInfoLayer.getSource()) === null || _b === void 0 ? void 0 : _b.removeFeature(data.virtualFeature);
            }
        }
    }
    /* ========================= 편집 기능 =========================== */
    /// 생성기능
    onDrawable(featureMode, source) {
        let featureType = featureMode;
        let geometryFunction;
        if (featureType === FeatureType.PolygonBox) {
            featureType = 'Circle';
            geometryFunction = createBox();
        }
        const modify = new Modify({ source: source });
        this._map.addInteraction(modify);
        const draw = new Draw({
            source: source,
            type: featureType,
            geometryFunction: geometryFunction,
        });
        this._map.addInteraction(draw);
        const snap = new Snap({ source: source });
        this._map.addInteraction(snap);
        return { draw: draw, modify: modify, snap: snap };
    }
    /// 생성기능 끄기
    disableDrawAndModify(interactions) {
        this._map.removeInteraction(interactions.draw);
        this._map.removeInteraction(interactions.modify);
        this._map.removeInteraction(interactions.snap);
    }
    test() {
        var _a, _b;
        (_a = this._map) === null || _a === void 0 ? void 0 : _a.addLayer(new TileLayer({ source: new OSM() }));
        let geojson = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "properties": {},
                    "geometry": {
                        "coordinates": [
                            127.13494823457324,
                            37.176669269068114
                        ],
                        "type": "Point"
                    }
                },
                {
                    "type": "Feature",
                    "properties": {},
                    "geometry": {
                        "coordinates": [
                            127.13484823457324,
                            37.176669269068114
                        ],
                        "type": "Point"
                    }
                },
                {
                    "type": "Feature",
                    "properties": {},
                    "geometry": {
                        "coordinates": [
                            126.92102210119242,
                            37.259100632956105
                        ],
                        "type": "Point"
                    }
                },
                {
                    "type": "Feature",
                    "properties": {},
                    "geometry": {
                        "coordinates": [
                            127.02348178970817,
                            37.281651559236025
                        ],
                        "type": "Point"
                    }
                },
                {
                    "type": "Feature",
                    "properties": {},
                    "geometry": {
                        "coordinates": [
                            126.75186297386847,
                            37.42218873353694
                        ],
                        "type": "Point"
                    }
                },
                {
                    "type": "Feature",
                    "properties": {},
                    "geometry": {
                        "coordinates": [
                            126.75186297386847,
                            37.4221887336
                        ],
                        "type": "Point"
                    }
                },
                {
                    "type": "Feature",
                    "properties": {},
                    "geometry": {
                        "coordinates": [
                            [126.75186297386847,
                                37.42218873353694],
                            [127.02348178970817,
                                37.281651559236025],
                            [126.00048178970817,
                                37.271651559236025]
                        ],
                        "type": "LineString"
                    }
                },
            ]
        };
        let geojsonSource = new VectorSource({
            features: new GeoJSON().readFeatures(geojson),
        });
        console.info(geojsonSource.getFeatures());
        const layerVector = new VectorLayer({
            source: geojsonSource,
            style: new Style({
                stroke: new Stroke({
                    color: '#ffcc33',
                    width: 2,
                }),
                text: new Text({
                    textAlign: "center",
                    textBaseline: "middle",
                    font: "Blod" + " " + "30px" + "/" + 3 + " " + "arial",
                    text: "111111111111111",
                    fill: new Fill({ color: "blue" }),
                    stroke: new Stroke({ color: "0xff00ff", width: 3.0 }),
                    offsetX: 0,
                    offsetY: 0,
                    placement: "line",
                    maxAngle: Math.PI / 4,
                    overflow: false,
                    rotation: 0.0,
                }),
            }),
        });
        this._map.addLayer(layerVector);
        const a = geojsonSource.getFeatures()[0];
        this.connectInfoViewOn(a, (f) => {
            const container = document.createElement('div');
            container.style.width = '300px';
            container.style.backgroundColor = '#ff0000';
            container.innerHTML = "test";
            return container;
        });
        const b = geojsonSource.getFeatures()[1];
        this.connectInfoViewOn(b, (f) => {
            const container = document.createElement('div');
            container.style.width = '300px';
            container.style.backgroundColor = '#ff0000';
            container.innerHTML = "test";
            return container;
        });
        const c = geojsonSource.getFeatures()[6];
        this.connectInfoViewOn(c, (f) => {
            const container = document.createElement('div');
            container.style.width = '300px';
            container.style.backgroundColor = '#ff0000';
            container.innerHTML = "test";
            return container;
        });
        let geometryFunction;
        const draw = new Draw({
            source: undefined,
            type: "LineString",
            geometryFunction: geometryFunction,
        });
        this._map.addInteraction(draw);
        const modify = new Modify({ source: geojsonSource });
        (_b = this._map) === null || _b === void 0 ? void 0 : _b.addInteraction(modify);
        /* const draw = new Draw({
             source: geojsonSource as VectorSource,
             type: FeatureType.Point,
             geometryFunction: geometryFunction,
           });
           this._map?.addInteraction( draw );
     */
        const snap = new Snap({ source: geojsonSource });
        //this._map?.addInteraction( snap);
    }
}
_OGIS_instances = new WeakSet(), _OGIS_initMultiSelect = function _OGIS_initMultiSelect() {
    this.multiSelectOverlay = new Overlay({
        element: undefined,
        autoPan: {
            animation: {
                duration: 25,
            },
        },
    });
    const overlayManager = new OverlayManager(this.multiSelectOverlay);
    this.overlayManager = overlayManager;
    this._map.addOverlay(this.multiSelectOverlay);
    const multiSelect = new Select({
        multi: true,
        layers: undefined,
        features: undefined,
    });
    multiSelect.on('select', event => {
        var _a, _b, _c;
        console.log("event", event);
        console.log("event.selected", event.selected);
        if (event.selected.length == 0) {
            (_a = this.multiSelectOverlay) === null || _a === void 0 ? void 0 : _a.setPosition(undefined);
            return;
        }
        let em = this.multiSelectContainer(overlayManager, event.selected);
        (_b = this.multiSelectOverlay) === null || _b === void 0 ? void 0 : _b.setElement(em);
        //this.MultiSelectOverlay.setPosition(event.selected[0].getGeometry().getFirstCoordinate())
        (_c = this.multiSelectOverlay) === null || _c === void 0 ? void 0 : _c.setPosition(event.mapBrowserEvent.map.getCoordinateFromPixel(event.mapBrowserEvent.pixel));
    });
    this._map.addInteraction(multiSelect);
};
export { OGIS };
