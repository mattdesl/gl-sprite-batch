# gl-sprite-batch

[![experimental](http://badges.github.io/stability-badges/dist/experimental.svg)](http://github.com/badges/stability-badges)

This is a high level 2D sprite (i.e. textured quad) batcher, ideal for optimized rendering of text glyphs, particles, sprites, rectangles/lines, icons, etc. 

Each sprite is an indexed quad with its own set of attributes:

- `color` (vec4) - the RGBA color for a sprite
- `position` (vec2) - the x, y position
- `texcoord` (vec2) the UV texcoords for this sprite
- `shape` (vec2) - the width and height of a sprite
- `texture` (gl-texture2d) - a texture or sprite sheet

Note that `shape` and `texture` are not actual *vertex* attributes although they may affect each sprite.

It can be used for [dynamic](#dynamic) or [static](#static) rendering.

## dynamic

Dynamic rendering is the easiest and most convenient, and is ideal for particle systems and sprite-based games. In this case, the sprites are pushed to the batch *after it has been bound.* This means that it can flush to the GPU when it reaches the max capacity, or when a new texture is being drawn.

To minimize flushes, you should always aim to use texture atlases. You can also provide a `dynamic` hint to the constructor, which allows the WebGL buffers to be optimized for dynamic rendering. 

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

A static batch is only suitable for a single texture (or sprite sheet) and a fixed capacity of sprites. This allows you to push a lot of static sprites (like text glyphs) and leave them in a static buffer on the GPU.

For static usage, the sprites should be pushed before calling `bind()`. If you reach the max capacity, it will stop pushing new sprites to the batch. The batch will draw with whatever texture was last set (which means you can swap textures without updating any buffers). 

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

## default texture

If you set the texture to `null`, it will reset to a [2x2 white texture](https://www.npmjs.org/package/gl-white-texture). This is useful for drawing filled primitives like rectangles and lines.

## attributes



## transform

Often games and UIs will need per-sprite transformations, like rotation, scaling and positioning. 


The generic "long-winded" approach:

```js
//the texture we're using during rendering
batch.texture = tex

//start rendering with specified shader
batch.bind(shader)

//setup per-sprite vertex attributes 
batch.color = color           //[r, g, b, a]
batch.texcoord = [0, 0, 1, 1] //[u1, v1, u2, v2]
batch.shape = [128, 128]      //[width, height]
batch.position = [0, 0]       //[x, y]

//push current attributes onto the stack as a new sprite
batch.push()

batch.unbind()
```

Attributes carry over to subsequent calls to `push()` unless they are changed.

If the `texture` has changed from the last `push()`, the batch will be flushed. The batch will also avoid overflow, flushing when its capacity is reached. This means each sprite can have different textures; although generally you should use sprite sheets to reduce draw calls. This also means that draw calls may be issued at any point between bind() and unbind(). 

If `texture` is null, it will be assigned to an opaque white texture. This allows for tinted and filled rectangles to be drawn with the same shader and batcher. 

#### shorthand

For convenience, and for scene graphs that operate on "sprite" objects, you can pass the object to the `push()` method. For undefined fields, they will be set to their default (initial) state. The texture will also default here to the white 1x1 texture, for tinted sprites. 



## Usage

[![NPM](https://nodei.co/npm/gl-sprite-batch.png)](https://nodei.co/npm/gl-sprite-batch/)


#### `batch = SpriteBatch([opts])`

Creates a new sprite batch with the given options.

- `count` the max # of sprites that will be issued in a single draw call

#### `batch.bind(shader)`

Binds the vertex array with the specified shader.

#### `batch.unbind()`

Draws any remaining sprites to the screen and unbinds the vertex array.

#### `batch.reset()`

Resets the vertex attributes to their initial state:

```js
batch.texcoord = [0, 0, 1, 1]
batch.color = [1, 1, 1, 1]
batch.shape = [0, 0]
batch.position = [0, 0]
```

#### `batch.push([sprite])`

Pushes the current vertex attributes onto the stack for rendering. If `sprite` is specified, it will try using those fields, or their respective defaults if they are falsey in the `sprite` object (see [shorthand](#shorthand)). 

#### `batch.premultiplied`

A boolean, default `false`, that described whether to alpha premultiply the current color while pushing it onto the vertex attribute stack.

#### `batch.count`

A read-only number representing the maximum number of sprites this batch can draw at once. 

#### `batch.texture`

A getter/setter for the batch's texture. If set to `null`, it will default to a [white 1x1 texture](https://www.npmjs.org/package/gl-white-texture).

#### `batch.texcoord` (vec4)
#### `batch.color` (vec4)
#### `batch.shape` (vec2)
#### `batch.position` (vec2)

Arrays for the current vertex attributes. These will not change unless a call to `push()` includes a `sprite` parameter.

#### `batch.dispose()`

Disposes the batch and its buffers/VAO.

#### `batch.transform`

A 4x4 matrix to transform each 2D point by. See below.


## CPU Transformations

Most sprite-based games will want a fast per-sprite transformation (i.e. for rotation)

## License

MIT, see [LICENSE.md](http://github.com/mattdesl/gl-sprite-batch/blob/master/LICENSE.md) for details.
