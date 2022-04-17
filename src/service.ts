import RSSHub from 'rsshub';
import { parse, stringify } from 'yaml';
import { Bot, deepMerge, logger } from 'kokkoro';
import { join, resolve } from 'path';
import { Database } from '@kokkoro/jsondb';
import { existsSync, mkdirSync } from 'fs';
import { mkdir, readFile, writeFile } from 'fs/promises';

const rsshub_path = join(__workname, 'data/rsshub');
const rss_path = join(rsshub_path, 'rss.json');
const config: config = {
  NO_LOGFILES: true,
};

RSSHub.init(config);
!existsSync(rsshub_path) && mkdirSync(rsshub_path);

// RSS 数据池
const db = new Database(rss_path);
const subscribe_list: Map<number, Subscribe> = new Map();
export const getRSS = RSSHub.request;

/**
 * 添加 RSS 源
 * 
 * @param url - RSS 地址
 */
export async function addRSS(url: string): Promise<void> {
  try {
    db.set(url, {}, false);
    await db.write();
  } catch (error) {
    throw error;
  }
}

/**
 * 获取全部 RSS 地址
 */
export function getAllRSS() {
  return Object.keys(db.data);
}

/**
 * 写入 RSS 信息
 * 
 * @param url - url 地址
 * @param rss - RSS 数据
 * @returns 
 */
export function setRSS(url: string, rss: RSS): Promise<void> {
  // TODO ⎛⎝≥⏝⏝≤⎛⎝ lastSendLink 处理
  db.set(url, rss, false);
  return db.write();
}

export function hasRSS(url: string) {
  return db.has(url, false);
}

/**
 * 群订阅初始化
 * 
 * @param bot - 机器人实例
 * @returns 
 */
export function initSubscribe(bot: Bot): Promise<void> {
  const uin = bot.uin;
  const subscribe: Subscribe = {};
  const subscribe_path = resolve(__workname, `data/rsshub/${uin}.yml`);

  return new Promise((resolve, reject) => {
    readFile(subscribe_path, 'utf8')
      .then(base_subscribe => {
        const local_subscribe = parse(base_subscribe);

        deepMerge(subscribe, local_subscribe);
      })
      .catch(async (error: Error) => {
        const rewrite = !error.message.includes('ENOENT: no such file or directory');

        if (rewrite) {
          reject(error);
        }
        const group_list = bot.getGroupList();

        for (const [_, group_info] of group_list) {
          const { group_id, group_name } = group_info;

          subscribe[group_id] = {
            group_name, subscribe_list: [],
          }
        }
        await writeFile(subscribe_path, stringify(subscribe))
          .then(() => {
            logger.mark(`创建了新的订阅文件: data/rsshub/${uin}.yml`);
          })
          .catch((error: Error) => {
            logger.error(`Error: ${error.message}`);
            reject(error);
          })
          .finally(() => {
            subscribe_list.set(uin, subscribe);
            resolve();
          })
      })
  });
}

export async function getSubscribe(uin: number): Promise<Subscribe> {
  if (!subscribe_list.has(uin)) {
    throw new Error(`subscribe "${uin}" is undefined`);
  }
  return subscribe_list.get(uin)!;
}

export function writeSubscribe(uin: number): Promise<boolean> {
  const subscribe_path = resolve(__workname, `data/rsshub/${uin}.yml`);

  return new Promise((resolve, reject) => {
    Promise.all([getSubscribe(uin), readFile(subscribe_path, 'utf8')])
      .then(async values => {
        const [subscribe, base_subscribe] = values;
        const local_subscribe: Subscribe = parse(base_subscribe);

        // 与本地 subscribe 作对比
        if (JSON.stringify(local_subscribe) !== JSON.stringify(subscribe)) {
          await writeFile(subscribe_path, stringify(subscribe));
          resolve(true);
        } else {
          resolve(false);
        }
      })
      .catch(error => {
        reject(error);
      })
  })
}
