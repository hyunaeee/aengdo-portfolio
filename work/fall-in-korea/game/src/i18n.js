import {ITEM_CHAINS,CHARACTERS,BUILDINGS,OFFERS,getItemDefinition} from './game.js';
let lang='ko';
try{lang=window.portfolioGameStorage.getItem('fall-in-korea-language')||((window.portfolioGameStorage.getItem('dodam-workshop-save-v3')||navigator.language?.startsWith('ko'))?'ko':'en');}catch{}
export const language=()=>lang;
export const tx=(ko,en)=>lang==='ko'?ko:en;
export function setLanguage(value){lang=value==='en'?'en':'ko';try{window.portfolioGameStorage.setItem('fall-in-korea-language',lang);}catch{}document.documentElement.lang=lang;}
const chainEnglish={maedeup:'Knots & Norigae',bojagi:'Patchwork',celadon:'Celadon',hanbok:'Hanbok',fan:'Fans',najeon:'Mother of Pearl',tteok:'Rice Cakes',hangwa:'Korean Sweets',tea:'Traditional Tea',lantern:'Paper Lanterns'};
const itemEnglish={
 maedeup:['Silk Thread','Twisted Cord','Dorae Knot','Saengjjok Knot','Floral Norigae','Triple Norigae'],
 bojagi:['Silk Scrap','Two-patch Cloth','Four-patch Cloth','Saekdong Patchwork','Embroidered Wrap','Gift Bojagi'],
 celadon:['Pottery Clay','Wheel-thrown Bowl','Biscuit-fired Bowl','Celadon Teacup','Inlaid Celadon Vase','Cloud & Crane Maebyeong'],
 hanbok:['Cotton','Cotton Yarn','Saekdong Fabric','Saekdong Jeogori','Floral Hanbok','Royal Dangui'],
 fan:['Bamboo','Fan Ribs','Hanji Fan','Taegeuk Fan','Plum Blossom Fan','Phoenix Fan'],
 najeon:['Abalone Shell','Pearl Pieces','Pearl Blossom','Inlaid Hand Mirror','Pearl Jewelry Box','Longevity Treasure Box'],
 tteok:['Rice','Rice Flour','Rice Dough','Songpyeon','Flower Songpyeon','Rainbow Rice Cakes'],
 hangwa:['Honey Jar','Honey Dough','Yakgwa','Flower Yakgwa','Yugwa Assortment','Hangwa Gift Box'],
 tea:['Tea Leaves','Dried Tea Leaves','Green Tea','Flower Tea','Porcelain Tea Set','Tea Ceremony Table'],
 lantern:['Paper Mulberry Bark','Hanji Paper','Bamboo Lantern Frame','Cheongsachorong','Lotus Lantern','Phoenix Lantern'],
};
const animalEnglish=['Magpie','Tiger','Haetae','Phoenix','Dragon','Rat','Ox','Rabbit','Snake','Horse','Sheep','Monkey','Rooster','Dog','Pig'];
const nickEnglish=['Sodam','Hodam','Haeon','Bongi','Mir','Doto','Uram','Dalkong','Arong','Baram','Mongsil','Jaerong','Kkomi','Nuri','Boksil'];
const bios=['A cheerful messenger who loves beautiful knots.','A brave mountain friend with a soft spot for floral hanbok.','A gentle guardian who collects lovely celadon.','A colorful friend with an eye for elegant fans.','A cloud traveler who treasures shining pearl boxes.','A tiny craft expert who loves patchwork.','A calm, dependable friend who enjoys warm tea.','A moonlight baker who makes flower rice cakes.','A careful collector with a taste for intricate knots.','A swift traveler delivering lanterns across the village.','A kind friend who gives cozy patchwork gifts.','A playful performer with a talent for fan dancing.','An early bird who shares freshly made Korean sweets.','A friendly courier who remembers every wish.','A generous foodie who loves rainbow rice cakes.'];
export function chainName(id){const c=ITEM_CHAINS.find(c=>c.id===id);return c?tx(c.name,c.nameEn||chainEnglish[id]||c.name):'';}
export function itemName(item){const definition=getItemDefinition(item);if(!definition)return '';return item.generator?tx(definition.name,`${chainName(item.chain)} Crate`):tx(definition.name,definition.nameEn||itemEnglish[item.chain]?.[item.level]||definition.name);}
export const animalName=index=>tx(CHARACTERS[index]?.name||'',animalEnglish[index]||'Friend');
export const nickname=index=>tx(CHARACTERS[index]?.nickname||'',nickEnglish[index]||'');
export const bio=index=>tx(CHARACTERS[index]?.bio||'',bios[index]||'');
export const localized=object=>tx(object.name,object.nameEn||object.name);
export const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const resultEnglish={
 '새로운 공방을 열었어요.':'Your new workshop is ready!',
 '게임 데이터를 다시 준비했어요.':'Your saved game could not be loaded. A new game is ready.',
 '할 일을 선택해 주세요.':'Choose an item or action to continue.',
 '건물을 찾을 수 없어요.':'This building could not be found. Select a building on the travel map.',
 '이미 완성한 건물이에요.':'This building is already complete. Choose another building on the map.',
 '오늘의 출석 선물은 이미 받았어요.':'You have already claimed today’s daily gift. Come back tomorrow.',
 '오늘의 출석 선물! 엽전 50개와 보석 2개를 받았어요.':'Daily gift claimed! +50 coins and +2 gems.',
 '같은 마을 친구 두 장을 찾아보세요!':'Find two cards showing the same village friend!',
 '기억놀이를 먼저 시작해 주세요.':'Start a memory game before choosing a card.',
 '뒤집을 카드를 선택해 주세요.':'Choose a face-down card to reveal it.',
 '모든 짝을 찾았어요. 새 놀이를 시작해 주세요.':'You found every pair. Start a new memory game to play again.',
 '두 카드를 다시 덮은 뒤 골라주세요.':'Turn the two revealed cards face down before choosing another card.',
 '다른 카드를 선택해 주세요.':'Choose a different face-down card that has not been matched.',
 '모든 짝을 찾았어요! 엽전 60개와 경험치 25를 받았어요.':'All pairs found! +60 coins and +25 XP.',
 '모든 짝을 찾았어요! 오늘의 보상은 이미 받았어요.':'All pairs found! You already received today’s reward. Play again tomorrow for another reward.',
 '같은 친구를 찾았어요!':'You found a matching pair!',
 '다음 카드를 골라주세요.':'Choose the next card.',
 '덮을 카드가 없어요.':'There are no two revealed cards to turn over. Choose a face-down card.',
 '다시 같은 친구를 찾아보세요.':'Try again to find two matching friends.',
 '오늘의 윷놀이를 완주했어요. 내일 다시 만나요!':'You finished today’s yutnori game. Come back tomorrow for a new game.',
 '윷놀이 완주! 엽전 80개와 경험치 35를 받았어요.':'Yutnori complete! +80 coins and +35 XP.',
 '완성한 도감을 선택해 주세요.':'Choose a completed collection to claim its reward.',
 '이 도감의 완성 선물은 이미 받았어요.':'You already claimed this collection’s reward. Complete another collection for more gems.',
 '한 계열의 아이템 6종을 모두 발견해 주세요.':'Discover all six items in one merge chain to claim its collection reward.',
 '이번 주 여행 패스를 이미 열었어요.':'This week’s Travel Pass is already unlocked. Complete orders to earn its rewards.',
 '여행 패스에는 게임 보석 20개가 필요해요.':'The Travel Pass costs 20 in-game gems. Earn gems from daily gifts, missions, or collections.',
 '이번 주 여행 패스를 열었어요!':'This week’s Travel Pass is unlocked!',
 '받을 패스 보상을 선택해 주세요.':'Choose a Travel Pass reward tier to claim.',
 '게임 보석으로 여행 패스를 먼저 열어주세요.':'Unlock this week’s Travel Pass with 20 in-game gems before claiming premium rewards.',
 '이미 받은 패스 보상이에요.':'You already claimed this pass reward. Choose another unlocked reward tier.',
 '이번 주 주문을 더 완료해 주세요.':'Complete more orders this week to unlock this pass reward.',
 '여행 패스 보상을 받았어요!':'Travel Pass reward claimed!',
 '꾸러미를 선택해 주세요.':'Choose a bundle from the shop.',
 '꾸러미는 한 번에 하나씩 구매해 주세요.':'Buy one bundle at a time.',
 '이미 구매한 꾸러미예요.':'This bundle has reached its purchase limit. Daily bundles return tomorrow; the First Journey Bundle is available only once.',
 '엽전을 먼저 사용한 뒤 구매해 주세요.':'Your coin balance is too high to receive this bundle. Spend some coins before buying it.',
 '구매할 아이템을 선택해 주세요.':'Choose an available item from the shop.',
 '아이템은 한 번에 하나씩 구매해 주세요.':'Buy one item at a time.',
 '보드에 빈칸을 먼저 만들어 주세요.':'Make an empty board space by merging, delivering an order, or storing an item.',
 '올바른 칸을 선택해 주세요.':'Choose a cell on the game board.',
 '다른 칸으로 옮겨 주세요.':'Move the item to a different board cell.',
 '옮길 아이템이 없어요.':'There is no item to move. Select an occupied board cell.',
 '이미 가장 높은 단계의 아이템이에요.':'This item is already at its highest level. Use it for an order, store it, or sell it.',
 '아이템의 자리를 바꿨어요.':'Items swapped.',
 '아이템을 옮겼어요.':'Item moved.',
 '번개 표시가 있는 생산기를 선택해 주세요.':'Choose a producer with a lightning-bolt symbol to make materials.',
 '만들 재료를 선택해 주세요.':'Choose a material crate to make an item.',
 '보드가 가득 찼어요. 합성하거나 주문을 완료해 주세요.':'Your board is full. Merge items or complete an order to make space.',
 '에너지가 부족해요. 잠시 기다리거나 충전해 주세요.':'You need at least 1 energy. Wait for it to recharge or use a refill.',
 '주문을 찾을 수 없어요.':'This order could not be found. Choose one of the current customer orders.',
 '주문에 필요한 아이템을 더 만들어 주세요.':'Make all the items and quantities shown on this order, then deliver them.',
 '판매할 아이템을 선택해 주세요.':'Select an item on the board to sell.',
 '이 칸에는 아이템이 없어요.':'This cell is empty. Select a cell with an item.',
 '생산기는 판매할 수 없어요.':'Producers cannot be sold. Select a regular item to sell.',
 '보관할 아이템을 선택해 주세요.':'Select an item on the board to put in storage.',
 '생산기는 보관할 수 없어요.':'Producers cannot go into storage. Select a regular item instead.',
 '보관함이 가득 찼어요. 아이템을 먼저 꺼내 주세요.':'Storage is full. Return a stored item to an empty board cell first.',
 '보관함이 가득 찼어요.':'Storage is full. Return a stored item to an empty board cell first.',
 '꺼낼 아이템을 선택해 주세요.':'Choose an item in storage to return to the board.',
 '보드가 가득 찼어요. 빈칸을 먼저 만들어 주세요.':'Your board is full. Merge, deliver, or sell an item before taking one out of storage.',
 '미션을 찾을 수 없어요.':'This mission could not be found. Choose a mission from the mission list.',
 '이미 받은 보상이에요.':'You already claimed this reward. Choose another completed mission.',
 '미션을 완료하면 보상을 받을 수 있어요.':'Complete the mission’s goal before claiming its reward.',
 '미션을 먼저 완료해 주세요.':'Complete the mission’s goal before claiming its reward.',
 '에너지가 이미 가득 찼어요.':'Your energy is already full. Use some energy to make materials before refilling.',
 '에너지가 이미 가득해요.':'Your energy is already full. Use some energy to make materials before refilling.',
 '충전하려면 보석 5개가 필요해요.':'An energy refill costs 5 gems. Earn gems from daily gifts, missions, or collections.',
 '충전하려면 50 코인이 필요해요.':'An energy refill costs 50 coins. Complete customer orders or sell items to earn coins.',
 '코인이 부족해요.':'You need more coins. Complete customer orders or sell items to earn them.',
 '보석이 부족해요.':'You need more gems. Claim daily gifts or complete missions and collections to earn them.',
};
const englishNames=new Map([
 ...ITEM_CHAINS.flatMap(chain=>[
  [chain.name,chain.nameEn||chainEnglish[chain.id]],
  ...chain.items.map((item,index)=>[item.name,item.nameEn||itemEnglish[chain.id]?.[index]]),
 ]),
 ...BUILDINGS.map(building=>[building.name,building.nameEn]),
 ...OFFERS.map(offer=>[offer.name,offer.nameEn]),
 ...CHARACTERS.map((character,index)=>[character.name,animalEnglish[index]]),
 ['합성의 달인','Merge Master'],['단골손님','Regular Customers'],['고운 한복','Beautiful Hanbok'],
]);
export function resultMessage(result){
 if(lang==='ko')return result.message||'완료!';
 if(result.messageEn)return result.messageEn;
 const m=result.message||'';
 if(resultEnglish[m])return resultEnglish[m];
 let match;
 if((match=m.match(/^레벨 (\d+)에 열리는 (구역|아이템|공방)이에요\.$/))){
  const subject={'구역':'This area','아이템':'This item','공방':'This workshop'}[match[2]];
  return `${subject} unlocks at level ${match[1]}. Complete orders to gain XP.`;
 }
 if((match=m.match(/^엽전 (\d+)개가 필요해요\.$/)))return `You need ${match[1]} coins to build this. Complete orders to earn coins.`;
 if((match=m.match(/^게임 보석 (\d+)개가 필요해요\.$/)))return `This purchase costs ${match[1]} in-game gems. Earn gems from daily gifts, missions, or collections.`;
 if((match=m.match(/^에너지가 (\d+) 이하일 때 구매할 수 있어요\.$/)))return `Use energy until you have ${match[1]} or less before buying this bundle.`;
 if((match=m.match(/^에너지 (\d+) 충전 완료!$/)))return `Restored ${match[1]} energy!`;
 if((match=m.match(/^([도개걸윷모])! (\d+)칸 앞으로 가요\.$/))){
  const roll={'도':'Do','개':'Gae','걸':'Geol','윷':'Yut','모':'Mo'}[match[1]];
  return `${roll}! Move forward ${match[2]} ${match[2]==='1'?'space':'spaces'}.`;
 }
 if((match=m.match(/^(.+) 도감 완성! 보석 (\d+)개를 받았어요\.$/)))return `${englishNames.get(match[1])||'Item'} collection complete! +${match[2]} gems.`;
 if((match=m.match(/^(.+) 완성! 보석 (\d+)개와 경험치 (\d+)을 받았어요\.$/)))return `${englishNames.get(match[1])||'Building'} complete! +${match[2]} gems and +${match[3]} XP.`;
 if((match=m.match(/^(.+)님의 주문 완료! \+(\d+) 코인$/))){
  const customer=englishNames.get(match[1]);
  return `${customer?`${customer}’s order`:'Order'} completed! +${match[2]} coins.`;
 }
 if((match=m.match(/^(.+) 판매! \+(\d+) 코인$/)))return `Sold ${englishNames.get(match[1])||'item'}! +${match[2]} coins.`;
 if((match=m.match(/^(.+) 완료! \+(\d+) (코인|보석)$/)))return `${englishNames.get(match[1])||'Mission'} complete! +${match[2]} ${match[3]==='코인'?'coins':'gems'}.`;
 if((match=m.match(/^(.+)(을 받았어요!| 준비 완료!| 보관 완료!| 꺼내기 완료!| 완성!)$/))){
  const name=englishNames.get(match[1])||'Item';
  const suffix={'을 받았어요!':'received!',' 준비 완료!':'ready!',' 보관 완료!':'stored!',' 꺼내기 완료!':'returned to the board!',' 완성!':'created!'}[match[2]];
  return `${name} ${suffix}`;
 }
 return result.ok?'Done!':'This action is not available. Check its requirements and try again.';
}
