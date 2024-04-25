<template>
  <div ref="htmlContent">
    <slot :features="features"></slot>
    
  </div>    


</template>


<script lang="ts">

import {
  inject,
  provide,
  onUnmounted,
  onMounted,
  watch,
  ref,
  reactive,
  computed 
} from "vue";
import Map from 'ol/Map';
import Overlay from 'ol/Overlay.js';
// interaction
import {Draw, Modify, Snap} from 'ol/interaction.js';
import Select from 'ol/interaction/Select.js';
import Feature from 'ol/Feature.js';
import {altKeyOnly, click, pointerMove} from 'ol/events/condition.js';
import {Fill, Stroke, Style} from 'ol/style.js';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM.js';
import VectorSource from 'ol/source/Vector.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import VectorLayer from 'ol/layer/Vector.js';



export default {
  components: {
   
  },

  setup() {
  
    const multiSelectOverlay = ref()
    const state = reactive({ 
        features:[],
    })
    const features = ref<[]>()

    const map = inject<Map>("map");

    const htmlContent = ref(null);
    const source = inject("vectorSource");
    
    


    map?.on("click",(e)=>{
 
      map?.forEachFeatureAtPixel(e.pixel,(feature)=>{
        console.info("forEachFeatureAtPixel",feature)
        return false;
      
      },{hitTolerance:5})
    })

    
   
    
    console.info(111)
    multiSelectOverlay.value =  new Overlay({
        element: undefined,
        autoPan: {
          animation: {
            duration: 25,
          },
        },
      });

  
      map?.addOverlay(multiSelectOverlay.value);

      const multiSelect = new Select({
        multi:true,
        layers:undefined,
        features:undefined,
        filter:undefined,
        hitTolerance:20,
        style:new Style({
  fill: new Fill({
    color: '#eeeeee',
  }),
  stroke: new Stroke({
    color: 'rgba(255, 255, 255, 0.7)',
    width: 2,
  }),
})
      });

      
      multiSelect.on('select',event=>{

        console.log("event",event)
        console.log("event.selected",event.selected)
        if(event.selected.length==0)
        {
          multiSelectOverlay.value?.setPosition(undefined)
          return ;
        }
     
         multiSelectOverlay.value?.setElement(htmlContent.value)
         //this.MultiSelectOverlay.setPosition(event.selected[0].getGeometry().getFirstCoordinate())
         multiSelectOverlay.value?.setPosition(event.mapBrowserEvent.map.getCoordinateFromPixel(event.mapBrowserEvent.pixel))
      })
   
      //map!.addInteraction(multiSelect)
     

      


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

          const layerVector = new VectorLayer({
            source:geojsonSource as any,
            style: new Style( {
              stroke: new Stroke({
                
                color: '#ffcc33',
                width: 2,
              }),
          
          }),
        });


    
     


        onMounted(() => {
         
          map?.addInteraction(multiSelect)
          map?.addLayer(layerVector);
          console.info(layerVector.getSource())
          console.info(map?.getAllLayers())
          map?.changed();
      });
        
  
   

    return{
        state,
        htmlContent,
        multiSelectOverlay,
        features
    }

  },


}
</script>