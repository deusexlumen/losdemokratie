// main.js — TOC highlighting, copy anchor, small UX helpers

document.addEventListener('DOMContentLoaded', function(){
  const tocLinks = Array.from(document.querySelectorAll('.toc-link'));
  const sections = Array.from(document.querySelectorAll('article section'));

  // IntersectionObserver to set active TOC link
  const obsOptions = { root: null, rootMargin: '0px 0px -40% 0px', threshold: 0 };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const id = entry.target.id;
      const link = document.querySelector(`.toc a[href="#${id}"]`);
      if (!link) return;
      if (entry.isIntersecting) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }, obsOptions);

  sections.forEach(s => observer.observe(s));

  // Add copy-anchor buttons to headings
  sections.forEach(sec => {
    const h = sec.querySelector('h2');
    if (!h) return;
    const btn = document.createElement('button');
    btn.className = 'copy-anchor';
    btn.type = 'button';
    btn.title = 'Permalink kopieren';
    btn.innerText = '🔗 Link';
    btn.addEventListener('click', () => {
      const url = `${location.origin}${location.pathname}#${sec.id}`;
      navigator.clipboard?.writeText(url).then(() => {
        btn.innerText = '✅ Kopiert';
        setTimeout(()=> btn.innerText = '🔗 Link', 1200);
      }).catch(()=> {
        // fallback: select and prompt
        prompt('Kopiere den Link manuell:', url);
      });
    });
    h.appendChild(btn);
  });

  // Improve keyboard focus visibility on TOC links: on focus ensure visible
  tocLinks.forEach(link => {
    link.addEventListener('focus', (ev) => {
      const rect = ev.target.getBoundingClientRect();
      if (rect.top < 0 || rect.bottom > window.innerHeight) {
        ev.target.scrollIntoView({behavior:'smooth', block:'center'});
      }
    });
  });

  // Respect reduced motion
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (mq.matches) {
    document.documentElement.style.scrollBehavior = 'auto';
  }

  // Optional: highlight on click (instant feedback)
  tocLinks.forEach(a => {
    a.addEventListener('click', () => {
      tocLinks.forEach(x=>x.classList.remove('clicked'));
      a.classList.add('clicked');
      setTimeout(()=>a.classList.remove('clicked'), 800);
    });
  });
});
