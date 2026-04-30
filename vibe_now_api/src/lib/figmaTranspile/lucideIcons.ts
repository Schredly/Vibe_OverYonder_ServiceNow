// Tiny inline registry of common Lucide icons. Each entry is the SVG path
// content (children of the <svg> element) — the wrapper <svg> is emitted by
// `renderLucideIcon` with consistent attrs.
//
// We don't pull in `lucide` or `lucide-static` as a dep because the full
// catalog is ~1500 icons / many MB. The registry below covers the icons that
// turn up most often in Figma Make exports (search bars, dropdowns, common
// actions, social-style avatars). Anything not in the registry falls back to
// a placeholder square so the layout doesn't shift.
//
// Source: lucide-icons/lucide (ISC license). All icons stroke="currentColor".

const ICON_PATHS: Record<string, string> = {
  // Navigation / arrows
  'ArrowLeft': '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  'ArrowRight': '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  'ArrowUp': '<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>',
  'ArrowDown': '<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>',
  'ChevronLeft': '<path d="m15 18-6-6 6-6"/>',
  'ChevronRight': '<path d="m9 18 6-6-6-6"/>',
  'ChevronUp': '<path d="m18 15-6-6-6 6"/>',
  'ChevronDown': '<path d="m6 9 6 6 6-6"/>',
  'ChevronsUpDown':
    '<path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/>',
  'Menu': '<line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>',
  // Common actions
  'Search':
    '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  'X': '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  'Plus': '<path d="M5 12h14"/><path d="M12 5v14"/>',
  'Minus': '<path d="M5 12h14"/>',
  'Check': '<path d="M20 6 9 17l-5-5"/>',
  'CheckCircle': '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>',
  'Filter': '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
  'MoreHorizontal':
    '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  'MoreVertical':
    '<circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>',
  // Status / alerts
  'Bell':
    '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  'AlertCircle': '<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>',
  'AlertTriangle':
    '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/>',
  'Info':
    '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  'CircleAlert': '<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>',
  // People / objects
  'User':
    '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  'Users':
    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  'Heart':
    '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/>',
  'Mail':
    '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  'Phone':
    '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  'Calendar':
    '<rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>',
  'Clock':
    '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  'MapPin':
    '<path d="M20 10c0 7-8 13-8 13s-8-6-8-13a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  'Settings':
    '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  'Home':
    '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  'ShoppingBasket':
    '<path d="m5 11 4-7"/><path d="m19 11-4-7"/><path d="M2 11h20"/><path d="m3.5 11 1.6 7.4a2 2 0 0 0 2 1.6h9.8c.9 0 1.8-.7 2-1.6l1.7-7.4"/><path d="M4.5 15.5h15"/><path d="m7 11 1 9"/><path d="m17 11-1 9"/><path d="M12 11v9"/>',
  'Briefcase':
    '<rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  'FileText':
    '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/>',
  'Eye':
    '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  'Star':
    '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  'TrendingUp':
    '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
  'Activity':
    '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
  'Database':
    '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>',
  'BarChart':
    '<line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/>',
  'Egg':
    '<path d="M12 22c-4.4 0-8-3.13-8-8 0-3.5 2.5-7.5 5-10.5C10.4 1.83 11.2 1 12 1s1.6.83 3 2.5c2.5 3 5 7 5 10.5 0 4.87-3.6 8-8 8z"/>',
};

export function renderLucideIcon(name: string, classNames = ''): string {
  const path = ICON_PATHS[name];
  const cls = classNames ? ` class="${classNames}"` : '';
  // Standard Lucide attrs: 24x24 viewBox, currentColor stroke, 2-unit width.
  const attrs = `xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"${cls} data-lucide="${name}"`;
  if (path) {
    return `<svg ${attrs}>${path}</svg>`;
  }
  // Fallback for icons we don't have in the registry — keep the layout slot
  // intact, mark with a clear data attribute so it's findable in dev.
  return `<svg ${attrs} data-lucide-fallback="true"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>`;
}

export function isKnownLucideIcon(name: string): boolean {
  return Object.prototype.hasOwnProperty.call(ICON_PATHS, name);
}
