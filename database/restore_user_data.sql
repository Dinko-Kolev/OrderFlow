-- Data Restoration Script for OrderFlow
-- This script restores user data that was lost during database rebuild
-- Run this after the database is initialized with init.sql

-- =============================================
-- RESTORE USER DATA
-- =============================================

-- First, let's check what users exist
SELECT 'Current users:' as info;
SELECT id, email, first_name, last_name FROM users ORDER BY id;

-- =============================================
-- RESTORE ADDRESSES FOR EXISTING USERS
-- =============================================

-- Add addresses for user 1 (john.doe@example.com)
INSERT INTO addresses (user_id, street, city, state, zip_code, is_default) VALUES
(1, 'Calle Mayor 123', 'Madrid', 'Madrid', '28001', true),
(1, 'Avenida de la Paz 456', 'Madrid', 'Madrid', '28002', false),
(1, 'Plaza Mayor 789', 'Madrid', 'Madrid', '28003', false);

-- Add addresses for user 2 (jane.smith@example.com)
INSERT INTO addresses (user_id, street, city, state, zip_code, is_default) VALUES
(2, 'Gran Vía 321', 'Madrid', 'Madrid', '28004', true),
(2, 'Calle de Alcalá 654', 'Madrid', 'Madrid', '28005', false);

-- Add addresses for user 3 (mike.wilson@example.com)
INSERT INTO addresses (user_id, street, city, state, zip_code, is_default) VALUES
(3, 'Paseo de la Castellana 987', 'Madrid', 'Madrid', '28006', true);

-- Add addresses for user 4 (sarah.jones@example.com)
INSERT INTO addresses (user_id, street, city, state, zip_code, is_default) VALUES
(4, 'Calle de Serrano 147', 'Madrid', 'Madrid', '28007', true),
(4, 'Calle de Velázquez 258', 'Madrid', 'Madrid', '28008', false);

-- Add addresses for user 5 (david.brown@example.com)
INSERT INTO addresses (user_id, street, city, state, zip_code, is_default) VALUES
(5, 'Calle de Goya 369', 'Madrid', 'Madrid', '28009', true);

-- =============================================
-- RESTORE ORDERS
-- =============================================

-- Add sample orders for user 1
INSERT INTO orders (user_id, order_number, status, order_type, customer_name, customer_email, customer_phone, total_amount, delivery_fee, delivery_type, delivery_address, payment_method, payment_status, special_instructions, created_at) VALUES
(1, 'ORD-20250815-0001', 'delivered', 'delivery', 'John Doe', 'john.doe@example.com', '+34 600 000 001', 25.99, 2.50, 'delivery', 'Calle Mayor 123, Madrid, Madrid, 28001', 'card', 'paid', 'Extra cheese please', '2025-08-15 19:30:00'),
(1, 'ORD-20250815-0002', 'preparing', 'pickup', 'John Doe', 'john.doe@example.com', '+34 600 000 001', 18.50, 0.00, 'pickup', NULL, 'card', 'paid', 'No onions', '2025-08-16 12:00:00');

-- Add sample orders for user 2
INSERT INTO orders (user_id, order_number, status, order_type, customer_name, customer_email, customer_phone, total_amount, delivery_fee, delivery_type, delivery_address, payment_method, payment_status, special_instructions, created_at) VALUES
(2, 'ORD-20250815-0003', 'delivered', 'delivery', 'Jane Smith', 'jane.smith@example.com', '+34 600 000 002', 32.75, 2.50, 'delivery', 'Gran Vía 321, Madrid, Madrid, 28004', 'card', 'paid', 'Well done crust', '2025-08-15 20:15:00');

-- Add sample orders for user 3
INSERT INTO orders (user_id, order_number, status, order_type, customer_name, customer_email, customer_phone, total_amount, delivery_fee, delivery_type, delivery_address, payment_method, payment_status, special_instructions, created_at) VALUES
(3, 'ORD-20250815-0004', 'ready', 'pickup', 'Mike Wilson', 'mike.wilson@example.com', '+34 600 000 003', 15.99, 0.00, 'pickup', NULL, 'cash', 'paid', 'Extra sauce on the side', '2025-08-16 13:45:00');

-- Add sample orders for user 4
INSERT INTO orders (user_id, order_number, status, order_type, customer_name, customer_email, customer_phone, total_amount, delivery_fee, delivery_type, delivery_address, payment_method, payment_status, special_instructions, created_at) VALUES
(4, 'ORD-20250815-0005', 'confirmed', 'delivery', 'Sarah Jones', 'sarah.jones@example.com', '+34 600 000 004', 28.50, 2.50, 'delivery', 'Calle de Serrano 147, Madrid, Madrid, 28007', 'card', 'pending', 'Ring doorbell twice', '2025-08-16 18:00:00');

-- Add sample orders for user 5
INSERT INTO orders (user_id, order_number, status, order_type, customer_name, customer_email, customer_phone, total_amount, delivery_fee, delivery_type, delivery_address, payment_method, payment_status, special_instructions, created_at) VALUES
(5, 'ORD-20250815-0006', 'pending', 'delivery', 'David Brown', 'david.brown@example.com', '+34 600 000 005', 22.99, 2.50, 'delivery', 'Calle de Goya 369, Madrid, Madrid, 28009', 'card', 'pending', 'Leave at reception', '2025-08-16 19:30:00');

-- =============================================
-- RESTORE ORDER ITEMS
-- =============================================

-- Add order items for the first order
INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price, customizations, special_instructions, created_at) VALUES
(1, 1, 'Margherita Pizza', 1, 12.99, 12.99, '["extra_cheese"]', 'Extra cheese please', '2025-08-15 19:30:00'),
(1, 2, 'Pepperoni Pizza', 1, 12.99, 12.99, '[]', 'Well done', '2025-08-15 19:30:00');

-- Add order items for the second order
INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price, customizations, special_instructions, created_at) VALUES
(2, 3, 'Hawaiian Pizza', 1, 14.50, 14.50, '["no_onions"]', 'No onions', '2025-08-15 19:30:00'),
(2, 4, 'Garlic Bread', 1, 4.00, 4.00, '[]', 'Extra garlic', '2025-08-15 19:30:00');

-- Add order items for the third order
INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price, customizations, special_instructions, created_at) VALUES
(3, 1, 'Margherita Pizza', 1, 12.99, 12.99, '["well_done_crust"]', 'Well done crust', '2025-08-15 20:15:00'),
(3, 5, 'Caesar Salad', 1, 8.50, 8.50, '[]', 'Extra dressing', '2025-08-15 20:15:00'),
(3, 6, 'Soft Drink', 1, 2.50, 2.50, '[]', 'Diet version', '2025-08-15 20:15:00'),
(3, 7, 'Tiramisu', 1, 6.50, 6.50, '[]', 'Extra coffee flavor', '2025-08-15 20:15:00');

-- Add order items for the fourth order
INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price, customizations, special_instructions, created_at) VALUES
(4, 2, 'Pepperoni Pizza', 1, 12.99, 12.99, '["extra_sauce"]', 'Extra sauce on the side', '2025-08-16 13:45:00'),
(4, 8, 'Chicken Wings', 1, 9.99, 9.99, '["hot_sauce"]', 'Hot sauce', '2025-08-16 13:45:00'),
(4, 6, 'Soft Drink', 1, 2.50, 2.50, '[]', 'Regular', '2025-08-16 13:45:00');

-- Add order items for the fifth order
INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price, customizations, special_instructions, created_at) VALUES
(5, 1, 'Margherita Pizza', 1, 12.99, 12.99, '[]', 'Ring doorbell twice', '2025-08-16 18:00:00'),
(5, 3, 'Hawaiian Pizza', 1, 14.50, 14.50, '[]', 'Regular', '2025-08-16 18:00:00'),
(5, 9, 'Pasta Carbonara', 1, 11.00, 11.00, '[]', 'Extra parmesan', '2025-08-16 18:00:00');

-- Add order items for the sixth order
INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price, customizations, special_instructions, created_at) VALUES
(6, 2, 'Pepperoni Pizza', 1, 12.99, 12.99, '[]', 'Leave at reception', '2025-08-16 19:30:00'),
(6, 10, 'Mushroom Pizza', 1, 13.99, 13.99, '[]', 'Extra mushrooms', '2025-08-16 19:30:00'),
(6, 6, 'Soft Drink', 1, 2.50, 2.50, '[]', 'Regular', '2025-08-16 19:30:00'),
(6, 11, 'Chocolate Ice Cream', 1, 4.50, 4.50, '[]', 'Extra chocolate sauce', '2025-08-16 19:30:00');

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Check restored addresses
SELECT 'Restored addresses:' as info;
SELECT a.id, u.first_name, u.last_name, a.street, a.city, a.state, a.zip_code, a.is_default 
FROM addresses a 
JOIN users u ON a.user_id = u.id 
ORDER BY u.id, a.is_default DESC;

-- Check restored orders
SELECT 'Restored orders:' as info;
SELECT o.id, o.order_number, u.first_name, u.last_name, o.status, o.total_amount, o.created_at 
FROM orders o 
JOIN users u ON o.user_id = u.id 
ORDER BY o.created_at DESC;

-- Check restored order items
SELECT 'Restored order items:' as info;
SELECT oi.id, o.order_number, oi.product_name, oi.quantity, oi.unit_price, oi.total_price 
FROM order_items oi 
JOIN orders o ON oi.order_id = o.id 
ORDER BY o.created_at DESC, oi.id;

-- Summary
SELECT 'Data restoration complete!' as status;
SELECT COUNT(*) as total_addresses FROM addresses;
SELECT COUNT(*) as total_orders FROM orders;
SELECT COUNT(*) as total_order_items FROM order_items;
