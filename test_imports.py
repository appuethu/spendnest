import json, sys
sys.path.insert(0, '.')

state = {'records': {}, 'revisions': {}, 'overrides': {}, 'analysis_state': {}, 'imported_batches': []}

from logic import import_batch, is_usable_transcript

# Test 1: Initial import
with open('data/01_initial.json', encoding='utf-8') as f:
    batch1 = json.load(f)

r1 = import_batch(state, batch1)
print('=== After initial import ===')
print('  Records:', len(state['records']))
print('  New:', r1['new_count'], '| Skipped:', r1['skipped_count'])
usable = sum(1 for r in state['records'].values() if is_usable_transcript(r))
print('  Usable transcripts:', usable)
assert len(state['records']) == 44, f"Expected 44 records, got {len(state['records'])}"
assert usable == 17, f"Expected 17 usable, got {usable}"
print('  PASS: 44 records, 17 usable')

# Test 2: Repeat import (no duplicates)
r2 = import_batch(state, batch1)
print('\n=== After repeat import ===')
print('  Records:', len(state['records']))
print('  New:', r2['new_count'], '| Skipped:', r2['skipped_count'])
assert len(state['records']) == 44, "Duplicate records created!"
assert r2['new_count'] == 0, "Should not add new records"
print('  PASS: No duplicates created')

# Test 3: Manual override survives update
m07_key = 'meeting::4f304fff-fd40-5cfc-a366-0a134c445c2a'
state['overrides'][m07_key] = {
    'routes': ['Sales Coaching'],
    'override_note': 'Test override',
    'overridden_at': '2026-08-21 10:00 IST',
    'route_reasons': ['Manual test']
}
print('\n=== M07 manual override set ===')
print('  Override:', state['overrides'][m07_key]['routes'])

# Test 4: Update import
with open('data/02_update.json', encoding='utf-8') as f:
    batch2 = json.load(f)
r3 = import_batch(state, batch2)
print('\n=== After update import ===')
print('  Records:', len(state['records']))
print('  Updated:', r3['updated_count'])
usable2 = sum(1 for r in state['records'].values() if is_usable_transcript(r))
print('  Usable transcripts:', usable2)
assert len(state['records']) == 44, "Records changed after update!"
assert usable2 == 18, f"Expected 18 usable, got {usable2}"
print('  PASS: 44 records, 18 usable')

# Check M07 override preserved
assert m07_key in state['overrides'], "M07 override was erased!"
print('  M07 override preserved:', state['overrides'][m07_key]['routes'])
print('  PASS: Override survived update')

# Check M07 transcript received
m07 = state['records'][m07_key]
tp = m07.get('transcript_payload')
turns = tp.get('turns', []) if tp else []
rev = state['revisions'].get(m07_key)
print('  M07 revision:', rev, '| turns:', len(turns), '| usable:', is_usable_transcript(m07))
assert rev == 2, "M07 should be revision 2"
assert len(turns) > 0, "M07 should have turns after update"
print('  PASS: M07 got transcript without creating duplicate')

# Test 5: Old revision cannot overwrite new
r4 = import_batch(state, batch1)  # revision 1 again
usable3 = sum(1 for r in state['records'].values() if is_usable_transcript(r))
print('\n=== After re-importing revision 1 ===')
print('  Records:', len(state['records']))
print('  Usable:', usable3)
print('  M07 revision after:', state['revisions'].get(m07_key))
assert usable3 == 18, "Older revision should not reduce usable count"
assert state['revisions'].get(m07_key) == 2, "M07 should remain revision 2"
print('  PASS: Revision 1 did not overwrite revision 2')

print('\n=== ALL TESTS PASSED ===')
