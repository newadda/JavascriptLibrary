<template>


<div>
    <button @click="modi">수정</button>
    <div ref="map"   style="width: 100%;height: 800px"></div>
</div>


</template>

<script>
import { defineComponent } from 'vue'
import {OGis,FeatureType,test} from '../lib/gis/gislib'

import OSM from 'ol/source/OSM.js';
import TileLayer from 'ol/layer/Tile.js';

export default defineComponent({
    setup() {
        

    },
    data() {
    return {
        ogis:null,
    }
  },
    mounted(){
        test();
        let ogis = new OGis(this.$refs.map)
      
       // ogis.drawOn(FeatureType.PolygonBox);
        this.ogis=ogis;
    },
    methods:{
        modi(){
            this.ogis.modifyFeature()
        },
        abti()
        {

            let geojson = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {},
      "geometry": {
        "coordinates": [
          127.72459494610746,
          36.72507494392501
        ],
        "type": "Point"
      }
    },
    {
      "type": "Feature",
      "properties": {},
      "geometry": {
        "coordinates": [
          127.70069374990237,
          36.10991249986158
        ],
        "type": "Point"
      }
    }
  ]
};


        },
    }
})
</script>
