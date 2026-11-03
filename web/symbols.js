// Distinct original role sigils. Render the CLAIM, never a hidden true identity.
export const SYMBOLS={
 count:'<circle cx="6" cy="12" r="3"/><circle cx="18" cy="12" r="3"/><path d="M9 12h6M12 3v4m0 10v4"/>',
 shield:'<path d="m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6l9-4Z"/><path d="m8 12 3 3 5-6"/>',
 book:'<path d="M12 5C8 2 4 3 2 4v16c4-2 7-1 10 1 3-2 6-3 10-1V4c-4-1-7-2-10 1Zm0 0v16M5 8h4m6 0h4M5 12h4m6 0h4"/>',
 infinity:'<path d="M12 12C3-1-4 24 8 17l4-5c9-13 16 12 4 5l-4-5Z"/>',
 scales:'<path d="M12 2v20M7 22h10M3 6h18M5 6l-4 9h8L5 6Zm14 0-4 9h8l-4-9Z"/>',
 feather:'<path d="M3 21 17 7M7 17C1 4 16 1 22 2c1 7-4 20-15 15Zm4-4h7m-4-3V5"/>',
 drop:'<path d="M12 2S4 11 4 15a8 8 0 0 0 16 0c0-4-8-13-8-13ZM8 15c0 3 2 4 4 4"/>',
 lantern:'<path d="M7 6h10l2 15H5L7 6Zm0 0 5-4 5 4M4 21h16M9 10l3 7 3-7M12 6v3"/>',
 cup:'<path d="m5 3 13 4-2 7c-2 6-13 3-11-3l0-8Zm5 14-2 5m-4-1 8 2M5 8l12 4m3 3 2 3"/>',
 mask:'<path d="M3 5c6-3 12-3 18 0v7c0 6-9 10-9 10S3 18 3 12V5Z"/><path d="m6 9 4 2m8-2-4 2m-5 6h6"/>',
 smoke:'<path d="M3 18h18M6 14c-8-6 8-5 2-12m5 13c-7-6 9-7 3-12m2 13c-4-4 6-4 3-8M7 22h10"/>',
 thorn:'<path d="M12 22V5m0 11L4 9m8 3 8-7M4 9l1-6 6 3m9-1-1 7-5 2M12 5l-3-3m3 18 5-2"/>',
 whisper:'<path d="m4 6 4 3 4-6 4 6 4-3-2 9H6L4 6Zm2 13h12m-10 3h8M2 11v3m20-3v3"/>',
 tower:'<path d="M6 22V8l6-6 6 6v14M3 22h18M9 11h6m-6 4h6m-3 4v3M4 8h16"/>',
 bell:'<path d="M5 17V9a7 7 0 0 1 14 0v8l3 2H2l3-2Zm4 5h6M12 2V0M9 6h3"/>',
 links:'<circle cx="8" cy="12" r="6"/><circle cx="16" cy="12" r="6"/><path d="M12 2v3m0 14v3"/>',
 flask:'<path d="M8 2h8m-6 0v7L3 20q-1 2 2 2h14q3 0 2-2L14 9V2M6 16h12m-8 3h1m3-7h1"/>',
 gate:'<path d="M3 22V4h18v18M1 4h22M8 4v18M16 4v18M3 10h18m-18 7h18m-9-7v7"/>',
 hollow:'<path d="M1 12S5 5 12 5s11 7 11 7-4 7-11 7S1 12 1 12Z"/><path d="m12 7-3 5 3 5 3-5-3-5ZM12 1v2m0 18v2"/>',
 twin:'<path d="M1 8s3-5 6-5 6 5 6 5-3 5-6 5-6-5-6-5Zm10 8s3-5 6-5 6 5 6 5-3 5-6 5-6-5-6-5Z"/><circle cx="7" cy="8" r="1"/><circle cx="17" cy="16" r="1"/>',
 compass:'<circle cx="12" cy="12" r="9"/><path d="m12 3 3 11-3-2-3 2 3-11Zm0 9v9M3 12h3m12 0h3"/>',
 back:'<path d="M4 8a9 9 0 1 1-1 8M3 2v7h7m2-3v7l5 3"/>',
 scope:'<path d="m3 11 15-8 4 7-15 8-4-7Zm9 3v8m-6 0h12M15 5l4 7M1 12l4 7"/>'
};
export function sigil(key){
 if(!Object.hasOwn(SYMBOLS,key))throw Error('Unknown character symbol: '+key);
 return `<svg class="icon" data-symbol="${key}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${SYMBOLS[key]}</svg>`;
}
export function emblem(key,large=false){
 if(!Object.hasOwn(SYMBOLS,key))throw Error('Unknown character symbol: '+key);
 return `<svg class="portrait role-emblem${large?' large':''}" data-symbol="${key}" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="48" fill="#182322" stroke="currentColor"/><circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" opacity=".25"/><path d="m50 3 3 6-3 6-3-6Zm0 82 3 6-3 6-3-6Z" fill="currentColor" opacity=".55"/><g transform="translate(24 24) scale(2.1667)" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">${SYMBOLS[key]}</g></svg>`;
}
