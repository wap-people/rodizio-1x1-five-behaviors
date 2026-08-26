/**
 * Ícones SVG inline no traço da Lucide. Inline e não CDN por dois motivos:
 * a rede corporativa não é obstáculo e o ícone aparece junto com o HTML,
 * sem pisca-pisca. Regra da casa: nunca emoji como ícone funcional.
 *
 * Uso no markup:  <span data-ic="check" data-sz="16"></span>
 * Depois de injetar HTML, chame paintIcons(container).
 */
export const ICONS = {
  user:     '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  users:    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  calendar: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  grid:     '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
  check:    '<path d="M20 6 9 17l-5-5"/>',
  clock:    '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  video:    '<path d="m16 12 5.2-3.5a.5.5 0 0 1 .8.4v6.2a.5.5 0 0 1-.8.4L16 12Z"/><rect x="2" y="6" width="14" height="12" rx="2"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
  external: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  search:   '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  copy:     '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  alert:    '<path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  x:        '<path d="M18 6 6 18M6 6l12 12"/>',
  mail:     '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 5L2 7"/>',
  chat:     '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  filetext: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v5h6"/><path d="M8 13h8M8 17h5"/>',
  chevron:  '<path d="m6 9 6 6 6-6"/>',
  refresh:  '<path d="M3 12a9 9 0 0 1 15.3-6.4L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.3 6.4L3 16"/><path d="M3 21v-5h5"/>',
  contrast: '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor" stroke="none"/>',
  arrow:    '<path d="M5 12h14M13 6l6 6-6 6"/>',
  logout:   '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  chart:    '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M7 15l4-5 3 3 5-7"/>',
  calx:     '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="m14 14-4 4M10 14l4 4"/>',
  undo:     '<path d="M3 7v6h6"/><path d="M3 13a9 9 0 1 0 3-7.7L3 8"/>',
  cloud:    '<path d="M17.5 19a4.5 4.5 0 0 0 .5-9 6 6 0 0 0-11.7 1.5A3.5 3.5 0 0 0 6.5 19z"/>'
};

export function paintIcons(root = document) {
  root.querySelectorAll('[data-ic]').forEach((el) => {
    const name = el.dataset.ic;
    const size = parseInt(el.dataset.sz || '15', 10);
    el.outerHTML =
      `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" ` +
      `stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none">` +
      `${ICONS[name] || ''}</svg>`;
  });
}
