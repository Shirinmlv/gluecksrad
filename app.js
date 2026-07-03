console.log("APP LÄUFT");
window.currentOptions = [];
window.activeQuestionId = null;

let window.activeQuestionId = null;
import { supabase } from './supabase.js';

const questionInput = document.getElementById("questionInput");
const optionsContainer = document.getElementById("optionsContainer");
const addOptionBtn = document.getElementById("addOptionBtn");
const createBtn = document.getElementById("createBtn");

const voteArea = document.getElementById("voteArea");
const currentQuestion = document.getElementById("currentQuestion");

const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");

const spinBtn = document.getElementById("spinBtn");
const stopBtn = document.getElementById("stopBtn");

const winnerText = document.getElementById("winner");

let window.currentOptions = [];
let angle = 0;
let spinning = false;
let spinVelocity = 0;

const colors = ["#ff6384","#36a2eb","#ffcd56","#4bc0c0","#9966ff","#ff9f40"];

addOptionBtn.addEventListener("click", () => {
  const input = document.createElement("input");
  input.className = "optionInput";
  input.placeholder = "Antwortoption";
  optionsContainer.appendChild(input);
});

createBtn.addEventListener("click", async () => {
  const title = questionInput.value;

  const { data: question } = await supabase
    .from("questions")
    .insert([{ title }])
    .select()
    .single();

  const optionInputs = document.querySelectorAll(".optionInput");

  const options = [];

  optionInputs.forEach((input, index) => {
    if (input.value.trim() !== "") {
      options.push({
        question_id: question.id,
        text: input.value,
        color: colors[index % colors.length]
      });
    }
  });

  await supabase.from("options").insert(options);

// WICHTIG: kurz warten, damit DB sicher schreibt
setTimeout(() => {
  loadQuestion(question.id);
}, 300);
});

async function loadQuestion(questionId) {

  console.log("LOAD QUESTION", questionId);
console.log("OPTIONS FROM DB", options);

  window.activeQuestionId = questionId;

  const { data: question } = await supabase
    .from("questions")
    .select("*")
    .eq("id", questionId)
    .single();

  currentQuestion.innerText = question.title;

  const { data: options } = await supabase
    .from("options")
    .select("*")
    .eq("question_id", questionId);

  console.log("OPTIONS GELADEN:", options);

  window.currentOptions = options || [];

  renderVotes();
  drawWheel();
}

function renderVotes() {

  console.log("RENDER VOTES CALLED");
  console.log("CURRENT OPTIONS:", window.currentOptions);

  voteArea.innerHTML = "";

  if (!window.currentOptions || window.currentOptions.length === 0) {
    voteArea.innerHTML = "<p>Keine Optionen geladen</p>";
    return;
  }

  window.currentOptions.forEach(option => {

    const btn = document.createElement("button");

    btn.className = "voteBtn";
    btn.innerText = option.text;
    btn.style.background = option.color;

    console.log("BUTTON CREATED:", option.text);

    btn.addEventListener("click", async () => {

      console.log("CLICK:", option.text);

      const newVotes = (option.votes ?? 0) + 1;

      const { error } = await supabase
        .from("options")
        .update({ votes: newVotes })
        .eq("id", option.id);

      if (error) console.error(error);
    });

    voteArea.appendChild(btn);
  });
}

    voteArea.appendChild(btn);
  });
}

function drawWheel() {

  ctx.clearRect(0, 0, 500, 500);

  const totalVotes = window.currentOptions.reduce(
    (s, o) => s + (o.votes ?? 0),
    0
  );

  let startAngle = angle;

  window.currentOptions.forEach((option, index) => {

    // 🔥 LETZTES SEGMENT FÜLLT REST AUF
    let slice;

    if (index === currentOptions.length - 1) {
      slice = (Math.PI * 2) - (startAngle % (Math.PI * 2));
    } else {
      slice =
        ((option.votes ?? 0) / Math.max(totalVotes, 1)) *
        Math.PI * 2;
    }

    ctx.beginPath();
    ctx.moveTo(250, 250);
    ctx.arc(250, 250, 250, startAngle, startAngle + slice);
    ctx.closePath();

    ctx.fillStyle = option.color;
    ctx.fill();

    ctx.save();
    ctx.translate(250, 250);
    ctx.rotate(startAngle + slice / 2);
    ctx.fillStyle = "black";
    ctx.font = "16px Arial";
    ctx.fillText(option.text, 120, 0);
    ctx.restore();

    startAngle += slice;
  });
}

function animate(){
  if(!spinning) return;
  angle += spinVelocity;
  spinVelocity *= 0.99;
  drawWheel();
  requestAnimationFrame(animate);
}

spinBtn.onclick = () => {
  spinning = true;
  spinVelocity = 0.3;
  animate();
};

stopBtn.onclick = () => {
  spinning = false;
  determineWinner();
};

function determineWinner(){
  const totalVotes = currentOptions.reduce((s,o)=>s+(o.votes||0),0);
  let normalized = (Math.PI*2 - (angle%(Math.PI*2)));

  let current = 0;

  for(const option of currentOptions){
    const slice = ((option.votes||1)/Math.max(totalVotes,1))*Math.PI*2;

    if(normalized >= current && normalized < current + slice){
      winnerText.innerText = "Gewinner: " + option.text;
      return;
    }
    current += slice;
  }
}

supabase
  .channel("options-realtime")
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "options"
    },
    async () => {

     if (!window.activeQuestionId) return;

const { data } = await supabase
  .from("options")
  .select("*")
  .eq("question_id", window.activeQuestionId);

window.currentOptions = data || [];

      renderVotes();
      drawWheel();
    }
  )
  .subscribe();
