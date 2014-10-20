# gl-sprite-batch

[![experimental](http://badges.github.io/stability-badges/dist/experimental.svg)](http://github.com/badges/stability-badges)

This is a high level 2D sprite (i.e. textured quad) batcher, ideal for optimized rendering of text glyphs, particles, sprites, rectangles/lines, icons, etc. It tries to push as many sprites into the same draw call as possible, until the capacity is reached or the texture changes. This allows it to take advantage of texture atlases for minimal draw calls.

Each sprite is an indexed quad with its own set of attributes:

- `color` (vec4) - the RGBA color for a sprite
- `position` (vec2) - the x, y position
- `texcoord` (vec2) the UV texcoords for this sprite
- `shape` (vec2) - the width and height of the sprite's quad
- `texture` (gl-texture2d) - a texture or sprite sheet

Note that `shape` and `texture` are not actual *vertex* attributes, although they may affect each sprite.

Typical Example:

```js
//during your render loop...
batch.bind(shader)

//clear the batch to zero sprites
batch.clear()

//add your "sprites"
batch.push({
    position: [x, y],           //defaults to [0, 0]
    shape: [width, height],     //defaults to [0, 0]
    color: [1, 0, 0, 1],        //defaults to [1, 1, 1, 1]
    texcoord: [0, 0, 0.5, 0.5], //defaults to [0, 0, 1, 1]
    texture: myTex              //defaults to 2x2 opaque white tex
})

//flush any remaining sprites
batch.draw()

//unbind it
batch.unbind()
```

## memory efficiency

Object and array literals may be convenient for simple demos, but for larger applications this may lead to GC thrashing. For this you can use the bare `push()` method without any arguments, which will use whatever previous attributes have been set.

```js
//pushes two sprites with some shared attributes
batch.color = red
batch.shape = [width, height]
batch.texture = tex
batch.texcoord = [u, v, u2, v2]

batch.position = posA
batch.push()

batch.position = posB
batch.push()
```

## default texture

If you set the texture to `null` or `undefined`, it will use a [2x2 white texture](https://www.npmjs.org/package/gl-white-texture) while drawing. This is useful for drawing filled primitives like rectangles and lines.

## transform

Often games and UIs will need per-sprite transformations, like rotation, scaling and positioning. Instead of changing uniform values for each sprite, this is often better to do on the CPU. The batch exposes a `transform` field, which can be a 4x4 matrix in the form of an array. You can modify this before calling `push()` to perform vertex transformations on the CPU. By default it is `null`, and transformations are ignored. 

# Rendering Modes

The batch can be used for [dynamic](#dynamic) or [static](#static) quads. 

## dynamic

Dynamic rendering is the easiest and most convenient, and is ideal for particle systems and sprite-based games. In this case, the sprites are pushed after calling `batch.bind(shader)`. This means that it can flush to the GPU when it reaches the max capacity, or when a new texture is being drawn.

To minimize flushes, you should always aim to use texture atlases. You can also provide a `dynamic` hint to the constructor, which allows the WebGL buffers to be optimized for dynamic updates. 

The default batch capacity is 100, which you may want to alter for your needs.

```js
var Batch = require('gl-sprite-batch')

//hint that we're using dynamic buffers
var batch = Batch({ dynamic: true })

function render(shader) {
    //bind the batch with your desired shader
    batch.bind(shader)

    //clear the batch to zero sprites
    batch.clear()

    //draw a variety of sprites/textures...
    batch.push({
        texture: myTex,
        position: [0, 0],
        shape: [128, 128]
    })
    batch.push({
        texture: otherTex,
        position: [0, 0],
        shape: [64, 64]
    })
    
    //now flush any remaining sprites and unbind the VAO
    batch.draw()
    batch.unbind()
}
```

## static

A static batch is only suitable for a single texture (or sprite sheet) and a fixed capacity of sprites. This allows you to push a lot of sprites in a single draw call (like text glyphs) and leave them in a static buffer on the GPU.

For static usage, the sprites should be pushed before calling `bind()`. If you reach the max capacity, it will stop pushing new sprites to the batch. The batch will draw with whatever texture was last set (which means you can swap textures without updating any buffers). 

Usually this is only needed if you find that dynamic batching is leading to bottlenecks. 

```js
var Batch = require('gl-sprite-batch')

//draws max 100 sprites
var batch = Batch({ capacity: 100 })

//push all our sprites
sprites.forEach(function(s) {
    batch.push(s)
})

//draw the static batch
function render(shader) {
    batch.bind(shader)
    batch.draw()
    batch.unbind()
}
```

## Usage

[![NPM](https://nodei.co/npm/gl-sprite-batch.png)](https://nodei.co/npm/gl-sprite-batch/)

#### `batch = SpriteBatch([opts])`

Creates a new sprite batch with the given options.

- `capacity` the max # of sprites that will be issued in a single draw call, default 100
- `dynamic` a hint for buffer usage; default false
- `mode` the mode used during rendering, default `gl.TRIANGLES`
- `premultiplied` whether to premultiply RGB colors by their alpha component before pushing them to buffers, default false


#### `batch.create([opt])`

Disposes of the current buffers and re-builds them with the specified options:

- `capacity` the max # of sprites that will be issued in a single draw call, default 100
- `dynamic` a hint for buffer usage; default false

#### `batch.bind(shader)`

Binds the vertex array and specified shader. If sprites are pushed after this, they may be flushed to the GPU (i.e. if the texture changes or the capacity is reached). 

#### `batch.draw()`

Draws any remaining sprites to the screen. 

#### `batch.unbind()`

Unbinds the vertex array.

#### `batch.defaults()`

Resets the vertex attributes to their default states:

```js
batch.texcoord = [0, 0, 1, 1]
batch.color = [1, 1, 1, 1]
batch.shape = [0, 0]
batch.position = [0, 0]
```

#### `batch.clear()`

Sets the buffer index to zero, essentially "clearing" the batch. Any subsequent sprites will be added to the start of the buffer.

#### `batch.push([sprite])`

Pushes the current vertex attributes onto the stack for rendering. If `sprite` is specified, it will try using those fields, or their respective defaults if they are falsey in the `sprite` object (see [shorthand](#shorthand)). 

#### `batch.flush()`

Submits the current batch contents to the GPU, then calls `clear()`. This is needed during dynamic rendering, i.e. if we've reached the batch capacity, or if we're switching textures. This is also necessary before updating shader uniforms or changing GL state.

#### `batch.dispose()`

Disposes the batch and its buffers/VAO.

#### `batch.premultiplied`

A boolean, default `false`, that described whether to alpha premultiply the current color while pushing it onto the vertex attribute stack.

#### `batch.capacity`

A read-only number representing the maximum number of sprites this batch can draw at once. 

#### `batch.texture`

A getter/setter for the batch's texture. If set to `null`, it will default to a [white 2x2 texture](https://www.npmjs.org/package/gl-white-texture).

#### `batch.texcoord` 
#### `batch.color` 
#### `batch.shape` 
#### `batch.position`

Arrays for the current vertex attributes. These will not change unless a call to `push()` includes a `sprite` parameter.

#### `batch.transform`

A 4x4 matrix array to transform each 2D point by. Default null (i.e. no transformation).

#### `batch.mode`

The primitive drawing mode set during initialization; default `gl.TRIANGLES`.

## License

MIT, see [LICENSE.md](http://github.com/mattdesl/gl-sprite-batch/blob/master/LICENSE.md) for details.
