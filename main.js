// main.js — epische Version mit Scroll-Animationen & TOC Highlight

document.addEventListener('DOMContentLoaded', function(){
  const tocLinks = document.querySelectorAll('.toc-link');
  const sections = document.querySelectorAll('article .section');

  // IntersectionObserver für TOC + Section Animations
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const id = entry.target.id;
      const link = document.querySelector(`.toc a[href="#${id}"]`);
      if(entry.isIntersecting){
        entry.target.classList.add('visible');
        if(link){ link.classList.add('active'); }
      } else {
        if(link){ link.classList.remove('active'); }
      }
    });
  }, { threshold: 0.2 });

  sections.forEach(sec => observer.observe(sec));

  // Copy Anchor Buttons
  sections.forEach(sec => {
    const h = sec.querySelector('h2');
    if(!h) return;
    const btn = document.createElement('button');
    btn.className = 'copy-anchor';
    btn.innerText = '🔗';
    btn.title = 'Abschnittslink kopieren';
    btn.style.marginLeft = '8px';
    btn.onclick = () => {
      const url = `${location.origin}${location.pathname}#${sec.id}`;
      navigator.clipboard.writeText(url).then(()=>{
        btn.innerText = '✅';
        setTimeout(()=> btn.innerText = '🔗', 1200);
      });
    };
    h.appendChild(btn);
  });

  // Kleine Button Glow Animation beim Klick
  document.querySelectorAll('.btn').forEach(b => {
    b.addEventListener('click', () => {
      b.classList.add('pulse');
      setTimeout(()=> b.classList.remove('pulse'), 500);
    });
  });
});
