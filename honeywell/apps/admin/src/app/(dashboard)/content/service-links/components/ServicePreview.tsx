/**
 * @file 悬浮客服预览组件
 * @description 模拟用户端悬浮客服菜单效果
 * @depends 开发文档/04-后台管理端/04.8-内容管理/04.8.3-客服链接配置页.md
 */

'use client';

import React from 'react';
import { RiCustomerServiceFill } from '@remixicon/react';
import { ServiceLinkIcon } from './ServiceLinkIcon';
import type { ServiceLink } from '@/types/service-link';

interface ServicePreviewProps {
  /** 客服链接列表（仅显示启用的） */
  links: ServiceLink[];
}

/**
 * 悬浮客服预览组件
 * @description 模拟手机端悬浮客服按钮和菜单展示效果
 */
export function ServicePreview({ links }: ServicePreviewProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 20,
      }}
    >
      {/* 模拟手机屏幕 */}
      <div
        style={{
          width: 280,
          height: 500,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 30,
          padding: 10,
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#f5f5f5',
            borderRadius: 22,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* 模拟页面内容 */}
          <div
            style={{
              padding: 16,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* 模拟顶部状态栏 */}
            <div
              style={{
                height: 24,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontSize: 12,
                color: '#666',
                marginBottom: 8,
              }}
            >
              9:41
            </div>

            {/* 模拟页面内容区域 */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              {/* 模拟卡片 */}
              <div
                style={{
                  background: '#fff',
                  borderRadius: 12,
                  padding: 16,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                }}
              >
                <div
                  style={{
                    width: '60%',
                    height: 12,
                    background: '#e8e8e8',
                    borderRadius: 6,
                    marginBottom: 8,
                  }}
                />
                <div
                  style={{
                    width: '80%',
                    height: 8,
                    background: '#f0f0f0',
                    borderRadius: 4,
                    marginBottom: 6,
                  }}
                />
                <div
                  style={{
                    width: '40%',
                    height: 8,
                    background: '#f0f0f0',
                    borderRadius: 4,
                  }}
                />
              </div>

              {/* 模拟列表 */}
              {[1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    background: '#fff',
                    borderRadius: 12,
                    padding: 12,
                    display: 'flex',
                    gap: 12,
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      background: '#f5f5f5',
                      borderRadius: 8,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        width: '50%',
                        height: 10,
                        background: '#e8e8e8',
                        borderRadius: 5,
                        marginBottom: 6,
                      }}
                    />
                    <div
                      style={{
                        width: '70%',
                        height: 6,
                        background: '#f0f0f0',
                        borderRadius: 3,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 菜单列表 */}
          {links.length > 0 && (
            <div
              style={{
                position: 'absolute',
                right: 16,
                bottom: 80,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                animation: 'slideUp 0.3s ease-out',
              }}
            >
              <style jsx>{`
                @keyframes slideUp {
                  from {
                    opacity: 0;
                    transform: translateY(10px);
                  }
                  to {
                    opacity: 1;
                    transform: translateY(0);
                  }
                }
              `}</style>
              {links.map((link, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 16px',
                    backgroundColor: '#fff',
                    borderRadius: 24,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  <ServiceLinkIcon icon={link.icon} size={20} />
                  <span
                    style={{
                      fontSize: 13,
                      color: '#333',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {link.name}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* 悬浮按钮 */}
          <div
            style={{
              position: 'absolute',
              right: 16,
              bottom: 20,
              width: 52,
              height: 52,
              background: 'linear-gradient(135deg, #ff6b00 0%, #ff8533 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(255, 107, 0, 0.4)',
              animation: 'pulse 2s infinite',
            }}
          >
            <style jsx>{`
              @keyframes pulse {
                0%, 100% {
                  box-shadow: 0 4px 12px rgba(255, 107, 0, 0.4);
                }
                50% {
                  box-shadow: 0 4px 20px rgba(255, 107, 0, 0.6);
                }
              }
            `}</style>
            <RiCustomerServiceFill size={24} color="#fff" />
          </div>
        </div>
      </div>

      {/* 预览说明 */}
      <div
        style={{
          marginTop: 16,
          fontSize: 12,
          color: '#999',
          textAlign: 'center',
        }}
      >
        {links.length === 0 ? (
          <span>暂无启用的客服链接</span>
        ) : (
          <span>预览效果（共 {links.length} 个启用链接）</span>
        )}
      </div>
    </div>
  );
}

export default ServicePreview;
