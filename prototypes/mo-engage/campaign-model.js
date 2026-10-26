
export const MAX_BYTES=10*1024*1024;
export function fileError(file,existing){
 if(existing.length>=8)return 'You can add up to 8 assets.';
 if(!/\.(png|jpe?g|webp|gif|pdf|docx?)$/i.test(file.name))return 'Choose a PNG, JPG, WebP, GIF, PDF, DOC or DOCX file.';
 if(file.size>MAX_BYTES)return 'This file exceeds the 10 MB limit.';
 if(!file.size)return 'This file is empty.';
 if(existing.some(x=>x.name===file.name&&x.size===file.size))return 'This file has already been added.';
 return '';
}
export function canReview(assets){return assets.length>0&&assets.every(x=>x.ready);}
export function escapeText(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
