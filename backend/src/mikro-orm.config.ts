import { DataHistory } from './ingestor/entities/dataHistory.entity';
import { PixelMapEvent } from './ingestor/entities/pixelMapEvent.entity';
import { PurchaseHistory } from './ingestor/entities/purchaseHistory.entity';
import { Tile } from './ingestor/entities/tile.entity';
import { TransferHistory } from './ingestor/entities/transferHistory.entity';
import { WrappingHistory } from './ingestor/entities/wrappingHistory.entity';
import { CurrentState } from './ingestor/entities/currentState.entity';

export default {
  entities: [DataHistory, CurrentState, PixelMapEvent, PurchaseHistory, Tile, TransferHistory, WrappingHistory],
  type: 'postgresql',
  dbName: 'postgres',
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'password', // one of `mongo` | `mysql` | `mariadb` | `postgresql` | `sqlite`
};
