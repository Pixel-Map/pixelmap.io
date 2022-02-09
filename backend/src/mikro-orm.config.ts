import { DataHistory } from './ingestor/entities/dataHistory.entity';
import { PurchaseHistory } from './ingestor/entities/purchaseHistory.entity';
import { Tile } from './ingestor/entities/tile.entity';
import { TransferHistory } from './ingestor/entities/transferHistory.entity';
import { WrappingHistory } from './ingestor/entities/wrappingHistory.entity';
import { CurrentState } from './ingestor/entities/currentState.entity';
import { PixelMapTransaction } from './ingestor/entities/pixelMapTransaction.entity';

export default {
  entities: [DataHistory, CurrentState, PurchaseHistory, Tile, TransferHistory, WrappingHistory, PixelMapTransaction],
  type: 'postgresql',
  dbName: 'postgres',
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'password', // one of `mongo` | `mysql` | `mariadb` | `postgresql` | `sqlite`
};
