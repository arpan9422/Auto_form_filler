// Background Script – Service Worker
// Handles API communication between content script and backend

const API_URL = "http://localhost:5000/api";

// Mock test data for offline testing
const MOCK_ANSWERS: Record<string, string> = {
  email: "test@example.com",
  firstname: "John",
  lastname: "Doe",
  name: "John Doe",
  "full-name": "John Doe",
  phone: "9156933376",
  address: "123 Main St, Springfield, IL 62701",
  city: "Springfield",
  state: "Illinois",
  zipcode: "62701",
  country: "United States",
  company: "Tech Corp",
  "company-name": "Tech Corp",
  jobtitle: "Software Engineer",
  "job-title": "Senior Software Engineer",
  experience: "5+ years",
  message: "Hello! I'm interested in this opportunity.",
  comments: "Looking forward to hearing from you.",
  subject: "Application Submission",
};

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("📨 Background received message:", message.type);

  switch (message.type) {
    case "FORM_FIELDS_DETECTED":
      handleFormFieldsDetected(sender.tab?.id!, message.data);
      break;

    case "TRIGGER_AUTOFILL":
      handleAutoFill(sender.tab?.id!);
      break;

    case "CHAT_REFINE":
      handleChatRefine(sender.tab?.id!, message.data);
      break;
  }

  sendResponse({ success: true });
  return true;
});

// Handle when form fields are detected from content script
function handleFormFieldsDetected(tabId: number, fields: any[]) {
  console.log("📋 Form fields detected from content script:", fields);

  if (!fields || fields.length === 0) {
    console.warn("⚠️ No fields detected");
    return;
  }

  // Generate answers for the fields
  const answers = generateAnswers(fields);
  console.log("🤖 Generated answers:", answers);

  // Send fill request back to content script
  console.log("📤 Sending fill request to content script");
  chrome.tabs.sendMessage(tabId, {
    type: "FILL_FIELDS",
    data: answers,
  });
}

// Handle autofill flow
async function handleAutoFill(tabId: number) {
  console.log("🔄 Starting AutoFill for tab:", tabId);

  try {
    // 1. Get form fields from content script
    const response = await chrome.tabs.sendMessage(tabId, { type: "DETECT_FIELDS" });
    const fields = response.fields;

    console.log("📋 Received fields from content script:", fields);

    if (!fields || fields.length === 0) {
      console.warn("⚠️ No fields detected");
      return;
    }

    // 2. Generate answers (offline test mode)
    const answers = generateAnswers(fields);
    console.log("🤖 Generated answers:", answers);

    // 3. Send generated answers to content script
    console.log("📤 Sending fill request to content script");
    chrome.tabs.sendMessage(tabId, {
      type: "FILL_FIELDS",
      data: answers,
    });
  } catch (error) {
    console.error("❌ AutoFill error:", error);
  }
}

// Generate mock answers based on field names and available options
function generateAnswers(fields: any[]): Record<string, string> {
  const answers: Record<string, string> = {};

  fields.forEach((field) => {
    const fieldKey = field.selector || field.name || field.label || field.id;
    const fieldName = (field.name || field.label || "").toLowerCase();
    const fieldLabel = (field.label || "").toLowerCase();
    let value = "";

    console.log(`🎯 Field: ${field.label || field.name}`);
    console.log(`   Has options: ${field.options?.length > 0}`);

    // If field has dropdown options, select from available options
    if (field.options && field.options.length > 0) {
      console.log(`   Options: ${field.options.join(", ")}`);
      value = selectFromOptions(fieldLabel, field.options);
    } else {
      value = matchMockData(fieldName, fieldLabel);
    }

    if (value) answers[fieldKey] = value;
  });

  return answers;
}

// Smart dropdown option selector
function selectFromOptions(fieldLabel: string, options: string[]): string {
  const validOptions = options.filter((opt) => opt && opt.trim());
  if (validOptions.length === 0) return "";

  if (fieldLabel.includes("country")) {
    return validOptions.find((opt) => opt.toLowerCase().includes("united")) || validOptions[0];
  } else if (fieldLabel.includes("state")) {
    return validOptions.find((opt) => opt.toLowerCase() === "illinois") || validOptions[0];
  } else if (fieldLabel.includes("gender")) {
    return validOptions.find((opt) => opt.toLowerCase().includes("male")) || validOptions[0];
  } else if (fieldLabel.includes("experience") || fieldLabel.includes("year")) {
    return validOptions.find((opt) => opt.toLowerCase().includes("5")) || validOptions[0];
  } else if (fieldLabel.includes("rating")) {
    return validOptions[Math.floor(validOptions.length / 2)] || validOptions[0];
  }
  return validOptions[0];
}

// Match field against mock data
function matchMockData(fieldName: string, fieldLabel: string): string {
  const fullText = `${fieldName} ${fieldLabel}`.toLowerCase();

  for (const [key, value] of Object.entries(MOCK_ANSWERS)) {
    if (fieldName.includes(key) || key.includes(fieldName)) {
      return value as string;
    }
  }

  if (fullText.includes("email")) return MOCK_ANSWERS.email;
  else if (fullText.includes("name")) return MOCK_ANSWERS.name;
  else if (fullText.includes("phone")) return MOCK_ANSWERS.phone;
  else if (fullText.includes("address")) return MOCK_ANSWERS.address;
  else if (fullText.includes("company")) return MOCK_ANSWERS.company;
  else if (fullText.includes("job") || fullText.includes("title")) return MOCK_ANSWERS["job-title"];
  else if (fullText.includes("message") || fullText.includes("comment")) return MOCK_ANSWERS.message;
  else return "Test data";
}

// Handle chat refinement
async function handleChatRefine(_tabId: number, data: { message: string }) {
  console.log("💬 Chat refine:", data.message);

  try {
    const { token } = await chrome.storage.local.get("token");
    if (!token) {
      console.warn("⚠️ No auth token found");
      return;
    }

    // TODO: Implement chat refinement with backend
  } catch (error) {
    console.error("❌ Chat refine error:", error);
  }
}
