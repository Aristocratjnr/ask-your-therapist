/*
  # Fix User Sign Up RLS Policy

  1. Security Updates
    - Update the INSERT policy for users table to allow authenticated users to create their own profile
    - Ensure the policy checks that the user is inserting their own ID
    - Maintain security while allowing sign up flow to work

  This fixes the "New row violates row-level security policy" error during user registration.
*/

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Users can insert own data" ON users;

-- Create a new INSERT policy that properly handles sign up
CREATE POLICY "Users can insert own data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Also ensure we have a policy for unauthenticated users during the sign up process
-- This is needed because the user might not be fully authenticated when the profile is created
CREATE POLICY "Allow user creation during signup"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Drop the overly permissive policy and keep only the secure one
DROP POLICY IF EXISTS "Allow user creation during signup" ON users;

-- Create the correct policy that allows users to insert their own data
CREATE POLICY "Users can create own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);