<template>
  <div>
    <button @click="modi">수정</button>
    <div ref="map" style="width: 100%; height: 800px"></div>
  </div>
  <MultipleSelectMenu ref="msm"></MultipleSelectMenu>
</template>

<script>
import { defineComponent } from "vue";
import { OGis, FeatureType, test } from "../lib/gis/gislib";

import OSM from "ol/source/OSM.js";
import TileLayer from "ol/layer/Tile.js";

import VectorLayer from "ol/layer/Vector.js";
import VectorSource from "ol/source/Vector.js";
import GeoJSON from "ol/format/GeoJSON.js";
import { bbox as bboxStrategy } from "ol/loadingstrategy.js";
// style
import { Circle, Fill, Icon, Stroke, Style, Text } from "ol/style.js";



import {WKT} from 'ol/format.js'
import MultipleSelectMenu from "@/lib/gis/waterworks/MultipleSelectMenu.vue"
import { createApp } from 'vue'

export default defineComponent({
  components:{MultipleSelectMenu},
  setup() {},
  data() {
    return {
      ogis: null,
    };
  },
  mounted() {
    test();
    let ogis = new OGis(this.$refs.map);

    /// 여러개 선택시 오버레이 설정 테스트
    ogis.setMultiSelectOverlay((mapManager,overlay,fectureList)=>{
        const container = document.createElement('div');
        container.style.width='300px';
        container.style.backgroundColor='#ff00ff'
        for (const feature of fectureList) {
            let child = document.createElement('div')
            createApp(MultipleSelectMenu).mount(child)
            //child.innerHTML=;
            child.onclick=()=>{ overlay.setPosition(undefined);}
            container.appendChild(child)
          }
          return container;
    })



    const pipeSource = new VectorSource({
      format: new GeoJSON(),
      url: function (extent) {
        return (
          "http://127.0.0.1:8081/geoserver/waterworks/ows?service=WFS&" +
          "version=1.1.0&request=GetFeature&typeName=waterworks:FTR_WTL_PIPE_LM&" +
          "outputFormat=application/json&srsname=EPSG:4326&maxFeatures=30&" +
          "bbox=" +
          extent.join(",") +
          ",EPSG:4326"
        );
      },
      strategy: bboxStrategy,
    });

    const pipeVector = new VectorLayer({
      source: pipeSource,
      style: new Style({
        stroke: new Stroke({
          color: "green",
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

      zIndex: 102,
    });

    // ogis.drawOn(FeatureType.PolygonBox);
    this.ogis = ogis;

    this.ogis.addVectorLayer(pipeVector);

    let is=false;
    pipeSource.on('addfeature',e=>{
      //if(is==true)
     // return 
     
      const container =document.createElement('div');
      container.style.width='300px';
      container.style.backgroundColor='#ff0000'
      container.innerHTML='222222222222222222222222222222222';

    this.ogis.connectInfoViewOn(e.feature,container)
    is=true;

    })


    
  
    


  },
  methods: {
    modi() {
      this.ogis.modifyFeature();
    },
    abti() {
      let geojson = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {},
            geometry: {
              coordinates: [127.72459494610746, 36.72507494392501],
              type: "Point",
            },
          },
          {
            type: "Feature",
            properties: {},
            geometry: {
              coordinates: [127.70069374990237, 36.10991249986158],
              type: "Point",
            },
          },
        ],
      };
    },
  },
});
</script>
