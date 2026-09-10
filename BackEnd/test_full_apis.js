const fs = require("fs");
const path = require("path");

const BASE_URL = "http://localhost:8080";

const runTests = async () => {
  console.log("==================================================");
  console.log("   FULL END-TO-END BACKEND API VERIFICATION SUITE   ");
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

  const timestamp = Date.now();
  const memberEmail = `test.member.${timestamp}@example.com`;
  const adminEmail = `test.admin.${timestamp}@example.com`;
  const password = "Password123!";

  let memberToken = "";
  let adminToken = "";
  let memberId = "";
  let adminId = "";
  let createdTaskId = "";
  let createdUserId = "";

  try {
    // -------------------------------------------------------------
    // 1. AUTH APIS
    // -------------------------------------------------------------
    console.log("\n--- [1] Testing Auth Endpoints ---");

    // 1.1 Register Regular Member
    const regMemberRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Member",
        email: memberEmail,
        password: password,
      }),
    });
    const regMemberData = await regMemberRes.json();
    assert(regMemberRes.status === 201, `Register Member returned 201 (Status: ${regMemberRes.status})`);
    assert(regMemberData.role === "member", `Member role is 'member' (Got: ${regMemberData.role})`);
    assert(!!regMemberData.token, "Member received JWT token");
    memberId = regMemberData._id;

    // 1.2 Register Admin User (with invite token)
    const regAdminRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Admin",
        email: adminEmail,
        password: password,
        adminInviteToken: "4588944",
      }),
    });
    const regAdminData = await regAdminRes.json();
    assert(regAdminRes.status === 201, `Register Admin returned 201 (Status: ${regAdminRes.status})`);
    assert(regAdminData.role === "admin", `Admin role is 'admin' (Got: ${regAdminData.role})`);
    adminToken = regAdminData.token;
    adminId = regAdminData._id;

    // 1.3 Login Member
    const loginMemberRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: memberEmail, password }),
    });
    const loginMemberData = await loginMemberRes.json();
    assert(loginMemberRes.status === 200, `Login Member returned 200 (Status: ${loginMemberRes.status})`);
    assert(loginMemberData.role === "member", `Logged in member role is 'member'`);
    memberToken = loginMemberData.token;

    // 1.4 Login Admin
    const loginAdminRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: adminEmail, password }),
    });
    const loginAdminData = await loginAdminRes.json();
    assert(loginAdminRes.status === 200, `Login Admin returned 200 (Status: ${loginAdminRes.status})`);
    assert(loginAdminData.role === "admin", `Logged in admin role is 'admin'`);

    // 1.5 Get Profile
    const profileRes = await fetch(`${BASE_URL}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    const profileData = await profileRes.json();
    assert(profileRes.status === 200, `Get Member Profile returned 200`);
    assert(profileData.email === memberEmail, `Profile email matched (${profileData.email})`);

    // 1.6 Update Profile
    const updateProfileRes = await fetch(`${BASE_URL}/api/auth/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${memberToken}`,
      },
      body: JSON.stringify({ name: "Updated Member Name" }),
    });
    const updateProfileData = await updateProfileRes.json();
    assert(updateProfileRes.status === 200, `Update Profile returned 200`);
    assert(updateProfileData.name === "Updated Member Name", `Profile name updated`);

    // 1.7 Upload Image (multipart/form-data)
    const testImgPath = path.join(__dirname, "test_sample.png");
    fs.writeFileSync(testImgPath, Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64"));
    const formData = new FormData();
    const blob = new Blob([fs.readFileSync(testImgPath)], { type: "image/png" });
    formData.append("image", blob, "test_sample.png");

    const uploadRes = await fetch(`${BASE_URL}/api/auth/upload-image`, {
      method: "POST",
      body: formData,
    });
    const uploadData = await uploadRes.json();
    assert(uploadRes.status === 200, `Upload Image returned 200`);
    assert(uploadData.imageUrl && uploadData.imageUrl.includes("/uploads/"), `Image uploaded successfully: ${uploadData.imageUrl}`);
    if (fs.existsSync(testImgPath)) fs.unlinkSync(testImgPath);

    // -------------------------------------------------------------
    // 2. USER MANAGEMENT APIS
    // -------------------------------------------------------------
    console.log("\n--- [2] Testing User Management Endpoints ---");

    // 2.1 Get All Users (Admin)
    const getUsersRes = await fetch(`${BASE_URL}/api/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const usersData = await getUsersRes.json();
    assert(getUsersRes.status === 200, `Get All Users returned 200`);
    assert(Array.isArray(usersData) && usersData.length >= 2, `Users list returned array of users (${usersData.length} users)`);

    // 2.2 Create User by Admin
    const createSubUserEmail = `created.sub.${timestamp}@example.com`;
    const createUserRes = await fetch(`${BASE_URL}/api/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: "Sub Created User",
        email: createSubUserEmail,
        password: password,
        role: "member",
      }),
    });
    const createUserData = await createUserRes.json();
    assert(createUserRes.status === 201, `Admin Create User returned 201`);
    createdUserId = createUserData._id;

    // 2.3 Get User By ID
    const getUserByIdRes = await fetch(`${BASE_URL}/api/users/${createdUserId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const getUserByIdData = await getUserByIdRes.json();
    assert(getUserByIdRes.status === 200, `Get User By ID returned 200`);
    assert(getUserByIdData.email === createSubUserEmail, `Fetched user email matched`);

    // 2.4 Update User
    const updateUserRes = await fetch(`${BASE_URL}/api/users/${createdUserId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ name: "Modified Sub User" }),
    });
    const updateUserData = await updateUserRes.json();
    assert(updateUserRes.status === 200, `Update User returned 200`);
    assert(updateUserData.name === "Modified Sub User", `User name updated`);

    // 2.5 Delete User
    const deleteUserRes = await fetch(`${BASE_URL}/api/users/${createdUserId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(deleteUserRes.status === 200, `Delete User returned 200`);

    // -------------------------------------------------------------
    // 3. TASK MANAGEMENT APIS
    // -------------------------------------------------------------
    console.log("\n--- [3] Testing Task Management Endpoints ---");

    // 3.1 Create Task
    const createTaskRes = await fetch(`${BASE_URL}/api/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: `Verification Task ${timestamp}`,
        description: "Full API test task description",
        priority: "High",
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        assignedTo: [memberId],
        todoList: [
          { text: "Item 1", completed: false },
          { text: "Item 2", completed: true },
        ],
      }),
    });
    const createTaskData = await createTaskRes.json();
    assert(createTaskRes.status === 201, `Create Task returned 201`);
    assert(!!createTaskData._id, `Task created with ID: ${createTaskData._id}`);
    createdTaskId = createTaskData._id;

    // 3.2 Get All Tasks (Admin)
    const getAllTasksRes = await fetch(`${BASE_URL}/api/tasks`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const allTasksData = await getAllTasksRes.json();
    assert(getAllTasksRes.status === 200, `Get All Tasks (Admin) returned 200`);
    assert(Array.isArray(allTasksData.tasks || allTasksData), `Admin tasks returned as list`);

    // 3.3 Get Member's Tasks
    const getMemberTasksRes = await fetch(`${BASE_URL}/api/tasks`, {
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    const memberTasksData = await getMemberTasksRes.json();
    assert(getMemberTasksRes.status === 200, `Get Member Tasks returned 200`);

    // 3.4 Get Task By ID
    const getTaskByIdRes = await fetch(`${BASE_URL}/api/tasks/${createdTaskId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const taskByIdData = await getTaskByIdRes.json();
    assert(getTaskByIdRes.status === 200, `Get Task By ID returned 200`);
    assert(taskByIdData._id === createdTaskId, `Task ID matches fetched task`);

    // 3.5 Update Task
    const updateTaskRes = await fetch(`${BASE_URL}/api/tasks/${createdTaskId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: `Updated Verification Task ${timestamp}`,
        priority: "Medium",
      }),
    });
    const updateTaskData = await updateTaskRes.json();
    assert(updateTaskRes.status === 200, `Update Task returned 200`);
    assert(updateTaskData.title === `Updated Verification Task ${timestamp}`, `Task title updated`);

    // 3.6 Update Task Status
    const updateStatusRes = await fetch(`${BASE_URL}/api/tasks/${createdTaskId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${memberToken}`,
      },
      body: JSON.stringify({ status: "In Progress" }),
    });
    const updateStatusData = await updateStatusRes.json();
    assert(updateStatusRes.status === 200, `Update Task Status returned 200`);
    assert(updateStatusData.status === "in-progress" || updateStatusData.status.toLowerCase() === "in progress", `Task status updated to In Progress`);

    // 3.7 Update Todo Checklist
    const updateTodoRes = await fetch(`${BASE_URL}/api/tasks/${createdTaskId}/todo`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${memberToken}`,
      },
      body: JSON.stringify({
        todoList: [
          { text: "Item 1", completed: true },
          { text: "Item 2", completed: true },
        ],
      }),
    });
    const updateTodoData = await updateTodoRes.json();
    assert(updateTodoRes.status === 200, `Update Todo Checklist returned 200`);
    assert(updateTodoData.progress === 100 || (updateTodoData.todoChecklist && updateTodoData.todoChecklist.every(i => i.completed)), `Checklist updated with 100% progress`);

    // 3.8 Get Admin Dashboard Data
    const adminDashRes = await fetch(`${BASE_URL}/api/tasks/dashboard-data`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminDashData = await adminDashRes.json();
    assert(adminDashRes.status === 200, `Get Admin Dashboard Data returned 200`);
    assert(typeof (adminDashData.totalTasks ?? adminDashData.statistics?.totalTasks) === "number", `Admin dashboard metrics present`);

    // 3.9 Get User Dashboard Data
    const userDashRes = await fetch(`${BASE_URL}/api/tasks/user-dashboard-data`, {
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    const userDashData = await userDashRes.json();
    assert(userDashRes.status === 200, `Get User Dashboard Data returned 200`);
    assert(typeof (userDashData.totalTasks ?? userDashData.statistics?.totalTasks) === "number", `User dashboard metrics present`);

    // 3.10 Delete Task
    const deleteTaskRes = await fetch(`${BASE_URL}/api/tasks/${createdTaskId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(deleteTaskRes.status === 200, `Delete Task returned 200`);

    // -------------------------------------------------------------
    // 4. REPORT EXPORT APIS
    // -------------------------------------------------------------
    console.log("\n--- [4] Testing Report Export Endpoints ---");

    // 4.1 Export Tasks Excel
    const exportTasksRes = await fetch(`${BASE_URL}/api/reports/export/tasks`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const tasksBlob = await exportTasksRes.arrayBuffer();
    assert(exportTasksRes.status === 200, `Export Tasks Excel returned 200`);
    assert(tasksBlob.byteLength > 100, `Tasks Excel file generated (${tasksBlob.byteLength} bytes)`);

    // 4.2 Export Users Excel
    const exportUsersRes = await fetch(`${BASE_URL}/api/reports/export/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const usersBlob = await exportUsersRes.arrayBuffer();
    assert(exportUsersRes.status === 200, `Export Users Excel returned 200`);
    assert(usersBlob.byteLength > 100, `Users Excel file generated (${usersBlob.byteLength} bytes)`);

  } catch (err) {
    console.error("FATAL ERROR IN TEST SUITE:", err);
    failed++;
  }

  console.log("\n==================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  process.exit(failed > 0 ? 1 : 0);
};

runTests();
