-- 初始化产品数据
USE kamainong;

-- 清空现有产品数据
TRUNCATE TABLE ntp_common_goods;

-- 插入体验产品
INSERT INTO ntp_common_goods (id, goods_type_id, goods_name, goods_money, day_red, income_times_per_day, income_per_time, total_money, revenue_lv, period, status, red_way, warrant, create_time, is_examine, sort, buy_num, del) 
VALUES (1, 1, 'Produit d\'expérience', 0.00, 110.00, 1, 110.00, 330.00, 0.00, 3, 1, 2, 'AVIVA', NOW(), 1, 1, 1, 0);

-- 插入固定收益产品 1-5
INSERT INTO ntp_common_goods (id, goods_type_id, goods_name, goods_money, day_red, income_times_per_day, income_per_time, total_money, revenue_lv, period, status, red_way, warrant, create_time, is_examine, sort, buy_num, del) 
VALUES 
(2, 1, 'Revenu fixe 1', 8000.00, 330.00, 3, 110.00, 120450.00, 24.24, 365, 1, 2, 'AVIVA', NOW(), 0, 2, 0, 0),
(3, 1, 'Revenu fixe 2', 45000.00, 1600.00, 5, 320.00, 584000.00, 28.13, 365, 1, 2, 'AVIVA', NOW(), 0, 3, 0, 0),
(4, 1, 'Revenu fixe 3', 100000.00, 3600.00, 10, 360.00, 1314000.00, 27.78, 365, 2, 2, 'AVIVA', NOW(), 0, 4, 0, 0),
(5, 1, 'Revenu fixe 4', 380000.00, 14250.00, 15, 950.00, 5201250.00, 26.67, 365, 2, 2, 'AVIVA', NOW(), 0, 5, 0, 0),
(6, 1, 'Revenu fixe 5', 800000.00, 31000.00, 20, 1550.00, 11315000.00, 25.81, 365, 2, 2, 'AVIVA', NOW(), 0, 6, 0, 0);

-- 插入固定收益产品 6-10
INSERT INTO ntp_common_goods (id, goods_type_id, goods_name, goods_money, day_red, income_times_per_day, income_per_time, total_money, revenue_lv, period, status, red_way, warrant, create_time, is_examine, sort, buy_num, del) 
VALUES 
(7, 1, 'Revenu fixe 6', 1600000.00, 64500.00, 30, 2150.00, 23542500.00, 24.81, 365, 2, 2, 'AVIVA', NOW(), 0, 7, 0, 0),
(8, 1, 'Revenu fixe 7', 3000000.00, 160000.00, 40, 4000.00, 58400000.00, 18.75, 365, 2, 2, 'AVIVA', NOW(), 0, 8, 0, 0),
(9, 1, 'Revenu fixe 8', 7000000.00, 410000.00, 50, 8200.00, 149650000.00, 17.07, 365, 2, 2, 'AVIVA', NOW(), 0, 9, 0, 0),
(10, 1, 'Revenu fixe 9', 13000000.00, 810000.00, 60, 13500.00, 295650000.00, 16.05, 365, 2, 2, 'AVIVA', NOW(), 0, 10, 0, 0),
(11, 1, 'Revenu fixe 10', 18000000.00, 1200000.00, 80, 15000.00, 438000000.00, 15.00, 365, 2, 2, 'AVIVA', NOW(), 0, 11, 0, 0);


-- 清空VIP数据
TRUNCATE TABLE ntp_common_vip;

-- 插入SVIP 1-5
INSERT INTO ntp_common_vip (id, vip, reward_money, buy_goods_id, buy_goods_num) 
VALUES 
(1, 1, 50.00, 2, 2),
(2, 2, 80.00, 3, 2),
(3, 3, 120.00, 4, 2),
(4, 4, 160.00, 5, 2),
(5, 5, 200.00, 6, 2);


-- 插入SVIP 6-10
INSERT INTO ntp_common_vip (id, vip, reward_money, buy_goods_id, buy_goods_num) 
VALUES 
(6, 6, 240.00, 7, 2),
(7, 7, 280.00, 8, 2),
(8, 8, 320.00, 9, 2),
(9, 9, 360.00, 10, 2),
(10, 10, 500.00, 11, 2);

