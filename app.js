const $ = selector => document.querySelector(selector);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const names={bezos:{name:'杰夫·贝索斯',en:'Jeff Bezos',company:'AMAZON',theme:'从长期主义，到文明的远方。',photo:'https://upload.wikimedia.org/wikipedia/commons/6/6c/Jeff_Bezos_at_Amazon_Spheres_Grand_Opening_in_Seattle_-_2018_%2839074799225%29_%28cropped%29.jpg',credit:'Seattle City Council · CC BY 2.0',creditUrl:'https://commons.wikimedia.org/wiki/File:Jeff_Bezos_at_Amazon_Spheres_Grand_Opening_in_Seattle_-_2018_(39074799225)_(cropped).jpg'},musk:{name:'埃隆·马斯克',en:'Elon Musk',company:'SPACEX / TESLA',theme:'用科学追问世界，用科幻想象未来。',photo:'https://upload.wikimedia.org/wikipedia/commons/3/34/Elon_Musk_Royal_Society_%28crop2%29.jpg',credit:'Debbie Rowe / The Royal Society · CC BY-SA 3.0',creditUrl:'https://commons.wikimedia.org/wiki/File:Elon_Musk_Royal_Society_(crop2).jpg'},zuckerberg:{name:'马克·扎克伯格',en:'Mark Zuckerberg',company:'META',theme:'理解人与社会，理解连接如何发生。',photo:'https://upload.wikimedia.org/wikipedia/commons/1/18/Mark_Zuckerberg_F8_2019_Keynote_%2832830578717%29_%28cropped%29.jpg',credit:'Anthony Quintano · CC BY 2.0',creditUrl:'https://commons.wikimedia.org/wiki/File:Mark_Zuckerberg_F8_2019_Keynote_(32830578717)_(cropped).jpg'},jobs:{name:'史蒂夫·乔布斯',en:'Steve Jobs',company:'APPLE / PIXAR',theme:'在人文与科技的交叉口，寻找另一种可能。',photo:'https://upload.wikimedia.org/wikipedia/commons/d/dc/Steve_Jobs_Headshot_2010-CROP_%28cropped_2%29.jpg',credit:'Matthew Yohe · CC BY-SA 3.0',creditUrl:'https://commons.wikimedia.org/wiki/File:Steve_Jobs_Headshot_2010-CROP_(cropped_2).jpg'},gates:{name:'比尔·盖茨',en:'Bill Gates',company:'MICROSOFT',theme:'用阅读校准直觉，用事实认识世界。',photo:'https://upload.wikimedia.org/wikipedia/commons/d/d9/Bill_gates_portrait.jpg',credit:'Ricardo Stuckert / Agência Brasil · Attribution',creditUrl:'https://commons.wikimedia.org/wiki/File:Bill_gates_portrait.jpg'}};
const people = ['bezos', 'musk', 'zuckerberg', 'jobs', 'gates'].map(id => ({
  ...DATA.find(person => person.id === id), ...names[id],
  shortName: { bezos: '贝索斯', musk: '马斯克', zuckerberg: '扎克伯格', jobs: '乔布斯', gates: '盖茨' }[id]
}));
const labels = { spoken: '本人原话', written: '本人撰文', reported: '他人转述' };
const room = $('#reading-room');
const peopleGrid = $('#people-grid');
const infoDialog = $('#info-dialog');
const videoDialog = $('#video-dialog');

function personFromHash() {
  const id = location.hash.slice(1);
  return people.some(person => person.id === id) ? id : 'jobs';
}

let selected = personFromHash();
let filter = 'all';
let query = '';
let expanded = false;

function renderPeople() {
  peopleGrid.innerHTML = people.map(person => `
    <button class="person" type="button" data-person="${person.id}" aria-expanded="false"
      aria-controls="reading-room" aria-label="${person.name}">
      <span class="portrait">
        <img src="${person.photo}" alt="" referrerpolicy="no-referrer" width="200" height="140">
      </span>
      <span class="person-label"><span>${person.shortName}</span><span class="person-indicator" aria-hidden="true"></span></span>
    </button>`).join('');
  $('#archive-count').textContent = `${people.reduce((total, person) => total + person.books.length, 0)} 个阅读条目`;
}

function videoCard(video) {
  return `<article class="video">
    <button class="video-preview" data-video="${esc(video.id)}" aria-label="播放：${esc(video.title)}">
      <img loading="lazy" src="https://i.ytimg.com/vi/${esc(video.id)}/hqdefault.jpg" alt="">
      <span class="play" aria-hidden="true"></span>
    </button>
    <h4>${esc(video.title)}</h4>
    <div class="video-meta">${esc(video.channel)} · ${esc(video.year)}</div>
    <p>${esc(video.note)}</p>
    <a class="quiet" href="https://www.youtube.com/watch?v=${esc(video.id)}" target="_blank" rel="noopener">在 YouTube 打开 <span aria-hidden="true">↗</span></a>
  </article>`;
}

function renderRoom() {
  for (const button of peopleGrid.querySelectorAll('.person')) {
    button.setAttribute('aria-expanded', String(button.dataset.person === selected));
  }
  const person = people.find(entry => entry.id === selected);
  if (!person) {
    room.innerHTML = '';
    return;
  }

  room.innerHTML = `<div class="room">
    <header class="room-header">
      <div><h2>${person.name}</h2><p>${person.en} <span>·</span> ${person.company}</p></div>
      <button type="button" class="jump quiet">看访谈 <span aria-hidden="true">↓</span></button>
    </header>
    <div class="room-body">
      <section class="books-column" aria-labelledby="book-heading">
        <div class="section-label"><h3 id="book-heading">阅读记录</h3><span id="result-count"></span></div>
        <div class="toolbar" aria-label="查找阅读记录">
          <div class="search-field"><span class="search-icon" aria-hidden="true"></span>
            <input type="search" id="search" placeholder="搜索书名或作者" aria-label="搜索书名或作者">
            <kbd aria-hidden="true">/</kbd>
          </div>
          <div class="filters" aria-label="来源类型">
            ${[['all', '全部'], ...Object.entries(labels)].map(([id, label]) => `<button type="button" data-filter="${id}" aria-pressed="${id === filter}">${label}</button>`).join('')}
          </div>
        </div>
        <div class="book-list" id="book-list"></div>
        <div id="more-container"></div>
        <p class="coverage">${esc(person.coverage)}</p>
      </section>
      <aside id="interviews" aria-labelledby="interview-heading" tabindex="-1">
        <div class="section-label"><h3 id="interview-heading">访谈与影像</h3><span>YouTube</span></div>
        ${person.videos.map(videoCard).join('')}
        <div class="source-list">
          <div class="section-label"><h3>相关出处</h3></div>
          ${person.links.map(link => `<a href="${esc(link.url)}" target="_blank" rel="noopener"><span>${esc(link.label)}</span><span aria-hidden="true">↗</span></a>`).join('')}
        </div>
      </aside>
    </div>
  </div>`;

  room.querySelector('.jump').addEventListener('click', () => {
    $('#interviews').focus({ preventScroll: true });
    $('#interviews').scrollIntoView({ block: 'start' });
  });
  $('#search').addEventListener('input', event => {
    query = event.target.value;
    expanded = false;
    renderBooks(person);
  });
  room.querySelector('.filters').addEventListener('click', event => {
    const button = event.target.closest('[data-filter]');
    if (!button) return;
    filter = button.dataset.filter;
    expanded = false;
    for (const option of room.querySelectorAll('[data-filter]')) {
      option.setAttribute('aria-pressed', String(option === button));
    }
    renderBooks(person);
  });
  renderBooks(person);
}

function bookCard(book) {
  const description = book.quote ? `“${esc(book.quote)}”` : esc(book.note.split('。')[0] + '。');
  return `<article class="book">
    <div class="book-top">
      <div><h4>${esc(book.title)}</h4><div class="book-byline">${esc(book.en)} · ${esc(book.author)}</div></div>
      <span class="category">${esc(book.category)}</span>
    </div>
    <p class="book-quote ${book.quote ? '' : 'paraphrase'}">${description}</p>
    <div class="book-actions">
      <details>
        <summary><span class="chevron" aria-hidden="true"></span>原文与语境</summary>
        ${book.original ? `<p class="original" lang="en">“${esc(book.original)}”</p>` : ''}
        <p>${esc(book.note)}</p>
        <p class="detail-source">${esc(book.source)}</p>
      </details>
      <div class="book-meta"><span>${labels[book.type]} · ${book.quote ? '节译' : '摘要'}</span>
        <a href="${esc(book.url)}" target="_blank" rel="noopener" aria-label="查看《${esc(book.title)}》出处">出处 <span aria-hidden="true">↗</span></a>
      </div>
    </div>
  </article>`;
}

function renderBooks(person) {
  const keyword = query.trim().toLowerCase();
  const matching = person.books.filter(book =>
    (filter === 'all' || book.type === filter) &&
    [book.title, book.en, book.author, book.category].join(' ').toLowerCase().includes(keyword)
  );
  const visible = expanded ? matching : matching.slice(0, 6);
  const list = $('#book-list');
  $('#result-count').textContent = `${matching.length} 条`;
  list.innerHTML = visible.map(bookCard).join('') ||
    '<p class="empty" role="status">没有匹配的条目。</p>';
  const more = $('#more-container');
  more.innerHTML = matching.length > 6 ? `<button class="show-more" aria-expanded="${expanded}" aria-controls="book-list">${expanded ? '收起书单 ↑' : `展开全部 ${matching.length} 条 ↓`}</button>` : '';
  more.querySelector('button')?.addEventListener('click', () => {
    expanded = !expanded;
    renderBooks(person);
    if (expanded) {
      const firstNewBook = list.children[6];
      firstNewBook.tabIndex = -1;
      firstNewBook.focus({ preventScroll: true });
      firstNewBook.scrollIntoView({ block: 'nearest' });
    } else {
      const expandButton = $('#more-container button');
      expandButton.focus({ preventScroll: true });
      expandButton.scrollIntoView({ block: 'nearest' });
    }
  });
}

function resetRoom(person) {
  selected = person;
  filter = 'all';
  query = '';
  expanded = false;
  renderRoom();
}

peopleGrid.addEventListener('click', event => {
  const button = event.target.closest('[data-person]');
  if (!button) return;
  const next = selected === button.dataset.person ? null : button.dataset.person;
  history.replaceState(null, '', next ? '#' + next : location.pathname + location.search);
  resetRoom(next);
});
window.addEventListener('hashchange', () => {
  if (people.some(person => person.id === location.hash.slice(1))) resetRoom(personFromHash());
});

document.addEventListener('keydown', event => {
  if (event.key !== '/' || event.altKey || event.ctrlKey || event.metaKey ||
      event.target.closest('input, textarea, [contenteditable], dialog') ||
      document.querySelector('dialog[open]')) return;
  const search = $('#search');
  if (search) {
    event.preventDefault();
    search.focus();
  }
});

room.addEventListener('click', event => {
  const button = event.target.closest('[data-video]');
  if (!button) return;
  const video = people.find(person => person.id === selected).videos.find(item => item.id === button.dataset.video);
  $('#video-content').innerHTML = `
    <iframe src="https://www.youtube-nocookie.com/embed/${esc(video.id)}?autoplay=1&rel=0"
      title="${esc(video.title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
    <div class="video-dialog-caption"><h2>${esc(video.title)}</h2>
      <a href="https://www.youtube.com/watch?v=${esc(video.id)}" target="_blank" rel="noopener">在 YouTube 打开 ↗</a>
    </div>`;
  videoDialog.showModal();
});

for (const dialog of [infoDialog, videoDialog]) {
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });
}
videoDialog.addEventListener('close', () => { $('#video-content').innerHTML = ''; });

function showInfo(html) {
  $('#info-content').innerHTML = html;
  infoDialog.showModal();
}

$('#about-button').addEventListener('click', () => showInfo(`
  <h2>收录说明</h2>
  <p>收录明确推荐、表达喜爱和有出处的阅读影响。引号内为短引文节译，展开可见英文原文和语境；其余为资料摘要。</p>
  <dl>
    <dt>本人原话</dt><dd>来自访谈、演讲或传记收录的采访原话。</dd>
    <dt>本人撰文</dt><dd>来自本人书评、推文或书面选书。</dd>
    <dt>他人转述</dt><dd>来自新闻、传记或二手材料，包括部分原文转录。</dd>
  </dl>
  <p>收录扎克伯格 2015 年年度书单的 23 本书及 Brad Stone 记载的贝索斯内部清单。其余材料为本次整理能追溯出处的记录。盖茨历年书评档案见其专栏。</p>
  <p>访谈及 Hacker News 讨论是延伸资料。逐书证据见每条阅读记录的出处。</p>`));

$('#credits-button').addEventListener('click', () => showInfo(`
  <h2>资料与图片署名</h2>
  <p>摘录与节译附在各条记录中。人物照片来自 Wikimedia Commons，页面以灰阶和裁切展示，许可见原图页面。</p>
  <ul>${people.map(person => `<li><a href="${person.creditUrl}" target="_blank" rel="noopener">${person.name} ↗</a> · ${person.credit}</li>`).join('')}</ul>
  <p>视频、缩略图和播放器由 YouTube 提供。</p>`));

renderPeople();
renderRoom();
