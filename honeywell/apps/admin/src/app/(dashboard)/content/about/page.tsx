/**
 * @file 关于我们配置页
 * @description 编辑前端"关于我们"页面的富文本内容
 * @depends 开发文档/04-后台管理端/04.8-内容管理/04.8.7-关于我们配置页.md
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Card,
  Button,
  Typography,
  Tabs,
  Spin,
  Alert,
  Space,
  message,
} from 'antd';
import {
  RiSaveLine,
  RiEyeLine,
  RiEditLine,
  RiAlertLine,
} from '@remixicon/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DOMPurify from 'isomorphic-dompurify';
import dynamic from 'next/dynamic';

import { ConfirmModal } from '@/components/modals/ConfirmModal';
import {
  getAboutUsContent,
  updateAboutUsContent,
  uploadContentImage,
} from '@/services/page-content';

const { Title, Text } = Typography;

// 动态导入富文本编辑器（避免 SSR 问题）
const RichTextEditor = dynamic(
  () => import('@/components/common/RichTextEditor'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96 border rounded-lg bg-neutral-50">
        <Spin tip="加载编辑器..." />
      </div>
    ),
  }
);

/**
 * 预览面板组件
 * @description 安全渲染 HTML 内容，防止 XSS 攻击
 */
function PreviewPanel({ content }: { content: string }) {
  // 使用 DOMPurify 过滤 XSS 攻击
  const sanitizedContent = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [
      'p', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'strong', 'em', 'u', 's', 'strike',
      'ul', 'ol', 'li',
      'a', 'img',
      'blockquote', 'pre', 'code',
      'span', 'div',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'style', 'class'],
  });

  if (!content || content === '<p><br></p>') {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-neutral-400">
        <RiAlertLine size={48} className="mb-4 opacity-50" />
        <Text type="secondary">暂无内容，请在编辑模式下输入</Text>
      </div>
    );
  }

  return (
    <div
      className="prose prose-neutral max-w-none p-6"
      style={{
        // 富文本内容样式
        lineHeight: 1.8,
      }}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
}

/**
 * 关于我们配置页主组件
 */
export default function AboutConfigPage() {
  const queryClient = useQueryClient();

  // 状态管理
  const [content, setContent] = useState<string>('');
  const [originalContent, setOriginalContent] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [isLargeScreen, setIsLargeScreen] = useState(true);
  const [leaveConfirmVisible, setLeaveConfirmVisible] = useState(false);

  // 用于标记是否允许离开
  const allowLeaveRef = useRef(false);

  // 追踪是否有未保存的更改
  const hasUnsavedChanges = content !== originalContent;

  // 获取内容
  const { data: contentData, isLoading, error } = useQuery({
    queryKey: ['about-content'],
    queryFn: getAboutUsContent,
  });

  // 更新内容
  const updateMutation = useMutation({
    mutationFn: (newContent: string) => updateAboutUsContent(newContent),
    onSuccess: () => {
      message.success('关于我们内容保存成功');
      // 更新原始内容为当前内容
      setOriginalContent(content);
      queryClient.invalidateQueries({ queryKey: ['about-content'] });
    },
    onError: (error: Error) => {
      message.error(error.message || '保存失败，请稍后重试');
    },
  });

  // 初始化内容
  useEffect(() => {
    if (contentData?.content !== undefined) {
      setContent(contentData.content);
      setOriginalContent(contentData.content);
    }
  }, [contentData]);

  // 监听屏幕宽度变化
  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1200);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  // 页面离开提示（浏览器关闭/刷新）
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && !allowLeaveRef.current) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  // 浏览器后退按钮拦截
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    // 添加一个历史记录条目，用于拦截后退
    window.history.pushState(null, '', window.location.href);

    const handlePopState = () => {
      if (hasUnsavedChanges && !allowLeaveRef.current) {
        // 再次推入历史记录，阻止后退
        window.history.pushState(null, '', window.location.href);
        // 显示确认弹窗
        setLeaveConfirmVisible(true);
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [hasUnsavedChanges]);

  /**
   * 处理图片上传
   * @description 将图片上传到服务器，返回 URL
   */
  const handleImageUpload = useCallback(async (file: File): Promise<string> => {
    const result = await uploadContentImage(file);
    return result.url;
  }, []);

  /**
   * 保存内容
   */
  const handleSave = useCallback(async () => {
    if (!content.trim() || content === '<p><br></p>') {
      message.warning('内容不能为空');
      return;
    }

    await updateMutation.mutateAsync(content);
  }, [content, updateMutation]);

  /**
   * 确认离开（放弃更改）
   */
  const handleConfirmLeave = useCallback(() => {
    allowLeaveRef.current = true;
    setLeaveConfirmVisible(false);
    // 执行后退操作
    window.history.back();
  }, []);

  /**
   * 取消离开
   */
  const handleCancelLeave = useCallback(() => {
    setLeaveConfirmVisible(false);
  }, []);

  // 加载状态
  if (isLoading) {
    return (
      <div className="p-6">
        <Card>
          <div className="flex items-center justify-center h-96">
            <Spin size="large" tip="加载中..." />
          </div>
        </Card>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="p-6">
        <Alert
          message="加载失败"
          description="无法获取关于我们页面内容，请刷新页面重试"
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* 页面标题和操作 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={4} style={{ margin: 0 }}>
            关于我们
          </Title>
          <Text type="secondary" className="mt-1 block">
            编辑前端"关于我们"页面的展示内容
          </Text>
        </div>
        <Space>
          {/* 小屏幕显示预览按钮 */}
          {!isLargeScreen && (
            <Button
              icon={activeTab === 'edit' ? <RiEyeLine size={16} /> : <RiEditLine size={16} />}
              onClick={() => setActiveTab(activeTab === 'edit' ? 'preview' : 'edit')}
            >
              {activeTab === 'edit' ? '预览' : '编辑'}
            </Button>
          )}
          <Button
            type="primary"
            icon={<RiSaveLine size={16} />}
            onClick={handleSave}
            loading={updateMutation.isPending}
            disabled={!hasUnsavedChanges}
          >
            保存
          </Button>
        </Space>
      </div>

      {/* 未保存提示 */}
      {hasUnsavedChanges && (
        <Alert
          message="您有未保存的更改"
          type="warning"
          showIcon
          icon={<RiAlertLine size={16} />}
          className="mb-4"
        />
      )}

      {/* 操作提示 */}
      <Alert
        message="编辑说明"
        description="支持富文本格式，可直接粘贴图片自动上传。保存后前端用户刷新页面即可看到更新。"
        type="info"
        showIcon
        className="mb-4"
        closable
      />

      {/* 大屏幕：左右双栏布局 */}
      {isLargeScreen ? (
        <div className="grid grid-cols-2 gap-6">
          {/* 编辑区 */}
          <Card 
            title="编辑内容" 
            className="h-fit"
            styles={{ body: { padding: 0 } }}
          >
            <div className="p-4">
              <RichTextEditor
                value={content}
                onChange={setContent}
                height={500}
                placeholder="请输入关于我们的内容..."
                onImageUpload={handleImageUpload}
              />
            </div>
          </Card>

          {/* 预览区 */}
          <Card 
            title="实时预览" 
            className="h-fit"
            styles={{ body: { padding: 0 } }}
          >
            <div 
              className="border-t overflow-auto bg-neutral-50"
              style={{ minHeight: 500, maxHeight: 600 }}
            >
              <PreviewPanel content={content} />
            </div>
          </Card>
        </div>
      ) : (
        /* 小屏幕：Tab切换布局 */
        <Card styles={{ body: { padding: 0 } }}>
          <Tabs
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key as 'edit' | 'preview')}
            className="px-4"
            items={[
              {
                key: 'edit',
                label: (
                  <span className="flex items-center gap-1">
                    <RiEditLine size={16} />
                    编辑
                  </span>
                ),
                children: (
                  <div className="pb-4">
                    <RichTextEditor
                      value={content}
                      onChange={setContent}
                      height={400}
                      placeholder="请输入关于我们的内容..."
                      onImageUpload={handleImageUpload}
                    />
                  </div>
                ),
              },
              {
                key: 'preview',
                label: (
                  <span className="flex items-center gap-1">
                    <RiEyeLine size={16} />
                    预览
                  </span>
                ),
                children: (
                  <div 
                    className="border rounded-lg bg-neutral-50 overflow-auto mb-4"
                    style={{ minHeight: 400 }}
                  >
                    <PreviewPanel content={content} />
                  </div>
                ),
              },
            ]}
          />
        </Card>
      )}

      {/* 离开确认弹窗 */}
      <ConfirmModal
        open={leaveConfirmVisible}
        onClose={handleCancelLeave}
        onConfirm={handleConfirmLeave}
        title="离开页面"
        content="您有未保存的更改，确定要离开吗？"
        type="warning"
        confirmText="离开"
        cancelText="继续编辑"
        impacts={['未保存的内容将丢失', '需要重新编辑']}
      />

      {/* 富文本预览样式 */}
      <style jsx global>{`
        /* 富文本预览样式 */
        .prose h1 {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 16px;
          color: #262626;
        }
        .prose h2 {
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 14px;
          color: #262626;
        }
        .prose h3 {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 12px;
          color: #262626;
        }
        .prose h4 {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 10px;
          color: #262626;
        }
        .prose p {
          margin-bottom: 16px;
          line-height: 1.8;
          color: #595959;
        }
        .prose img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 16px 0;
        }
        .prose ul, .prose ol {
          padding-left: 24px;
          margin-bottom: 16px;
        }
        .prose li {
          margin-bottom: 8px;
          line-height: 1.6;
        }
        .prose blockquote {
          border-left: 4px solid #FF9F4A;
          padding-left: 16px;
          margin: 16px 0;
          color: #8c8c8c;
          font-style: italic;
          background: #fffcf5;
          padding: 12px 16px;
          border-radius: 0 8px 8px 0;
        }
        .prose a {
          color: #1677ff;
          text-decoration: none;
        }
        .prose a:hover {
          text-decoration: underline;
        }
        .prose strong {
          font-weight: 600;
          color: #262626;
        }
      `}</style>
    </div>
  );
}
