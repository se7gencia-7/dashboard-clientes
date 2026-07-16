// Configuração central de todos os clientes da agência.
// Cada cliente define seu próprio funil, labels e metas.
// A dashboard universal lê daqui para renderizar corretamente.

export type MetricId =
  | 'spend'
  | 'impressions'
  | 'reach'
  | 'clicks'
  | 'ctr'
  | 'cpm'
  | 'frequency'
  | 'lpv'
  | 'connect_rate'
  | 'conversions'
  | 'cpa'
  | 'purchases'
  | 'initiate_checkout'
  | 'checkout_rate'
  | 'revenue'
  | 'roas';

export interface FunnelStep {
  metric:  MetricId;
  label:   string;   // label customizado para o cliente
  color:   string;   // cor do passo no funil
  format?: 'brl' | 'pct' | 'num' | 'x' | 'brl_per_unit';
}

export interface ProjectSplit {
  id:       string;
  name:     string;
  patterns: string[]; // [] = todas as campanhas
}

export interface ClientConfig {
  accountId:        string;          // sem 'act_'
  name:             string;
  slug:             string;          // usado na URL /admin/clientes/[slug]
  conversionLabel:  string;          // "Leads" | "Matrículas" | "Compras"
  conversionType:   'lead' | 'purchase';
  funnel:           FunnelStep[];
  goal?:            { label: string; value: number }; // ex: CPL alvo
  projects?:        ProjectSplit[];
  currency?:        'BRL' | 'USD' | 'EUR';
}

// ── Paleta compartilhada ───────────────────────────────────────────────────────
const BLUE   = '#3B82F6';
const PURPLE = '#8B5CF6';
const ORANGE = '#F97316';
const GREEN  = '#22C55E';
const TEAL   = '#14B8A6';
const PINK   = '#EC4899';

// ── Configs dos clientes ───────────────────────────────────────────────────────

export const CLIENT_CONFIGS: ClientConfig[] = [

  // ── Sevilha Educação ─────────────────────────────────────────────────────────
  {
    accountId:       '3451731371506645',
    name:            'Sevilha Educação',
    slug:            'sevilha',
    conversionLabel: 'Matrículas',
    conversionType:  'lead',
    goal:            { label: 'Custo por Matrícula', value: 80 },
    funnel: [
      { metric: 'clicks',       label: 'Cliques',           color: BLUE,   format: 'num' },
      { metric: 'ctr',          label: 'CTR',               color: BLUE,   format: 'pct' },
      { metric: 'cpm',          label: 'CPM',               color: PURPLE, format: 'brl' },
      { metric: 'frequency',    label: 'Frequência',        color: PURPLE, format: 'x'   },
      { metric: 'lpv',          label: 'Viz. de Página',    color: ORANGE, format: 'num' },
      { metric: 'connect_rate', label: 'Connect Rate',      color: ORANGE, format: 'pct' },
      { metric: 'conversions',  label: 'Matrículas',        color: GREEN,  format: 'num' },
      { metric: 'cpa',          label: 'Custo/Matrícula',   color: GREEN,  format: 'brl' },
    ],
  },

  // ── Harmonie Móveis ───────────────────────────────────────────────────────────
  {
    accountId:       '2495058154022501',
    name:            'Harmonie Móveis',
    slug:            'harmonie',
    conversionLabel: 'Leads',
    conversionType:  'lead',
    goal:            { label: 'Custo por Lead', value: 30 },
    funnel: [
      { metric: 'impressions',  label: 'Impressões',        color: BLUE,   format: 'num' },
      { metric: 'reach',        label: 'Alcance',           color: BLUE,   format: 'num' },
      { metric: 'clicks',       label: 'Cliques',           color: PURPLE, format: 'num' },
      { metric: 'ctr',          label: 'CTR',               color: PURPLE, format: 'pct' },
      { metric: 'cpm',          label: 'CPM',               color: ORANGE, format: 'brl' },
      { metric: 'conversions',  label: 'Leads',             color: GREEN,  format: 'num' },
      { metric: 'cpa',          label: 'Custo por Lead',    color: GREEN,  format: 'brl' },
      { metric: 'spend',        label: 'Investimento',      color: TEAL,   format: 'brl' },
    ],
  },

  // ── VIS - Victory International School ───────────────────────────────────────
  {
    accountId:       '950916826896681',
    name:            'Victory International School',
    slug:            'vis',
    conversionLabel: 'Inscrições',
    conversionType:  'lead',
    goal:            { label: 'Custo por Inscrição', value: 60 },
    projects: [
      { id: 'vis',    name: 'VIS',    patterns: ['VIS'] },
      { id: 'outros', name: 'Outros', patterns: [] },
    ],
    funnel: [
      { metric: 'clicks',       label: 'Cliques',           color: BLUE,   format: 'num' },
      { metric: 'ctr',          label: 'CTR',               color: BLUE,   format: 'pct' },
      { metric: 'cpm',          label: 'CPM',               color: PURPLE, format: 'brl' },
      { metric: 'lpv',          label: 'Viz. de Página',    color: ORANGE, format: 'num' },
      { metric: 'connect_rate', label: 'Connect Rate',      color: ORANGE, format: 'pct' },
      { metric: 'conversions',  label: 'Inscrições',        color: GREEN,  format: 'num' },
      { metric: 'cpa',          label: 'Custo/Inscrição',   color: GREEN,  format: 'brl' },
      { metric: 'spend',        label: 'Investimento',      color: TEAL,   format: 'brl' },
    ],
  },

  // ── iBUILD Aruja ──────────────────────────────────────────────────────────────
  {
    accountId:       '1315037492835283',
    name:            'iBUILD Arujá',
    slug:            'ibuild',
    conversionLabel: 'Leads',
    conversionType:  'lead',
    goal:            { label: 'Custo por Lead', value: 40 },
    funnel: [
      { metric: 'impressions',  label: 'Impressões',        color: BLUE,   format: 'num' },
      { metric: 'clicks',       label: 'Cliques',           color: BLUE,   format: 'num' },
      { metric: 'ctr',          label: 'CTR',               color: PURPLE, format: 'pct' },
      { metric: 'cpm',          label: 'CPM',               color: PURPLE, format: 'brl' },
      { metric: 'lpv',          label: 'Viz. de Página',    color: ORANGE, format: 'num' },
      { metric: 'connect_rate', label: 'Connect Rate',      color: ORANGE, format: 'pct' },
      { metric: 'conversions',  label: 'Leads',             color: GREEN,  format: 'num' },
      { metric: 'cpa',          label: 'Custo por Lead',    color: GREEN,  format: 'brl' },
    ],
  },

  // ── Faculdade Dunamis ─────────────────────────────────────────────────────────
  {
    accountId:       '2811845625867130',
    name:            'Faculdade Dunamis',
    slug:            'faculdade-dunamis',
    conversionLabel: 'Inscrições',
    conversionType:  'lead',
    goal:            { label: 'Custo por Inscrição', value: 90 },
    projects: [
      { id: 'seminario',  name: 'Seminário de Teologia', patterns: ['SEMINÁRIO', 'SEMINARIO', 'TEOLOGIA'] },
      { id: 'vta',        name: 'Volta às Aulas',        patterns: ['VOLTA', 'VTA', 'AULAS']             },
      { id: 'pedagogia',  name: 'Volta Pedagogia',       patterns: ['PEDAGOGIA', 'PED']                  },
    ],
    funnel: [
      { metric: 'clicks',       label: 'Cliques',           color: BLUE,   format: 'num' },
      { metric: 'ctr',          label: 'CTR',               color: BLUE,   format: 'pct' },
      { metric: 'frequency',    label: 'Frequência',        color: PURPLE, format: 'x'   },
      { metric: 'lpv',          label: 'Viz. de Página',    color: ORANGE, format: 'num' },
      { metric: 'connect_rate', label: 'Connect Rate',      color: ORANGE, format: 'pct' },
      { metric: 'conversions',  label: 'Inscrições',        color: GREEN,  format: 'num' },
      { metric: 'cpa',          label: 'Custo/Inscrição',   color: GREEN,  format: 'brl' },
      { metric: 'spend',        label: 'Investimento',      color: TEAL,   format: 'brl' },
    ],
  },

  // ── Fernando Guerreiro ────────────────────────────────────────────────────────
  {
    accountId:       '558375403718941',
    name:            'Fernando Guerreiro',
    slug:            'fernando-guerreiro',
    conversionLabel: 'Leads',
    conversionType:  'lead',
    goal:            { label: 'Custo por Lead', value: 25 },
    funnel: [
      { metric: 'clicks',       label: 'Cliques',           color: BLUE,   format: 'num' },
      { metric: 'ctr',          label: 'CTR',               color: BLUE,   format: 'pct' },
      { metric: 'cpm',          label: 'CPM',               color: PURPLE, format: 'brl' },
      { metric: 'frequency',    label: 'Frequência',        color: PURPLE, format: 'x'   },
      { metric: 'lpv',          label: 'Viz. de Página',    color: ORANGE, format: 'num' },
      { metric: 'connect_rate', label: 'Connect Rate',      color: ORANGE, format: 'pct' },
      { metric: 'conversions',  label: 'Leads',             color: GREEN,  format: 'num' },
      { metric: 'cpa',          label: 'Custo por Lead',    color: GREEN,  format: 'brl' },
    ],
  },

  // ── Itop Idiomas ─────────────────────────────────────────────────────────────
  {
    accountId:       '293316019128345',
    name:            'Itop Idiomas',
    slug:            'itop',
    conversionLabel: 'Matrículas',
    conversionType:  'lead',
    goal:            { label: 'Custo por Matrícula', value: 70 },
    funnel: [
      { metric: 'clicks',       label: 'Cliques',           color: BLUE,   format: 'num' },
      { metric: 'ctr',          label: 'CTR',               color: BLUE,   format: 'pct' },
      { metric: 'cpm',          label: 'CPM',               color: PURPLE, format: 'brl' },
      { metric: 'lpv',          label: 'Viz. de Página',    color: ORANGE, format: 'num' },
      { metric: 'connect_rate', label: 'Connect Rate',      color: ORANGE, format: 'pct' },
      { metric: 'conversions',  label: 'Matrículas',        color: GREEN,  format: 'num' },
      { metric: 'cpa',          label: 'Custo/Matrícula',   color: GREEN,  format: 'brl' },
      { metric: 'spend',        label: 'Investimento',      color: TEAL,   format: 'brl' },
    ],
  },

  // ── CA - Dr. Mauro Bombonatti ─────────────────────────────────────────────────
  {
    accountId:       '556399153936976',
    name:            'Dr. Mauro Bombonatti',
    slug:            'mauro-bombonatti',
    conversionLabel: 'Leads',
    conversionType:  'lead',
    goal:            { label: 'Custo por Lead', value: 35 },
    funnel: [
      { metric: 'impressions',  label: 'Impressões',        color: BLUE,   format: 'num' },
      { metric: 'clicks',       label: 'Cliques',           color: BLUE,   format: 'num' },
      { metric: 'ctr',          label: 'CTR',               color: PURPLE, format: 'pct' },
      { metric: 'cpm',          label: 'CPM',               color: PURPLE, format: 'brl' },
      { metric: 'lpv',          label: 'Viz. de Página',    color: ORANGE, format: 'num' },
      { metric: 'conversions',  label: 'Leads',             color: GREEN,  format: 'num' },
      { metric: 'cpa',          label: 'Custo por Lead',    color: GREEN,  format: 'brl' },
      { metric: 'spend',        label: 'Investimento',      color: TEAL,   format: 'brl' },
    ],
  },

  // ── Jeniffer Cazelato ─────────────────────────────────────────────────────────
  {
    accountId:       '1553439428340578',
    name:            'Jeniffer Cazelato',
    slug:            'jeniffer',
    conversionLabel: 'Leads',
    conversionType:  'lead',
    goal:            { label: 'Custo por Lead', value: 45 },
    funnel: [
      { metric: 'clicks',       label: 'Cliques',           color: BLUE,   format: 'num' },
      { metric: 'ctr',          label: 'CTR',               color: BLUE,   format: 'pct' },
      { metric: 'cpm',          label: 'CPM',               color: PURPLE, format: 'brl' },
      { metric: 'frequency',    label: 'Frequência',        color: PURPLE, format: 'x'   },
      { metric: 'lpv',          label: 'Viz. de Página',    color: ORANGE, format: 'num' },
      { metric: 'connect_rate', label: 'Connect Rate',      color: ORANGE, format: 'pct' },
      { metric: 'conversions',  label: 'Leads',             color: GREEN,  format: 'num' },
      { metric: 'cpa',          label: 'Custo por Lead',    color: GREEN,  format: 'brl' },
    ],
  },

  // ── G5.2 - Zion São Paulo ─────────────────────────────────────────────────────
  {
    accountId:       '762258999340720',
    name:            'Zion São Paulo',
    slug:            'zion-sp',
    conversionLabel: 'Leads',
    conversionType:  'lead',
    goal:            { label: 'Custo por Lead', value: 20 },
    projects: [
      { id: 'lumen26', name: 'LUMEN26', patterns: ['LUMEN26', 'LUMEN'] },
      { id: 'outros',  name: 'Outros',  patterns: [] },
    ],
    funnel: [
      { metric: 'reach',        label: 'Alcance',           color: BLUE,   format: 'num' },
      { metric: 'impressions',  label: 'Impressões',        color: BLUE,   format: 'num' },
      { metric: 'frequency',    label: 'Frequência',        color: PURPLE, format: 'x'   },
      { metric: 'cpm',          label: 'CPM',               color: PURPLE, format: 'brl' },
      { metric: 'clicks',       label: 'Cliques',           color: ORANGE, format: 'num' },
      { metric: 'ctr',          label: 'CTR',               color: ORANGE, format: 'pct' },
      { metric: 'conversions',  label: 'Leads',             color: GREEN,  format: 'num' },
      { metric: 'cpa',          label: 'Custo por Lead',    color: GREEN,  format: 'brl' },
    ],
  },

  // ── Dunamis Movimento ────────────────────────────────────────────────────────
  {
    accountId:       '1248776741801685',
    name:            'Dunamis Movimento',
    slug:            'dunamis-movimento',
    conversionLabel: 'Compras',
    conversionType:  'purchase',
    goal:            { label: 'Custo por Compra', value: 30 },
    projects: [
      { id: 'fornalha',     name: 'FORNALHA',     patterns: ['FORNALHA', 'FORNO']            },
      { id: 'dc26',         name: "DC'26",         patterns: ["DC'26", 'DC26', "DC '26"]      },
      { id: 'preparatorio', name: 'PREPARATÓRIO',  patterns: ['PREPARATÓRIO', 'PREPARATORIO'] },
    ],
    funnel: [
      { metric: 'clicks',            label: 'Cliques',           color: BLUE,   format: 'num' },
      { metric: 'ctr',               label: 'CTR',               color: BLUE,   format: 'pct' },
      { metric: 'cpm',               label: 'CPM',               color: PURPLE, format: 'brl' },
      { metric: 'lpv',               label: 'Viz. de Página',    color: ORANGE, format: 'num' },
      { metric: 'initiate_checkout', label: 'Initiate Checkout', color: ORANGE, format: 'num' },
      { metric: 'purchases',         label: 'Compras',           color: GREEN,  format: 'num' },
      { metric: 'cpa',               label: 'Custo/Compra',      color: GREEN,  format: 'brl' },
      { metric: 'spend',             label: 'Investimento',      color: TEAL,   format: 'brl' },
    ],
  },

  // ── Tropical Brasil ───────────────────────────────────────────────────────────
  {
    accountId:       '689047728541912',
    name:            'Tropical Brasil',
    slug:            'tropical',
    conversionLabel: 'Leads',
    conversionType:  'lead',
    goal:            { label: 'Custo por Lead', value: 30 },
    funnel: [
      { metric: 'impressions',  label: 'Impressões',        color: BLUE,   format: 'num' },
      { metric: 'clicks',       label: 'Cliques',           color: BLUE,   format: 'num' },
      { metric: 'ctr',          label: 'CTR',               color: PURPLE, format: 'pct' },
      { metric: 'cpm',          label: 'CPM',               color: PURPLE, format: 'brl' },
      { metric: 'lpv',          label: 'Viz. de Página',    color: ORANGE, format: 'num' },
      { metric: 'connect_rate', label: 'Connect Rate',      color: ORANGE, format: 'pct' },
      { metric: 'conversions',  label: 'Leads',             color: GREEN,  format: 'num' },
      { metric: 'cpa',          label: 'Custo por Lead',    color: GREEN,  format: 'brl' },
    ],
  },

];

// ── Lookup helpers ─────────────────────────────────────────────────────────────

export function getConfigBySlug(slug: string): ClientConfig | undefined {
  return CLIENT_CONFIGS.find(c => c.slug === slug);
}

export function getConfigByAccountId(accountId: string): ClientConfig | undefined {
  return CLIENT_CONFIGS.find(c => c.accountId === accountId);
}
