const stamp = (date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const escape = (text) => text.replace(/[\\;,]/g, (c) => `\\${c}`);

/** Downloads an .ics file with one event, so the match can be added to any calendar app. */
export function downloadEvent({ uid, title, start, location, description }) {
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Arena Pass//Demo//PT-BR',
    'BEGIN:VEVENT',
    `UID:${uid}@arena-pass`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(new Date(start.getTime() + 2 * 3600000))}`,
    `SUMMARY:${escape(title)}`,
    `LOCATION:${escape(location)}`,
    `DESCRIPTION:${escape(description)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${uid}.ics`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
