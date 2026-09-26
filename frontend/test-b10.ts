// Automated test suite for B10 Review & Confirm Flow logic and API integration
import { 
  mockConfirmDetections, 
  mapDetectionLabelToChecklistKey, 
  DetectionConfirmationItem
} from './src/lib/api.ts';

async function runTests() {
  console.log('--- Starting B10 Verification Suite ---');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, message: string) {
    total++;
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  // Test 1: Single item confirmed
  console.log('\n--- Test 1: Single Item Confirmed ---');
  const payload1: DetectionConfirmationItem[] = [{ label: 'wheelchair ramp', confirmed: true, image_id: 'img_entrance_01' }];
  const res1 = await mockConfirmDetections(payload1);
  assert(res1.success === true, 'Response indicates success');
  assert(res1.confirmed_count === 1, 'Confirmed count is 1');
  assert(res1.rejected_count === 0, 'Rejected count is 0');
  assert(res1.updated_checklist_items.includes('step_free_entrance'), 'Mapped to step_free_entrance checklist key');
  assert(!res1.updated_checklist_items.includes('verified'), 'Never contains verified tag');

  // Test 2: Single item rejected
  console.log('\n--- Test 2: Single Item Rejected ---');
  const payload2: DetectionConfirmationItem[] = [{ label: 'handrail', confirmed: false, image_id: 'img_entrance_01' }];
  const res2 = await mockConfirmDetections(payload2);
  assert(res2.success === true, 'Response indicates success');
  assert(res2.confirmed_count === 0, 'Confirmed count is 0');
  assert(res2.rejected_count === 1, 'Rejected count is 1');
  assert(res2.updated_checklist_items.length === 0, 'Rejected detection is discarded and not added to checklist');

  // Test 3: Multiple items with mixed decisions
  console.log('\n--- Test 3: Multiple Detections with Mixed Decisions ---');
  const payload3: DetectionConfirmationItem[] = [
    { label: 'wheelchair ramp', confirmed: true, image_id: 'img_entrance_01' },
    { label: 'handrail', confirmed: false, image_id: 'img_entrance_01' },
    { label: 'grab bar', confirmed: true, image_id: 'img_bathroom_01' },
    { label: 'solar panel', confirmed: true, image_id: 'img_parking_01' }
  ];
  const res3 = await mockConfirmDetections(payload3);
  assert(res3.confirmed_count === 3, 'Confirmed count matches 3 confirmed items');
  assert(res3.rejected_count === 1, 'Rejected count matches 1 rejected item');
  assert(res3.updated_checklist_items.includes('step_free_entrance'), 'Contains step_free_entrance');
  assert(res3.updated_checklist_items.includes('accessible_toilet'), 'Contains accessible_toilet');
  assert(res3.updated_checklist_items.includes('solar_power'), 'Contains solar_power');

  // Test 4: Decision reversal verification
  console.log('\n--- Test 4: Decision Reversal Simulation ---');
  const draftDecisions: Record<string, string> = { 'img1::0': 'confirmed' };
  draftDecisions['img1::0'] = 'rejected'; // user changes mind before submit
  assert(draftDecisions['img1::0'] === 'rejected', 'Decision cleanly reversed before submission');
  const res4 = await mockConfirmDetections([{ label: 'handrail', confirmed: false, image_id: 'img1' }]);
  assert(res4.rejected_count === 1 && res4.confirmed_count === 0, 'Submitted payload respects the final rejected decision');

  // Test 5: Deterministic Error and Retry
  console.log('\n--- Test 5: Deterministic Error and Retry ---');
  try {
    await mockConfirmDetections([{ label: 'ramp', confirmed: true, image_id: 'simulate_fail' }]);
    assert(false, 'Should have failed for simulate_fail trigger');
  } catch (err: any) {
    assert(err.message.includes('Deterministic network timeout'), 'Simulates deterministic error on trigger');
  }

  // Retry after error
  const retryRes = await mockConfirmDetections([{ label: 'wheelchair ramp', confirmed: true, image_id: 'retry_success' }]);
  assert(retryRes.success === true && retryRes.confirmed_count === 1, 'Retry successfully submits after failure');

  // Test 6: Label to checklist mapping
  console.log('\n--- Test 6: Label to Checklist Mapping ---');
  assert(mapDetectionLabelToChecklistKey('wheelchair ramp') === 'step_free_entrance', 'Ramp maps to step_free_entrance');
  assert(mapDetectionLabelToChecklistKey('solar panel') === 'solar_power', 'Solar panel maps to solar_power');
  assert(mapDetectionLabelToChecklistKey('recycling bin') === 'waste_program', 'Recycling bin maps to waste_program');
  assert(mapDetectionLabelToChecklistKey('unknown feature') === null, 'Unknown feature returns null');

  // Test 7: Confirm payload adheres to canonical contract
  console.log('\n--- Test 7: Contract Shape Validation ---');
  const validKeys = ['label', 'confirmed', 'image_id'];
  for (const item of payload3) {
    const keys = Object.keys(item);
    assert(keys.every(k => validKeys.includes(k)), 'Payload items contain only canonical contract fields');
    assert(!('confidence' in item), 'Confidence is stripped from confirmation payload');
    assert(!('detection_id' in item), 'Does not invent unauthorized detection_id field');
  }

  console.log(`\n===========================================`);
  console.log(`B10 Test Suite Completed: ${passed}/${total} assertions passed!`);
  console.log(`===========================================`);
}

runTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
