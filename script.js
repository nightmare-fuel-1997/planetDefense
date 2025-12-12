class Planet {
    constructor(game){
        this.game = game;
        this.x = this.game.width / 2;
        this.y = this.game.height / 2;
        this.radius = 80;
        this.image = document.getElementById('planet');
    }

    draw(context){
        context.drawImage(this.image, this.x - 100, this.y - 100);
        // debug circle
        // context.beginPath();
        // context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        // context.stroke()
    }
}

class Player {
    constructor(game){
        this.game = game;
        this.x = this.game.width / 2;
        this.y = this.game.height / 2;
        this.radius = 40;
        this.image = document.getElementById('player');
        this.aim;
    }
    draw(context){
        context.drawImage(this.image, this.x - this.radius, this.y - this.radius);
        // debug circle
        // context.beginPath();
        // context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        // context.stroke();
    }
    // player moves so we need an update method
    update(){
        this.aim = this.game.calcAim(this.game.mouse, this.game.planet);
        this.x= this.game.planet.x + (this.game.planet.radius + this.radius) * this.aim[0];
        this.y= this.game.planet.y + (this.game.planet.radius + this.radius) * this.aim[1];
    }
}

class Game {
    constructor(canvas){
        this.canvas = canvas;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.planet = new Planet(this);
        this.player = new Player(this);
        this.mouse = {
            x: 0,
            y: 0
        }
        window.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });
    }
    render(context){
        this.planet.draw(context);
        this.player.draw(context);
        this.player.update();
        // draw line from planet to mouse
        // context.beginPath();
        // context.moveTo(this.planet.x, this.planet.y);
        // context.lineTo(this.mouse.x, this.mouse.y);
        // context.stroke();
    }
    // gives us the distance and direction from point a to point b
    calcAim(a, b){
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distance = Math.hypot(dx, dy);
        const aimX = (dx / distance);
        const aimY = (dy / distance);
        return [ aimX, aimY, dx, dy ]
    }
}


window.addEventListener('load', function() {
    const canvas = this.document.getElementById('canvas1')
    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 800;
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;

    const game = new Game(canvas);

    function animate(){
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        game.render(ctx);
        requestAnimationFrame(animate);
    }
    this.requestAnimationFrame(animate);
})
