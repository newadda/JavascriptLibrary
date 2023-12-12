"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const format_1 = require("ol/format");
const Vector_1 = __importDefault(require("ol/layer/Vector"));
const Vector_2 = __importDefault(require("ol/source/Vector"));
function testVectorLayer() {
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
    let geojsonSource = new Vector_2.default({
        features: new format_1.GeoJSON().readFeatures(geojson),
    });
    console.info(geojsonSource.getFeatures());
    const layerVector = new Vector_1.default({
        source: geojsonSource,
        style: {
            'fill-color': 'rgba(255, 255, 255, 0.2)',
            'stroke-color': '#ffcc33',
            'stroke-width': 2,
            'circle-radius': 7,
            'circle-fill-color': '#ff0000',
        },
    });
}
