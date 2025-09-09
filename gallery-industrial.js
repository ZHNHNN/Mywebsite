// 工业设计图片展示：
// - 从 industrial-projects.json 读取指定项目
// - 网格模式使用 thumbs 作为缩略图
// - 点击与长图模式都展示原图
(function(){
  const grid = document.getElementById('gallery');
  const btnGrid = document.getElementById('viewGrid');
  const btnLong = document.getElementById('viewLong');
  const hint = document.getElementById('hint');
  const title = document.getElementById('gallery-title');
  const sub = document.getElementById('gallery-sub');
  let view = localStorage.getItem('galleryView_industrial') || 'grid';

  const qs = new URLSearchParams(location.search);
  const projectName = qs.get('project') || '';

  // 自然排序（同 gallery.js）
  function naturalSort(arr, getName){
    const re = /^(\d+(?:\.\d+)*)(?=[-_.\s]|$)/;
    function segs(s){ return s.split('.').map(n=>parseInt(n,10)); }
    function cmp(a,b){
      const na = getName(a);
      const nb = getName(b);
      const ma = na.match(re);
      const mb = nb.match(re);
      if(ma && mb){
        const aa = segs(ma[1]);
        const bb = segs(mb[1]);
        const len = Math.max(aa.length, bb.length);
        for(let i=0;i<len;i++){
          const x = aa[i] ?? 0; const y = bb[i] ?? 0;
          if(x!==y) return x - y;
        }
        return na.localeCompare(nb, undefined, {numeric:true, sensitivity:'base'});
      }
      if(ma && !mb) return -1;
      if(!ma && mb) return 1;
      return na.localeCompare(nb, undefined, {numeric:true, sensitivity:'base'});
    }
    return arr.slice().sort(cmp);
  }

  function applyView(next){
    view = next;
    localStorage.setItem('galleryView_industrial', view);
    grid.classList.remove('mode-grid','mode-long');
    grid.classList.add(view === 'long' ? 'mode-long' : 'mode-grid');
    if(btnGrid && btnLong){
      btnGrid.setAttribute('aria-pressed', view === 'grid' ? 'true' : 'false');
      btnLong.setAttribute('aria-pressed', view === 'long' ? 'true' : 'false');
    }
  }

  function bindLightbox(originalList){
    const box = document.getElementById('lightbox');
    const img = box.querySelector('.lb-img');
    const prev = box.querySelector('.lb-prev');
    const next = box.querySelector('.lb-next');
    const close = box.querySelector('.lb-close');
    const count = box.querySelector('.lb-count');
    let i = 0;
    function openAt(index){ i = index; img.src = originalList[i]; box.setAttribute('aria-hidden','false'); box.classList.add('show'); box.scrollTop=0; updateCount(); }
    function updateCount(){ count.textContent = `${i+1} / ${originalList.length}`; }
    function showPrev(){ if(i>0){ i--; img.src = originalList[i]; box.scrollTop=0; updateCount(); } }
    function showNext(){ if(i<originalList.length-1){ i++; img.src = originalList[i]; box.scrollTop=0; updateCount(); } }
    function closeBox(){ box.classList.remove('show'); box.setAttribute('aria-hidden','true'); img.src=''; }
    grid.querySelectorAll('a.g-item').forEach(a=>{
      a.addEventListener('click', (e)=>{ e.preventDefault(); const idx = parseInt(a.dataset.index,10)||0; openAt(idx); });
    });
    prev.addEventListener('click', showPrev);
    next.addEventListener('click', showNext);
    close.addEventListener('click', closeBox);
    box.addEventListener('click', (e)=>{ if(e.target===box) closeBox(); });
    window.addEventListener('keydown', (e)=>{
      if(box.classList.contains('show')){
        if(e.key==='Escape') closeBox();
        if(e.key==='ArrowLeft') showPrev();
        if(e.key==='ArrowRight') showNext();
      }
    });
  }

  function render(project){
    const originals = naturalSort(project.images||[], s=> s.split('/').pop());
    const thumbs = (project.thumbs||[]).map((t,i)=> t || originals[i]);
    grid.innerHTML = '';

    // 初始渲染为网格（thumbs）
    function renderGrid(){
      grid.className = 'gallery-grid mode-grid';
      grid.innerHTML = '';
      const fr = document.createDocumentFragment();
      thumbs.forEach((thumbSrc, idx) => {
        const a = document.createElement('a');
        a.href = originals[idx];
        a.className = 'g-item card';
        a.setAttribute('role','listitem');
        a.dataset.index = idx;
        const frame = document.createElement('div'); frame.className = 'frame';
        const img = document.createElement('img'); img.loading='lazy'; img.decoding='async'; img.src=thumbSrc; img.alt = `${project.name||'作品'} ${idx+1}`;
        frame.appendChild(img); a.appendChild(frame); fr.appendChild(a);
      });
      grid.appendChild(fr);
      bindLightbox(originals);
    }

    // 长图模式（originals）
    function renderLong(){
      grid.className = 'gallery-grid mode-long';
      grid.innerHTML = '';
      const fr = document.createDocumentFragment();
      originals.forEach((src, idx)=>{
        const a = document.createElement('a'); a.href = src; a.className='g-item'; a.dataset.index = idx;
        const frame = document.createElement('div'); frame.className='frame';
        const img = document.createElement('img'); img.loading='lazy'; img.decoding='async'; img.src=src; img.alt = `${project.name||'作品'} ${idx+1}`;
        frame.appendChild(img); a.appendChild(frame); fr.appendChild(a);
      });
      grid.appendChild(fr);
      bindLightbox(originals);
    }

    // 初始根据记忆视图渲染
    if(view==='long') renderLong(); else renderGrid();

    // 绑定切换
    btnGrid?.addEventListener('click', ()=>{ applyView('grid'); renderGrid(); });
    btnLong?.addEventListener('click', ()=>{ applyView('long'); renderLong(); });

    title.textContent = '工业设计 · ' + (project.name||'未命名作品');
    sub.textContent = (project.path||'') + ' · 共 ' + originals.length + ' 张（按命名自然排序）';
    if(hint) hint.textContent = '网格为缩略图，点击或长图模式均加载原图。';
  }

  // 入口：加载清单并定位项目（优先使用 JS 变量，避免 file:// fetch 限制）
  function pickAndRender(data){
    const list = (data && Array.isArray(data.projects)) ? data.projects : [];
    let proj = null;
    if(projectName){ proj = list.find(p => (p.name||'').toString() === projectName); }
    if(!proj) proj = list[0];
    if(!proj){ grid.innerHTML='<p class="section-sub">未找到可展示的项目。</p>'; return; }
    render(proj);
    applyView(view);
  }

  (async ()=>{
    let data = window.industrialProjects || null;
    if(!data){
      try{ const r = await fetch('industrial-projects.json', {cache:'no-store'}); if(r.ok) data = await r.json(); }catch(e){}
    }
    if(!data){
      // 最后尝试动态加载 JS 清单
      data = await new Promise((resolve)=>{
        const s = document.createElement('script'); s.src='industrial-projects.js'; s.onload=()=>resolve(window.industrialProjects||null); s.onerror=()=>resolve(null); document.head.appendChild(s);
      });
    }
    if(data) pickAndRender(data); else grid.innerHTML='<p class="section-sub">加载清单失败。</p>';
  })();
})();
