import { PaymentChannel, ChannelConfig } from './types';
import { LwpayChannel } from './channels/lwpay';
import { UzpayChannel } from './channels/uzpay';
import { JypayChannel } from './channels/jypay';

/**
 * 支付通道管理器
 */
class PaymentChannelManager {
  private channels: Map<string, PaymentChannel> = new Map();

  constructor() {
    // 注册通道
    this.register(new LwpayChannel());
    this.register(new UzpayChannel());
    this.register(new JypayChannel());
  }

  /**
   * 注册支付通道
   */
  register(channel: PaymentChannel): void {
    this.channels.set(channel.code, channel);
  }

  /**
   * 获取支付通道
   */
  getChannel(code: string): PaymentChannel {
    const channel = this.channels.get(code);
    if (!channel) {
      throw new Error(`Payment channel ${code} not found`);
    }
    return channel;
  }

  /**
   * 获取所有支付通道
   */
  getAllChannels(): PaymentChannel[] {
    return Array.from(this.channels.values());
  }

  /**
   * 检查通道是否存在
   */
  hasChannel(code: string): boolean {
    return this.channels.has(code);
  }

  /**
   * 配置支付通道
   */
  configureChannel(code: string, config: ChannelConfig): void {
    const channel = this.getChannel(code);
    channel.setConfig(config);
  }
}

// 导出单例
export const paymentManager = new PaymentChannelManager();
