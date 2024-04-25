
//base
import ol from 'ol'
import * as olExtent from 'ol/extent';

import OlMap from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';

import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import Overlay from 'ol/Overlay.js';

import Feature, { FeatureLike } from 'ol/Feature.js';
import Geometry from"ol/geom/Geometry.js"

import { Point,LineString ,Polygon, SimpleGeometry} from 'ol/geom';


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
import {unByKey} from 'ol/Observable.js';
import {easeOut} from 'ol/easing.js'
//etc
import GeoJSON from 'ol/format/GeoJSON.js';
import {WKT} from 'ol/format.js'
import {bbox as bboxStrategy} from 'ol/loadingstrategy.js';
import * as Extent from 'ol/extent'
import Layer from 'ol/layer/Layer';
import BaseVectorLayer from 'ol/layer/BaseVector';
import { Coordinate } from 'ol/coordinate';
import { getVectorContext } from 'ol/render';
import CircleStyle from 'ol/style/Circle';


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


     static getCentroid(points) {
      var area = 0,
          cx = 0,
          cy = 0;
    
      for(var i = 0; i < points.length; i++){
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
  console.log("featureList",featureList)
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

type SingleSelectContainer=(overlayManager:OverlayManager,featureList:Array<Feature>)=>HTMLElement;


class ConnectInfoViewData{
  public virtualFeature:Feature|undefined;
  public overLay:Overlay|undefined;
}


class OGIS{
    

    // 기본값들
    private  _targetElement // map이 생성될 target element 이다.
    private  _mapView?:View // 맵뷰지정
    private  _map?:OlMap 


    private multiSelectOverlay?:Overlay;

    //// 멀티셀렉트
    public multiSelectContainer:MultiSelectContainer=defaultMultiSelectContainer; // 멀티셀렉트시 생성 UI
    public multiSelectListener?:MultiSelectListener; // 멀티셀렉트시 콜백리스너
    private overlayManager?:OverlayManager; // 멀티셀렉트 매니저


    //// 싱글셀렉트
    public singleSelectContainer:SingleSelectContainer|undefined; //싱글셀렉트 콘테이너




    //// 가상뷰, 떠있는 정보뷰를 위한
    private connectFeatureInfoHash:Map<Feature,ConnectInfoViewData> = new Map<Feature,ConnectInfoViewData>();

  
    private _stayInfoViewMap=new OlMap()
    private connectFeatureInfoLayer:VectorLayer<VectorSource>=new VectorLayer({
      source: new VectorSource(),
      style: {
        'fill-color': 'rgba(255, 0, 0, 0.9)',
        'stroke-color': 'rgba(255, 0, 0, 0.9)',
        'stroke-width': 1,
        'circle-radius': 7,
        'circle-fill-color': '#ffcc33',
        'stroke-line-dash':[2,3]
        },
        zIndex:100
  });

  





    constructor(target:Element,options:OGISProperty=new OGISProperty())
    {
      
        this._targetElement = target;
        this.init(options)
        this.#initMultiSelect()
        this.initConnectInfoView()
    }

    private init(options:OGISProperty){
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
        this._map=new OlMap({
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

        console.log("event",event)
        console.log("event.selected",event.selected)
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



    /*  ===================== 계속 존재하는 정보뷰 ======================== */
    initConnectInfoView()
    {
      this._map!.addLayer(this.connectFeatureInfoLayer)
    }

   

    connectInfoViewOn(feature:Feature ,viewCreater:(feature:Feature)=>HTMLElement)
    {
      const view = viewCreater(feature)
      const geometry = feature.getGeometry() as SimpleGeometry
      
      /// 내부의 중심을 구한다.
      let originPosition;
      if(geometry.getType() === 'Point' || geometry.getType() ==='LineString')
      {
        originPosition=geometry.getFirstCoordinate()

      }else{

        const centroid = OGisUtils.getCentroid(geometry.getCoordinates())
        console.log("centroid",centroid)
        originPosition=[centroid.x, centroid.y]

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
      let pixel = this._map!.getPixelFromCoordinate(originPosition);
      let floatingCoordinate = originPosition
      if(pixel)
      {
        pixel[0]-=5;
        pixel[1]-=5;
        floatingCoordinate= this._map!.getCoordinateFromPixel(pixel);
      }

      const virtualLineString = new Feature({
        geometry: new LineString([ 
          originPosition ,floatingCoordinate]),
      });

      this.connectFeatureInfoLayer.getSource()?.addFeature(virtualLineString)

      let position;
      if(position===undefined)
      {
         position=virtualLineString.getGeometry()!.getLastCoordinate()
      }


      const overlay:Overlay =  new Overlay({
        element: view,
        position:position,
        positioning:'bottom-center',
        autoPan: {
          animation: {
            duration: 250,
          },
        },
      });

      
      this._map?.addOverlay(overlay);

      const superMap=this._map!

      const draggable = ($target) => {
        let isPress = false,
            preCoo:Coordinate|null =null
            ;

        $target.onmousedown = start;
        $target.onmouseup = end;
       // $target.onmouseout = end;
        

        // 상위 영역
       // window.onmousemove = move;
       superMap.on('pointermove',(e)=>{
        if (!isPress) return;
          if(preCoo===null)
          {
            preCoo=e.coordinate;
          }

        const deletaX = preCoo[0] - e.coordinate[0]; 
        const deletaY = preCoo[1] - e.coordinate[1]; 
       
       console.info(deletaX+deletaY)
       const overlayPosition = overlay.getPosition()!
       const movedX =  overlayPosition[0]-deletaX;
       const movedY = overlayPosition[1]-deletaY;

        overlay.setPosition([
          movedX,
          movedY,
        ])

        virtualLineString.getGeometry()!.setCoordinates(
          [virtualLineString.getGeometry()!.getFirstCoordinate(),
          [
            movedX, movedY
          ]
        ]
        )
        preCoo = e.coordinate

       })
       
        function start(e) {
    
          isPress = true;
        }
  
        function end() {
          
          isPress = false;
          preCoo=null
        }
      }

      draggable(view)

      /// feature 좌표 변경에 대해 연결된 정보뷰의 라인도 움직이게 한다.
      feature.on("change",e=>{
        console.log("change",e)
        virtualLineString.getGeometry()!.setCoordinates(
          [e.target.getGeometry().getFirstCoordinate(),
            virtualLineString.getGeometry()!.getLastCoordinate()
        ]
        )

      })


      const data = new ConnectInfoViewData();
      data.virtualFeature=virtualLineString;
      data.overLay=overlay
      this.connectFeatureInfoHash.set(feature,data);
    }

    
    connectInfoViewOff(feature:Feature)
    {

      const data = this.connectFeatureInfoHash.get(feature)
      if(data)
      {
        if(data.overLay)
        {
          this._map?.removeOverlay(data.overLay);
        }
        if(data.virtualFeature)
        {
          this.connectFeatureInfoLayer.getSource()?.removeFeature(data.virtualFeature)
        }
     
      }
    }




    /* ========================= 편집 기능 =========================== */
    /// 생성기능
    onDrawable(featureMode,source)
    {
  
        let featureType=featureMode;
       
        let geometryFunction;
        if(featureType===FeatureType.PolygonBox)
        {
            featureType='Circle';
            geometryFunction=createBox();
        }

        const modify= new Modify({source: source});
        this._map!.addInteraction(modify);

        const draw = new Draw({
            source: source,
            type: featureType,
            geometryFunction: geometryFunction,
          });
          this._map!.addInteraction( draw );
    
        const snap = new Snap({source: source});
        this._map!.addInteraction( snap);

        

        return {draw:draw,modify:modify,snap:snap}
    }


    /// 생성기능 끄기
    disableDrawAndModify(interactions)
    {
      this._map!.removeInteraction(interactions.draw);
      this._map!.removeInteraction(interactions.modify);
      this._map!.removeInteraction(interactions.snap);
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
            style: new Style( {
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


    
        this._map!.addLayer(layerVector);


        
        const a =  geojsonSource.getFeatures()[0]
        this.connectInfoViewOn(a as Feature,(f)=>{

        
          const container = document.createElement('div');
          container.style.width='300px';
          container.style.backgroundColor='#ff0000'
          container.innerHTML="test";
          return container;

        })
        const b =  geojsonSource.getFeatures()[1]
        this.connectInfoViewOn(b as Feature,(f)=>{

         
          const container = document.createElement('div');
          container.style.width='300px';
          container.style.backgroundColor='#ff0000'
          container.innerHTML="test";
          return container;

        })

        const c =  geojsonSource.getFeatures()[6]
        this.connectInfoViewOn(c as Feature,(f)=>{

         
          const container = document.createElement('div');
          container.style.width='300px';
          container.style.backgroundColor='#ff0000'
          container.innerHTML="test";
          return container;

        })

        let geometryFunction;
      

        const draw = new Draw({
          source: undefined,
          type: "LineString",
          geometryFunction: geometryFunction,
        });
        this._map!.addInteraction( draw );


        const modify= new Modify({source: geojsonSource as VectorSource});
        this._map?.addInteraction(modify);

       /* const draw = new Draw({
            source: geojsonSource as VectorSource,
            type: FeatureType.Point,
            geometryFunction: geometryFunction,
          });
          this._map?.addInteraction( draw );
    */
        const snap = new Snap({source: geojsonSource as VectorSource});
        //this._map?.addInteraction( snap);
        
    }
}

export  {OGIS}