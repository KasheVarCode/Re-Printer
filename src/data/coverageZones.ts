export type CoverageZone = {
  /**
   * Должен совпадать с id зоны на SVG в CoverageMap.astro
   */
  id:
    | 'primorskiy'
    | 'vyborgskiy'
    | 'krasnogvardeyskiy'
    | 'nevskskiy'
    | 'vasiliostrov'
    | 'petrogradka'
    | 'center'
    | 'moskovskiy'
    | 'frunzenskiy';
  /**
   * Название зоны (как будет показано на сайте)
   */
  title: string;
  /**
   * Цена выезда (шаблон — заполните своими значениями)
   */
  price: string;
  /**
   * Срок прибытия (шаблон — заполните своими значениями)
   */
  eta: string;
  /**
   * Доп. комментарий (опционально), например: "в пределах КАД"
   */
  note?: string;
};

/**
 * Зоны покрытия (7 зон).
 * TODO: заполните price/eta (и при необходимости note) под вашу логику.
 */
export const coverageZones: CoverageZone[] = [
  { id: 'primorskiy', title: 'Приморский', price: '5 000 руб.', eta: 'До 6 часов' },
  { id: 'vyborgskiy', title: 'Выборгский', price: '5 000 руб.', eta: 'До 3 часов' },
  { id: 'krasnogvardeyskiy', title: 'Красногвардейский + Калининский', price: '3 500 руб.', eta: 'До 2 часа' },
  { id: 'nevskskiy', title: 'Невский (правый берег)', price: '5 000 руб.', eta: 'До 3 часа' },
  { id: 'vasiliostrov', title: 'Василеостровский', price: '5 000 руб.', eta: 'До 3 часов' },
  { id: 'petrogradka', title: 'Петроградский + Заячий остров', price: '5 000 руб.', eta: 'До 3 часов' },
  { id: 'center', title: 'Центр + Адмиралтейский', price: '5 000 руб.', eta: 'До 3 часа' },
  { id: 'moskovskiy', title: 'Московский', price: '5 000 руб.', eta: 'До 4 часа' },
  { id: 'frunzenskiy', title: 'Фрунзенский + Невский (левый берег)', price: '5 000 руб.', eta: 'До 3 часа' }
];

export function getCoverageZoneById(id: CoverageZone['id']): CoverageZone | undefined {
  return coverageZones.find((z) => z.id === id);
}


