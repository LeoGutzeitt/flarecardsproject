// Bandeiras em SVG para funcionar também em sistemas sem emojis de bandeiras.
const rect=(fill,y=0,height=30)=>`<rect width="44" height="${height}" y="${y}" fill="${fill}"/>`;
export const cardLanguages=[
 {code:'pt-BR',name:'Português',art:rect('#229e45')+'<path d="m22 3 19 12-19 12L3 15Z" fill="#ffdf00"/><circle cx="22" cy="15" r="8" fill="#253c91"/><path d="M15 12q8-1 14 6" fill="none" stroke="white" stroke-width="2"/>'},
 {code:'en',name:'Inglês',art:rect('#fff')+Array.from({length:7},(_,i)=>rect('#b52234',i*30/7,30/14)).join('')+'<path fill="#233b73" d="M0 0h21v16H0z"/><text x="10" y="12" text-anchor="middle" fill="white" font-size="12">★</text>'},
 {code:'ja',name:'Japonês',art:rect('#fff')+'<circle cx="22" cy="15" r="9" fill="#bc002d"/>'},
 {code:'es',name:'Espanhol',art:rect('#aa151b')+rect('#f1bf00',7.5,15)},
 {code:'fr',name:'Francês',art:rect('#fff')+'<path fill="#183d91" d="M0 0h14.7v30H0z"/><path fill="#ed2939" d="M29.3 0H44v30H29.3z"/>'},
 {code:'de',name:'Alemão',art:rect('#171717')+rect('#dd2630',10,10)+rect('#ffce00',20,10)},
 {code:'it',name:'Italiano',art:rect('#fff')+'<path fill="#009246" d="M0 0h14.7v30H0z"/><path fill="#ce2b37" d="M29.3 0H44v30H29.3z"/>'},
 {code:'ko',name:'Coreano',art:rect('#fff')+'<circle cx="22" cy="15" r="9" fill="#cd2e3a"/><path d="M13 15a9 9 0 0 0 18 0q-4 7-9 0t-9 0" fill="#0047a0"/><path d="m4 5 6 3m-7 0 6 3m25 11 6 3m-7 0 6 3" stroke="#222" stroke-width="2"/>'},
 {code:'zh',name:'Chinês',art:rect('#de2910')+'<text x="5" y="15" fill="#ffde00" font-size="15">★</text>'},
];
export function validateCardLanguage(value){const code=String(value??'');if(code&&!cardLanguages.some(l=>l.code===code))throw Error('Escolha um idioma válido para a carta.');return code;}
export function languageBadge(code){const language=cardLanguages.find(l=>l.code===code||l.name===code);if(!language)return '<span>Idioma não informado</span>';return `<span style="display:inline-flex;align-items:center;gap:7px;vertical-align:middle;white-space:nowrap"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 30" width="22" height="15" aria-hidden="true" style="border-radius:2px;box-shadow:0 0 0 1px #0002;flex-shrink:0">${language.art}</svg><span>${language.name}</span></span>`;}
