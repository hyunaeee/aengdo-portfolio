// Portfolio sessions never read or clear the original game save keys.
const memory=new Map();
const prefix='portfolio-fall-in-korea:';
window.portfolioGameStorage={
 getItem(key){try{return localStorage.getItem(prefix+key)??memory.get(key)??null;}catch{return memory.get(key)??null;}},
 setItem(key,value){memory.set(key,String(value));try{localStorage.setItem(prefix+key,value);}catch{}},
};
await import('./src/app-v4.js');
