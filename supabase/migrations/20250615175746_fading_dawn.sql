/*
  # Sample Data for OTConekt App

  1. Sample Data
    - Sample therapist profiles with different specialties
    - Sample educational content for various conditions
    - Sample appointments and messages for testing

  Note: This is sample data for development and testing purposes.
  In production, real users will create their own accounts and content.
*/

-- Insert sample educational content
INSERT INTO educational_content (title, description, type, url, category, condition_tags, created_by, is_approved) VALUES
(
  'Understanding Stroke Recovery: A Comprehensive Guide',
  'Learn about the different phases of stroke recovery and how occupational therapy can help improve daily living skills and independence.',
  'article',
  'https://www.stroke.org/en/about-stroke/stroke-recovery',
  'Stroke Recovery',
  ARRAY['Stroke Recovery', 'Physical Rehabilitation'],
  (SELECT id FROM users WHERE role = 'therapist' LIMIT 1),
  true
),
(
  'Hand Therapy Exercises for Better Grip Strength',
  'A collection of simple exercises you can do at home to improve hand strength and dexterity after injury or surgery.',
  'video',
  'https://www.youtube.com/watch?v=example1',
  'Hand Therapy',
  ARRAY['Hand Therapy', 'Physical Rehabilitation'],
  (SELECT id FROM users WHERE role = 'therapist' LIMIT 1),
  true
),
(
  'Supporting Children with Autism: Daily Routines',
  'Practical strategies for creating structured daily routines that help children with autism spectrum disorders thrive.',
  'article',
  'https://www.autism.org/daily-routines',
  'Autism Support',
  ARRAY['Autism Support', 'Pediatric OT'],
  (SELECT id FROM users WHERE role = 'therapist' LIMIT 1),
  true
),
(
  'Cognitive Exercises for Brain Injury Recovery',
  'Evidence-based cognitive rehabilitation exercises to help improve memory, attention, and problem-solving skills.',
  'video',
  'https://www.youtube.com/watch?v=example2',
  'Cognitive Therapy',
  ARRAY['Brain Injury', 'Cognitive Therapy'],
  (SELECT id FROM users WHERE role = 'therapist' LIMIT 1),
  true
),
(
  'Managing Arthritis: Joint Protection Techniques',
  'Learn effective joint protection strategies and adaptive techniques to manage arthritis symptoms in daily activities.',
  'article',
  'https://www.arthritis.org/joint-protection',
  'Geriatric Care',
  ARRAY['Arthritis', 'Geriatric Care'],
  (SELECT id FROM users WHERE role = 'therapist' LIMIT 1),
  true
),
(
  'Sensory Integration Activities for Children',
  'Fun and engaging sensory activities that can be done at home to support children with sensory processing challenges.',
  'video',
  'https://www.youtube.com/watch?v=example3',
  'Pediatric OT',
  ARRAY['Autism Support', 'Pediatric OT'],
  (SELECT id FROM users WHERE role = 'therapist' LIMIT 1),
  true
),
(
  'Mental Health and Occupational Therapy',
  'Understanding how occupational therapy approaches mental health through meaningful activities and coping strategies.',
  'article',
  'https://www.mentalhealth.org/occupational-therapy',
  'Mental Health',
  ARRAY['Mental Health', 'Cognitive Therapy'],
  (SELECT id FROM users WHERE role = 'therapist' LIMIT 1),
  true
),
(
  'Workplace Ergonomics and Injury Prevention',
  'Essential ergonomic principles and exercises to prevent workplace injuries and improve productivity.',
  'video',
  'https://www.youtube.com/watch?v=example4',
  'Physical Rehabilitation',
  ARRAY['Physical Rehabilitation', 'Hand Therapy'],
  (SELECT id FROM users WHERE role = 'therapist' LIMIT 1),
  true
);

-- Note: In a real application, you would not insert sample user data
-- as users should register themselves through the authentication system.
-- The educational content above provides a good starting point for the app.