export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    __InternalSupabase: {
        PostgrestVersion: "14.1"
    }
    public: {
        Tables: {
            cards: {
                Row: { id: number; image_url: string; name: string }
                Insert: { id: number; image_url: string; name: string }
                Update: { id?: number; image_url?: string; name?: string }
                Relationships: []
            }
            game_players: {
                Row: {
                    board_card_ids: number[]
                    game_id: string
                    has_won: boolean | null
                    id: string
                    joined_at: string
                    marked_card_ids: number[] | null
                    player_id: string
                }
                Insert: {
                    board_card_ids: number[]
                    game_id: string
                    has_won?: boolean | null
                    id?: string
                    joined_at?: string
                    marked_card_ids?: number[] | null
                    player_id: string
                }
                Update: {
                    board_card_ids?: number[]
                    game_id?: string
                    has_won?: boolean | null
                    id?: string
                    joined_at?: string
                    marked_card_ids?: number[] | null
                    player_id?: string
                }
                Relationships: [
                    { foreignKeyName: "game_players_game_id_fkey"; columns: ["game_id"]; isOneToOne: false; referencedRelation: "games"; referencedColumns: ["id"] },
                    { foreignKeyName: "game_players_player_id_fkey"; columns: ["player_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
                ]
            }
            games: {
                Row: {
                    created_at: string
                    deck_card_ids: number[] | null
                    drawn_card_ids: number[] | null
                    finished_at: string | null
                    host_id: string | null
                    id: string
                    lobby_code: string | null
                    max_players: number | null
                    prize_pool: number
                    started_at: string | null
                    status: string
                    winner_id: string | null
                }
                Insert: {
                    created_at?: string
                    deck_card_ids?: number[] | null
                    drawn_card_ids?: number[] | null
                    finished_at?: string | null
                    host_id?: string | null
                    id?: string
                    lobby_code?: string | null
                    max_players?: number | null
                    prize_pool?: number
                    started_at?: string | null
                    status?: string
                    winner_id?: string | null
                }
                Update: {
                    created_at?: string
                    deck_card_ids?: number[] | null
                    drawn_card_ids?: number[] | null
                    finished_at?: string | null
                    host_id?: string | null
                    id?: string
                    lobby_code?: string | null
                    max_players?: number | null
                    prize_pool?: number
                    started_at?: string | null
                    status?: string
                    winner_id?: string | null
                }
                Relationships: [
                    { foreignKeyName: "games_host_id_fkey"; columns: ["host_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
                    { foreignKeyName: "games_winner_id_fkey"; columns: ["winner_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
                ]
            }
            profiles: {
                Row: { created_at: string; id: string; username: string | null; wallet_address: string | null }
                Insert: { created_at?: string; id: string; username?: string | null; wallet_address?: string | null }
                Update: { created_at?: string; id?: string; username?: string | null; wallet_address?: string | null }
                Relationships: []
            }
            tickets: {
                Row: { bet_amount: number; created_at: string; game_id: string; id: string; player_id: string; tx_signature: string }
                Insert: { bet_amount: number; created_at?: string; game_id: string; id?: string; player_id: string; tx_signature: string }
                Update: { bet_amount?: number; created_at?: string; game_id?: string; id?: string; player_id?: string; tx_signature?: string }
                Relationships: [
                    { foreignKeyName: "tickets_game_id_fkey"; columns: ["game_id"]; isOneToOne: false; referencedRelation: "games"; referencedColumns: ["id"] },
                    { foreignKeyName: "tickets_player_id_fkey"; columns: ["player_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
                ]
            }
        }
        Views: { [_ in never]: never }
        Functions: { generate_lobby_code: { Args: never; Returns: string } }
        Enums: { [_ in never]: never }
        CompositeTypes: { [_ in never]: never }
    }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
    DefaultSchemaTableNameOrOptions extends | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]) | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends { Row: infer R } ? R : never
    : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends { Row: infer R } ? R : never
    : never

export type TablesInsert<
    DefaultSchemaTableNameOrOptions extends | keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends { Insert: infer I } ? I : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends { Insert: infer I } ? I : never
    : never

export type TablesUpdate<
    DefaultSchemaTableNameOrOptions extends | keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends { Update: infer U } ? U : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends { Update: infer U } ? U : never
    : never

export type Enums<
    DefaultSchemaEnumNameOrOptions extends | keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
    EnumName extends DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export const Constants = { public: { Enums: {} } } as const
