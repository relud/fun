var TileMap = function() {
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

    this.remove_sprite = function(sprite) {
        var sprites = this.get_sprites(sprite.x, sprite.y, sprite.z);
        if (sprites) {
            var index = sprites.indexOf(sprite);
            if (index !== -1) {
                sprites.splice(index, 1);
            }
        }
    };

    this.relocate_sprite = function(sprite, x, y, z) {
        this.remove_sprite(sprite);

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

        // TODO: fix this so that sprites are drawn on the correct ground layer
        // draw ground
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

        // draw sprites
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
