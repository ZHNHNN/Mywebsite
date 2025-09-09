// City portfolio: Horizontal/Vertical switch, thumbs preview, industrial-style lightbox
(function(){
  var hGrid = document.getElementById('cityGrid');
  var vGrid = document.getElementById('cityVerticalGrid');
  if(!hGrid) return;

  // toolbar buttons next to title
  var btnH = document.getElementById('btnH');
  var btnV = document.getElementById('btnV');

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

  function loadManifest(varName, file){
    return new Promise(function(resolve){
      if(window[varName]){ resolve(window[varName]); return; }
      var isHttp = /^https?:/i.test(location.protocol);
      var trySrcs = isHttp ? [file + '?v=' + (Date.now()%10000000), file] : [file];
      var idx = 0;
      function next(){
        if(idx >= trySrcs.length){ resolve(null); return; }
        var s = document.createElement('script'); s.src = trySrcs[idx++];
        s.onload = function(){ resolve(window[varName] || null); };
        s.onerror = function(){ s.remove(); next(); };
        document.head.appendChild(s);
      }
      next();
    });
  }

  // industrial-style lightbox (shared #lightbox in HTML)
  var lb = document.getElementById('lightbox');
  var lbImg = lb && lb.querySelector('.lb-img');
  var lbPrev = lb && lb.querySelector('.lb-prev');
  var lbNext = lb && lb.querySelector('.lb-next');
  var lbClose = lb && lb.querySelector('.lb-close');
  var lbCount = lb && lb.querySelector('.lb-count');
  var current = []; var idx = 0;
  function lbUpdate(){ if(lbCount) lbCount.textContent = (current.length? (String(idx+1)+' / '+String(current.length)) : ''); }
  function lbOpen(list, i){ if(!lb || !lbImg) return; current = list.slice(0); idx = Math.max(0, Math.min(i, current.length-1)); lbImg.src = current[idx]; lb.classList.add('show'); lb.setAttribute('aria-hidden','false'); lb.scrollTop = 0; lbUpdate(); }
  function lbPrevFn(){ if(idx>0){ idx--; lbImg.src = current[idx]; lb.scrollTop=0; lbUpdate(); } }
  function lbNextFn(){ if(idx<current.length-1){ idx++; lbImg.src = current[idx]; lb.scrollTop=0; lbUpdate(); } }
  function lbCloseFn(){ if(!lb) return; lb.classList.remove('show'); lb.setAttribute('aria-hidden','true'); if(lbImg) lbImg.src=''; current=[]; idx=0; }
  if(lb){
    if(lbPrev) lbPrev.addEventListener('click', lbPrevFn);
    if(lbNext) lbNext.addEventListener('click', lbNextFn);
    if(lbClose) lbClose.addEventListener('click', lbCloseFn);
    lb.addEventListener('click', function(e){ if(e.target===lb) lbCloseFn(); });
    window.addEventListener('keydown', function(e){ if(lb.classList && lb.classList.contains('show')){ if(e.key==='Escape') lbCloseFn(); if(e.key==='ArrowLeft') lbPrevFn(); if(e.key==='ArrowRight') lbNextFn(); } });
  }

  function bindClicks(grid){
    grid.addEventListener('click', function(e){
      var card = e.target.closest('.project'); if(!card) return;
      var full = card.getAttribute('data-full'); if(!full) return;
      var cards = Array.from(grid.querySelectorAll('.project'));
      var list = cards.map(function(c){ return c.getAttribute('data-full'); });
      var index = cards.indexOf(card);
      lbOpen(list, index);
    });
  }

  function createWide(url){
    var art = document.createElement('article'); art.className='card project city-wide';
    var frame = document.createElement('div'); frame.className='frame';
    var img = document.createElement('img'); img.loading='lazy'; img.decoding='async'; img.src = encodeURI(url); img.alt='Wide';
    frame.appendChild(img); art.appendChild(frame); art.setAttribute('data-full', encodeURI(url));
    return art;
  }
  function createThumb(url, thumbUrl){
    var art = document.createElement('article'); art.className='card project';
    var t = document.createElement('div'); t.className='thumb';
    t.style.background = "#0b0d10 url('" + encodeURI(thumbUrl||url) + "') center / cover no-repeat";
    art.appendChild(t); art.setAttribute('data-full', encodeURI(url));
    return art;
  }

  var mode = 'h';
  function applyMode(){
    var vHead = document.getElementById('vHead');
    if(mode==='h'){
      if(hGrid) hGrid.style.display='grid';
      if(vGrid) vGrid.style.display='none';
      if(vHead) vHead.style.display='none';
      if(btnH) btnH.setAttribute('aria-pressed','true');
      if(btnV) btnV.setAttribute('aria-pressed','false');
    }else{
      if(hGrid) hGrid.style.display='none';
      if(vGrid) vGrid.style.display='grid';
      if(vHead) vHead.style.display='block';
      if(btnH) btnH.setAttribute('aria-pressed','false');
      if(btnV) btnV.setAttribute('aria-pressed','true');
    }
  }
  if(btnH) btnH.addEventListener('click', function(){ mode='h'; applyMode(); });
  if(btnV) btnV.addEventListener('click', function(){ mode='v'; applyMode(); });

  // render horizontal
  loadManifest('cityHorizontal','city-horizontal.js').then(function(list){
    if(Array.isArray(list) && list.length){
      var sortedList = naturalSort(list, s => s.split('/').pop());
      var frag = document.createDocumentFragment();
      sortedList.forEach(function(url, i){
        var wide = i < 2; var thumb = url.replace('/horizontal/','/horizontal/thumbs/');
        var card = wide ? createWide(url) : createThumb(url, thumb);
        frag.appendChild(card);
      });
      hGrid.appendChild(frag);
      try{ hGrid.querySelectorAll('.project').forEach(function(c){ c.classList.add('is-in'); }); }catch(e){}
      bindClicks(hGrid);
      applyMode();
    }
  });

  // render vertical
  if(vGrid){
    loadManifest('cityVertical','city-vertical.js').then(function(list){
      if(Array.isArray(list) && list.length){
        var sortedList = naturalSort(list, s => s.split('/').pop());
        var vfrag = document.createDocumentFragment();
        sortedList.forEach(function(url){ var thumb = url.replace('/vertical/','/vertical/thumbs/'); vfrag.appendChild(createThumb(url, thumb)); });
        vGrid.appendChild(vfrag);
        try{ vGrid.querySelectorAll('.project').forEach(function(c){ c.classList.add('is-in'); }); }catch(e){}
        bindClicks(vGrid);
      }
    });
  }
})();

