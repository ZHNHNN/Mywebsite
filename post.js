// 安全补丁：当原 script.js 因编码问题导致未执行时，保证关键功能可用
(function(){
  function q(sel){ return document.querySelector(sel) }
  function qa(sel){ return Array.from(document.querySelectorAll(sel)) }

  // 1) 顶部 LOGO（SVG 优先）
  (function(){
    const brand = q('.brand'); if(!brand) return;
    if(brand.querySelector('img.brand-logo')) return;
    const candidates = ['logo/LOGO-white.svg','logo/logo.svg','白-透明.png','白-透明-粗.png'];
    const img = document.createElement('img'); img.className='brand-logo'; img.alt='logo';
    let i=0; function next(){ if(i>=candidates.length) return; img.src=candidates[i++]; }
    img.onload = ()=>{ qa('.brand-dot,.brand-text').forEach(n=>n.remove()); brand.insertBefore(img, brand.firstChild) };
    img.onerror = next; next();
  })();

  // 2) 标题：交互作品集
  (function(){ const t = q('#work-title'); if(t) t.textContent = '交互作品集'; })();

  // 3) 联系方式覆盖 + 社交图标
  (function(){
    const card = q('#contact .contact-card'); if(!card) return;
    card.innerHTML = [
      '<p>邮箱：<a class="link" href="mailto:1795620132@qq.com">1795620132@qq.com</a></p>',
      '<p>微信：zhn17347301280</p>',
      '<div class="social" aria-label="社交链接">',
      '  <a class="social-link social-douyin" href="https://www.douyin.com/user/MS4wLjABAAAAdhkhoSRDRrOIRdFL_xBil9kRpF7yuWbqD_0p6yRdQizsBvsiRdFElC4mFxNCAL-p" target="_blank" rel="noopener" aria-label="抖音"></a>',
      '  <a class="social-link social-xhs" href="https://www.xiaohongshu.com/user/profile/6040fbc50000000001003bfb" target="_blank" rel="noopener" aria-label="小红书"></a>',
      '</div>'
    ].join('');
    const sub = q('#contact .section-sub'); if(sub) sub.textContent = '欢迎合作与交流';
    function inject(anchorSel, list, fallback){ const a=q(anchorSel); if(!a) return; let i=0; const img=new Image(); img.className='social-icon'; img.alt=a.getAttribute('aria-label')||''; img.onload=()=>a.appendChild(img); img.onerror=()=>{ if(++i<list.length){ img.src=list[i]; } else if(fallback){ fallback(a) } }; img.src=list[i]; }
    inject('.social-douyin', ['logo/抖音.svg','logo/douyin.svg'], (a)=>{ a.innerHTML='<svg viewBox="0 0 256 256" width="24" height="24"><path fill="currentColor" d="M160 24v72a56 56 0 11-56 56v-32a24 24 0 1024 24V24h32zm16 16c5 24 25 44 49 49v31c-23-1-43-9-61-22v46a72 72 0 11-72-72c3 0 7 0 10 1v32a40 40 0 1040 40V40h34z"/></svg>'; });
    inject('.social-xhs', ['logo/小红书.svg','logo/xiaohongshu.svg'], (a)=>{ a.innerHTML='<svg viewBox="0 0 256 256" width="24" height="24"><rect x="16" y="40" width="224" height="176" rx="28" fill="#ff2442"/><path fill="#fff" d="M78 98h20v60H78zm36 0h20v60h-20zm36 0h20v60h-20zm36 0h20v60h-20z"/></svg>'; });
  })();

  // 4) 工业设计作品集（若未存在则注入）
  (function(){
    if(q('#work-industrial')) return;
    const anchor = q('#about') || q('#work'); if(!anchor || !anchor.parentNode) return;
    const sec = document.createElement('section'); sec.id='work-industrial'; sec.className='section work'; sec.setAttribute('aria-labelledby','work-industrial-title');
    sec.innerHTML = '<div class="section-head"><h2 id="work-industrial-title">工业设计作品集</h2><p class="section-sub">每个子文件夹一个作品 · 缩略图来自 thumbs</p></div><div id="ind-grid" class="projects-grid"></div>';
    anchor.parentNode.insertBefore(sec, anchor);
    function loadManifest(){ return new Promise((r)=>{ if(window.industrialProjects){ r(window.industrialProjects); } else { const s=document.createElement('script'); s.src='industrial-projects.js'; s.onload=()=>r(window.industrialProjects||null); s.onerror=()=>r(null); document.head.appendChild(s);} }); }
    function pickThumb(p){ if(Array.isArray(p.thumbs)){ const i=p.thumbs.findIndex(x=>!!x); if(i>=0) return p.thumbs[i]; } return (p.images||[])[0] || '' }
    loadManifest().then(data=>{ const grid=q('#ind-grid'); if(!grid||!data||!Array.isArray(data.projects)) return; const fr=document.createDocumentFragment(); data.projects.forEach(p=>{ const art=document.createElement('article'); art.className='card project'; art.tabIndex=0; const t=pickThumb(p); const dv=document.createElement('div'); dv.className='thumb'; if(t) dv.style.background = `#0b0d10 url('${t.replace(/\\/g,'/')}') center top / cover no-repeat`; const body=document.createElement('div'); body.className='card-body'; body.innerHTML=`<h3 class="card-title">${p.name||'未命名作品'}</h3><p class="card-desc">工业设计 · 共${(p.images||[]).length}张</p>`; const foot=document.createElement('footer'); foot.className='card-foot'; const href='gallery-industrial.html?project='+encodeURIComponent(p.name||''); foot.innerHTML = '<span class="meta">Industrial Design</span>' + `<a class="link" href="${href}">查看</a>`; const a=document.createElement('a'); a.className='stretched'; a.href=href; a.setAttribute('aria-hidden','true'); a.tabIndex=-1; art.appendChild(dv); art.appendChild(body); art.appendChild(foot); art.appendChild(a); fr.appendChild(art); }); grid.appendChild(fr); });
  })();

  // 5) 视觉传达作品集（期刊封面）：注入 + 预览
  (function(){
    if(q('#work-visual')) return;
    const after = q('#work-industrial') || q('#about') || q('#work'); if(!after || !after.parentNode) return;
    const sec = document.createElement('section'); sec.id='work-visual'; sec.className='section work'; sec.setAttribute('aria-labelledby','work-visual-title');
    sec.innerHTML = '<div class="section-head"><h2 id="work-visual-title">视觉传达作品集</h2><p class="section-sub">期刊封面 · 卡片即图片 · 点击在本页放大查看</p></div><div id="vc-grid" class="projects-grid"></div>';
    after.parentNode.insertBefore(sec, after.nextSibling);
    function loadCovers(){ return new Promise((r)=>{ if(window.visualCovers){ r(window.visualCovers); } else { const s=document.createElement('script'); s.src='visual-covers.js'; s.onload=()=>r(window.visualCovers||null); s.onerror=()=>r(null); document.head.appendChild(s);} }); }
    function ensureLightbox(){ let box=q('#lightbox'); if(box) return box; box=document.createElement('div'); box.id='lightbox'; box.className='lightbox'; box.setAttribute('aria-hidden','true'); box.setAttribute('aria-modal','true'); box.setAttribute('role','dialog'); box.innerHTML='<button class="lb-close" aria-label="关闭">×</button><button class="lb-prev" aria-label="上一张">‹</button><img class="lb-img" alt="预览" /><button class="lb-next" aria-label="下一张">›</button><div class="lb-count" aria-live="polite"></div>'; document.body.appendChild(box); return box; }
    function render(data){ const grid=q('#vc-grid'); if(!grid||!data||!Array.isArray(data.groups)) return; const groups=data.groups.slice().sort((a,b)=>(parseInt(a.key||'0')||0)-(parseInt(b.key||'0')||0)); const fr=document.createDocumentFragment(); const box=ensureLightbox(); const lbImg=box.querySelector('.lb-img'); const prev=box.querySelector('.lb-prev'); const next=box.querySelector('.lb-next'); const close=box.querySelector('.lb-close'); const count=box.querySelector('.lb-count'); let list=[]; let i=0; function upd(){ count.textContent=`${i+1} / ${list.length}` } function openAt(arr,idx){ list=arr.map(s=> (s||'').replace(/\\/g,'/')); i=Math.max(0,Math.min(idx,list.length-1)); lbImg.src=list[i]; box.setAttribute('aria-hidden','false'); box.classList.add('show'); box.scrollTop=0; upd(); } function showPrev(){ if(i>0){ i--; lbImg.src=list[i]; box.scrollTop=0; upd(); } } function showNext(){ if(i<list.length-1){ i++; lbImg.src=list[i]; box.scrollTop=0; upd(); } } function closeBox(){ box.classList.remove('show'); box.setAttribute('aria-hidden','true'); lbImg.src=''; list=[]; i=0; }
      prev.onclick=showPrev; next.onclick=showNext; close.onclick=closeBox; box.addEventListener('click',e=>{ if(e.target===box) closeBox(); }); window.addEventListener('keydown',e=>{ if(box.classList.contains('show')){ if(e.key==='Escape') closeBox(); if(e.key==='ArrowLeft') showPrev(); if(e.key==='ArrowRight') showNext(); } });
      groups.forEach(g=>{ const imgs=(g.images||[]).map(s=> (s||'').replace(/\\/g,'/')); if(!imgs.length) return; const cover=imgs[0]; const art=document.createElement('article'); art.className='card project'; art.tabIndex=0; const frame=document.createElement('div'); frame.className='frame'; const im=new Image(); im.loading='lazy'; im.decoding='async'; im.src=cover; im.alt=`封面 ${g.key}`; frame.appendChild(im); art.appendChild(frame); art.addEventListener('click',e=>{ e.preventDefault(); openAt(imgs,0); }); fr.appendChild(art); }); grid.appendChild(fr);
    }
    loadCovers().then(data=>{ if(data) render(data); });
  })();
})();

