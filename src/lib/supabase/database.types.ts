/**
 * Tipos TypeScript derivados de `_handoff/SUPABASE-SCHEMA.sql`.
 * Regenerar: SUPABASE_PROJECT_ID=xxx npm run gen:types
 */
export type Json =
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Papel = "owner" | "admin" | "comprador" | "visualizador";
export type NfStatus = "recebida" | "conciliada" | "consolidada";

export interface Database {
  public: {
    Tables: {
      organizacoes: {
        Row: {
          id: string;
          nome: string;
          cnpj: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          nome: string;
          cnpj?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          nome?: string;
          cnpj?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      membros: {
        Row: {
          org_id: string;
          user_id: string;
          papel: Papel;
          created_at: string | null;
        };
        Insert: {
          org_id: string;
          user_id: string;
          papel?: Papel;
          created_at?: string | null;
        };
        Update: {
          org_id?: string;
          user_id?: string;
          papel?: Papel;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "membros_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizacoes";
            referencedColumns: ["id"];
          },
        ];
      };
      convites: {
        Row: {
          id: string;
          org_id: string;
          email: string;
          papel: Papel;
          aceito: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          org_id: string;
          email: string;
          papel?: Papel;
          aceito?: boolean | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          org_id?: string;
          email?: string;
          papel?: Papel;
          aceito?: boolean | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "convites_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizacoes";
            referencedColumns: ["id"];
          },
        ];
      };
      fornecedores: {
        Row: {
          id: string;
          org_id: string;
          cnpj: string | null;
          razao_social: string;
          nome_fantasia: string | null;
          uf: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          org_id: string;
          cnpj?: string | null;
          razao_social: string;
          nome_fantasia?: string | null;
          uf?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          org_id?: string;
          cnpj?: string | null;
          razao_social?: string;
          nome_fantasia?: string | null;
          uf?: string | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fornecedores_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizacoes";
            referencedColumns: ["id"];
          },
        ];
      };
      produtos: {
        Row: {
          id: string;
          org_id: string;
          sku: string;
          ean: string | null;
          descricao: string;
          ncm: string | null;
          unidade: string | null;
          curva_abc: string | null;
          custo_real: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          org_id: string;
          sku: string;
          ean?: string | null;
          descricao: string;
          ncm?: string | null;
          unidade?: string | null;
          curva_abc?: string | null;
          custo_real?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          org_id?: string;
          sku?: string;
          ean?: string | null;
          descricao?: string;
          ncm?: string | null;
          unidade?: string | null;
          curva_abc?: string | null;
          custo_real?: number | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "produtos_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizacoes";
            referencedColumns: ["id"];
          },
        ];
      };
      notas_fiscais: {
        Row: {
          id: string;
          org_id: string;
          fornecedor_id: string | null;
          chave: string | null;
          numero: string | null;
          serie: string | null;
          emissao: string | null;
          valor_produtos: number | null;
          valor_frete: number | null;
          valor_total: number | null;
          xml_path: string | null;
          status: NfStatus | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          org_id: string;
          fornecedor_id?: string | null;
          chave?: string | null;
          numero?: string | null;
          serie?: string | null;
          emissao?: string | null;
          valor_produtos?: number | null;
          valor_frete?: number | null;
          valor_total?: number | null;
          xml_path?: string | null;
          status?: NfStatus | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          org_id?: string;
          fornecedor_id?: string | null;
          chave?: string | null;
          numero?: string | null;
          serie?: string | null;
          emissao?: string | null;
          valor_produtos?: number | null;
          valor_frete?: number | null;
          valor_total?: number | null;
          xml_path?: string | null;
          status?: NfStatus | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "notas_fiscais_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizacoes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notas_fiscais_fornecedor_id_fkey";
            columns: ["fornecedor_id"];
            isOneToOne: false;
            referencedRelation: "fornecedores";
            referencedColumns: ["id"];
          },
        ];
      };
      itens_nota: {
        Row: {
          id: string;
          org_id: string;
          nota_id: string;
          produto_id: string | null;
          c_prod: string | null;
          descricao: string | null;
          ncm: string | null;
          ean: string | null;
          quantidade: number | null;
          valor_unit: number | null;
          valor_total: number | null;
          peso_kg: number | null;
          icms: number | null;
          icms_st: number | null;
          ipi: number | null;
          pis: number | null;
          cofins: number | null;
          frete_rateado: number | null;
          custo_real_landed: number | null;
        };
        Insert: {
          id?: string;
          org_id: string;
          nota_id: string;
          produto_id?: string | null;
          c_prod?: string | null;
          descricao?: string | null;
          ncm?: string | null;
          ean?: string | null;
          quantidade?: number | null;
          valor_unit?: number | null;
          valor_total?: number | null;
          peso_kg?: number | null;
          icms?: number | null;
          icms_st?: number | null;
          ipi?: number | null;
          pis?: number | null;
          cofins?: number | null;
          frete_rateado?: number | null;
          custo_real_landed?: number | null;
        };
        Update: {
          id?: string;
          org_id?: string;
          nota_id?: string;
          produto_id?: string | null;
          c_prod?: string | null;
          descricao?: string | null;
          ncm?: string | null;
          ean?: string | null;
          quantidade?: number | null;
          valor_unit?: number | null;
          valor_total?: number | null;
          peso_kg?: number | null;
          icms?: number | null;
          icms_st?: number | null;
          ipi?: number | null;
          pis?: number | null;
          cofins?: number | null;
          frete_rateado?: number | null;
          custo_real_landed?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "itens_nota_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizacoes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "itens_nota_nota_id_fkey";
            columns: ["nota_id"];
            isOneToOne: false;
            referencedRelation: "notas_fiscais";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "itens_nota_produto_id_fkey";
            columns: ["produto_id"];
            isOneToOne: false;
            referencedRelation: "produtos";
            referencedColumns: ["id"];
          },
        ];
      };
      ctes: {
        Row: {
          id: string;
          org_id: string;
          chave: string | null;
          numero: string | null;
          transportadora: string | null;
          uf_origem: string | null;
          uf_destino: string | null;
          valor_frete: number | null;
          xml_path: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          org_id: string;
          chave?: string | null;
          numero?: string | null;
          transportadora?: string | null;
          uf_origem?: string | null;
          uf_destino?: string | null;
          valor_frete?: number | null;
          xml_path?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          org_id?: string;
          chave?: string | null;
          numero?: string | null;
          transportadora?: string | null;
          uf_origem?: string | null;
          uf_destino?: string | null;
          valor_frete?: number | null;
          xml_path?: string | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ctes_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizacoes";
            referencedColumns: ["id"];
          },
        ];
      };
      cte_notas: {
        Row: {
          cte_id: string;
          nota_id: string;
        };
        Insert: {
          cte_id: string;
          nota_id: string;
        };
        Update: {
          cte_id?: string;
          nota_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cte_notas_cte_id_fkey";
            columns: ["cte_id"];
            isOneToOne: false;
            referencedRelation: "ctes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cte_notas_nota_id_fkey";
            columns: ["nota_id"];
            isOneToOne: false;
            referencedRelation: "notas_fiscais";
            referencedColumns: ["id"];
          },
        ];
      };
      tabelas_preco: {
        Row: {
          id: string;
          org_id: string;
          nome: string;
          status: string | null;
          canal: string | null;
          moeda: string | null;
          observacoes: string | null;
          vigencia_ini: string | null;
          vigencia_fim: string | null;
          escopo: Json | null;
          markup: Json | null;
          atualizado: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          org_id: string;
          nome: string;
          status?: string | null;
          canal?: string | null;
          moeda?: string | null;
          observacoes?: string | null;
          vigencia_ini?: string | null;
          vigencia_fim?: string | null;
          escopo?: Json | null;
          markup?: Json | null;
          atualizado?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          org_id?: string;
          nome?: string;
          status?: string | null;
          canal?: string | null;
          moeda?: string | null;
          observacoes?: string | null;
          vigencia_ini?: string | null;
          vigencia_fim?: string | null;
          escopo?: Json | null;
          markup?: Json | null;
          atualizado?: string | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "tabelas_preco_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizacoes";
            referencedColumns: ["id"];
          },
        ];
      };
      tabela_preco_itens: {
        Row: {
          id: string;
          tabela_id: string;
          produto_id: string | null;
          sku_cod: string | null;
          markup_pct: number | null;
          preco_venda: number | null;
        };
        Insert: {
          id?: string;
          tabela_id: string;
          produto_id?: string | null;
          sku_cod?: string | null;
          markup_pct?: number | null;
          preco_venda?: number | null;
        };
        Update: {
          id?: string;
          tabela_id?: string;
          produto_id?: string | null;
          sku_cod?: string | null;
          markup_pct?: number | null;
          preco_venda?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "tabela_preco_itens_tabela_id_fkey";
            columns: ["tabela_id"];
            isOneToOne: false;
            referencedRelation: "tabelas_preco";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tabela_preco_itens_produto_id_fkey";
            columns: ["produto_id"];
            isOneToOne: false;
            referencedRelation: "produtos";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_member: {
        Args: { target_org: string };
        Returns: boolean;
      };
    };
    Enums: {
      papel: Papel;
      nf_status: NfStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Organizacao = Database["public"]["Tables"]["organizacoes"]["Row"];
export type Membro = Database["public"]["Tables"]["membros"]["Row"];

export type MembroComOrganizacao = Membro & {
  organizacao: Organizacao;
};
