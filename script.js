// Global variables
let allQuestions = [];
let examQuestions = [];
let currentQuestionIndex = 0;
let userAnswers = [];
let totalQuestions = 60;
let reviewQuestionIndex = 0;

// Timer variables
let examTimer;
let timeRemaining = 45 * 60; // 45 minutes in seconds
let examStartTime;

// DOM Elements
const startScreen = document.getElementById("startScreen");
const loadingScreen = document.getElementById("loadingScreen");
const questionContainer = document.getElementById("questionContainer");
const resultsContainer = document.getElementById("resultsContainer");
const reviewContainer = document.getElementById("reviewContainer");
const errorContainer = document.getElementById("errorContainer");

const startBtn = document.getElementById("startBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const submitBtn = document.getElementById("submitBtn");
const retakeBtn = document.getElementById("retakeBtn");
const reviewBtn = document.getElementById("reviewBtn");
const backToResultsBtn = document.getElementById("backToResultsBtn");
const reviewPrevBtn = document.getElementById("reviewPrevBtn");
const reviewNextBtn = document.getElementById("reviewNextBtn");

const currentQuestionNum = document.getElementById("currentQuestionNum");
const totalQuestionsSpan = document.getElementById("totalQuestions");
const progressFill = document.getElementById("progressFill");
const questionText = document.getElementById("questionText");
const optionsContainer = document.getElementById("optionsContainer");
const answerWarning = document.getElementById("answerWarning");
const timerDisplay = document.getElementById("timerDisplay");

const scoreDisplay = document.getElementById("scoreDisplay");
const resultStatus = document.getElementById("resultStatus");
const correctCount = document.getElementById("correctCount");
const wrongCount = document.getElementById("wrongCount");

// Review elements
const reviewCurrentQuestionNum = document.getElementById(
  "reviewCurrentQuestionNum"
);
const reviewTotalQuestions = document.getElementById("reviewTotalQuestions");
const reviewProgressFill = document.getElementById("reviewProgressFill");
const reviewQuestionText = document.getElementById("reviewQuestionText");
const reviewOptionsContainer = document.getElementById(
  "reviewOptionsContainer"
);
const reviewAnswerResult = document.getElementById("reviewAnswerResult");

// Event Listeners
startBtn.addEventListener("click", startExam);
prevBtn.addEventListener("click", previousQuestion);
nextBtn.addEventListener("click", nextQuestion);
submitBtn.addEventListener("click", submitExam);
retakeBtn.addEventListener("click", restartExam);
reviewBtn.addEventListener("click", startReview);
backToResultsBtn.addEventListener("click", backToResults);
reviewPrevBtn.addEventListener("click", reviewPreviousQuestion);
reviewNextBtn.addEventListener("click", reviewNextQuestion);

// Load questions from JSON file
async function loadQuestions() {
  try {
    const response = await fetch("question.json");
    if (!response.ok) {
      throw new Error("Failed to load questions");
    }
    const data = await response.json();

    // Flatten all questions from different categories
    allQuestions = [];
    for (const category in data) {
      if (Array.isArray(data[category])) {
        data[category].forEach((question, index) => {
          allQuestions.push({
            ...question,
            category: category,
            originalIndex: index,
          });
        });
      }
    }

    if (allQuestions.length === 0) {
      throw new Error("No questions found");
    }

    return true;
  } catch (error) {
    console.error("Error loading questions:", error);
    return false;
  }
}

// Randomize and select 60 questions
function selectRandomQuestions() {
  // Shuffle all questions
  const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);

  // Select first 60 questions (or all if less than 60)
  examQuestions = shuffled.slice(0, Math.min(totalQuestions, shuffled.length));

  // Initialize user answers array
  userAnswers = new Array(examQuestions.length).fill(null);

  console.log(`Selected ${examQuestions.length} questions for exam`);
}

// Timer functions
function startTimer() {
  examStartTime = Date.now();
  timeRemaining = 45 * 60; // Reset to 45 minutes
  updateTimerDisplay();

  examTimer = setInterval(() => {
    timeRemaining--;
    updateTimerDisplay();

    // Check if time is up
    if (timeRemaining <= 0) {
      clearInterval(examTimer);
      // Auto-submit exam when time runs out
      autoSubmitExam();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const formattedTime = `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;

  if (timerDisplay) {
    timerDisplay.textContent = formattedTime;

    // Change color when time is running low (last 5 minutes)
    if (timeRemaining <= 300) {
      // 5 minutes = 300 seconds
      timerDisplay.style.color = "#e74c3c";
      timerDisplay.style.fontWeight = "bold";
    } else if (timeRemaining <= 600) {
      // 10 minutes = 600 seconds
      timerDisplay.style.color = "#f39c12";
    } else {
      timerDisplay.style.color = "#27ae60";
    }
  }
}

function stopTimer() {
  if (examTimer) {
    clearInterval(examTimer);
    examTimer = null;
  }
}

function autoSubmitExam() {
  // Save current answer if any
  const answer = getCurrentAnswers();
  if (answer !== null) {
    userAnswers[currentQuestionIndex] = answer;
  }

  // Auto-submit the exam
  alert("Time is up! Your exam has been automatically submitted.");
  calculateAndDisplayResults();
}

// Start the examination
async function startExam() {
  startScreen.style.display = "none";
  loadingScreen.style.display = "block";

  const loaded = await loadQuestions();

  if (!loaded) {
    loadingScreen.style.display = "none";
    errorContainer.style.display = "block";
    return;
  }

  selectRandomQuestions();

  loadingScreen.style.display = "none";
  questionContainer.style.display = "block";

  currentQuestionIndex = 0;

  // Start the timer
  startTimer();

  displayQuestion();
}

// Display current question
function displayQuestion() {
  const question = examQuestions[currentQuestionIndex];

  // Update question number and progress
  currentQuestionNum.textContent = currentQuestionIndex + 1;
  totalQuestionsSpan.textContent = examQuestions.length;

  const progress = ((currentQuestionIndex + 1) / examQuestions.length) * 100;
  progressFill.style.width = progress + "%";

  // Display question text
  questionText.textContent = question.question;

  // Determine input type based on correct answers
  const isMultipleChoice = question.correctAnswer.length > 1;
  const inputType = isMultipleChoice ? "checkbox" : "radio";

  // Generate options HTML
  optionsContainer.innerHTML = "";

  question.options.forEach((option, index) => {
    const optionDiv = document.createElement("div");
    optionDiv.className = "option";

    const input = document.createElement("input");
    input.type = inputType;
    input.name = `question_${currentQuestionIndex}`;
    input.value = index;
    input.id = `option_${index}`;

    // Check if this option was previously selected
    const savedAnswer = userAnswers[currentQuestionIndex];
    if (savedAnswer !== null) {
      if (Array.isArray(savedAnswer)) {
        input.checked = savedAnswer.includes(index);
      } else {
        input.checked = savedAnswer === index;
      }
    }

    const label = document.createElement("label");
    label.htmlFor = `option_${index}`;
    label.textContent = option;

    optionDiv.appendChild(input);
    optionDiv.appendChild(label);
    optionsContainer.appendChild(optionDiv);
  });

  // Update navigation buttons
  prevBtn.disabled = currentQuestionIndex === 0;

  const isLastQuestion = currentQuestionIndex === examQuestions.length - 1;
  nextBtn.style.display = isLastQuestion ? "none" : "inline-block";
  submitBtn.style.display = isLastQuestion ? "inline-block" : "none";

  // Hide warning message
  answerWarning.style.display = "none";
}

// Get selected answers for current question
function getCurrentAnswers() {
  const inputs = document.querySelectorAll(
    `input[name="question_${currentQuestionIndex}"]:checked`
  );

  if (inputs.length === 0) {
    return null;
  }

  const question = examQuestions[currentQuestionIndex];
  const isMultipleChoice = question.correctAnswer.length > 1;

  if (isMultipleChoice) {
    return Array.from(inputs).map((input) => parseInt(input.value));
  } else {
    return parseInt(inputs[0].value);
  }
}

// Validate that an answer is selected
function validateAnswer() {
  const answer = getCurrentAnswers();
  if (answer === null) {
    answerWarning.style.display = "block";
    return false;
  }
  answerWarning.style.display = "none";
  return true;
}

// Save current answer and move to next question
function nextQuestion() {
  if (!validateAnswer()) {
    return;
  }

  // Save current answer
  userAnswers[currentQuestionIndex] = getCurrentAnswers();

  // Move to next question
  currentQuestionIndex++;
  displayQuestion();
}

// Save current answer and move to previous question
function previousQuestion() {
  // Save current answer (if any)
  const answer = getCurrentAnswers();
  if (answer !== null) {
    userAnswers[currentQuestionIndex] = answer;
  }

  // Move to previous question
  currentQuestionIndex--;
  displayQuestion();
}

// Submit the exam
function submitExam() {
  if (!validateAnswer()) {
    return;
  }

  // Stop the timer
  stopTimer();

  // Save final answer
  userAnswers[currentQuestionIndex] = getCurrentAnswers();

  // Calculate score
  calculateAndDisplayResults();
}

// Calculate score and display results
function calculateAndDisplayResults() {
  let correctAnswers = 0;

  examQuestions.forEach((question, index) => {
    const userAnswer = userAnswers[index];
    const correctAnswer = question.correctAnswer;

    // Compare answers
    let isCorrect = false;

    if (Array.isArray(correctAnswer) && Array.isArray(userAnswer)) {
      // Multiple choice question
      isCorrect =
        correctAnswer.length === userAnswer.length &&
        correctAnswer.every((ans) => userAnswer.includes(ans));
    } else if (!Array.isArray(correctAnswer) && !Array.isArray(userAnswer)) {
      // Single choice question
      isCorrect = correctAnswer[0] === userAnswer;
    } else if (Array.isArray(correctAnswer) && !Array.isArray(userAnswer)) {
      isCorrect = correctAnswer[0] === userAnswer;
    } else {
      // Mismatch in answer types
      isCorrect = false;
    }

    if (isCorrect) {
      correctAnswers++;
    }
  });

  const totalQuestions = examQuestions.length;
  const wrongAnswers = totalQuestions - correctAnswers;
  const percentage = Math.round((correctAnswers / totalQuestions) * 100);

  // Display results
  questionContainer.style.display = "none";
  resultsContainer.style.display = "block";

  scoreDisplay.textContent = `${correctAnswers}/${totalQuestions}`;
  scoreDisplay.className = `score-display ${
    percentage >= 80 ? "score-pass" : "score-fail"
  }`;

  // LTO passing grade is typically 70%
  if (percentage >= 70) {
    resultStatus.innerHTML = `<strong style="color: #27ae60;">PASSED (${percentage}%)</strong>`;
  } else {
    resultStatus.innerHTML = `<strong style="color: #e74c3c;">FAILED (${percentage}%)</strong>`;
  }

  correctCount.textContent = correctAnswers;
  wrongCount.textContent = wrongAnswers;
}

// Restart the exam
function restartExam() {
  // Stop any running timer
  stopTimer();

  // Reset variables
  currentQuestionIndex = 0;
  userAnswers = [];
  examQuestions = [];
  timeRemaining = 45 * 60; // Reset timer to 45 minutes

  // Show start screen
  resultsContainer.style.display = "none";
  reviewContainer.style.display = "none";
  startScreen.style.display = "block";
}

// Review Functions
function startReview() {
  reviewQuestionIndex = 0;
  resultsContainer.style.display = "none";
  reviewContainer.style.display = "block";
  displayReviewQuestion();
}

function backToResults() {
  reviewContainer.style.display = "none";
  resultsContainer.style.display = "block";
}

function displayReviewQuestion() {
  const question = examQuestions[reviewQuestionIndex];
  const userAnswer = userAnswers[reviewQuestionIndex];
  const correctAnswer = question.correctAnswer;

  // Update question number and progress
  reviewCurrentQuestionNum.textContent = reviewQuestionIndex + 1;
  reviewTotalQuestions.textContent = examQuestions.length;

  const progress = ((reviewQuestionIndex + 1) / examQuestions.length) * 100;
  reviewProgressFill.style.width = progress + "%";

  // Display question text
  reviewQuestionText.textContent = question.question;

  // Generate options HTML for review
  reviewOptionsContainer.innerHTML = "";

  question.options.forEach((option, index) => {
    const optionDiv = document.createElement("div");
    optionDiv.className = "review-option";

    // Check if this option is correct
    const isCorrect = Array.isArray(correctAnswer)
      ? correctAnswer.includes(index)
      : correctAnswer[0] === index;

    // Check if user selected this option
    const isUserSelected = Array.isArray(userAnswer)
      ? userAnswer.includes(index)
      : userAnswer === index;

    // Apply appropriate styling
    if (isCorrect && isUserSelected) {
      optionDiv.classList.add("correct-selected");
    } else if (isCorrect && !isUserSelected) {
      optionDiv.classList.add("correct-not-selected");
    } else if (!isCorrect && isUserSelected) {
      optionDiv.classList.add("wrong-selected");
    } else {
      optionDiv.classList.add("not-selected");
    }

    // Add icons
    const icon = document.createElement("span");
    icon.className = "review-icon";

    if (isCorrect && isUserSelected) {
      icon.innerHTML = "✓"; // Correct and selected
      icon.style.color = "#27ae60";
    } else if (isCorrect && !isUserSelected) {
      icon.innerHTML = "✓"; // Correct but not selected
      icon.style.color = "#f39c12";
    } else if (!isCorrect && isUserSelected) {
      icon.innerHTML = "✗"; // Wrong and selected
      icon.style.color = "#e74c3c";
    } else {
      icon.innerHTML = "";
    }

    const label = document.createElement("span");
    label.textContent = option;

    optionDiv.appendChild(icon);
    optionDiv.appendChild(label);
    reviewOptionsContainer.appendChild(optionDiv);
  });

  // Display answer result
  const isQuestionCorrect = checkAnswerCorrectness(userAnswer, correctAnswer);
  if (isQuestionCorrect) {
    reviewAnswerResult.innerHTML = `<span style="color: #27ae60; font-weight: bold;">✓ Correct</span>`;
  } else {
    reviewAnswerResult.innerHTML = `<span style="color: #e74c3c; font-weight: bold;">✗ Wrong</span>`;
  }

  // Update navigation buttons
  reviewPrevBtn.disabled = reviewQuestionIndex === 0;
  reviewNextBtn.disabled = reviewQuestionIndex === examQuestions.length - 1;
}

function checkAnswerCorrectness(userAnswer, correctAnswer) {
  if (Array.isArray(correctAnswer) && Array.isArray(userAnswer)) {
    // Multiple choice question
    return (
      correctAnswer.length === userAnswer.length &&
      correctAnswer.every((ans) => userAnswer.includes(ans))
    );
  } else if (!Array.isArray(correctAnswer) && !Array.isArray(userAnswer)) {
    // Single choice question
    return correctAnswer[0] === userAnswer;
  } else if (Array.isArray(correctAnswer) && !Array.isArray(userAnswer)) {
    return correctAnswer[0] === userAnswer;
  } else {
    return false;
  }
}

function reviewPreviousQuestion() {
  if (reviewQuestionIndex > 0) {
    reviewQuestionIndex--;
    displayReviewQuestion();
  }
}

function reviewNextQuestion() {
  if (reviewQuestionIndex < examQuestions.length - 1) {
    reviewQuestionIndex++;
    displayReviewQuestion();
  }
}

// Initialize the application
document.addEventListener("DOMContentLoaded", function () {
  console.log("LTO Examination System loaded");
});
