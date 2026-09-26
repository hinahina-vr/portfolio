// Websites supplied by their creator; screenshots captured from the live sites.
// Copy and source notes: research/portfolio-wording/NOTES.md.
export const categories = {
  web: {label:'Web', projects:[
    {id:'gaia-senseware',title:'惑星の放課後',lines:['惑星の放課後'],subtitle:'GAIA SENSATION',medium:'Interactive narrative, open data',description:'地球の観測データを、光や波紋へと変換するインタラクティブ作品。登場人物たちとの出会いをたどりながら、数値だけでは捉えにくい地球の変化を、視覚と物語を通して体験する。',image:'./assets/gaia-senseware.png',url:'https://gaia-senseware.pages.dev/',scene:'kelp-current',japanese:true},
    {id:'glsl-showcase',title:'GLSL Effects Showcase',lines:['GLSL Effects','Showcase'],medium:'WebGL studies',description:'流体、粒子、光のふるまいを探るシェーダー作品集。コードがリアルタイムに像を描き出す。操作に反応する作品では、鑑賞者の動きも画面を構成する要素となる。',image:'./assets/glsl-showcase.png',url:'https://glsl-effects-showcase.pages.dev/',scene:'lilian-kaleido-loom'},
    {id:'chinameng',title:'一帯一旅 ～中国の街をめぐる旅の地図～',lines:['一帯一旅'],subtitle:'～中国の街をめぐる旅の地図～',subtitleLang:'ja',medium:'Interactive cartography',description:'中国の鉄道網、都市、世界遺産を重ねたインタラクティブな地図。旅の経路や訪れた場所の記録が加わることで、広い国土を俯瞰する地図が、一人ひとりの旅の軌跡へと変わっていく。',image:'./assets/chinameng.png',url:'https://chinameng.pages.dev/',scene:'lilian-kaleido-loom',japanese:true},
    {id:'quiz-pal',title:'Quiz Pal',lines:['Quiz Pal'],medium:'Browser-based learning application',description:'問題集と学習履歴を軸に構成した、ブラウザー上の学習環境。問題をつくり、書き直し、繰り返し解く。学びの積み重ねに応じて、教材そのものも変化していく。',image:'./assets/quiz-pal.png',url:'https://hinahina-vr.github.io/quiz-pal/',scene:'lilian-kaleido-loom'}
  ]},
  visual:{label:'Visual',projects:[
    {id:'lilian-loom',title:'Lilian Kaleido Loom',lines:['Lilian','Kaleido Loom'],medium:'Real-time fluid simulation',description:'流体の動きを鏡のように折り返し、糸を編んだような模様を生む作品。静かな織り目はポインターの動きに応じて密度を増し、操作の痕跡が流れの中へと運ばれていく。',image:'./assets/lilian-loom.png',url:'https://glsl-effects-showcase.pages.dev/',scene:'lilian-kaleido-loom',note:'GLSL Effects Showcase 収録。リンク先で「Lilian Kaleido Loom」を選択。'},
    {id:'botanical-tide',title:'Botanical Tide',lines:['Botanical','Tide'],medium:'Generative animation, GLSL',description:'暗がりの中で、枝分かれした葉脈と葉のような形がゆっくりと開く。反復する模様、揺れる曲線、脈打つ光をシェーダーで組み合わせ、水中の植物を思わせる像を描き出す。',image:'./assets/botanical-tide.png',url:'https://glsl-effects-showcase.pages.dev/',scene:'kelp-current',note:'GLSL Effects Showcase 収録。リンク先で「Botanical Tide」を検索。'}
  ]},
  text:{label:'Text',projects:[
    {id:'hinahina-text',title:'ワディーゲストハウス',lines:['ワディー','ゲストハウス'],medium:'Personal website, AI voices',description:'伝説のテキストサイト「絶望の世界」を意識して始めたはずが、二次元の嫁たちに囲まれる場所になった個人サイト。日記に「大奥AI」がコメントを寄せ、日常の記録にいくつもの声が重なる。「神話製作機械」を実際に動かす、一つのインスタンスでもある。',image:'./assets/hinahina-text.png',url:'https://hinahina-vr.github.io/',scene:'lilian-kaleido-loom',japanese:true,actionLabel:'Read website'},
    {id:'hinahina-note',title:'note',lines:['note'],subtitle:'HINAHINA',medium:'Essays, field notes',description:'酒や食、VR、照明、中国語の学習。日々の関心と、手を動かして得た経験を文章に残す。個人的な記録から、制作現場の技術をひもとく記事までを収めた、もう一つの書く場所。',image:'./assets/hinahina-note.png',url:'https://note.com/hinahina_vr',scene:'kelp-current',actionLabel:'Read on note'},
    {id:'hinahina-x',title:'X',lines:['X'],subtitle:'@HINAHINA_VR',medium:'Short notes, conversations',description:'日々のこと、制作の途中、気になったもの。短い言葉とやりとりを重ねていく、ひなひなのXアカウント。',image:'./assets/hinahina-x.png',imageAlt:'X — @hinahina_vr のアカウントカード',url:'https://x.com/hinahina_vr',scene:'lilian-kaleido-loom',actionLabel:'Open X'},
    {id:'hinahina-github',title:'GitHub',lines:['GitHub'],subtitle:'HINAHINA-VR',medium:'Source code, project notes',description:'Webサイトやアプリのソースコード、制作の記録を公開する場所。作品を動かす仕組みと、その変更の積み重ねをたどることができる。',image:'./assets/hinahina-github.png',url:'https://github.com/hinahina-vr',scene:'kelp-current',actionLabel:'Open GitHub'}
  ]},
  video:{label:'Video',projects:[
    {id:'maltbc',title:'モルトバトルちゃんねる',lines:['モルトバトル','ちゃんねる'],medium:'YouTube channel, whisky',description:'ウイスキーを飲み比べ、その違いを言葉と映像にするチャンネル。ボトルごとの味わいから蒸溜所を訪ねる旅まで、酒をめぐる体験を記録している。',image:'./assets/maltbc.png',url:'https://www.youtube.com/@maltbc',scene:'lilian-kaleido-loom',japanese:true,actionLabel:'Watch on YouTube'}
  ]},
  experiments:{label:'Experiments',projects:[
    {id:'myth-making-machine',title:'神話製作機械',lines:['神話製作機械'],subtitle:'THE MYTH-MAKING MACHINE',medium:'Concept study, human agency',description:'データが導く「最適解」と、人が自ら選ぶことの関係を問う構想。未来の分岐を「神託」として差し出し、その意味を受け取ることも、退けることも、本人の意志に委ねる。',image:'./assets/myth-making-machine.png',url:'https://gaia-senseware.pages.dev/concept/#depth',scene:'fluid-chrome-stream',japanese:true,actionLabel:'Open concept'}
  ]}
};
