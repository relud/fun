var newTile = function(imagePath, x, y, z, passable) {
    var tile = {};
    tile.image = new Image();
    tile.image.src = imagePath;
    tile.passable = true;
    tile.x = 0;
    tile.y = 0;
    tile.z = 0;

    if (passable !== undefined) { tile.passable = passable; }
    if (x !== undefined) { tile.x = x; }
    if (y !== undefined) { tile.y = y; }
    if (z !== undefined) { tile.z = z; }

    return tile;
};

var newSprite = function(imagePath, x, y, z, passable, otherMap) {
    var sprite = {};
    sprite.image = new Image();
    sprite.image.src = imagePath;
    sprite.passable = false;
    sprite.x = 0;
    sprite.y = 0;
    sprite.z = 0;
    sprite.offsetX = 0;
    sprite.offsetY = 0;

    if (passable !== undefined) { sprite.passable = passable; }
    if (x !== undefined) { sprite.x = x; }
    if (y !== undefined) { sprite.y = y; }
    if (z !== undefined) { sprite.z = z; }

    var m = otherMap
    if (!otherMap) {
        m = map;
    }
    
    m.sprites.relocate(sprite, sprite.x, sprite.y, sprite.z);

    return sprite;
}

var passable = function(x, y, z) {
    var tile_p = map.get.ground(x,y,z,"passable");
    var sprites = map.get.sprites(x,y,z);
    if (!tile_p) {
        return false;
    }
    if (sprites) {
        var p = true;
        sprites.forEach(function(sprite) {
            if (sprite) {
                if (!sprite.passable) {
                    p = false;
                }
            }
        });
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
    map.focus.offsetX -= (there.x - map.focus.x)*32;
    map.focus.offsetY -= (there.y - map.focus.y)*32;
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
    var x = canvas.width / 2;
    var y = canvas.height / 2;

    if (map.focus !== undefined) {
        x -= map.focus.x*32 + map.focus.offsetX;
        y -= map.focus.y*32 + map.focus.offsetY;
    }

    var xMax, xMin, yMax, yMin;

    xMax = Math.round(map.focus.x + 1 + (canvas.width / 2 / 32));
    xMin = Math.round(map.focus.x - 1 - (canvas.width / 2 / 32));
    yMax = Math.round(map.focus.y + 1 + (canvas.height / 2 / 32));
    yMin = Math.round(map.focus.y - 1 - (canvas.height / 2 / 32));

    map.ground.forEach(function(layer, l) {
        var i, j;
        for(i = xMin; i < xMax; i++) {
            for(j = yMin; j < yMax; j++) {
                var tile = map.get.ground(i, j, l);
                if (tile) {
                    context.drawImage(tile.image, tile.x*32 + x, tile.y*32 + y);
                }
            }
        } 
    });
    map.sprites.forEach(function(layer, l) {
        var i, j;
        for(i = xMin; i < xMax; i++) {
            for(j = yMin; j < yMax; j++) {
                var sprites = map.get.sprites(i, j, l);
                if (sprites) {
                    sprites.forEach(function(sprite) {
                        context.drawImage(sprite.image, 
                            sprite.x * 32 + sprite.offsetX + x,
                            sprite.y * 32 + sprite.offsetY + y
                        );
                    });
                }
            }
        } 
    });
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
                map.ground[0][x][y] = newTile("images/black.png", x, y, 0, false);
            } else {
                var p = Math.random();
                if (0 <= p && p < 0.8 ) {
                    map.ground[0][x][y] = newTile("images/grass0.png", x, y, 0);
                } else if (0.8 <= p && p < 0.9) {
                    map.ground[0][x][y] = newTile("images/grass1.png", x, y, 0);
                } else if (0.9 <= p && p <= 1) {
                    map.ground[0][x][y] = newTile("images/tree0.png", x, y, 0, false);
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

    var hero = newSprite("images/hero.png", 50, 50, 0, false, map);
    map.focus = hero;

    var goblin = newSprite("images/goblin.png", 58, 58, 0, false, map);

    return map;
}

var main = function() {
    var delta = Date.now() - then;

    functions.forEach(function(f) {
        f(delta);
    });

    then += delta;
};

var canvas = document.createElement("canvas");
canvas.id = "canvas";
var context = canvas.getContext("2d");
document.body.appendChild(canvas);

canvas.width = window.innerWidth - 32;
canvas.height = window.innerHeight - 32;

$(window).on('resize', $.proxy(function(){
    canvas.width = window.innerWidth - 32;
    canvas.height = window.innerHeight - 32;
}));

var map = generateMap();

var keysPressed = {};

addEventListener("keydown", function(e){ keysPressed[e.keyCode] = true; }, false);
addEventListener("keyup", function(e){ delete keysPressed[e.keyCode]; }, false);

var then = Date.now();

setInterval(render, 30);

var functions = [move];
var moving = false;
setInterval(main,1);
