export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      estados: {
        Row: {
          created_at: string
          id: string
          nome: string
          sigla: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          sigla: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          sigla?: string
        }
        Relationships: []
      }
      municipios: {
        Row: {
          ativo: boolean
          created_at: string
          estado_id: string
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          estado_id: string
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          estado_id?: string
          id?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "municipios_estado_id_fkey"
            columns: ["estado_id"]
            isOneToOne: false
            referencedRelation: "estados"
            referencedColumns: ["id"]
          },
        ]
      }
      niveis: {
        Row: {
          created_at: string
          id: string
          municipio_id: string
          nome: string
          ordem: number
          secretaria_id: string | null
          tem_unidade: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          municipio_id: string
          nome: string
          ordem?: number
          secretaria_id?: string | null
          tem_unidade?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          municipio_id?: string
          nome?: string
          ordem?: number
          secretaria_id?: string | null
          tem_unidade?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "niveis_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: false
            referencedRelation: "municipios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "niveis_secretaria_id_fkey"
            columns: ["secretaria_id"]
            isOneToOne: false
            referencedRelation: "secretarias"
            referencedColumns: ["id"]
          },
        ]
      }
      perfis: {
        Row: {
          bairro: string | null
          cep: string
          complemento: string | null
          cpf: string
          created_at: string | null
          id: string
          logradouro: string | null
          municipio_id: string | null
          nivel_id: string | null
          nome_completo: string
          numero: string | null
          secretaria_id: string | null
          status: Database["public"]["Enums"]["perfil_status"] | null
          superior_id: string | null
          telefone: string
          unidade_id: string | null
          updated_at: string | null
        }
        Insert: {
          bairro?: string | null
          cep: string
          complemento?: string | null
          cpf: string
          created_at?: string | null
          id: string
          logradouro?: string | null
          municipio_id?: string | null
          nivel_id?: string | null
          nome_completo: string
          numero?: string | null
          secretaria_id?: string | null
          status?: Database["public"]["Enums"]["perfil_status"] | null
          superior_id?: string | null
          telefone: string
          unidade_id?: string | null
          updated_at?: string | null
        }
        Update: {
          bairro?: string | null
          cep?: string
          complemento?: string | null
          cpf?: string
          created_at?: string | null
          id?: string
          logradouro?: string | null
          municipio_id?: string | null
          nivel_id?: string | null
          nome_completo?: string
          numero?: string | null
          secretaria_id?: string | null
          status?: Database["public"]["Enums"]["perfil_status"] | null
          superior_id?: string | null
          telefone?: string
          unidade_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      secretarias: {
        Row: {
          created_at: string
          icone: string | null
          id: string
          municipio_id: string
          nome: string
        }
        Insert: {
          created_at?: string
          icone?: string | null
          id?: string
          municipio_id: string
          nome: string
        }
        Update: {
          created_at?: string
          icone?: string | null
          id?: string
          municipio_id?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "secretarias_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: false
            referencedRelation: "municipios"
            referencedColumns: ["id"]
          },
        ]
      }
      unidades: {
        Row: {
          created_at: string
          id: string
          municipio_id: string
          nome: string
          secretaria_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          municipio_id: string
          nome: string
          secretaria_id: string
        }
        Update: {
          created_at?: string
          id?: string
          municipio_id?: string
          nome?: string
          secretaria_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unidades_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: false
            referencedRelation: "municipios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unidades_secretaria_id_fkey"
            columns: ["secretaria_id"]
            isOneToOne: false
            referencedRelation: "secretarias"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist: {
        Row: {
          cidade_texto: string | null
          criado_em: string | null
          email: string
          estado_id: string | null
          id: string
        }
        Insert: {
          cidade_texto?: string | null
          criado_em?: string | null
          email: string
          estado_id?: string | null
          id?: string
        }
        Update: {
          cidade_texto?: string | null
          criado_em?: string | null
          email?: string
          estado_id?: string | null
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      perfis_publicos_min: {
        Args: never
        Returns: {
          id: string
          municipio_id: string
          nivel_id: string
          nome_completo: string
          secretaria_id: string
          unidade_id: string
        }[]
      }
    }
    Enums: {
      perfil_status: "pendente" | "ativo" | "negado" | "inativo"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      perfil_status: ["pendente", "ativo", "negado", "inativo"],
    },
  },
} as const
