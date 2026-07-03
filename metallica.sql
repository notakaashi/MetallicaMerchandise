-- Create database
CREATE DATABASE IF NOT EXISTS `metallica_merch`;
USE `metallica_merch`;

-- Disable foreign key checks for dropping tables
SET FOREIGN_KEY_CHECKS = 0;

-- Drop tables if they exist
DROP TABLE IF EXISTS `reviews`;
DROP TABLE IF EXISTS `transaction_items`;
DROP TABLE IF EXISTS `transactions`;
DROP TABLE IF EXISTS `product_images`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `users`;

-- Enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Table structure for `users`
CREATE TABLE `users` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL UNIQUE,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','customer') NOT NULL DEFAULT 'customer',
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `token` varchar(255) DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT NULL,
  `updatedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample users
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `status`, `createdAt`, `updatedAt`) VALUES
(1, 'Admin User', 'admin@metallica.store', '$2b$10$CvjvnMtvLYCuYbhw/foVW.AGGACWiAe9DF7z.tY7cLRUYlTJbyGai', 'admin', 'active', NOW(), NOW()),
(2, 'Customer User', 'customer@metallica.store', '$2b$10$JTJYFFMkQQjBxVlMNmFO.OONbFzfKw8bjcA/jDjjYAEfwa/zKVOPi', 'customer', 'active', NOW(), NOW());

-- Table structure for `products`
CREATE TABLE `products` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text,
  `price` decimal(10,2) NOT NULL,
  `stock` int NOT NULL DEFAULT 0,
  `category` enum('shirts','hoodies','posters','accessories','vinyl','other') NOT NULL DEFAULT 'other',
  `createdAt` timestamp NULL DEFAULT NULL,
  `updatedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample products
INSERT INTO `products` (`id`, `name`, `description`, `price`, `stock`, `category`, `createdAt`, `updatedAt`) VALUES
(1, 'Master of Puppets Tour T-Shirt', 'Classic black tee featuring the iconic album art.', 1800.00, 50, 'shirts', NOW(), NOW()),
(2, 'The Black Album Hoodie', 'Warm pullover hoodie featuring The Black Album artwork.', 3500.00, 30, 'hoodies', NOW(), NOW()),
(3, 'Heavy Metal Snapback Cap', 'Black snapback cap featuring a skull and snake Heavy Metal embroidery.', 1500.00, 100, 'accessories', NOW(), NOW()),
(4, '72 Seasons Vinyl Box Set', 'Limited edition 72 Seasons vinyl collection.', 1500.00, 20, 'vinyl', NOW(), NOW()),
(5, 'Heavy Metal Enamel Pin Set', 'Set of 5 enamel pins including skulls, snakes, and lightning bolts.', 1200.00, 45, 'accessories', NOW(), NOW()),
(6, 'Metal Riot Guitar Strap', 'Premium guitar strap with skull and fire Metal Riot design.', 1000.00, 15, 'accessories', NOW(), NOW()),
(7, 'Iron Fang Coffee Mug', 'Black ceramic mug with Iron Fang Metal Born To Rise design.', 800.00, 25, 'accessories', NOW(), NOW()),
(8, 'And Justice For All Battle Jacket', 'Studded black denim battle jacket covered in heavy metal patches.', 3500.00, 60, 'other', NOW(), NOW()),
(9, 'Thrashing Legion Bandana', 'Black and red bandana featuring skulls and the Void Hammer logo.', 1500.00, 40, 'accessories', NOW(), NOW()),
(10, 'Heavy Metal Wristband Set', 'Set of 3 silicone wristbands: Bloodstone, Iron Riot, and Skullcrusher.', 900.00, 35, 'accessories', NOW(), NOW()),
(11, 'The Black Album Framed Poster', 'Premium framed black poster featuring the iconic metallic silver coiled snake from The Black Album.', 1200.00, 40, 'posters', NOW(), NOW()),
(12, 'Classic Logo Black Beanie', 'Warm black knit beanie with a high-quality white embroidered Metallica logo.', 800.00, 100, 'accessories', NOW(), NOW()),
(13, 'Don''t Tread On Me T-Shirt', 'Black cotton tee featuring a coiled rattlesnake and bold Don''t Tread On Me lettering.', 1800.00, 80, 'shirts', NOW(), NOW()),
(14, 'Master of Puppets Zip Hoodie', 'Black zip-up hoodie featuring the classic Master of Puppets cemetery artwork on the back.', 3800.00, 30, 'hoodies', NOW(), NOW()),
(15, 'Classic Logo Gray Pullover Hoodie', 'Comfortable heather gray pullover hoodie featuring a bold black embroidered Metallica logo.', 3500.00, 30, 'hoodies', NOW(), NOW()),
(16, 'Red Logo Canvas Flag', 'Heavy-duty black canvas hanging flag/tapestry featuring the classic Metallica logo in blood red.', 1500.00, 40, 'posters', NOW(), NOW()),
(17, 'Silver Logo Red T-Shirt', 'Striking red t-shirt prominently featuring the classic Metallica logo in metallic silver.', 1800.00, 75, 'shirts', NOW(), NOW()),
(18, 'Electric Bolt Audiophile Vinyl', 'Special edition blue translucent 180g vinyl record with stunning lightning bolt cover art.', 2500.00, 20, 'vinyl', NOW(), NOW()),
(19, 'Lightning Bolt Silver Chain', 'Heavy silver Cuban link chain necklace featuring a striking lightning bolt pendant.', 2200.00, 15, 'accessories', NOW(), NOW()),
(20, 'Ride The Lightning Tour Poster', 'Vintage-style parchment poster commemorating the epic 1984-1985 Ride The Lightning World Tour.', 1000.00, 50, 'posters', NOW(), NOW());

-- Table structure for `product_images`
CREATE TABLE `product_images` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` bigint UNSIGNED NOT NULL,
  `image_path` varchar(255) NOT NULL,
  `createdAt` timestamp NULL DEFAULT NULL,
  `updatedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample product images
INSERT INTO `product_images` (`id`, `product_id`, `image_path`, `createdAt`, `updatedAt`) VALUES
(1, 1, 'master_of_puppets_tshirt.jpg', NOW(), NOW()),
(2, 1, 'master_of_puppets_tshirt_2.jpg', NOW(), NOW()),
(3, 3, 'heavy_metal_cap.jpg', NOW(), NOW()),
(4, 4, '72_seasons_vinyl.jpg', NOW(), NOW()),
(5, 5, 'enamel_pin_set.jpg', NOW(), NOW()),
(6, 6, 'metal_riot_guitar_strap.jpg', NOW(), NOW()),
(7, 6, 'metal_riot_guitar_strap_2.jpg', NOW(), NOW()),
(8, 7, 'iron_fang_coffee_mug.jpg', NOW(), NOW()),
(9, 8, 'justice_battle_jacket.jpg', NOW(), NOW()),
(10, 8, 'justice_battle_jacket_2.jpg', NOW(), NOW()),
(11, 8, 'justice_battle_jacket_3.jpg', NOW(), NOW()),
(12, 9, 'thrashing_legion_bandana.jpg', NOW(), NOW()),
(13, 2, 'hoodie.png', NOW(), NOW()),
(14, 10, 'wristband.png', NOW(), NOW()),
(15, 11, 'metallica_black_album_poster.png', NOW(), NOW()),
(16, 12, 'metallica_black_beanie.png', NOW(), NOW()),
(17, 13, 'metallica_black_snake_shirt.png', NOW(), NOW()),
(18, 14, 'metallica_black_zip_hoodie.png', NOW(), NOW()),
(19, 15, 'metallica_gray_pullover_hoodie.png', NOW(), NOW()),
(20, 16, 'metallica_logo_flag_tapestry.png', NOW(), NOW()),
(21, 17, 'metallica_red_logo_shirt.png', NOW(), NOW()),
(22, 18, 'metallica_ride_the_lightning_vinyl.png', NOW(), NOW()),
(23, 19, 'metallica_silver_chain_necklace.png', NOW(), NOW()),
(24, 20, 'metallica_world_tour_poster.png', NOW(), NOW());

-- Table structure for `transactions`
CREATE TABLE `transactions` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` bigint UNSIGNED NOT NULL,
  `status` enum('pending','completed','cancelled','shipped','delivering') NOT NULL DEFAULT 'pending',
  `full_name` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `zip` varchar(20) DEFAULT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `createdAt` timestamp NULL DEFAULT NULL,
  `updatedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample transactions
INSERT INTO `transactions` (`id`, `user_id`, `status`, `total_price`, `createdAt`, `updatedAt`) VALUES
(1, 2, 'completed', 2300.00, NOW(), NOW()),
(2, 2, 'pending', 3500.00, NOW(), NOW());

-- Table structure for `transaction_items`
CREATE TABLE `transaction_items` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `transaction_id` bigint UNSIGNED NOT NULL,
  `product_id` bigint UNSIGNED NOT NULL,
  `quantity` int NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `createdAt` timestamp NULL DEFAULT NULL,
  `updatedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample transaction items
INSERT INTO `transaction_items` (`id`, `transaction_id`, `product_id`, `quantity`, `price`, `createdAt`, `updatedAt`) VALUES
(1, 1, 1, 1, 1800.00, NOW(), NOW()),
(2, 1, 3, 1, 500.00, NOW(), NOW()),
(3, 2, 2, 1, 3500.00, NOW(), NOW());

-- Table structure for `reviews`
CREATE TABLE `reviews` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` bigint UNSIGNED NOT NULL,
  `product_id` bigint UNSIGNED NOT NULL,
  `transaction_id` bigint UNSIGNED NOT NULL,
  `rating` tinyint NOT NULL,
  `comment` text,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_product_review` (`user_id`,`product_id`),
  KEY `product_id` (`product_id`),
  KEY `transaction_id` (`transaction_id`),
  CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reviews_ibfk_3` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reviews_chk_rating` CHECK (`rating` BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
