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
        ellipse(cx.x, cx.y, 2*this.radius, 2*this.radius);
    }
}

class ParticleManager
{
    constructor(limitNum)
    {
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
            this.particles.push(new Particle(createVector(width/2, height/2), radius, id));
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
    }

    display()
    {
        const vertices = this.convexHull(pm.getPositions());
        beginShape();
        vertices.forEach(v => vertex(v.x, v.y));
        endShape(CLOSE);
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

let pm;
let closure;

function setup()
{
    createCanvas(w=windowWidth, h=w*9/16);
    pm = new ParticleManager(16);
    closure = new Closure(pm);
}
   
function draw()
{
    background(0);
    pm.update();

    // push();
    // noStroke();
    // fill(255);
    // pm.display();
    // pop();

    push();
    noFill();
    stroke(255);
    closure.display();
    pop();
}
