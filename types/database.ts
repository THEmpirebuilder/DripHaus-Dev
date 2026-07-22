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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      articles: {
        Row: {
          brand: string | null
          category_id: string | null
          color: string | null
          condition: Database["public"]["Enums"]["article_condition"] | null
          created_at: string
          currency: string
          description: string | null
          id: string
          images: Json
          is_auction: boolean
          location: string | null
          price: number
          seller_boutique_id: string | null
          seller_user_id: string | null
          size: string | null
          status: Database["public"]["Enums"]["article_status"]
          title: string
          updated_at: string
        }
        Insert: {
          brand?: string | null
          category_id?: string | null
          color?: string | null
          condition?: Database["public"]["Enums"]["article_condition"] | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          images?: Json
          is_auction?: boolean
          location?: string | null
          price: number
          seller_boutique_id?: string | null
          seller_user_id?: string | null
          size?: string | null
          status?: Database["public"]["Enums"]["article_status"]
          title: string
          updated_at?: string
        }
        Update: {
          brand?: string | null
          category_id?: string | null
          color?: string | null
          condition?: Database["public"]["Enums"]["article_condition"] | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          images?: Json
          is_auction?: boolean
          location?: string | null
          price?: number
          seller_boutique_id?: string | null
          seller_user_id?: string | null
          size?: string | null
          status?: Database["public"]["Enums"]["article_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_seller_boutique_id_fkey"
            columns: ["seller_boutique_id"]
            isOneToOne: false
            referencedRelation: "boutiques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_seller_user_id_fkey"
            columns: ["seller_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      auction_bids: {
        Row: {
          amount: number
          auction_id: string
          bidder_user_id: string
          created_at: string
          id: string
        }
        Insert: {
          amount: number
          auction_id: string
          bidder_user_id: string
          created_at?: string
          id?: string
        }
        Update: {
          amount?: number
          auction_id?: string
          bidder_user_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auction_bids_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "auctions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auction_bids_bidder_user_id_fkey"
            columns: ["bidder_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      auctions: {
        Row: {
          article_id: string
          bid_increment: number
          created_at: string
          current_price: number | null
          ends_at: string
          id: string
          reserve_price: number | null
          seller_boutique_id: string | null
          seller_user_id: string | null
          starting_price: number
          starts_at: string
          status: Database["public"]["Enums"]["auction_status"]
          updated_at: string
          winner_user_id: string | null
        }
        Insert: {
          article_id: string
          bid_increment?: number
          created_at?: string
          current_price?: number | null
          ends_at: string
          id?: string
          reserve_price?: number | null
          seller_boutique_id?: string | null
          seller_user_id?: string | null
          starting_price: number
          starts_at?: string
          status?: Database["public"]["Enums"]["auction_status"]
          updated_at?: string
          winner_user_id?: string | null
        }
        Update: {
          article_id?: string
          bid_increment?: number
          created_at?: string
          current_price?: number | null
          ends_at?: string
          id?: string
          reserve_price?: number | null
          seller_boutique_id?: string | null
          seller_user_id?: string | null
          starting_price?: number
          starts_at?: string
          status?: Database["public"]["Enums"]["auction_status"]
          updated_at?: string
          winner_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auctions_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: true
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auctions_seller_boutique_id_fkey"
            columns: ["seller_boutique_id"]
            isOneToOne: false
            referencedRelation: "boutiques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auctions_seller_user_id_fkey"
            columns: ["seller_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auctions_winner_user_id_fkey"
            columns: ["winner_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      boutique_members: {
        Row: {
          boutique_id: string
          joined_at: string
          role: Database["public"]["Enums"]["boutique_member_role"]
          user_id: string
        }
        Insert: {
          boutique_id: string
          joined_at?: string
          role?: Database["public"]["Enums"]["boutique_member_role"]
          user_id: string
        }
        Update: {
          boutique_id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["boutique_member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "boutique_members_boutique_id_fkey"
            columns: ["boutique_id"]
            isOneToOne: false
            referencedRelation: "boutiques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boutique_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      boutiques: {
        Row: {
          address: Json | null
          business_hours: Json | null
          cover_url: string | null
          created_at: string
          description: string | null
          email_contact: string | null
          handle: string
          id: string
          kyc_verified: boolean
          logo_url: string | null
          name: string
          phone: string | null
          siret_ide: string | null
          social_links: Json
          status: Database["public"]["Enums"]["boutique_status"]
          stripe_account_id: string | null
          subscription_tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
          website_url: string | null
        }
        Insert: {
          address?: Json | null
          business_hours?: Json | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          email_contact?: string | null
          handle: string
          id?: string
          kyc_verified?: boolean
          logo_url?: string | null
          name: string
          phone?: string | null
          siret_ide?: string | null
          social_links?: Json
          status?: Database["public"]["Enums"]["boutique_status"]
          stripe_account_id?: string | null
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          address?: Json | null
          business_hours?: Json | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          email_contact?: string | null
          handle?: string
          id?: string
          kyc_verified?: boolean
          logo_url?: string | null
          name?: string
          phone?: string | null
          siret_ide?: string | null
          social_links?: Json
          status?: Database["public"]["Enums"]["boutique_status"]
          stripe_account_id?: string | null
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_id: string | null
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          parent_comment_id: string | null
          post_id: string
          status: Database["public"]["Enums"]["comment_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          post_id: string
          status?: Database["public"]["Enums"]["comment_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          post_id?: string
          status?: Database["public"]["Enums"]["comment_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          raised_by_user_id: string
          reason: Database["public"]["Enums"]["dispute_reason"]
          resolution_notes: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["dispute_status"]
          transaction_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          raised_by_user_id: string
          reason: Database["public"]["Enums"]["dispute_reason"]
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
          transaction_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          raised_by_user_id?: string
          reason?: Database["public"]["Enums"]["dispute_reason"]
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
          transaction_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_raised_by_user_id_fkey"
            columns: ["raised_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          followed_boutique_id: string | null
          followed_user_id: string | null
          follower_user_id: string
          id: string
        }
        Insert: {
          created_at?: string
          followed_boutique_id?: string | null
          followed_user_id?: string | null
          follower_user_id: string
          id?: string
        }
        Update: {
          created_at?: string
          followed_boutique_id?: string | null
          followed_user_id?: string | null
          follower_user_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_followed_boutique_id_fkey"
            columns: ["followed_boutique_id"]
            isOneToOne: false
            referencedRelation: "boutiques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_followed_user_id_fkey"
            columns: ["followed_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_follower_user_id_fkey"
            columns: ["follower_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          reference_id: string | null
          reference_type: Database["public"]["Enums"]["reference_type"] | null
          title: string | null
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          reference_id?: string | null
          reference_type?: Database["public"]["Enums"]["reference_type"] | null
          title?: string | null
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          reference_id?: string | null
          reference_type?: Database["public"]["Enums"]["reference_type"] | null
          title?: string | null
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          article_id: string | null
          auction_id: string | null
          author_boutique_id: string | null
          author_user_id: string | null
          content: string | null
          created_at: string
          id: string
          media: Json
          status: Database["public"]["Enums"]["post_status"]
          type: Database["public"]["Enums"]["post_type"]
          updated_at: string
        }
        Insert: {
          article_id?: string | null
          auction_id?: string | null
          author_boutique_id?: string | null
          author_user_id?: string | null
          content?: string | null
          created_at?: string
          id?: string
          media?: Json
          status?: Database["public"]["Enums"]["post_status"]
          type?: Database["public"]["Enums"]["post_type"]
          updated_at?: string
        }
        Update: {
          article_id?: string | null
          auction_id?: string | null
          author_boutique_id?: string | null
          author_user_id?: string | null
          content?: string | null
          created_at?: string
          id?: string
          media?: Json
          status?: Database["public"]["Enums"]["post_status"]
          type?: Database["public"]["Enums"]["post_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "auctions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_author_boutique_id_fkey"
            columns: ["author_boutique_id"]
            isOneToOne: false
            referencedRelation: "boutiques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          location: string | null
          social_links: Json
          updated_at: string
          user_id: string
          username: string | null
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          location?: string | null
          social_links?: Json
          updated_at?: string
          user_id: string
          username?: string | null
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          location?: string | null
          social_links?: Json
          updated_at?: string
          user_id?: string
          username?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          reviewed_boutique_id: string | null
          reviewed_user_id: string | null
          reviewer_user_id: string
          transaction_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          reviewed_boutique_id?: string | null
          reviewed_user_id?: string | null
          reviewer_user_id: string
          transaction_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          reviewed_boutique_id?: string | null
          reviewed_user_id?: string | null
          reviewer_user_id?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_reviewed_boutique_id_fkey"
            columns: ["reviewed_boutique_id"]
            isOneToOne: false
            referencedRelation: "boutiques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewed_user_id_fkey"
            columns: ["reviewed_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_user_id_fkey"
            columns: ["reviewer_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          article_id: string | null
          auction_id: string | null
          buyer_user_id: string
          created_at: string
          currency: string
          delivered_at: string | null
          id: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          payout_amount: number | null
          payout_released_at: string | null
          payout_status: Database["public"]["Enums"]["payout_status"]
          platform_fee: number
          seller_boutique_id: string | null
          seller_user_id: string | null
          stripe_payment_id: string | null
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          article_id?: string | null
          auction_id?: string | null
          buyer_user_id: string
          created_at?: string
          currency?: string
          delivered_at?: string | null
          id?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          payout_amount?: number | null
          payout_released_at?: string | null
          payout_status?: Database["public"]["Enums"]["payout_status"]
          platform_fee?: number
          seller_boutique_id?: string | null
          seller_user_id?: string | null
          stripe_payment_id?: string | null
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          article_id?: string | null
          auction_id?: string | null
          buyer_user_id?: string
          created_at?: string
          currency?: string
          delivered_at?: string | null
          id?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          payout_amount?: number | null
          payout_released_at?: string | null
          payout_status?: Database["public"]["Enums"]["payout_status"]
          platform_fee?: number
          seller_boutique_id?: string | null
          seller_user_id?: string | null
          stripe_payment_id?: string | null
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "auctions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_buyer_user_id_fkey"
            columns: ["buyer_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_seller_boutique_id_fkey"
            columns: ["seller_boutique_id"]
            isOneToOne: false
            referencedRelation: "boutiques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_seller_user_id_fkey"
            columns: ["seller_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          kyc_verified: boolean
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["user_status"]
          stripe_account_id: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          kyc_verified?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["user_status"]
          stripe_account_id?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          kyc_verified?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["user_status"]
          stripe_account_id?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      article_condition: "new" | "very_good" | "good" | "fair"
      article_status: "draft" | "active" | "sold" | "reserved" | "archived"
      auction_status: "scheduled" | "active" | "ended" | "cancelled"
      boutique_member_role: "owner" | "manager"
      boutique_status: "active" | "suspended" | "pending"
      comment_status: "active" | "removed"
      dispute_reason: "not_received" | "not_as_described" | "damaged" | "other"
      dispute_status:
        | "open"
        | "under_review"
        | "resolved_buyer"
        | "resolved_seller"
        | "closed"
      notification_type:
        | "new_follower"
        | "new_like"
        | "new_comment"
        | "new_bid"
        | "auction_won"
        | "sale"
        | "payout"
        | "dispute"
      payment_status: "pending" | "paid" | "held" | "refunded" | "failed"
      payout_status: "pending" | "released" | "held" | "refunded"
      post_status: "published" | "draft" | "removed"
      post_type: "organic" | "article_share" | "auction" | "promo"
      reference_type: "post" | "article" | "auction" | "transaction" | "dispute"
      subscription_tier: "free" | "pro" | "premium"
      user_role: "particulier" | "createur" | "boutique"
      user_status: "active" | "pending_kyc" | "suspended"
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
      article_condition: ["new", "very_good", "good", "fair"],
      article_status: ["draft", "active", "sold", "reserved", "archived"],
      auction_status: ["scheduled", "active", "ended", "cancelled"],
      boutique_member_role: ["owner", "manager"],
      boutique_status: ["active", "suspended", "pending"],
      comment_status: ["active", "removed"],
      dispute_reason: ["not_received", "not_as_described", "damaged", "other"],
      dispute_status: [
        "open",
        "under_review",
        "resolved_buyer",
        "resolved_seller",
        "closed",
      ],
      notification_type: [
        "new_follower",
        "new_like",
        "new_comment",
        "new_bid",
        "auction_won",
        "sale",
        "payout",
        "dispute",
      ],
      payment_status: ["pending", "paid", "held", "refunded", "failed"],
      payout_status: ["pending", "released", "held", "refunded"],
      post_status: ["published", "draft", "removed"],
      post_type: ["organic", "article_share", "auction", "promo"],
      reference_type: ["post", "article", "auction", "transaction", "dispute"],
      subscription_tier: ["free", "pro", "premium"],
      user_role: ["particulier", "createur", "boutique"],
      user_status: ["active", "pending_kyc", "suspended"],
    },
  },
} as const
