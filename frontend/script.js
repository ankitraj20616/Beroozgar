// Global variables
let currentUser = null;
let currentUserEmail = null;
let userType = null;
let websocket = null;
let currentChatUser = null;
const API_BASE = "http://127.0.0.1:8000";
const $ = window.jQuery;

// Initialize the application
$(document).ready(() => {
  initializeApp();
  setupEventListeners();
  checkAuthStatus();
  initializeAnimations();
});

// Initialize application
function initializeApp() {
  showPage("home");
  setupNavigation();
  loadJobs();
  animateCounters();
}

// Initialize animations and interactive elements
function initializeAnimations() {
  // Animate hero stats on page load
  setTimeout(() => {
    animateCounters();
  }, 1000);

  // Add scroll animations
  setupScrollAnimations();

  // Add interactive hover effects
  setupInteractiveEffects();
}

// Animate counter numbers
function animateCounters() {
  $(".stat-number[data-count]").each(function () {
    const $this = $(this);
    const target = parseInt($this.data("count"));
    const duration = 2000;
    const increment = target / (duration / 16);
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      $this.text(Math.floor(current).toLocaleString());
    }, 16);

    $this.addClass("count-animation");
  });
}

// Setup scroll animations
function setupScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
      }
    });
  }, observerOptions);

  // Observe feature cards and other elements
  $(".feature-card, .story-card, .mission-card, .team-member").each(
    function () {
      this.style.opacity = "0";
      this.style.transform = "translateY(30px)";
      this.style.transition = "opacity 0.6s ease, transform 0.6s ease";
      observer.observe(this);
    }
  );
}

// Setup interactive effects
function setupInteractiveEffects() {
  // Add ripple effect to buttons
  $(".btn").on("click", function (e) {
    const button = $(this);
    const ripple = $('<span class="ripple"></span>');

    const rect = this.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    ripple.css({
      width: size,
      height: size,
      left: x,
      top: y,
      position: "absolute",
      borderRadius: "50%",
      background: "rgba(255, 255, 255, 0.3)",
      transform: "scale(0)",
      animation: "ripple 0.6s linear",
      pointerEvents: "none",
    });

    button.css("position", "relative").css("overflow", "hidden");
    button.append(ripple);

    setTimeout(() => ripple.remove(), 600);
  });

  // Add floating animation to hero cards
  $(".floating-card").each(function (index) {
    $(this).css("animation-delay", `${index * 0.5}s`);
  });

  // Add parallax effect to hero background
  $(window).on("scroll", function () {
    const scrolled = $(this).scrollTop();
    const parallax = $(".hero-background");
    const speed = 0.5;

    parallax.css("transform", `translateY(${scrolled * speed}px)`);
  });
}

// Setup event listeners
function setupEventListeners() {
  // Navigation
  $(".nav-link").click(function (e) {
    e.preventDefault();
    const page = $(this).data("page");
    if (page) {
      showPage(page);

      // Add active state animation
      $(".nav-link").removeClass("active");
      $(this).addClass("active");
    }
  });

  // Mobile menu toggle
  $("#hamburger").click(() => {
    $(".nav-menu").toggleClass("active");
    $("#hamburger").toggleClass("active");
  });

  // Auth buttons
  $("#login-btn").click(() => showModal("login-modal"));
  $("#signup-btn, #hero-signup, #cta-signup").click(() =>
    showModal("signup-modal")
  );
  $("#hero-browse, #cta-browse").click(() => showPage("jobs"));
  $("#logout-btn").click(logout);

  // Dashboard navigation
  $("#dashboard-btn").click(() => showPage("dashboard"));
  $("#notifications-btn").click(() => showPage("notifications"));
  $("#chat-btn").click(() => showPage("chat"));
  $("#profile-btn").click(() => showPage("profile"));

  // Modal close buttons
  $(".close").click(function () {
    const modalId = $(this).data("modal");
    if (modalId) {
      hideModal(modalId);
    }
  });

  // Auth tabs
  $(".auth-tab").click(function () {
    const authType = $(this).data("auth");
    if (authType) {
      switchAuthTab(authType);
    }
  });

  // Forms
  $("#login-form").submit(handleLogin);
  $("#otp-form").submit(handleOTPVerification);
  $("#user-signup-form").submit(handleUserSignup);
  $("#recruiter-signup-form").submit(handleRecruiterSignup);
  $("#create-job-form").submit(handleCreateJob);
  $("#interview-form").submit(handleScheduleInterview);
  $("#profile-edit-form").submit(handleProfileUpdate);
  $("#contact-form").submit(handleContactForm);

  // Dashboard tabs
  $(".tab-btn").click(function () {
    const tab = $(this).data("tab");
    if (tab) {
      switchDashboardTab(tab);
    }
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

  // Quick filter tags
  $(".filter-tag").click(function () {
    const searchTerm = $(this).data("search");
    if (searchTerm) {
      $("#job-search-title").val(searchTerm);
      searchJobs();
    }
  });

  // Chat
  $("#send-message-btn").click(sendMessage);
  $("#message-input").keypress((e) => {
    if (e.which === 13) {
      sendMessage();
    }
  });

  // Notification filters
  $(".filter-btn").click(function () {
    $(".filter-btn").removeClass("active");
    $(this).addClass("active");
    const filter = $(this).data("filter");
    if (filter) {
      filterNotifications(filter);
    }
  });

  // Profile actions
  $(document).on("click", "#edit-profile-btn", function () {
    $("#profile-view").hide();
    $("#profile-edit").show();
  });

  $(document).on("click", "#cancel-edit-btn", function () {
    $("#profile-edit").hide();
    $("#profile-view").show();
    loadProfile();
  });

  $(document).on("click", "#update-resume-btn", handleResumeUpdate);
  $(document).on("click", "#delete-account-btn", confirmDeleteAccount);

  // Click outside modal to close
  $(window).click((e) => {
    if ($(e.target).hasClass("modal")) {
      $(e.target).hide();
    }
  });

  // Add smooth scrolling for anchor links
  $('a[href^="#"]').on("click", function (event) {
    const target = $(this.getAttribute("href"));
    if (target.length) {
      event.preventDefault();
      $("html, body")
        .stop()
        .animate(
          {
            scrollTop: target.offset().top - 80,
          },
          1000
        );
    }
  });

  // Add loading states to buttons
  $(document).on("click", ".btn", function () {
    const btn = $(this);
    if (btn.hasClass("loading")) return false;

    const originalText = btn.html();
    btn
      .addClass("loading")
      .html('<i class="fas fa-spinner fa-spin"></i> Loading...');

    setTimeout(() => {
      btn.removeClass("loading").html(originalText);
    }, 2000);
  });
}

// Navigation functions
function setupNavigation() {
  updateNavigation();
}

function showPage(pageId) {
  // Validate pageId
  if (!pageId || typeof pageId !== "string") {
    console.error("showPage: Invalid pageId provided");
    return;
  }

  // Check if page exists
  const pageElement = $(`#${pageId}-page`);
  if (pageElement.length === 0) {
    console.error(`showPage: Page with id "${pageId}-page" not found`);
    return;
  }

  // Add page transition effect
  $(".page.active").fadeOut(200, function () {
    $(this).removeClass("active");
    pageElement.fadeIn(300).addClass("active");
  });

  // Close mobile menu
  $(".nav-menu").removeClass("active");
  $("#hamburger").removeClass("active");

  // Update navigation active state
  $(".nav-link").removeClass("active");
  $(`.nav-link[data-page="${pageId}"]`).addClass("active");

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

  // Scroll to top
  $("html, body").animate({ scrollTop: 0 }, 300);
}

function updateNavigation() {
  if (currentUser) {
    $("#auth-buttons").hide();
    $("#user-menu").show();

    // Update user info in dropdown
    if (currentUser.name) {
      $("#user-name-dropdown").text(currentUser.name);
    }
    $("#user-type-dropdown").text(
      userType === "recruiter" ? "Recruiter" : "Job Seeker"
    );

    // Update avatar
    const initials = currentUser.name
      ? currentUser.name.charAt(0).toUpperCase()
      : "U";
    $("#user-avatar-text").text(initials);
  } else {
    $("#auth-buttons").show();
    $("#user-menu").hide();
  }
}

// Modal functions
function showModal(modalId) {
  // Validate modalId
  if (!modalId || typeof modalId !== "string") {
    console.error("showModal: Invalid modalId provided");
    return;
  }

  const modalElement = $(`#${modalId}`);
  if (modalElement.length === 0) {
    console.error(`showModal: Modal with id "${modalId}" not found`);
    return;
  }

  modalElement.fadeIn(300);
  $("body").addClass("modal-open");
}

function hideModal(modalId) {
  // Validate modalId
  if (!modalId || typeof modalId !== "string") {
    console.error("hideModal: Invalid modalId provided");
    return;
  }

  const modalElement = $(`#${modalId}`);
  if (modalElement.length === 0) {
    console.error(`hideModal: Modal with id "${modalId}" not found`);
    return;
  }

  modalElement.fadeOut(300);
  $("body").removeClass("modal-open");
}

function switchAuthTab(authType) {
  // Validate authType
  if (!authType || typeof authType !== "string") {
    console.error("switchAuthTab: Invalid authType provided");
    return;
  }

  $(".auth-tab").removeClass("active");
  $(`.auth-tab[data-auth="${authType}"]`).addClass("active");

  $(".auth-form").removeClass("active");
  if (authType === "user") {
    $("#user-signup-form").addClass("active");
  } else if (authType === "recruiter") {
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

  if (!email || !email.trim()) {
    showToast("Please enter your email address", "error");
    return;
  }

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
  const otp = parseInt($("#otp-code").val());
  const email = $("#otp-form").data("email");

  if (!otp || isNaN(otp)) {
    showToast("Please enter a valid OTP", "error");
    return;
  }

  if (!email) {
    showToast("Email not found. Please try logging in again.", "error");
    return;
  }

  showLoading();

  $.ajax({
    url: `${API_BASE}/otpVerifier?otp=${otp}&email=${encodeURIComponent(
      email
    )}`,
    method: "POST",
    xhrFields: {
      withCredentials: true,
    },
    success: (response) => {
      hideLoading();
      showToast("Welcome to Broozgar! 🎉", "success");
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
  const name = $("#user-name").val();
  const email = $("#user-email").val();
  const phone = $("#user-phone").val();
  const skills = $("#user-skills").val();
  const experience = $("#user-experience").val();
  const education = $("#user-education").val();
  const resume = $("#user-resume")[0].files[0];

  // Validation
  if (
    !name ||
    !email ||
    !phone ||
    !skills ||
    !experience ||
    !education ||
    !resume
  ) {
    showToast("Please fill in all required fields", "error");
    return;
  }

  formData.append("name", name);
  formData.append("email", email);
  formData.append("phone", phone);
  formData.append("skills", skills);
  formData.append("experience", experience);
  formData.append("education", education);
  formData.append("resume", resume);

  showLoading();

  $.ajax({
    url: `${API_BASE}/userSignup`,
    method: "POST",
    data: formData,
    processData: false,
    contentType: false,
    success: (response) => {
      hideLoading();
      showToast("Welcome to Broozgar! Please login to continue.", "success");
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

  const name = $("#recruiter-name").val();
  const email = $("#recruiter-email").val();
  const company = $("#recruiter-company").val();
  const phone = $("#recruiter-phone").val();

  // Validation
  if (!name || !email || !company || !phone) {
    showToast("Please fill in all required fields", "error");
    return;
  }

  const data = {
    name: name,
    email: email,
    company: company,
    phone: phone,
  };

  showLoading();

  $.ajax({
    url: `${API_BASE}/recruiter-signup`,
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify(data),
    success: (response) => {
      hideLoading();
      showToast("Welcome to Broozgar! Please login to continue.", "success");
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
      showToast("Thank you for using Broozgar! 👋", "success");

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

// Contact form handler
function handleContactForm(e) {
  e.preventDefault();

  showLoading();

  // Simulate form submission
  setTimeout(() => {
    hideLoading();
    showToast(
      "Thank you for your message! We'll get back to you soon.",
      "success"
    );
    $("#contact-form")[0].reset();
  }, 1500);
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
                    <i class="fas fa-download"></i>
                    Download Resume
                </button>
                <span class="resume-status">
                    <i class="fas fa-check-circle"></i>
                    Resume uploaded
                </span>
            `);
    } else {
      $("#profile-resume").html(`
                <span class="resume-status" style="color: var(--gray-500);">
                    <i class="fas fa-exclamation-circle"></i>
                    No resume uploaded
                </span>
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
}

function populateEditForm(userData) {
  $("#edit-name").val(userData.Name || "");
  $("#edit-email").val(userData.Email || "");
  $("#edit-phone").val(userData.Phone || "");

  if (userType === "user") {
    $("#edit-skills").val(userData.Skills || "");
    $("#edit-experience").val(userData.Experience || "");
    $("#edit-education").val(userData.Education || "");
  } else {
    $("#edit-company").val(userData.Company || "");
  }
}

function handleProfileUpdate(e) {
  e.preventDefault();

  const updateData = {};
  const name = $("#edit-name").val()?.trim();
  const email = $("#edit-email").val()?.trim();
  const phone = $("#edit-phone").val()?.trim();

  if (name) updateData.name = name;
  if (email) updateData.email = email;
  if (phone) updateData.phone = phone;

  if (userType === "user") {
    const skills = $("#edit-skills").val()?.trim();
    const experience = $("#edit-experience").val()?.trim();
    const education = $("#edit-education").val()?.trim();

    if (skills) updateData.skills = skills;
    if (experience) updateData.experience = experience;
    if (education) updateData.education = education;
  } else if (userType === "recruiter") {
    const company = $("#edit-company").val()?.trim();
    if (company) updateData.company = company;
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
      showToast("Profile updated successfully! ✨", "success");
      $("#profile-edit").hide();
      $("#profile-view").show();
      loadProfile();
    },
    error: (xhr) => {
      hideLoading();
      const error = xhr.responseJSON?.detail || "Failed to update profile";
      showToast(error, "error");
    },
  });
}

function handleResumeUpdate() {
  if (!currentUser) {
    showToast("Please login to update resume", "warning");
    return;
  }

  if (userType !== "user") {
    showToast("Only job seekers can upload resumes", "warning");
    return;
  }

  const resumeFile = $("#edit-resume")[0]?.files[0];
  if (!resumeFile) {
    showToast("Please select a resume file to upload", "warning");
    return;
  }

  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (!allowedTypes.includes(resumeFile.type)) {
    showToast("Please upload a PDF or Word document", "error");
    return;
  }

  if (resumeFile.size > 5 * 1024 * 1024) {
    showToast("File size must be less than 5MB", "error");
    return;
  }

  const formData = new FormData();
  formData.append("new_resume", resumeFile);

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
      showToast("Resume updated successfully! 📄", "success");
      $("#edit-resume").val("");
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

  const downloadUrl = `${API_BASE}/download-resume`;
  window.open(downloadUrl, "_blank");
}

function confirmDeleteAccount() {
  const confirmationHtml = `
        <div id="delete-confirmation-modal" class="modal" style="display: block;">
            <div class="modal-content">
                <div class="modal-header">
                    <h2 style="color: var(--danger-color);">
                        <i class="fas fa-exclamation-triangle"></i>
                        Delete Account
                    </h2>
                    <p>This action cannot be undone</p>
                </div>
                <div style="padding: 2rem;">
                    <p><strong>Are you sure you want to delete your account?</strong></p>
                    <p>This will permanently remove:</p>
                    <ul style="margin: 1rem 0; padding-left: 2rem;">
                        <li>Your profile information</li>
                        <li>All job applications</li>
                        <li>Chat history</li>
                        <li>All personal data</li>
                    </ul>
                    <div class="form-actions" style="margin-top: 2rem;">
                        <button type="button" class="btn btn-danger" id="confirm-delete-btn">
                            <i class="fas fa-trash"></i>
                            Yes, Delete My Account
                        </button>
                        <button type="button" class="btn btn-outline" id="cancel-delete-btn">
                            <i class="fas fa-times"></i>
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

  $("body").append(confirmationHtml);

  $("#confirm-delete-btn").on("click", function () {
    $("#delete-confirmation-modal").remove();
    deleteAccount();
  });

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
        "Account deleted successfully. We're sorry to see you go! 😢",
        "success"
      );

      currentUser = null;
      currentUserEmail = null;
      userType = null;
      updateNavigation();
      showPage("home");

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

// Job functions
function loadJobs() {
  showLoading();

  $.ajax({
    url: `${API_BASE}/jobs`,
    method: "GET",
    success: (jobs) => {
      hideLoading();
      displayJobs(jobs);
      updateJobsCount(jobs.length);
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
      updateJobsCount(jobs.length);

      if (jobs.length === 0) {
        showToast("No jobs found matching your criteria", "info");
      } else {
        showToast(
          `Found ${jobs.length} job${
            jobs.length > 1 ? "s" : ""
          } matching your search`,
          "success"
        );
      }
    },
    error: () => {
      hideLoading();
      showToast("Search failed", "error");
    },
  });
}

function updateJobsCount(count) {
  $("#jobs-count").text(`${count.toLocaleString()} Jobs Available`);
}

function displayJobs(jobs) {
  const jobsList = $("#jobs-list");
  jobsList.empty();

  if (jobs.length === 0) {
    jobsList.html(`
            <div class="text-center" style="grid-column: 1 / -1; padding: 3rem;">
                <i class="fas fa-search" style="font-size: 4rem; color: var(--gray-300); margin-bottom: 1rem;"></i>
                <h3>No jobs found</h3>
                <p>Try adjusting your search criteria or browse all available positions</p>
                <button class="btn btn-primary" onclick="loadJobs()">
                    <i class="fas fa-refresh"></i>
                    Show All Jobs
                </button>
            </div>
        `);
    return;
  }

  jobs.forEach((job) => {
    const skillTags = job.SkillsRequired.split(",")
      .map((skill) => `<span class="skill-tag">${skill.trim()}</span>`)
      .join("");

    const jobCard = $(`
            <div class="job-card" data-job-id="${job.JobID}">
                <div class="job-header">
                    <h3>${job.Title}</h3>
                    <div class="job-status ${job.Status.toLowerCase()}">
                        <i class="fas fa-circle"></i>
                        ${job.Status}
                    </div>
                </div>
                <div class="company">
                    <i class="fas fa-building"></i>
                    Company ID: ${job.RecruiterID}
                </div>
                <div class="location">
                    <i class="fas fa-map-marker-alt"></i>
                    ${job.Location}
                </div>
                <div class="skills">${skillTags}</div>
                <div class="job-meta">
                    <div class="salary">
                        <i class="fas fa-money-bill-wave"></i>
                        ${job.Salary || "Salary not specified"}
                    </div>
                    <div class="experience">
                        <i class="fas fa-chart-line"></i>
                        ${job.ExperienceRequired}
                    </div>
                </div>
                <div class="job-actions">
                    <button class="btn btn-outline view-job-btn" data-job-id="${
                      job.JobID
                    }">
                        <i class="fas fa-eye"></i>
                        View Details
                    </button>
                    ${
                      currentUser && userType === "user"
                        ? `<button class="btn btn-primary apply-job-btn" data-job-id="${job.JobID}">
                            <i class="fas fa-paper-plane"></i>
                            Apply Now
                        </button>`
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
    if (jobId) {
      viewJobDetails(jobId);
    }
  });

  $(".apply-job-btn").click(function () {
    const jobId = $(this).data("job-id");
    if (jobId) {
      applyForJob(jobId);
    }
  });

  // Add hover effects
  $(".job-card").hover(
    function () {
      $(this).addClass("hovered");
    },
    function () {
      $(this).removeClass("hovered");
    }
  );
}

function viewJobDetails(jobId) {
  if (!jobId) {
    showToast("Invalid job ID", "error");
    return;
  }

  $.ajax({
    url: `${API_BASE}/job/${jobId}`,
    method: "GET",
    success: (job) => {
      const skillTags = job.SkillsRequired.split(",")
        .map((skill) => `<span class="skill-tag">${skill.trim()}</span>`)
        .join("");

      const jobDetails = `
                <div class="job-details-header">
                    <h2>${job.Title}</h2>
                    <div class="job-status ${job.Status.toLowerCase()}">
                        <i class="fas fa-circle"></i>
                        ${job.Status}
                    </div>
                </div>
                <div class="job-meta-grid">
                    <div class="meta-item">
                        <i class="fas fa-building"></i>
                        <div>
                            <strong>Company</strong>
                            <span>Recruiter ID ${job.RecruiterID}</span>
                        </div>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <div>
                            <strong>Location</strong>
                            <span>${job.Location}</span>
                        </div>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-money-bill-wave"></i>
                        <div>
                            <strong>Salary</strong>
                            <span>${job.Salary || "Not specified"}</span>
                        </div>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-chart-line"></i>
                        <div>
                            <strong>Experience</strong>
                            <span>${job.ExperienceRequired}</span>
                        </div>
                    </div>
                </div>
                <div class="job-skills-section">
                    <h4><i class="fas fa-code"></i> Skills Required</h4>
                    <div class="skills-container">${skillTags}</div>
                </div>
                <div class="job-description-section">
                    <h4><i class="fas fa-align-left"></i> Job Description</h4>
                    <div class="description-content">${job.Description}</div>
                </div>
                ${
                  currentUser && userType === "user"
                    ? `
                    <div class="job-actions-section">
                        <button class="btn btn-primary btn-large" onclick="applyForJob('${job.JobID}')">
                            <i class="fas fa-paper-plane"></i>
                            Apply for this Job
                        </button>
                        <button class="btn btn-outline btn-large" onclick="saveJob('${job.JobID}')">
                            <i class="fas fa-bookmark"></i>
                            Save Job
                        </button>
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
  if (!jobId) {
    showToast("Invalid job ID", "error");
    return;
  }

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
      showToast("Application submitted successfully! 🎉", "success");
      hideModal("job-details-modal");

      const resultHtml = `
                <div id="application-result-modal" class="modal" style="display: block;">
                    <div class="modal-content">
                        <span class="close" onclick="$('#application-result-modal').remove()">&times;</span>
                        <div class="application-result">
                            <div class="result-header">
                                <i class="fas fa-check-circle" style="color: var(--secondary-color); font-size: 3rem; margin-bottom: 1rem;"></i>
                                <h3>Application Submitted Successfully!</h3>
                                <p>Your application has been processed by our AI system</p>
                            </div>
                            <div class="score-section">
                                <div class="score-display">
                                    <span class="score-number">${response.score}</span>
                                    <span class="score-total">/100</span>
                                </div>
                                <div class="score-bar">
                                    <div class="score-fill" style="width: ${response.score}%;"></div>
                                </div>
                                <p class="score-label">Resume Match Score</p>
                            </div>
                            <div class="ai-review-section">
                                <h4><i class="fas fa-robot"></i> AI Analysis</h4>
                                <div class="review-content">${response.review}</div>
                            </div>
                            <div class="result-actions">
                                <button class="btn btn-primary" onclick="$('#application-result-modal').remove()">
                                    <i class="fas fa-check"></i>
                                    Continue
                                </button>
                                <button class="btn btn-outline" onclick="showPage('dashboard')">
                                    <i class="fas fa-tachometer-alt"></i>
                                    View Dashboard
                                </button>
                            </div>
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

  const title = $("#job-title").val();
  const description = $("#job-description").val();
  const skills = $("#job-skills").val();
  const experience = $("#job-experience").val();
  const salary = $("#job-salary").val();
  const location = $("#job-location").val();
  const status = $("#job-status").val();

  // Validation
  if (!title || !description || !skills || !experience || !location) {
    showToast("Please fill in all required fields", "error");
    return;
  }

  const data = {
    title: title,
    description: description,
    skills_required: skills,
    experience_required: experience,
    salary: salary,
    location: location,
    status: status,
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
      showToast("Job posted successfully! 🚀", "success");
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

  setupDashboardForUserType();
  loadDashboardData();
}

function setupDashboardForUserType() {
  if (userType === "recruiter") {
    $("#dashboard-title").text("Welcome Back, Recruiter!");
    $("#dashboard-subtitle").text(
      "Manage your job postings and find the perfect candidates"
    );
    $("#applications-tab").text("Job Applications");
    $("#jobs-tab").show();
    $("#create-job-tab").show();
  } else {
    $("#dashboard-title").text("Welcome Back, Job Seeker!");
    $("#dashboard-subtitle").text(
      "Track your applications and discover new opportunities"
    );
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
    applicationsList.html(`
            <div class="empty-state">
                <i class="fas fa-paper-plane" style="font-size: 4rem; color: var(--gray-300); margin-bottom: 1rem;"></i>
                <h3>No applications yet</h3>
                <p>Start applying for jobs to see them here</p>
                <button class="btn btn-primary" onclick="showPage('jobs')">
                    <i class="fas fa-search"></i>
                    Browse Jobs
                </button>
            </div>
        `);
    return;
  }

  applications.forEach((app) => {
    const applicationCard = $(`
            <div class="application-card">
                <div class="application-header">
                    <div class="application-info">
                        <h4>Job ID: ${app.job_id}</h4>
                        <span class="application-date">Applied recently</span>
                    </div>
                    <span class="application-status status-${app.status.toLowerCase()}">${
      app.status
    }</span>
                </div>
                <div class="resume-score">
                    <div class="score-header">
                        <span><strong>Resume Score:</strong> ${
                          app.resume_score
                        }/100</span>
                        <span class="score-percentage">${
                          app.resume_score
                        }%</span>
                    </div>
                    <div class="score-bar">
                        <div class="score-fill" style="width: ${
                          app.resume_score
                        }%"></div>
                    </div>
                </div>
                <div class="ai-review">
                    <h5><i class="fas fa-robot"></i> AI Review</h5>
                    <p>${app.ai_review}</p>
                </div>
                <div class="application-actions">
                    <button class="btn btn-outline btn-small">
                        <i class="fas fa-eye"></i>
                        View Job
                    </button>
                    <button class="btn btn-outline btn-small">
                        <i class="fas fa-comments"></i>
                        Message Recruiter
                    </button>
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
    jobsList.html(`
            <div class="empty-state">
                <i class="fas fa-briefcase" style="font-size: 4rem; color: var(--gray-300); margin-bottom: 1rem;"></i>
                <h3>No jobs posted yet</h3>
                <p>Create your first job posting to start finding candidates</p>
                <button class="btn btn-primary" onclick="switchDashboardTab('create-job')">
                    <i class="fas fa-plus"></i>
                    Create Job
                </button>
            </div>
        `);
    return;
  }

  jobs.forEach((job) => {
    const jobCard = $(`
            <div class="job-card recruiter-job">
                <div class="job-header">
                    <h3>${job.Title}</h3>
                    <div class="job-status ${job.Status.toLowerCase()}">
                        <i class="fas fa-circle"></i>
                        ${job.Status}
                    </div>
                </div>
                <div class="job-meta">
                    <p><i class="fas fa-map-marker-alt"></i> <strong>Location:</strong> ${
                      job.Location
                    }</p>
                    <p><i class="fas fa-chart-line"></i> <strong>Experience:</strong> ${
                      job.ExperienceRequired
                    }</p>
                    <p><i class="fas fa-calendar"></i> <strong>Posted:</strong> Recently</p>
                </div>
                <div class="job-stats">
                    <div class="stat-item">
                        <span class="stat-number">0</span>
                        <span class="stat-label">Applications</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">0</span>
                        <span class="stat-label">Views</span>
                    </div>
                </div>
                <div class="job-actions">
                    <button class="btn btn-primary view-applications-btn" data-job-id="${
                      job.JobID
                    }">
                        <i class="fas fa-users"></i>
                        View Applications
                    </button>
                    <button class="btn btn-outline edit-job-btn" data-job-id="${
                      job.JobID
                    }">
                        <i class="fas fa-edit"></i>
                        Edit Job
                    </button>
                </div>
            </div>
        `);

    jobsList.append(jobCard);
  });

  $(".view-applications-btn").click(function () {
    const jobId = $(this).data("job-id");
    if (jobId) {
      viewJobApplications(jobId);
    }
  });
}

function viewJobApplications(jobId) {
  if (!jobId) {
    showToast("Invalid job ID", "error");
    return;
  }

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
  let applicationsHtml = `
        <div class="applications-header">
            <h3><i class="fas fa-users"></i> Applications for Job ID: ${jobId}</h3>
            <span class="applications-count">${
              applications.length
            } application${applications.length !== 1 ? "s" : ""}</span>
        </div>
    `;

  if (applications.length === 0) {
    applicationsHtml += `
            <div class="empty-state">
                <i class="fas fa-inbox" style="font-size: 3rem; color: var(--gray-300); margin-bottom: 1rem;"></i>
                <p>No applications received yet</p>
            </div>
        `;
  } else {
    applications.forEach((app) => {
      applicationsHtml += `
                <div class="application-card candidate-application">
                    <div class="application-header">
                        <div class="candidate-info">
                            <h4><i class="fas fa-user"></i> Applicant ID: ${
                              app.applicant_id
                            }</h4>
                            <span class="application-date">Applied recently</span>
                        </div>
                        <span class="application-status status-${app.status.toLowerCase()}">${
        app.status
      }</span>
                    </div>
                    <div class="resume-score">
                        <div class="score-header">
                            <span><strong>Resume Score:</strong> ${
                              app.resume_score
                            }/100</span>
                            <span class="score-percentage">${
                              app.resume_score
                            }%</span>
                        </div>
                        <div class="score-bar">
                            <div class="score-fill" style="width: ${
                              app.resume_score
                            }%"></div>
                        </div>
                    </div>
                    <div class="ai-review">
                        <h5><i class="fas fa-robot"></i> AI Analysis</h5>
                        <p>${app.ai_review}</p>
                    </div>
                    <div class="application-actions">
                        <button class="btn btn-primary download-resume-btn" data-user-id="${
                          app.applicant_user_id
                        }">
                            <i class="fas fa-download"></i>
                            Download Resume
                        </button>
                        <button class="btn btn-success schedule-interview-btn" data-application-id="${
                          app.applicant_id
                        }">
                            <i class="fas fa-calendar-check"></i>
                            Schedule Interview
                        </button>
                        <button class="btn btn-outline">
                            <i class="fas fa-comments"></i>
                            Message Candidate
                        </button>
                    </div>
                </div>
            `;
    });
  }

  $("#job-details-content").html(applicationsHtml);
  showModal("job-details-modal");

  $(".download-resume-btn").click(function () {
    const userId = $(this).data("user-id");
    if (userId) {
      downloadResume(userId);
    }
  });

  $(".schedule-interview-btn").click(function () {
    const applicationId = $(this).data("application-id");
    if (applicationId) {
      showScheduleInterviewModal(applicationId);
    }
  });
}

function downloadResume(userId) {
  if (!userId) {
    showToast("Invalid user ID", "error");
    return;
  }
  window.open(`${API_BASE}/download-resume/${userId}`, "_blank");
}

function showScheduleInterviewModal(applicationId) {
  if (!applicationId) {
    showToast("Invalid application ID", "error");
    return;
  }
  $("#interview-form").data("application-id", applicationId);
  showModal("interview-modal");
}

function handleScheduleInterview(e) {
  e.preventDefault();

  const applicationId = $("#interview-form").data("application-id");
  const date = $("#interview-date").val();
  const mode = $("#interview-mode").val();

  if (!applicationId || !date || !mode) {
    showToast("Please fill in all required fields", "error");
    return;
  }

  showLoading();

  $.ajax({
    url: `${API_BASE}/schedule-interview?application_id=${applicationId}&date=${date}&mode=${mode}`,
    method: "POST",
    xhrFields: {
      withCredentials: true,
    },
    success: (response) => {
      hideLoading();
      showToast("Interview scheduled successfully! 📅", "success");
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
  $("#interviews-scheduled").text(0);
  $("#profile-views").text(Math.floor(Math.random() * 50) + 10);
}

function updateRecruiterStats(jobs) {
  $("#total-applications").text(jobs.length);
  const activeJobs = jobs.filter((job) => job.Status === "Open").length;
  $("#pending-applications").text(activeJobs);
  $("#interviews-scheduled").text(0);
  $("#profile-views").text(Math.floor(Math.random() * 100) + 50);
}

function switchDashboardTab(tab) {
  // Validate tab
  if (!tab || typeof tab !== "string") {
    console.error("switchDashboardTab: Invalid tab provided");
    return;
  }

  $(".tab-btn").removeClass("active");
  $(`.tab-btn[data-tab="${tab}"]`).addClass("active");

  $(".tab-pane").removeClass("active");
  const tabContent = $(`#${tab}-tab-content`);
  if (tabContent.length > 0) {
    tabContent.addClass("active");
  }

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
      updateNotificationBadge(notifications);
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
    notificationsList.html(`
            <div class="empty-state">
                <i class="fas fa-bell-slash" style="font-size: 4rem; color: var(--gray-300); margin-bottom: 1rem;"></i>
                <h3>No notifications</h3>
                <p>You're all caught up! New notifications will appear here.</p>
            </div>
        `);
    return;
  }

  notifications.forEach((notification) => {
    const notificationItem = $(`
            <div class="notification-item ${
              !notification.IsRead ? "unread" : ""
            }" data-id="${notification.NotificationID}">
                <div class="notification-icon">
                    <i class="fas fa-bell"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-header">
                        <strong>${notification.Message}</strong>
                        <span class="notification-time">${formatDate(
                          notification.Timestamp
                        )}</span>
                    </div>
                    ${
                      !notification.IsRead
                        ? `<button class="btn btn-outline btn-small mark-read-btn" data-notification-id="${notification.NotificationID}">
                            <i class="fas fa-check"></i>
                            Mark as Read
                        </button>`
                        : ""
                    }
                </div>
            </div>
        `);

    notificationsList.append(notificationItem);
  });

  $(".mark-read-btn").click(function () {
    const notificationId = $(this).data("notification-id");
    if (notificationId) {
      markNotificationAsRead(notificationId);
    }
  });
}

function markNotificationAsRead(notificationId) {
  if (!notificationId) {
    showToast("Invalid notification ID", "error");
    return;
  }

  $.ajax({
    url: `${API_BASE}/notification/${notificationId}/read`,
    method: "PUT",
    xhrFields: {
      withCredentials: true,
    },
    success: () => {
      $(`.notification-item[data-id="${notificationId}"]`).removeClass(
        "unread"
      );
      $(`.mark-read-btn[data-notification-id="${notificationId}"]`).remove();
      loadNotifications();
    },
    error: () => {
      showToast("Failed to mark notification as read", "error");
    },
  });
}

function updateNotificationBadge(notifications) {
  const unreadCount = notifications.filter((n) => !n.IsRead).length;
  const badge = $("#notification-count");

  if (unreadCount > 0) {
    badge.text(unreadCount).show();
  } else {
    badge.hide();
  }
}

function filterNotifications(filter) {
  if (!filter) {
    return;
  }

  const items = $(".notification-item");
  items.show();

  switch (filter) {
    case "unread":
      items.not(".unread").hide();
      break;
    case "applications":
      items
        .filter(function () {
          return !$(this)
            .find("strong")
            .text()
            .toLowerCase()
            .includes("application");
        })
        .hide();
      break;
    case "messages":
      items
        .filter(function () {
          return !$(this)
            .find("strong")
            .text()
            .toLowerCase()
            .includes("message");
        })
        .hide();
      break;
  }
}

// Chat functions
function setupWebSocket() {
  if (!currentUser) return;

  const wsUrl = `ws://127.0.0.1:8000/ws/chat?email=${currentUserEmail}`;
  websocket = new WebSocket(wsUrl);

  websocket.onopen = () => {
    console.log("WebSocket connected");
  };

  websocket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.from && data.message) {
      if (currentChatUser === data.from) {
        const messageDiv = $(`
                    <div class="message received">
                        <div class="message-content">${data.message}</div>
                        <div class="message-time">${formatDate(
                          new Date()
                        )}</div>
                    </div>
                `);
        $("#chat-messages").append(messageDiv);
        $("#chat-messages").scrollTop($("#chat-messages")[0].scrollHeight);
      } else {
        showToast(`💬 New message from ${data.from}`, "info");
      }
    } else {
      showToast(event.data, "info");
    }

    if ($("#chat-page").hasClass("active")) {
      loadChatContacts();
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
      displayChatContacts([]);
    },
  });
}

function displayChatContacts(contacts) {
  const contactsList = $("#chat-contacts");
  contactsList.empty();

  const searchBar = $(`
        <div class="chat-search-container">
            <div class="input-group">
                <i class="fas fa-search"></i>
                <input type="email" id="email-search" placeholder="Search or enter email address..." class="form-control">
            </div>
            <button type="button" id="search-email-btn" class="btn btn-primary btn-small">
                <i class="fas fa-plus"></i>
            </button>
        </div>
    `);

  contactsList.append(searchBar);

  const contactsHeader = $(`
        <div class="contacts-header">
            <h4>Recent Conversations</h4>
        </div>
    `);
  contactsList.append(contactsHeader);

  if (contacts.length === 0) {
    const noContacts = $(`
            <div class="no-contacts">
                <i class="fas fa-comments" style="font-size: 2rem; color: var(--gray-300); margin-bottom: 1rem;"></i>
                <p>No recent conversations</p>
                <p>Use the search bar above to start a new chat</p>
            </div>
        `);
    contactsList.append(noContacts);
  } else {
    contacts.forEach((contact) => {
      const contactItem = $(`
                <div class="chat-contact" data-email="${contact.email}">
                    <div class="contact-avatar">
                        <span>${
                          contact.name
                            ? contact.name.charAt(0).toUpperCase()
                            : contact.email.charAt(0).toUpperCase()
                        }</span>
                    </div>
                    <div class="contact-info">
                        <strong>${contact.name || contact.email}</strong>
                        <div class="contact-email">${contact.email}</div>
                        ${
                          contact.last_message
                            ? `<div class="last-message">${contact.last_message}</div>`
                            : ""
                        }
                    </div>
                    <div class="contact-status">
                        <div class="online-indicator"></div>
                    </div>
                </div>
            `);
      contactsList.append(contactItem);
    });
  }

  $(".chat-contact").click(function () {
    const email = $(this).data("email");
    if (email) {
      selectChatContact(email);
    }
  });

  $("#search-email-btn").click(searchAndSelectEmail);
  $("#email-search").keypress((e) => {
    if (e.which === 13) {
      searchAndSelectEmail();
    }
  });

  $("#email-search").on("input", function () {
    const searchTerm = $(this).val().toLowerCase();
    if (searchTerm.length > 0) {
      filterContacts(searchTerm);
    } else {
      $(".chat-contact").show();
    }
  });
}

function filterContacts(searchTerm) {
  if (!searchTerm) return;

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

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showToast("Please enter a valid email address", "error");
    return;
  }

  const existingContact = $(`.chat-contact[data-email="${email}"]`);
  if (existingContact.length > 0) {
    selectChatContact(email);
    $("#email-search").val("");
    return;
  }

  showLoading();

  $.ajax({
    url: `${API_BASE}/check-registered-email?email_to_check=${email}`,
    method: "GET",
    xhrFields: {
      withCredentials: true,
    },
    success: (response) => {
      hideLoading();
      if (response) {
        const newContact = {
          email: email,
          name: response.name || email,
          last_message: null,
        };

        addNewContactToList(newContact);
        selectChatContact(email);
        $("#email-search").val("");
        showToast(`Started chat with ${response.name || email} 💬`, "success");
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
  $(".no-contacts").remove();

  const contactItem = $(`
        <div class="chat-contact" data-email="${contact.email}">
            <div class="contact-avatar">
                <span>${contact.name.charAt(0).toUpperCase()}</span>
            </div>
            <div class="contact-info">
                <strong>${contact.name}</strong>
                <div class="contact-email">${contact.email}</div>
            </div>
            <div class="contact-status">
                <div class="online-indicator"></div>
            </div>
        </div>
    `);

  $(".contacts-header").after(contactItem);

  contactItem.click(function () {
    const email = $(this).data("email");
    if (email) {
      selectChatContact(email);
    }
  });
}

function enableChatInput() {
  console.log("abc");
  $("#message-input").prop("disabled", false);
  $("#send-message-btn").prop("disabled", false);
}

function selectChatContact(email) {
  if (!email) {
    showToast("Invalid email address", "error");
    return;
  }

  currentChatUser = email;

  $(".chat-contact").removeClass("active");
  $(`.chat-contact[data-email="${email}"]`).addClass("active");

  const contactName =
    $(`.chat-contact[data-email="${email}"] strong`).text() || email;
  $("#chat-with").text(contactName);
  $("#chat-user-initial").text(contactName.charAt(0).toUpperCase());

  enableChatInput();

  $("#chat-area").show();
  $("#chat-placeholder").hide();

  loadChatHistory(email);
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
                <i class="fas fa-comments"></i>
                <p>No messages yet. Start the conversation!</p>
            </div>
        `);
    messagesContainer.append(emptyState);
  } else {
    messages.forEach((message) => {
      const isSent = message.from === currentUserEmail;
      const messageDiv = $(`
                <div class="message ${isSent ? "sent" : "received"}">
                    <div class="message-content">${message.message}</div>
                    <div class="message-time">${formatDate(
                      message.timestamp
                    )}</div>
                </div>
            `);
      messagesContainer.append(messageDiv);
    });
  }

  messagesContainer.scrollTop(messagesContainer[0].scrollHeight);
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

    $(".empty-chat").remove();

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

// Utility functions
function showLoading() {
  $("#loading").fadeIn(200);
}

function hideLoading() {
  $("#loading").fadeOut(200);
}

function showToast(message, type = "info") {
  const icons = {
    success: "fas fa-check-circle",
    error: "fas fa-exclamation-circle",
    warning: "fas fa-exclamation-triangle",
    info: "fas fa-info-circle",
  };

  const toast = $(`
        <div class="toast ${type}">
            <i class="${icons[type]}"></i>
            <span>${message}</span>
        </div>
    `);

  $("#toast-container").append(toast);

  setTimeout(() => {
    toast.fadeOut(() => toast.remove());
  }, 5000);

  toast.click(() => {
    toast.fadeOut(() => toast.remove());
  });
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString();
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

// Add CSS for ripple effect
const rippleCSS = `
<style>
@keyframes ripple {
    to {
        transform: scale(4);
        opacity: 0;
    }
}

.job-card.hovered {
    transform: translateY(-8px);
    box-shadow: var(--shadow-xl);
}

.nav-link.active {
    color: var(--primary-color);
    background: rgba(59, 130, 246, 0.1);
}

.empty-state {
    text-align: center;
    padding: 3rem 2rem;
    color: var(--gray-500);
}

.empty-state h3 {
    color: var(--gray-600);
    margin-bottom: 1rem;
}

.job-details-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--gray-200);
}

.job-meta-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
}

.meta-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 1rem;
    background: var(--gray-100);
    border-radius: var(--border-radius);
}

.meta-item i {
    color: var(--primary-color);
    font-size: 1.2rem;
}

.meta-item strong {
    display: block;
    color: var(--gray-800);
    font-weight: 600;
}

.meta-item span {
    color: var(--gray-600);
}

.job-skills-section,
.job-description-section {
    margin-bottom: 2rem;
}

.job-skills-section h4,
.job-description-section h4 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 1rem;
    color: var(--gray-800);
}

.description-content {
    background: var(--gray-100);
    padding: 1.5rem;
    border-radius: var(--border-radius);
    line-height: 1.7;
    color: var(--gray-700);
}

.job-actions-section {
    display: flex;
    gap: 1rem;
    justify-content: center;
    padding-top: 2rem;
    border-top: 1px solid var(--gray-200);
}

.application-result {
    text-align: center;
    padding: 2rem;
}

.result-header h3 {
    color: var(--gray-800);
    margin-bottom: 0.5rem;
}

.score-section {
    margin: 2rem 0;
}

.score-display {
    display: flex;
    align-items: baseline;
    justify-content: center;
    margin-bottom: 1rem;
}

.score-number {
    font-size: 3rem;
    font-weight: 700;
    color: var(--secondary-color);
}

.score-total {
    font-size: 1.5rem;
    color: var(--gray-500);
    margin-left: 0.5rem;
}

.score-label {
    color: var(--gray-600);
    font-weight: 500;
    margin-top: 0.5rem;
}

.ai-review-section {
    background: var(--gray-100);
    padding: 1.5rem;
    border-radius: var(--border-radius);
    margin: 2rem 0;
    text-align: left;
}

.ai-review-section h4 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 1rem;
    color: var(--gray-800);
}

.review-content {
    color: var(--gray-700);
    line-height: 1.6;
}

.result-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-top: 2rem;
}

.applications-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--gray-200);
}

.applications-count {
    background: var(--primary-color);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 50px;
    font-size: 0.9rem;
    font-weight: 600;
}

.candidate-application {
    border-left: 4px solid var(--primary-color);
}

.application-info,
.candidate-info {
    flex: 1;
}

.application-date {
    font-size: 0.8rem;
    color: var(--gray-500);
}

.score-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
}

.score-percentage {
    font-weight: 600;
    color: var(--secondary-color);
}

.recruiter-job {
    border-left: 4px solid var(--secondary-color);
}

.job-stats {
    display: flex;
    gap: 2rem;
    margin: 1rem 0;
    padding: 1rem;
    background: var(--gray-100);
    border-radius: var(--border-radius);
}

.job-stats .stat-item {
    text-align: center;
}

.job-stats .stat-number {
    display: block;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--primary-color);
}

.job-stats .stat-label {
    font-size: 0.8rem;
    color: var(--gray-600);
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.notification-item {
    display: flex;
    gap: 1rem;
    align-items: flex-start;
}

.notification-icon {
    width: 40px;
    height: 40px;
    background: var(--primary-color);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    flex-shrink: 0;
}

.notification-content {
    flex: 1;
}

.contact-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--gradient-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    flex-shrink: 0;
}

.contact-status {
    display: flex;
    align-items: center;
}

.online-indicator {
    width: 8px;
    height: 8px;
    background: var(--secondary-color);
    border-radius: 50%;
}

.job-status {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0.25rem 0.75rem;
    border-radius: 50px;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
}

.job-status.open {
    background: rgba(16, 185, 129, 0.1);
    color: var(--secondary-color);
}

.job-status.closed {
    background: rgba(239, 68, 68, 0.1);
    color: var(--danger-color);
}

.job-status i {
    font-size: 0.6rem;
}

body.modal-open {
    overflow: hidden;
}
</style>
`;

$("head").append(rippleCSS);
