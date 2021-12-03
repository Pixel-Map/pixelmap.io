import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
export class CurrentState {
  public constructor(init?: Partial<CurrentState>) {
    Object.assign(this, init);
  }
  @PrimaryKey()
  state!: StatesToTrack;

  @Property({ default: 0 })
  value: number;
}

export enum StatesToTrack {
  INGESTION_LAST_DOWNLOADED_BLOCK = 'INGESTION_LAST_DOWNLOADED_BLOCK',
  INGESTION_LAST_PROCESSED_PIXEL_MAP_EVENT = 'INGESTION_LAST_PROCESSED_PIXEL_MAP_EVENT',
  NOTIFICATIONS_LAST_PROCESSED_PURCHASE_ID = 'NOTIFICATIONS_LAST_PROCESSED_PURCHASE_ID',
  RENDERER_LAST_PROCESSED_DATA_CHANGE = 'RENDERER_LAST_PROCESSED_DATA_CHANGE',
}
