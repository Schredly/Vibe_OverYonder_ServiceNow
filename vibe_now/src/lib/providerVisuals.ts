// Per-provider visual identity for cost-tracking surfaces. Keyed by provider id
// so the dynamic provider registry (vibe_now_api/src/lib/llm/) can plug new
// entries in without UI changes — unknown ids fall back to a neutral palette.
//
// Hex colors stay inline (rather than CSS tokens) because each provider has a
// recognizable brand color that's part of the chip's identity. The chip class
// is ready to compose with other Tailwind utilities.

export interface ProviderVisuals {
  dot: string;
  chipClass: string;
}

const FALLBACK: ProviderVisuals = {
  dot: '#6B6862',
  chipClass: 'bg-[var(--bg-hover)] text-[var(--text-secondary)]',
};

const REGISTRY: Record<string, ProviderVisuals> = {
  OpenAI: {
    dot: '#10A37F',
    chipClass:
      'bg-[#D1FAE5] text-[#065F46] dark:bg-[#1E4D2B] dark:text-[#A3E8C1]',
  },
  Anthropic: {
    dot: '#FF6B35',
    chipClass:
      'bg-[#FFF0EB] text-[#E55A2B] dark:bg-[#3D2418] dark:text-[#FF7F52]',
  },
  xAI: FALLBACK,
};

export function providerVisuals(provider: string): ProviderVisuals {
  return REGISTRY[provider] ?? FALLBACK;
}

export function registerProviderVisuals(provider: string, visuals: ProviderVisuals): void {
  REGISTRY[provider] = visuals;
}
