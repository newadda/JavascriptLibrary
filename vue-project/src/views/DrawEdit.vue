<template>
  <div>
    <div  style="width: 500px; height: 500px ; position:relative">
     <!-- <div style="position:absolute;width:10px;height:10px;border-radius:50%;background-color:red;top:10px;left:200px"></div>-->
    </div>
    <div   ref="container" style="width: 500px; height: 500px ; position:relative">
            <canvas ref="can" style="width: 500px; height: 500px;position:absolute">    </canvas>
    </div>

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
    isEdit=false;

    constructor(){
        this.printList.push(new Point(12,12));
        this.printList.push(new Point(20,20));
        this.printList.push(new Point(30,30));
        this.isEdit=false;
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

/*
        if(this.isEdit==false)
        {
          retrun ;
        }*/
        for(let point of this.printList)
        {
          const temp = document.createElement("div");
          temp.style="position:absolute;width:10px;height:10px;border-radius:50%;background-color:black"
          //temp.textContent=point
          //temp.innerHTML = '<div></div>'
         // temp.style.width = "10px";
          //temp.style.height = "10px";
         // temp.style.background-color = "black";
          temp.style.position = "absolute";
          temp.style.top=point.y+'px';
          temp.style.left=point.x+'px';
          canvas.parentElement.appendChild(temp)

          console.info(temp)
  
        }



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