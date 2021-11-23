import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
export class IngestedEvent {
  public constructor(init?: Partial<IngestedEvent>) {
    Object.assign(this, init);
  }
  @PrimaryKey()
  id!: number;

  @Property()
  lastIngestedEvent: number;
}
