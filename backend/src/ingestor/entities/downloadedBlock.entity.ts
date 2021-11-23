import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
export class DownloadedBlock {
  public constructor(init?: Partial<DownloadedBlock>) {
    Object.assign(this, init);
  }
  @PrimaryKey()
  id!: number;

  @Property()
  lastDownloadedBlock: number;
}
