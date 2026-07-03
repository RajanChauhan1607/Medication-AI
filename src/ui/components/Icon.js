// components/Icon.js — friendly line-icon set ported to react-native-svg.
// Mirrors the prototype's icons.jsx. Icon({ name, size, color, stroke, fill }).

import React from 'react';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';

function Icon({ name, size = 24, color = '#000', stroke = 2, fill = 'none', style }) {
  const p = { fill: 'none', stroke: color, strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const dot = (cx, cy, r = 1.3) => <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} fill={color} />;

  const paths = {
    home: [<Path key="a" {...p} d="M4 11.5 12 4l8 7.5" />, <Path key="b" {...p} d="M6 10v9.5h12V10" />],
    pill: [<Rect key="a" {...p} x="3.5" y="9" width="17" height="6" rx="3" transform="rotate(-45 12 12)" />, <Path key="b" {...p} d="M9.5 9.5 14.5 14.5" />],
    scan: [
      <Path key="a" {...p} d="M4 8V6a2 2 0 0 1 2-2h2" />, <Path key="b" {...p} d="M16 4h2a2 2 0 0 1 2 2v2" />,
      <Path key="c" {...p} d="M20 16v2a2 2 0 0 1-2 2h-2" />, <Path key="d" {...p} d="M8 20H6a2 2 0 0 1-2-2v-2" />, <Path key="e" {...p} d="M4 12h16" />,
    ],
    camera: [<Path key="a" {...p} d="M3 8.5A1.5 1.5 0 0 1 4.5 7h2L8 5h8l1.5 2h2A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5z" />, <Circle key="b" {...p} cx="12" cy="13" r="3.2" />],
    calendar: [<Rect key="a" {...p} x="3.5" y="5" width="17" height="15" rx="2.5" />, <Path key="b" {...p} d="M3.5 9.5h17M8 3.5v3M16 3.5v3" />],
    clock: [<Circle key="a" {...p} cx="12" cy="12" r="8.2" />, <Path key="b" {...p} d="M12 7.5V12l3 1.8" />],
    bell: [<Path key="a" {...p} d="M6.5 10a5.5 5.5 0 0 1 11 0c0 4 1.5 5.5 1.5 5.5H5s1.5-1.5 1.5-5.5Z" />, <Path key="b" {...p} d="M10 18.5a2 2 0 0 0 4 0" />],
    check: [<Path key="a" {...p} d="M5 12.5 10 17 19 7" />],
    checkCircle: [<Circle key="a" {...p} cx="12" cy="12" r="8.5" />, <Path key="b" {...p} d="M8.2 12.2 11 15l4.8-5.2" />],
    plus: [<Path key="a" {...p} d="M12 5v14M5 12h14" />],
    chevR: [<Path key="a" {...p} d="M9 5l7 7-7 7" />],
    chevL: [<Path key="a" {...p} d="M15 5l-7 7 7 7" />],
    chevD: [<Path key="a" {...p} d="M5 9l7 7 7-7" />],
    x: [<Path key="a" {...p} d="M6 6l12 12M18 6 6 18" />],
    sparkle: [<Path key="a" {...p} d="M12 4c.6 3.6 1.4 4.4 5 5-3.6.6-4.4 1.4-5 5-.6-3.6-1.4-4.4-5-5 3.6-.6 4.4-1.4 5-5Z" />, <Path key="b" {...p} d="M18.5 4.5c.2 1.2.5 1.5 1.7 1.7-1.2.2-1.5.5-1.7 1.7-.2-1.2-.5-1.5-1.7-1.7 1.2-.2 1.5-.5 1.7-1.7Z" />],
    flame: [<Path key="a" {...p} d="M12 3.5c2.5 3 1 5 0 6 .8-2.5-1.2-3-1.2-3-.2 1.8-2.3 2.7-3 5a4.2 4.2 0 1 0 8.4 0c0-2.2-1.8-3.4-2.6-5.2C13 8 13.4 6 12 3.5Z" />],
    info: [<Circle key="a" {...p} cx="12" cy="12" r="8.5" />, <Path key="b" {...p} d="M12 11v5.2M12 7.7v.1" />],
    sun: [<Circle key="a" {...p} cx="12" cy="12" r="3.6" />, <Path key="b" {...p} d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6" />],
    moon: [<Path key="a" {...p} d="M19 13.5A7.5 7.5 0 1 1 10.5 5a6 6 0 0 0 8.5 8.5Z" />],
    image: [<Rect key="a" {...p} x="3.5" y="5" width="17" height="14" rx="2.5" />, <Circle key="b" {...p} cx="8.5" cy="10" r="1.6" />, <Path key="c" {...p} d="M5 17l4.5-4 3 2.5L16 12l3.5 3.5" />],
    edit: [<Path key="a" {...p} d="M5 19h14" />, <Path key="b" {...p} d="M14.5 5.5 18 9 9 18l-3.5.5L6 15Z" />],
    refill: [<Path key="a" {...p} d="M19 12a7 7 0 1 1-2.1-5" />, <Path key="b" {...p} d="M19 4.5V9h-4.5" />],
    food: [<Path key="a" {...p} d="M7 3v8a2 2 0 0 0 2 2v8M9 3v6M5 3v6M5 9h4" />, <Path key="b" {...p} d="M17 3c-1.5 0-2.5 2-2.5 5s1 4 2.5 4v9" />],
    drop: [<Path key="a" {...p} d="M12 3.5s5.5 5.4 5.5 9.3a5.5 5.5 0 1 1-11 0C6.5 8.9 12 3.5 12 3.5Z" />],
    user: [<Circle key="a" {...p} cx="12" cy="8.5" r="3.7" />, <Path key="b" {...p} d="M5 20c.7-3.6 3.5-5.5 7-5.5s6.3 1.9 7 5.5" />],
    shield: [<Path key="a" {...p} d="M12 3.5 19 6v5.5c0 4.6-3 7.4-7 9-4-1.6-7-4.4-7-9V6Z" />, <Path key="b" {...p} d="M9 11.5 11 13.5 15 9.5" />],
    doc: [<Path key="a" {...p} d="M6.5 3.5h7L18 8v12.5H6.5Z" />, <Path key="b" {...p} d="M13.5 3.5V8H18M9 13h6M9 16.5h4" />],
    bolt: [<Path key="a" {...p} d="M13 3 5 13h5l-1 8 8-10h-5Z" />],
    list: [<Path key="a" {...p} d="M9 6h11M9 12h11M9 18h11" />, dot(5, 6), dot(5, 12), dot(5, 18)],
    grid: [<Rect key="a" {...p} x="4" y="4" width="7" height="7" rx="1.6" />, <Rect key="b" {...p} x="13" y="4" width="7" height="7" rx="1.6" />, <Rect key="c" {...p} x="4" y="13" width="7" height="7" rx="1.6" />, <Rect key="d" {...p} x="13" y="13" width="7" height="7" rx="1.6" />],
    snooze: [<Circle key="a" {...p} cx="12" cy="13" r="7.3" />, <Path key="b" {...p} d="M12 9.5V13l2.5 1.5M9 3.5h4.5L9 7.5h4.5M3.5 6 6 4" />],
    arrowR: [<Path key="a" {...p} d="M5 12h14M13 6l6 6-6 6" />],
    heart: [<Path key="a" {...p} d="M12 20s-7-4.3-7-9.2A3.8 3.8 0 0 1 12 8a3.8 3.8 0 0 1 7-2.2c0 4.9-7 9.2-7 9.2Z" />],
    stethoscope: [<Path key="a" {...p} d="M6 4v5a4 4 0 0 0 8 0V4" />, <Path key="b" {...p} d="M6 4H4.5M14 4h1.5" />, <Path key="c" {...p} d="M10 13v2.5a4.5 4.5 0 0 0 9 0V14" />, <Circle key="d" {...p} cx="19" cy="12" r="2" />],
    apple: [<Path key="a" fill={color} stroke="none" d="M16 13.5c0 2.3 2 3.1 2 3.1-.9 2.6-2.3 3.9-3.4 3.9-1 0-1.4-.6-2.6-.6s-1.7.6-2.6.6c-1.4 0-3.9-3.4-3.9-6.6 0-3.3 2.2-4.6 3.9-4.6 1.1 0 2 .7 2.7.7.6 0 1.7-.8 3-.7 1.6.1 2.7.9 3.4 2-1.4.8-2 .9-2 2.7Z" />, <Path key="b" fill={color} stroke="none" d="M14 5.5c.6-.8.6-1.9.5-2.5-.9.1-1.9.6-2.5 1.3-.5.6-.8 1.6-.6 2.4.9.1 1.9-.5 2.6-1.2Z" />],
    android: [<Path key="a" {...p} d="M5 10.5a1 1 0 0 1 1 1v4a1 1 0 0 1-2 0v-4a1 1 0 0 1 1-1ZM19 10.5a1 1 0 0 1 1 1v4a1 1 0 0 1-2 0v-4a1 1 0 0 1 1-1Z" />, <Path key="b" {...p} d="M7 10.5h10v6.5a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1z" />, <Path key="c" {...p} d="M9 18v2.2a1 1 0 0 1-2 0V18M17 18v2.2a1 1 0 0 1-2 0V18" />, <Path key="d" {...p} d="M7 10.5a5 5 0 0 1 10 0M9.5 5.5 8.5 4M14.5 5.5l1-1.5" />, dot(9.5, 8, 0.7), dot(14.5, 8, 0.7)],
    phone: [<Path key="a" {...p} d="M6.5 3.5c.5 0 .9.3 1 .8l.9 3.2c.1.5 0 1-.4 1.3l-1.5 1.2a12 12 0 0 0 5 5l1.2-1.5c.3-.4.8-.5 1.3-.4l3.2.9c.5.1.8.5.8 1V19a1.5 1.5 0 0 1-1.6 1.5C9.6 20 4 14.4 4 5.1A1.5 1.5 0 0 1 5.5 3.5Z" />],
    phoneOff: [<Path key="a" {...p} d="M6.5 3.5c.5 0 .9.3 1 .8l.9 3.2c.1.5 0 1-.4 1.3L6.5 10a12 12 0 0 0 2 2.6M11 13.5a12 12 0 0 0 2.4 1.6l1.2-1.5c.3-.4.8-.5 1.3-.4l3.2.9c.5.1.8.5.8 1V19a1.5 1.5 0 0 1-1.6 1.5c-3.5-.2-6.7-1.8-9-4.2" />, <Path key="b" {...p} d="M3 3l18 18" />],
    users: [<Circle key="a" {...p} cx="9" cy="8" r="3.3" />, <Path key="b" {...p} d="M3.5 19c.6-3 2.8-4.7 5.5-4.7s4.9 1.7 5.5 4.7" />, <Path key="c" {...p} d="M16 5.2a3.3 3.3 0 0 1 0 5.6M17.5 14.4c2 .5 3.5 2 4 4.6" />],
    plusUser: [<Circle key="a" {...p} cx="10" cy="8.5" r="3.5" />, <Path key="b" {...p} d="M4 19.5c.6-3.2 3-5 6-5 1 0 1.9.2 2.7.5" />, <Path key="c" {...p} d="M17.5 14.5v6M14.5 17.5h6" />],
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={fill} style={style}>
      {paths[name] || null}
    </Svg>
  );
}

// Icons are pure functions of their props (all primitives) — memoize so they don't
// re-render every time a parent screen updates (e.g. on every store change).
export default React.memo(Icon);
