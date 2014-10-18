var demoBase = require('./base')
var baboon = require('baboon-image')
var lena = require('lena')
var createTex = require('gl-texture2d')

var tex, tex2, time = 0

demoBase(render, start, { capacity: 100 })

//A static batch can fill quads for a single texture,
//until a capacity is reached. 

//When calling draw(), only the last set texture will be used for all quads.

//You will want to set an explicit count for the batch to ensure all sprites are rendered.

function render(gl, width, height, dt, batch, shader) {
    time+=dt
    
    //switching textures is free, and doesn't update any buffers
    if (time > 1000) {
        batch.texture = batch.texture === tex2 ? tex : tex2
        time = 0
    }

    //draw our static vertex data
    batch.bind(shader)
    batch.draw()
    batch.unbind()
}

function start(gl, width, height, batch) {
    tex = createTex(gl, baboon)
    tex2 = createTex(gl, lena)

    build(batch, tex)
        
}

function build(batch, tex) {
    //If we need to ensure a certain capacity, we could re-build the batch:
    // batch.create({ count: 100 })

    //clear the batch to zero sprites
    batch.clear()

    var cols = 10,
        rows = 10,
        sx = 10,
        sy = 10

    for (var i=0; i<cols*rows; i++) {
        var x = i % cols,
            y = ~~( i / cols );
        batch.push({
            texture: tex,
            position: [x*30 + sx, y*30 + sy],
            shape: [25, 25],
            color: [1, 1, 1, 1.0]
        })
    }
}