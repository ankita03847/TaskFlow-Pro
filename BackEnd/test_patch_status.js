const BASE_URL = "http://localhost:8080";

const runPatchTests = async () => {
  console.log("==================================================");
  console.log("   TESTING PATCH /api/tasks/:id STATUS UPDATES   ");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  const assert = (condition, message) => {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  };

  try {
    const timestamp = Date.now();
    const adminEmail = `patch.admin.${timestamp}@example.com`;
    const password = "Password123!";

    // 1. Register Admin
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Patch Admin",
        email: adminEmail,
        password,
        adminInviteToken: "4588944",
      }),
    });
    const regData = await regRes.json();
    assert(regRes.status === 201, `Admin registered (Status: ${regRes.status})`);
    const token = regData.token;

    // 2. Create Task
    const createRes = await fetch(`${BASE_URL}/api/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: `Patch Test Task ${timestamp}`,
        description: "Testing PATCH in-place status update",
        priority: "High",
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        todoList: [{ text: "Subtask 1", completed: false }],
      }),
    });
    const createData = await createRes.json();
    assert(createRes.status === 201, `Task created (ID: ${createData._id})`);
    const taskId = createData._id;

    // 3. Test Invalid Status (e.g. "invalid_status")
    const invalidRes = await fetch(`${BASE_URL}/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: "invalid_status" }),
    });
    const invalidData = await invalidRes.json();
    assert(
      invalidRes.status === 400,
      `Invalid status rejected with 400 (Got: ${invalidRes.status}, Message: "${invalidData.message}")`
    );

    // 4. Test Missing Status
    const missingRes = await fetch(`${BASE_URL}/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });
    assert(missingRes.status === 400, `Missing status rejected with 400`);

    // 5. Test PATCH status to "active"
    const activeRes = await fetch(`${BASE_URL}/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: "active" }),
    });
    const activeData = await activeRes.json();
    assert(activeRes.status === 200, `Update to active returned 200`);
    assert(activeData.status === "active", `Status is now 'active' (Got: ${activeData.status})`);

    // 6. Test PATCH status to "done" (verify progress synced to 100%)
    const doneRes = await fetch(`${BASE_URL}/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: "done" }),
    });
    const doneData = await doneRes.json();
    assert(doneRes.status === 200, `Update to done returned 200`);
    assert(doneData.status === "done", `Status is now 'done' (Got: ${doneData.status})`);
    assert(doneData.progress === 100, `Progress automatically synced to 100% (Got: ${doneData.progress}%)`);

    // 7. Test PATCH status to "pending" (verify progress reset from 100 to 0)
    const pendingRes = await fetch(`${BASE_URL}/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: "pending" }),
    });
    const pendingData = await pendingRes.json();
    assert(pendingRes.status === 200, `Update to pending returned 200`);
    assert(pendingData.status === "pending", `Status is now 'pending' (Got: ${pendingData.status})`);
    assert(pendingData.progress === 0, `Progress reset to 0% (Got: ${pendingData.progress}%)`);

    // 8. Test PATCH on invalid ObjectId
    const badIdRes = await fetch(`${BASE_URL}/api/tasks/not-a-valid-id`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: "active" }),
    });
    assert(badIdRes.status === 400, `Invalid ID format rejected with 400`);

    // 9. Cleanup test task
    await fetch(`${BASE_URL}/api/tasks/${taskId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("\n==================================================");
    console.log(`   TEST RESULTS: ${passed} PASSED, ${failed} FAILED   `);
    console.log("==================================================");

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error("Test execution error:", err);
    process.exit(1);
  }
};

runPatchTests();
