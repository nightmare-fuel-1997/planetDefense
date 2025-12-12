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

class Game {
    constructor(canvas){
        this.canvas = canvas;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.planet = new Planet(this);

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
        // draw line from planet to mouse
        // context.beginPath();
        // context.moveTo(this.planet.x, this.planet.y);
        // context.lineTo(this.mouse.x, this.mouse.y);
        // context.stroke();
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
