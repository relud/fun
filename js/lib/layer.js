var Layer = function(image, x, y) {
    this.image = "",
    this.x = 0;
    this.y = 0;

    if (image !== undefined) { this.image = image }
    if (x !== undefined) { this.x = x }
    if (y !== undefined) { this.y = y }

    this.draw_offset = function(camera, focus, x_min_tile, y_min_tile, x_max_tile, y_max_tile) {
        this.draw(
                camera,
                (this.x + focus.x) * TILE_SIZE + focus.x_offset * PIXEL_SIZE,
                (this.x + focus.x) * TILE_SIZE + focus.x_offset * PIXEL_SIZE,
                x_min,
                y_min,
                x_max,
                y_max
            );
    };

    this.draw = function(
            camera,
            x,
            y,
            x_offset,
            y_offset,
            x_min_tile,
            y_min_tile,
            x_max_tile,
            y_max_tile
        ) {
        camera.draw_tile(
                this.image,
                x,
                y
            );
    };
};
