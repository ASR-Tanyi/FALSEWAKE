const paths = {
 eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
 village:'<path d="M3 21V10l5-4 5 4v11M13 21V6l4-4 4 4v15M1 21h22M6 21v-5h4v5M16 9h2M16 13h2"/>',
 book:'<path d="M12 5c-3-3-8-2-10-1v15c4-2 7-1 10 1 3-2 6-3 10-1V4c-2-1-7-2-10 1Zm0 0v15M5 8h4M5 12h4M15 8h4M15 12h4"/>',
 feather:'<path d="M4 20 16 8M7 17c-5-12 8-16 14-14 2 6-2 19-14 14ZM10 14h7M13 11V6"/>',
 shield:'<path d="m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6l9-4Z"/><path d="m8 12 3 3 5-6"/>',
 flame:'<path d="M12 2c2 7 8 8 8 13a8 8 0 0 1-16 0c0-4 3-7 4-9 0 6 4 6 4-4Z"/><path d="M12 13c-5 5-2 8 0 8s5-3 0-8Z"/>',
 scales:'<path d="M12 3v18M7 21h10M3 7h18M5 7l-4 8h8L5 7Zm14 0-4 8h8l-4-8Z"/>',
 drop:'<path d="M12 2S4 11 4 15a8 8 0 0 0 16 0c0-4-8-13-8-13ZM8 15c0 3 2 4 4 4"/>',
 star:'<path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z"/>',
 moon:'<path d="M20 15A9 9 0 0 1 9 3a9 9 0 1 0 11 12Z"/>',
 mask:'<path d="M3 5c6-3 12-3 18 0v7c0 6-9 10-9 10S3 18 3 12V5Z"/><path d="m6 9 4 2m8-2-4 2m-5 6h6"/>',
 crown:'<path d="m2 6 5 4 5-7 5 7 5-4-3 13H5L2 6ZM5 22h14"/>',
 arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
 close:'<path d="m6 6 12 12M6 18 18 6"/>',
 reset:'<path d="M3 10a9 9 0 1 1 1 8M3 3v7h7"/>',
 help:'<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 5m0 3h.01"/>',
 pin:'<path d="m8 3 8 0-1 6 4 4v2H5v-2l4-4-1-6Zm4 12v7"/>',
 search:'<circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/>',
 check:'<path d="m5 12 4 4L20 5"/>',
 skull:'<path d="M5 17a9 9 0 1 1 14 0l-1 5H6l-1-5Z"/><circle cx="8" cy="12" r="2"/><circle cx="16" cy="12" r="2"/><path d="m12 14-1 3h2l-1-3Zm-3 5v3m6-3v3"/>',
 heart:'<path d="M12 21S2 14 2 8a5 5 0 0 1 10-1 5 5 0 0 1 10 1c0 6-10 13-10 13Z"/>'
};
export function icon(type, cls='') {
 return `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[type]||paths.eye}</svg>`;
}
// Original vector portraits: all local, no remote assets or font requests.
export function portrait(id,large=false) {
 const palettes=[['#5d7977','#b4aa8d','#363d39'],['#8c7053','#c6a485','#77614e'],
 ['#6a6482','#b4a8a1','#30313c'],['#6d7f8d','#d0b8a3','#817264'],
 ['#89745b','#bc9b7d','#514235'],['#677f76','#c0ab95','#323c39'],
 ['#8a6b78','#c2a0a0','#513440'],['#637d89','#c5b291','#a28f71'],
 ['#73736d','#b6a088','#4e443d'],['#746a83','#bea48d','#484251'],
 ['#6e8276','#c8b197','#6f4d37'],['#8c805d','#cfb99a','#b8ac88']];
 const [bg,skin,hair]=palettes[id%12];
 const hats={
  0:'<path d="M26 51V32c1-23 48-23 48 1v24l-12-7-1-22c-12 7-18 1-23 16l-4 16Z"/>',
  1:'<path d="m20 32 10-5 4-16 32 1 6 17 10 5-3 6-57-2Z"/>',
  2:'<path d="M24 46 19 34 32 10 67 12l14 23-6 14-7-16-34-4-8 26Z"/>',
  3:'<path d="M22 72V32C17 4 80 1 78 36v40L65 62V29c-12 11-22 4-29 17v26Z"/>',
  4:'<path d="M27 38 25 27l8-10 34 0 9 13-6 13-6-13-28 0-8 17Z"/>',
  5:'<path d="M24 61 23 30C22 5 74 2 77 31l-2 37-11-13 1-28C51 42 42 27 32 45l2 19Z"/>'
 };
 return `<svg viewBox="0 0 100 100" class="portrait${large?' large':''}" aria-hidden="true">
 <defs><clipPath id="clip-${large?'l':'s'}-${id}"><circle cx="50" cy="50" r="48"/></clipPath></defs>
 <g clip-path="url(#clip-${large?'l':'s'}-${id})"><path fill="${bg}" d="M0 0h100v100H0z"/>
 <path fill="#11171a" opacity=".22" d="m0 0 100 100H0Zm100 0L0 100V0Z"/>
 <circle cx="51" cy="39" r="32" fill="none" stroke="#e4d3ac" opacity=".16"/>
 <path d="M7 102c2-25 22-32 32-34h22c19 4 31 14 34 34" fill="${hair}"/>
 <path d="m40 59-2 14 12 13 14-13-3-16" fill="${skin}"/>
 <path d="M29 34c0-23 43-25 43 1l-4 23-13 14-13-3-12-17Z" fill="${skin}"/>
 <path d="m51 26 15 8-3 23-10 11 8-20Z" fill="#2a2726" opacity=".24"/>
 <g fill="${hair}">${hats[id%6]}</g>
 <path d="m34 43 9-2m13 0 9 2" stroke="${hair}" stroke-width="3"/>
 <path d="M36 46h5m16 0h5m-13 1-2 10h5m-9 5h13" stroke="#403b37" stroke-width="1.5" fill="none"/>
 ${id%4===1?`<path d="m32 53 9 5 9-2 11 2 8-5-4 15-14 8-14-9Z" fill="${hair}"/>`:''}
 <path d="m37 72-6 24 18-10-8-12m23-2 7 24-21-10 10-12" fill="#1e282b"/>
 <path d="m49 86 1 14m-34-11 12-10m48 0 10 10" stroke="#d1c1a0" opacity=".3"/>
 <circle cx="50" cy="93" r="2" fill="#c7aa70"/></g>
 <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" stroke-width="1"/></svg>`;
}
export function villageArt() {
 return `<svg viewBox="0 0 320 220" class="village-art" aria-hidden="true">
 <circle cx="165" cy="68" r="56" fill="#bdab7d" opacity=".06"/>
 <circle cx="165" cy="68" r="40" fill="none" stroke="#b49c67" stroke-width=".7" opacity=".3"/>
 <path d="M145 36a34 34 0 1 0 47 42 29 29 0 0 1-47-42Z" fill="#c3af80" opacity=".5"/>
 <g stroke="#42483f" stroke-width="1" fill="#161e20">
 <path d="M8 176v-53l23-19 25 19v53M48 178v-72l28-24 28 24v72M100 178v-51l22-18 25 18v51"/>
 <path d="M132 180V89h10V65l20-37 20 37v24h10v91Z"/>
 <path d="M193 178v-68l27-26 26 26v68M240 181v-45l29-21 27 21v45"/>
 <path d="M130 89h64m-53-24h42m-80 43 29-30 29 30m90 3 28-29 30 29M156 28h12m-6-12v24"/>
 </g><g fill="#b99857" opacity=".55"><path d="M155 87V72a7 7 0 0 1 14 0v15ZM152 177v-29a10 10 0 0 1 20 0v29Z"/>
 <path d="M27 132h6v11h-6m40-27h6v12h-6m11-12h6v12h-6m38 23h6v11h-6m85-17h6v12h-6m12-12h6v12h-6m44 10h6v11h-6"/></g>
 <path d="M2 179q80-12 151 3t164-3M26 192q87-7 138 3t131-2" stroke="#706d54" fill="none" opacity=".4"/>
 <g fill="#cdb98a" opacity=".4"><circle cx="88" cy="43" r="1"/><circle cx="240" cy="53" r="1"/><circle cx="46" cy="75" r="1"/><circle cx="218" cy="31" r="1"/></g>
 </svg>`;
}
