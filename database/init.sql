-- OrderFlow Pizza Restaurant Database Schema
-- This script creates the complete database structure for the pizza ordering system

-- Users table for customer management
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Addresses table for delivery addresses
CREATE TABLE IF NOT EXISTS addresses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    street VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table for menu organization
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table for menu items (pizzas, appetizers, drinks, etc.)
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    base_price DECIMAL(10,2) NOT NULL,
    image_url VARCHAR(500),
    is_available BOOLEAN DEFAULT TRUE,
    preparation_time INTEGER DEFAULT 15, -- in minutes
    calories INTEGER,
    allergens TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product sizes (Small, Medium, Large for pizzas)
CREATE TABLE IF NOT EXISTS product_sizes (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    size_name VARCHAR(50) NOT NULL, -- 'Small', 'Medium', 'Large'
    price_modifier DECIMAL(10,2) DEFAULT 0.00, -- Additional cost
    is_available BOOLEAN DEFAULT TRUE
);

-- Toppings/Ingredients table
CREATE TABLE IF NOT EXISTS toppings (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) DEFAULT 0.00,
    is_premium BOOLEAN DEFAULT FALSE,
    category VARCHAR(50), -- 'meat', 'vegetable', 'cheese', etc.
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Junction table for products and their available toppings
CREATE TABLE IF NOT EXISTS product_toppings (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    topping_id INTEGER REFERENCES toppings(id) ON DELETE CASCADE,
    is_included BOOLEAN DEFAULT FALSE, -- True if included in base price
    max_quantity INTEGER DEFAULT 1,
    UNIQUE(product_id, topping_id)
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, preparing, ready, delivered, cancelled
    order_type VARCHAR(20) NOT NULL, -- 'delivery', 'pickup'
    
    -- Customer info (for guest orders)
    customer_name VARCHAR(200),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(20),
    
    -- Delivery info
    delivery_address_id INTEGER REFERENCES addresses(id),
    delivery_address_text TEXT,
    delivery_instructions TEXT,
    
    -- Pricing
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    delivery_fee DECIMAL(10,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    
    -- Timestamps
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estimated_delivery_time TIMESTAMP,
    actual_delivery_time TIMESTAMP,
    
    -- Special instructions
    special_instructions TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    product_size_id INTEGER REFERENCES product_sizes(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    special_instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order item toppings (customizations)
CREATE TABLE IF NOT EXISTS order_item_toppings (
    id SERIAL PRIMARY KEY,
    order_item_id INTEGER REFERENCES order_items(id) ON DELETE CASCADE,
    topping_id INTEGER REFERENCES toppings(id),
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL
);

-- Inventory table for stock management
CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    item_name VARCHAR(200) NOT NULL,
    item_type VARCHAR(50), -- 'ingredient', 'product', 'packaging'
    current_stock INTEGER DEFAULT 0,
    minimum_stock INTEGER DEFAULT 0,
    unit VARCHAR(50), -- 'kg', 'pieces', 'liters', etc.
    cost_per_unit DECIMAL(10,2),
    supplier VARCHAR(200),
    last_restocked TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment transactions
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    payment_method VARCHAR(50) NOT NULL, -- 'credit_card', 'cash', 'paypal', etc.
    payment_status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed, refunded
    amount DECIMAL(10,2) NOT NULL,
    transaction_id VARCHAR(255),
    payment_gateway VARCHAR(100),
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Promotions and discounts
CREATE TABLE IF NOT EXISTS promotions (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    discount_type VARCHAR(20), -- 'percentage', 'fixed_amount'
    discount_value DECIMAL(10,2) NOT NULL,
    minimum_order_amount DECIMAL(10,2) DEFAULT 0.00,
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Staff/Employee management
CREATE TABLE IF NOT EXISTS staff (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL, -- 'admin', 'manager', 'chef', 'delivery'
    phone VARCHAR(20),
    hire_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial data

-- Categories
INSERT INTO categories (name, description, display_order) VALUES
('Pizzas', 'Our delicious handmade pizzas', 1),
('Appetizers', 'Perfect starters for your meal', 2),
('Salads', 'Fresh and healthy salad options', 3),
('Pasta', 'Classic Italian pasta dishes', 4),
('Drinks', 'Beverages to complement your meal', 5),
('Desserts', 'Sweet treats to end your meal', 6)
ON CONFLICT DO NOTHING;

-- Toppings
INSERT INTO toppings (name, price, is_premium, category) VALUES
-- Meats
('Pepperoni', 2.50, false, 'meat'),
('Italian Sausage', 3.00, false, 'meat'),
('Ground Beef', 3.00, false, 'meat'),
('Bacon', 3.50, true, 'meat'),
('Ham', 2.50, false, 'meat'),
('Chicken', 3.00, false, 'meat'),
('Salami', 3.00, true, 'meat'),

-- Vegetables
('Mushrooms', 1.50, false, 'vegetable'),
('Bell Peppers', 1.50, false, 'vegetable'),
('Red Onions', 1.00, false, 'vegetable'),
('Black Olives', 2.00, false, 'vegetable'),
('Green Olives', 2.00, false, 'vegetable'),
('Tomatoes', 1.50, false, 'vegetable'),
('Spinach', 2.00, false, 'vegetable'),
('Artichokes', 3.00, true, 'vegetable'),
('Sun-dried Tomatoes', 3.50, true, 'vegetable'),

-- Cheeses
('Extra Mozzarella', 2.00, false, 'cheese'),
('Parmesan', 2.50, false, 'cheese'),
('Feta', 3.00, true, 'cheese'),
('Goat Cheese', 4.00, true, 'cheese'),
('Blue Cheese', 3.50, true, 'cheese')
ON CONFLICT DO NOTHING;

-- =============================================
-- PRODUCT DATA - FITIFITI RESTAURANT
-- =============================================

-- Clear existing products and reset sequence
DELETE FROM products;
ALTER SEQUENCE products_id_seq RESTART WITH 1;

-- Insert Fitifiti Products - Pizzas
INSERT INTO products (category_id, name, description, base_price, image_url, is_available, preparation_time) VALUES
-- Pizzas
(1, 'Abi', 'Base de tomate, mozzarella fior di latte y albahaca fresca', 7.50, 'https://fitifiti.food2home.es/webapp/img/productos/670f9090b9c598.78485262.webp', true, 12),
(1, 'Tusti', 'Base de tomate, mozzarella, prosciutto cotto, champiñón portobello y orégano', 8.50, 'https://fitifiti.food2home.es/webapp/img/productos/65c230b6d436f3.76100945.jpeg', true, 14),
(1, 'Sami', 'Base de tomate, mozzarella fior di latte, pepperoni picante, prosciutto cotto y albahaca fresca', 9.50, 'https://fitifiti.food2home.es/webapp/img/productos/65c23e45a7f944.21277554.jpeg', true, 14),
(1, 'Eda', 'Base de nata, queso cheddar, pollo braseado, bacon y cebolla morada', 10.00, 'https://fitifiti.food2home.es/webapp/img/productos/65c39d1b334973.22586677.jpeg', true, 15),
(1, 'Kiki', 'Base de nata, mozzarella, grana padano DO, queso scamorza (ahumado), queso gorgonzola y albahaca', 10.50, 'https://fitifiti.food2home.es/webapp/img/productos/65c39e4b2dff25.64785967.jpeg', true, 15),
(1, 'Nara', 'Base de nata, mozzarella, guanciale crujiente, grana padano D.O. y pimienta negra molida', 10.80, 'https://fitifiti.food2home.es/webapp/img/productos/670fa576d21349.10072758.webp', true, 16),
(1, 'Hani', 'Base de tomate, mozzarella, jamón curado, grana padano D.O., huevo y rucula', 11.50, 'https://fitifiti.food2home.es/webapp/img/productos/67fce36d5f0bc6.01158961.webp', true, 16),
(1, 'Kusi', 'Base de barbacoa, mozzarella, bacon, cebolla caramelizada y pollo braseado', 10.00, 'https://fitifiti.food2home.es/webapp/img/productos/65c39cdfe99428.32616451.jpeg', true, 15),
(1, 'Fortunada', 'Base de philadelphia, mozzarella, pistacho, mortadela di bologna y pesto', 11.00, 'https://fitifiti.food2home.es/webapp/img/productos/65bd0c41a77783.57529765.jpeg', true, 16),
(1, 'Leta', 'Base de tomate, mozzarella, atún, alcaparras y anchoas', 11.00, 'https://fitifiti.food2home.es/webapp/img/productos/65c2316ce52413.14020001.jpeg', true, 15),
(1, 'Chara', 'Base de nata, mozzarella fior di late, champiñón portobello, crema de trufa, tomate seco y rúcula', 11.00, 'https://fitifiti.food2home.es/webapp/img/productos/670f951838cb01.13225295.webp', true, 16),
(1, 'Kalea', 'Base de nata, mozzarella, queso de cabra, miel y nueces', 11.50, 'https://fitifiti.food2home.es/webapp/img/productos/65bd0cdfc17445.25414299.jpeg', true, 15),
(1, 'Dembe', 'Base de tomate, mozzarella fior di late, pimiento rojo, pimiento verde, alcachofas, champiñón portobello y cebolla morada', 8.50, 'https://fitifiti.food2home.es/webapp/img/productos/65bd0a8951d865.99416300.jpeg', true, 14),
(1, 'Pinpon', 'Base de philadephia, mozzarella, bacon, prosciutto cotto, pollo braseado y orégano', 10.50, 'https://fitifiti.food2home.es/webapp/img/productos/67fcde35498ba0.93085419.webp', true, 15),
(1, 'Cai', 'Base de nata, mozzarella, queso cheddar, pulled pork, bacon, salsa blanca americana y cebolla frita', 11.00, 'https://fitifiti.food2home.es/webapp/img/productos/67fce4038e9a08.53976499.webp', true, 16),
(1, 'Legra', 'Base de tomate, mozzarella, queso gorgonzola, spianata picante y tomatitos cherry', 10.00, 'https://fitifiti.food2home.es/webapp/img/productos/6658c4b321ca49.39752495.webp', true, 15),
(1, 'Japi', 'Base de tomate, queso scarmorza (ahumado), jamón curado, ajo laminado, aceite fresco y queso curado', 10.50, 'https://fitifiti.food2home.es/webapp/img/productos/67fce52cb575f8.97111945.webp', true, 15),
(1, 'Pizza del mes', 'Base de tomate, queso mozzarella, doble de pepperoni y jalapeños (toque picante)', 9.50, 'https://fitifiti.food2home.es/webapp/img/productos/67fce52cb575f8.97111945.webp', true, 14),
(1, 'Pizza a tu gusto', 'Crea tu pizza perfecta eligiendo los ingredientes que más te gusten', 7.50, 'https://fitifiti.food2home.es/webapp/img/revo/MymI1MaUfE.png', true, 12),
(1, 'Fiti SIN LACTOSA', 'Añade los ingredientes que más te gusten', 7.50, 'https://fitifiti.food2home.es/webapp/img/productos/65c22fb2074fd7.44976457.jpeg', true, 12),
(1, 'Calzone salado', 'Calzone relleno de tomate, philadelphia, prosciutto y mozzarella', 8.50, 'https://fitifiti.food2home.es/webapp/img/productos/67fce77d451579.36182932.webp', true, 18),

-- Drinks (Bebidas)
(5, 'Agua', 'Agua mineral natural', 1.20, 'https://fitifiti.food2home.es/webapp/img/productos/67dc003feb2e47.61260375.webp', true, 1),
(5, 'Coca Cola Original', 'La auténtica Coca Cola', 2.20, 'https://fitifiti.food2home.es/webapp/img/revo/yXwMEtnVoi.png', true, 1),
(5, 'Coca Cola Zero', 'Coca Cola sin azúcar', 2.20, 'https://fitifiti.food2home.es/webapp/img/revo/G2ftAXfuD3.png', true, 1),
(5, 'Coca Cola Zero Zero', 'Coca Cola sin azúcar y sin cafeína', 2.20, 'https://fitifiti.food2home.es/webapp/img/revo/Zz6yO3nxRD.png', true, 1),
(5, 'Fanta Naranja', 'Refresco de naranja', 2.20, 'https://fitifiti.food2home.es/webapp/img/revo/5LsKK33EpR.png', true, 1),
(5, 'Fanta Limón', 'Refresco de limón', 2.20, 'https://fitifiti.food2home.es/webapp/img/revo/tOxxVRWzh9.png', true, 1),
(5, 'Aquarius Naranja', 'Bebida isotónica sabor naranja', 2.40, 'https://fitifiti.food2home.es/webapp/img/revo/3LQDajStQb.png', true, 1),
(5, 'Nestea', 'Té helado al limón', 2.40, 'https://fitifiti.food2home.es/webapp/img/revo/3cJnJaJe6Z.png', true, 1),
(5, 'Tinto Limon', 'Vino tinto con limón', 2.50, 'https://fitifiti.food2home.es/webapp/img/productos/6878d6afaf3c20.49762988.webp', true, 1),
(5, 'Nestea de maracuyá', 'Té helado sabor maracuyá', 2.30, 'https://fitifiti.food2home.es/webapp/img/revo/vALTwO4FXQ.png', true, 1),
(5, 'Sprite', 'Refresco de lima-limón', 2.40, 'https://fitifiti.food2home.es/webapp/img/productos/6878d904e03677.13112542.webp', true, 1),
(5, 'Zumo de piña', 'Zumo natural de piña', 1.90, 'https://fitifiti.food2home.es/webapp/img/productos/6878d96e0a6981.91455762.webp', true, 2),
(5, 'Estrella Galicia', 'Cerveza rubia premium', 2.20, 'https://fitifiti.food2home.es/webapp/img/revo/aVABSDYtpW.png', true, 1),
(5, 'Estrella Galicia 0,0', 'Cerveza sin alcohol', 2.20, 'https://fitifiti.food2home.es/webapp/img/revo/7h76vBCvKu.png', true, 1),

-- Desserts (Postres)
(6, 'FitiJoy Lotus', 'Textura cremosa con crema de lotus y topping de galleta lotus', 3.00, 'https://fitifiti.food2home.es/webapp/img/productos/6716197f192262.15003052.webp', true, 5),
(6, 'FitiJoy de choco blanco y oreo', 'Textura cremosa con chocolate blanco y toppings de oreo', 3.00, 'https://fitifiti.food2home.es/webapp/img/productos/671618a3c13656.84093875.webp', true, 5),
(6, 'FitiJoy de choco blanco y kitkat', 'Textura cremosa con chocolate blanco y toppings de Kit Kat', 3.00, 'https://fitifiti.food2home.es/webapp/img/productos/67161a0e427c92.78172695.webp', true, 5),
(6, 'Tarta de Queso Rosa', 'Cremosa tarta de queso rosa al horno', 5.50, 'https://fitifiti.food2home.es/webapp/img/productos/685fb4680cac55.73089930.webp', true, 3),
(6, 'Calzone nutella', 'Relleno de nutella, con toppings de oreo y chocolate', 6.00, 'https://fitifiti.food2home.es/webapp/img/productos/65e19e7099cb90.75749853.jpeg', true, 18),
(6, 'Calzone de chocolate blanco y pistacho', 'Calzone dulce relleno de crema de chocolate blanco con pistacho y toppings de crema de pistacho, extra de chocolate blanco con pistacho y crujientes trocitos de pistacho triturado', 8.00, 'https://fitifiti.food2home.es/webapp/img/productos/68664cd3b933e7.89349087.webp', true, 20);

-- Product Sizes for Pizzas
INSERT INTO product_sizes (product_id, size_name, price_modifier) VALUES
(1, 'Small (10")', 0.00),
(1, 'Medium (12")', 3.00),
(1, 'Large (14")', 6.00),
(2, 'Small (10")', 0.00),
(2, 'Medium (12")', 3.00),
(2, 'Large (14")', 6.00),
(3, 'Small (10")', 0.00),
(3, 'Medium (12")', 3.00),
(3, 'Large (14")', 6.00),
(4, 'Small (10")', 0.00),
(4, 'Medium (12")', 3.00),
(4, 'Large (14")', 6.00)
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create a view for order summary
CREATE OR REPLACE VIEW order_summary AS
SELECT 
    o.id,
    o.order_number,
    o.customer_name,
    o.customer_email,
    o.status,
    o.order_type,
    o.total_amount,
    o.order_date,
    COUNT(oi.id) as item_count
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.order_number, o.customer_name, o.customer_email, o.status, o.order_type, o.total_amount, o.order_date;

-- =============================================
-- TABLE RESERVATIONS SYSTEM
-- =============================================

-- Table for storing restaurant table reservations
CREATE TABLE IF NOT EXISTS table_reservations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),        -- Optional: linked to registered user
    customer_name VARCHAR(255) NOT NULL,         -- Customer full name
    customer_email VARCHAR(255) NOT NULL,        -- Customer email
    customer_phone VARCHAR(50) NOT NULL,         -- Customer phone
    reservation_date DATE NOT NULL,              -- Reservation date
    reservation_time TIME NOT NULL,              -- Reservation time
    number_of_guests INTEGER NOT NULL CHECK (number_of_guests > 0 AND number_of_guests <= 20),
    special_requests TEXT,                       -- Special requests/notes
    table_number INTEGER,                        -- Assigned table (for future admin use)
    status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed', 'no_show')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance (important for future admin dashboard queries)
CREATE INDEX IF NOT EXISTS idx_reservations_date_time ON table_reservations(reservation_date, reservation_time);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON table_reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_user ON table_reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_email ON table_reservations(customer_email);
CREATE INDEX IF NOT EXISTS idx_reservations_created ON table_reservations(created_at DESC);

-- View for admin dashboard (future use)
CREATE OR REPLACE VIEW reservation_summary AS
SELECT 
    r.id,
    r.customer_name,
    r.customer_email,
    r.customer_phone,
    r.reservation_date,
    r.reservation_time,
    r.number_of_guests,
    r.special_requests,
    r.table_number,
    r.status,
    r.created_at,
    CASE 
        WHEN u.id IS NOT NULL THEN CONCAT(u.first_name, ' ', u.last_name)
        ELSE NULL 
    END as registered_user_name,
    u.email as registered_user_email
FROM table_reservations r
LEFT JOIN users u ON r.user_id = u.id
ORDER BY r.reservation_date DESC, r.reservation_time DESC;

-- =============================================
-- PIZZA CUSTOMIZATION SYSTEM
-- =============================================

-- Pizza toppings and customization options
CREATE TABLE IF NOT EXISTS pizza_toppings (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    category VARCHAR(50) NOT NULL, -- 'ingredient', 'removal', 'sauce', 'oregano'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert pizza customization options from Fitifiti
INSERT INTO pizza_toppings (name, price, category) VALUES
-- Removal options (Sin...)
('Sin albahaca fresca', 0.00, 'removal'),
('Sin mozzarella fior di latte', 0.00, 'removal'),

-- Ingredients
('Aceitunas negras', 0.50, 'ingredient'),
('Ajo laminado', 0.50, 'ingredient'),
('Albahaca fresca', 0.50, 'ingredient'),
('Alcachofas', 0.50, 'ingredient'),
('Alcaparras', 0.50, 'ingredient'),
('Anchoas x5', 2.00, 'ingredient'),
('Atun', 1.00, 'ingredient'),
('Bacon', 1.00, 'ingredient'),
('Cebolla Caramelizada', 0.50, 'ingredient'),
('Cebolla frita', 0.50, 'ingredient'),
('Cebolla morada', 0.50, 'ingredient'),
('Champiñón Portobello', 0.50, 'ingredient'),
('Cheddar curado', 1.50, 'ingredient'),
('Cheddar rallado', 1.50, 'ingredient'),
('Crema de trufa', 2.00, 'ingredient'),
('Crujiente de queso', 1.00, 'ingredient'),
('Extra mozzarella', 1.00, 'ingredient'),
('Extra mozzarella fior di latte', 1.50, 'ingredient'),
('Grana padano', 1.00, 'ingredient'),
('Guanciale', 2.00, 'ingredient'),
('Huevo', 1.50, 'ingredient'),
('Jamon curado', 2.00, 'ingredient'),
('Miel', 0.50, 'ingredient'),
('Mortadela di bologna', 1.50, 'ingredient'),
('Nueces', 1.00, 'ingredient'),
('Pepperoni picante', 1.00, 'ingredient'),
('Pesto', 2.00, 'ingredient'),
('Philadelphia', 2.00, 'ingredient'),
('Pimienta Negra Molida', 0.00, 'ingredient'),
('Pimiento Rojo', 0.50, 'ingredient'),
('Pimiento verde', 0.50, 'ingredient'),
('Pistacho triturado', 0.50, 'ingredient'),
('Pollo braseado', 1.50, 'ingredient'),
('Prosciutto cotto', 1.50, 'ingredient'),
('Pulled pork', 2.00, 'ingredient'),
('Queso de cabra x2', 2.00, 'ingredient'),
('Queso gorgonzola', 1.50, 'ingredient'),
('Rúcula', 0.50, 'ingredient'),
('Salsa blanca americana', 0.50, 'ingredient'),
('Scamorza', 1.00, 'ingredient'),
('Spianata', 2.00, 'ingredient'),
('Tomate seco', 1.00, 'ingredient'),
('Tomatitos cherry', 0.50, 'ingredient'),

-- Oregano options
('Con Oregano', 0.00, 'oregano'),
('Sin Oregano', 0.00, 'oregano'),

-- Sauce for edges
('Crema de queso y ajo', 1.50, 'sauce');

-- =============================================
-- CART SYSTEM
-- =============================================

-- Shopping cart for users (hybrid: works with or without login)
CREATE TABLE IF NOT EXISTS shopping_carts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, -- NULL for guest carts
    session_id VARCHAR(255), -- For guest cart identification
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days') -- Guest carts expire after 7 days
);

-- Cart items with customization support
CREATE TABLE IF NOT EXISTS cart_items (
    id SERIAL PRIMARY KEY,
    cart_id INTEGER REFERENCES shopping_carts(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    base_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL, -- base_price + customizations
    special_instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cart item customizations (for pizzas)
CREATE TABLE IF NOT EXISTS cart_item_customizations (
    id SERIAL PRIMARY KEY,
    cart_item_id INTEGER REFERENCES cart_items(id) ON DELETE CASCADE,
    topping_id INTEGER REFERENCES pizza_toppings(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1, -- How many of this topping
    price DECIMAL(10,2) NOT NULL, -- Price at time of adding
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_shopping_carts_user ON shopping_carts(user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_carts_session ON shopping_carts(session_id);
CREATE INDEX IF NOT EXISTS idx_shopping_carts_expires ON shopping_carts(expires_at);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product ON cart_items(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_customizations_item ON cart_item_customizations(cart_item_id);

-- Function to update cart updated_at timestamp
CREATE OR REPLACE FUNCTION update_cart_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE shopping_carts SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.cart_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update cart timestamp when items change
CREATE TRIGGER trigger_update_cart_timestamp
    AFTER INSERT OR UPDATE OR DELETE ON cart_items
    FOR EACH ROW
    EXECUTE FUNCTION update_cart_timestamp();

-- =============================================
-- ORDER MANAGEMENT SYSTEM
-- =============================================

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    guest_email VARCHAR(255),
    order_number VARCHAR(20) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled')),
    total_amount DECIMAL(10,2) NOT NULL,
    delivery_fee DECIMAL(10,2) DEFAULT 0,
    delivery_type VARCHAR(20) DEFAULT 'delivery' CHECK (delivery_type IN ('delivery', 'pickup')),
    delivery_address TEXT,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    customer_email VARCHAR(255) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'card',
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    payment_intent_id VARCHAR(255), -- Stripe payment intent ID
    estimated_delivery_time TIMESTAMP,
    special_instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL, -- Store name in case product is deleted
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    customizations JSONB DEFAULT '[]'::jsonb, -- Store pizza customizations
    special_instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order status history for tracking
CREATE TABLE IF NOT EXISTS order_status_history (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number() RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    counter INTEGER;
BEGIN
    -- Generate order number like ORD-YYYYMMDD-XXXX
    SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 13) AS INTEGER)), 0) + 1
    INTO counter
    FROM orders 
    WHERE order_number LIKE 'ORD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-%';
    
    new_number := 'ORD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 4, '0');
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to update order timestamp
CREATE OR REPLACE FUNCTION update_order_timestamp() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update order timestamp
CREATE TRIGGER trigger_update_order_timestamp
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_order_timestamp();

-- Trigger to log status changes
CREATE OR REPLACE FUNCTION log_order_status_change() RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO order_status_history (order_id, status, notes)
        VALUES (NEW.id, NEW.status, 'Status changed from ' || COALESCE(OLD.status, 'null') || ' to ' || NEW.status);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for status history
CREATE TRIGGER trigger_log_order_status_change
    AFTER UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION log_order_status_change();

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO pizza_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO pizza_user; 