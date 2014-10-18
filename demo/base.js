var SpriteBatch = require('../')
var baboon = require('baboon-image')
var lena = require('lena')
var createTex = require('gl-texture2d')
var mat4 = require('gl-mat4')
var xtend = require('xtend')
var createShader = require('gl-basic-shader')

module.exports = function(render, start, opt) {
    require('canvas-testbed')(renderBase, startBase, xtend(opt, {
        context: 'webgl'
    }))

    var ortho = mat4.create()
    var batch, shader

    function renderBase(gl, width, height, dt) {
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
        batch.premultiplied = true
        
        shader.bind()
        shader.uniforms.texture0 = 0

        //setup ortho projection
        mat4.ortho(ortho, 0, width, height, 0, 0, 1)
        shader.uniforms.projection = ortho

        render(gl, width, height, dt, batch, shader)
    }

    function startBase(gl, width, height) {
        batch = SpriteBatch(gl, opt)

        shader = createShader(gl, {
            texcoord: true,
            color: true,
            normal: false
        })

        start(gl, width, height, batch, shader)
    }
}