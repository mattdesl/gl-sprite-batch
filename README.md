# gl-sprite-batch

[![experimental](http://badges.github.io/stability-badges/dist/experimental.svg)](http://github.com/badges/stability-badges)

This is a high level 2D sprite (i.e. textured quad) batcher, ideal for optimized rendering of text glyphs, particles, sprites, rectangles/lines, icons, etc. 

Pushing attributes onto the stack may trigger a draw call, if we've reached the capacity of the batch.

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

#### shorthand

For convenience, and for scene graphs that operate on "sprite" objects, you can pass the object to the `push()` method. Note that if `texture` isn't specified, it will use the previous state. 

```js
batch.bind(shader)

batch.push({
    texture: tex,           //defaults to last state
    color: [1, 0, 0, 1],    //defaults to [1, 1, 1, 1]
    texcoord: [0, 0, 1, 1], //defaults to [0, 0, 1, 1]
    shape: [25, 25],        //defaults to [0, 0]
    position: [0, 0]        //defaults to [0, 0]
})

batch.unbind()
```

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
texcoord = [0, 0, 1, 1]
color = [1, 1, 1, 1]
shape = [0, 0]
position = [0, 0]
```

#### `batch.push([sprite])`

Pushes the current vertex attributes onto the stack for rendering. If `sprite` is specified, it will try using those fields, or their respective defaults if they are falsey in the `sprite` object (see [shorthand](#shorthand)). 

#### `batch.premultiplied`

A boolean, default `false`, that described whether to alpha premultiply the current color before pushing the sprite onto the stack.

#### `batch.count`

A read-only number representing the maximum number of sprites this batch can draw at once. 

#### `batch.dispose()`

Disposes the batch and its buffers/VAO.



## License

MIT, see [LICENSE.md](http://github.com/mattdesl/gl-sprite-batch/blob/master/LICENSE.md) for details.
