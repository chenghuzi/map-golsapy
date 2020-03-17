export default {
    map_2_transition(map_normal, action_set) {
        //map_normal: 2d nxn matrix of states
        let world_size = map_normal.length
        let states = new Array();
        for (let i = 0; i < world_size; i++) {
            for (let j = 0; j < world_size; j++) {
                if (map_normal[i][j] > 0) {
                    states.push([i, j]);
                }
            }
        }

        let matrix_transition = init_2d_zeros(states.length);

        //transition matrix
        for (let i = 0; i < states.length; i++) {
            let grid_prev = states[i];
            for (let j = 0; j < states.length; j++) {
                let grid_now = states[j];
                if (grid_now[0] - grid_prev[0] == 1 && grid_now[1] == grid_prev[1]) {
                    matrix_transition[i][j] = action_set.D;
                    // console.log(grid_prev, grid_now, "D")
                } else if (
                    grid_now[0] - grid_prev[0] == -1 &&
                    grid_now[1] == grid_prev[1]

                ) {
                    matrix_transition[i][j] = action_set.U;
                    // console.log(grid_prev, grid_now, "U")
                } else if (
                    grid_now[1] - grid_prev[1] == 1 &&
                    grid_now[0] == grid_prev[0]
                ) {
                    matrix_transition[i][j] = action_set.R;
                    // console.log(grid_prev, grid_now, "R")
                } else if (
                    grid_now[1] - grid_prev[1] == -1 &&
                    grid_now[0] == grid_prev[0]
                ) {
                    matrix_transition[i][j] = action_set.L;
                    // console.log(grid_prev, grid_now, "L")
                } else {
                    matrix_transition[i][j] = 0;
                }
            }
        }
        return {
            matrix_transition: matrix_transition,
            states: states
        };
    },

    init_2d_zeros: init_2d_zeros
}

function init_2d_zeros(len) {
    let matrix = new Array();
    for (let i = 0; i < len; i++) {
        let row = new Array();
        for (let j = 0; j < len; j++) {
            row.push(0);
        }
        matrix.push(row);
    }
    return matrix;
}