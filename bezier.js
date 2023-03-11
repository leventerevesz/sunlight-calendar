class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    
    svg() {
        return this.x.toFixed(4) + "," + this.y.toFixed(4);
    }
}

class Line {
    constructor(p1, p2) {
        this.p1 = p1;
        this.p2 = p2;
    }
    
    length() {
        return Math.sqrt((this.p2.x - this.p1.x )**2 + (this.p2.y - this.p1.y)**2);
    }
    
    angle() {
        return Math.atan2(this.p2.y - this.p1.y, this.p2.x - this.p1.x);
    }
}

class Segment {
    constructor(pprev, p1, p2, pnext, smooth_factor) {
        let line1 = new Line(pprev, p2);
        let line2 = new Line(p1, pnext);
        let sf = smooth_factor;
        this.p = p2;
        this.cp1 = new Point(p1.x + line1.length() * sf * Math.cos(line1.angle()),
                             p1.y + line1.length() * sf * Math.sin(line1.angle()));
        this.cp2 = new Point(p2.x + line2.length() * sf * Math.cos(line2.angle() + Math.PI),
                             p2.y + line2.length() * sf * Math.sin(line2.angle() + Math.PI));
    }
    
    svg() {
        return this.cp1.svg() + " " + this.cp2.svg() + " " + this.p.svg();
    }
}

class Bezier {
    constructor(points, smooth_factor) {
        points.push(points[0]);
        
        this.starting_point = points[0];
        this.segments = [];

        for (let i = 0; i < points.length - 1; i++) {
            // first and last segments are edge cases
            let pprev = (i != 0) ? points[i-1] : points[points.length - 2];
            let p1 = points[i];
            let p2 = points[i+1];
            let pnext = (i != points.length - 2) ? points[i+2] : points[1];
            this.segments.push(new Segment(pprev, p1, p2, pnext, smooth_factor));
        }
    }
    
    svg() {
        let s = "M ";
        s += this.starting_point.svg();
        s += " C ";

        for (let i in this.segments) {
            s += this.segments[i].svg() + " ";
        }

        s += "Z";
        
        return s;
    }
}


