"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _OGIS_instances, _OGIS_initMultiSelect;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OGIS = void 0;
//base
const Map_1 = __importDefault(require("ol/Map"));
const View_1 = __importDefault(require("ol/View"));
const Tile_1 = __importDefault(require("ol/layer/Tile"));
const Vector_js_1 = __importDefault(require("ol/layer/Vector.js"));
const Vector_js_2 = __importDefault(require("ol/source/Vector.js"));
const Overlay_js_1 = __importDefault(require("ol/Overlay.js"));
const geom_1 = require("ol/geom");
const OSM_js_1 = __importDefault(require("ol/source/OSM.js"));
const Select_js_1 = __importDefault(require("ol/interaction/Select.js"));
const proj_js_1 = require("ol/proj.js");
// style
const style_js_1 = require("ol/style.js");
//etc
const GeoJSON_js_1 = __importDefault(require("ol/format/GeoJSON.js"));
const format_js_1 = require("ol/format.js");
////////// Utils
class OGisUtils {
    static testBaseLayer() {
        return new Tile_1.default({ source: new OSM_js_1.default() });
    }
    /**
     *  Geojson 객체를 VectorSource로 만듬
     */
    static createVectorSourceWithGeojson(geojsonObject) {
        return new Vector_js_2.default({
            features: new GeoJSON_js_1.default().readFeatures(geojsonObject),
        });
    }
    static createDefaultStyle(feature) {
        const styles = {
            'Point': new style_js_1.Style({
                image: new style_js_1.Circle({
                    radius: 7,
                    fill: new style_js_1.Fill({
                        color: 'black',
                    }),
                    stroke: new style_js_1.Stroke({
                        color: 'white',
                        width: 2,
                    }),
                }),
            })
        };
        const geometry = feature.getGeometry();
        if (geometry instanceof geom_1.Point) {
            return styles[geom_1.Point.name];
        }
    }
}
// 빈 vector layer 
function emptyVectorLayer() {
    const source = new Vector_js_2.default();
    const layerVector = new Vector_js_1.default({
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
    for (const feature of featureList) {
        let child = document.createElement('div');
        const geometry = feature.getGeometry();
        if (geometry) {
            child.innerHTML = new format_js_1.WKT().writeGeometry(geometry);
        }
        child.onclick = () => { overlayManager.overlayerClose(); };
        container.appendChild(child);
    }
    return container;
};
class OGIS {
    constructor(target, options = new OGISProperty()) {
        _OGIS_instances.add(this);
        //// 멀티셀렉트
        this.multiSelectContainer = defaultMultiSelectContainer; // 멀티셀렉트시 생성 UI
        this._targetElement = target;
        this.init(options);
        __classPrivateFieldGet(this, _OGIS_instances, "m", _OGIS_initMultiSelect).call(this);
    }
    init(options) {
        var _a;
        Object.assign(options, new OGISProperty());
        this._mapView = new View_1.default(options);
        // 범위지정
        const extent = (_a = (0, proj_js_1.get)(this._mapView.getProjection())) === null || _a === void 0 ? void 0 : _a.getExtent().slice();
        if (extent) {
            extent[0] += extent[0];
            extent[2] += extent[2];
        }
        // 맵 만들기
        this._map = new Map_1.default({
            target: this._targetElement,
            layers: [new Tile_1.default({ source: new OSM_js_1.default() })],
            view: this._mapView,
        });
    }
    test() {
        var _a;
        (_a = this._map) === null || _a === void 0 ? void 0 : _a.addLayer(new Tile_1.default({ source: new OSM_js_1.default() }));
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
        let geojsonSource = new Vector_js_2.default({
            features: new GeoJSON_js_1.default().readFeatures(geojson),
        });
        console.info(geojsonSource.getFeatures());
        const layerVector = new Vector_js_1.default({
            source: geojsonSource,
            style: {
                'fill-color': 'rgba(255, 255, 255, 0.2)',
                'stroke-color': '#ffcc33',
                'stroke-width': 2,
                'circle-radius': 7,
                'circle-fill-color': '#ff0000',
            },
        });
        this._map.addLayer(layerVector);
    }
}
exports.OGIS = OGIS;
_OGIS_instances = new WeakSet(), _OGIS_initMultiSelect = function _OGIS_initMultiSelect() {
    this.multiSelectOverlay = new Overlay_js_1.default({
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
    const multiSelect = new Select_js_1.default({
        multi: true,
        layers: undefined,
        features: undefined,
    });
    multiSelect.on('select', event => {
        var _a, _b, _c;
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
