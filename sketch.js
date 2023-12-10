const palette = ["#ef2ef2", "#0b04d9", "#0cb1f2", "#05f240", "#d90404"];

class Particle
{
    constructor(x0, radius, id)
    {
        this.langevin = (v) => p5.Vector.random2D().mult(0.8).add(p5.Vector.mult(v, -0.1));
        this.vel = createVector();
        this.pos = x0;
        this.trails = [x0];
        this.life = int(random(128, 256));
        this.isActive = true;
        this.radius = radius;
        this.id = id;
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

    display()
    {
        const cx = this.pos;
        const c = color(palette[this.id % palette.length]);
        push();
        noStroke();
        fill(c);
        ellipse(cx.x, cx.y, 2*this.radius, 2*this.radius);
        stroke(c);
        line(cx.x, cx.y, 0, cx.x, cx.y, 200);
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
    }

    addParticles()
    {
        while (this.availableID.length)
        {
            const radius = 4;
            const id = this.availableID.shift();
            this.particles.push(new Particle(this.center, radius, id));
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

    update()
    {
        this.removeParticles();
        this.addParticles();
        this.particles.forEach(p => p.update());
    }

    display()
    {
        this.particles.forEach(p => p.display());
    }

    getPositions()
    {
        const points = [];
        this.particles.forEach(p => points.push(p.pos));
        return points;
    }
}

class Closure
{
    constructor(pm)
    {
        this.pm = pm;
        this.c = color(palette[floor(random(palette.length))]);
    }

    display()
    {
        const positions = this.pm.getPositions();
        // while (positions.length >= 3)
        // {
        //     const vertices = this.convexHull(positions);
        //     positions = positions.filter(v => !vertices.includes(v));
        //     push();
        //     stroke("#ffffff");
        //     fill("#000000");
        //     beginShape();
        //     vertices.forEach(v => vertex(v.x, v.y));
        //     endShape(CLOSE);
        //     pop();
        // }
        const vertices = this.convexHull(positions);
        //const c = color(palette[vertices.length % palette.length]);
        push();
        //stroke("#ffffff");
        noStroke();
        fill(this.c);
        // let n = vertices.length;
        // for (let i = 0; i < n; i++)
        // {
        //     beginShape();
        //     let v1 = vertices[i];
        //     let v2 = vertices[(i+1)%n];
        //     vertex(v1.x, v1.y, 0);
        //     vertex(v2.x, v2.y, 0);
        //     vertex(v2.x, v2.y, 50);
        //     vertex(v1.x, v1.y, 50);
        //     endShape(CLOSE);
        // }
        beginShape();
        vertices.forEach(v => vertex(v.x, v.y, 200));
        endShape(CLOSE);
        pop();
        // let length = 0;
        // let n = vertices.length;
        // for (let i = 0; i < n; i++)
        // {
        //     let v1 = vertices[i];
        //     let v2 = vertices[(i+1)%n];
        //     length += p5.Vector.dist(v1, v2);
        // }
        // push();
        // colorMode(HSB, 1, 1, 1);
        // stroke(noise(length*0.001, frameCount*0.003), 1, 1);
        // noFill();
        // stroke("#ffffff");
        // fill("#000000");
        // beginShape();
        // vertices.forEach(v => vertex(v.x, v.y));
        // endShape(CLOSE);
        // pop();

        // let n = vertices.length;
        // for (let i = 0; i < n; i++)
        // {
        //     let v1 = vertices[(i+n-1)%n];
        //     let v2 = vertices[i];
        //     let v3 = vertices[(i+1)%n];
        //     let e1 = p5.Vector.sub(v1, v2);
        //     let e2 = p5.Vector.sub(v3, v2);
        //     let rad = e1.angleBetween(e2);
        //     let a = sq(cos(rad/2)) * 64;
        //     ellipse(v2.x, v2.y, a, a);
        // }
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
        this.pm = new ParticleManager(center, 16);
        this.closure = new Closure(this.pm);
    }

    update()
    {
        this.pm.update();
    }

    display()
    {
        this.closure.display();
        this.pm.display();
    }

    
}

class MyCamera
{
    constructor()
    {
        this.cam = createCamera();
        this.eye = createVector(0, 250, 50);
        this.updateCamera();
    }

    updateCamera()
    {
        const eyeToCenter = createVector(0, -250, 50);
        const center = p5.Vector.add(this.eye, eyeToCenter);
        this.cam.camera(this.eye.x, this.eye.y, this.eye.z,
            center.x, center.y, center.z, 0, -1, 0);
    }

    move(v)
    {
        this.eye.add(v);
        this.updateCamera();
    }
}

let cam;
const polygons = [];

function setup()
{
    createCanvas(w=windowWidth, h=w*9/16, WEBGL);
    cam = new MyCamera();
    polygons.push(new Polygon(createVector()));
}

function draw()
{
    background("#ececec");
    polygons.forEach(p => p.update());
    polygons.forEach(p => p.display());
}
