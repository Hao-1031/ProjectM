export type Database = {
  public: {
    Tables: {
      leaderboard: {
        Row: {
          id: string;
          created_at: string;
          mode: string;
          player_name: string;
          user_id: string | null;
          kills: number;
          waves: number;
          score: number;
          duration: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          mode: string;
          player_name: string;
          user_id?: string | null;
          kills?: number;
          waves?: number;
          score?: number;
          duration?: number;
        };
        Update: {
          id?: string;
          created_at?: string;
          mode?: string;
          player_name?: string;
          user_id?: string | null;
          kills?: number;
          waves?: number;
          score?: number;
          duration?: number;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          provider: string;
          provider_id: string;
          avatar_url: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          provider: string;
          provider_id: string;
          avatar_url?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          provider?: string;
          provider_id?: string;
          avatar_url?: string | null;
        };
        Relationships: [];
      };
      announcements: {
        Row: {
          id: string;
          created_at: string;
          title: string;
          content: string;
          active: boolean;
          priority: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          title: string;
          content: string;
          active?: boolean;
          priority?: number;
        };
        Update: {
          id?: string;
          created_at?: string;
          title?: string;
          content?: string;
          active?: boolean;
          priority?: number;
        };
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
};
