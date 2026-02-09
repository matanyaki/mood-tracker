

const BASE_URL = 'http://localhost:3000';

async function runTests() {
    console.log('Starting API Tests with Mock Auth...');

    // 1. Health Check
    console.log('\n--- 1. Health Check ---');
    try {
        const healthRes = await fetch(`${BASE_URL}/health`);
        const healthData = await healthRes.json();
        console.log('Status:', healthRes.status);
        console.log('Response:', JSON.stringify(healthData, null, 2));
    } catch (e: any) {
        console.error('Health Check Failed:', e.message);
        return;
    }

    // 2. Create Entry
    console.log('\n--- 2. Create Journal Entry ---');
    let createdEntryId: string | null = null;
    try {
        const createRes = await fetch(`${BASE_URL}/api/entries`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                date: new Date().toISOString().split('T')[0],
                timestamp: Date.now(),
                // NEW SIMPLE SCHEMA
                emotion: "Optimistic",
                scale: 5,
                note: "Things are going great!"
            })
        });
        const createData = await createRes.json() as any;
        console.log('Status:', createRes.status);
        if (createRes.ok) {
            console.log('Created Entry:', createData.data);
            createdEntryId = createData.data.id;
        } else {
            console.error('Create Failed:', createData);
        }
    } catch (e: any) {
        console.error('Create Entry Failed:', e.message);
    }

    if (!createdEntryId) {
        console.error('Skipping dependent tests due to creation failure.');
        return;
    }

    // 3. Get Entries
    console.log('\n--- 3. Get Journal Entries ---');
    try {
        const getRes = await fetch(`${BASE_URL}/api/entries`);
        const getData = await getRes.json() as any;
        console.log('Status:', getRes.status);
        console.log(`Found ${getData.data.length} entries.`);
        // console.log('Entries:', JSON.stringify(getData.data, null, 2));
    } catch (e: any) {
        console.error('Get Entries Failed:', e.message);
    }

    // 4. Update Entry
    console.log('\n--- 4. Update Journal Entry ---');
    try {
        const updateRes = await fetch(`${BASE_URL}/api/entries/${createdEntryId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                emotion: "Ecstatic"
            })
        });
        const updateData = await updateRes.json() as any;
        console.log('Status:', updateRes.status);
        console.log('Updated Data:', updateData.data);
    } catch (e: any) {
        console.error('Update Entry Failed:', e.message);
    }

    // 5. AI Reflection
    console.log('\n--- 5. Generate AI Reflection ---');
    try {
        const aiRes = await fetch(`${BASE_URL}/api/ai/reflect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                emotion: "Ecstatic",
                scale: 5,
                note: "Things are going great... REALLY great!"
            })
        });
        const aiData = await aiRes.json() as any;
        console.log('Status:', aiRes.status);
        if (aiRes.ok) {
            console.log('Reflection:', aiData.data.reflection);
            console.log('Detected Emotions:', aiData.data.detectedEmotions);
        } else {
            console.error('AI Reflection Failed:', aiData);
        }
    } catch (e: any) {
        console.error('AI Reflection Failed:', e.message);
    }

    // 6. Delete Entry
    console.log('\n--- 6. Delete Journal Entry ---');
    try {
        const deleteRes = await fetch(`${BASE_URL}/api/entries/${createdEntryId}`, {
            method: 'DELETE'
        });
        const deleteData = await deleteRes.json();
        console.log('Status:', deleteRes.status);
        console.log('Delete Response:', deleteData);
    } catch (e: any) {
        console.error('Delete Entry Failed:', e.message);
    }
}

runTests();
