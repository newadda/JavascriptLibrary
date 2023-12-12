import { GeoJSON } from "ol/format";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";



function testVectorLayer()
{
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
                37.42218873353694]
                ,[ 127.02348178970817,
                  37.281651559236025]
                  ,[ 126.00048178970817,
                    37.271651559236025]
              ],
              "type": "LineString"
            }
          },
        ]
      };

   let geojsonSource =  new VectorSource({
        features: new GeoJSON().readFeatures(geojson),
      });

      console.info(geojsonSource.getFeatures())

      const layerVector = new VectorLayer({
        source:geojsonSource as any,
        style: {
        'fill-color': 'rgba(255, 255, 255, 0.2)',
        'stroke-color': '#ffcc33',
        'stroke-width': 2,
        'circle-radius': 7,
        'circle-fill-color': '#ff0000',
      },
    });
}