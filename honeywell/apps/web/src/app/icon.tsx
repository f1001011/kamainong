/**
 * @file 动态生成 favicon
 * @description Next.js 内置的图标生成功能，避免 404 错误
 */

import { ImageResponse } from 'next/og';

// 图标尺寸
export const size = {
  width: 32,
  height: 32,
};

export const contentType = 'image/png';

// 生成图标
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 20,
          background: 'linear-gradient(135deg, #0D6B3D 0%, #095C32 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
          borderRadius: 6,
        }}
      >
        L
      </div>
    ),
    {
      ...size,
    }
  );
}
