<template>
    <ol-map
      :loadTilesWhileAnimating="true"
      :loadTilesWhileInteracting="true"
      style="height: 400px"
    >
      <ol-view
        ref="view"
        :center="center"
        :rotation="rotation"
        :zoom="zoom"
        :projection="projection"
      />
      
      <ol-tile-layer>
      <ol-source-osm />
    </ol-tile-layer>

    <ol-vector-layer>
      <ol-source-vector
        ref="cities"
        url="https://raw.githubusercontent.com/alpers/Turkey-Maps-GeoJSON/master/tr-cities-airports.json"
        :format="geoJson"
        :projection="projection"
      >
      </ol-source-vector>

      <ol-style>
        <ol-style-stroke color="red" :width="2"></ol-style-stroke>
        <ol-style-fill color="rgba(255,255,255,0.1)"></ol-style-fill>
        <ol-style-circle :radius="7">
          <ol-style-fill color="blue"></ol-style-fill>
        </ol-style-circle>
      </ol-style>
    </ol-vector-layer>
  
    <ol-vector-layer>
      <ol-source-vector>
        <ol-feature>
          <ol-geom-point :coordinates="coordinate"></ol-geom-point>
          <ol-style>
            <ol-style-circle :radius="radius">
              <ol-style-fill :color="fillColor"></ol-style-fill>
              <ol-style-stroke
                :color="strokeColor"
                :width="strokeWidth"
              ></ol-style-stroke>
            </ol-style-circle>
          </ol-style>
        </ol-feature>
      </ol-source-vector>
    </ol-vector-layer>

      <OlmultiSelect>
        <div></div>
      </OlmultiSelect>


 

    
    </ol-map>
  </template>
  
  <script setup lang="ts">
  import { ref,inject } from "vue";
  import  * as CL from 'commonlibrary'
  import OlmultiSelect from '..//components/OlMultiSelect.vue'


  const center = ref([40, 40]);
  const projection = ref("EPSG:4326");
  const zoom = ref(8);
  const rotation = ref(0);


  const format = inject("ol-format");

  const geoJson = new format.GeoJSON();



  const coordinate = ref([40, 40]);
  const radius = ref(40);
const strokeWidth = ref(10);
const strokeColor = ref("red");
const fillColor = ref("white");
  </script>