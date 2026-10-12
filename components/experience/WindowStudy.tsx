import React, { useId } from 'react';
import { Image as NativeImage, View, StyleSheet } from 'react-native';
import Svg, { Defs, Mask, Image, Rect, Path, G, Line } from 'react-native-svg';
import Mark from '../../assets/brand/mirar-mark.png';
import { MIRAR as M } from '../../design-system/native';
/** Canonical pixels remain intact. The source alpha frames independent authored reading planes. Never a measure. */
export function WindowStudy({ separate = false, quiet = false }: {
    separate?: boolean;
    quiet?: boolean;
}) {
    const id = useId().replace(/:/g, '');
    const source = typeof Mark === 'string' ? { uri: Mark } : Mark;
    return <View accessible={false} style={[S.study, quiet && S.quiet]}><Svg aria-hidden viewBox="0 0 480 560" width="100%" height="100%">
 <Defs><Mask id={id} x="0" y="0" width="480" height="560" maskUnits="userSpaceOnUse" style={{ maskType: 'alpha' }}><Image href={source} x="95" y="24" width="290" height={290 * 1640 / 1109}/></Mask></Defs>
 <Image href={source} x="95" y="24" width="290" height={290 * 1640 / 1109}/>
 <G mask={`url(#${id})`}><G transform={`translate(${separate ? -24 : 0},0)`}><Path d="M70 170H340M60 195H310M70 220H355" stroke={M.color.ink} strokeWidth="1" opacity=".6"/><Path d="M260 100L220 460" stroke={M.color.paper} strokeWidth={separate ? 56 : 32}/><Path d="M260 100L220 460" stroke={M.color.warmInk} strokeWidth="1"/><Path d="M230 330H415M225 355H390M220 380H420" stroke={M.color.ink} strokeWidth="1" opacity=".6"/></G></G>
 <Line x1="28" y1="195" x2="150" y2="195" stroke={M.color.warmInk}/><Line x1="320" y1="355" x2="455" y2="355" stroke={M.color.warmInk}/>
 </Svg></View>;
}
/** A quiet boundary connects surfaces without repeating the logo beside every choice. */
export function WindowBoundary() { return <View accessible={false} style={S.boundary}><NativeImage source={typeof Mark === 'string' ? { uri: Mark } : Mark} style={S.edge}/><View style={S.rule}/></View>; }
const S = StyleSheet.create({ study: { width: '100%', height: 480, backgroundColor: M.color.paper }, quiet: { height: 200, backgroundColor: 'transparent' }, boundary: { height: 48, flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 }, edge: { width: 26, height: 39, resizeMode: 'contain' }, rule: { height: 1, backgroundColor: M.color.border, flex: 1 } });
