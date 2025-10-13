export enum ChannelType {
  EMAIL = 'EMAIL',
  PUSH = 'PUSH',
  SMS = 'SMS',
  IN_APP = 'IN_APP',
}

export class DeliveryChannel {
  constructor(
    public readonly type: ChannelType,
    public readonly enabled: boolean = true,
  ) {}

  static fromChannels(channels: string[]): DeliveryChannel[] {
    return channels.map(
      (channel) => new DeliveryChannel(channel as ChannelType, true),
    );
  }

  static toChannels(deliveryChannels: DeliveryChannel[]): string[] {
    return deliveryChannels.filter((dc) => dc.enabled).map((dc) => dc.type);
  }

  static fromChannelTypes(types: ChannelType[]): DeliveryChannel[] {
    return types.map((type) => new DeliveryChannel(type, true));
  }

  isEmail(): boolean {
    return this.type === ChannelType.EMAIL;
  }

  isPush(): boolean {
    return this.type === ChannelType.PUSH;
  }

  isSms(): boolean {
    return this.type === ChannelType.SMS;
  }

  isInApp(): boolean {
    return this.type === ChannelType.IN_APP;
  }
}
