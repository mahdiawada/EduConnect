import express from 'express';
import helmet from 'helmet';
import cors from 'cors'; 
import routes from './routes';
import config from './config';
import logger from './utils/logger';

const app = express();

app.use(helmet());


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());

app.use('/', routes);

app.listen(config.port, config.host, () => {
    logger.info('Server is running on http://%s:%d', config.host, config.port);
});