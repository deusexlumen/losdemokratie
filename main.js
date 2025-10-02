document.addEventListener('DOMContentLoaded', () => {
  gsap.registerPlugin(ScrollTrigger);

  /* Progress bar */
  const progress = document.getElementById('read-progress');
  window.addEventListener('scroll', () => {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    const pct = (window.scrollY / h) * 100;
    progress.style.width = pct + "%";
  });

  /* Section fade-ins */
  document.querySelectorAll('.section').forEach(sec => {
    gsap.fromTo(sec, {opacity:0,y:20}, {
      opacity:1,y:0,duration:1,
      scrollTrigger:{trigger:sec,start:"top 80%"}
    });
  });

  /* Cinematic scene */
  const scene = gsap.timeline({
    scrollTrigger:{
      trigger:"#cinematic",
      start:"top top",
      end:"+=200%",
      scrub:true,
      pin:true
    }
  });
  scene
    .to(".scene-title",{opacity:1,y:-20,duration:1})
    .to(".scene-sub",{opacity:1,y:-10,duration:1},"-=0.5")
    .to(".scene-bg",{background:"radial-gradient(circle at center, rgba(212,63,58,0.25), transparent 80%)",duration:2},"-=0.5")
    .to(".scene-keywords span",{opacity:1,scale:1,stagger:0.3,duration:1.2,ease:"back.out(1.7)"},"-=0.5")
    .to(".scene-keywords span",{y:-30,opacity:0,stagger:0.2,duration:1,ease:"power2.in"})
    .to(".scene-title,.scene-sub",{opacity:0,y:-40,duration:1},"-=0.8");

  /* Copy anchors */
  document.querySelectorAll('.copy-anchor').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const sec = btn.closest('.section');
      if(sec){
        const url = `${location.origin}${location.pathname}#${sec.id}`;
        navigator.clipboard.writeText(url);
        btn.textContent="✅";
        setTimeout(()=>btn.textContent="🔗",1000);
      }
    });
  });
});
