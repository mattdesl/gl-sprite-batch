var createBuffer = require('gl-buffer')
var createVAO = require('gl-aliased-vao') //TODO: improve this with gl-vao
var colorToFloat = require('./pack-rgba-float')
var mixes = require('mixes')
var premult = require('premultiplied-rgba')

var vertNumFloats = 5

//Temporary arrays to avoid GC thrashing
var position = [0, 0],
    shape = [0, 0],
    texcoord = [0, 0, 0, 0],
    color = [0, 0, 0, 0]

var tmp4 = [0, 0, 0, 0]

function SpriteBatch(gl, opt) {
    if (!(this instanceof SpriteBatch))
        return new SpriteBatch(gl, opt)
    if (!gl)
        throw new Error("must specify gl context")

    opt = opt || {}

    this._lastTexture = null
    this.premultiplied = false

    var count = typeof opt.count === 'number' ? opt.count : 500

    // 65535 is max index, so 65535 / 6 = 10922.
    if (count > 10922)
        throw new Error("Can't have more than 10922 quads per batch: " + count)

    //the total number of floats in our batch
    var numVerts = count * 4 * vertNumFloats

    //the total number of indices in our batch
    var numIndices = count * 6

    this._count = count
    this.idx = 0

    //default attributes
    this.reset()
    this.texture = null

    //vertex data
    this.vertices = new Float32Array(numVerts)
    //index data
    this.indices = new Uint16Array(numIndices)

    for (var i = 0, j = 0; i < numIndices; i += 6, j += 4) {
        this.indices[i + 0] = j + 0
        this.indices[i + 1] = j + 1
        this.indices[i + 2] = j + 2
        this.indices[i + 3] = j + 0
        this.indices[i + 4] = j + 2
        this.indices[i + 5] = j + 3
    }

    this.vertexBuffer = createBuffer(gl, this.vertices, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW)
    this.indexBuffer = createBuffer(gl, this.indices, gl.ELEMENT_ARRAY_BUFFER, gl.STATIC_DRAW)

    var stride = 5 * 4
    this.vao = createVAO(gl, [{ //position XY
        name: 'position',
        buffer: this.vertexBuffer,
        size: 2,
        stride: stride
    }, { //texcoord UV
        name: 'texcoord0',
        buffer: this.vertexBuffer,
        size: 2,
        offset: 2 * 4,
        stride: stride
    }, { //color (packed) C
        name: 'color',
        buffer: this.vertexBuffer,
        size: 4,
        stride: stride,
        offset: 4 * 4,
        type: gl.UNSIGNED_BYTE,
        normalized: true
    }], this.indexBuffer)
}

mixes(SpriteBatch, {

    count: {
        get: function() {
            return this._count
        }
    },

    dispose: function() {
        this.vertexBuffer.dispose()
        this.indexBuffer.dispose()
        this.vao.dispose()
    },

    bind: function(shader) {
        this.idx = 0
        this.vao.bind(shader)
    },

    unbind: function() {
        if (this.idx > 0)
            this.flush()
        this.vao.unbind()
    },

    reset: function() {
        this.position = copy2(position, 0, 0)
        this.texcoord = copy4(texcoord, 0, 0, 1, 1)
        this.color = copy4(color, 1, 1, 1, 1)
        this.shape = copy2(shape, 0, 0)
        return this
    },

    push: function(sprite) {
        //if we are defining attributes on the fly
        if (sprite) {
            if (sprite.texture)
                this.texture = sprite.texture
            this.position = sprite.position || copy2(position, 0, 0)
            this.texcoord = sprite.texcoord || copy4(texcoord, 0, 0, 1, 1)
            this.color = sprite.color || copy4(color, 1, 1, 1, 1)
            this.shape = sprite.shape || copy2(shape, 0, 0)
        }

        if (this.texture !== this._lastTexture) {
            //new texture, flush previous data
            this.flush()
            this._lastTexture = this.texture
        } else if (this.idx === this.vertices.length) {
            //reached our max, flush data before continuing
            this.flush()
        }

        //get RGBA components and pack into a single float
        var colorRGBA = this.premultiplied ? premult(this.color, tmp4) : this.color
        var c = colorToFloat(colorRGBA)

        //determine new position & texcoords
        var x1 = this.position[0],
            x2 = this.position[0] + this.shape[0],
            y1 = this.position[1],
            y2 = this.position[1] + this.shape[1]

        var u1 = this.texcoord[0],
            v1 = this.texcoord[1],
            u2 = this.texcoord[2],
            v2 = this.texcoord[3]

        var verts = this.vertices,
            idx = this.idx

        //xy
        verts[idx++] = x1
        verts[idx++] = y1
        //uv
        verts[idx++] = u1
        verts[idx++] = v1
        //color
        verts[idx++] = c

        //xy
        verts[idx++] = x2
        verts[idx++] = y1
        //uv
        verts[idx++] = u2
        verts[idx++] = v1
        //color
        verts[idx++] = c

        //xy
        verts[idx++] = x2
        verts[idx++] = y2
        //uv
        verts[idx++] = u2
        verts[idx++] = v2
        //color
        verts[idx++] = c

        //xy
        verts[idx++] = x1
        verts[idx++] = y2
        //uv
        verts[idx++] = u1
        verts[idx++] = v2
        //color
        verts[idx++] = c

        this.idx = idx
        return this
    },

    flush: function() {
        if (this.idx === 0)
            return this
        var view = this.vertices.subarray(0, this.idx)
        this.vertexBuffer.update(view, 0)

        if (this._lastTexture)
            this._lastTexture.bind()

        var sprites = (this.idx / (vertNumFloats * 4))
        if (sprites > 0)
            this.vao.draw(gl.TRIANGLES, sprites * 6, 0)

        this.idx = 0
        return this
    }
})

module.exports = SpriteBatch

//TODO: use gl-matrix for these...
function copy2(out, x, y) {
    out[0] = x
    out[1] = y
    return out
}

function copy4(out, x, y, z, w) {
    out[0] = x
    out[1] = y
    out[2] = z
    out[3] = w
    return out
}

function copyVec2(out, vec) {
    return copy2(out, vec[0], vec[1])
}