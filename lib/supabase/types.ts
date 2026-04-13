export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          privy_user_id: string | null;
          wallet_address: string | null;
          display_name: string;
          personal_code: string;
          starter: string | null;
          coins: number;
          points: number;
          status: "active" | "flagged" | "blocked" | "invalidated";
          daily_tickets: number;
          last_ticket_reset_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["users"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["users"]["Row"]>;
      };
      user_pokemon: {
        Row: {
          id: string;
          user_id: string;
          pokemon_name: string;
          rarity: "Common" | "Rare" | "Epic";
          type: "Fire" | "Water" | "Grass" | "Neutral";
          power: number;
          source: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["user_pokemon"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["user_pokemon"]["Row"]>;
      };
      connections: {
        Row: {
          id: string;
          user_a_id: string;
          user_b_id: string;
          coins_awarded: number;
          points_awarded: number;
          status: "valid" | "invalidated";
          created_at: string;
          invalidated_at: string | null;
          invalidation_reason: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["connections"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["connections"]["Row"]>;
      };
      battles: {
        Row: {
          id: string;
          player_a_id: string;
          player_b_id: string;
          player_a_pokemon_id: string;
          player_b_pokemon_id: string;
          winner_user_id: string | null;
          player_a_points_delta: number;
          player_b_points_delta: number;
          ranked: boolean;
          battle_mode: "connected" | "ticket";
          event_day_key: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["battles"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["battles"]["Row"]>;
      };
    };
    Views: {
      leaderboard: {
        Row: {
          user_id: string;
          display_name: string;
          personal_code: string;
          points: number;
          coins: number;
          status: "active" | "flagged" | "blocked" | "invalidated";
          daily_tickets: number;
          total_valid_connections: number;
          total_battles: number;
          total_wins: number;
          total_pokemon: number;
        };
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
