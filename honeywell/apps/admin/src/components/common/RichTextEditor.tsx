'use client';

/**
 * @file 富文本编辑器组件
 * @description 基于 Quill 的自定义 React 包装器，兼容 React 19
 *              替代 react-quill（不兼容 React 19 的 findDOMNode 移除）
 *              支持粘贴图片自动上传
 *
 * 核心设计：
 * - Quill 实例仅在首次挂载时创建，不随 value/onChange 变化重建
 * - 使用 ref 存储最新回调，避免 useEffect 依赖频繁变化
 * - value 同步使用 Delta API 替代 dangerouslyPasteHTML，避免内容重复
 * - 使用 quillReady 状态确保 value 同步在 Quill 就绪后一定执行
 */

import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Spin, message } from 'antd';

// 导入 Quill 样式
import 'quill/dist/quill.snow.css';

// Quill 类型定义
interface QuillInstance {
  root: HTMLElement;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  off: (event: string, handler: (...args: unknown[]) => void) => void;
  getContents: () => unknown;
  setContents: (delta: unknown) => void;
  getText: () => string;
  getSelection: (focus?: boolean) => { index: number; length: number } | null;
  setSelection: (index: number, length?: number) => void;
  focus: () => void;
  blur: () => void;
  enable: (enabled?: boolean) => void;
  disable: () => void;
  hasFocus: () => boolean;
  update: () => void;
  format: (name: string, value: unknown) => void;
  insertEmbed: (index: number, type: string, value: unknown) => void;
  insertText: (index: number, text: string, formats?: Record<string, unknown>) => void;
  deleteText: (index: number, length: number) => void;
  getLength: () => number;
  clipboard: {
    dangerouslyPasteHTML: (indexOrHtml: number | string, html?: string) => void;
    convert: (options: { html: string }) => unknown;
  };
}

interface QuillStatic {
  new (container: HTMLElement, options?: QuillOptions): QuillInstance;
}

interface QuillOptions {
  theme?: string;
  modules?: {
    toolbar?: unknown[][] | { container: unknown[][] };
    clipboard?: { matchVisual: boolean };
  };
  placeholder?: string;
  readOnly?: boolean;
  bounds?: HTMLElement | string;
  formats?: string[];
}

/**
 * 图片上传函数类型
 */
export type ImageUploadHandler = (file: File) => Promise<string>;

export interface RichTextEditorProps {
  /** 编辑器内容（HTML格式） */
  value?: string;
  /** 内容变更回调 */
  onChange?: (value: string) => void;
  /** 占位符 */
  placeholder?: string;
  /** 是否只读 */
  readOnly?: boolean;
  /** 编辑器高度 */
  height?: number | string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 自定义类名 */
  className?: string;
  /** 图片上传处理函数，用于工具栏和粘贴上传 */
  onImageUpload?: ImageUploadHandler;
}

export interface RichTextEditorRef {
  /** 获取编辑器实例 */
  getQuill: () => QuillInstance | null;
  /** 获取纯文本内容 */
  getText: () => string;
  /** 获取 HTML 内容 */
  getHTML: () => string;
  /** 设置 HTML 内容 */
  setHTML: (html: string) => void;
  /** 聚焦编辑器 */
  focus: () => void;
  /** 失焦编辑器 */
  blur: () => void;
}

// 默认工具栏配置
const DEFAULT_TOOLBAR = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ color: [] }, { background: [] }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ align: [] }],
  ['link', 'image'],
  ['clean'],
];

// 编辑器自定义样式 ID
const EDITOR_STYLE_ID = 'rich-text-editor-custom-styles';

// 注入自定义样式
function injectCustomStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(EDITOR_STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = EDITOR_STYLE_ID;
  style.textContent = `
    .ql-container {
      font-size: 14px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue',
        Arial, sans-serif;
    }

    .ql-editor.ql-blank::before {
      color: rgba(0, 0, 0, 0.25);
      font-style: normal;
    }

    .ql-toolbar.ql-snow {
      border-radius: 8px 8px 0 0;
      border-color: #d9d9d9;
    }

    .ql-container.ql-snow {
      border-radius: 0 0 8px 8px;
      border-color: #d9d9d9;
    }

    .ql-snow .ql-picker {
      color: rgba(0, 0, 0, 0.88);
    }

    .ql-snow .ql-stroke {
      stroke: rgba(0, 0, 0, 0.88);
    }

    .ql-snow .ql-fill {
      fill: rgba(0, 0, 0, 0.88);
    }

    .ql-snow.ql-toolbar button:hover,
    .ql-snow .ql-toolbar button:hover,
    .ql-snow.ql-toolbar button:focus,
    .ql-snow .ql-toolbar button:focus,
    .ql-snow.ql-toolbar button.ql-active,
    .ql-snow .ql-toolbar button.ql-active,
    .ql-snow.ql-toolbar .ql-picker-label:hover,
    .ql-snow .ql-toolbar .ql-picker-label:hover,
    .ql-snow.ql-toolbar .ql-picker-label.ql-active,
    .ql-snow .ql-toolbar .ql-picker-label.ql-active,
    .ql-snow.ql-toolbar .ql-picker-item:hover,
    .ql-snow .ql-toolbar .ql-picker-item:hover,
    .ql-snow.ql-toolbar .ql-picker-item.ql-selected,
    .ql-snow .ql-toolbar .ql-picker-item.ql-selected {
      color: #1677ff;
    }

    .ql-snow.ql-toolbar button:hover .ql-stroke,
    .ql-snow .ql-toolbar button:hover .ql-stroke,
    .ql-snow.ql-toolbar button:focus .ql-stroke,
    .ql-snow .ql-toolbar button:focus .ql-stroke,
    .ql-snow.ql-toolbar button.ql-active .ql-stroke,
    .ql-snow .ql-toolbar button.ql-active .ql-stroke {
      stroke: #1677ff;
    }

    .ql-snow.ql-toolbar button:hover .ql-fill,
    .ql-snow .ql-toolbar button:hover .ql-fill,
    .ql-snow.ql-toolbar button:focus .ql-fill,
    .ql-snow .ql-toolbar button:focus .ql-fill,
    .ql-snow.ql-toolbar button.ql-active .ql-fill,
    .ql-snow .ql-toolbar button.ql-active .ql-fill {
      fill: #1677ff;
    }
  `;
  document.head.appendChild(style);
}

/**
 * 获取编辑器当前HTML（标准化空内容判断）
 */
function getEditorHTML(quill: QuillInstance): string {
  const html = quill.root.innerHTML;
  const isEmpty = html === '<p><br></p>' || html === '<p></p>' || !html;
  return isEmpty ? '' : html;
}

/**
 * 安全地设置 Quill 编辑器的 HTML 内容
 */
function setQuillHTML(quill: QuillInstance, html: string) {
  try {
    const delta = quill.clipboard.convert({ html });
    quill.setContents(delta);
  } catch {
    // fallback: 先清空再粘贴
    quill.deleteText(0, quill.getLength());
    quill.clipboard.dangerouslyPasteHTML(0, html);
  }
}

/**
 * 富文本编辑器组件
 * 使用原生 Quill 实现，兼容 React 19
 * 支持图片粘贴和工具栏上传
 */
const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
  (
    {
      value = '',
      onChange,
      placeholder = '请输入内容...',
      readOnly = false,
      height = 300,
      style,
      className,
      onImageUpload,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<HTMLDivElement>(null);
    const quillRef = useRef<QuillInstance | null>(null);

    // 使用 ref 存储最新回调引用，避免 stale closure
    const onChangeRef = useRef(onChange);
    const onImageUploadRef = useRef(onImageUpload);
    const isInternalChange = useRef(false);

    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    // ========================================
    // 关键状态：标记 Quill 是否已就绪
    // 用于 value 同步 effect 的依赖，确保 Quill 就绪后一定触发同步
    // ========================================
    const [quillReady, setQuillReady] = useState(false);

    // 保持回调 ref 最新
    useEffect(() => {
      onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
      onImageUploadRef.current = onImageUpload;
    }, [onImageUpload]);

    /**
     * 处理图片上传
     */
    const handleImageUpload = useCallback(async (file: File) => {
      if (!onImageUploadRef.current) {
        message.warning('图片上传功能未配置');
        return;
      }

      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        message.error('仅支持 JPG/PNG/GIF/WEBP 格式的图片');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        message.error('图片大小不能超过 5MB');
        return;
      }

      try {
        message.loading({ content: '正在上传图片...', key: 'imageUpload' });
        const url = await onImageUploadRef.current(file);

        const quill = quillRef.current;
        if (quill) {
          const selection = quill.getSelection(true);
          const index = selection ? selection.index : quill.getText().length;
          quill.insertEmbed(index, 'image', url);
          quill.setSelection(index + 1);
        }

        message.success({ content: '图片上传成功', key: 'imageUpload' });
      } catch (error) {
        console.error('图片上传失败:', error);
        message.error({ content: '图片上传失败', key: 'imageUpload' });
      }
    }, []);

    // 标记客户端已挂载
    useEffect(() => {
      setMounted(true);
      injectCustomStyles();
    }, []);

    // ========================================
    // Quill 初始化（仅在首次挂载时执行一次）
    // ========================================
    useEffect(() => {
      if (!mounted || !editorRef.current || quillRef.current) {
        return;
      }

      let destroyed = false;

      const initQuill = async () => {
        try {
          const QuillModule = await import('quill');
          const Quill = QuillModule.default as unknown as QuillStatic;

          if (destroyed || !editorRef.current || quillRef.current) {
            return;
          }

          // 创建 Quill 实例（仅创建一次）
          const quill = new Quill(editorRef.current, {
            theme: 'snow',
            modules: {
              toolbar: DEFAULT_TOOLBAR,
              clipboard: {
                matchVisual: false,
              },
            },
            placeholder,
            readOnly,
          });

          quillRef.current = quill;

          // 监听内容变更 - 通过 ref 获取最新的 onChange
          quill.on('text-change', () => {
            if (isInternalChange.current) return;
            if (onChangeRef.current) {
              const html = getEditorHTML(quill);
              onChangeRef.current(html);
            }
          });

          // 自定义图片按钮处理器
          const toolbar = quill.root.closest('.ql-container')?.previousElementSibling;
          const imageButton = toolbar?.querySelector('.ql-image');
          if (imageButton) {
            imageButton.addEventListener('click', (e) => {
              if (!onImageUploadRef.current) return;
              e.stopPropagation();

              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/jpeg,image/png,image/gif,image/webp';
              input.onchange = () => {
                const file = input.files?.[0];
                if (file) {
                  handleImageUpload(file);
                }
              };
              input.click();
            });
          }

          // 绑定粘贴事件 - 拦截图片粘贴
          quill.root.addEventListener('paste', (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;

            for (let i = 0; i < items.length; i++) {
              const item = items[i];
              if (item.type.startsWith('image/')) {
                e.preventDefault();
                const file = item.getAsFile();
                if (file) {
                  handleImageUpload(file);
                }
                break;
              }
            }
          });

          setLoading(false);
          // ========================================
          // 关键：标记 Quill 已就绪
          // 这会触发 value 同步 effect 重新执行
          // ========================================
          setQuillReady(true);
        } catch (error) {
          console.error('Failed to load Quill:', error);
          setLoading(false);
        }
      };

      initQuill();

      // 清理函数 - 仅在组件卸载时执行
      return () => {
        destroyed = true;
        if (quillRef.current) {
          quillRef.current = null;
        }
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mounted]);

    // ========================================
    // 核心：外部 value 同步到 Quill 编辑器
    //
    // 依赖 [value, quillReady] — 这是解决 bug 的关键！
    //
    // 场景1：value 变化时 Quill 已就绪 → 直接同步
    // 场景2：value 在 Quill 未就绪时设置，Quill 稍后就绪
    //        → quillReady 变为 true → effect 重新执行 → 同步
    //
    // 这确保了无论 value 和 Quill 初始化的先后顺序如何，
    // 内容都能被正确同步。
    // ========================================
    useEffect(() => {
      const quill = quillRef.current;
      if (!quill) return;

      const currentHTML = getEditorHTML(quill);

      // 仅当外部传入的 value 与编辑器当前内容不同时才更新
      if (value !== currentHTML) {
        isInternalChange.current = true;
        if (!value) {
          quill.setContents([] as unknown as never);
        } else {
          setQuillHTML(quill, value);
        }
        isInternalChange.current = false;
      }
    }, [value, quillReady]);

    // 同步只读状态
    useEffect(() => {
      if (quillRef.current) {
        quillRef.current.enable(!readOnly);
      }
    }, [readOnly]);

    // 暴露方法给父组件
    useImperativeHandle(ref, () => ({
      getQuill: () => quillRef.current,
      getText: () => quillRef.current?.getText() || '',
      getHTML: () => {
        if (!quillRef.current) return '';
        return getEditorHTML(quillRef.current);
      },
      setHTML: (html: string) => {
        if (quillRef.current) {
          isInternalChange.current = true;
          setQuillHTML(quillRef.current, html);
          isInternalChange.current = false;
        }
      },
      focus: () => quillRef.current?.focus(),
      blur: () => quillRef.current?.blur(),
    }));

    // 计算编辑器高度样式
    const editorHeight = typeof height === 'number' ? `${height}px` : height;

    return (
      <div
        ref={containerRef}
        className={className}
        style={{
          position: 'relative',
          ...style,
        }}
      >
        {/* 加载状态 */}
        {loading && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255, 255, 255, 0.8)',
              zIndex: 10,
              borderRadius: 8,
              border: '1px solid #d9d9d9',
              minHeight: editorHeight,
            }}
          >
            <Spin tip="加载编辑器..." />
          </div>
        )}

        {/* 编辑器容器 */}
        <div
          ref={editorRef}
          style={{
            opacity: loading ? 0 : 1,
          }}
          className="rich-text-editor-container"
        />

        {/* 动态高度样式 */}
        <style>{`
          .rich-text-editor-container .ql-editor {
            min-height: ${editorHeight};
          }
        `}</style>
      </div>
    );
  }
);

RichTextEditor.displayName = 'RichTextEditor';

export default RichTextEditor;
