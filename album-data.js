/* =====================================================
   思い出アルバム データファイル
   写真・動画を追加するときは、このファイルだけを
   AI(Claude)が更新します。index.html等は変更不要です。

   各項目の意味:
     src     : photos/ フォルダ内のファイル名
     type    : "img" または "video"
     poster  : 動画のサムネイル画像(AIが生成)
     cat     : 分類キー(下のCATEGORIES参照)
     best    : ベストショット(大きく表示)
     group   : 全員が写っている(優先表示)
     smile   : 笑顔(優先度アップ)
     low     : 見切れ・ピンボケ等(優先度ダウン)
     hide    : 除外候補(表示しない)
     caption : 手書き風コメント(任意)
   ===================================================== */

const CATEGORIES = [
  { key: "shinkansen", label: "新幹線・出発",       stamp: "出発",   time: "7:35-8:42",   note: "岐阜羽島から ひかりで新大阪へ" },
  { key: "metro",      label: "御堂筋線で移動",     stamp: "地下鉄", time: "8:58",        note: "新大阪からなんばへ" },
  { key: "ngk",        label: "なんばグランド花月", stamp: "花月",   time: "10:00-12:00", note: "本場の笑いを満喫" },
  { key: "lunch",      label: "昼食・551蓬莱",      stamp: "蓬莱",   time: "12:30-14:00", note: "パンチャン店で豚まんと中華の宴" },
  { key: "taxi",       label: "タクシー移動",       stamp: "移動",   time: "14:00",       note: "3台に分かれて新世界へ" },
  { key: "tsutenkaku", label: "通天閣",             stamp: "通天閣", time: "14:10-15:45頃", note: "楽しすぎて予定を1時間オーバー" },
  { key: "shinsekai",  label: "新世界・街並み",     stamp: "新世界", time: "15:50頃",     note: "ジャンジャン横丁を通り抜けて駅へ" },
  { key: "kaeri",      label: "帰り道",             stamp: "帰路",   time: "",            note: "新大阪駅で現地解散・それぞれの帰路へ" },
  { key: "other",      label: "未分類",             stamp: "旅",     time: "",            note: "" }
];

/* 写真・動画リスト(AIが解析して自動追記します) */
const PHOTOS = [

  /* --- エンディング用イラスト(章には出さない) --- */
  { src: "ed001.jpg", type: "img", ending: true, coverOnly: true, full: true,
    caption: "ビリケンさんと、また来る日まで" },

  /* --- 表紙用イラスト(章には出さず、表紙とスライドショーのみ) --- */
  { src: "cv001.jpg", type: "img", cover: true, coverOnly: true, full: true,
    caption: "2026年 人事労務課職員旅行・大阪満喫ツアー" },

  /* --- 2026.7.14追加分(7回目): 行きの地下鉄・帰りの新幹線 --- */

  { src: "m002.jpg", type: "img", cat: "metro", smile: true, seq: 1, pos: "50% 15%",
    caption: "御堂筋線の車内でパチリ" },
  { src: "k002.jpg", type: "img", cat: "kaeri", smile: true, seq: 2,
    caption: "帰りの新幹線で、おつかれさまの一杯" },

  /* --- 2026.7.14追加分(6回目): 通天閣出発〜帰路へ --- */

  { src: "sk001.jpg", type: "img", cat: "shinsekai", smile: true,
    caption: "通天閣を出発、新世界の街を通り抜けて駅へ" },

  /* --- 2026.7.14追加分(5回目): 通天閣の観光 --- */

  /* ビリケンさんと全員記念撮影 */
  { src: "tk008.jpg", type: "img", cat: "tsutenkaku", seq: 8, group: true, best: true, smile: true,
    caption: "ビリケンさんと全員で記念撮影!" },

  /* 顔ハメパネル */
  { src: "tk004.jpg", type: "img", cat: "tsutenkaku", seq: 4, best: true, smile: true,
    caption: "ビリケンさんに変身!? 顔ハメで大盛り上がり" },

  /* 展望・館内あれこれ */
  { src: "tk005.jpg", type: "img", cat: "tsutenkaku", seq: 5, smile: true,
    caption: "空中回廊でハイポーズ!" },
  { src: "tk006.jpg", type: "img", cat: "tsutenkaku", seq: 6, smile: true,
    caption: "プリッツとポッキーになってみました" },
  { src: "tk007.jpg", type: "img", cat: "tsutenkaku", seq: 7, smile: true,
    caption: "巨大ポッキー、2人で引いて赤い紐で結ばれよう!" },
  { src: "tk003.jpg", type: "img", cat: "tsutenkaku", seq: 3, smile: true,
    caption: "ビリケンさんの大レリーフと" },
  { src: "tk002.jpg", type: "img", cat: "tsutenkaku", seq: 2,
    caption: "レトロな館内にわくわく" },

  /* --- 2026.7.14追加分(4回目): タクシー移動〜通天閣へ --- */

  { src: "tx001.jpg", type: "img", cat: "taxi", smile: true,
    caption: "タクシーに分乗して新世界へ" },
  { src: "tk001.jpg", type: "img", cat: "tsutenkaku", seq: 1,
    caption: "見えてきた、通天閣!" },

  /* --- 2026.7.14追加分(3回目): 昼食・551蓬莱 --- */

  /* 店頭セルフィー(ほぼ全員) */
  { src: "l003.jpg", type: "img", cat: "lunch", group: true, smile: true,
    caption: "551蓬莱に到着、いざ入店!" },

  /* 店頭でジャンプ! */
  { src: "l002.jpg", type: "img", cat: "lunch", best: true, smile: true,
    caption: "551の看板の下で気合のジャンプ!" },

  /* テーブルごとの乾杯 */
  { src: "l004.jpg", type: "img", cat: "lunch", smile: true,
    caption: "こちらのテーブル、まずは乾杯!" },
  { src: "l005.jpg", type: "img", cat: "lunch", smile: true,
    caption: "おとなりのテーブルも乾杯!" },

  /* 料理 */
  { src: "l006.jpg", type: "img", cat: "lunch",
    caption: "フカヒレスープに焼売、中華のフルコース" },

  /* --- 2026.7.14追加分(2回目): 御堂筋線〜なんばグランド花月 --- */

  /* なんばグランド花月・記念撮影(10名全員) */
  { src: "g002.jpg", type: "img", cat: "ngk", seq: 2, group: true, best: true, smile: true,
    caption: "なんばグランド花月の前で記念撮影!" },
  { src: "g003.jpg", type: "img", cat: "ngk", seq: 3, group: true, smile: true,
    caption: "はいチーズ、もう一枚" },
  { src: "g004.jpg", type: "img", cat: "ngk", seq: 4, group: true, smile: true,
    caption: "全員そろって、いい笑顔" },

  /* 御堂筋線の車内 */
  { src: "m001.jpg", type: "img", cat: "metro", seq: 2,
    caption: "朝の御堂筋線でなんばへ" },

  /* 開演前の一杯 */
  { src: "n001.jpg", type: "img", cat: "ngk", seq: 1, smile: true,
    caption: "開演前に男性陣は景気づけの一杯!" },

  /* --- 2026.7.14追加分: 岐阜羽島 集合〜新幹線乗車 --- */

  /* 岐阜羽島駅・新幹線のりば前での全員セルフィー(10名) */
  { src: "g001.jpg", type: "img", cat: "shinkansen", seq: 1, group: true, best: true, smile: true,
    caption: "岐阜羽島駅・新幹線のりば前で全員集合!" },

  /* 新幹線車内・女性陣 */
  { src: "s001.jpg", type: "img", cat: "shinkansen", seq: 2, smile: true,
    caption: "車内でピース! 旅のはじまり" },
  { src: "s002.jpg", type: "img", cat: "shinkansen", seq: 3, smile: true,
    caption: "女性チーム、笑顔で出発進行" },

  /* 新幹線車内・男性陣 */
  { src: "s003.jpg", type: "img", cat: "shinkansen", seq: 4, smile: true,
    caption: "男性チームは朝から乾杯の準備?" },

];

/* =====================================================
   思い出ムービー(YouTube限定公開)
   url に共有リンクを入れると、最終ページに
   サムネイル付きの上映セクションが自動で現れます。
   空("")のままなら、セクションごと非表示になります。
   例: url: "https://youtu.be/XXXXXXXXXXX"
   ===================================================== */
const MOVIE = {
  url: "https://youtu.be/6CwUvbmUpNc"
};
