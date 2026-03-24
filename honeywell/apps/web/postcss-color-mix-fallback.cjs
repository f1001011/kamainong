/**
 * @file PostCSS 插件 - color-mix() CSS变量降级
 * @description 将 color-mix(in oklab, var(--color-xxx) N%, transparent) 降级为 rgba()
 * 
 * 原理：
 * 1. 收集 CSS 中所有 --color-* 变量的 rgb 值
 * 2. 找到所有包含 var(--color-*) 的 color-mix() 调用
 * 3. 计算出实际 rgba 值作为降级回退
 * 4. 在 color-mix() 声明之前插入 rgba() 降级声明
 * 
 * 兼容目标: iOS Safari 13+, Chrome 80+
 */

/**
 * 解析 rgb(r, g, b) 或 rgb(r g b) 字符串为数组
 */
function parseRgb(str) {
  if (!str) return null;
  const match = str.match(/rgb\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)\s*\)/);
  if (!match) return null;
  return [parseFloat(match[1]), parseFloat(match[2]), parseFloat(match[3])];
}

/**
 * 计算 color-mix 结果（简化版：color + transparent 混合 = 设置透明度）
 */
function computeColorMix(rgb, percentage) {
  if (!rgb) return null;
  const alpha = Math.round((percentage / 100) * 1000) / 1000;
  return `rgba(${Math.round(rgb[0])}, ${Math.round(rgb[1])}, ${Math.round(rgb[2])}, ${alpha})`;
}

/**
 * PostCSS 插件主体
 */
const plugin = () => {
  return {
    postcssPlugin: 'postcss-color-mix-fallback',

    Once(root) {
      // 步骤1: 收集所有 --color-* 变量定义
      const colorVars = new Map();
      
      root.walkDecls(/^--color-/, (decl) => {
        const rgb = parseRgb(decl.value);
        if (rgb) {
          colorVars.set(decl.prop, rgb);
        }
      });

      // 特殊颜色
      colorVars.set('--color-white', [255, 255, 255]);
      colorVars.set('--color-black', [0, 0, 0]);
      colorVars.set('--color-transparent', [0, 0, 0]); // transparent = rgba(0,0,0,0)
      colorVars.set('--color-current', null); // currentColor 无法降级
      
      // 步骤2: 找到所有包含 color-mix() 的声明，添加降级
      root.walkDecls((decl) => {
        if (!decl.value || !decl.value.includes('color-mix(')) return;
        
        // 跳过变量定义本身
        if (decl.prop.startsWith('--')) return;
        
        // 匹配模式: color-mix(in oklab, var(--color-xxx) NN%, transparent)
        // 也匹配: color-mix(in oklab, var(--color-xxx), transparent NN%)
        const colorMixRegex = /color-mix\(\s*in\s+\w+\s*,\s*var\((--color-[a-z0-9-]+)\)\s*(\d+(?:\.\d+)?%?)\s*,\s*transparent\s*\)/g;
        const colorMixRegex2 = /color-mix\(\s*in\s+\w+\s*,\s*var\((--color-[a-z0-9-]+)\)\s*,\s*transparent\s+(\d+(?:\.\d+)?%?)\s*\)/g;
        
        let fallbackValue = decl.value;
        let hasReplacement = false;
        
        // 模式1: color-mix(in oklab, var(--color-xxx) 80%, transparent)
        fallbackValue = fallbackValue.replace(
          /color-mix\(\s*in\s+\w+\s*,\s*var\((--color-[a-z0-9-]+)\)\s+(\d+(?:\.\d+)?)%\s*,\s*transparent\s*\)/g,
          (match, varName, percentage) => {
            const rgb = colorVars.get(varName);
            if (rgb) {
              hasReplacement = true;
              return computeColorMix(rgb, parseFloat(percentage));
            }
            return match;
          }
        );
        
        // 模式2: color-mix(in oklab, var(--color-xxx), transparent 20%)
        // 在这种情况下，颜色占比 = 100 - transparent%
        fallbackValue = fallbackValue.replace(
          /color-mix\(\s*in\s+\w+\s*,\s*var\((--color-[a-z0-9-]+)\)\s*,\s*transparent\s+(\d+(?:\.\d+)?)%\s*\)/g,
          (match, varName, transparentPercentage) => {
            const rgb = colorVars.get(varName);
            if (rgb) {
              hasReplacement = true;
              const colorPercent = 100 - parseFloat(transparentPercentage);
              return computeColorMix(rgb, colorPercent);
            }
            return match;
          }
        );

        // 模式3: color-mix(in oklab, currentcolor NN%, transparent) - 无法降级
        // 模式4: color-mix(in lab, red, red) - Tailwind内部polyfill，保留
        
        // 如果有可降级的内容，在当前声明前添加降级版本
        if (hasReplacement && fallbackValue !== decl.value) {
          decl.cloneBefore({
            prop: decl.prop,
            value: fallbackValue,
          });
        }
      });
    },
  };
};

plugin.postcss = true;
module.exports = plugin;
