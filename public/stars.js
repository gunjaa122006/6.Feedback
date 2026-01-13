// Interactive Star Background
class StarField {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.stars = [];
    this.particles = [];
    this.mouseX = 0;
    this.mouseY = 0;
    this.mouseTrail = [];
    this.maxTrailLength = 10;
    this.maxStars = 0; // Track max star count to prevent accumulation
    
    this.setupCanvas();
    this.createStars();
    this.attachEvents();
    this.animate();
  }
  
  setupCanvas() {
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '0';
    document.body.insertBefore(this.canvas, document.body.firstChild);
    
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }
  
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  
  createStars() {
    // Reduced star count for calmer effect
    const starCount = Math.floor((this.canvas.width * this.canvas.height) / 20000);
    this.maxStars = starCount; // Store max to prevent accumulation
    for (let i = 0; i < starCount; i++) {
      this.stars.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        radius: Math.random() * 1.9 + 0.6, // Bigger star range (0.4 to 2.2)
        opacity: Math.random() * 0.4 + 0.3,
        twinkleSpeed: Math.random() * 0.003 + 0.002, // Slow gentle twinkling
        baseOpacity: Math.random() * 0.4 + 0.3, // Higher base opacity
        collected: false,
        collectProgress: 0
      });
    }
  }
  
  attachEvents() {
    document.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
      
      // Add to trail
      this.mouseTrail.push({ x: this.mouseX, y: this.mouseY, time: Date.now() });
      if (this.mouseTrail.length > this.maxTrailLength) {
        this.mouseTrail.shift();
      }
      
      // Check for star collection
      this.collectNearbyStars();
    });
  }
  
  collectNearbyStars() {
    const collectionRadius = 80;
    
    this.stars.forEach(star => {
      if (star.collected) return;
      
      const dx = this.mouseX - star.x;
      const dy = this.mouseY - star.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < collectionRadius) {
        star.collected = true;
        
        // Create collection particles (fewer to reduce load)
        for (let i = 0; i < 5; i++) {
          const angle = (Math.PI * 2 * i) / 5;
          this.particles.push({
            x: star.x,
            y: star.y,
            vx: Math.cos(angle) * (Math.random() * 2 + 1),
            vy: Math.sin(angle) * (Math.random() * 2 + 1),
            radius: Math.random() * 1.5 + 0.5,
            opacity: 1,
            life: 1,
            decay: Math.random() * 0.03 + 0.02,
            color: `hsl(${Math.random() * 60 + 200}, 80%, 70%)`
          });
        }
        
        // Respawn star at new location after delay
        setTimeout(() => {
          // Only respawn if we haven't exceeded max stars
          if (this.stars.length <= this.maxStars) {
            star.x = Math.random() * this.canvas.width;
            star.y = Math.random() * this.canvas.height;
            star.radius = Math.random() * 0.6 + 0.2; // Keep new stars small
            star.collected = false;
            star.collectProgress = 0;
            star.opacity = star.baseOpacity;
          }
        }, 2000);
      }
    });
  }
  
  drawStars() {
    this.stars.forEach(star => {
      if (star.collected) {
        star.collectProgress += 0.05;
        star.opacity = Math.max(0, star.baseOpacity * (1 - star.collectProgress));
        star.radius += 0.3;
        return;
      }
      
      // Gentle, slow twinkling effect
      star.opacity = star.baseOpacity + Math.sin(Date.now() * star.twinkleSpeed) * 0.1;
      
      // Draw star with softer appearance
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
      this.ctx.fill();
      
      // Draw subtle glow - less intense
      const gradient = this.ctx.createRadialGradient(
        star.x, star.y, 0,
        star.x, star.y, star.radius * 2.5
      );
      gradient.addColorStop(0, `rgba(200, 210, 255, ${star.opacity * 0.15})`);
      gradient.addColorStop(1, 'rgba(200, 210, 255, 0)');
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.radius * 2.5, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }
  
  drawMouseTrail() {
    if (this.mouseTrail.length < 2) return;
    
    const now = Date.now();
    this.mouseTrail = this.mouseTrail.filter(point => now - point.time < 500);
    
    if (this.mouseTrail.length < 2) return;
    
    this.ctx.strokeStyle = 'rgba(147, 197, 253, 0.3)';
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    
    this.ctx.beginPath();
    this.ctx.moveTo(this.mouseTrail[0].x, this.mouseTrail[0].y);
    
    for (let i = 1; i < this.mouseTrail.length; i++) {
      const point = this.mouseTrail[i];
      const age = (now - point.time) / 500;
      const opacity = (1 - age) * 0.3;
      this.ctx.strokeStyle = `rgba(147, 197, 253, ${opacity})`;
      this.ctx.lineTo(point.x, point.y);
    }
    
    this.ctx.stroke();
  }
  
  drawParticles() {
    this.particles = this.particles.filter(particle => {
      particle.life -= particle.decay;
      particle.opacity = particle.life;
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.1; // Gravity
      particle.vx *= 0.98;
      particle.vy *= 0.98;
      
      if (particle.life > 0) {
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = particle.color.replace(')', `, ${particle.opacity})`).replace('hsl', 'hsla');
        this.ctx.fill();
        
        // Glow effect
        const gradient = this.ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.radius * 2
        );
        gradient.addColorStop(0, particle.color.replace(')', `, ${particle.opacity * 0.5})`).replace('hsl', 'hsla'));
        gradient.addColorStop(1, particle.color.replace(')', ', 0)').replace('hsl', 'hsla'));
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.radius * 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        return true;
      }
      return false;
    });
  }
  
  drawCursor() {
    if (this.mouseX === 0 && this.mouseY === 0) return;
    
    // Outer ring
    this.ctx.strokeStyle = 'rgba(147, 197, 253, 0.4)';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(this.mouseX, this.mouseY, 80, 0, Math.PI * 2);
    this.ctx.stroke();
    
    // Inner pulse
    const pulseRadius = 40 + Math.sin(Date.now() * 0.005) * 10;
    this.ctx.strokeStyle = 'rgba(147, 197, 253, 0.2)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.arc(this.mouseX, this.mouseY, pulseRadius, 0, Math.PI * 2);
    this.ctx.stroke();
  }
  
  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.drawStars();
    this.drawMouseTrail();
    this.drawParticles();
    this.drawCursor();
    
    requestAnimationFrame(() => this.animate());
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new StarField());
} else {
  new StarField();
}
