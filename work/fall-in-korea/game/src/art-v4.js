import {ITEM_SPRITES,CHARACTER_SPRITES} from './sprite-data.js';
import {EXTRA_SPRITES} from './travel-sprite-data.js';
import {ITEM_CHAINS} from './game.js';
export const icons={
 close:'M6 6l12 12M6 18 18 6',check:'m4 13 5 5L20 6',arrow:'M4 12h16m-6-6 6 6-6 6',back:'M20 12H4m6-6-6 6 6 6',
 info:'M12 11v6m0-10h.01',help:'M9 9a3 3 0 1 1 4 3c-1 .6-1 1-1 2m0 3h.01',
 settings:'m9 3-1 3-3 1 1 3-2 2 2 2-1 3 3 1 1 3h6l1-3 3-1-1-3 2-2-2-2 1-3-3-1-1-3H9ZM9 12a3 3 0 1 0 6 0 3 3 0 0 0-6 0',
 star:'m12 2 3 6.5 7 1-5 5 1.2 7-6.2-3.3-6.2 3.3 1.2-7-5-5 7-1L12 2Z',
 lock:'M7 10V7a5 5 0 0 1 10 0v3M5 10h14v11H5Zm7 5v2',play:'m8 4 12 8-12 8V4Z',
 hammer:'m4 20 10-10m-4-4 4-4 8 8-4 4-8-8Z',sound:'M4 9h4l5-5v16l-5-5H4V9m12-1a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14',
 undo:'M5 10h9a6 6 0 0 1 0 12M5 10l5-5m-5 5 5 5',home:'m3 10 9-7 9 7M5 9v12h14V9M9 21v-8h6v8',
 globe:'M2 12h20M12 2c6 5 6 15 0 20-6-5-6-15 0-20',trash:'M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7',
};
export function icon(name){return `<svg class="icon icon-${name}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${['info','help','globe'].includes(name)?'<circle cx="12" cy="12" r="10"/>':''}<path d="${icons[name]||icons.star}"/></svg>`;}
function crop(rect,atlas,fill=94){if(!rect||!atlas)return '';const max=Math.max(rect.width,rect.height);return `<span class="sprite-crop" style="width:${rect.width/max*fill}%;height:${rect.height/max*fill}%;background-image:url('${atlas.src}');background-size:${atlas.width/rect.width*100}% ${atlas.height/rect.height*100}%;background-position:${rect.x/(atlas.width-rect.width)*100}% ${rect.y/(atlas.height-rect.height)*100}%"></span>`;}
export function characterArt(index,extra=''){return `<span class="character-sprite ${extra}" aria-hidden="true">${crop(CHARACTER_SPRITES.items[index],CHARACTER_SPRITES)}</span>`;}
export function uiSprite(name,extra=''){const korean={bag:15,map:16,chest:17,coin:18,gem:19};if(name in korean)return characterArt(korean[name],`ui-sprite korean-ui ${extra}`);const i=name==='energy'?7:11;return `<span class="ui-sprite ${extra}" style="--sx:${i%4/3*100}%;--sy:${Math.floor(i/4)/2*100}%" aria-hidden="true"></span>`;}
export function eventArt(index,extra=''){const atlas=EXTRA_SPRITES.events;return `<span class="event-sprite ${extra}" aria-hidden="true">${crop(atlas?.items[index],atlas)}</span>`;}
export function buildingArt(index,extra=''){const atlas=EXTRA_SPRITES.buildings;return `<span class="building-sprite ${extra}" aria-hidden="true">${crop(atlas?.items[index],atlas,100)}</span>`;}
export function itemArt(item,extra=''){
 if(!item)return '';const chain=ITEM_CHAINS.find(c=>c.id===item.chain);if(!chain)return '';
 if(item.generator)return `<span class="generator-art ${extra}">${uiSprite('chest','generator-box')}<span class="generator-preview">${itemArt({chain:item.chain,level:4})}</span></span>`;
 let rect=ITEM_SPRITES.items[`${item.chain}:${item.level}`],atlas=rect?ITEM_SPRITES.atlases[rect.atlas]:EXTRA_SPRITES.modern;
 if(!rect){const row=['photo','music','tech','streetfood'].indexOf(item.chain);rect=atlas?.items[row*6+item.level];}
 return `<span class="item-sprite ${extra}" aria-hidden="true">${crop(rect,atlas,92)}</span>`;
}
