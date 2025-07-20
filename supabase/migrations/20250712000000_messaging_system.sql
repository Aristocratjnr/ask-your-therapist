/*
  # Enhanced Messaging System for OTConekt App

  1. New Tables
    - `conversations` - Central conversation management
    - `message_attachments` - File attachments for messages
    
  2. Updates to existing tables
    - Update `messages` table to use conversations
    - Add message types and system message support
    
  3. Database Functions
    - `get_or_create_conversation` function for conversation management
    
  4. Security
    - RLS policies for conversations and attachments
    - Proper access control between clients and therapists
*/

-- Add message types
CREATE TYPE message_type AS ENUM ('text', 'image', 'file', 'appointment_request');

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id uuid REFERENCES users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES users(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(therapist_id, client_id)
);

-- Create message attachments table
CREATE TABLE IF NOT EXISTS message_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES messages(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Update messages table structure
ALTER TABLE messages ADD COLUMN IF NOT EXISTS conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type message_type DEFAULT 'text';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_system_message boolean DEFAULT false;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS edited_at timestamptz;

-- Enable RLS on new tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;

-- Conversations policies
CREATE POLICY "Users can read own conversations"
  ON conversations
  FOR SELECT
  TO authenticated
  USING (therapist_id = auth.uid() OR client_id = auth.uid());

CREATE POLICY "Users can create conversations"
  ON conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (therapist_id = auth.uid() OR client_id = auth.uid());

CREATE POLICY "Users can update own conversations"
  ON conversations
  FOR UPDATE
  TO authenticated
  USING (therapist_id = auth.uid() OR client_id = auth.uid());

-- Message attachments policies
CREATE POLICY "Users can read attachments from own conversations"
  ON message_attachments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE m.id = message_attachments.message_id
      AND (c.therapist_id = auth.uid() OR c.client_id = auth.uid())
    )
  );

CREATE POLICY "Users can create attachments for own messages"
  ON message_attachments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE m.id = message_attachments.message_id
      AND m.sender_id = auth.uid()
    )
  );

-- Update messages policies for conversation support
DROP POLICY IF EXISTS "Users can read own messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can update own received messages" ON messages;

CREATE POLICY "Users can read messages from own conversations"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
      AND (c.therapist_id = auth.uid() OR c.client_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages to own conversations"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
      AND (c.therapist_id = auth.uid() OR c.client_id = auth.uid())
    )
  );

CREATE POLICY "Users can update own messages"
  ON messages
  FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Create function to get or create conversation
CREATE OR REPLACE FUNCTION get_or_create_conversation(
  therapist_uuid uuid,
  client_uuid uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  conversation_id uuid;
  therapist_role text;
  client_role text;
BEGIN
  -- Verify the roles are correct
  SELECT role INTO therapist_role FROM users WHERE id = therapist_uuid;
  SELECT role INTO client_role FROM users WHERE id = client_uuid;
  
  IF therapist_role != 'therapist' OR client_role != 'client' THEN
    RAISE EXCEPTION 'Invalid user roles for conversation';
  END IF;
  
  -- Check if conversation already exists
  SELECT id INTO conversation_id
  FROM conversations
  WHERE therapist_id = therapist_uuid AND client_id = client_uuid;
  
  -- If conversation doesn't exist, create it
  IF conversation_id IS NULL THEN
    INSERT INTO conversations (therapist_id, client_id)
    VALUES (therapist_uuid, client_uuid)
    RETURNING id INTO conversation_id;
  ELSE
    -- Update last_message_at to current time
    UPDATE conversations
    SET last_message_at = now(), updated_at = now()
    WHERE id = conversation_id;
  END IF;
  
  RETURN conversation_id;
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_therapist ON conversations(therapist_id);
CREATE INDEX IF NOT EXISTS idx_conversations_client ON conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_conversations_active ON conversations(is_active);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(message_type);
CREATE INDEX IF NOT EXISTS idx_message_attachments_message ON message_attachments(message_id);

-- Create triggers for updated_at
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Migrate existing messages to conversations (if any exist)
DO $$
DECLARE
  msg_record RECORD;
  conv_id uuid;
  therapist_id uuid;
  client_id uuid;
BEGIN
  -- Only migrate if there are messages without conversation_id
  IF EXISTS (SELECT 1 FROM messages WHERE conversation_id IS NULL LIMIT 1) THEN
    FOR msg_record IN 
      SELECT DISTINCT sender_id, receiver_id FROM messages WHERE conversation_id IS NULL
    LOOP
      -- Determine who is therapist and who is client
      SELECT id INTO therapist_id FROM users WHERE id IN (msg_record.sender_id, msg_record.receiver_id) AND role = 'therapist';
      SELECT id INTO client_id FROM users WHERE id IN (msg_record.sender_id, msg_record.receiver_id) AND role = 'client';
      
      -- Only create conversation if both therapist and client exist
      IF therapist_id IS NOT NULL AND client_id IS NOT NULL THEN
        -- Get or create conversation
        SELECT get_or_create_conversation(therapist_id, client_id) INTO conv_id;
        
        -- Update messages with conversation_id
        UPDATE messages 
        SET conversation_id = conv_id
        WHERE (sender_id = msg_record.sender_id AND receiver_id = msg_record.receiver_id)
           OR (sender_id = msg_record.receiver_id AND receiver_id = msg_record.sender_id);
      END IF;
    END LOOP;
  END IF;
END $$;
