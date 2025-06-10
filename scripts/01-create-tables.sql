-- Create the registrations table
CREATE TABLE IF NOT EXISTS registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL,
  phone_type VARCHAR(20) DEFAULT 'egyptian',
  university VARCHAR(255) NOT NULL,
  payment_proof_url TEXT,
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'confirmed', 'rejected')),
  ticket_id VARCHAR(10) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  ticket_sent BOOLEAN DEFAULT FALSE
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_registrations_email ON registrations(email);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(payment_status);
CREATE INDEX IF NOT EXISTS idx_registrations_ticket_id ON registrations(ticket_id);

-- Disable RLS for easier management
ALTER TABLE registrations DISABLE ROW LEVEL SECURITY;

-- Grant all permissions
GRANT ALL PRIVILEGES ON registrations TO postgres;
GRANT ALL PRIVILEGES ON registrations TO service_role;
GRANT ALL PRIVILEGES ON registrations TO authenticated;
GRANT ALL PRIVILEGES ON registrations TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Create storage bucket for payment proofs
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
CREATE POLICY "Allow all operations on payment-proofs" ON storage.objects
FOR ALL 
USING (bucket_id = 'payment-proofs') 
WITH CHECK (bucket_id = 'payment-proofs');

-- Grant storage permissions
GRANT ALL ON storage.objects TO service_role;
GRANT ALL ON storage.buckets TO service_role;
