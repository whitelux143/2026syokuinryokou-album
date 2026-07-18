/* =====================================================
   思い出アルバム 本体ロジック
   写真データ(album-data.js)を読み、ページを自動構成します。
   写真の追加・削除は album-data.js の更新だけで反映されます。
   ===================================================== */
(function(){
"use strict";

var DIR = "photos/";

/* ---------- 当日の行程 ---------- */
var TIMELINE = [
  {t:"7:35",  icon:"🚉", name:"岐阜羽島駅 集合",        desc:"新幹線改札前に十人集合", move:false},
  {t:"7:50",  icon:"🚄", name:"ひかりで大阪へ",          desc:"新大阪 8:42着",          move:true},
  {t:"8:58",  icon:"🚇", name:"御堂筋線でなんばへ",      desc:"なんば 9:15着",          move:true},
  {t:"10:00", icon:"🎭", name:"なんばグランド花月",      desc:"本公演を観覧(〜12:00)",  move:false},
  {t:"12:30", icon:"🥟", name:"昼食 551蓬莱 パンチャン店", desc:"豚まんと中華のコース(〜14:00)", move:false},
  {t:"14:00", icon:"🚕", name:"タクシーで新世界へ",      desc:"3台に分かれて移動",      move:true},
  {t:"14:10", icon:"🗼", name:"通天閣 展望台",           desc:"楽しすぎて予定を1時間オーバー!(〜15:45頃)", move:false},
  {t:"15:50頃", icon:"🏮", name:"新世界を通り抜け",       desc:"ジャンジャン横丁を抜けて動物園前駅へ", move:false},
  {t:"16:05頃", icon:"🚇", name:"御堂筋線で新大阪へ",     desc:"動物園前から直通・16:35頃着", move:true},
  {t:"16:40", icon:"👋", name:"新大阪駅にて現地解散",   desc:"おつかれさまでした・それぞれの帰路へ", move:false}
];

/* ---------- 表示順の点数付け ----------
   全員写り > ベスト > 笑顔 > 通常 > 見切れ・ブレ  */
function score(p){
  var s = 0;
  if(p.group) s += 40;
  if(p.best)  s += 30;
  if(p.smile) s += 15;
  if(p.low)   s -= 50;
  return s;
}
function visible(list){ return list.filter(function(p){ return !p.hide; }); }

var ALL = visible(typeof PHOTOS !== "undefined" ? PHOTOS : []);
ALL.sort(function(a,b){ return score(b) - score(a); });

/* カテゴリごとに振り分け */
var byCat = {};
ALL.forEach(function(p){
  if(p.coverOnly) return;  /* 表紙専用写真は章に出さない */
  var k = (p.cat && CATEGORIES.some(function(c){return c.key===p.cat;})) ? p.cat : "other";
  (byCat[k] = byCat[k] || []).push(p);
});

/* ---------- DOM ヘルパ ---------- */
function el(tag, cls, html){
  var e = document.createElement(tag);
  if(cls) e.className = cls;
  if(html != null) e.innerHTML = html;
  return e;
}
function esc(s){
  return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){
    return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
  });
}

/* ---------- 写真マウント生成 ---------- */
var TILTS = [-2.2, 1.6, -1, 2.4, -1.8, 1.2];
var mountCount = 0;

function makeMount(p, wide){
  var b = el("button", "photo-mount" + (wide ? " wide" : "") + (p.full ? " full" : ""));
  b.style.setProperty("--tilt", TILTS[mountCount++ % TILTS.length] + "deg");
  b.setAttribute("aria-label", p.caption || "写真を拡大表示");
  if(p.type === "video"){
    var th = el("div", "vid-thumb");
    var img = el("img");
    img.loading = "lazy"; img.decoding = "async";
    img.src = DIR + (p.poster || p.src);
    img.alt = p.caption || "動画";
    th.appendChild(img);
    th.appendChild(el("div", "play-badge", "<span>▶</span>"));
    th.appendChild(el("span", "vid-tag", "動画"));
    b.appendChild(th);
  }else{
    var im = el("img");
    im.loading = "lazy"; im.decoding = "async";
    im.src = DIR + p.src;
    im.alt = p.caption || "旅の写真";
    if(p.pos) im.style.objectPosition = p.pos;
    b.appendChild(im);
  }
  if(p.caption) b.appendChild(el("span", "photo-cap", esc(p.caption)));
  b.addEventListener("click", function(){ openLightbox(p); });
  return b;
}

/* ---------- タイムライン描画 ---------- */
(function renderTimeline(){
  var ol = document.getElementById("timelineList");
  TIMELINE.forEach(function(t){
    var li = el("li", "tl-item" + (t.move ? " mode-move" : ""));
    li.innerHTML =
      '<span class="tl-time">' + t.t + '</span>' +
      '<span class="tl-dot"></span>' +
      '<div class="tl-name"><span class="tl-icon">' + t.icon + '</span>' + esc(t.name) + '</div>' +
      '<div class="tl-desc">' + esc(t.desc) + '</div>';
    ol.appendChild(li);
  });
})();

/* ---------- スポットセクション描画 ---------- */
(function renderSpots(){
  var wrap = document.getElementById("spots");
  var num = ["其の一","其の二","其の三","其の四","其の五","其の六","其の七","其の八","其の九"];
  var i = 0;
  CATEGORIES.forEach(function(c){
    var list = byCat[c.key];
    if(!list || !list.length) return;         /* 写真の無い場面は自動で非表示 */
    /* seq(時系列番号)を持つ写真はその順に、無い写真は優先度順のまま後ろへ */
    list = list.slice().sort(function(a,b){
      var sa = (a.seq != null), sb = (b.seq != null);
      if(sa && sb) return a.seq - b.seq;
      if(sa) return -1;
      if(sb) return 1;
      return 0;
    });
    var sec = el("section", "section spot torn-top");
    sec.id = "spot-" + c.key;
    var head = el("div", "spot-head");
    head.innerHTML =
      (c.time ? '<span class="spot-time">' + esc(c.time) + '</span>' : "") +
      '<h2 class="spot-title">' + esc(c.label) + '</h2>' +
      (c.note ? '<p class="spot-note">' + esc(c.note) + '</p>' : "") +
      '<span class="spot-stamp">' + esc(c.stamp) + '<br><small style="font-size:.55em;letter-spacing:.05em">26.7.12</small></span>';
    sec.appendChild(head);
    var g = el("div", "gallery");
    list.forEach(function(p, idx){
      /* 先頭の1枚(その場面の代表)は大きく表示 */
      g.appendChild(makeMount(p, idx === 0));
    });
    sec.appendChild(g);
    wrap.appendChild(sec);
    i++;
  });
})();

/* ---------- 表紙・エンディングの集合写真 ---------- */
(function renderCoverEnding(){
  var groups = ALL.filter(function(p){ return p.group && p.type !== "video"; });
  var coverPick = ALL.filter(function(p){ return p.cover && p.type !== "video"; })[0] || groups[0];
  if(!coverPick) return;
  var endPick = ALL.filter(function(p){ return p.ending && p.type !== "video"; })[0]
             || groups.filter(function(p){ return p !== coverPick; })[0] || coverPick;
  document.getElementById("coverPhotoFrame").appendChild(makeMount(coverPick, false));
  document.getElementById("endingPhoto").appendChild(makeMount(endPick, false));
})();

/* ---------- ベストショット ---------- */
(function renderBest(){
  var bests = ALL.filter(function(p){ return p.best && p.type !== "video"; });
  if(!bests.length) return;
  document.getElementById("bestSection").hidden = false;
  var list = document.getElementById("bestList");
  var item = el("div", "best-item");
  item.appendChild(el("span", "best-ribbon", "ベストショット"));
  item.appendChild(makeMount(bests[0], true));
  list.appendChild(item);
})();

/* ---------- 空状態 / スライドショー表示切替 ---------- */
if(ALL.length === 0){
  document.getElementById("emptyNote").hidden = false;
}else if(ALL.some(function(p){ return p.type !== "video"; })){
  document.getElementById("slideshowSection").hidden = false;
}

/* ---------- 思い出ムービー ---------- */
(function renderMovie(){
  if(typeof MOVIE === "undefined" || !MOVIE.url) return;
  var sec = document.getElementById("movieSection");
  var thumb = document.getElementById("movieThumb");
  sec.hidden = false;
  var isPreview = (MOVIE.url === "preview");
  var id = null;
  var m = MOVIE.url.match(/(?:youtu\.be\/|[?&]v=|shorts\/|live\/|embed\/)([\w-]{11})/);
  if(m) id = m[1];
  if(id){
    var img = document.createElement("img");
    img.loading = "lazy"; img.decoding = "async";
    img.alt = "思い出ムービーのサムネイル";
    img.src = "https://img.youtube.com/vi/" + id + "/hqdefault.jpg";
    /* 高解像度サムネイルがあれば差し替え */
    var hi = new Image();
    hi.onload = function(){ if(hi.naturalWidth > 120) img.src = hi.src; };
    hi.src = "https://img.youtube.com/vi/" + id + "/maxresdefault.jpg";
    thumb.appendChild(img);
  }else{
    var ph = document.createElement("span");
    ph.className = "thumb-placeholder";
    ph.textContent = isPreview ? "上映準備中" : "MOVIE";
    thumb.appendChild(ph);
  }
  document.getElementById("movieFrame").addEventListener("click", function(){
    if(isPreview) return;
    window.open(MOVIE.url, "_blank", "noopener");
  });
})();

/* ---------- スクロール出現アニメ ---------- */
(function reveal(){
  if(!("IntersectionObserver" in window)){
    document.querySelectorAll(".photo-mount,.tl-item,.spot").forEach(function(n){ n.classList.add("shown"); });
    return;
  }
  var io = new IntersectionObserver(function(es){
    es.forEach(function(e){
      if(e.isIntersecting){ e.target.classList.add("shown"); io.unobserve(e.target); }
    });
  }, {rootMargin:"0px 0px -8% 0px"});
  document.querySelectorAll(".photo-mount,.tl-item,.spot").forEach(function(n){ io.observe(n); });
})();

/* =====================================================
   ライトボックス(全画面・スワイプ・ピンチ)
   ===================================================== */
var lb = document.getElementById("lightbox");
var lbStage = document.getElementById("lbStage");
var lbCaption = document.getElementById("lbCaption");
var lbCount = document.getElementById("lbCount");
var lbIndex = 0;
var lbList = ALL;

function openLightbox(p){
  lbIndex = lbList.indexOf(p);
  if(lbIndex < 0) lbIndex = 0;
  lb.hidden = false;
  document.body.style.overflow = "hidden";
  showLb();
}
function closeLightbox(){
  lb.hidden = true;
  lbStage.innerHTML = "";
  document.body.style.overflow = "";
}
function showLb(){
  var p = lbList[lbIndex];
  lbStage.innerHTML = "";
  resetZoom();
  var node;
  if(p.type === "video"){
    node = document.createElement("video");
    node.controls = true;
    node.playsInline = true;
    node.setAttribute("playsinline", "");
    node.preload = "metadata";
    if(p.poster) node.poster = DIR + p.poster;
    if(p.src.indexOf("data:") === 0){
      /* プレビュー(埋め込み動画)用: iOSで確実に再生できる形式へ変換 */
      fetch(p.src).then(function(r){ return r.blob(); }).then(function(b){
        node.src = URL.createObjectURL(b);
      });
    }else{
      node.src = DIR + p.src;
    }
  }else{
    node = document.createElement("img");
    node.src = DIR + p.src;
    node.alt = p.caption || "";
    node.draggable = false;
  }
  lbStage.appendChild(node);
  lbCaption.textContent = p.caption || "";
  lbCount.textContent = (lbIndex + 1) + " / " + lbList.length;
}
document.getElementById("lbClose").addEventListener("click", closeLightbox);
lb.addEventListener("click", function(e){ if(e.target === lb) closeLightbox(); });

/* --- タッチ操作: スワイプ + ピンチ --- */
var scale = 1, tx = 0, ty = 0;
var startDist = 0, startScale = 1;
var startX = 0, startY = 0, startTx = 0, startTy = 0;
var swiping = false, lastTap = 0;

function target(){ return lbStage.firstElementChild; }
function applyT(){
  var n = target();
  if(n && n.tagName === "IMG"){
    n.style.transform = "translate(" + tx + "px," + ty + "px) scale(" + scale + ")";
  }
}
function resetZoom(){ scale = 1; tx = 0; ty = 0; applyT(); }
function dist(t){ var dx=t[0].clientX-t[1].clientX, dy=t[0].clientY-t[1].clientY; return Math.hypot(dx,dy); }

lbStage.addEventListener("touchstart", function(e){
  var n = target();
  if(!n || n.tagName === "VIDEO") return;
  if(e.touches.length === 2){
    startDist = dist(e.touches);
    startScale = scale;
    swiping = false;
  }else if(e.touches.length === 1){
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    startTx = tx; startTy = ty;
    swiping = (scale === 1);
    /* ダブルタップで拡大/戻す */
    var now = Date.now();
    if(now - lastTap < 300){
      if(scale > 1){ resetZoom(); } else { scale = 2.2; applyT(); }
      swiping = false;
    }
    lastTap = now;
  }
}, {passive:true});

lbStage.addEventListener("touchmove", function(e){
  var n = target();
  if(!n || n.tagName === "VIDEO") return;
  if(e.touches.length === 2){
    e.preventDefault();
    scale = Math.min(5, Math.max(1, startScale * dist(e.touches) / startDist));
    if(scale === 1){ tx = 0; ty = 0; }
    applyT();
  }else if(e.touches.length === 1 && scale > 1){
    e.preventDefault();
    tx = startTx + (e.touches[0].clientX - startX);
    ty = startTy + (e.touches[0].clientY - startY);
    applyT();
  }
}, {passive:false});

lbStage.addEventListener("touchend", function(e){
  if(!swiping || e.changedTouches.length !== 1) return;
  var dx = e.changedTouches[0].clientX - startX;
  var dy = e.changedTouches[0].clientY - startY;
  if(Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.4){
    lbIndex = (lbIndex + (dx < 0 ? 1 : -1) + lbList.length) % lbList.length;
    showLb();
  }else if(dy > 90 && Math.abs(dy) > Math.abs(dx)){
    closeLightbox();  /* 下スワイプで閉じる */
  }
}, {passive:true});

/* =====================================================
   スライドショー(おすすめ写真のみを上映)
   ===================================================== */
var show = document.getElementById("show");
var showStage = document.getElementById("showStage");
var showCaption = document.getElementById("showCaption");
var showTimer = null, showIdx = 0;
var showList = ALL.filter(function(p){ return p.best && p.type !== "video"; });
if(!showList.length) showList = ALL.filter(function(p){ return p.type !== "video"; }).slice(0, 5);

document.getElementById("slideshowOpen").addEventListener("click", function(){
  if(!showList.length) return;
  show.hidden = false;
  document.body.style.overflow = "hidden";
  showIdx = -1;
  nextSlide();
  showTimer = setInterval(nextSlide, 4500);
});
function nextSlide(){
  showIdx = (showIdx + 1) % showList.length;
  var p = showList[showIdx];
  var img = document.createElement("img");
  img.src = DIR + p.src;
  img.alt = "";
  showStage.appendChild(img);
  requestAnimationFrame(function(){ requestAnimationFrame(function(){ img.classList.add("on"); }); });
  while(showStage.children.length > 2) showStage.removeChild(showStage.firstChild);
  showCaption.textContent = p.caption || "";
}
document.getElementById("showClose").addEventListener("click", function(){
  show.hidden = true;
  showStage.innerHTML = "";
  document.body.style.overflow = "";
  clearInterval(showTimer);
});

})();
