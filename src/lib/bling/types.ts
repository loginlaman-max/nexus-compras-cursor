export type BlingProduto = {
  id: number;
  nome?: string;
  codigo?: string;
  preco?: number;
  precoCusto?: number;
  gtin?: string;
  ncm?: string;
  unidade?: string;
  situacao?: string;
  marca?: string | { descricao?: string; nome?: string };
  linhaProduto?: { id?: number; descricao?: string; nome?: string };
  categoria?: {
    id?: number;
    descricao?: string;
    nome?: string;
  };
  imagemURL?: string;
  midia?: {
    imagens?: { link?: string; url?: string; linkMiniatura?: string }[];
  };
  fornecedor?: {
    id?: number;
    codigo?: string;
    precoCusto?: number;
    precoCompra?: number;
    contato?: { id?: number; nome?: string };
  };
};

export type BlingProdutoFornecedor = {
  id?: number;
  codigo?: string;
  padrao?: boolean;
  precoCusto?: number;
  precoCompra?: number;
  fornecedor?: { id?: number; contato?: { id?: number } };
};

export type BlingContato = {
  id: number;
  nome?: string;
  numeroDocumento?: string;
  situacao?: string;
  email?: string;
  telefone?: string;
  celular?: string;
  fone?: string;
  emails?: { email?: string }[];
  endereco?: {
    uf?: string;
    UF?: string;
    geral?: { uf?: string; UF?: string };
  };
  /** Pessoa F/J na listagem, ou objeto { cliente, fornecedor } no detalhe. */
  tipo?: string | { cliente?: boolean; fornecedor?: boolean };
  tiposContato?: { id?: number; descricao?: string }[];
};

export type BlingContatoDetalhe = BlingContato;

export type BlingPedidoCompra = {
  id: number;
  numero?: string | number;
  data?: string;
  total?: number;
  totalProdutos?: number;
  situacao?: { id?: number; valor?: string | number };
  fornecedor?: { id?: number; contato?: { id?: number; nome?: string } };
};

export type BlingNfeResumo = {
  id: number;
  numero?: string | number;
  serie?: string | number;
  dataEmissao?: string;
  chaveAcesso?: string;
  situacao?: number | { id?: number; valor?: string };
  contato?: { id?: number; nome?: string; numeroDocumento?: string };
  valorNota?: number;
  valor?: number;
  tipo?: number;
};

export type BlingNfeDetalhe = BlingNfeResumo & {
  naturezaOperacao?: { id?: number; descricao?: string };
  transporte?: { frete?: number; fretePorConta?: number };
  itens?: {
    codigo?: string;
    descricao?: string;
    quantidade?: number;
    valor?: number;
    gtin?: string;
    ncm?: string;
    produto?: { id?: number; codigo?: string };
  }[];
};
