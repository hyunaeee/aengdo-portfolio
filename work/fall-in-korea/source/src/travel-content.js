export const ERAS = [
  {id:'joseon',level:1,name:'조선의 마을',nameEn:'Hanok Village',subtitle:'한옥에서 시작하는 여행',subtitleEn:'Where the journey begins',color:'#77ac85'},
  {id:'port',level:4,name:'개항 도시',nameEn:'Port Town',subtitle:'새로운 세상을 만나다',subtitleEn:'A world of new discoveries',color:'#dba370'},
  {id:'retro',level:7,name:'추억의 거리',nameEn:'Retro Streets',subtitle:'음악이 흐르는 골목',subtitleEn:'Streets filled with music',color:'#cc8ab6'},
  {id:'today',level:10,name:'오늘의 한국',nameEn:'Korea Today',subtitle:'반짝이는 오늘을 여행해요',subtitleEn:'Discover a sparkling new day',color:'#7bb6dd'},
];
export const MODERN_CHAINS = [
  {id:'photo',name:'사진 여행',nameEn:'Photography',shortName:'사진',color:'#d39971',unlockLevel:4,items:['필름 한 통','일회용 사진기','필름 카메라','즉석 카메라','디지털 카메라','여행 사진 앨범'],itemsEn:['Film Roll','Pocket Film Camera','Film Camera','Instant Camera','Digital Camera','Travel Photo Album']},
  {id:'music',name:'한국의 음악',nameEn:'Korean Music',shortName:'음악',color:'#c890c7',unlockLevel:7,items:['레코드 음반','전축','라디오','카세트 플레이어','휴대용 CD 플레이어','무선 헤드폰'],itemsEn:['Vinyl Record','Record Player','Radio','Cassette Player','Portable CD Player','Wireless Headphones']},
  {id:'tech',name:'디지털 한국',nameEn:'Digital Korea',shortName:'디지털',color:'#78b9d5',unlockLevel:10,items:['삐삐','폴더폰','스마트폰','무선 이어폰','스마트 워치','K팝 응원봉'],itemsEn:['Pager','Flip Phone','Smartphone','Wireless Earbuds','Smart Watch','K-pop Light Stick']},
  {id:'streetfood',name:'길거리 간식',nameEn:'Street Food',shortName:'간식',color:'#e6a46c',unlockLevel:10,items:['어묵 꼬치','떡볶이','붕어빵','감자 핫도그','치킨 한 상','K푸드 피크닉'],itemsEn:['Fish Cake Skewer','Tteokbokki','Bungeoppang','Potato Corn Dog','Korean Fried Chicken','K-food Picnic']},
].map(chain=>({...chain,items:chain.items.map((name,index)=>({name,nameEn:chain.itemsEn[index]}))}));
export const BUILDINGS = [
  {id:'gate',level:1,era:0,name:'한옥 대문',nameEn:'Hanok Gate',cost:0,x:130,y:1180},
  {id:'teahouse',level:2,era:0,name:'한옥 찻집',nameEn:'Hanok Tea House',cost:80,x:315,y:1090},
  {id:'pavilion',level:3,era:0,name:'연못 정자',nameEn:'Pond Pavilion',cost:120,x:135,y:1005},
  {id:'station',level:4,era:1,name:'개항역',nameEn:'Port Station',cost:170,x:325,y:925},
  {id:'cafe',level:5,era:1,name:'벽돌 다방',nameEn:'Brick Café',cost:210,x:150,y:780},
  {id:'post',level:6,era:1,name:'여행 우체국',nameEn:'Travel Post Office',cost:250,x:350,y:650},
  {id:'cinema',level:7,era:2,name:'골목 극장',nameEn:'Neighborhood Cinema',cost:290,x:140,y:520},
  {id:'records',level:8,era:2,name:'레코드 가게',nameEn:'Record Shop',cost:330,x:330,y:470},
  {id:'arcade',level:9,era:2,name:'추억의 오락실',nameEn:'Retro Arcade',cost:370,x:140,y:380},
  {id:'tower',level:10,era:3,name:'서울 전망대',nameEn:'Seoul Tower',cost:420,x:145,y:235},
  {id:'studio',level:11,era:3,name:'K팝 스튜디오',nameEn:'K-pop Studio',cost:460,x:330,y:205},
  {id:'river',level:12,era:3,name:'한강 피크닉',nameEn:'Han River Picnic',cost:500,x:315,y:125},
];
export const OFFERS = [
  {id:'welcome',name:'첫 여행 꾸러미',nameEn:'First Journey Bundle',cost:5,coins:80,energy:30,limit:'once',art:2},
  {id:'energy',name:'하루 충전',nameEn:'Daily Recharge',cost:8,coins:0,energy:50,limit:'daily',art:6},
  {id:'souvenir',name:'기념품 상자',nameEn:'Souvenir Box',cost:12,coins:180,energy:20,limit:'daily',art:7},
];
export const PASS_TIERS = [
  {target:1,coins:30,gems:1,premiumGems:3},
  {target:3,coins:60,gems:2,premiumGems:4},
  {target:6,coins:100,gems:3,premiumGems:6},
  {target:10,coins:150,gems:5,premiumGems:10},
];
