class Particle
{
    constructor(x0, radius)
    {
        this.langevin = (v) => p5.Vector.random2D().mult(0.75).add(p5.Vector.mult(v, -0.1));
        this.vel = createVector();
        this.pos = x0;
        this.trails = [x0];
        this.radius = radius;
        this.life = int(random(256, 512));
        this.isActive = true;
    }

    update()
    {
        if (!this.isActive) { return; }
        this.life--;
        
        const acc = this.langevin(this.vel);
        this.vel.add(acc);
        const x1 = this.pos;
        const x2 = p5.Vector.add(x1, this.vel);
        this.pos = x2;
        this.trails.push(x2);
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
        this.particles = [];
        this.limitNum = limitNum;
    }

    initialize()
    {
        for (let i = 0; i < this.limitNum; i++)
        {
            this.addParticle();
        }
    }

    addParticle()
    {
        const radius = 4;
        this.particles.push(new Particle(createVector(width/2, height/2), radius));
    }

    update()
    {
        this.particles = this.particles.filter(p => p.life > 0);
        while (this.particles.length < this.limitNum)
        {
            this.addParticle();
        }
        this.particles.forEach(p => p.update());
    }

    display()
    {
        this.particles.forEach(p => p.display());

        const points = [];
        this.particles.forEach(p => points.push(p.pos));
        const vertices = convexHull(points);
        // const points = [createVector(200, 280), createVector(50, 320), createVector(100, 100), createVector(64, 128), createVector(220, 180), createVector(120, 180)];
        // for (const p of points)
        // {
        //     ellipse(p.x, p.y, 5);
        // }
        //const vertices = convexHull(points);
        noFill();
        stroke(255);
        beginShape();
        vertices.forEach(v => vertex(v.x, v.y));
        endShape(CLOSE);
    }
}

let pm;

function setup()
{
    createCanvas(w=windowWidth, h=w*9/16);
    pm = new ParticleManager(32);
    pm.initialize();
}
   
function draw()
{
    background(0);
    pm.update();
    push();
    noStroke();
    fill(255);
    pm.display();
    pop();
}

function convexHull(points)
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
    pointsCopy = pointsCopy.filter(p => !p.equals(init));

    let curr = init;
    let dir = createVector(1, 0);
    for (;;)
    {
        if (pointsCopy.length == 0) { break; }

        const cacheCurr = curr;
        // get next vertex
        curr = pointsCopy.reduce((p, q) =>
        {
            const rad1 = dir.angleBetween(p5.Vector.sub(p, cacheCurr));
            const rad2 = dir.angleBetween(p5.Vector.sub(q, cacheCurr));
            return rad1 - rad2 < 0 ? p : q;
        });
        // make a round: the first vertex is to be the end vertex
        if (curr.equals(init)) { break; }
        // remove the chosen points from array
        pointsCopy = pointsCopy.filter(p => !p.equals(curr));
        // make the start point selectable
        if (cacheCurr.equals(init)) { pointsCopy.push(init); }
        dir = p5.Vector.sub(curr, cacheCurr);
        ret.push(curr);
    }
    
    return ret;
}
