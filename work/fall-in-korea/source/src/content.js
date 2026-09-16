// 합성 순서는 놀이를 위한 창작 구성입니다.
export const ITEM_CHAINS = [
  {id:'maedeup',name:'매듭 · 노리개',shortName:'매듭',color:'#ed7498',items:['명주실','꼬임끈','도래매듭','생쪽매듭','꽃술 노리개','삼작노리개']},
  {id:'bojagi',name:'조각보',shortName:'조각보',color:'#efa15c',items:['비단 조각','두 조각 보','네 조각 보','색동 조각보','꽃수 보자기','예단 보자기']},
  {id:'celadon',name:'청자',shortName:'청자',color:'#69bda4',items:['고운 흙','물레 사발','초벌 그릇','청자 찻잔','상감 청자병','구름학 청자매병']},
  {id:'hanbok',name:'한복',shortName:'한복',color:'#ec829c',items:['목화솜','무명 실타래','색동 옷감','색동 저고리','꽃자수 한복','궁중 당의']},
  {id:'fan',name:'전통 부채',shortName:'부채',color:'#75b5dd',items:['대나무','부챗살','한지 부채','태극 부채','매화 합죽선','봉황 부채']},
  {id:'najeon',name:'나전칠기',shortName:'나전',color:'#a892d1',items:['전복 껍데기','자개 조각','꽃 자개','나전 손거울','나전 보석함','십장생 나전함']},
  {id:'tteok',name:'오색 떡',shortName:'떡',color:'#f49caf',items:['쌀 한 줌','쌀가루','흰 떡 반죽','송편','꽃송편','오색 떡 한상']},
  {id:'hangwa',name:'한과',shortName:'한과',color:'#dca15c',items:['꿀 항아리','꿀 반죽','약과','꽃약과','유과 모둠','한과 선물함']},
  {id:'tea',name:'전통차',shortName:'전통차',color:'#9fb75b',items:['찻잎','말린 찻잎','녹차 한 잔','꽃차 찻잔','백자 다기','다례 찻상']},
  {id:'lantern',name:'한지 등',shortName:'한지등',color:'#f18d6a',items:['닥나무 껍질','고운 한지','대나무 등살','청사초롱','연꽃 등','봉황 장식등']},
].map(chain=>({...chain,items:chain.items.map(name=>({name}))}));

export const CHARACTERS = [
  {id:'magpie',name:'까치',nickname:'소담',group:'마을 친구',bio:'반가운 소식과 예쁜 매듭을 좋아해요.',favorite:'maedeup'},
  {id:'tiger',name:'호랑이',nickname:'호담',group:'십이지신 · 인',bio:'씩씩한 산지기. 꽃수 놓인 한복이 잘 어울려요.',favorite:'hanbok'},
  {id:'haetae',name:'해태',nickname:'해온',group:'마을 친구',bio:'공방을 지키는 다정한 수호자. 청자를 모아요.',favorite:'celadon'},
  {id:'phoenix',name:'봉황',nickname:'봉이',group:'마을 친구',bio:'고운 빛깔을 사랑하는 마을의 멋쟁이예요.',favorite:'fan'},
  {id:'dragon',name:'용',nickname:'미르',group:'십이지신 · 진',bio:'구름 위에 살며 반짝이는 나전함을 아껴요.',favorite:'najeon'},
  {id:'rat',name:'쥐',nickname:'도토',group:'십이지신 · 자',bio:'손재주 좋은 작은 친구. 조각보를 만들어요.',favorite:'bojagi'},
  {id:'ox',name:'소',nickname:'우람',group:'십이지신 · 축',bio:'느긋하고 든든해요. 따뜻한 차 한 잔을 즐겨요.',favorite:'tea'},
  {id:'rabbit',name:'토끼',nickname:'달콩',group:'십이지신 · 묘',bio:'달빛 아래서 쫀득한 꽃송편을 빚어요.',favorite:'tteok'},
  {id:'snake',name:'뱀',nickname:'아롱',group:'십이지신 · 사',bio:'섬세한 눈썰미로 가장 고운 매듭을 골라요.',favorite:'maedeup'},
  {id:'horse',name:'말',nickname:'바람',group:'십이지신 · 오',bio:'마을을 달리며 한지 등을 배달해요.',favorite:'lantern'},
  {id:'sheep',name:'양',nickname:'몽실',group:'십이지신 · 미',bio:'포근한 마음으로 색동 조각보를 선물해요.',favorite:'bojagi'},
  {id:'monkey',name:'원숭이',nickname:'재롱',group:'십이지신 · 신',bio:'재주 많은 장난꾸러기. 부채춤이 특기예요.',favorite:'fan'},
  {id:'rooster',name:'닭',nickname:'꼬미',group:'십이지신 · 유',bio:'아침 공방 문을 열고 노릇한 한과를 나눠요.',favorite:'hangwa'},
  {id:'dog',name:'개',nickname:'누리',group:'십이지신 · 술',bio:'친구의 주문을 기억하는 다정한 배달부예요.',favorite:'hanbok'},
  {id:'pig',name:'돼지',nickname:'복실',group:'십이지신 · 해',bio:'복을 나눠주는 미식가. 오색 떡을 좋아해요.',favorite:'tteok'},
];
