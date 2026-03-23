-- Banner表
CREATE TABLE IF NOT EXISTS `ntp_common_banner` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `position` varchar(50) DEFAULT 'home' COMMENT '位置：home首页',
  `tag` varchar(100) DEFAULT NULL COMMENT '标签',
  `title` varchar(200) NOT NULL COMMENT '标题',
  `subtitle` varchar(500) DEFAULT NULL COMMENT '副标题',
  `bg_color` varchar(100) DEFAULT NULL COMMENT '背景色',
  `link_url` varchar(500) DEFAULT NULL COMMENT '跳转链接',
  `sort` int(11) DEFAULT '0' COMMENT '排序',
  `status` tinyint(1) DEFAULT '1' COMMENT '状态 1启用 0禁用',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Banner表';

-- 插入默认数据
INSERT INTO `ntp_common_banner` (`position`, `tag`, `title`, `subtitle`, `bg_color`, `link_url`, `sort`, `status`) VALUES
('home', 'Plaza', 'Testimonios de retiros', 'Hemos pagado exitosamente a 13982 usuarios', 'linear-gradient(135deg,#00e676,#00c853)', '/upload-proof', 1, 1);
