
//base
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';

import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import Overlay from 'ol/Overlay.js';

import Feature from 'ol/Feature.js';


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





////////////////////////////////////////////////////////////////////



const FeatureType = Object.freeze({
    Point:'Point',
    LineString:'LineString',
    Polygon:'Polygon',
    PolygonBox:'PolygonBox'
}) ;



/**
 * 
 * 
 * 
 1. setMultiSelectOverlay : 멀티 선택시 





 */
 class OGis{

    /// todo
    /// select 시 select 한 객체 목록 던져주는 callback
    multi



    /// 다중 select 시 나오는 메뉴 overlay function



    // overlay 를 넣을 <div> element
    overlayContainer=null;
    rasterLayers=[];
    createLayer=null;
    modify=null;



    // Overlay 객체 모음


    /***** feature 선택시 *****/
    /* 
      (this,feature)
    */

    #defaultFeatureInfoViewCallback= (mapManager,feature)=>{
      const container = document.createElement('div');
      container.style.width='300px';
      container.style.backgroundColor='#ff0000'
      container.innerHTML=new WKT().writeGeometry(feature.getGeometry());
     
      return container;
    }
    #featureInfoViewCallback=this.#defaultFeatureInfoViewCallback;
    // feature to Overlay,virtual Point
    #featureInfoOverlayMap=new Map()
    // featureInfo를 띄울 LineString 레이어
    #featureInfoLayer = new VectorLayer({
        source: new VectorSource(),
        style: {
            'fill-color': 'rgba(255, 0, 0, 0.9)',
            'stroke-color': '#ff0000',
            'stroke-width': 1,
            'circle-radius': 7,
            'circle-fill-color': '#ffcc33',
          },
          zIndex:100
    });





    /****************** MultiSelect 를 위한 *******************/
    // 디폴트 함수
    #defaultMultiSelectFunc = (mapManager,overlay,fectureList)=>{
        const container = document.createElement('div');
        container.style.width='300px';
        container.style.backgroundColor='#ff00ff'
        for (const feature of fectureList) {
            let child = document.createElement('div')
            child.innerHTML=new WKT().writeGeometry(feature.getGeometry());
            child.onclick=()=>{ overlay.setPosition(undefined);}
            container.appendChild(child)
          }
          return container;
    };
    // 멀티선택시 콜백(ovelay 객체를 던진다.)
    multiSelectFunc=this.#defaultMultiSelectFunc;

    // 멀티선택시 관리되는 Overlay 객체
    MultiSelectOverlay = null;





    /************* 연결 된 정보 뷰 *************/
    // featureInfo를 띄울 LineString 레이어
    _connectFeatureInfoLayer = new VectorLayer({
      source: new VectorSource(),
      style: {
          'fill-color': 'rgba(255, 0, 0, 0.2)',
          'stroke-color': 'rgba(255, 0, 0, 0.2)',
          'stroke-width': 1,
          'circle-radius': 7,
          'circle-fill-color': '#ffcc33',
        },
        zIndex:100
    });
    get connectFeatureInfoLayer() {
      return this._connectFeatureInfoLayer;
    }







    /***** feature 생성을 위한.. *****/ 
    createLayer=null;
    


    constructor(target)
    {

        this.target = target;
        this.init();

    }


    init()
    {
        ////// 맵만들기
        // view 지정 
        this.mapView = new View({
            center: [126.75186297386847,
                37.42218873353694],
            zoom: 12,
            projection: 'EPSG:4326', //좌표지정
          });

        // 범위지정
        const extent = get('EPSG:4326').getExtent().slice();
        extent[0] += extent[0];
        extent[2] += extent[2];

        // 맵 만들기
        this.map=new Map({
            target: this.target,
            layers: [],
            view: this.mapView,
            extent,
          });
        

        //// 생성만을 위한 임시저장 레이어
        this.createLayer= emptyVectorLayer();

        //// 다중 선택 초기화
        this.#initMultiSelect();

        
        /// 선택시 overlay layer
        this.map.addLayer(this.#featureInfoLayer )
       

        /// 연결 정보 보여주기용 Layer
        this.map.addLayer(this._connectFeatureInfoLayer )


        // 테스트
        this.test();

  
         
    }



    /// 다중 선택 초기화
    #initMultiSelect()
    {
        this.MultiSelectOverlay =  new Overlay({
            element: null,
            autoPan: {
              animation: {
                duration: 25,
              },
            },
          });

        this.map.addOverlay(this.MultiSelectOverlay);

        const multiSelect = new Select({multi:true
        });

        multiSelect.on('select',event=>{
          if(select.selected.length==0)
          {
            return ;
          }

           let em = this.multiSelectFunc(this, this.MultiSelectOverlay,event.selected);
           this.MultiSelectOverlay.setElement(em)
           //this.MultiSelectOverlay.setPosition(event.selected[0].getGeometry().getFirstCoordinate())
           this.MultiSelectOverlay.setPosition(event.mapBrowserEvent.map.getCoordinateFromPixel(event.mapBrowserEvent.pixel))
        })

        this.map.addInteraction(multiSelect)
    }

    


    /// 다중 선택시 나오는 Overlay UI
    /**
     * 
     * @param {(this,overlay,fectureList) : return element} func 
     */
    setMultiSelectOverlay(func)
    {
        this.multiSelectFunc = func;
    }


    list = [];
    connectInfoViewOn(feature,view)
    {  
      //console.log(feature);
       this.list.push(feature)
       if(this.list.length>1)
        return

        while(this.list.length>0)
        {
         const element =  this.list.shift()
          console.log("for   === "+ element);
          this._connectInfoViewOn(feature,view)
        
        }

    
     
    }

    /**
     * 연결 된 정보 뷰
     */
  
    _connectInfoViewOn(feature,view)
    {
    
      const originPosition = feature.getGeometry().getFirstCoordinate();
      
      // 띄울 좌표
      const pixel = this.map.getPixelFromCoordinate(originPosition);
      pixel[0]-=5;
      pixel[1]-=5;
      const floatingCoordinate= this.map.getCoordinateFromPixel(pixel);


      const virtualLineString = new Feature({
        geometry: new LineString([ 
          originPosition ,floatingCoordinate]),
      });

 
      this.connectFeatureInfoLayer.getSource().addFeature(virtualLineString)


      let position;
      if(position===undefined)
      {
         position=virtualLineString.getGeometry().getLastCoordinate()
      }

      const overlay =  new Overlay({
        element: view,
        position:position,
        positioning:'bottom-center',
        autoPan: {
          animation: {
            duration: 20,
          },
        },
      });


      this.map.addOverlay(overlay);

      const draggable = ($target) => {
        let isPress = false,
            preCoo =null
            ;

        $target.onmousedown = start;
        $target.onmouseup = end;
       // $target.onmouseout = end;
          
        // 상위 영역
       // window.onmousemove = move;
       this.map.on('pointermove',(e)=>{
        if (!isPress) return;
          if(preCoo===null)
          {
            preCoo=e.coordinate;
          }

        const deletaX = preCoo[0] - e.coordinate[0]; 
        const deletaY = preCoo[1] - e.coordinate[1]; 
       
       console.info(deletaX+deletaY)

       const movedX =  overlay.getPosition()[0]-deletaX;
       const movedY = overlay.getPosition()[1]-deletaY;

        overlay.setPosition([
          movedX,
          movedY,
        ])

        virtualLineString.getGeometry().setCoordinates(
          [virtualLineString.getGeometry().getFirstCoordinate(),
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

    }








    /**
     * feature의 정보뷰를 보인다.
     * 
     * @param {Feature} feature 
     * @param {Coordinate , undefined} position 
     */

    infoViewOn(feature,position){
     
/*
      virtualPoint.setStyle(
        new Style({
          fill: new Fill({
            color: "orange"
          }),
          stroke: new Stroke({
            color:"orange",
            width: 4,
          }),
          geometry: function(vfeature) {
            // return the coordinates of the first ring of the polygon
            var geometries = [];
            const endP=vfeature.getGeometry().getFirstCoordinate();
            const  startP=feature.getGeometry().getFirstCoordinate();
            geometries.push(startP)
            geometries.push(endP)
            console.info(new LineString(geometries))
            return new LineString(geometries);
          }
        })
      );
      */
      const virtualPoint = new Feature({
        geometry: new LineString([  feature.getGeometry().getFirstCoordinate()   , [ 127.00494823457324,
          37.006669269068114]]),
      });

      this.#featureInfoLayer.getSource().addFeature(virtualPoint)
      


      if(position===undefined)
      {
        position=virtualPoint.getGeometry().getLastCoordinate()
      }
    

      const view= this.#featureInfoViewCallback(this,feature);
      const overlay =  new Overlay({
        element: view,
        position:position,
        positioning:'bottom-center',
        autoPan: {
          animation: {
            duration: 250,
          },
        },
      });

      this.#featureInfoOverlayMap.set(feature,overlay)
      this.map.addOverlay(overlay);






      const draggable = ($target) => {
        let isPress = false,
            prevPosX = 0,
            prevPosY = 0,
            preCoo =null
            ;

      
        
        $target.onmousedown = start;
        $target.onmouseup = end;
          
        // 상위 영역
       // window.onmousemove = move;
       this.map.on('pointermove',(e)=>{
        if (!isPress) return;
          if(preCoo===null)
          {
            console.info("preCoo"+e.coordinate)
            preCoo=e.coordinate;
          }


        const posX = preCoo[0] - e.coordinate[0]; 
        const posY = preCoo[1] - e.coordinate[1]; 
       
       
        overlay.getPosition()[0]-posX;
        overlay.setPosition([
          overlay.getPosition()[0]-posX,
          overlay.getPosition()[1]-posY,
        ])

        console.info(virtualPoint.getGeometry())
        virtualPoint.getGeometry().setCoordinates(
          [virtualPoint.getGeometry().getCoordinates()[0],
          [
            virtualPoint.getGeometry().getCoordinates()[1][0]-posX,
            virtualPoint.getGeometry().getCoordinates()[1][1]-posY,
          ]
        ]
        )
        preCoo = e.coordinate

       })
       
        function start(e) {
          prevPosX = e.clientX;
          prevPosY = e.clientY;
         // preCoo=virtualPoint.getGeometry().getLastCoordinate();
      
          isPress = true;
        }
      
        function move(e) {
          if (!isPress) return;
      
          const posX = prevPosX - e.clientX; 
          const posY = prevPosY - e.clientY; 
          
          prevPosX = e.clientX; 
          prevPosY = e.clientY;

          /*virtualPoint.setGeometry([virtualPoint.getGeometry().getFirstCoordinate()
          ,
          ])*/
          
          $target.style.left = ($target.offsetLeft - posX) + "px";
          $target.style.top = ($target.offsetTop - posY) + "px";
        }
      
        function end() {
          isPress = false;
          preCoo=null
        }
      }

      draggable(view)


    }





    
        /**
     * 
     * @param {FeatureType} featureType 
     */
        newFeatureDrawOn(featureMode)
        {
            this.map.addLayer(this.createLayer);
            this.#drawAble(FeatureType, this.createLayer.getSource())
        }
        /**
         *  @param {Object} interactions - {draw:draw,modify:modify,snap:snap}
         */
        drawOff(interactions)
        {   
            this.#drawDisable(interactions)
        }
    


        addVectorLayer(layer)
        {
          this.map.addLayer(layer)
    
        }









    test()
    {
     this.addRaster('BaseLayer',new TileLayer({source: new OSM()}))

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
            source:geojsonSource,
            style: {
            'fill-color': 'rgba(255, 255, 255, 0.2)',
            'stroke-color': '#ffcc33',
            'stroke-width': 2,
            'circle-radius': 7,
            'circle-fill-color': '#ff0000',
          },
        });


        this.map.addLayer(layerVector);


       const selectStyle= function selectStyle(feature) {
  
            const color = feature.get('COLOR') || '#eeeeee';
            //feature.getFill().setColor(color);
            return //selected;
          }


               /// popup
               var newDiv = document.createElement('button');
               newDiv.value= "Hide Filter"
               newDiv.style.width = "300px";
               newDiv.style.height = "300px";
                
               const overlay = new Overlay({
                element: newDiv,
                autoPan: {
                  animation: {
                    duration: 250,
                  },
                },
              });
               this.map.addOverlay(overlay);




        const selectSingleClick = new Select({style: selectStyle});
        //this.map.addInteraction(selectSingleClick);
        selectSingleClick.on('select', function (e) {
          
            const ft= e.selected[0];
            console.info(ft)
          
           let firstCoordinate =  ft.getGeometry().getFirstCoordinate()
           const centerPoint = ft.getGeometry().getCenter();
           console.info( "center"+centerPoint)
           console.info(centerPoint)


            overlay.setPosition(centerPoint);

          });

          this.infoViewOn(geojsonSource.getFeatures()[5]);
    }

    /**
     * 레스터 레이어를 추가한다.
     * 
     * @param {String} name 
     * @param {Layer} layer 
     */
    addRaster(name, layer)
    {
        if(this.rasterLayers[name]==true){
            this.map.removeLayer(rasterLayers[name])
        }
        this.rasterLayers[name]=layer;
        this.map.addLayer(this.rasterLayers[name])
    }

    removeRaster(name)
    {
        if(this.rasterLayers[name]==true){
            this.map.removeLayer(rasterLayers[name])
        }

        let index = this.rasterLayers.indexOf(name);
        this.rasterLayers.slice(index,1);    
    }







    createOverlay(element)
    {
        var marker = new ol.Overlay({
            position: [i, i],
            positioning: 'center-center',
            element: document.getElementById('marker'),
            stopEvent: false
        });
    }
    
    /**
     * 
     */
    #drawAble(featureMode,source)
    {
        let featureType=featureMode;
        let geometryFunction;
        if(featureType===FeatureType.PolygonBox)
        {
            featureType='Circle';
            geometryFunction=createBox();
        }

        const modify= new Modify({source: source});
        this.map.addInteraction(modify);

        const draw = new Draw({
            source: source,
            type: featureType,
            geometryFunction: geometryFunction,
          });
          this.map.addInteraction( draw );
    
        const snap = new Snap({source: source});
        this.map.addInteraction( snap);

        return {draw:draw,modify:modify,snap:snap}
    }

    /**
     * 
     * @param {Object} interactions - {draw:draw,modify:modify,snap:snap}
     */
    #drawDisable(interactions)
    {
        this.map.removeInteraction(interactions.draw);
        this.map.removeInteraction(interactions.modify);
        this.map.removeInteraction(interactions.snap);
    }




}

function test(){console.info('aaaaaaaaaaaa')}

export{OGis,FeatureType,test}