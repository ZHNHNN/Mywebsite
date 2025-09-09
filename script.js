// 主题切换：跟随系统 + 手动记忆
(function(){
  const root = document.documentElement;
  const btn = document.querySelector('.theme-toggle');
  const saved = localStorage.getItem('theme');

  function applyTheme(t){
    if(t === 'auto'){
      root.setAttribute('data-theme', matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    }else{
      root.setAttribute('data-theme', t);
    }
  }

  if(saved){
    applyTheme(saved);
  }else{
    root.setAttribute('data-theme', matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }

  btn?.addEventListener('click', () => {
    const current = root.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  });

  // 系统主题变化时若为 auto 可跟随（留接口）
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if(localStorage.getItem('theme') === 'auto') applyTheme('auto');
  });
})();

// 性能模式检测：低端设备或参数触发 data-effects="low"
(function(){
  const root = document.documentElement;
  const params = new URLSearchParams(location.search);
  const override = localStorage.getItem('effects') || params.get('perf');
  if(override === 'low'){ root.setAttribute('data-effects', 'low'); }
  if(override === 'high'){ root.setAttribute('data-effects', 'high'); }

  if(!override){
    const lowMem = navigator.deviceMemory && navigator.deviceMemory <= 4;
    const lowCPU = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
    const mobile = /Mobi|Android/i.test(navigator.userAgent);
    if(lowMem || lowCPU || mobile){
      root.setAttribute('data-effects', 'low');
    }
  }
})();

// 作品卡片进场
(function(){
  const cards = document.querySelectorAll('.project');
  if(!('IntersectionObserver' in window)){
    cards.forEach(c=>c.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add('is-in'); io.unobserve(e.target);}})
  }, {threshold: .12});
  cards.forEach(c => io.observe(c));
})();

// 轻微 3D 互动（动效尊重 reduced-motion，且只在悬停时监听）
(function(){
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce) return;
  const cards = document.querySelectorAll('.project');
  cards.forEach(card => {
    const max = 6; // 最大倾斜角度
    let raf = null;
    let onMove;
    function attach(){
      onMove = (e)=>{
        const r = card.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width) - .5;
        const y = ((e.clientY - r.top) / r.height) - .5;
        const rx = (y * -max).toFixed(2);
        const ry = (x *  max).toFixed(2);
        if(raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(()=>{
          card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-2px)`;
        });
      };
      card.addEventListener('pointermove', onMove);
    }
    function detach(){
      if(onMove){ card.removeEventListener('pointermove', onMove); onMove = null; }
      card.style.transform = '';
    }
    card.addEventListener('pointerenter', attach);
    card.addEventListener('pointerleave', detach);
  });
})();

// 年份
const yearEl = document.getElementById('y');
if(yearEl) yearEl.textContent = new Date().getFullYear();

// 顶部 LOGO：优先使用 logo 目录下的 SVG，其次回退到白底透明 PNG
(function(){
  const brand = document.querySelector('.brand');
  if(!brand) return;
  const candidates = [
    'logo/个人LOGO.svg',
    'logo/LOGO-white.svg',
    'logo/logo.svg',
    '\u767d-\u900f\u660e.png',            // 白-透明.png
    '\u767d-\u900f\u660e-\u7c97.png'   // 白-透明-粗.png
  ];

  function attachImage(src){
    const img = document.createElement('img');
    img.className = 'brand-logo';
    img.alt = 'logo';
    img.src = src;
    img.onload = ()=>{
      const dot = brand.querySelector('.brand-dot'); if(dot) dot.remove();
      const txt = brand.querySelector('.brand-text'); if(txt) txt.remove();
      brand.insertBefore(img, brand.firstChild);
    };
    img.onerror = ()=> tryNext();
  }

  let idx = 0;
  function tryNext(){
    if(idx >= candidates.length) return; // 保持文字回退
    const src = candidates[idx++];
    attachImage(src);
  }

  tryNext();
})();

// ===== 工业设计作品集：动态生成卡片，并将"作品集"标题改为"交互作品集" =====
(function(){
  if(!document.getElementById('work')) return; // 仅在首页执行

  // 1) 将现有作品集标题改为"交互设计作品集"
  const workTitle = document.getElementById('work-title');
  if(workTitle){ workTitle.textContent = '交互设计作品集'; }

  // 2) 创建各个分区
  const aboutSection = document.getElementById('about');
  const workSection = document.getElementById('work');
  
  // 创建工业设计作品集分区
  const container = document.createElement('section');
  container.id = 'work-industrial';
  container.className = 'section work';
  container.setAttribute('aria-labelledby','work-industrial-title');
  container.innerHTML = [
    '<div class="section-head">',
    '  <h2 id="work-industrial-title">工业设计作品集</h2>',
    '</div>',
    '<div id="ind-grid" class="projects-grid"></div>'
  ].join('');
  
  // 创建视觉作品集分区
  const visualContainer = document.createElement('section');
  visualContainer.id = 'work-visual';
  visualContainer.className = 'section work';
  visualContainer.setAttribute('aria-labelledby','work-visual-title');
  visualContainer.innerHTML = [
    '<div class="section-head">',
    '  <h2 id="work-visual-title">视觉作品集</h2>',
    '</div>',
    '<div id="visual-grid" class="projects-grid visual-covers-grid"></div>'
  ].join('');
  
  // 按顺序插入分区：交互 -> 工业 -> 摄影 -> 视觉 -> 关于
  if(aboutSection && aboutSection.parentNode){ 
    // 首先插入工业设计分区
    aboutSection.parentNode.insertBefore(container, aboutSection);
    
    // 获取摄影分区并重新定位
    const photoSection = document.getElementById('photo');
    if(photoSection) {
      aboutSection.parentNode.insertBefore(photoSection, aboutSection);
    }
    
    // 最后插入视觉分区
    aboutSection.parentNode.insertBefore(visualContainer, aboutSection);
  } else if(workSection && workSection.parentNode){ 
    workSection.parentNode.insertBefore(container, workSection.nextSibling);
    
    const photoSection = document.getElementById('photo');
    if(photoSection) {
      workSection.parentNode.insertBefore(photoSection, workSection.nextSibling);
    }
    
    workSection.parentNode.insertBefore(visualContainer, workSection.nextSibling);
  }

  // 3) 加载工业设计清单并渲染卡片（优先使用 JS 清单，避免本地 file:// fetch 受限）
  function renderFrom(data){
      const grid = document.getElementById('ind-grid');
      if(!grid || !data || !Array.isArray(data.projects)) return;
      const frag = document.createDocumentFragment();

      // 辅助：选择一个可用缩略图（优先第一张 thumbs），找不到则退回原图
      function pickThumb(p){
        if(Array.isArray(p.thumbs)){
          const i = p.thumbs.findIndex(x => !!x);
          if(i>=0) return p.thumbs[i];
        }
        return Array.isArray(p.images) ? p.images[0] : '';
      }

      data.projects.forEach(p => {
        const thumb = pickThumb(p);
        const name = p.name || '未命名作品';
        const href = 'gallery-industrial.html?project=' + encodeURIComponent(name);
        const art = document.createElement('article');
        art.className = 'card project';
        art.tabIndex = 0;
        const thumbDiv = document.createElement('div');
        thumbDiv.className = 'thumb';
        thumbDiv.setAttribute('role','img');
        thumbDiv.setAttribute('aria-label', name);
        if(thumb){ thumbDiv.style.background = `#0b0d10 url('${thumb}') center top / cover no-repeat`; }
        const body = document.createElement('div');
        body.className = 'card-body';
        body.innerHTML = `<h3 class="card-title">${name}</h3>`;
        const foot = document.createElement('footer');
        foot.className = 'card-foot';
        foot.innerHTML = `<span class="meta">${p.description || '产品设计'}</span>`;
        const stretched = document.createElement('a');
        stretched.className = 'stretched';
        stretched.href = href;
        stretched.setAttribute('aria-hidden','true');
        stretched.tabIndex = -1;

        art.appendChild(thumbDiv);
        art.appendChild(body);
        art.appendChild(foot);
        art.appendChild(stretched);
        frag.appendChild(art);
      });
      grid.appendChild(frag);

      // 新增卡片也应用进场与 3D 交互（重用前面的逻辑，简单触发一下）
      try{
        const cards = document.querySelectorAll('#work-industrial .project');
        if(!('IntersectionObserver' in window)){
          cards.forEach(c=>c.classList.add('is-in'));
        }else{
          const io = new IntersectionObserver(entries => {
            entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add('is-in'); io.unobserve(e.target);}})
          }, {threshold: .12});
          cards.forEach(c => io.observe(c));
        }
        // 为新增卡片补齐 3D 悬停微交互
        const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
        if(!reduce){
          cards.forEach(card => {
            const max = 6; let raf = null; let onMove;
            function attach(){
              onMove = (e)=>{
                const r = card.getBoundingClientRect();
                const x = ((e.clientX - r.left) / r.width) - .5;
                const y = ((e.clientY - r.top) / r.height) - .5;
                const rx = (y * -max).toFixed(2);
                const ry = (x *  max).toFixed(2);
                if(raf) cancelAnimationFrame(raf);
                raf = requestAnimationFrame(()=>{
                  card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-2px)`;
                });
              };
              card.addEventListener('pointermove', onMove);
            }
            function detach(){ if(onMove){ card.removeEventListener('pointermove', onMove); onMove = null; } card.style.transform = ''; }
            card.addEventListener('pointerenter', attach);
            card.addEventListener('pointerleave', detach);
          });
        }
      }catch(e){ /* 忽略 */ }
  }

  function tryLoadJS(){
    return new Promise((resolve)=>{
      if(window.industrialProjects){ resolve(window.industrialProjects); return; }
      const s = document.createElement('script');
      s.src = 'industrial-projects.js';
      s.onload = ()=> resolve(window.industrialProjects || null);
      s.onerror = ()=> resolve(null);
      document.head.appendChild(s);
    });
  }

  (async ()=>{
    let data = await tryLoadJS();
    if(!data){
      try{
        const r = await fetch('industrial-projects.json', {cache:'no-store'});
        if(r.ok) data = await r.json();
      }catch(e){ /* ignore */ }
    }
    if(data) renderFrom(data);
  })();
  
  // 加载封面作品集并渲染卡片
  function renderVisualCovers(data){
    const grid = document.getElementById('visual-grid');
    if(!grid || !data || !Array.isArray(data.projects)) return;
    const frag = document.createDocumentFragment();

    data.projects.forEach(project => {
      const coverImage = project.images && project.images[0]; // 使用第一张作为封面
      if(!coverImage) return;
      
      const art = document.createElement('article');
      art.className = 'card project visual-cover';
      art.tabIndex = 0;
      art.dataset.projectId = project.id;
      
      const thumbDiv = document.createElement('div');
      thumbDiv.className = 'thumb';
      thumbDiv.setAttribute('role','img');
      thumbDiv.setAttribute('aria-label', project.name);
      thumbDiv.style.background = `#0b0d10 url('${coverImage}') center / cover no-repeat`;
      
      art.appendChild(thumbDiv);
      
      // 点击事件：直接打开 lightbox，不跳转
      art.addEventListener('click', (e) => {
        e.preventDefault();
        openVisualLightbox(project.images, 0);
      });
      
      frag.appendChild(art);
    });
    
    grid.appendChild(frag);
    
    // 应用进场动画
    try{
      const cards = document.querySelectorAll('#work-visual .project');
      if(!('IntersectionObserver' in window)){
        cards.forEach(c=>c.classList.add('is-in'));
      }else{
        const io = new IntersectionObserver(entries => {
          entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add('is-in'); io.unobserve(e.target);}});
        }, {threshold: .12});
        cards.forEach(c => io.observe(c));
      }
      // 3D 效果
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      if(!reduce){
        cards.forEach(card => {
          const max = 6; let raf = null; let onMove;
          function attach(){
            onMove = (e)=>{
              const r = card.getBoundingClientRect();
              const x = ((e.clientX - r.left) / r.width) - .5;
              const y = ((e.clientY - r.top) / r.height) - .5;
              const rx = (y * -max).toFixed(2);
              const ry = (x *  max).toFixed(2);
              if(raf) cancelAnimationFrame(raf);
              raf = requestAnimationFrame(()=>{
                card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-2px)`;
              });
            };
            card.addEventListener('pointermove', onMove);
          }
          function detach(){ if(onMove){ card.removeEventListener('pointermove', onMove); onMove = null; } card.style.transform = ''; }
          card.addEventListener('pointerenter', attach);
          card.addEventListener('pointerleave', detach);
        });
      }
    }catch(e){ /* 忽略 */ }
  }
  
  // 封面作品集的 lightbox 功能
  let visualLightboxCurrentImages = [];
  let visualLightboxCurrentIndex = 0;
  
  function openVisualLightbox(images, startIndex) {
    visualLightboxCurrentImages = images;
    visualLightboxCurrentIndex = startIndex;
    
    // 创建或获取 lightbox
    let lb = document.getElementById('visual-lightbox');
    if(!lb) {
      lb = document.createElement('div');
      lb.id = 'visual-lightbox';
      lb.className = 'lightbox';
      lb.setAttribute('aria-hidden','true');
      lb.setAttribute('aria-modal','true');
      lb.setAttribute('role','dialog');
      lb.innerHTML = [
        '<button class="lb-close" aria-label="关闭">×</button>',
        '<button class="lb-prev" aria-label="上一张">‹</button>',
        '<img class="lb-img" alt="预览" />',
        '<button class="lb-next" aria-label="下一张">›</button>',
        '<div class="lb-count" aria-live="polite"></div>'
      ].join('');
      document.body.appendChild(lb);
      
      // 绑定事件
      lb.querySelector('.lb-close').addEventListener('click', closeVisualLightbox);
      lb.querySelector('.lb-prev').addEventListener('click', prevVisualImage);
      lb.querySelector('.lb-next').addEventListener('click', nextVisualImage);
      lb.addEventListener('click', (e) => { if(e.target === lb) closeVisualLightbox(); });
      
      // 键盘事件
      window.addEventListener('keydown', (e) => {
        if(lb.classList.contains('show')){
          if(e.key === 'Escape') closeVisualLightbox();
          if(e.key === 'ArrowLeft') prevVisualImage();
          if(e.key === 'ArrowRight') nextVisualImage();
        }
      });
    }
    
    updateVisualLightbox();
    lb.classList.add('show');
    lb.setAttribute('aria-hidden','false');
  }
  
  function closeVisualLightbox() {
    const lb = document.getElementById('visual-lightbox');
    if(lb) {
      lb.classList.remove('show');
      lb.setAttribute('aria-hidden','true');
    }
  }
  
  function prevVisualImage() {
    if(visualLightboxCurrentIndex > 0) {
      visualLightboxCurrentIndex--;
      updateVisualLightbox();
    }
  }
  
  function nextVisualImage() {
    if(visualLightboxCurrentIndex < visualLightboxCurrentImages.length - 1) {
      visualLightboxCurrentIndex++;
      updateVisualLightbox();
    }
  }
  
  function updateVisualLightbox() {
    const lb = document.getElementById('visual-lightbox');
    if(lb) {
      const img = lb.querySelector('.lb-img');
      const count = lb.querySelector('.lb-count');
      const prev = lb.querySelector('.lb-prev');
      const next = lb.querySelector('.lb-next');
      
      if(img) img.src = visualLightboxCurrentImages[visualLightboxCurrentIndex];
      if(count) count.textContent = `${visualLightboxCurrentIndex + 1} / ${visualLightboxCurrentImages.length}`;
      
      // 控制箭头显示
      if(prev) prev.style.display = visualLightboxCurrentIndex > 0 ? 'block' : 'none';
      if(next) next.style.display = visualLightboxCurrentIndex < visualLightboxCurrentImages.length - 1 ? 'block' : 'none';
    }
  }
  
  function tryLoadVisualJS(){
    return new Promise((resolve)=>{
      if(window.visualCovers){ resolve(window.visualCovers); return; }
      const s = document.createElement('script');
      s.src = 'visual-covers.js';
      s.onload = ()=> resolve(window.visualCovers || null);
      s.onerror = ()=> resolve(null);
      document.head.appendChild(s);
    });
  }

  (async ()=>{
    const visualData = await tryLoadVisualJS();
    if(visualData) renderVisualCovers(visualData);
  })();
})();

// ===== Photography Portfolio: Dynamically generate album cards =====
(function() {
  if (!document.getElementById('photo')) return; // Only run on the main page

  const nameMap = {
    "City": "城市",
    "Natural": "自然",
    "Campus": "校园",
    "Aerial Photography": "航拍",
    "Culture": "人文、纪实",
    "Animal": "动物"
  };

  function renderPortfolio(data) {
    const grid = document.querySelector('#photo .projects-grid');
    if (!grid || !data || !Array.isArray(data.albums)) return;

    grid.innerHTML = ''; // Clear the hardcoded cards

    const albumOrder = ["City", "Natural", "Campus", "Culture", "Animal", "Aerial Photography"];
    const sortedAlbums = data.albums.slice().sort((a, b) => {
      const indexA = albumOrder.indexOf(a.name);
      const indexB = albumOrder.indexOf(b.name);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });

    const frag = document.createDocumentFragment();

    sortedAlbums.forEach(album => {
      const name = album.name || '未命名相册';
      const displayName = nameMap[name] || name;
      const href = name === 'City' ? 'photo-city.html' : `photo-album.html?album=${encodeURIComponent(name)}`;

      let thumb = '';
      if (album.name === 'City') {
        thumb = 'Photo Portfolio/City/horizontal/22.jpg';
      } else if (album.name === 'Natural') {
        thumb = 'Photo Portfolio/Natural/006.jpg';
      } else if (album.name === 'Campus') {
        thumb = 'Photo Portfolio/Campus/002.jpg';
      } else if (album.thumbs && album.thumbs.horizontal && album.thumbs.horizontal.length > 0) {
        thumb = album.thumbs.horizontal[0];
      } else if (album.images && album.images.horizontal && album.images.horizontal.length > 0) {
        thumb = album.images.horizontal[0];
      } else if (album.images && Array.isArray(album.images) && album.images.length > 0) {
        thumb = album.images[0];
      }

      const art = document.createElement('article');
      art.className = 'card project';
      art.tabIndex = 0;

      const thumbDiv = document.createElement('div');
      thumbDiv.className = 'thumb';
      thumbDiv.setAttribute('role', 'img');
      thumbDiv.setAttribute('aria-label', displayName);
      if (thumb) {
        thumbDiv.style.backgroundImage = `url('${thumb}')`;
        thumbDiv.style.backgroundSize = 'cover';
        thumbDiv.style.backgroundPosition = 'center';
      }

      const body = document.createElement('div');
      body.className = 'card-body';
      body.innerHTML = `<h3 class="card-title">${displayName}</h3>`;

      const stretched = document.createElement('a');
      stretched.className = 'stretched';
      stretched.href = href;
      stretched.setAttribute('aria-hidden', 'true');
      stretched.tabIndex = -1;

      art.appendChild(thumbDiv);
      art.appendChild(body);
      art.appendChild(stretched);
      frag.appendChild(art);
    });

    grid.appendChild(frag);

    // Apply animations to the newly added cards
    try {
      const cards = grid.querySelectorAll('.project');
      if (!('IntersectionObserver' in window)) {
        cards.forEach(c => c.classList.add('is-in'));
      } else {
        const io = new IntersectionObserver(entries => {
          entries.forEach(e => {
            if (e.isIntersecting) {
              e.target.classList.add('is-in');
              io.unobserve(e.target);
            }
          })
        }, {
          threshold: .12
        });
        cards.forEach(c => io.observe(c));
      }
      // Add 3D hover effect
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!reduce) {
        cards.forEach(card => {
          const max = 6;
          let raf = null;
          let onMove;

          function attach() {
            onMove = (e) => {
              const r = card.getBoundingClientRect();
              const x = ((e.clientX - r.left) / r.width) - .5;
              const y = ((e.clientY - r.top) / r.height) - .5;
              const rx = (y * -max).toFixed(2);
              const ry = (x * max).toFixed(2);
              if (raf) cancelAnimationFrame(raf);
              raf = requestAnimationFrame(() => {
                card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-2px)`;
              });
            };
            card.addEventListener('pointermove', onMove);
          }

          function detach() {
            if (onMove) {
              card.removeEventListener('pointermove', onMove);
              onMove = null;
            }
            card.style.transform = '';
          }
          card.addEventListener('pointerenter', attach);
          card.addEventListener('pointerleave', detach);
        });
      }
    } catch (e) { /* ignore */ }
  }

  function tryLoadJS() {
    return new Promise((resolve) => {
      if (window.photoPortfolio) {
        resolve(window.photoPortfolio);
        return;
      }
      const s = document.createElement('script');
      s.src = 'photo-portfolio.js';
      s.onload = () => resolve(window.photoPortfolio || null);
      s.onerror = () => resolve(null);
      document.head.appendChild(s);
    });
  }

  (async () => {
    const data = await tryLoadJS();
    if (data) {
      renderPortfolio(data);
    }
  })();
})();