"""Assemble rig.json for engine/characters/rig.js from parts/pieces.json (measured markers) and rig_plan.json (who hangs where).
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
    bones.append(out)
sockets = {k: {'bone': bone, 'at': P[pieceOf[bone]]['attach'][i]} for k, (bone, i) in plan['sockets'].items()}
variants = {bone: {k: 'parts/' + v + '.png' for k, v in m.items()} for bone, m in plan.get('variants', {}).items()}
rig = {'view': plan['view'], 'viewScale': plan.get('viewScale', 1), 'bones': bones, 'sockets': sockets, 'variants': variants, 'chains': plan.get('chains', {})}
json.dump(rig, open(os.path.join(D, 'rig.json'), 'w'), indent=1, ensure_ascii=False); print('rig.json:', len(bones), 'bones,', len(sockets), 'sockets')
