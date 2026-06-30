import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  ArrowLeftRight,
  ArrowUpDown,
  BarChart3,
  BookOpen,
  Building2,
  Calculator,
  FileSpreadsheet,
  FileText,
  Gauge,
  GitBranch,
  Inbox,
  Layers,
  LayoutDashboard,
  LineChart,
  Archive,
  Megaphone,
  Package,
  Package2,
  PackageCheck,
  Pause,
  Percent,
  PiggyBank,
  Plug,
  RefreshCw,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Table2,
  Tag,
  Tags,
  Target,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";

export interface NavItem {
  id: string;
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: "aprovacoes";
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Visão Geral",
    items: [
      { id: "dashboard", href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "painel", href: "/painel", label: "Painel Estratégico", icon: Gauge },
    ],
  },
  {
    label: "Compras",
    items: [
      { id: "produtos", href: "/produtos", label: "Produtos", icon: Package },
      { id: "gestao-fornecedores", href: "/gestao-fornecedores", label: "Gestão de Fornecedores", icon: Building2 },
      { id: "carteira", href: "/carteira", label: "Carteira Compradores", icon: Users },
      { id: "produtos-a-comprar", href: "/produtos-a-comprar", label: "Produtos a Comprar", icon: ShoppingCart },
      { id: "pedidos-compras", href: "/pedidos-compras", label: "Pedidos de Compra", icon: FileText },
      { id: "entrada-mercadorias", href: "/entrada-mercadorias", label: "Entrada de Mercadorias", icon: PackageCheck },
      { id: "historico-notas", href: "/historico-notas", label: "Histórico de NF-e / CT-e", icon: Archive },
      { id: "aprovacoes", href: "/aprovacoes", label: "Aprovações", icon: ShieldCheck, badge: "aprovacoes" },
      { id: "cobertura", href: "/cobertura", label: "Cobertura", icon: ShieldCheck },
      { id: "historico-precos", href: "/historico-precos", label: "Histórico de Preços", icon: LineChart },
      { id: "drp-distribuicao", href: "/drp-distribuicao", label: "DRP · Distribuição", icon: GitBranch },
    ],
  },
  {
    label: "Precificação",
    items: [
      { id: "precificacao-pendencias", href: "/precificacao/pendencias", label: "Central de Pendências", icon: Inbox },
      { id: "precificacao-custo", href: "/precificacao/custo-real", label: "Custo Real", icon: Calculator },
      { id: "precificacao-precos", href: "/precificacao/precos", label: "Tabelas de Preço", icon: Tags },
      { id: "precificacao-import", href: "/precificacao/import", label: "Import de Fornecedor", icon: FileSpreadsheet },
      { id: "precificacao-tabelas", href: "/precificacao/tabelas", label: "Tabelas de Fornecedores", icon: Table2 },
    ],
  },
  {
    label: "Ferramentas",
    items: [
      { id: "ferramentas-calc", href: "/ferramentas/calculadora", label: "Calculadora de Preços", icon: Calculator },
      { id: "ferramentas-nfe", href: "/ferramentas/nfe", label: "Conversor NF-e", icon: FileText },
      { id: "ferramentas-fretedim", href: "/ferramentas/frete-dimensional", label: "Frete Dimensional", icon: Truck },
      { id: "ferramentas-analise", href: "/ferramentas/analise-financeira", label: "Análise Financeira", icon: BarChart3 },
      { id: "ferramentas-transferencia", href: "/ferramentas/transferencia", label: "Transferência via Excel", icon: ArrowLeftRight },
    ],
  },
  {
    label: "Relatórios",
    items: [
      { id: "campanhas", href: "/relatorios/campanhas", label: "Nexus Campanhas", icon: Megaphone },
      { id: "no-moving", href: "/relatorios/no-moving", label: "No-Moving Produtos", icon: Pause },
      { id: "liquidacao", href: "/relatorios/liquidacao", label: "Liquidação de Estoque", icon: Tag },
      { id: "excesso", href: "/relatorios/excesso", label: "Excesso de Estoque", icon: Package2 },
      { id: "ruptura", href: "/relatorios/ruptura", label: "Ruptura de Estoque", icon: AlertTriangle },
      { id: "analise-movimentacao", href: "/relatorios/movimentacao", label: "Análise Movimentação", icon: ArrowUpDown },
      { id: "sugestao-inativacao", href: "/relatorios/inativacao", label: "Sugestão Inativação", icon: Layers },
      { id: "comprador-fornecedor", href: "/relatorios/comprador-fornecedor", label: "Comprador x Fornecedor", icon: Users },
      { id: "desempenho-comprador", href: "/relatorios/desempenho-comprador", label: "Desempenho Comprador", icon: Gauge },
      { id: "saving", href: "/relatorios/saving", label: "Saving de Compras", icon: PiggyBank },
      { id: "frequencia-estoque", href: "/relatorios/frequencia-estoque", label: "Frequência Estoque", icon: Activity },
      { id: "otif", href: "/relatorios/otif", label: "Indicador OTIF", icon: Target },
      { id: "analise-vendas", href: "/relatorios/vendas", label: "Análise de Vendas", icon: TrendingUp },
      { id: "analise-margem", href: "/relatorios/margem", label: "Análise de Margem", icon: Percent },
    ],
  },
  {
    label: "Sistema",
    items: [
      { id: "bling", href: "/bling", label: "Bling ERP", icon: Plug },
      { id: "sync", href: "/sync", label: "Sincronização", icon: RefreshCw },
      { id: "guia-uso", href: "/guia-uso", label: "Guia de Uso", icon: BookOpen },
      { id: "configuracoes", href: "/configuracoes", label: "Configurações", icon: Settings },
    ],
  },
];

const ALL_NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

export function findNavItemByHref(pathname: string): NavItem | undefined {
  return ALL_NAV_ITEMS.find((item) => item.href === pathname);
}
