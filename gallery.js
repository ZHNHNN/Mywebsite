// 简易图片画廊：支持两种来源
// 1) 自动读取根目录的 gallery-images.json
// 2) 用户选择本地“作品集图片”文件夹（input[webkitdirectory]）

(function(){
  const grid = document.getElementById('gallery');
  const dirBtn = document.getElementById('pickDir');
  const dirInput = document.getElementById('dirInput');
  const hint = document.getElementById('hint');
  const btnGrid = document.getElementById('viewGrid');
  const btnLong = document.getElementById('viewLong');
  let view = localStorage.getItem('galleryView') || 'grid';

  // 自然排序：按照文件名前缀数字（支持 03、03.1、10- 等）
  function naturalSort(arr, getName){
    const re = /^(\d+(?:\.\d+)*)(?=[-_.\s]|$)/; // 捕获数字和小数段
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
        // 数字段相同则按整体名自然比较
        return na.localeCompare(nb, undefined, {numeric:true, sensitivity:'base'});
      }
      if(ma && !mb) return -1; // 有数字前缀的排在前
      if(!ma && mb) return 1;
      return na.localeCompare(nb, undefined, {numeric:true, sensitivity:'base'});
    }
    return arr.slice().sort(cmp);
  }

  // 渲染缩略图网格
  function render(images){
    grid.innerHTML = '';
    const fr = document.createDocumentFragment();
    images.forEach((src, idx) => {
      const item = document.createElement('a');
      item.href = src;
      item.className = 'g-item card';
      item.setAttribute('role','listitem');
      item.dataset.index = idx;
      const frame = document.createElement('div');
      frame.className = 'frame';
      const img = document.createElement('img');
      img.loading = 'lazy';
      img.decoding = 'async';
      img.src = src;
      img.alt = `作品图 ${idx+1}`;
      frame.appendChild(img);
      item.appendChild(frame);
      fr.appendChild(item);
    });
    grid.appendChild(fr);
    bindLightbox(images);
    applyView(view); // 按当前模式应用布局
  }

  // 尝试自动加载 gallery-images.js 中的图片数据
  async function tryAuto(){
    // 首先尝试从 gallery-images.js 加载
    if(window.galleryImages && Array.isArray(window.galleryImages)){
      const fixed = window.galleryImages.map(p => typeof p === 'string' ? p.replace(/\\\\/g,'/') : p);
      const sorted = naturalSort(fixed, s => s.split('/').pop());
      render(sorted);
      if(hint) hint.textContent = `已自动加载 ${sorted.length} 张图片（按命名顺序）`;
      return;
    }
    
    // 如果 JS 中没有数据，尝试加载 JSON 文件
    try{
      const res = await fetch('gallery-images.json', {cache:'no-store'});
      if(!res.ok) throw new Error('no manifest');
      const arr = await res.json();
      if(Array.isArray(arr) && arr.length){
        const fixed = arr.map(p => typeof p === 'string' ? p.replace(/\\\\/g,'/') : p);
        const sorted = naturalSort(fixed, s => s.split('/').pop());
        render(sorted);
        if(hint) hint.textContent = `已自动加载 ${sorted.length} 张图片（按命名顺序）`;
      }
    }catch(e){
      // 静默失败，等待用户选择
      console.log('无法加载图片数据，请检查 gallery-images.js 或 gallery-images.json');
    }
  }

  // 选择目录加载
  dirBtn?.addEventListener('click', () => dirInput.click());
  dirInput?.addEventListener('change', (e) => {
    const files = Array.from(e.target.files || []).filter(f=>/^image\//.test(f.type));
    const sortedFiles = naturalSort(files, f => f.name);
    const srcs = sortedFiles.map(f => URL.createObjectURL(f));
    render(srcs);
    if(hint) hint.textContent = `已从所选文件夹加载 ${srcs.length} 张图片（按命名顺序）`;
  });

  // 轻量 Lightbox 逻辑
  function bindLightbox(list){
    const box = document.getElementById('lightbox');
    const img = box.querySelector('.lb-img');
    const prev = box.querySelector('.lb-prev');
    const next = box.querySelector('.lb-next');
    const close = box.querySelector('.lb-close');
    const count = box.querySelector('.lb-count');
    let i = 0;

    function openAt(index, href){
      i = index;
      img.src = href;
      box.setAttribute('aria-hidden','false');
      box.classList.add('show');
      box.scrollTop = 0;
      updateCount();
    }
    function updateCount(){ count.textContent = `${i+1} / ${list.length}`; }
    function showPrev(){ if(i>0){ i--; img.src = list[i]; box.scrollTop = 0; updateCount(); } }
    function showNext(){ if(i<list.length-1){ i++; img.src = list[i]; box.scrollTop = 0; updateCount(); } }
    function closeBox(){ box.classList.remove('show'); box.setAttribute('aria-hidden','true'); img.src = ''; }

    grid.querySelectorAll('a.g-item').forEach(a=>{
      a.addEventListener('click', (e)=>{
        e.preventDefault();
        const idx = parseInt(a.dataset.index,10) || 0;
        openAt(idx, a.href);
      });
    });
    prev.addEventListener('click', showPrev);
    next.addEventListener('click', showNext);
    close.addEventListener('click', closeBox);
    box.addEventListener('click', (e)=>{ if(e.target === box) closeBox(); });
    window.addEventListener('keydown', (e)=>{
      if(box.classList.contains('show')){
        if(e.key === 'Escape') closeBox();
        if(e.key === 'ArrowLeft') showPrev();
        if(e.key === 'ArrowRight') showNext();
      }
    });
  }

  tryAuto();

  // ===== 视图模式切换（grid / long） =====
  function applyView(next){
    view = next;
    localStorage.setItem('galleryView', view);
    grid.classList.remove('mode-grid','mode-long');
    grid.classList.add(view === 'long' ? 'mode-long' : 'mode-grid');
    if(btnGrid && btnLong){
      btnGrid.setAttribute('aria-pressed', view === 'grid' ? 'true' : 'false');
      btnLong.setAttribute('aria-pressed', view === 'long' ? 'true' : 'false');
    }
    // 清理旧的绝对定位残留（如有）
    grid.querySelectorAll('a.g-item').forEach(it=>{ it.style.transform=''; it.style.width=''; });
  }

  btnGrid?.addEventListener('click', ()=> applyView('grid'));
  btnLong?.addEventListener('click', ()=> applyView('long'));
  // 初始化视图状态（无论图片是否已加载）
  applyView(view);
})();
