import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
export class DiscordLastBlock {
  public constructor(init?: Partial<DiscordLastBlock>) {
    Object.assign(this, init);
  }
  @PrimaryKey()
  id!: number;

  @Property()
  lastBlock: number;
}
