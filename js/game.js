var Map = function() {
    this.focus = {
        x: 0,
        y: 0
    };
    this.ground = [];
    this.sprites = [];

    this.get_ground = function(x, y, z, property) {
        if (
                !this.ground ||
                !this.ground[z] ||
                !this.ground[z][x] ||
                !this.ground[z][x][y]
           ) {
            return undefined;
        } else if (property !== undefined) {
            return this.ground[z][x][y][property];
        } else {
            return this.ground[z][x][y];
        }
    };

    this.get_sprites = function(x, y, z, index, property) {
        if (
                !this.sprites ||
                !this.sprites[z] ||
                !this.sprites[z][x] ||
                !this.sprites[z][x][y]
           ) {
            return undefined;
        } else if (index !== undefined) {
            if (!this.sprites[z][x][y][index]) {
                return undefined;
            } else {
                if (property !== undefined) {
                    return this.sprites[z][x][y][index][property];
                } else {
                    return this.sprites[z][x][y][index];
                }
            }
        } else {
            return this.sprites[z][x][y];
        }
    };

    this.relocate_sprite = function(sprite, x, y, z) {
        var oldSprites = this.get_sprites(sprite.x, sprite.y, sprite.z);
        if (oldSprites) {
            var index = oldSprites.indexOf(sprite);
            if (index !== -1) {
                oldSprites.splice(index, 1);
            }
        }
        if (!this.sprites) {
            this.sprites = []
        }
        if (!this.sprites[z]) {
            this.sprites[z] = {}
        }
        if (!this.sprites[z][x]) {
            this.sprites[z][x] = {}
        }
        if (!this.sprites[z][x][y]) {
            this.sprites[z][x][y] = []
        }

        this.get_sprites(x, y, z).push(sprite);
        sprite.x = x;
        sprite.y = y;
        sprite.z = z;
    };

    this.passable = function(x, y, z) {
        var tile_p = this.get_ground(x,y,z,"passable");
        var sprites = this.get_sprites(x,y,z);
        if (!tile_p) {
            return false;
        }
        if (sprites) {
            var p = true;
            var i;
            for (i = 0; i < sprites.length; i++) {
                if (sprites[i]) {
                    if (!sprites[i].passable) {
                        p = false;
                    }
                }
            }
            if (!p) {
                return false;
            }
        }
        return true;
    };

    this.draw = function(ctx, x_min, y_min, x_max, y_max) {
        var x_offset = (x_min + x_max - TILE_SIZE) / 2;
        var y_offset = (y_min + y_max - TILE_SIZE) / 2;

        var x_radius = Math.ceil((x_max - x_min) / TILE_SIZE);
        var y_radius = Math.ceil((y_max - y_min) / TILE_SIZE);

        var x_min_tile = -x_radius;
        var y_min_tile = -y_radius;
        var x_max_tile = x_radius;
        var y_max_tile = y_radius;

        if (this.focus !== undefined) {
            x_offset -= this.focus.x*TILE_SIZE + this.focus.x_offset;
            y_offset -= this.focus.y*TILE_SIZE + this.focus.y_offset;
            x_min_tile += this.focus.x;
            y_min_tile += this.focus.y;
            x_max_tile += this.focus.x;
            y_max_tile += this.focus.y;
        }

        var l, i , j;
        for (l = 0; l < this.ground.length; l++) {
            for(i = x_min_tile; i < x_max_tile; i++) {
                for(j = y_min_tile; j < y_max_tile; j++) {
                    var tile = this.get_ground(i, j, l);
                    if (tile) {
                        tile.draw_relative(context, x_offset, y_offset);
                    }
                }
            }
        }
        var l, i, j, k;
        for (l = 0; l < this.sprites.length; l++) {
            for(i = x_min_tile; i < x_max_tile; i++) {
                for(j = y_min_tile; j < y_max_tile; j++) {
                    var sprites = this.get_sprites(i, j, l);
                    if (sprites) {
                        for (k = 0; k < sprites.length; k++) {
                            sprites[k].draw_relative(context, x_offset, y_offset);
                        }
                    }
                }
            }
        }
    };
};

var Tile = function(image, x, y, z, passable) {
    this.image = image;
    this.passable = true;
    this.x = 0;
    this.y = 0;
    this.z = 0;

    if (passable !== undefined) { this.passable = passable; }
    if (x !== undefined) { this.x = x; }
    if (y !== undefined) { this.y = y; }
    if (z !== undefined) { this.z = z; }

    this.draw_relative = function(ctx, x_offset, y_offset) {
        ctx.drawImage(
            image_list[this.image],
            parseInt(this.x*TILE_SIZE + x_offset),
            parseInt(this.y*TILE_SIZE + y_offset)
        );
    };

    this.draw = function(ctx, x, y) {
        ctx.drawImage(
            image_list[this.image],
            parseInt(x),
            parseInt(y)
        );
    };
};

var Sprite = function(image, image_suffix, x, y, z, passable, has_health, health, otherMap) {
    this.acting = false;
    this.animations = [];
    this.has_health = false;
    this.health = health;
    this.health_max = health;
    this.image = image;
    this.image_suffix = "";
    this.time_passed = 0;
    this.passable = false;
    this.x_offset = 0;
    this.y_offset = 0;
    this.x = 0;
    this.y = 0;
    this.z = 0;

    if (this.has_health !== undefined) { this.has_health = has_health; }
    if (passable !== undefined) { this.passable = passable; }
    if (image_suffix !== undefined) { this.image_suffix = image_suffix; }
    if (x !== undefined) { this.x = x; }
    if (y !== undefined) { this.y = y; }
    if (z !== undefined) { this.z = z; }

    this.map = otherMap;
    if (!otherMap) {
        this.map = map;
    }
    
    this.map.relocate_sprite(this, this.x, this.y, this.z);

    this.act_on_input = function() {
        // only choose a new action when the last one is done
        if (this.acting) { return; }

        // parse inputs
        var direction = "";

        var x = this.x;
        var y = this.y;
        var z = this.z;

        if (inputs.mouse.down) {
            var x_relative = inputs.mouse.x - (canvas.width / 2);
            var y_relative = inputs.mouse.y - (canvas.height / 2);
            
            if (Math.abs(x_relative/y_relative) < 2.5) {
                if (y_relative > 0) {
                    direction += "s";
                    y += 1;
                } else if (y_relative < 0) {
                    direction += "n";
                    y -= 1;
                }
            }
            if (Math.abs(y_relative/x_relative) < 2.5) {
                if (x_relative > 0) {
                    direction += "e";
                    x += 1;
                } else if (x_relative < 0) {
                    direction += "w";
                    x -= 1;
                }
            }
        } else {
            if (inputs.keys_down[38]) {
                direction += "n";
                y -= 1;
            } else if (inputs.keys_down[40]) {
                direction += "s";
                y += 1;
            }
            if (inputs.keys_down[37]) {
                direction += "w";
                x -= 1;
            } else if (inputs.keys_down[39]) {
                direction += "e";
                x += 1;
            }
        }

        var special_destination = this.map.get_ground(this.x, this.y, this.z, direction);
        if (special_destination !== undefined) {
            x = special_destination.x;
            y = special_destination.y;
            z = special_destination.z;
        }

        if (direction){
            if (map.passable(x,y,z)) {
                this.move(direction,x,y,z);
            } else {
                this.move(direction,x,y,z,true);
            }
        } else if (inputs.keys_down[32]) {
            this.animations.push({
                frames: 10,
                suffix: this.image_suffix + "_attack",
                x: 0,
                y: 0
            });

            this.animations.push({
                frames: 1,
                suffix: this.image_suffix,
                x: 0,
                y: 0
            });

            methods.push([this, "animate"]);
        }
    };

    this.animate = function(delta, animations) {
        if (Object.prototype.toString.call(animations) === "[object Array]") {
            this.animations.concat(animations);
        }
        if (this.animations.length > 0) {
            this.acting = true;
            this.time_passed += delta;

            while (this.animations.length > 0 && this.time_passed > FRAME_MS) {
                var a = this.animations[0];
                while (a.frames > 0 && this.time_passed > FRAME_MS) {
                    this.time_passed -= FRAME_MS;
                    this.image_suffix = a.suffix;
                    this.x_offset += a.x;
                    this.y_offset += a.y;
                    a.frames -= 1;
                }
                if (a.frames <= 0) {
                    this.animations.splice(0,1);
                }
            }
        } else {
            console.log("animate called, but no animations available to execute");
        }
        if (this.animations.length === 0) {
            this.acting = false;
            this.time_passed = 0;
            for (i = 0; i < methods.length; i++) {
                if (methods[i][0] === this && methods[i][1] === "animate") {
                    methods.splice(i, 1);
                }
            }
        }
    };

    this.move = function(direction, x, y, z, failed) {
        var suffix = "";
        if (this.image_suffix !== "") {
            suffix = "_" + direction[direction.length - 1];
        }

        if (failed) {
            this.animations.push({
                suffix: suffix,
                frames: 2,
                x: (x-this.x) * TILE_SIZE / 16,
                y: (y-this.y) * TILE_SIZE / 16
            });
            this.animations.push({
                suffix: suffix,
                frames: 2,
                x: (this.x-x) * TILE_SIZE / 16,
                y: (this.y-y) * TILE_SIZE / 16
            });
        } else {
            this.x_offset -= (x - this.x)*TILE_SIZE;
            this.y_offset -= (y - this.y)*TILE_SIZE;
            map.relocate_sprite(this, x, y, z);

            var frames = 6;

            this.animations.push({
                suffix: suffix,
                frames: frames,
                x: 0 - (this.x_offset / frames),
                y: 0 - (this.y_offset / frames)
            });
        }

        methods.push([this, "animate"]);
    };

    this.draw_relative = function(ctx, x_offset, y_offset) {
        ctx.drawImage(
            image_list[this.image + this.image_suffix],
            parseInt(this.x*TILE_SIZE + this.x_offset + x_offset),
            parseInt(this.y*TILE_SIZE + this.y_offset + y_offset)
        );
    };

    this.draw = function(ctx, x, y) {
        ctx.drawImage(
            image_list[this.image + this.image_suffix],
            parseInt(x),
            parseInt(y)
        );
    };
}

var draw = function() {
    var i;
    for (i = 0; i < draw_list.length; i++) {
        draw_list[i].draw(context, 0, 0, canvas.width, canvas.height);
    }
};

function generateMap() {
    var map = new Map();

    map.ground[0] = {};
    var x, y;
    for (x = 0; x < 100; x++) {
        map.ground[0][x] = {};
        for (y = 0; y < 100; y++) {
            if (x === 0 || x === 99 || y === 0 || y === 99) {
                map.ground[0][x][y] = new Tile("black", x, y, 0, false);
            } else {
                var p = Math.random();
                if (0 <= p && p < 0.8 ) {
                    map.ground[0][x][y] = new Tile("grass0", x, y, 0);
                } else if (0.8 <= p && p < 0.9) {
                    map.ground[0][x][y] = new Tile("grass1", x, y, 0);
                } else if (0.9 <= p && p <= 1) {
                    map.ground[0][x][y] = new Tile("tree0", x, y, 0, false);
                }
            }
        }
    }

    map.focus = new Sprite("knight", "_s", 50, 50, 0, false, true, 10, map);

    new Sprite("goblin", "", 58, 58, 0, false, true, 10, map);

    return map;
};

var loadImages = function() {
    var names = [
        "black",
        "goblin",
        "grass0",
        "grass1",
        "knight_n",
        "knight_s",
        "knight_e",
        "knight_w",
        "knight_n_attack",
        "knight_s_attack",
        "knight_e_attack",
        "knight_w_attack",
        "tree0"
        ];
    var images = {}

    var i;
    for (i = 0; i < names.length; i++) {
        images[names[i]] = new Image();
        images[names[i]].src = "images/"+TILE_SIZE+"/"+names[i]+".png"
    }

    return images;
};

var resize = function() {
    var w = window.innerWidth;
    var h = window.innerHeight;

    canvas.width = w;
    canvas.height = h;

    var render_distance = 5;
    var diameter = render_distance * 2 + 1;

    // 16 is the scaling step size for our images, and 256 is our largest scale
    TILE_SIZE = Math.min(Math.ceil(Math.sqrt(w * h) / diameter / 16) * 16, 256);
    //TILE_SIZE = 64;

    image_list = loadImages();

};

var main = function() {
    var delta = Date.now() - then;

    var i;
    for (i = 0; i < functions.length; i++) {
        functions[i](delta);
    }
    for (i = 0; i < methods.length; i++) {
        m = methods[i];
        m[0][m[1]](delta);
    }

    then += delta;
};

var TILE_SIZE = 64;
var FRAME_MS = 30;
var imageList;
var draw_list = [];
var canvas, context;
var inputs;
var image_list, map, keys_pressed, mouse, then, functions, methods, moving;

//setup canvas
canvas = document.createElement("canvas");
canvas.id = "canvas";
document.body.appendChild(canvas);
context = canvas.getContext("2d");

//setup input
inputs = {
    mouse: {},
    keys_down: []
};

//keyboard
addEventListener("keydown", function(e){ inputs.keys_down[e.keyCode] = true; }, false);
addEventListener("keyup", function(e){ delete inputs.keys_down[e.keyCode]; }, false);

//mouse
inputs.mouse = {
    down: false,
    x: 0,
    y: 0
};

addEventListener("mousedown", function(){ inputs.mouse.down = true; }, false);
addEventListener("mouseup", function(){ inputs.mouse.down = false; }, false);
addEventListener("mousemove", function(e){ inputs.mouse.x = e.clientX; inputs.mouse.y = e.clientY; }, false);

addEventListener("touchstart", function(e){ 
    touches = e.changedTouches;
    if (touches !== undefined) {
        t = touches[0];
        inputs.mouse.down = true;
        inputs.mouse.x = t.clientX; inputs.mouse.y = t.clientY;
        e.preventDefault();
    }
}, false);
addEventListener("touchend", function(e){
    touches = e.changedTouches;
    if (touches !== undefined) {
        t = touches[0];
        inputs.mouse.down = false;
        inputs.mouse.x = t.clientX; inputs.mouse.y = t.clientY;
        e.preventDefault();
    }
}, false);
addEventListener("touchmove", function(e){
    touches = e.changedTouches;
    if (touches !== undefined) {
        t = touches[0];
        inputs.mouse.x = t.clientX; inputs.mouse.y = t.clientY;
        e.preventDefault();
    }
}, false);

//be responsive to page size
resize();
$(window).on('resize', $.proxy(resize));

map = generateMap();
draw_list = [map];

then = Date.now();

setInterval(draw, 30);

functions = [];
methods = [[map.focus,"act_on_input"]];
moving = false;
setInterval(main,100);
