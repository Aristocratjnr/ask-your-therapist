/*
  # Initial Schema for OTConekt App

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `name` (text)
      - `role` (enum: client, therapist)
      - `condition` (text, optional for clients)
      - `specialty` (text, optional for therapists)
      - `phone` (text, optional)
      - `photo_url` (text, optional)
      - `location` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `therapist_profiles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `bio` (text)
      - `specialties` (text array)
      - `credentials` (text)
      - `experience_years` (integer)
      - `availability` (jsonb array)
      - `hourly_rate` (numeric, optional)
      - `is_approved` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `appointments`
      - `id` (uuid, primary key)
      - `client_id` (uuid, foreign key to users)
      - `therapist_id` (uuid, foreign key to users)
      - `scheduled_at` (timestamp)
      - `duration` (integer, default 60 minutes)
      - `status` (enum: booked, completed, cancelled, no_show)
      - `notes` (text, optional)
      - `meeting_link` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `messages`
      - `id` (uuid, primary key)
      - `sender_id` (uuid, foreign key to users)
      - `receiver_id` (uuid, foreign key to users)
      - `message` (text)
      - `read` (boolean, default false)
      - `created_at` (timestamp)

    - `educational_content`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `type` (enum: article, video)
      - `url` (text)
      - `category` (text)
      - `condition_tags` (text array)
      - `created_by` (uuid, foreign key to users)
      - `is_approved` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `progress_logs`
      - `id` (uuid, primary key)
      - `client_id` (uuid, foreign key to users)
      - `date` (date)
      - `exercise_notes` (text)
      - `pain_level` (integer, 1-10)
      - `mood_level` (integer, 1-10)
      - `therapist_notes` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
    - Add policies for therapists to access client data they're working with
    - Add policies for approved content visibility
*/

-- Create custom types
CREATE TYPE user_role AS ENUM ('client', 'therapist');
CREATE TYPE appointment_status AS ENUM ('booked', 'completed', 'cancelled', 'no_show');
CREATE TYPE content_type AS ENUM ('article', 'video');

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role user_role NOT NULL,
  condition text,
  specialty text,
  phone text,
  photo_url text,
  location text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Therapist profiles table
CREATE TABLE IF NOT EXISTS therapist_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  bio text NOT NULL DEFAULT '',
  specialties text[] DEFAULT '{}',
  credentials text NOT NULL DEFAULT '',
  experience_years integer NOT NULL DEFAULT 0,
  availability jsonb DEFAULT '[]',
  hourly_rate numeric,
  is_approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES users(id) ON DELETE CASCADE,
  therapist_id uuid REFERENCES users(id) ON DELETE CASCADE,
  scheduled_at timestamptz NOT NULL,
  duration integer DEFAULT 60,
  status appointment_status DEFAULT 'booked',
  notes text,
  meeting_link text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES users(id) ON DELETE CASCADE,
  receiver_id uuid REFERENCES users(id) ON DELETE CASCADE,
  message text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Educational content table
CREATE TABLE IF NOT EXISTS educational_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  type content_type NOT NULL,
  url text NOT NULL,
  category text NOT NULL,
  condition_tags text[] DEFAULT '{}',
  created_by uuid REFERENCES users(id) ON DELETE CASCADE,
  is_approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Progress logs table
CREATE TABLE IF NOT EXISTS progress_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES users(id) ON DELETE CASCADE,
  date date NOT NULL,
  exercise_notes text NOT NULL DEFAULT '',
  pain_level integer CHECK (pain_level >= 1 AND pain_level <= 10),
  mood_level integer CHECK (mood_level >= 1 AND mood_level <= 10),
  therapist_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapist_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE educational_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_logs ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Therapist profiles policies
CREATE POLICY "Anyone can read approved therapist profiles"
  ON therapist_profiles
  FOR SELECT
  TO authenticated
  USING (is_approved = true);

CREATE POLICY "Therapists can manage own profile"
  ON therapist_profiles
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Appointments policies
CREATE POLICY "Users can read own appointments"
  ON appointments
  FOR SELECT
  TO authenticated
  USING (client_id = auth.uid() OR therapist_id = auth.uid());

CREATE POLICY "Clients can create appointments"
  ON appointments
  FOR INSERT
  TO authenticated
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Users can update own appointments"
  ON appointments
  FOR UPDATE
  TO authenticated
  USING (client_id = auth.uid() OR therapist_id = auth.uid());

-- Messages policies
CREATE POLICY "Users can read own messages"
  ON messages
  FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send messages"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update own received messages"
  ON messages
  FOR UPDATE
  TO authenticated
  USING (receiver_id = auth.uid());

-- Educational content policies
CREATE POLICY "Anyone can read approved content"
  ON educational_content
  FOR SELECT
  TO authenticated
  USING (is_approved = true);

CREATE POLICY "Therapists can create content"
  ON educational_content
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Creators can update own content"
  ON educational_content
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

-- Progress logs policies
CREATE POLICY "Clients can manage own progress logs"
  ON progress_logs
  FOR ALL
  TO authenticated
  USING (client_id = auth.uid());

CREATE POLICY "Therapists can read client progress logs"
  ON progress_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.therapist_id = auth.uid()
      AND appointments.client_id = progress_logs.client_id
    )
  );

CREATE POLICY "Therapists can update client progress logs"
  ON progress_logs
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.therapist_id = auth.uid()
      AND appointments.client_id = progress_logs.client_id
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_therapist_profiles_approved ON therapist_profiles(is_approved);
CREATE INDEX IF NOT EXISTS idx_appointments_client ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_therapist ON appointments(therapist_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled ON appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_educational_content_approved ON educational_content(is_approved);
CREATE INDEX IF NOT EXISTS idx_progress_logs_client ON progress_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_progress_logs_date ON progress_logs(date);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_therapist_profiles_updated_at BEFORE UPDATE ON therapist_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_educational_content_updated_at BEFORE UPDATE ON educational_content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_progress_logs_updated_at BEFORE UPDATE ON progress_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();