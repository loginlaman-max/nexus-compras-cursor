export type BlingProduto = {
  id: number;
  nome?: string;
  codigo?: string;
  preco?: number;
  precoCusto?: number;
  gtin?: string;
  ncm?: string;
  situacao?: string;
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
  /** Pessoa F/J na listagem, ou objeto { cliente, fornecedor } no detalhe. */
  tipo?: string | { cliente?: boolean; fornecedor?: boolean };
  tiposContato?: { id?: number; descricao?: string }[];
};

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
