const palette = ["#ef2ef2", "#0b04d9", "#0cb1f2", "#05f240", "#d90404"];

class Particle
{
    constructor(id, x0, radius = 4)
    {
        this.langevin = (v) => p5.Vector.random2D().mult(0.4).add(p5.Vector.mult(v, -0.05));
        this.vel = createVector();
        this.pos = x0;
        this.trails = [x0];
        this.life = floor(random(32, 128));
        this.isActive = true;
        this.id = id;
        this.radius = radius;
    }

    update()
    {
        if (this.life <= 0)
        {
            if (this.trails.length)
            {
                this.pos = this.trails.pop();
            }
            else
            {
                this.isActive = false;
            }
        }
        else
        {
            const acc = this.langevin(this.vel);
            this.vel.add(acc);
            const x1 = this.pos;
            const x2 = p5.Vector.add(x1, this.vel);
            this.pos = x2;
            this.trails.push(x2);
            this.life--;
        }
    }

    display(height)
    {
        const cx = this.pos;
        const c = color(palette[this.id % palette.length]);
        c.setAlpha(100);
        //const c = color("#e0e0e0");
        push();
        noStroke();
        fill(c);
        ellipse(cx.x, cx.y, 2*this.radius, 2*this.radius);
        stroke(c);
        line(cx.x, cx.y, 0, cx.x, cx.y, height);
        pop();
    }
}

class ParticleManager
{
    constructor(center, limitNum)
    {
        this.center = center;
        this.limitNum = limitNum;
        this.particles = [];
        this.availableID = [...Array(limitNum)].map((_, i) => i); // [0, 1, ..., limitNum-1]
        this.addParticles();
    }

    addParticles()
    {
        while (this.availableID.length)
        {
            const id = this.availableID.shift();
            this.particles.push(new Particle(id, this.center));
        }
    }

    removeParticles()
    {
        this.particles = this.particles.filter(p =>
        {
            if (!p.isActive)
            {
                //const id = p.id < this.limitNum ? p.id + this.limitNum : p.id - this.limitNum;
                const id = p.id;
                this.availableID.push(id);
            }
            return p.isActive;
        });
    }

    update(isReact = true)
    {
        this.removeParticles();
        if (isReact) { /*this.addParticles();*/ }
        else { this.particles.forEach(p => p.life = 0); }
        this.particles.forEach(p => p.update());
    }

    display(height)
    {
        this.particles.forEach(p => p.display(height));
    }

    getPositions()
    {
        const points = [];
        this.particles.forEach(p => points.push(p.pos));
        return points;
    }

    isLiving()
    {
        return this.particles.length;
    }
}

class Closure
{
    constructor(pm)
    {
        this.pm = pm;
        this.col = color(palette[floor(random(palette.length))]);
        this.col.setAlpha(160);
    }

    display(height)
    {
        const positions = this.pm.getPositions();
        const vertices = this.convexHull(positions);
        //this.c = color(palette[vertices.length % palette.length]);
        push();
        noStroke();
        fill(this.col);
        beginShape();
        vertices.forEach(v => vertex(v.x, v.y, height));
        endShape(CLOSE);
        pop();
    }

    convexHull(points)
    {
        let ret = [];
        let pointsCopy = [];
        points.forEach(p =>
        {
            // except the distance to already added points is
            // less than the threshold (=4)
            if (pointsCopy.find(pc => p5.Vector.sub(pc, p).magSq() < 4))
            {
                return;
            }
            pointsCopy.push(p)
        });

        if (!pointsCopy.length) { return ret; }
    
        // get the minimum y-coodinate point
        const init = pointsCopy.reduce((p, q) =>
        {
            if (p.y < q.y) { return p; }
            if (p.y == q.y && p.x < q.x) { return p; }
            return q;
        });
        if (!init) { return ret; }
        ret.push(init);
        // make the start point not selectable
        pointsCopy = pointsCopy.filter(p => !p.equals(init));
    
        let curr = init;
        let dir = createVector(1, 0);
        for (;;)
        {
            if (!pointsCopy.length) { break; }
    
            // get next vertex
            let next = pointsCopy.reduce((p, q) =>
            {
                const rad1 = dir.angleBetween(p5.Vector.sub(p, curr));
                const rad2 = dir.angleBetween(p5.Vector.sub(q, curr));
                return rad1 - rad2 < 0 ? p : q;
            });
            // make a round: the first vertex is to be the end vertex
            if (next.equals(init)) { break; }
            ret.push(next);
            // remove the chosen points from array
            pointsCopy = pointsCopy.filter(p => !p.equals(next));
            // make the start point selectable
            if (curr.equals(init)) { pointsCopy.push(init); }
            // update variables
            dir = p5.Vector.sub(next, curr);
            curr = next;
        }
        
        return ret;
    }
}

class Polygon
{
    constructor(center)
    {
        this.pm = new ParticleManager(center, floor(random(8, 16)));
        this.closure = new Closure(this.pm);
        this.height = lerp(64, 256, random(random()));
    }

    update(isReact = true)
    {
        this.pm.update(isReact);
    }

    display()
    {
        this.closure.display(this.height);
        this.pm.display(this.height);
    }
}

class PolygonGenerator
{
    constructor(radius, polygonLimit = 16, cubeLimit = 256)
    {
        this.reactRadius = radius;
        this.polygonLimit = polygonLimit;
        this.cubeLimit = cubeLimit;
        this.polygons = [];
        this.cubes = [];
        this.cam = createCamera();
        this.center = createVector(0, -100, 100);
        this.updateCamera();
    }

    updateCamera()
    {
        const center2eye = createVector(0, 250, -50);
        const eye = p5.Vector.add(this.center, center2eye);
        this.cam.camera(eye.x, eye.y, eye.z,
            this.center.x, this.center.y, this.center.z,
            0, -1, 0);
    }

    moveCamera()
    {
        const vel = createVector(0, 1, 0);
        this.center.add(vel);
        this.updateCamera();
    }

    addPolygon()
    {
        if (this.polygons.length < this.polygonLimit)
        {
            const c = p5.Vector.random3D().mult(this.reactRadius).add(this.center);
            c.z = 0;
            this.polygons.push(new Polygon(c));
        }
    }

    removePolygons()
    {
        this.polygons = this.polygons.filter(p => p.pm.isLiving());
    }

    updatePolygons()
    {
        this.removePolygons();
        this.addPolygon();
        this.polygons.forEach(p => p.update(this.isInRange(p.pm.center)));
    }

    displayPolygons()
    {
        this.polygons.forEach(p => p.display());
    }

    addCubes()
    {
        while (this.cubes.length < this.cubeLimit)
        {
            const c = p5.Vector.random3D().mult(this.reactRadius).add(this.center);
            c.z = 0;
            const rot = createVector(random(TAU), random(TAU), random(TAU));
            const r = lerp(8, 32, sq(random()));
            this.cubes.push(new Cube(c, rot, r));
        }
    }

    removeCubes()
    {
        this.cubes = this.cubes.filter(c => c.isLiving());
    }

    updateCubes()
    {
        this.removeCubes();
        this.addCubes();
        this.cubes.forEach(c => c.update(this.isInRange(c.center)));
    }

    displayCubes()
    {
        this.cubes.forEach(c => c.display());
    }

    isInRange(c)
    {
        const d = p5.Vector.sub(c, createVector(this.center.x, this.center.y)).magSq();
        const r = sq(this.reactRadius);
        return d < r;
    }
}

class Cube
{
    constructor(center, rot, radius)
    {
        this.center = center;
        this.rot = rot;
        this.radius = radius;
        this.maxRadius = radius;
        this.time = 0;
        this.fcol = color(random(255), 160);
        this.scol = color(palette[floor(random(palette.length))]);
    }

    display()
    {
        push();
        translate(this.center.x, this.center.y, this.center.z);
        rotateX(this.rot.x);
        rotateY(this.rot.y);
        rotateZ(this.rot.z);
        fill(this.fcol);
        stroke(this.scol);
        strokeWeight(0.5);
        box(this.radius);
        pop();
    }

    update(isSwell)
    {
        if (isSwell)
        {
            this.time = min(this.time + 0.02, 1);
            this.radius = this.easeOutElastic(this.time) * this.maxRadius;
        }
        else
        {
            this.time = max(this.time - 0.02, 0);
            this.radius = this.easeOutElastic(this.time) * this.maxRadius;
        }
    }

    isLiving()
    {
        return this.radius;
    }

    easeOutElastic(x)
    {
        const c4 = (2 * Math.PI) / 3;
        
        return x === 0
            ? 0
            : x === 1
            ? 1
            : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
    }
}

let pg;

function setup()
{
    createCanvas(w=windowWidth, h=w*9/16, WEBGL);
    pg = new PolygonGenerator(h);
}

function draw()
{
    background("#c0c0c0");

    pg.moveCamera();
    pg.updatePolygons();
    pg.displayPolygons();
    pg.updateCubes();
    pg.displayCubes();
}
