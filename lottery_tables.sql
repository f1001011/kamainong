-- 转盘奖品配置表
CREATE TABLE IF NOT EXISTS `ntp_common_lottery_prize` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL COMMENT '奖品名称',
  `type` tinyint(1) NOT NULL DEFAULT '1' COMMENT '奖品类型 1现金 2实物',
  `amount` decimal(10,2) DEFAULT '0.00' COMMENT '现金金额',
  `probability` decimal(5,2) NOT NULL COMMENT '中奖概率(%)',
  `image` varchar(255) DEFAULT NULL COMMENT '奖品图片',
  `status` tinyint(1) DEFAULT '1' COMMENT '状态 1启用 0禁用',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='转盘奖品配置表';

-- 用户转盘记录表
CREATE TABLE IF NOT EXISTS `ntp_common_lottery_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL COMMENT '用户ID',
  `prize_id` int(11) NOT NULL COMMENT '奖品ID',
  `prize_name` varchar(100) NOT NULL COMMENT '奖品名称',
  `prize_type` tinyint(1) NOT NULL COMMENT '奖品类型',
  `amount` decimal(10,2) DEFAULT '0.00' COMMENT '中奖金额',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户转盘记录表';

-- 用户转盘次数表
CREATE TABLE IF NOT EXISTS `ntp_common_lottery_chance` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL COMMENT '用户ID',
  `total_chance` int(11) DEFAULT '0' COMMENT '总次数',
  `used_chance` int(11) DEFAULT '0' COMMENT '已使用次数',
  `today_chance` int(11) DEFAULT '0' COMMENT '今日已转次数',
  `last_spin_date` date DEFAULT NULL COMMENT '最后转盘日期',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户转盘次数表';
