
//base
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';

import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import Overlay from 'ol/Overlay.js';

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


//etc
import GeoJSON from 'ol/format/GeoJSON.js';
import {WKT} from 'ol/format.js'




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
    MultiSelectOverlay = null;



    /** MultiSelect 를 위한 */
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
    //
    multiSelectFunc=this.#defaultMultiSelectFunc;


    /** feature 생성을 위한.. */ 
    createLayer=null;
    


    constructor(target)
    {


        var newDiv = document.createElement("div");
        newDiv.style="display: none";
        target.appendChild(newDiv);
        this.overlayContainer=newDiv;




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
                duration: 250,
              },
            },
          });

        this.map.addOverlay(this.MultiSelectOverlay);

        const multiSelect = new Select({multi:true
        });

        multiSelect.on('select',event=>{
           let em = this.multiSelectFunc(this, this.MultiSelectOverlay,event.selected);
           console.info(em)
           this.MultiSelectOverlay.setElement(em)
           this.MultiSelectOverlay.setPosition(event.selected[0].getGeometry().getFirstCoordinate())
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
              }
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
                

               console.info(this.overlayContainer)
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
            console.info( ft.getGeometry())
           let firstCoordinate =  ft.getGeometry().getFirstCoordinate()
           console.info(firstCoordinate)
            overlay.setPosition(firstCoordinate);

          });

     

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