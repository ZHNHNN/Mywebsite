// ���� �� ��Ӱ��Ʒ�������ţ������������У�����̶��߶����У��빤ҵ��Ƭ���һ�£�
(function(){
  // ��·����Ӣ�� horizontal ���ȣ����Ѹ���������μ��ݴ�д Horizontal
  const baseCandidates = [
    'Photo Portfolio/City/horizontal',
    'Photo Portfolio/City/Horizontal'
  ];
  const extCandidates = ['.jpg', '.JPG', '.jpeg', '.JPEG'];
  let base = baseCandidates[0];
  let ext = '.jpg';

  const fullIds = [1, 2];
  const restIds = Array.from({length: 35-2}, (_, i) => i + 3); // 3..35���ɰ������

  const grid = document.getElementById('cityGrid');
  if(!grid) return;

  function testLoad(url){
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  }

  async function resolveBaseAndExt(){
    for(const b of baseCandidates){
      for(const e of extCandidates){
        const raw = `${b}/1${e}`;
        if(await testLoad(raw)) return {b, e};
        const enc = encodeURI(raw);
        if(await testLoad(enc)) return {b, e};
      }
    }
    return {b: baseCandidates[0], e: '.jpg'};
  }

  async function createCard(id, wide){
    const art = document.createElement('article');
    art.className = 'card project' + (wide ? ' city-wide' : '');
    const thumb = document.createElement('div');
    thumb.className = 'thumb';
    const raw = `${base}/${id}${ext}`;
    let url = raw;
    if(!await testLoad(raw)){
      const enc = encodeURI(raw);
      if(await testLoad(enc)) url = enc;
    }
    thumb.style.background = `#0b0d10 url('${url}') center / cover no-repeat`;
    art.appendChild(thumb);
    return art;
  }

  (async () => {
    const resolved = await resolveBaseAndExt();
    base = resolved.b; ext = resolved.e;

    const frag = document.createDocumentFragment();
    for(const id of fullIds){ frag.appendChild(await createCard(id, true)); }
    for(const id of restIds){ frag.appendChild(await createCard(id, false)); }
    grid.appendChild(frag);

    const head = document.querySelector('.section-head');
    if(head){
      const note = document.createElement('p');
      note.className = 'section-sub';
      note.style.fontSize = '12px';
      note.textContent = `Using: ${base}/[n]${ext}`;
      head.appendChild(note);
    }

    if(!grid.querySelector('.project')){
      const tip = document.createElement('p');
      tip.className = 'section-sub';
      tip.style.color = 'var(--text-dim)';
      tip.style.padding = '0 24px';
      tip.textContent = `δ�ܼ���ͼƬ����ȷ��·����${base}/[n]${ext}�������� 1${ext}, 2${ext} ����`;
      head?.appendChild(tip);
    }
  })();
})();
