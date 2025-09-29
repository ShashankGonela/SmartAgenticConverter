/**
 * Day.js - Lightweight date library for DateTimeHelper
 * Minified version for Chrome extension use
 */

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.dayjs = factory());
}(this, (function () { 'use strict';

  const SECONDS_A_MINUTE = 60;
  const SECONDS_A_HOUR = SECONDS_A_MINUTE * 60;
  const SECONDS_A_DAY = SECONDS_A_HOUR * 24;
  const SECONDS_A_WEEK = SECONDS_A_DAY * 7;

  const MS_A_SECOND = 1e3;
  const MS_A_MINUTE = SECONDS_A_MINUTE * MS_A_SECOND;
  const MS_A_HOUR = SECONDS_A_HOUR * MS_A_SECOND;
  const MS_A_DAY = SECONDS_A_DAY * MS_A_SECOND;
  const MS_A_WEEK = SECONDS_A_WEEK * MS_A_SECOND;

  // English locales
  const monthsShort = 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_');
  const months = 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_');
  const weekdaysShort = 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_');
  const weekdays = 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_');

  const padStart = (string, length, pad) => {
    const s = String(string);
    if (!s || s.length >= length) return string;
    return `${Array(length + 1 - s.length).join(pad)}${string}`;
  };

  const padZoneStr = (instance) => {
    const negMinutes = -instance.utcOffset();
    const minutes = Math.abs(negMinutes);
    const hourOffset = Math.floor(minutes / 60);
    const minuteOffset = minutes % 60;
    return `${negMinutes <= 0 ? '+' : '-'}${padStart(hourOffset, 2, '0')}:${padStart(minuteOffset, 2, '0')}`;
  };

  const monthDiff = (a, b) => {
    const wholeMonthDiff = ((b.year() - a.year()) * 12) + (b.month() - a.month());
    const anchor = a.clone().add(wholeMonthDiff, 'months');
    const c = b - anchor < 0;
    const anchor2 = a.clone().add(wholeMonthDiff + (c ? -1 : 1), 'months');
    return +(-(wholeMonthDiff + ((b - anchor) / (c ? (anchor - anchor2) : (anchor2 - anchor)))));
  };

  const absFloor = n => (n < 0 ? Math.ceil(n) || 0 : Math.floor(n));

  const prettyUnit = u => {
    const special = {
      M: 'months',
      y: 'years',
      w: 'weeks',
      d: 'days',
      D: 'dates',
      h: 'hours',
      m: 'minutes',
      s: 'seconds',
      ms: 'milliseconds'
    };
    return special[u] || String(u || '').toLowerCase().replace(/s$/, '');
  };

  const isUndefined = s => s === undefined;

  class Dayjs {
    constructor(cfg) {
      this.$L = 'en';
      this.parse(cfg);
    }

    parse(cfg) {
      this.$d = this.parseDate(cfg);
      this.$x = this.$d || new Date(NaN);
      this.$y = this.$x.getFullYear();
      this.$M = this.$x.getMonth();
      this.$D = this.$x.getDate();
      this.$W = this.$x.getDay();
      this.$H = this.$x.getHours();
      this.$m = this.$x.getMinutes();
      this.$s = this.$x.getSeconds();
      this.$ms = this.$x.getMilliseconds();
    }

    parseDate(date) {
      let { date: d, utc } = date || {};
      if (d === null) return new Date(NaN);
      if (isUndefined(d)) return new Date();
      if (d instanceof Date) return new Date(d);
      if (typeof d === 'string' && !/Z$/i.test(d)) {
        const match = d.match(/^(\d{4})-?(\d{1,2})-?(\d{0,2})[T\s]*(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?[.:]?(\d+)?$/);
        if (match) {
          const m = match;
          return new Date(m[1], m[2] - 1, m[3] || 1, m[4] || 0, m[5] || 0, m[6] || 0, m[7] || 0);
        }
      }
      return new Date(d);
    }

    clone() {
      return new Dayjs({ date: new Date(this.$d), utc: this.$u });
    }

    isValid() {
      return !(this.$d.toString() === 'Invalid Date');
    }

    isSame(that, units) {
      const other = dayjs(that);
      return this.startOf(units) <= other && other <= this.endOf(units);
    }

    isAfter(that, units) {
      return dayjs(that) < this.startOf(units);
    }

    isBefore(that, units) {
      return this.endOf(units) < dayjs(that);
    }

    year() {
      return this.$y;
    }

    month() {
      return this.$M;
    }

    date() {
      return this.$D;
    }

    day() {
      return this.$W;
    }

    hour() {
      return this.$H;
    }

    minute() {
      return this.$m;
    }

    second() {
      return this.$s;
    }

    millisecond() {
      return this.$ms;
    }

    utcOffset() {
      return -Math.round(this.$x.getTimezoneOffset() / 15) * 15;
    }

    unix() {
      return Math.floor(this.valueOf() / 1000);
    }

    valueOf() {
      return this.$d.getTime();
    }

    startOf(units) {
      const isStartOf = !isUndefined(units);
      const unit = units && prettyUnit(units);
      const instanceFactory = (d, m) => {
        const ins = new Dayjs({ date: new Date(this.$y, m, d), utc: this.$u });
        return isStartOf ? ins : ins.endOf('days');
      };
      const instanceFactorySet = (method, slice) => {
        const argumentStart = [0, 0, 0, 0];
        const argumentEnd = [23, 59, 59, 999];
        return new Dayjs({ 
          date: new Date(this.$x[`set${method}`](...argumentStart.slice(slice))), 
          utc: this.$u 
        });
      };
      const { $W, $M, $D } = this;
      const utcPad = `set${this.$u ? 'UTC' : ''}`;

      switch (unit) {
        case 'years':
          return instanceFactory(1, 0);
        case 'months':
          return instanceFactory(1, $M);
        case 'weeks': {
          const weekStart = this.$d.getDate() - ($W + 7) % 7;
          return instanceFactory(weekStart, $M);
        }
        case 'days':
        case 'dates':
          return instanceFactorySet('Hours', 0);
        case 'hours':
          return instanceFactorySet('Minutes', 1);
        case 'minutes':
          return instanceFactorySet('Seconds', 2);
        case 'seconds':
          return instanceFactorySet('Milliseconds', 3);
        default:
          return this.clone();
      }
    }

    endOf(arg) {
      return this.startOf(arg, false);
    }

    add(number, units) {
      number = Number(number);
      const unit = prettyUnit(units);
      const instanceFactorySet = (n) => {
        const d = new Date(this.$d);
        d.setDate(d.getDate() + (n * number));
        return new Dayjs({ date: d, utc: this.$u });
      };

      if (unit === 'months') {
        return this.set('months', this.$M + number);
      }
      if (unit === 'years') {
        return this.set('years', this.$y + number);
      }
      if (unit === 'days') {
        return instanceFactorySet(1);
      }
      if (unit === 'weeks') {
        return instanceFactorySet(7);
      }

      const step = {
        minutes: MS_A_MINUTE,
        hours: MS_A_HOUR,
        seconds: MS_A_SECOND,
        milliseconds: 1
      }[unit] || MS_A_DAY;

      const nextTimeStamp = this.valueOf() + (number * step);
      return new Dayjs({ date: new Date(nextTimeStamp), utc: this.$u });
    }

    subtract(number, units) {
      return this.add(number * -1, units);
    }

    set(units, int) {
      const unit = prettyUnit(units);
      const utcPad = `set${this.$u ? 'UTC' : ''}`;
      const name = {
        dates: `${utcPad}Date`,
        months: `${utcPad}Month`,
        years: `${utcPad}FullYear`,
        hours: `${utcPad}Hours`,
        minutes: `${utcPad}Minutes`,
        seconds: `${utcPad}Seconds`,
        milliseconds: `${utcPad}Milliseconds`
      }[unit];
      const arg = unit === 'dates' ? this.$D + (int - this.$D) : int;

      if (unit === 'months' || unit === 'years') {
        const date = this.clone().set('dates', 1);
        date.$d[name](arg);
        date.init();
        this.$d = date.set('dates', Math.min(this.$D, date.daysInMonth())).$d;
      } else if (name) {
        this.$d[name](arg);
      }

      this.init();
      return this;
    }

    get(units) {
      return this[prettyUnit(units)]();
    }

    daysInMonth() {
      return this.endOf('months').date();
    }

    diff(input, units, float) {
      const unit = prettyUnit(units);
      const that = dayjs(input);
      const zoneDelta = (that.utcOffset() - this.utcOffset()) * MS_A_MINUTE;
      const diff = this - that;
      let result = monthDiff(this, that);

      result = {
        years: result / 12,
        months: result,
        weeks: (diff - zoneDelta) / MS_A_WEEK,
        days: (diff - zoneDelta) / MS_A_DAY,
        hours: diff / MS_A_HOUR,
        minutes: diff / MS_A_MINUTE,
        seconds: diff / MS_A_SECOND,
        milliseconds: diff
      }[unit] || diff;

      return float ? result : absFloor(result);
    }

    format(formatStr = 'YYYY-MM-DDTHH:mm:ssZ') {
      const str = formatStr;
      const zoneStr = padZoneStr(this);

      const matches = {
        YY: String(this.$y).slice(-2),
        YYYY: this.$y,
        M: this.$M + 1,
        MM: padStart(this.$M + 1, 2, '0'),
        MMM: monthsShort[this.$M],
        MMMM: months[this.$M],
        D: this.$D,
        DD: padStart(this.$D, 2, '0'),
        d: this.$W,
        dd: weekdaysShort[this.$W],
        ddd: weekdaysShort[this.$W],
        dddd: weekdays[this.$W],
        H: this.$H,
        HH: padStart(this.$H, 2, '0'),
        h: this.$H % 12 || 12,
        hh: padStart(this.$H % 12 || 12, 2, '0'),
        m: this.$m,
        mm: padStart(this.$m, 2, '0'),
        s: this.$s,
        ss: padStart(this.$s, 2, '0'),
        SSS: padStart(this.$ms, 3, '0'),
        Z: zoneStr
      };

      return str.replace(/\[([^\]]+)]|Y{1,4}|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g, (match, $1) => $1 || matches[match] || zoneStr.replace(':', ''));
    }

    toDate() {
      return new Date(this.valueOf());
    }

    toJSON() {
      return this.isValid() ? this.toISOString() : null;
    }

    toISOString() {
      return this.$d.toISOString();
    }

    toString() {
      return this.$d.toUTCString();
    }
  }

  const dayjs = function (date, c) {
    if (date instanceof Dayjs) return date.clone();
    return new Dayjs({ date });
  };

  dayjs.extend = (plugin, option) => {
    plugin(option, Dayjs, dayjs);
    return dayjs;
  };

  dayjs.unix = timestamp => dayjs(timestamp * 1e3);

  dayjs.en = { name: 'en', weekdays, months };
  dayjs.Ls = { en: dayjs.en };

  return dayjs;

})));

// Export to global scope for Chrome extension
window.dayjs = window.dayjs || dayjs;