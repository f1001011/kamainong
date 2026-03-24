/**
 * @file PostCSS 插件 - 旧浏览器兼容性最终处理
 * @description 处理 Tailwind CSS 4 输出中旧浏览器不支持的 CSS 特性
 *
 * 兼容目标：iOS Safari 13+ / Chrome 80+ / Android WebView 80+
 *
 * 处理内容：
 * 1. 展开 @layer xxx { ... } → 直接输出内容（iOS < 15.4 不支持 @layer）
 * 2. 为 @property 生成 *, ::before, ::after 降级声明
 *    - 保留原 @property（现代浏览器用它获得 inherits:false 行为）
 *    - 同时生成通配符规则设置初始值（旧浏览器的降级方案）
 *    - 不能删除 @property！否则现代浏览器也会丢失变量初始值
 *
 * 不处理的内容（由上游 PostCSS 插件处理）：
 * - CSS 嵌套 → postcss-nesting
 * - color-mix() → @csstools/postcss-color-mix-function
 * - oklch/oklab → @csstools/postcss-oklab-function
 *
 * 不处理的内容（接受优雅降级）：
 * - 独立 transform 属性 (translate/scale/rotate) → Chrome < 104 不生效，不影响可用性
 *   注意：不能转为 transform: 因为多个 transform 会互相覆盖！
 */

const plugin = () => {
  return {
    postcssPlugin: 'postcss-compat-unwrap',

    Once(root) {
      const postcss = require('postcss');

      // ============================================
      // 步骤1: 展开 @layer 块为普通 CSS
      // iOS < 15.4 不认识 @layer，会忽略整个块内的所有样式
      // ============================================
      root.walkAtRules('layer', (atRule) => {
        if (atRule.nodes && atRule.nodes.length > 0) {
          for (const node of atRule.nodes) {
            atRule.parent.insertBefore(atRule, node.clone());
          }
        }
        atRule.remove();
      });

      // ============================================
      // 步骤2: 为 @property 生成 *, ::before, ::after 降级
      //
      // Tailwind CSS 4 使用 @property 注册 CSS 变量并设置初始值，例如：
      //   @property --tw-translate-y { syntax:"*"; inherits:false; initial-value:0; }
      //
      // .translate-x-1/2 只设置 --tw-translate-x，但引用 --tw-translate-y：
      //   translate: var(--tw-translate-x) var(--tw-translate-y);
      //
      // 如果没有 @property 的 initial-value:0，--tw-translate-y 就是 undefined，
      // 导致整条 translate 声明无效，元素完全不移动。
      //
      // 解决方案：
      // - 保留 @property（现代浏览器用 inherits:false 获得正确行为）
      // - 额外生成 *, ::before, ::after 规则显式设置初始值
      //   （旧浏览器忽略 @property，但能读到这个通配符规则）
      //
      // 这与 Tailwind CSS v3 的做法一致（v3 在 base 层设 *, ::before, ::after）
      // ============================================
      const fallbacks = [];

      root.walkAtRules('property', (atRule) => {
        const propName = atRule.params.trim();
        let initialValue = null;

        atRule.walkDecls('initial-value', (decl) => {
          initialValue = decl.value;
        });

        // 只收集有 initial-value 的属性
        // 没有 initial-value 的属性（如 --tw-rotate-x）本身就是 undefined，
        // 使用时总会先显式设置，无需降级
        if (initialValue !== null) {
          fallbacks.push({ prop: propName, value: initialValue });
        }

        // 重要：不删除 @property！
        // 现代浏览器需要它来实现 inherits:false 行为
        // 旧浏览器会直接忽略 @property（无害）
      });

      if (fallbacks.length > 0) {
        // 注意：不包含 ::backdrop
        // ::backdrop 在 Safari < 15.4 上无效，会导致整条选择器规则被丢弃
        // （CSS Selectors Level 3 规定选择器列表中有无效项则整条规则无效）
        const rule = postcss.rule({ selector: '*, ::before, ::after' });
        for (const { prop, value } of fallbacks) {
          rule.append(postcss.decl({ prop, value }));
        }
        // 插入到样式表开头，确保优先级最低（任何工具类都能覆盖）
        root.prepend(rule);
      }
    },
  };
};

plugin.postcss = true;
module.exports = plugin;
