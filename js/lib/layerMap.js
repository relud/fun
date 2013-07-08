var Map = function() {
    this.focus = {
        x: 0,
        y: 0,
        x_offset: 0,
        y_offset: 0
    }
    this.layers = [];
    this.passable = [];
    this.destination = [];
    this.sprites = [];

    this.get_passable(x,y,z) = function() {
        if (z < 0) {
            throw "Maps must have Z > 0 at all times"
        }
        if (
                !this.passable ||
                !this.passable[z] ||
                !this.passable[z][x] ||
                !this.passable[z][x][y]
           ) {
            return false;
        } else {
            var sprites = this.get_sprites(x,y,z);
            if (sprites) {
                var i;
                for (i = 0; i < sprites.length; i++) {
                    if (!sprites[i].passable) {
                        return false;
                    }
                }
            }
        }
        return true;
    };

    this.set_passable(x,y,z,passable) = function() {
        if (z < 0) {
            throw "Maps must have Z > 0 at all times"
        }
        if (!this.passable) {
            this.passable = [];
        }
        if (!this.passable[z]) {
            this.passable[z] = {};
        }
        if (!this.passable[z][x]) {
            this.passable[z][x] = {};
        }
        this.passable[z][x][y] = passable;
    };

    this.get_destination(x, y, z, direction) = function() {
        if (z < 0) {
            throw "Maps must have Z > 0 at all times"
        }

        // determine default destination
        var d = {
            x: 0,
            y: 0,
            z: 0
        }
        var xd = 0, yd = 0, zd = 0;
        if (direction[0] === 'n') {
            d.x++;
        } else if (direction[0] === 's') {
            d.x--;
        }
        if (
                direction[0] === 'e' ||
                direction[1] === 'e'
           ) {
            d.y++;
        } else if (
                direction[0] === 'w' ||
                direction[1] === 'w'
           ) {
            d.y--;
        }
        
        // check for non-standard displacement
        if (
                !this.destination ||
                !this.destination[z] ||
                !this.destination[z][x] ||
                !this.destination[z][x][y] ||
                !this.destination[z][x][y][direction]
           ) {
            return d;
        } else {
            return this.destination[z][x][y][direction];
        }
    };

    this.set_destination(x, y, z, direction, xd, yd, zd) {
        if (z < 0) {
            throw "Maps must have Z > 0 at all times"
        }
        if (!this.destination) {
            this.destination = [];
        }
        if (!this.destination[z]) {
            this.destination[z] = {};
        }
        if (!this.destination[z][x]) {
            this.destination[z][x] = {};
        }
        if (!this.destination[z][x][y]) {
            this.destination[z][x][y] = {};
        }
        var d = {
            x: xd,
            y: yd,
            z: zd
        }
        this.destination[z][x][y][direction] = d;
    };

    this.get_sprites = function(x, y, z) {
        if (z < 0) {
            throw "Maps must have Z > 0 at all times"
        }
        if (
                !this.sprites ||
                !this.sprites[z] ||
                !this.sprites[z][x] ||
                !this.sprites[z][x][y]
           ) {
            return undefined;
        } else {
            return this.sprites[z][x][y];
        }
    };
    
    this.add_sprite = function(sprite) {
        if (sprite.z < 0) {
            throw "Maps must have Z > 0 at all times"
        }
        if (!this.sprites) {
            this.sprites = [];
        }
        if (!this.sprites[sprite.z]) {
            this.sprites[sprite.z] = {};
        }
        if (!this.sprites[sprite.z][sprite.x]) {
            this.sprites[sprite.z][sprite.x] = {};
        }
        if (!this.sprites[sprite.z][sprite.x][sprite.y]) {
            this.sprites[sprite.z][sprite.x][sprite.y] = [];
        }
        this.sprites[sprite.z][sprite.x][sprite.y].push(sprite);
    };

    this.remove_sprite = function(sprite) {
        var sprites = this.get_sprites(sprite.x, sprite.y, sprite.z);
        if (sprites) {
            var i = sprites.indexOf(sprite);
            if (i !== -1) {
                sprites.splice(index, 1);
            }
        }
    };

    this.move_sprite = function(sprite, x, y, z) {
        this.remove_sprite(sprite);
        sprite.x = x;
        sprite.y = y;
        sprite.z = z;
        this.add_sprite(sprite);
    };

    this.draw = function(camera, x_min_tile, y_min_tile, x_max_tile, y_max_tile) {
        if (this.focus !== undefined) {
            x_min_tile += this.focus.x;
            y_min_tile += this.focus.y;
            x_max_tile += this.focus.x;
            y_max_tile += this.focus.y;
        }

        var x, y, z, i;
        for ( z = 0; z < this.layers.length || z < this.sprites.length; z++) {
            if (this.layers[z]) {
                this.layers[z].draw_offset(
                        camera,
                        this.focus,
                        x_min_tile,
                        y_min_tile,
                        x_max_tile,
                        y_max_tile
                    );
            }
            for (x = x_min_tile; x < x_max_tile; x++) {
                for (y = y_min_tile; y < y_max_tile; y++) {
                    var sprites = this.get_sprites(x,y,z);
                    if (sprites) {
                        for (i = 0; i < sprites.length; i++) {
                            sprites[i].draw_offset(camera, focus);
                        }
                    }
                }
            }
        }
    };
}
