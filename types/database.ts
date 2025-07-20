export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'client' | 'therapist';
          condition?: string;
          specialty?: string;
          phone?: string;
          photo_url?: string;
          location?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          role: 'client' | 'therapist';
          condition?: string;
          specialty?: string;
          phone?: string;
          photo_url?: string;
          location?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: 'client' | 'therapist';
          condition?: string;
          specialty?: string;
          phone?: string;
          photo_url?: string;
          location?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      therapist_profiles: {
        Row: {
          id: string;
          user_id: string;
          bio: string;
          specialties: string[];
          credentials: string;
          experience_years: number;
          availability: any[];
          hourly_rate?: number;
          is_approved: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          bio: string;
          specialties: string[];
          credentials: string;
          experience_years: number;
          availability?: any[];
          hourly_rate?: number;
          is_approved?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          bio?: string;
          specialties?: string[];
          credentials?: string;
          experience_years?: number;
          availability?: any[];
          hourly_rate?: number;
          is_approved?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      appointments: {
        Row: {
          id: string;
          client_id: string;
          therapist_id: string;
          scheduled_at: string;
          duration: number;
          status: 'booked' | 'completed' | 'cancelled' | 'no_show';
          notes?: string;
          meeting_link?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          therapist_id: string;
          scheduled_at: string;
          duration?: number;
          status?: 'booked' | 'completed' | 'cancelled' | 'no_show';
          notes?: string;
          meeting_link?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          therapist_id?: string;
          scheduled_at?: string;
          duration?: number;
          status?: 'booked' | 'completed' | 'cancelled' | 'no_show';
          notes?: string;
          meeting_link?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          message: string;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          receiver_id: string;
          message: string;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          sender_id?: string;
          receiver_id?: string;
          message?: string;
          read?: boolean;
          created_at?: string;
        };
      };
      educational_content: {
        Row: {
          id: string;
          title: string;
          description: string;
          type: 'article' | 'video';
          url: string;
          category: string;
          condition_tags: string[];
          created_by: string;
          is_approved: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          type: 'article' | 'video';
          url: string;
          category: string;
          condition_tags: string[];
          created_by: string;
          is_approved?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          type?: 'article' | 'video';
          url?: string;
          category?: string;
          condition_tags?: string[];
          created_by?: string;
          is_approved?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      progress_logs: {
        Row: {
          id: string;
          client_id: string;
          date: string;
          exercise_notes: string;
          pain_level: number;
          mood_level: number;
          therapist_notes?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          date: string;
          exercise_notes: string;
          pain_level: number;
          mood_level: number;
          therapist_notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          date?: string;
          exercise_notes?: string;
          pain_level?: number;
          mood_level?: number;
          therapist_notes?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}