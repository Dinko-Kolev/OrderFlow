-- Update all order items that contain Margherita Pizza to now reference Abi
-- This changes the product reference in existing orders without breaking anything

-- First, let's see how many orders will be affected
SELECT COUNT(*) as affected_orders
FROM order_items oi
JOIN products p ON oi.product_id = p.id
WHERE p.name = 'Margherita Pizza';

-- Now update all order items to reference Abi instead of Margherita Pizza
UPDATE order_items 
SET product_id = (SELECT id FROM products WHERE name = 'Abi')
WHERE product_id = (SELECT id FROM products WHERE name = 'Margherita Pizza');

-- Verify the changes
SELECT 
    oi.id as order_item_id,
    o.order_number,
    p.name as product_name,
    oi.quantity,
    oi.unit_price,
    oi.total_price
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
JOIN products p ON oi.product_id = p.id
WHERE p.name = 'Abi'
ORDER BY o.order_number;

-- Now you can safely delete Margherita Pizza if you want
-- DELETE FROM products WHERE name = 'Margherita Pizza';
