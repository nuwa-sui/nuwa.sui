/// Module: demo
module demo::demo;

public fun tuple(point: Point): (u8, u8) {
    (point.x, point.y)
}

public struct Point has store, copy, drop {
    x: u8,
    y: u8,
}
