// Map shadcn/ui component names to plain HTML tags. The shadcn library is
// React + Radix; we can't ship it inside an AngularJS widget. Instead we
// emit minimal HTML equivalents that preserve layout and composition. The
// compiled Tailwind CSS (M3) carries the styling, and the user's Figma
// utility-class soup applies normally.
//
// Components that have meaningful internal structure (Dialog, DropdownMenu,
// Accordion, Tabs, Sheet) need stateful behavior — we emit them as
// containers and drop the interactive layer for v1. Buttons, Cards, Inputs,
// Labels, Badges, Separators all map cleanly.

interface ShadcnShim {
  /** HTML tag name to emit. */
  tag: string;
  /** Whether the component is self-closing (void). */
  voidTag?: boolean;
  /** Class additions to prepend to whatever class= the user passed. */
  extraClass?: string;
  /** Optional data-attribute to make the shim findable for debugging. */
  marker?: string;
}

const SHIMS: Record<string, ShadcnShim> = {
  // Most-used in Figma Make output
  Button: { tag: 'button', extraClass: 'shadcn-button' },
  Card: { tag: 'div', extraClass: 'shadcn-card' },
  CardHeader: { tag: 'div', extraClass: 'shadcn-card-header' },
  CardTitle: { tag: 'h3', extraClass: 'shadcn-card-title' },
  CardDescription: { tag: 'p', extraClass: 'shadcn-card-description' },
  CardContent: { tag: 'div', extraClass: 'shadcn-card-content' },
  CardFooter: { tag: 'div', extraClass: 'shadcn-card-footer' },
  Input: { tag: 'input', voidTag: true, extraClass: 'shadcn-input' },
  Textarea: { tag: 'textarea', extraClass: 'shadcn-textarea' },
  Label: { tag: 'label', extraClass: 'shadcn-label' },
  Badge: { tag: 'span', extraClass: 'shadcn-badge' },
  Separator: { tag: 'hr', voidTag: true, extraClass: 'shadcn-separator' },
  Avatar: { tag: 'div', extraClass: 'shadcn-avatar' },
  AvatarImage: { tag: 'img', voidTag: true, extraClass: 'shadcn-avatar-image' },
  AvatarFallback: { tag: 'span', extraClass: 'shadcn-avatar-fallback' },
  Switch: {
    tag: 'button',
    extraClass: 'shadcn-switch',
    marker: 'switch',
  },
  Checkbox: { tag: 'input', voidTag: true, extraClass: 'shadcn-checkbox', marker: 'checkbox' },
  RadioGroup: { tag: 'div', extraClass: 'shadcn-radio-group' },
  RadioGroupItem: { tag: 'input', voidTag: true, extraClass: 'shadcn-radio', marker: 'radio' },

  // Stateful primitives — emit as plain containers; behaviour drops to v2.
  Dialog: { tag: 'div', extraClass: 'shadcn-dialog' },
  DialogTrigger: { tag: 'button', extraClass: 'shadcn-dialog-trigger' },
  DialogContent: { tag: 'div', extraClass: 'shadcn-dialog-content' },
  DialogHeader: { tag: 'div', extraClass: 'shadcn-dialog-header' },
  DialogTitle: { tag: 'h2', extraClass: 'shadcn-dialog-title' },
  DialogDescription: { tag: 'p', extraClass: 'shadcn-dialog-description' },
  DialogFooter: { tag: 'div', extraClass: 'shadcn-dialog-footer' },

  Sheet: { tag: 'div', extraClass: 'shadcn-sheet' },
  SheetTrigger: { tag: 'button', extraClass: 'shadcn-sheet-trigger' },
  SheetContent: { tag: 'div', extraClass: 'shadcn-sheet-content' },
  SheetHeader: { tag: 'div', extraClass: 'shadcn-sheet-header' },

  Tabs: { tag: 'div', extraClass: 'shadcn-tabs' },
  TabsList: { tag: 'div', extraClass: 'shadcn-tabs-list' },
  TabsTrigger: { tag: 'button', extraClass: 'shadcn-tab-trigger' },
  TabsContent: { tag: 'div', extraClass: 'shadcn-tab-content' },

  Accordion: { tag: 'div', extraClass: 'shadcn-accordion' },
  AccordionItem: { tag: 'div', extraClass: 'shadcn-accordion-item' },
  AccordionTrigger: { tag: 'button', extraClass: 'shadcn-accordion-trigger' },
  AccordionContent: { tag: 'div', extraClass: 'shadcn-accordion-content' },

  DropdownMenu: { tag: 'div', extraClass: 'shadcn-dropdown' },
  DropdownMenuTrigger: { tag: 'button', extraClass: 'shadcn-dropdown-trigger' },
  DropdownMenuContent: { tag: 'div', extraClass: 'shadcn-dropdown-content' },
  DropdownMenuItem: { tag: 'div', extraClass: 'shadcn-dropdown-item' },
  DropdownMenuLabel: { tag: 'div', extraClass: 'shadcn-dropdown-label' },
  DropdownMenuSeparator: { tag: 'hr', voidTag: true, extraClass: 'shadcn-dropdown-separator' },
  DropdownMenuGroup: { tag: 'div', extraClass: 'shadcn-dropdown-group' },

  Select: { tag: 'div', extraClass: 'shadcn-select' },
  SelectTrigger: { tag: 'button', extraClass: 'shadcn-select-trigger' },
  SelectValue: { tag: 'span', extraClass: 'shadcn-select-value' },
  SelectContent: { tag: 'div', extraClass: 'shadcn-select-content' },
  SelectItem: { tag: 'div', extraClass: 'shadcn-select-item' },
  SelectGroup: { tag: 'div', extraClass: 'shadcn-select-group' },
  SelectLabel: { tag: 'div', extraClass: 'shadcn-select-label' },

  Tooltip: { tag: 'span', extraClass: 'shadcn-tooltip' },
  TooltipTrigger: { tag: 'span', extraClass: 'shadcn-tooltip-trigger' },
  TooltipContent: { tag: 'span', extraClass: 'shadcn-tooltip-content' },
  TooltipProvider: { tag: 'div', extraClass: 'shadcn-tooltip-provider' },

  Popover: { tag: 'div', extraClass: 'shadcn-popover' },
  PopoverTrigger: { tag: 'button', extraClass: 'shadcn-popover-trigger' },
  PopoverContent: { tag: 'div', extraClass: 'shadcn-popover-content' },

  ScrollArea: { tag: 'div', extraClass: 'shadcn-scroll-area' },
  ScrollBar: { tag: 'div', extraClass: 'shadcn-scroll-bar' },
  AspectRatio: { tag: 'div', extraClass: 'shadcn-aspect-ratio' },
  Progress: { tag: 'div', extraClass: 'shadcn-progress' },
  Skeleton: { tag: 'div', extraClass: 'shadcn-skeleton' },
  Toggle: { tag: 'button', extraClass: 'shadcn-toggle' },
  ToggleGroup: { tag: 'div', extraClass: 'shadcn-toggle-group' },
  Slider: { tag: 'input', voidTag: true, extraClass: 'shadcn-slider', marker: 'slider' },
};

export function getShadcnShim(componentName: string): ShadcnShim | undefined {
  return SHIMS[componentName];
}

export function isShadcnComponent(componentName: string): boolean {
  return Object.prototype.hasOwnProperty.call(SHIMS, componentName);
}
