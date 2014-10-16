var SpriteBatch = require('../')
var baboon = require('baboon-image')
var lena = require('lena')
var createTex = require('gl-texture2d')
var mat4 = require('gl-mat4')

var createShader = require('gl-basic-shader')

require('canvas-testbed')(render, start, {
    context: 'webgl'
})

var ortho = mat4.create()
var batch, tex, tex2, shader, time=0


function render(gl, width, height, dt) {
    time+=dt
    var anim = Math.sin(time/1000)/2+0.5

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    shader.bind()
    shader.uniforms.texture0 = 0

    //setup ortho projection
    mat4.ortho(ortho, 0, width, height, 0, 0, 1)
    shader.uniforms.projection = ortho

    batch.premultiplied = true
    batch.bind(shader)

    batch.push({
        position: [0, 0],
        shape: [128, 128],
        texture: tex2
    })

    batch.push({
        position: [100, 100],
        shape: [128, 128],
        color: [1, 1, 1, 0.5],
        texture: tex
    })

    batch.unbind()
}

function start(gl) {
    batch = SpriteBatch(gl, {
        size: 2
    })
    tex = createTex(gl, baboon)
    tex2 = createTex(gl, lena)

    shader = createShader(gl, {
        texcoord: true,
        color: true,
        normal: false
    })
}