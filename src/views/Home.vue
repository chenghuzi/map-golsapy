<template>
  <div class="home">
    <!-- <img alt="Vue logo" src="../assets/logo.png"> -->
    <p>x:{{m_x}},y:{{m_y}}</p>

    <span>Choose Grid Type:</span>
    <input type="radio" id="one" value="Wall" v-model="current_focus" />
    <label for="one">Wall</label>
    <input type="radio" id="two" value="Route" v-model="current_focus" />
    <label for="two">Route</label>
    <!-- <input type="radio" id="two" value="Goal" v-model="current_focus" />
    <label for="two">Goal</label>
    <input type="radio" id="two" value="Start" v-model="current_focus" />
    <label for="two">Start</label>-->
    <button @click="export_world">Export Map</button>
    <div id="mapw">
      <div style="width=100%;height:50px;"></div>
      <canvas id="map" width="500" height="500"></canvas>
    </div>
  </div>
</template>

<script>
// @ is an alias to /src

export default {
  name: "Home",
  components: {},
  data() {
    return {
      map_world: null,
      world: null,
      ctx: null,

      m_x: 0,
      m_y: 0,

      num_i: null,
      num_j: null,
      num_i_prev: null,
      num_j_prev: null,

      world_pixel_w: 500,
      world_size: 20,
      gap: 2,
      grid_bg_color: "red",

      state_colors: {
        0: "black", //wall
        1: "white", //route
        2: "red", //goal
        3: "green" //start
      },
      name_states: {
        Wall: 0,
        Route: 1,
        Goal: 2,
        Start: 3
      },
      current_focus: "Route"
    };
  },
  computed: {
    grid_pixel_w() {
      return this.world_pixel_w / this.world_size;
    },
    state_focused() {
      return this.name_states[this.current_focus];
    }
  },
  created() {
    // let map_arr = new Array(this.world_size);
    // for (let i = 0; i < this.world_size; i++) {
    //   map_arr[i] = new Array(this.world_size);
    // }
    let map_arr = new Array();
    for (let i = 0; i < this.world_size * this.world_size; i++) {
      map_arr.push(0);
    }
    this.map_world = map_arr;
  },
  mounted() {
    this.world = document.querySelector("#map");
    console.log(this.world);
    this.ctx = this.world.getContext("2d");

    console.log(this.grid_pixel_w);

    //init the world
    for (let i = 0; i < this.world_size; i++) {
      for (let j = 0; j < this.world_size; j++) {
        // console.log(i, j);
        this.draw_basic_grid(i, j, this.state_colors[0]);
      }
    }
    // finish init the world
    window.addEventListener("mousemove", this.update_mouse_pos);
    window.addEventListener("mousedown", this.change_grid_state);
  },
  beforeDestroy() {
    window.removeEventListener("mousemove", this.update_mouse_pos);
    window.removeEventListener("mousedown", this.change_grid_state);
  },
  // watch: {
  //   map_world(val_new, val_old) {
  //     console.log("old map: ", val_old);
  //     console.log("new map: ", val_new);
  //   }
  // },

  methods: {
    change_grid_state(e) {
      if (e) {
        console.log("clicked ", this.num_i, this.num_j);
        this.operate_on_map(this.num_i, this.num_j, this.state_focused);
        // console.log(this.map_world);
      }
    },
    operate_on_map(i, j, val) {
      this.map_world[j * this.world_size + i] = val;
      this.update_world();
    },
    export_world() {
      let map_normal = new Array();
      for (let i = 0; i < this.world_size; i++) {
        map_normal.push(
          this.map_world.slice(i * this.world_size, (i + 1) * this.world_size)
        );
      }
      console.log(map_normal);

      let csvContent =
        "data:text/csv;charset=utf-8," +
        map_normal.map(e => e.join(",")).join("\n");

      var encodedUri = encodeURI(csvContent);
      var link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "state_map.csv");
      document.body.appendChild(link); // Required for FF
      link.click();
    },
    update_world() {
      for (let i = 0; i < this.map_world.length; i++) {
        let n_row = parseInt(i / this.world_size);
        let n_col = i - n_row * this.world_size;

        if (this.map_world[i] != 0) {
          console.log(
            "num: ",
            i,
            "row:",
            n_row,
            "col:",
            n_col,
            "color:",
            this.state_colors[this.map_world[i]]
          );
        }
        this.draw_basic_grid(
          n_col,
          n_row,
          this.state_colors[this.map_world[i]]
        );
        // console.log("update world at", n_row, n_col);
      }
    },
    draw_square(ctx, x, y, w, color) {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, w);
    },
    update_mouse_pos(e) {
      // get position
      let pos = this.getMousePos(this.world, e);
      this.m_x = pos.x;
      this.m_y = pos.y;

      // flip color

      //get grid position
      this.num_i = parseInt(this.m_x / this.grid_pixel_w);
      this.num_j = parseInt(this.m_y / this.grid_pixel_w);
      //recover previous path
      if (
        this.num_i_prev !== null &&
        this.num_j_prev !== null &&
        (this.num_i_prev != this.num_i || this.num_j_prev != this.num_j)
      ) {
        // console.log("previous grid :", this.num_i_prev, this.num_j_prev);
        // this.draw_basic_grid(
        //   this.num_i_prev,
        //   this.num_j_prev,
        //   this.state_colors[0]
        // );
      }

      // console.log("current grid: ", this.num_i, this.num_j);
      // let drawfinished = this.draw_basic_grid(
      //   this.num_i,
      //   this.num_j,
      //   this.state_colors[1]
      // );
      let drawfinished = true;
      if (drawfinished == true) {
        (this.num_i_prev = this.num_i), (this.num_j_prev = this.num_j);
      }
    },
    draw_basic_grid(i, j, color) {
      this.draw_square(
        this.ctx,
        i * this.grid_pixel_w + this.gap,
        j * this.grid_pixel_w + this.gap,
        this.grid_pixel_w - 2 * this.gap,
        color
      );
      return true;
    },
    getMousePos(canvas, evt) {
      var rect = canvas.getBoundingClientRect();
      // console.log(rect.left, rect.top);
      // console.log(evt.clientX, evt.clientY);
      return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
      };
    },
    mouse_pos(canvas, evt) {
      var rect = canvas.getBoundingClientRect(), // abs. size of element
        scaleX = canvas.width / rect.width, // relationship bitmap vs. element for X
        scaleY = canvas.height / rect.height; // relationship bitmap vs. element for Y

      return {
        x: (evt.clientX - rect.left) * scaleX, // scale mouse coordinates after they have
        y: (evt.clientY - rect.top) * scaleY // been adjusted to be relative to element
      };
    }
  }
};
</script>
<style scoped lang='scss'>
#map {
  // width: 400px;
  // height: 400px;
  background-color: rgb(189, 189, 189);
}

#mapw {
  width: 100%;
  height: 600px;
  background-color: antiquewhite;
}
</style>
