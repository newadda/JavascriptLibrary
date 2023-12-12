
//base
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';

import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import Overlay from 'ol/Overlay.js';

import Feature from 'ol/Feature.js';
import Geometry from"ol/geom/Geometry.js"

import { Point,LineString ,Polygon} from 'ol/geom';


// source
import XYZ from 'ol/source/XYZ';
import OSM from 'ol/source/OSM.js';

// interaction
import {Draw, Modify, Snap} from 'ol/interaction.js';
import Select from 'ol/interaction/Select.js';

import {
    createBox,
    createRegularPolygon,
  } from 'ol/interaction/Draw.js';


import {get, toLonLat} from 'ol/proj.js';

// style
import {Circle, Fill, Icon, Stroke, Style, Text} from 'ol/style.js';


//etc
import GeoJSON from 'ol/format/GeoJSON.js';
import {WKT} from 'ol/format.js'
import {bbox as bboxStrategy} from 'ol/loadingstrategy.js';
import * as Extent from 'ol/extent'


////////// Utils
class OGisUtils{


    static  testBaseLayer()
     {
         return new TileLayer({source: new OSM()})
     }
     
     /**
      *  Geojson 객체를 VectorSource로 만듬
      */
     static createVectorSourceWithGeojson(geojsonObject)
     {
        return new VectorSource({
             features: new GeoJSON().readFeatures(geojsonObject),
           });
     }
 
     static createDefaultStyle(feature)
     {
         const styles={
             'Point' :new Style({
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
         }
 
         const geometry = feature.getGeometry()
         if(geometry instanceof Point)
         {
            
             return styles[Point.name]
         }
 
     }
 }
 

 // 빈 vector layer 
function emptyVectorLayer()
{
    const source =new VectorSource();
    const layerVector = new VectorLayer({
        source:source,
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
    Point:'Point',
    LineString:'LineString',
    Polygon:'Polygon',
    PolygonBox:'PolygonBox'
}) ;


class OGISProperty{
    center:any[2]= [126.75186297386847,
        37.42218873353694]
    zoom:Number=12;
    projection:String='EPSG:4326'

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
class OverlayManager{
  overlay:Overlay;
  constructor(overlay:Overlay)
  {
    this.overlay=overlay;
  }

  overlayerClose(){
    this.overlay.setPosition(undefined)
  }
}

type MultiSelectContainer=(overlayManager:OverlayManager,featureList:Array<Feature>)=>HTMLElement;
type MultiSelectListener=(featureList:Array<Feature>)=>void;
const defaultMultiSelectContainer:MultiSelectContainer = (overlayManager:OverlayManager,featureList:Array<Feature>)=>{
  const container = document.createElement('div');
  container.style.width='300px';
  container.style.backgroundColor='#ff00ff'
  for (const feature of featureList) {
      
      let child = document.createElement('div')
      const geometry = feature.getGeometry()
      if(geometry)
      {
        child.innerHTML=new WKT().writeGeometry(geometry);
      }
      child.onclick=()=>{ overlayManager.overlayerClose();}
      container.appendChild(child)
    }
    return container;
};

class OGIS{
    

    // 기본값들
    private  _targetElement // map이 생성될 target element 이다.
    private  _mapView?:View // 맵뷰지정
    private  _map?:Map 


    private multiSelectOverlay?:Overlay;

    //// 멀티셀렉트
    public multiSelectContainer:MultiSelectContainer=defaultMultiSelectContainer; // 멀티셀렉트시 생성 UI
    public multiSelectListener?:MultiSelectListener; // 멀티셀렉트시 콜백리스너
    private overlayManager?:OverlayManager; // 멀티셀렉트 매니저



    constructor(target:Element,options:OGISProperty=new OGISProperty())
    {
      
        this._targetElement = target;
        this.init(options)
        this.#initMultiSelect()
    }

    init(options:OGISProperty){
        Object.assign(options,new OGISProperty())
        this._mapView = new View(options as any);

          // 범위지정
          const extent = get(this._mapView.getProjection())?.getExtent().slice();
          if(extent)
          {
            extent[0] += extent[0];
            extent[2] += extent[2];

          }
          
           // 맵 만들기
        this._map=new Map({
            target: this._targetElement,
            layers: [new TileLayer({source: new OSM()})],
            view: this._mapView,
          });
    }

    /* =============== 멀티 셀렉트 처리 ====================== */

    #initMultiSelect()
    {
      this.multiSelectOverlay =  new Overlay({
        element: undefined,
        autoPan: {
          animation: {
            duration: 25,
          },
        },
      });

      const overlayManager=new OverlayManager(this.multiSelectOverlay);
      this.overlayManager=overlayManager

      this._map!.addOverlay(this.multiSelectOverlay);
      const multiSelect = new Select({
        multi:true,
        layers:undefined,
        features:undefined,
      });

      multiSelect.on('select',event=>{
    
        if(event.selected.length==0)
        {
          this.multiSelectOverlay?.setPosition(undefined)
          return ;
        }
     
         let em = this.multiSelectContainer(overlayManager!,event.selected);
         this.multiSelectOverlay?.setElement(em)
         //this.MultiSelectOverlay.setPosition(event.selected[0].getGeometry().getFirstCoordinate())
         this.multiSelectOverlay?.setPosition(event.mapBrowserEvent.map.getCoordinateFromPixel(event.mapBrowserEvent.pixel))
      })

      this._map!.addInteraction(multiSelect)
    }



    public test()
    {
      this._map?.addLayer(
      new TileLayer({source: new OSM()}))

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


        this._map!.addLayer(layerVector);
    }
}

export  {OGIS}