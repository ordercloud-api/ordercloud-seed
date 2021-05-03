import dotenv from 'dotenv';
import { download } from './actions/download';

dotenv.config({ path: '.env' }); // everything in here should be command line args eventually

download(process.env.PORTAL_USERNAME, process.env.PORTAL_PASSWORD, process.env.OC_ENV, process.env.ORG_ID);
