/**
 * @file Next.js Instrumentation - 定时任务启动入口
 * @description 在 Next.js 应用启动时初始化定时任务服务
 * @depends 开发文档/05-后端服务/05.3-定时任务.md
 * 
 * Next.js Instrumentation 会在服务器启动时执行一次
 * 用于初始化全局资源，如定时任务、数据库连接等
 */

export async function register() {
  // 仅在 Node.js 运行时（服务端）启动定时任务
  // 避免在 Edge Runtime 或客户端执行
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      // 动态导入避免在 Edge Runtime 中报错
      const { startAllJobs } = await import('./jobs');
      await startAllJobs();
      console.log('[Instrumentation] 定时任务服务启动成功');
    } catch (error) {
      console.error('[Instrumentation] 定时任务服务启动失败:', error);
      // 不抛出错误，避免阻止 Next.js 启动
      // 定时任务启动失败不应该影响 API 服务
    }
  }
}
