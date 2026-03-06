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
        PostgrestVersion: "14.1"
    }
    public: {
        Tables: {
            cards: {
                Row: {
                    id: number
                    image_url: string
                    name: string
                }
                Insert: {
                    id: number
                    image_url: string
                    name: string
                }
                Update: {
                    id?: number
                    image_url?: string
                    name?: string
                }
                Relationships: []
            }
            game_players: {
                Row: {
                    board_card_ids: number[]
                    game_id: string
                    has_paid: boolean | null
                    has_won: boolean | null
                    id: string
                    joined_at: string
                    marked_card_ids: number[] | null
                    player_id: string | null
                    tx_signature: string | null
                    wallet_address: string | null
                    bet_tx: string | null
                }
                Insert: {
                    board_card_ids: number[]
                    game_id: string
                    has_paid?: boolean | null
                    has_won?: boolean | null
                    id?: string
                    joined_at?: string
                    marked_card_ids?: number[] | null
                    player_id?: string | null
                    tx_signature?: string | null
                    wallet_address?: string | null
                    bet_tx?: string | null
                }
                Update: {
                    board_card_ids?: number[]
                    game_id?: string
                    has_paid?: boolean | null
                    has_won?: boolean | null
                    id?: string
                    joined_at?: string
                    marked_card_ids?: number[] | null
                    player_id?: string | null
                    tx_signature?: string | null
                    wallet_address?: string | null
                    bet_tx?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "game_players_game_id_fkey"
                        columns: ["game_id"]
                        isOneToOne: false
                        referencedRelation: "games"
                        referencedColumns: ["id"]
                    },
                ]
            }
            game_rooms: {
                Row: {
                    bet_amount: number
                    code: string
                    created_at: string
                    deck: number[]
                    drawn_index: number
                    finished_at: string | null
                    host_id: string | null
                    id: string
                    interval_sec: number
                    max_players: number
                    prize_pool: number
                    started_at: string | null
                    status: string
                    winner_id: string | null
                }
                Insert: {
                    bet_amount?: number
                    code?: string
                    created_at?: string
                    deck?: number[]
                    drawn_index?: number
                    finished_at?: string | null
                    host_id?: string | null
                    id?: string
                    interval_sec?: number
                    max_players?: number
                    prize_pool?: number
                    started_at?: string | null
                    status?: string
                    winner_id?: string | null
                }
                Update: {
                    bet_amount?: number
                    code?: string
                    created_at?: string
                    deck?: number[]
                    drawn_index?: number
                    finished_at?: string | null
                    host_id?: string | null
                    id?: string
                    interval_sec?: number
                    max_players?: number
                    prize_pool?: number
                    started_at?: string | null
                    status?: string
                    winner_id?: string | null
                }
                Relationships: []
            }
            games: {
                Row: {
                    created_at: string
                    deck_card_ids: number[] | null
                    drawn_card_ids: number[] | null
                    entry_fee_lamports: number | null
                    finished_at: string | null
                    host_id: string | null
                    host_wallet: string | null
                    id: string
                    lobby_code: string | null
                    max_players: number | null
                    prize_paid: boolean | null
                    prize_pool: number
                    started_at: string | null
                    status: string
                    treasury_wallet: string | null
                    winner_id: string | null
                }
                Insert: {
                    created_at?: string
                    deck_card_ids?: number[] | null
                    drawn_card_ids?: number[] | null
                    entry_fee_lamports?: number | null
                    finished_at?: string | null
                    host_id?: string | null
                    host_wallet?: string | null
                    id?: string
                    lobby_code?: string | null
                    max_players?: number | null
                    prize_paid?: boolean | null
                    prize_pool?: number
                    started_at?: string | null
                    status?: string
                    treasury_wallet?: string | null
                    winner_id?: string | null
                }
                Update: {
                    created_at?: string
                    deck_card_ids?: number[] | null
                    drawn_card_ids?: number[] | null
                    entry_fee_lamports?: number | null
                    finished_at?: string | null
                    host_id?: string | null
                    host_wallet?: string | null
                    id?: string
                    lobby_code?: string | null
                    max_players?: number | null
                    prize_paid?: boolean | null
                    prize_pool?: number
                    started_at?: string | null
                    status?: string
                    treasury_wallet?: string | null
                    winner_id?: string | null
                }
                Relationships: []
            }
            loteria_cards: {
                Row: {
                    emoji: string
                    id: number
                    name: string
                }
                Insert: {
                    emoji: string
                    id: number
                    name: string
                }
                Update: {
                    emoji?: string
                    id?: number
                    name?: string
                }
                Relationships: []
            }
            player_boards: {
                Row: {
                    bet_tx: string | null
                    board: number[]
                    id: string
                    joined_at: string
                    marked: number[]
                    room_id: string | null
                    user_id: string | null
                    username: string | null
                }
                Insert: {
                    bet_tx?: string | null
                    board: number[]
                    id?: string
                    joined_at?: string
                    marked?: number[]
                    room_id?: string | null
                    user_id?: string | null
                    username?: string | null
                }
                Update: {
                    bet_tx?: string | null
                    board?: number[]
                    id?: string
                    joined_at?: string
                    marked?: number[]
                    room_id?: string | null
                    user_id?: string | null
                    username?: string | null
                }
                Relationships: []
            }
            profiles: {
                Row: {
                    created_at: string
                    id: string
                    username: string | null
                    wallet_address: string
                }
                Insert: {
                    created_at?: string
                    id?: string
                    username?: string | null
                    wallet_address: string
                }
                Update: {
                    created_at?: string
                    id?: string
                    username?: string | null
                    wallet_address?: string
                }
                Relationships: []
            }
            tickets: {
                Row: {
                    bet_amount: number
                    created_at: string
                    game_id: string
                    id: string
                    player_id: string
                    tx_signature: string
                }
                Insert: {
                    bet_amount: number
                    created_at?: string
                    game_id: string
                    id?: string
                    player_id: string
                    tx_signature: string
                }
                Update: {
                    bet_amount?: number
                    created_at?: string
                    game_id?: string
                    id?: string
                    player_id?: string
                    tx_signature?: string
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            generate_lobby_code: { Args: never; Returns: string }
        }
        Enums: {
            [_ in never]: never
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
        Enums: {},
    },
} as const
