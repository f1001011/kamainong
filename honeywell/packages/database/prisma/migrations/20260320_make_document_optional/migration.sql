-- 摩洛哥961通道不需要证件信息，改为可选字段
ALTER TABLE `bank_cards` MODIFY COLUMN `documentType` ENUM('CC', 'CE', 'NIT', 'PP') NULL;
ALTER TABLE `bank_cards` MODIFY COLUMN `documentNo` VARCHAR(255) NULL;
