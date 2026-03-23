-- ===========================
-- 缺失表SQL创建脚本（不含已存在字段）
-- 日期: 2026-03-23
-- ===========================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for ntp_common_vip_daily_reward_log
-- ----------------------------
DROP TABLE IF EXISTS `ntp_common_vip_daily_reward_log`;
CREATE TABLE `ntp_common_vip_daily_reward_log`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL COMMENT '用户ID',
  `vip_level` int(11) NOT NULL COMMENT 'VIP等级',
  `reward_amount` decimal(12, 2) NOT NULL COMMENT '奖励金额',
  `claim_date` date NOT NULL COMMENT '领取日期',
  `create_time` datetime NOT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_user_date`(`user_id`, `claim_date`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = 'VIP每日奖励领取记录表' ROW_FORMAT = Dynamic;


-- ----------------------------
-- Table structure for ntp_common_monthly_salary_config
-- ----------------------------
DROP TABLE IF EXISTS `ntp_common_monthly_salary_config`;
CREATE TABLE `ntp_common_monthly_salary_config`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `team_recharge_amount` decimal(20, 2) NOT NULL COMMENT '团队LV1累计充值要求',
  `reward_amount` decimal(12, 2) NOT NULL COMMENT '奖励金额',
  `sort` int(11) NOT NULL DEFAULT 0 COMMENT '排序',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '月薪奖励配置表' ROW_FORMAT = Dynamic;

INSERT INTO `ntp_common_monthly_salary_config` VALUES (1, 300000.00, 3000.00, 1);
INSERT INTO `ntp_common_monthly_salary_config` VALUES (2, 800000.00, 5000.00, 2);
INSERT INTO `ntp_common_monthly_salary_config` VALUES (3, 1500000.00, 8000.00, 3);
INSERT INTO `ntp_common_monthly_salary_config` VALUES (4, 3000000.00, 15000.00, 4);
INSERT INTO `ntp_common_monthly_salary_config` VALUES (5, 8000000.00, 30000.00, 5);
INSERT INTO `ntp_common_monthly_salary_config` VALUES (6, 30000000.00, 50000.00, 6);


-- ----------------------------
-- Table structure for ntp_common_monthly_salary_log
-- ----------------------------
DROP TABLE IF EXISTS `ntp_common_monthly_salary_log`;
CREATE TABLE `ntp_common_monthly_salary_log`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL COMMENT '用户ID',
  `team_recharge_amount` decimal(20, 2) NOT NULL COMMENT '团队充值金额',
  `reward_amount` decimal(12, 2) NOT NULL COMMENT '奖励金额',
  `claim_month` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '领取月份 格式:2026-03',
  `create_time` datetime NOT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_user_month`(`user_id`, `claim_month`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '月薪领取记录表' ROW_FORMAT = Dynamic;


-- ----------------------------
-- Table structure for ntp_common_agent_level_config
-- ----------------------------
DROP TABLE IF EXISTS `ntp_common_agent_level_config`;
CREATE TABLE `ntp_common_agent_level_config`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `level` int(11) NOT NULL COMMENT '代理级别 1-7',
  `level_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '级别名称',
  `required_members` int(11) NOT NULL COMMENT '需要的充值会员数量',
  `member_type` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '会员类型 LV1或LV123',
  `reward_amount` decimal(12, 2) NOT NULL COMMENT '一次性奖励金额',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 8 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '代理级别配置表' ROW_FORMAT = Dynamic;

INSERT INTO `ntp_common_agent_level_config` VALUES (1, 1, '见习组长', 30, 'LV1', 8000.00);
INSERT INTO `ntp_common_agent_level_config` VALUES (2, 2, '市场主管', 300, 'LV123', 15000.00);
INSERT INTO `ntp_common_agent_level_config` VALUES (3, 3, '市场经理', 500, 'LV123', 45000.00);
INSERT INTO `ntp_common_agent_level_config` VALUES (4, 4, '市场总经理', 800, 'LV123', 90000.00);
INSERT INTO `ntp_common_agent_level_config` VALUES (5, 5, '大区经理', 1200, 'LV123', 200000.00);
INSERT INTO `ntp_common_agent_level_config` VALUES (6, 6, '大区总经理', 3000, 'LV123', 500000.00);
INSERT INTO `ntp_common_agent_level_config` VALUES (7, 7, '城市合作伙伴', 5000, 'LV1', 1000000.00);


-- ----------------------------
-- Table structure for ntp_common_prize_pool_config
-- ----------------------------
DROP TABLE IF EXISTS `ntp_common_prize_pool_config`;
CREATE TABLE `ntp_common_prize_pool_config`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `daily_amount` decimal(12, 2) NOT NULL COMMENT '每日投入金额',
  `prize_1_amount` decimal(12, 2) NOT NULL COMMENT '一等奖金额',
  `prize_2_amount` decimal(12, 2) NOT NULL COMMENT '二等奖金额',
  `prize_3_amount` decimal(12, 2) NOT NULL COMMENT '三等奖金额',
  `draw_time` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '开奖时间 格式:05:00',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '奖池配置表' ROW_FORMAT = Dynamic;

INSERT INTO `ntp_common_prize_pool_config` VALUES (1, 3000.00, 1388.00, 888.00, 688.00, '05:00');


-- ----------------------------
-- Table structure for ntp_common_prize_pool_log
-- ----------------------------
DROP TABLE IF EXISTS `ntp_common_prize_pool_log`;
CREATE TABLE `ntp_common_prize_pool_log`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL COMMENT '用户ID',
  `user_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '用户名',
  `prize_level` tinyint(1) NOT NULL COMMENT '奖项 1一等奖 2二等奖 3三等奖',
  `prize_amount` decimal(12, 2) NOT NULL COMMENT '奖励金额',
  `prize_date` date NOT NULL COMMENT '获奖日期',
  `create_time` datetime NOT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_date`(`prize_date`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '每日奖池获奖记录表' ROW_FORMAT = Dynamic;


-- ----------------------------
-- Table structure for ntp_common_income_claim_log
-- ----------------------------
DROP TABLE IF EXISTS `ntp_common_income_claim_log`;
CREATE TABLE `ntp_common_income_claim_log`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL COMMENT '用户ID',
  `order_id` int(11) NOT NULL COMMENT '订单ID',
  `claim_amount` decimal(12, 2) NOT NULL COMMENT '领取金额',
  `claim_time` datetime NULL DEFAULT NULL COMMENT '领取时间',
  `expire_time` datetime NOT NULL COMMENT '过期时间',
  `status` tinyint(1) NOT NULL DEFAULT 0 COMMENT '状态 0待领取 1已领取 2已过期',
  `create_time` datetime NOT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_user_order`(`user_id`, `order_id`) USING BTREE,
  INDEX `idx_status`(`status`, `expire_time`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '收益领取记录表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- 修改用户表（仅在字段不存在时执行）
-- ----------------------------
ALTER TABLE `ntp_common_user` ADD COLUMN IF NOT EXISTS `agent_level` int(11) NOT NULL DEFAULT 0 COMMENT '代理级别 0-7' AFTER `level_vip`;
ALTER TABLE `ntp_common_user` ADD COLUMN IF NOT EXISTS `agent_level_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '代理级别名称' AFTER `agent_level`;

SET FOREIGN_KEY_CHECKS = 1;

