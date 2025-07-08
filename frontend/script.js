// Only for local testing first serve a server to frontend:- python -m http.server 5500 --bind 127.0.0.1

// Global variables
let currentUser = null;
let currentUserEmail = null;
let userType = null;
let websocket = null;
let currentChatUser = null;
const API_BASE = "http://127.0.0.1:8000";
const $ = window.jQuery; // Declare the $ variable

// Initialize the application
$(document).ready(() => {
  initializeApp();
  setupEventListeners();
  checkAuthStatus();
});

// Initialize application
function initializeApp() {
  // Show home page by default
  showPage("home");

  // Setup navigation
  setupNavigation();

  // Load initial data
  loadJobs();
}

// Setup event listeners
function setupEventListeners() {
  // Navigation
  $(".nav-link").click(function (e) {
    e.preventDefault();
    const page = $(this).data("page");
    showPage(page);
  });

  // Mobile menu toggle
  $("#hamburger").click(() => {
    $(".nav-menu").toggleClass("active");
  });
  $("#signup-btn").click(() => showModal("signup-modal"));
  // Auth buttons
  $("#login-btn").click(() => showModal("login-modal"));
  $("#hero-signup").click(() => showModal("signup-modal"));
  $("#hero-browse").click(() => showPage("jobs"));
  $("#logout-btn").click(logout);

  // Dashboard navigation
  $("#dashboard-btn").click(() => showPage("dashboard"));
  $("#notifications-btn").click(() => showPage("notifications"));
  $("#chat-btn").click(() => showPage("chat"));

  // Profile navigation
  $("#profile-btn").click(() => showPage("profile"));

  // Modal close buttons
  $(".close").click(function () {
    const modalId = $(this).data("modal");
    hideModal(modalId);
  });

  // Auth tabs
  $(".auth-tab").click(function () {
    const authType = $(this).data("auth");
    switchAuthTab(authType);
  });

  // Forms
  $("#login-form").submit(handleLogin);
  $("#otp-form").submit(handleOTPVerification);
  $("#user-signup-form").submit(handleUserSignup);
  $("#recruiter-signup-form").submit(handleRecruiterSignup);
  $("#create-job-form").submit(handleCreateJob);
  $("#interview-form").submit(handleScheduleInterview);

  // Profile forms
  $("#profile-edit-form").submit(handleProfileUpdate);

  // Dashboard tabs
  $(".tab-btn").click(function () {
    const tab = $(this).data("tab");
    switchDashboardTab(tab);
  });

  // Job search
  $("#search-jobs-btn").click(searchJobs);
  $("#job-search-title, #job-search-location, #job-search-skills").keypress(
    (e) => {
      if (e.which === 13) {
        searchJobs();
      }
    }
  );

  // Chat
  $("#send-message-btn").click(sendMessage);
  $("#message-input").keypress((e) => {
    if (e.which === 13) {
      sendMessage();
    }
  });

  // Click outside modal to close
  $(window).click((e) => {
    if ($(e.target).hasClass("modal")) {
      $(e.target).hide();
    }
  });
}

// Navigation functions
function setupNavigation() {
  // Update navigation based on auth status
  updateNavigation();
}

function showPage(pageId) {
  $(".page").removeClass("active");
  $(`#${pageId}-page`).addClass("active");

  // Load page-specific data
  switch (pageId) {
    case "jobs":
      loadJobs();
      break;
    case "dashboard":
      loadDashboard();
      break;
    case "notifications":
      loadNotifications();
      break;
    case "chat":
      loadChatContacts();
      break;
    case "profile":
      loadProfile();
      break;
  }
}

function updateNavigation() {
  if (currentUser) {
    $("#auth-buttons").hide();
    $("#user-menu").show();
  } else {
    $("#auth-buttons").show();
    $("#user-menu").hide();
  }
}

// Modal functions
function showModal(modalId) {
  $(`#${modalId}`).show();
}

function hideModal(modalId) {
  $(`#${modalId}`).hide();
}

function switchAuthTab(authType) {
  $(".auth-tab").removeClass("active");
  $(`.auth-tab[data-auth="${authType}"]`).addClass("active");

  $(".auth-form").removeClass("active");
  if (authType === "user") {
    $("#user-signup-form").addClass("active");
  } else {
    $("#recruiter-signup-form").addClass("active");
  }
}

// Authentication functions
function checkAuthStatus() {
  $.ajax({
    url: `${API_BASE}/protected-route`,
    method: "GET",
    xhrFields: {
      withCredentials: true,
    },
    success: (response) => {
      currentUser = response.user;
      currentUserEmail = response.user_email;
      userType = response.user_type;
      console.log(userType);
      updateNavigation();
      setupWebSocket();
    },
    error: () => {
      currentUser = null;
      currentUserEmail = null;
      userType = null;
      updateNavigation();
    },
  });
}

function handleLogin(e) {
  e.preventDefault();
  const email = $("#login-email").val();

  showLoading();

  $.ajax({
    url: `${API_BASE}/userLoginEmailSender`,
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify({ email: email }),
    success: (response) => {
      hideLoading();
      showToast("OTP sent to your email", "success");
      $("#login-form").hide();
      $("#otp-form").show();
      $("#otp-form").data("email", email);
    },
    error: (xhr) => {
      hideLoading();
      const error = xhr.responseJSON?.detail || "Failed to send OTP";
      showToast(error, "error");
    },
  });
}

function handleOTPVerification(e) {
  e.preventDefault();
  const otp = Number.parseInt($("#otp-code").val());
  const email = $("#otp-form").data("email");

  showLoading();

  $.ajax({
    url: `${API_BASE}/otpVerifier?otp=${otp}&email=${encodeURIComponent(
      email
    )}`,
    method: "POST",
    xhrFields: {
      withCredentials: true,
    },
    crossDomain: true,
    success: (response) => {
      hideLoading();
      showToast("Login successful!", "success");
      hideModal("login-modal");
      checkAuthStatus();
      showPage("dashboard");

      // Reset forms
      $("#login-form")[0].reset();
      $("#otp-form")[0].reset();
      $("#login-form").show();
      $("#otp-form").hide();
    },
    error: (xhr) => {
      hideLoading();
      const error = xhr.responseJSON?.detail || "Invalid OTP";
      showToast(error, "error");
    },
  });
}

function handleUserSignup(e) {
  e.preventDefault();

  const formData = new FormData();
  formData.append("name", $("#user-name").val());
  formData.append("email", $("#user-email").val());
  formData.append("phone", $("#user-phone").val());
  formData.append("skills", $("#user-skills").val());
  formData.append("experience", $("#user-experience").val());
  formData.append("education", $("#user-education").val());
  formData.append("resume", $("#user-resume")[0].files[0]);

  showLoading();

  $.ajax({
    url: `${API_BASE}/userSignup`,
    method: "POST",
    data: formData,
    processData: false,
    contentType: false,
    success: (response) => {
      hideLoading();
      showToast("Registration successful! Please login.", "success");
      hideModal("signup-modal");
      showModal("login-modal");
      $("#user-signup-form")[0].reset();
    },
    error: (xhr) => {
      hideLoading();
      const error = xhr.responseJSON?.detail || "Registration failed";
      showToast(error, "error");
    },
  });
}

function handleRecruiterSignup(e) {
  e.preventDefault();

  const data = {
    name: $("#recruiter-name").val(),
    email: $("#recruiter-email").val(),
    company: $("#recruiter-company").val(),
    phone: $("#recruiter-phone").val(),
  };

  showLoading();

  $.ajax({
    url: `${API_BASE}/recruiter-signup`,
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify(data),
    success: (response) => {
      hideLoading();
      showToast("Registration successful! Please login.", "success");
      hideModal("signup-modal");
      showModal("login-modal");
      $("#recruiter-signup-form")[0].reset();
    },
    error: (xhr) => {
      hideLoading();
      const error = xhr.responseJSON?.detail || "Registration failed";
      showToast(error, "error");
    },
  });
}

function logout() {
  $.ajax({
    url: `${API_BASE}/logout`,
    method: "POST",
    xhrFields: {
      withCredentials: true,
    },
    success: () => {
      currentUser = null;
      currentUserEmail = null;
      userType = null;
      updateNavigation();
      showPage("home");
      showToast("Logged out successfully", "success");

      // Close WebSocket connection
      if (websocket) {
        websocket.close();
        websocket = null;
      }
    },
    error: () => {
      showToast("Logout failed", "error");
    },
  });
}

// Profile functions
function loadProfile() {
  if (!currentUser) {
    showPage("home");
    showToast("Please login to view your profile", "warning");
    return;
  }

  showLoading();

  $.ajax({
    url: `${API_BASE}/current-user-data`,
    method: "GET",
    xhrFields: {
      withCredentials: true,
    },
    success: (userData) => {
      hideLoading();
      displayProfile(userData);
    },
    error: (xhr) => {
      hideLoading();
      const error = xhr.responseJSON?.detail || "Failed to load profile";
      showToast(error, "error");
    },
  });
}

function displayProfile(userData) {
  // Update profile view
  $("#profile-name").text(userData.Name || "Not provided");
  $("#profile-email").text(userData.Email || "Not provided");
  $("#profile-phone").text(userData.Phone || "Not provided");

  // Update avatar
  const initials = userData.Name ? userData.Name.charAt(0).toUpperCase() : "U";
  $("#profile-avatar-text").text(initials);

  if (userType === "user") {
    // Show user-specific fields
    $("#edit-skills-group").show();
    $("#edit-experience-group").show();
    $("#edit-education-group").show();
    $("#edit-resume-group").show();
    $("#edit-company-group").hide();

    // Update skills display
    if (userData.Skills) {
      const skillsHtml = userData.Skills.split(",")
        .map((skill) => `<span class="skill-tag">${skill.trim()}</span>`)
        .join("");
      $("#profile-skills").html(skillsHtml);
    } else {
      $("#profile-skills").html(
        '<span class="skill-tag">No skills added</span>'
      );
    }

    $("#profile-experience").text(userData.Experience || "Not provided");
    $("#profile-education").text(userData.Education || "Not provided");

    // Handle resume display
    if (userData.Resume) {
      $("#profile-resume").html(`
        <button class="btn btn-outline btn-small" onclick="downloadCurrentResume()">
          Download Resume
        </button>
        <span class="resume-status">✓ Resume uploaded</span>
      `);
    } else {
      $("#profile-resume").html(`
        <span class="resume-status">No resume uploaded</span>
      `);
    }
  } else {
    // Show recruiter-specific fields
    $("#edit-skills-group").hide();
    $("#edit-experience-group").hide();
    $("#edit-education-group").hide();
    $("#edit-resume-group").hide();
    $("#edit-company-group").show();

    $("#profile-company")
      .text(userData.Company || "Not provided")
      .show();

    // Hide user-specific sections for recruiters
    $(".detail-section").each(function () {
      const heading = $(this).find("h3").text();
      if (["Skills", "Experience", "Education", "Resume"].includes(heading)) {
        $(this).hide();
      }
    });
  }

  // Populate edit form
  populateEditForm(userData);

  // Show profile view, hide edit form
  $("#profile-view").show();
  $("#profile-edit").hide();

  // Setup event listeners for profile actions
  setupProfileEventListeners();
}

function populateEditForm(userData) {
  $("#edit-name").val(userData.Name || "");
  $("#edit-email")
    .val(userData.Email || "")
    .prop("readonly", true); // Email should not be editable
  $("#edit-phone").val(userData.Phone || "");

  if (userType === "user") {
    $("#edit-skills").val(userData.Skills || "");
    $("#edit-experience").val(userData.Experience || "");
    $("#edit-education").val(userData.Education || "");
  } else {
    $("#edit-company").val(userData.Company || "");
  }
}

function setupProfileEventListeners() {
  // Remove existing listeners to prevent duplicates
  $("#edit-profile-btn").off("click");
  $("#cancel-edit-btn").off("click");
  $("#profile-edit-form").off("submit");

  // Edit profile button
  $("#edit-profile-btn").on("click", function () {
    $("#profile-view").hide();
    $("#profile-edit").show();
  });

  // Cancel edit button
  $("#cancel-edit-btn").on("click", function () {
    $("#profile-edit").hide();
    $("#profile-view").show();
    // Reset form to original values
    loadProfile();
  });

  // Profile edit form submission
  $("#profile-edit-form").on("submit", handleProfileUpdate);
}

function handleProfileUpdate(e) {
  e.preventDefault();

  const updateData = {
    name: $("#edit-name").val(),
    phone: $("#edit-phone").val(),
  };

  if (userType === "user") {
    updateData.skills = $("#edit-skills").val();
    updateData.experience = $("#edit-experience").val();
    updateData.education = $("#edit-education").val();
  } else {
    updateData.company = $("#edit-company").val();
  }

  showLoading();

  $.ajax({
    url: `${API_BASE}/update-your-details`,
    method: "PATCH",
    contentType: "application/json",
    data: JSON.stringify(updateData),
    xhrFields: {
      withCredentials: true,
    },
    success: (response) => {
      hideLoading();
      showToast("Profile updated successfully!", "success");

      // Handle resume update if file is selected
      const resumeFile = $("#edit-resume")[0].files[0];
      if (resumeFile && userType === "user") {
        handleResumeUpdate(resumeFile);
      } else {
        // Reload profile to show updated data
        loadProfile();
      }
    },
    error: (xhr) => {
      hideLoading();
      const error = xhr.responseJSON?.detail || "Failed to update profile";
      showToast(error, "error");
    },
  });
}

function handleResumeUpdate(file) {
  const formData = new FormData();
  formData.append("new_resume", file);

  showLoading();

  $.ajax({
    url: `${API_BASE}/update-resume`,
    method: "PATCH",
    data: formData,
    processData: false,
    contentType: false,
    xhrFields: {
      withCredentials: true,
    },
    success: (response) => {
      hideLoading();
      showToast("Resume updated successfully!", "success");
      // Clear the file input
      $("#edit-resume").val("");
      // Reload profile to show updated resume status
      loadProfile();
    },
    error: (xhr) => {
      hideLoading();
      const error = xhr.responseJSON?.detail || "Failed to update resume";
      showToast(error, "error");
    },
  });
}

function downloadCurrentResume() {
  if (!currentUser) {
    showToast("Please login to download resume", "warning");
    return;
  }

  // Create a temporary link to download the resume
  const downloadUrl = `${API_BASE}/download-resume/${
    currentUser.id || currentUserEmail
  }`;
  window.open(downloadUrl, "_blank");
}

function confirmDeleteAccount() {
  // Create a custom confirmation modal
  const confirmationHtml = `
    <div id="delete-confirmation-modal" class="modal" style="display: block;">
      <div class="modal-content">
        <h2 style="color: #dc3545;">Delete Account</h2>
        <p>Are you sure you want to delete your account?</p>
        <p><strong>This action cannot be undone and will permanently remove:</strong></p>
        <ul>
          <li>Your profile information</li>
          <li>All job applications</li>
          <li>Chat history</li>
          <li>All personal data</li>
        </ul>
        <div class="form-actions" style="margin-top: 20px;">
          <button type="button" class="btn btn-danger" id="confirm-delete-btn">
            Yes, Delete My Account
          </button>
          <button type="button" class="btn btn-outline" id="cancel-delete-btn">
            Cancel
          </button>
        </div>
      </div>
    </div>
  `;

  $("body").append(confirmationHtml);

  // Handle confirmation
  $("#confirm-delete-btn").on("click", function () {
    $("#delete-confirmation-modal").remove();
    deleteAccount();
  });

  // Handle cancellation
  $("#cancel-delete-btn").on("click", function () {
    $("#delete-confirmation-modal").remove();
  });
}

function deleteAccount() {
  showLoading();

  $.ajax({
    url: `${API_BASE}/delete-account`,
    method: "DELETE",
    xhrFields: {
      withCredentials: true,
    },
    success: (response) => {
      hideLoading();
      showToast(
        "Account deleted successfully. We're sorry to see you go!",
        "success"
      );

      // Clear user data and redirect
      currentUser = null;
      currentUserEmail = null;
      userType = null;
      updateNavigation();
      showPage("home");

      // Close WebSocket connection
      if (websocket) {
        websocket.close();
        websocket = null;
      }
    },
    error: (xhr) => {
      hideLoading();
      const error = xhr.responseJSON?.detail || "Failed to delete account";
      showToast(error, "error");
    },
  });
}

// Add delete account button functionality
$(document).on("click", "#delete-account-btn", confirmDeleteAccount);

// Job functions
function loadJobs() {
  showLoading();

  $.ajax({
    url: `${API_BASE}/jobs`,
    method: "GET",
    success: (jobs) => {
      hideLoading();
      displayJobs(jobs);
    },
    error: () => {
      hideLoading();
      showToast("Failed to load jobs", "error");
    },
  });
}

function searchJobs() {
  const title = $("#job-search-title").val();
  const location = $("#job-search-location").val();
  const skills = $("#job-search-skills").val();

  const params = new URLSearchParams();
  if (title) params.append("title", title);
  if (location) params.append("location", location);
  if (skills) params.append("skills", skills);

  showLoading();

  $.ajax({
    url: `${API_BASE}/jobs/search?${params.toString()}`,
    method: "GET",
    success: (jobs) => {
      hideLoading();
      displayJobs(jobs);
    },
    error: () => {
      hideLoading();
      showToast("Search failed", "error");
    },
  });
}

function displayJobs(jobs) {
  const jobsList = $("#jobs-list");
  jobsList.empty();

  if (jobs.length === 0) {
    jobsList.html('<div class="text-center"><h3>No jobs found</h3></div>');
    return;
  }

  jobs.forEach((job) => {
    const skillTags = job.SkillsRequired.split(",")
      .map((skill) => `<span class="skill-tag">${skill.trim()}</span>`)
      .join("");

    const jobCard = $(`
            <div class="job-card">
                <h3>${job.Title}</h3>
                <div class="company">Company ID: ${job.RecruiterID}</div>
                <div class="location">📍 ${job.Location}</div>
                <div class="skills">${skillTags}</div>
                <div class="salary">💰 ${job.Salary || "Not specified"}</div>
                <div class="experience">🎯 ${job.ExperienceRequired}</div>
                <div class="job-actions">
                    <button class="btn btn-primary view-job-btn" data-job-id="${
                      job.JobID
                    }">View Details</button>
                    ${
                      currentUser && userType === "user"
                        ? `<button class="btn btn-success apply-job-btn" data-job-id="${job.JobID}">Apply Now</button>`
                        : ""
                    }
                </div>
            </div>
        `);

    jobsList.append(jobCard);
  });

  // Attach event listeners
  $(".view-job-btn").click(function () {
    const jobId = $(this).data("job-id");
    viewJobDetails(jobId);
  });

  $(".apply-job-btn").click(function () {
    const jobId = $(this).data("job-id");
    applyForJob(jobId);
  });
}

function viewJobDetails(jobId) {
  $.ajax({
    url: `${API_BASE}/job/${jobId}`,
    method: "GET",
    success: (job) => {
      const skillTags = job.SkillsRequired.split(",")
        .map((skill) => `<span class="skill-tag">${skill.trim()}</span>`)
        .join("");

      const jobDetails = `
                <h2>${job.Title}</h2>
                <div class="job-meta">
                    <p><strong>Company:</strong> Recruiter ID ${
                      job.RecruiterID
                    }</p>
                    <p><strong>Location:</strong> ${job.Location}</p>
                    <p><strong>Salary:</strong> ${
                      job.Salary || "Not specified"
                    }</p>
                    <p><strong>Experience Required:</strong> ${
                      job.ExperienceRequired
                    }</p>
                    <p><strong>Status:</strong> ${job.Status}</p>
                </div>
                <div class="job-skills">
                    <h4>Skills Required:</h4>
                    ${skillTags}
                </div>
                <div class="job-description">
                    <h4>Job Description:</h4>
                    <p>${job.Description}</p>
                </div>
                ${
                  currentUser && userType === "user"
                    ? `
                    <div class="job-actions mt-20">
                        <button class="btn btn-success" onclick="applyForJob('${job.JobID}')">Apply for this Job</button>
                    </div>
                `
                    : ""
                }
            `;

      $("#job-details-content").html(jobDetails);
      showModal("job-details-modal");
    },
    error: () => {
      showToast("Failed to load job details", "error");
    },
  });
}

function applyForJob(jobId) {
  if (!currentUser) {
    showToast("Please login to apply for jobs", "warning");
    showModal("login-modal");
    return;
  }

  if (userType !== "user") {
    showToast("Only job seekers can apply for jobs", "warning");
    return;
  }

  showLoading();

  $.ajax({
    url: `${API_BASE}/apply/${jobId}`,
    method: "POST",
    xhrFields: {
      withCredentials: true,
    },
    success: (response) => {
      hideLoading();
      showToast("Application submitted successfully!", "success");
      hideModal("job-details-modal");

      // Show application result in a modal
      const resultHtml = `
        <div id="application-result-modal" class="modal" style="display: block;">
          <div class="modal-content">
            <span class="close" onclick="$('#application-result-modal').remove()">&times;</span>
            <div class="application-result">
              <h3>Application Submitted Successfully!</h3>
              <p><strong>Resume Score:</strong> ${response.score}/100</p>
              <div class="score-bar" style="background: #f0f0f0; height: 20px; border-radius: 10px; overflow: hidden; margin: 10px 0;">
                <div class="score-fill" style="width: ${response.score}%; height: 100%; background: linear-gradient(90deg, #4CAF50, #8BC34A); transition: width 0.3s ease;"></div>
              </div>
              <div class="ai-review">
                <h4>AI Review:</h4>
                <p style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #007bff;">${response.review}</p>
              </div>
              <button class="btn btn-primary" onclick="$('#application-result-modal').remove()" style="margin-top: 15px;">Close</button>
            </div>
          </div>
        </div>
      `;

      $("body").append(resultHtml);
    },
    error: (xhr) => {
      hideLoading();
      const error = xhr.responseJSON?.detail || "Application failed";
      showToast(error, "error");
    },
  });
}

function handleCreateJob(e) {
  e.preventDefault();

  const data = {
    title: $("#job-title").val(),
    description: $("#job-description").val(),
    skills_required: $("#job-skills").val(),
    experience_required: $("#job-experience").val(),
    salary: $("#job-salary").val(),
    location: $("#job-location").val(),
    status: $("#job-status").val(),
  };

  showLoading();

  $.ajax({
    url: `${API_BASE}/new-job`,
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify(data),
    xhrFields: {
      withCredentials: true,
    },
    success: (response) => {
      hideLoading();
      showToast("Job created successfully!", "success");
      $("#create-job-form")[0].reset();
      loadRecruiterJobs();
    },
    error: (xhr) => {
      hideLoading();
      const error = xhr.responseJSON?.detail || "Failed to create job";
      showToast(error, "error");
    },
  });
}

// Dashboard functions
function loadDashboard() {
  if (!currentUser) {
    showPage("home");
    return;
  }

  // Determine user type and setup dashboard accordingly
  setupDashboardForUserType();
  loadDashboardData();
}

function setupDashboardForUserType() {
  if (userType === "recruiter") {
    $("#dashboard-title").text("Recruiter Dashboard");
    $("#applications-tab").text("Job Applications");
    $("#jobs-tab").show();
    $("#create-job-tab").show();
  } else {
    $("#dashboard-title").text("Job Seeker Dashboard");
    $("#applications-tab").text("My Applications");
    $("#jobs-tab").hide();
    $("#create-job-tab").hide();
  }
}

function loadDashboardData() {
  if (userType === "recruiter") {
    loadRecruiterDashboard();
  } else {
    loadUserDashboard();
  }
}

function loadUserDashboard() {
  // Load user applications
  $.ajax({
    url: `${API_BASE}/user/applied-jobs`,
    method: "GET",
    xhrFields: {
      withCredentials: true,
    },
    success: (applications) => {
      displayUserApplications(applications);
      updateUserStats(applications);
    },
    error: () => {
      showToast("Failed to load applications", "error");
    },
  });
}

function loadRecruiterDashboard() {
  // Load recruiter jobs
  loadRecruiterJobs();
}

function loadRecruiterJobs() {
  $.ajax({
    url: `${API_BASE}/recruiter/jobs`,
    method: "GET",
    xhrFields: {
      withCredentials: true,
    },
    success: (jobs) => {
      displayRecruiterJobs(jobs);
      updateRecruiterStats(jobs);
    },
    error: () => {
      showToast("Failed to load jobs", "error");
    },
  });
}

function displayUserApplications(applications) {
  const applicationsList = $("#applications-list");
  applicationsList.empty();

  if (applications.length === 0) {
    applicationsList.html(
      '<div class="text-center"><h3>No applications yet</h3><p>Start applying for jobs to see them here.</p></div>'
    );
    return;
  }

  applications.forEach((app) => {
    const applicationCard = $(`
            <div class="application-card">
                <div class="application-header">
                    <h4>Job ID: ${app.job_id}</h4>
                    <span class="application-status status-${app.status.toLowerCase()}">${
      app.status
    }</span>
                </div>
                <div class="resume-score">
                    <p><strong>Resume Score:</strong> ${
                      app.resume_score
                    }/100</p>
                    <div class="score-bar">
                        <div class="score-fill" style="width: ${
                          app.resume_score
                        }%"></div>
                    </div>
                </div>
                <div class="ai-review">
                    <h5>AI Review:</h5>
                    <p>${app.ai_review}</p>
                </div>
            </div>
        `);

    applicationsList.append(applicationCard);
  });
}

function displayRecruiterJobs(jobs) {
  const jobsList = $("#recruiter-jobs-list");
  jobsList.empty();

  if (jobs.length === 0) {
    jobsList.html(
      '<div class="text-center"><h3>No jobs posted yet</h3><p>Create your first job posting.</p></div>'
    );
    return;
  }

  jobs.forEach((job) => {
    const jobCard = $(`
            <div class="job-card">
                <h3>${job.Title}</h3>
                <p><strong>Location:</strong> ${job.Location}</p>
                <p><strong>Status:</strong> ${job.Status}</p>
                <p><strong>Experience:</strong> ${job.ExperienceRequired}</p>
                <div class="job-actions">
                    <button class="btn btn-primary view-applications-btn" data-job-id="${job.JobID}">View Applications</button>
                    <button class="btn btn-outline edit-job-btn" data-job-id="${job.JobID}">Edit Job</button>
                </div>
            </div>
        `);

    jobsList.append(jobCard);
  });

  // Attach event listeners
  $(".view-applications-btn").click(function () {
    const jobId = $(this).data("job-id");
    viewJobApplications(jobId);
  });
}

function viewJobApplications(jobId) {
  $.ajax({
    url: `${API_BASE}/recruiter/job/${jobId}/applications`,
    method: "GET",
    xhrFields: {
      withCredentials: true,
    },
    success: (applications) => {
      displayJobApplications(applications, jobId);
    },
    error: () => {
      showToast("Failed to load applications", "error");
    },
  });
}

function displayJobApplications(applications, jobId) {
  let applicationsHtml = `<h3>Applications for Job ID: ${jobId}</h3>`;

  if (applications.length === 0) {
    applicationsHtml += "<p>No applications received yet.</p>";
  } else {
    applications.forEach((app) => {
      applicationsHtml += `
                <div class="application-card">
                    <div class="application-header">
                        <h4>Applicant ID: ${app.applicant_id}</h4>
                        <span class="application-status status-${app.status.toLowerCase()}">${
        app.status
      }</span>
                    </div>
                    <div class="resume-score">
                        <p><strong>Resume Score:</strong> ${
                          app.resume_score
                        }/100</p>
                        <div class="score-bar">
                            <div class="score-fill" style="width: ${
                              app.resume_score
                            }%"></div>
                        </div>
                    </div>
                    <div class="ai-review">
                        <h5>AI Review:</h5>
                        <p>${app.ai_review}</p>
                    </div>
                    <div class="application-actions">
                        <button class="btn btn-primary download-resume-btn" data-user-id="${
                          app.applicant_user_id
                        }">Download Resume</button>
                        <button class="btn btn-success schedule-interview-btn" data-application-id="${
                          app.applicant_id
                        }">Schedule Interview</button>
                    </div>
                </div>
            `;
    });
  }

  $("#job-details-content").html(applicationsHtml);
  showModal("job-details-modal");

  // Attach event listeners
  $(".download-resume-btn").click(function () {
    const userId = $(this).data("user-id");
    downloadResume(userId);
  });

  $(".schedule-interview-btn").click(function () {
    const applicationId = $(this).data("application-id");
    showScheduleInterviewModal(applicationId);
  });
}

function downloadResume(userId) {
  window.open(`${API_BASE}/download-resume/${userId}`, "_blank");
}

function showScheduleInterviewModal(applicationId) {
  $("#interview-form").data("application-id", applicationId);
  showModal("interview-modal");
}

function handleScheduleInterview(e) {
  e.preventDefault();

  const applicationId = $("#interview-form").data("application-id");
  const date = $("#interview-date").val();
  const mode = $("#interview-mode").val();

  showLoading();

  $.ajax({
    url: `${API_BASE}/schedule-interview?application_id=${applicationId}&date=${date}&mode=${mode}`,
    method: "POST",
    xhrFields: {
      withCredentials: true,
    },
    success: (response) => {
      hideLoading();
      showToast("Interview scheduled successfully!", "success");
      hideModal("interview-modal");
      $("#interview-form")[0].reset();
    },
    error: (xhr) => {
      hideLoading();
      const error = xhr.responseJSON?.detail || "Failed to schedule interview";
      showToast(error, "error");
    },
  });
}

function updateUserStats(applications) {
  $("#total-applications").text(applications.length);
  const pending = applications.filter((app) => app.status === "Applied").length;
  $("#pending-applications").text(pending);
  $("#interviews-scheduled").text(0); // This would need additional API call
}

function updateRecruiterStats(jobs) {
  $("#total-applications").text(jobs.length);
  const activeJobs = jobs.filter((job) => job.Status === "Open").length;
  $("#pending-applications").text(activeJobs);
  $("#interviews-scheduled").text(0); // This would need additional API call
}

function switchDashboardTab(tab) {
  $(".tab-btn").removeClass("active");
  $(`.tab-btn[data-tab="${tab}"]`).addClass("active");

  $(".tab-content").removeClass("active");
  $(`#${tab}-tab-content`).addClass("active");

  // Load tab-specific data
  switch (tab) {
    case "applications":
      if (userType === "recruiter") {
        loadRecruiterJobs();
      } else {
        loadUserDashboard();
      }
      break;
    case "jobs":
      loadRecruiterJobs();
      break;
  }
}

// Notifications functions
function loadNotifications() {
  if (!currentUser) {
    showPage("home");
    return;
  }

  const endpoint =
    userType === "recruiter"
      ? "/recruiter/notifications"
      : "/user/notifications";

  $.ajax({
    url: `${API_BASE}${endpoint}`,
    method: "GET",
    xhrFields: {
      withCredentials: true,
    },
    success: (notifications) => {
      displayNotifications(notifications);
    },
    error: () => {
      showToast("Failed to load notifications", "error");
    },
  });
}

function displayNotifications(notifications) {
  const notificationsList = $("#notifications-list");
  notificationsList.empty();

  if (notifications.length === 0) {
    notificationsList.html(
      '<div class="text-center"><h3>No notifications</h3></div>'
    );
    return;
  }

  notifications.forEach((notification) => {
    const notificationItem = $(`
            <div class="notification-item ${
              !notification.IsRead ? "unread" : ""
            }">
                <div class="notification-header">
                    <strong>${notification.Message}</strong>
                    <span class="notification-time">${formatDate(
                      notification.Timestamp
                    )}</span>
                </div>
                ${
                  !notification.IsRead
                    ? `<button class="btn btn-outline mark-read-btn" data-notification-id="${notification.NotificationID}">Mark as Read</button>`
                    : ""
                }
            </div>
        `);

    notificationsList.append(notificationItem);
  });

  // Attach event listeners
  $(".mark-read-btn").click(function () {
    const notificationId = $(this).data("notification-id");
    markNotificationAsRead(notificationId);
  });
}

function markNotificationAsRead(notificationId) {
  $.ajax({
    url: `${API_BASE}/notification/${notificationId}/read`,
    method: "PUT",
    xhrFields: {
      withCredentials: true,
    },
    success: () => {
      loadNotifications(); // Reload notifications
    },
    error: () => {
      showToast("Failed to mark notification as read", "error");
    },
  });
}

// Chat functions with email search functionality
function setupWebSocket() {
  if (!currentUser) return;

  const wsUrl = `ws://127.0.0.1:8000/ws/chat?email=${currentUserEmail}`;
  websocket = new WebSocket(wsUrl);

  websocket.onopen = () => {
    console.log("WebSocket connected");
  };

  websocket.onmessage = (event) => {
    const message = event.data;
    showToast(message, "info");

    // If on chat page, update chat
    if ($("#chat-page").hasClass("active")) {
      loadChatHistory(currentUserEmail);
    }
  };

  websocket.onclose = () => {
    console.log("WebSocket disconnected");
  };

  websocket.onerror = (error) => {
    console.error("WebSocket error:", error);
  };
}

function loadChatContacts() {
  // Load actual contacts from API instead of static data
  $.ajax({
    url: `${API_BASE}/chat/contacts`,
    method: "GET",
    xhrFields: {
      withCredentials: true,
    },
    success: (contacts) => {
      displayChatContacts(contacts);
    },
    error: () => {
      // If API fails, show empty state
      displayChatContacts([]);
    },
  });
}

function displayChatContacts(contacts) {
  console.log(contacts);
  const contactsList = $("#chat-contacts");
  contactsList.empty();

  // Add search bar
  const searchBar = $(`
    <div class="chat-search-container">
      <input type="email" id="email-search" placeholder="Search or enter email address..." class="form-control">
      <button type="button" id="search-email-btn" class="btn btn-primary">Search</button>
    </div>
  `);

  contactsList.append(searchBar);

  // Add contacts list header
  const contactsHeader = $(`
    <div class="contacts-header">
      <h4>Recent Conversations</h4>
    </div>
  `);
  contactsList.append(contactsHeader);

  // Display contacts
  if (contacts.length === 0) {
    const noContacts = $(`
      <div class="no-contacts">
        <p>No recent conversations. Use the search bar above to start a new chat.</p>
      </div>
    `);
    contactsList.append(noContacts);
  } else {
    contacts.forEach((contact) => {
      $.ajax({
        url: `${API_BASE}/count-unread-messages?friend_email=${contact.email}`,
        method: "GET",
        xhrFields: {
          withCredentials: true,
        },
        success: (response) => {
          contact.unread_count = response;
        },
        error: () => {
          contact.unread_count = 0;
        },
      });
      const contactItem = $(`
        <div class="chat-contact" data-email="${contact.email}">
          <div class="contact-info">
            <strong>${contact.name || contact.email}</strong>
            <div class="contact-email">${contact.email}</div>
            ${
              contact.last_message
                ? `<div class="last-message">${contact.last_message}</div>`
                : ""
            }
          </div>
          ${
            contact.unread_count && contact.unread_count > 0
              ? `<div class="unread-badge">${contact.unread_count}</div>`
              : ""
          }
        </div>
      `);
      contactsList.append(contactItem);
    });
  }

  // Attach event listeners
  $(".chat-contact").click(function () {
    const email = $(this).data("email");
    selectChatContact(email);
  });

  // Search functionality
  $("#search-email-btn").click(searchAndSelectEmail);
  $("#email-search").keypress((e) => {
    if (e.which === 13) {
      searchAndSelectEmail();
    }
  });

  // Real-time search as user types
  $("#email-search").on("input", function () {
    const searchTerm = $(this).val().toLowerCase();
    if (searchTerm.length > 0) {
      filterContacts(searchTerm);
    } else {
      $(".chat-contact").show();
    }
  });
}

// CSS styles to add to your stylesheet for read indicators
const readIndicatorStyles = `
<style>
.message.read {
  opacity: 0.9;
}

.message.unread {
  font-weight: bold;
}

.read-indicator {
  color: #007bff;
  font-size: 12px;
  margin-left: 5px;
}

.unread-badge {
  background-color: #dc3545;
  color: white;
  border-radius: 50%;
  padding: 4px 8px;
  font-size: 12px;
  min-width: 20px;
  text-align: center;
}

.chat-contact:hover .unread-badge {
  background-color: #c82333;
}

.resume-status {
  margin-left: 10px;
  font-size: 14px;
  color: #28a745;
}

.profile-section {
  margin-bottom: 20px;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
  border: 1px solid #dc3545;
}

.btn-danger:hover {
  background-color: #c82333;
  border-color: #bd2130;
}
</style>
`;

// Add styles to document head
$("head").append(readIndicatorStyles);

function filterContacts(searchTerm) {
  $(".chat-contact").each(function () {
    const email = $(this).data("email").toLowerCase();
    const name = $(this).find("strong").text().toLowerCase();

    if (email.includes(searchTerm) || name.includes(searchTerm)) {
      $(this).show();
    } else {
      $(this).hide();
    }
  });
}

function searchAndSelectEmail() {
  const email = $("#email-search").val().trim();

  if (!email) {
    showToast("Please enter an email address", "warning");
    return;
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showToast("Please enter a valid email address", "error");
    return;
  }

  // Check if email is already in contacts
  const existingContact = $(`.chat-contact[data-email="${email}"]`);
  if (existingContact.length > 0) {
    selectChatContact(email);
    $("#email-search").val("");
    return;
  }

  // Search for the email in the system
  showLoading();

  $.ajax({
    url: `${API_BASE}/check-registered-email?email_to_check=${email}`,
    method: "GET",
    contentType: "application/json",
    xhrFields: {
      withCredentials: true,
    },
    success: (response) => {
      hideLoading();

      if (response) {
        // User exists, add to contacts and select
        const newContact = {
          email: email,
          name: response.name || email,
          last_message: null,
          unread_count: 0,
        };

        addNewContactToList(newContact);
        selectChatContact(email);
        $("#email-search").val("");

        showToast(`Started chat with ${response.name || email}`, "success");
      } else {
        showToast("This email is not registered in our system", "error");
      }
    },
    error: (xhr) => {
      hideLoading();

      if (xhr.status === 404) {
        showToast("This email is not registered in our system", "error");
      } else {
        const error = xhr.responseJSON?.detail || "Failed to search email";
        showToast(error, "error");
      }
    },
  });
}

function addNewContactToList(contact) {
  // Remove "no contacts" message if present
  $(".no-contacts").remove();

  // Add new contact to the list
  const contactItem = $(`
    <div class="chat-contact" data-email="${contact.email}">
      <div class="contact-info">
        <strong>${contact.name}</strong>
        <div class="contact-email">${contact.email}</div>
      </div>
    </div>
  `);

  // Insert after the contacts header
  $(".contacts-header").after(contactItem);

  // Attach click event
  contactItem.click(function () {
    const email = $(this).data("email");
    selectChatContact(email);
  });
}

// Function to mark messages as read
function markMessagesAsRead(friendEmail) {
  if (!friendEmail || !currentUserEmail) {
    console.error("Friend email or current user email is missing");
    return;
  }

  $.ajax({
    url: `${API_BASE}/mark_as_read?friend_email=${friendEmail}`,
    method: "PATCH",
    xhrFields: {
      withCredentials: true,
    },
    success: (response) => {
      console.log("Messages marked as read:", response);

      // Update UI to show messages as read
      updateChatUIAsRead(friendEmail);

      // Update contact list to remove unread badge
      updateContactUnreadStatus(friendEmail);

      // Optional: Show subtle notification
      // showToast("Messages marked as read", "success");
    },
    error: (xhr) => {
      console.error("Failed to mark messages as read:", xhr);
      const error =
        xhr.responseJSON?.detail || "Failed to mark messages as read";
      showToast(error, "error");
    },
  });
}

function updateChatUIAsRead(friendEmail) {
  if (currentChatUser === friendEmail) {
    // Add visual indicator that messages are read (e.g., checkmarks)
    $("#chat-messages .message.received").addClass("read");
  }
}

function updateContactUnreadStatus(friendEmail) {
  const contactElement = $(`.chat-contact[data-email="${friendEmail}"]`);
  const unreadBadge = contactElement.find(".unread-badge");

  if (unreadBadge.length > 0) {
    unreadBadge.fadeOut(() => {
      unreadBadge.remove();
    });
  }
}

function selectChatContact(email) {
  currentChatUser = email;

  $(".chat-contact").removeClass("active");
  $(`.chat-contact[data-email="${email}"]`).addClass("active");

  // Update chat header
  const contactName =
    $(`.chat-contact[data-email="${email}"] strong`).text() || email;
  $("#chat-with").text(`Chat with ${contactName}`);

  // Enable message input
  $("#message-input").prop("disabled", false);
  $("#send-message-btn").prop("disabled", false);

  // Show chat area
  $("#chat-area").show();
  friendEmail = email;

  // Load chat history
  loadChatHistory(email);

  // Automatically mark messages as read when opening chat
  markMessagesAsRead(email);
}

function loadChatHistory(withEmail) {
  if (!withEmail) return;

  $.ajax({
    url: `${API_BASE}/chat-history?with_email=${encodeURIComponent(withEmail)}`,
    method: "GET",
    xhrFields: {
      withCredentials: true,
    },
    success: (messages) => {
      displayChatMessages(messages);
    },
    error: () => {
      // If no chat history exists, show empty state
      displayChatMessages([]);
    },
  });
}

function displayChatMessages(messages) {
  const messagesContainer = $("#chat-messages");
  messagesContainer.empty();

  if (messages.length === 0) {
    const emptyState = $(`
      <div class="empty-chat">
        <p>No messages yet. Start the conversation!</p>
      </div>
    `);
    messagesContainer.append(emptyState);
  } else {
    messages.forEach((message) => {
      const isSent = message.from === currentUserEmail;
      const readStatus = message.is_read ? "read" : "unread";

      const messageDiv = $(`
        <div class="message ${isSent ? "sent" : "received"} ${readStatus}">
          <div class="message-content">${message.message}</div>
          <div class="message-time">
            ${formatDate(message.timestamp)}
            ${
              isSent && message.is_read
                ? '<span class="read-indicator">✓✓</span>'
                : ""
            }
          </div>
        </div>
      `);
      messagesContainer.append(messageDiv);
    });
  }

  // Scroll to bottom
  messagesContainer.scrollTop(messagesContainer[0].scrollHeight);
}

function addMarkAsReadButton() {
  const markReadBtn = $(`
    <button type="button" id="mark-read-btn" class="btn btn-outline" style="margin-left: 10px;">
      Mark as Read
    </button>
  `);

  $("#chat-header").append(markReadBtn);

  $("#mark-read-btn").click(() => {
    if (currentChatUser) {
      markMessagesAsRead(currentChatUser);
    }
  });
}

function sendMessage() {
  const message = $("#message-input").val().trim();
  if (!message || !currentChatUser) return;

  if (websocket && websocket.readyState === WebSocket.OPEN) {
    websocket.send(
      JSON.stringify({
        to: currentChatUser,
        message: message,
      })
    );

    $("#message-input").val("");

    // Remove empty state if present
    $(".empty-chat").remove();

    // Add message to chat immediately
    const messageDiv = $(`
      <div class="message sent">
        <div class="message-content">${message}</div>
        <div class="message-time">${formatDate(new Date())}</div>
      </div>
    `);

    $("#chat-messages").append(messageDiv);
    $("#chat-messages").scrollTop($("#chat-messages")[0].scrollHeight);
  } else {
    showToast("Chat connection not available", "error");
  }
}

// Add this to your existing setupEventListeners function
function setupChatEventListeners() {
  // Chat search
  $("#search-email-btn").click(searchAndSelectEmail);
  $("#email-search").keypress((e) => {
    if (e.which === 13) {
      searchAndSelectEmail();
    }
  });

  // Send message
  $("#send-message-btn").click(sendMessage);
  $("#message-input").keypress((e) => {
    if (e.which === 13) {
      sendMessage();
    }
  });
}

// Utility functions
function showLoading() {
  $("#loading").show();
}

function hideLoading() {
  $("#loading").hide();
}

function showToast(message, type = "info") {
  const toast = $(`
        <div class="toast ${type}">
            ${message}
        </div>
    `);

  $("#toast-container").append(toast);

  // Auto remove after 5 seconds
  setTimeout(() => {
    toast.fadeOut(() => toast.remove());
  }, 5000);

  // Click to dismiss
  toast.click(() => {
    toast.fadeOut(() => toast.remove());
  });
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString();
}

// Error handling
$(document).ajaxError((event, xhr, settings, thrownError) => {
  if (xhr.status === 401) {
    currentUser = null;
    currentUserEmail = null;
    userType = null;
    updateNavigation();
    showPage("home");
    showToast("Session expired. Please login again.", "warning");
  }
});

// Initialize tooltips and other UI enhancements
$(document).ready(() => {
  // Add smooth scrolling
  $('a[href^="#"]').on("click", function (event) {
    var target = $(this.getAttribute("href"));
    if (target.length) {
      event.preventDefault();
      $("html, body")
        .stop()
        .animate(
          {
            scrollTop: target.offset().top - 70,
          },
          1000
        );
    }
  });

  // Add loading states to buttons
  $(document).on("click", ".btn", function () {
    const btn = $(this);
    if (btn.hasClass("loading")) return false;

    const originalText = btn.text();
    btn.addClass("loading").text("Loading...");

    setTimeout(() => {
      btn.removeClass("loading").text(originalText);
    }, 2000);
  });
});
