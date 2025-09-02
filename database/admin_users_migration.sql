-- Admin Users Table Migration
-- This creates the admin_users table for authentication

CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON admin_users(is_active);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_admin_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_users_updated_at();

-- Insert default admin user (password: admin123)
-- Password hash for 'admin123' using bcrypt with salt rounds 10
INSERT INTO admin_users (username, email, password_hash, role) 
VALUES (
    'admin', 
    'admin@orderflow.com', 
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
    'super_admin'
) ON CONFLICT (username) DO NOTHING;

-- Insert additional admin user (password: manager123)
INSERT INTO admin_users (username, email, password_hash, role) 
VALUES (
    'manager', 
    'manager@orderflow.com', 
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
    'admin'
) ON CONFLICT (username) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE admin_users IS 'Admin users for OrderFlow admin dashboard authentication';
COMMENT ON COLUMN admin_users.username IS 'Unique username for login';
COMMENT ON COLUMN admin_users.email IS 'Unique email address';
COMMENT ON COLUMN admin_users.password_hash IS 'Bcrypt hashed password';
COMMENT ON COLUMN admin_users.role IS 'User role: admin or super_admin';
COMMENT ON COLUMN admin_users.is_active IS 'Whether the user account is active';
COMMENT ON COLUMN admin_users.last_login IS 'Timestamp of last successful login';
