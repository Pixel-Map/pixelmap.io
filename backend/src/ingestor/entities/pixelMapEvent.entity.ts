import { Entity, PrimaryKey, Property, Unique } from '@mikro-orm/core';

@Entity()
@Unique({ properties: ['txHash', 'logIndex'] })
export class PixelMapEvent {
  public constructor(init?: Partial<PixelMapEvent>) {
    Object.assign(this, init);
  }

  @PrimaryKey()
  id!: number;

  @Property()
  block: number;

  @Property()
  txHash: string;

  @Property()
  logIndex: number;

  @Property({
    type: 'jsonb',
  })
  eventData;

  @Property({
    type: 'jsonb',
  })
  txData;
}
