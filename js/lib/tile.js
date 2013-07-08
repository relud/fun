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
