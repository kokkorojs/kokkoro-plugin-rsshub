import RSSHub from 'rsshub';
import { join } from 'path';
import { parse } from 'yaml';
import { writeFile } from 'fs/promises';
import { readFileSync, mkdirSync, existsSync, writeFileSync } from 'fs';

const rsshub_path = join(__workname, 'data/rsshub');
const rss_path = join(rsshub_path, 'rss.json');

const config: config = {
  NO_LOGFILES: true,
};
RSSHub.init(config);

const getRSS = RSSHub.request;
