var demoBase = require('./base')
var baboon = require('baboon-image')
var lena = require('lena')
var createTex = require('gl-texture2d')

var tex, tex2, time = 0

demoBase(render, start, { dynamic: true, capacity: 3 })

//A dynamic batch is one that has vertex attributes being
//pushed to it while bound. This means that if it reaches
//its capacity, or if a new texture is provided, it will
//flush the previous stack of attributes to the GPU.

//This is convenient for particle systems or other scenes that
//are constantly adding/removing new textures and sprites

//The "dynamic" flag to the Batch constructor is an optional hint for
//how the buffer will be stored on the GPU.

function render(gl, width, height, dt, batch, shader) {
    time+=dt
    var anim = Math.sin(time/1000)/2+0.5
        
    //clear the batch to zero
    batch.clear()

    //bind before drawing
    batch.bind(shader)

    //push our sprites which may have a variety
    //of textures
    batch.push({
        position: [anim*100, anim*50],
        shape: [128, 128],
        texture: tex2
    })

    batch.push({
        position: [100, 100],
        shape: [128, 128],
        color: [1, 1, 1, 0.5],
        texture: tex
    })
    batch.push({
        position: [300, 100],
        shape: [128, 128],
        color: [1, 1, 1, 0.5],
        texcoord: [0, 0, 2.5, 2.5],
        texture: tex
    })


    batch.push({
        texture: null,
        position: [100+100*Math.sin(time/2000), 100],
        shape: [63, 63],
        color: [anim, 0, 0, 1.0]
    })


    //we need to flush any outstanding sprites
    batch.draw()

    //and unbind it...
    batch.unbind()
}

function start(gl) {
    tex = createTex(gl, baboon)
    tex.wrap = gl.REPEAT

    tex2 = createTex(gl, lena)
}

