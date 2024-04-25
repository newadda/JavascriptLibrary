<template>
  <div ref="htmlContent">
    <slot :features="features"></slot>
  </div>    
</template>
<script setup>
</script>
<script lang="js">
import {
  inject,
  provide,
  onUnmounted,
  onMounted,
  watch,
  ref,
  reactive
} from "vue";
import OlMap from 'ol/Map';

export default {
  components: {
    ComponentA
  },
  setup() {
    const state = reactive({ 
        features:[],
        map:null
    })
    const htmlContent = ref(null);
    const multiSelectOverlay = ref(null);
    return{
        state,
        htmlContent,
        multiSelectOverlay
    }

  },
  onMounted(){
    this.state.map = inject<Map>("map");

    this.multiSelectOverlay =  new Overlay({
        element: undefined,
        autoPan: {
          animation: {
            duration: 25,
          },
        },
      });

      this.state.map?.addOverlay(this.multiSelectOverlay);
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
     
         this.multiSelectOverlay?.setElement(this.htmlContent)
         //this.MultiSelectOverlay.setPosition(event.selected[0].getGeometry().getFirstCoordinate())
         this.multiSelectOverlay?.setPosition(event.mapBrowserEvent.map.getCoordinateFromPixel(event.mapBrowserEvent.pixel))
      })

      this.state.map?.addInteraction(multiSelect)

  },
  addOverlay(){


  }

}
</script>