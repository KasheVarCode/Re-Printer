import ru from './ru';

const messages: any = ru; // расширим при добавлении языков

export const t = (path: string): string => {
  const parts = path.split('.');
  let cur: any = messages;
  for (const p of parts) {
    if (cur == null) return path;
    cur = cur[p];
  }
  return typeof cur === 'string' ? cur : path;
};

export const get = (path: string): any => {
  const parts = path.split('.');
  let cur: any = messages;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
};




