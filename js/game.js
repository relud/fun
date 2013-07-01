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
};

var Sprite = function(image, x, y, z, passable, otherMap) {
    this.image = image;
    this.passable = false;
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.offsetX = 0;
    this.offsetY = 0;

    if (passable !== undefined) { this.passable = passable; }
    if (x !== undefined) { this.x = x; }
    if (y !== undefined) { this.y = y; }
    if (z !== undefined) { this.z = z; }

    var m = otherMap
    if (!otherMap) {
        m = map;
    }
    
    m.sprites.relocate(this, this.x, this.y, this.z);
}

var passable = function(x, y, z) {
    var tile_p = map.get.ground(x,y,z,"passable");
    var sprites = map.get.sprites(x,y,z);
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

var move = function(delta) {
    if (moving) { return; }

    var direction = "";
    var displacement = [0,0,0];
    if (mouse.down) {
        var x = mouse.x - (canvas.width / 2);
        var y = mouse.y - (canvas.height / 2);
        
        if (Math.abs(x/y) < 2.5) {
            if (y > 0) {
                direction += "s";
                displacement[1] += 1;
            } else if (y < 0) {
                direction += "n";
                displacement[1] -= 1;
            }
        }
        if (Math.abs(y/x) < 2.5) {
            if (x > 0) {
                direction += "e";
                displacement[0] += 1;
            } else if (x < 0) {
                direction += "w";
                displacement[0] -= 1;
            }
        }
    } else {
        if (keysPressed[38]) {
            direction += "n";
            displacement[1] -= 1;
        } else if (keysPressed[40]) {
            direction += "s";
            displacement[1] += 1;
        }
        if (keysPressed[37]) {
            direction += "w";
            displacement[0] -= 1;
        } else if (keysPressed[39]) {
            direction += "e";
            displacement[0] += 1;
        }
    }
    if (direction === "") {
        return;
    }

    var special = map.get.ground(map.focus.x, map.focus.y, map.focus.z, direction);
    var there = {}
    if (!special) {
        there.x = map.focus.x + displacement[0]; 
        there.y = map.focus.y + displacement[1];
        there.z = map.focus.z + displacement[2];
    } else {
        there.x = special.x;
        there.y = special.y;
        there.z = special.z;
    }
    if (!passable(there.x, there.y, there.z)) { return; }

    moving = true;
    map.focus.offsetX -= (there.x - map.focus.x)*TILE_SIZE;
    map.focus.offsetY -= (there.y - map.focus.y)*TILE_SIZE;
    map.sprites.relocate(map.focus, there.x, there.y, there.z);
    var frames = 10;
    var x = map.focus.offsetX / frames;
    var y = map.focus.offsetY / frames;

    var passed = 0;
    var animate = function(delta) {
        passed += delta;
        var i;
        var speed = 15
        for (i = speed; frames > 0 && i < passed; passed -= speed) {
            map.focus.offsetX -= x;
            map.focus.offsetY -= y;
            frames--;
        }
        if (frames <= 0) {
            moving = false;
            var index = functions.indexOf(animate);
            if (index !== -1) {
                functions.splice(index,1);
            }
        }
    };
    functions.push(animate);
};

var render = function() {
    context.save();
    context.scale(map.scale, map.scale);

    var x = (canvas.width / 2 - 16) / map.scale;
    var y = (canvas.height / 2 - 16) / map.scale;
    
    var xMax, xMin, yMax, yMin;

    xMax = parseInt(map.focus.x + x / TILE_SIZE)+3;
    xMin = parseInt(map.focus.x - x / TILE_SIZE)-1;
    yMax = parseInt(map.focus.y + y / TILE_SIZE)+3;
    yMin = parseInt(map.focus.y - y / TILE_SIZE)-1;

    if (map.focus !== undefined) {
        x -= map.focus.x*TILE_SIZE + map.focus.offsetX;
        y -= map.focus.y*TILE_SIZE + map.focus.offsetY;
    }

    var l, i , j;
    for (l = 0; l < map.ground.length; l++) {
        for(i = xMin; i < xMax; i++) {
            for(j = yMin; j < yMax; j++) {
                var tile = map.get.ground(i, j, l);
                if (tile) {
                    context.drawImage(images[tile.image], parseInt(tile.x*TILE_SIZE + x), parseInt(tile.y*TILE_SIZE + y));
                }
            }
        } 
    }
    var l, i, j, k;
    for (l = 0; l < map.sprites.length; l++) {
        for(i = xMin; i < xMax; i++) {
            for(j = yMin; j < yMax; j++) {
                var sprites = map.get.sprites(i, j, l);
                if (sprites) {
                    for (k = 0; k < sprites.length; k++) {
                        context.drawImage(images[sprites[k].image], 
                            parseInt(sprites[k].x * TILE_SIZE + sprites[k].offsetX + x),
                            parseInt(sprites[k].y * TILE_SIZE + sprites[k].offsetY + y)
                        );
                    }
                }
            }
        } 
    }
    context.restore();
};

function generateMap() {
    var map = {};
    map.get = {}
    map.ground = [];
    map.sprites = [];

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

    map.get.ground = function(x, y, z, property) {
        if (
                !map.ground ||
                !map.ground[z] ||
                !map.ground[z][x] ||
                !map.ground[z][x][y]
           ) {
            return undefined;
        } else if (property !== undefined) {
            return map.ground[z][x][y][property];
        } else {
            return map.ground[z][x][y];
        }
    };

    map.get.sprites = function(x, y, z, index, property) {
        if (
                !map.sprites ||
                !map.sprites[z] ||
                !map.sprites[z][x] ||
                !map.sprites[z][x][y]
           ) {
            return undefined;
        } else if (index !== undefined) {
            if (!map.sprites[z][x][y][index]) {
                return undefined;
            } else {
                if (property !== undefined) {
                    return map.sprites[z][x][y][index][property];
                } else {
                    return map.sprites[z][x][y][index];
                }
            }
        } else {
            return map.sprites[z][x][y];
        }
    };

    map.sprites.relocate = function(sprite, x, y, z) {
        var oldSprites = map.get.sprites(sprite.x, sprite.y, sprite.z);
        if (oldSprites) {
            var index = oldSprites.indexOf(sprite);
            if (index !== -1) {
                oldSprites.splice(index, 1);
            } 
        }
        if (!map.sprites) {
            map.sprites = []
        }
        if (!map.sprites[z]) {
            map.sprites[z] = {}
        }
        if (!map.sprites[z][x]) {
            map.sprites[z][x] = {}
        }
        if (!map.sprites[z][x][y]) {
            map.sprites[z][x][y] = []
        }

        map.get.sprites(x, y, z).push(sprite);
        sprite.x = x;
        sprite.y = y;
        sprite.z = z;
    };

    var hero = new Sprite("hero", 50, 50, 0, false, map);
    map.focus = hero;

    var goblin = new Sprite("goblin", 58, 58, 0, false, map);

    return map;
};

var loadImages = function() {
    var names = [
        "black",
        "goblin",
        "grass0",
        "grass1",
        "hero",
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

    var render_distance = 12;
    var diameter = render_distance * 2 + 1;

    // 16 is the scaling step size for our images, and 256 is our largest scale
    TILE_SIZE = Math.min(Math.ceil(Math.sqrt(w * h) / diameter / 16) * 16, 256);
    //TILE_SIZE = 64;

    images = loadImages();
};

var handleMouseMove = function(event) {
    
};

var main = function() {
    var delta = Date.now() - then;

    var i;
    for (i = 0; i < functions.length; i++) {
        functions[i](delta);
    }

    then += delta;
};

var TILE_SIZE, images, map, canvas, context, keys_pressed, mouse, then, functions, moving;

TILE_SIZE = 64;

//setup canvas
canvas = document.createElement("canvas");
canvas.id = "canvas";
context = canvas.getContext("2d");
document.body.appendChild(canvas);

//setup input

//keyboard
keysPressed = {};
addEventListener("keydown", function(e){ keysPressed[e.keyCode] = true; }, false);
addEventListener("keyup", function(e){ delete keysPressed[e.keyCode]; }, false);

//mouse
mouse = {
    down: false,
    x: 0,
    y: 0
};
addEventListener("mousedown", function(){ mouse.down = true; }, false);
addEventListener("mouseup", function(){ mouse.down = false; }, false);
addEventListener("mousemove", function(e){ mouse.x = e.clientX; mouse.y = e.clientY; }, false);
addEventListener("touchstart", function(e){ 
    touches = e.changedTouches;
    if (touches !== undefined) {
        t = touches[0];
        mouse.down = true; 
        mouse.x = t.clientX; mouse.y = t.clientY;
        e.preventDefault();
    }
}, false);
addEventListener("touchend", function(e){
    touches = e.changedTouches;
    if (touches !== undefined) {
        t = touches[0];
        mouse.down = false; 
        mouse.x = t.clientX; mouse.y = t.clientY;
        e.preventDefault();
    }
}, false);
addEventListener("touchmove", function(e){
    touches = e.changedTouches;
    if (touches !== undefined) {
        t = touches[0];
        mouse.x = t.clientX; mouse.y = t.clientY;
        e.preventDefault();
    }
}, false);

//be responsive to page size
resize();
$(window).on('resize', $.proxy(resize));

map = generateMap();
map.scale = 1;

then = Date.now();

setInterval(render, 30);

functions = [move];
moving = false;
setInterval(main,1);
