<template>
  <div >
 
    <canvas ref="can" style="width: 500px; height: 500px"></canvas>
  </div>
</template>

<script>
import { defineComponent } from "vue";

class Point{
    x=0
    y=0
    constructor(x,y){
        this.x=x;
        this.y=y;
    }
}

class Line{
    printList = [];
    constructor(){
        this.printList.push(new Point(12,12));
        this.printList.push(new Point(20,20));
        this.printList.push(new Point(30,30));
    }

    draw(canvas){
        const ctx = canvas.getContext("2d");
        
        let i=0;
        for(let point of this.printList)
        {
            console.info(point)
            if(i===0)
            {
                
                ctx.moveTo(point.x, point.y)
                i++;
            }else{
                ctx.lineTo(point.x, point.y)
            }
        }
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'blue';
        ctx.stroke();
       
    }
}



export default defineComponent({
  setup() {},
  data() {
    return {

    };
  },
  mounted() {
    this.draw();
  },
  methods: {
    draw() {
      let canvas = this.$refs['can'];
      let line = new Line();
      line.draw(canvas)
      console.info("test")
    },
  },

});
</script>