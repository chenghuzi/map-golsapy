<template>
  <div class="home">
    <div class="container" style="margin:50px auto">
      <div class="columns has-text-left">
        <div class="column">
          <h1 class="is-size-4">Current Grid Position</h1>
          <h1 class="is-size-4">(Row:{{num_j}}, Col:{{num_i}})</h1>
          <!-- <h1 class="is-size-4">(m_x:{{m_x}}, m_y:{{m_x}})</h1> -->
          <hr />
          <b-field label="Map Name">
            <b-input v-model="map_name"></b-input>
          </b-field>
          <hr />

          <h1 class="is-size-4">Choose Block Type</h1>
          <div>
            <b-radio
              v-model="current_focus"
              name="name"
              native-value="Wall"
            >Wall ({{state_colors[0]}})</b-radio>
            <b-radio
              v-model="current_focus"
              name="name"
              native-value="Route"
            >Route ({{state_colors[1]}})</b-radio>
            <b-radio
              v-model="current_focus"
              name="name"
              native-value="Goal"
            >Goal ({{state_colors[2]}})</b-radio>
            <b-radio
              v-model="current_focus"
              name="name"
              native-value="Start"
            >Start ({{state_colors[3]}})</b-radio>
          </div>
          <hr />
          <h1 class="is-size-4">
            Export States:
            <b-button @click="export_world">Download</b-button>
          </h1>
          <div style="width:100%; height:30px;"></div>
          <b-message>
            <p class="is-size-5">DATA format:</p>
            <p>States Map: {{map_name+'_map.csv'}}</p>
            <p>States Dict: {{map_name+'_states.csv'}}</p>
            <p>Transition Matrix: {{map_name+'_transition.csv'}}</p>
            <br />
            <p>Action code:</p>
            <pre>L: 1,R: 2,U: 3,D: 4</pre>
            <p>State code:</p>
            <pre>Wall: 0, Route: 1, Goal: 2, Start: 3</pre>
          </b-message>
        </div>
        <div class="column has-text-center">
          <h1 class="is-size-4">Click to change the block state</h1>
          <div id="mapw">
            <canvas id="map" width="500" height="500" style="z-index: 0;position: absolute;"></canvas>
            <canvas id="maptext" width="500" height="500" style="z-index:1;position: absolute;"></canvas>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import utils from "@/tools/utils";
import JSZip from "jszip";
import { saveAs } from "file-saver";
// @ is an alias to /src

export default {
  name: "Home",
  components: {},
  data() {
    return {
      map_name: "simple",
      map_world: null,
      world: null,
      ctx: null,
      world_text: null,
      ctx_text: null,

      m_x: 0,
      m_y: 0,

      num_i: null,
      num_j: null,
      num_i_prev: null,
      num_j_prev: null,

      world_pixel_w: 500,
      world_size: 15,
      gap: 2,

      state_colors: {
        0: "black", //wall
        1: "white", //route
        2: "red", //goal
        3: "green" //start
      },
      annotation_color: "blue",
      name_states: {
        Wall: 0,
        Route: 1,
        Goal: 2,
        Start: 3
      },
      action_set: {
        L: 1,
        R: 2,
        U: 3,
        D: 4
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
    let map_arr = new Array();
    for (let i = 0; i < this.world_size * this.world_size; i++) {
      map_arr.push(0);
    }
    this.map_world = map_arr;
  },
  mounted() {
    this.world = document.querySelector("#map");
    this.ctx = this.world.getContext("2d");

    this.world_text = document.querySelector("#maptext");
    this.ctx_text = this.world_text.getContext("2d");
    //init the world
    this.update_world();

    // finish init the world
    window.addEventListener("mousemove", this.update_mouse_pos);
    window.addEventListener("mouseup", this.change_grid_state);
  },

  methods: {
    change_grid_state(e) {
      if (e) {
        if (
          this.m_x < 0 ||
          this.m_x > this.world_pixel_w ||
          this.m_y < 0 ||
          this.m_y > this.world_pixel_w
        ) {
          return false;
        }
        // console.log("clicked ", this.num_i, this.num_j);
        if (this.current_focus == "Goal" || this.current_focus == "Start") {
          if (this.read_from_map(this.num_i, this.num_j) == 0) {
            alert(
              "Cannot put Goal or Start on Wall grid, please change it to Route first!"
            );
            return false;
          }
        }
        if (this.current_focus == "Start") {
          //clear previous starts
          this.clear_starts_on_map();
        }
        this.operate_on_map(
          this.num_i,
          this.num_j,
          this.name_states[this.current_focus]
        );
        return true;
      }
    },
    clear_starts_on_map() {
      for (let i = 0; i < this.map_world.length; i++) {
        if (this.map_world[i] == 3) {
          this.map_world[i] = 1;
        }
      }
    },
    operate_on_map(i, j, val) {
      this.map_world[j * this.world_size + i] = val;
      this.update_world();
    },
    read_from_map(i, j) {
      return this.map_world[j * this.world_size + i];
    },
    export_world() {
      let map_normal = new Array();
      for (let i = 0; i < this.world_size; i++) {
        map_normal.push(
          this.map_world.slice(i * this.world_size, (i + 1) * this.world_size)
        );
      }

      let map_result = utils.map_2_transition(map_normal, this.action_set);
      let matrix_transition = map_result.matrix_transition;
      let states = map_result.states;
      ("transition matrix:");
      // console.log(matrix_transition);
      // console.log("states");
      // console.log(states);
      //annotate point number on the map.
      this.annotate_pos_seq(states);

      this.download_file(this.map_name, map_normal, matrix_transition, states);
    },
    download_file(map_name, map_normal, matrix_transition, states) {
      var zip = new JSZip();
      let csv_map = map_normal.map(e => e.join(",")).join("\n");
      zip.file(map_name + "_map.csv", csv_map);

      let csv_transition = matrix_transition.map(e => e.join(",")).join("\n");
      zip.file(map_name + "_transition.csv", csv_transition);
      let csv_states = states.map(e => e.join(",")).join("\n");
      zip.file(map_name + "_states.csv", csv_states);
      zip.generateAsync({ type: "blob" }).then(content => {
        saveAs(content, map_name + ".zip");
      });
    },
    update_world() {
      for (let i = 0; i < this.map_world.length; i++) {
        let n_row = parseInt(i / this.world_size);
        let n_col = i - n_row * this.world_size;

        // if (this.map_world[i] != 0) {
        //   console.log(
        //     "num: ",
        //     i,
        //     "row:",
        //     n_row,
        //     "col:",
        //     n_col,
        //     "color:",
        //     this.state_colors[this.map_world[i]]
        //   );
        // }
        this.draw_basic_grid(
          n_col,
          n_row,
          this.state_colors[this.map_world[i]]
        );
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
      // this.num_i = parseInt(this.m_x / this.grid_pixel_w);
      // this.num_j = parseInt(this.m_y / this.grid_pixel_w);

      let num_i_tmp = parseInt(this.m_x / this.grid_pixel_w);
      let num_j_tmp = parseInt(this.m_y / this.grid_pixel_w);
      if (
        num_i_tmp >= 0 &&
        num_i_tmp < this.world_size &&
        num_j_tmp >= 0 &&
        num_j_tmp < this.world_size
      ) {
        this.num_i = num_i_tmp;
        this.num_j = num_j_tmp;
      }

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
    annotate_pos_seq(states) {
      let ctx = this.ctx_text;
      ctx.clearRect(0, 0, this.world_pixel_w, this.world_pixel_w);
      for (let i = 0; i < states.length; i++) {
        this.annotate_pos(
          ctx,
          states[i][1] * this.grid_pixel_w,
          states[i][0] * this.grid_pixel_w,
          i
        );
      }
    },
    annotate_pos(ctx, i, j, text) {
      // console.log("annotate", i, j, "with text", text);
      ctx.font = "16px monospace";
      ctx.fillStyle = this.annotation_color;
      ctx.textAlign = "center";
      let offset = this.grid_pixel_w / 2;
      ctx.fillText(text.toString(), i + offset, j + offset * 1.3);
    },
    getMousePos(canvas, evt) {
      var rect = canvas.getBoundingClientRect();
      return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
      };
    }
  },
  beforeDestroy() {
    window.removeEventListener("mousemove", this.update_mouse_pos);
    window.removeEventListener("mouseup", this.change_grid_state);
  }
};
</script>
<style scoped lang='scss'>
#map {
  // width: 400px;
  // height: 400px;
  background-color: rgb(211, 211, 211);
}

#mapw {
  width: 100%;
  height: 600px;
  // background-color: antiquewhite;
}
</style>
