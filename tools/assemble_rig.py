"""Assemble rig.json (the same logic runs live in demos/rig-editor/assemble.js) for engine/characters/rig.js from parts/pieces.json (measured markers) and rig_plan.json (who hangs where).
Usage: python3 tools/assemble_rig.py assets/characters/<name>"""
import json, os, sys
D = os.path.abspath(sys.argv[1]); P = json.load(open(os.path.join(D, 'parts', 'pieces.json'))); plan = json.load(open(os.path.join(D, 'rig_plan.json')))
pieceOf = {b['id']: b['piece'] for b in plan['bones']}; bones = []
for b in plan['bones']:
    pc = P[b['piece']]; out = {'id': b['id'], 'parent': b['parent'], 'image': 'parts/' + b['piece'] + '.png', 'pivot': pc['pivot'], 'z': b['z']}
    if b['parent'] is None: out['position'] = [0, 0]
    else:
        pp = P[pieceOf[b['parent']]]; tgt = pp['pivot'] if b['at'] == 'pivot' else pp['attach'][b['at']]
        off = b.get('offset', [0, 0]); out['position'] = [round(tgt[0] - pp['pivot'][0] + off[0], 1), round(tgt[1] - pp['pivot'][1] + off[1], 1)]
    if 'limits' in b: out['limits'] = b['limits']
    if b.get('scale', 1) != 1: out['scale'] = b['scale']
    bones.append(out)
def sock(v):
    bone, i = v[0], v[1]; at = P[pieceOf[bone]]['attach'][i]; off = list(v[2]) if len(v) > 2 else [0, 0]
    for ch in plan['bones']:   # a socket on an attach point follows the piece hung there (e.g. the ankle follows a nudged foot)
        if ch.get('parent') == bone and ch.get('at') == i and ch.get('offset'): off = [off[0] + ch['offset'][0], off[1] + ch['offset'][1]]
    return {'bone': bone, 'at': [round(at[0] + off[0], 1), round(at[1] + off[1], 1)]}
sockets = {k: sock(v) for k, v in plan['sockets'].items()}
variants = {bone: {k: 'parts/' + v + '.png' for k, v in m.items()} for bone, m in plan.get('variants', {}).items()}
rig = {'view': plan['view'], 'viewScale': plan.get('viewScale', 1), 'reference': plan.get('reference'), 'bones': bones, 'sockets': sockets, 'variants': variants, 'chains': plan.get('chains', {}), 'soles': plan.get('soles', {})}
json.dump(rig, open(os.path.join(D, 'rig.json'), 'w'), indent=1, ensure_ascii=False); print('rig.json:', len(bones), 'bones,', len(sockets), 'sockets')
