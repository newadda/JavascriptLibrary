<template>
    <main style="background-color: blue;min-height: 100vh">
      <div style="width: 100%;height: 100vh;" ref="map" />
    </main>
  </template>

<script lang="ts">
import  * as CL from 'commonlibrary'
import { defineComponent } from "vue";
import { ref } from 'vue'

export default defineComponent({
  components:{},
  setup() {
    const ogis= ref<CL.OGIS>()

    return {
      ogis
    }

  },
  data() {
    return {
      
    };
  },
  mounted() {
    
    this.ogis = new CL.OGIS(this.$refs.map as Element) 
    this.ogis.test()
  },
  test(){
    

  }

})


</script>
  