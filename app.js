let activeQuestionId = null;
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

let currentOptions = [];
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

  activeQuestionId = questionId;

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

  currentOptions = options || [];

  renderVotes();
  drawWheel();
}

function renderVotes() {
  voteArea.innerHTML = "";

  currentOptions.forEach(option => {
    const btn = document.createElement("button");
    btn.className = "voteBtn";
    btn.innerText = option.text;
    btn.style.background = option.color;

    btn.onclick = async () => {
      await supabase
        .from("options")
        .update({ votes: option.votes + 1 })
        .eq("id", option.id);
    };

    voteArea.appendChild(btn);
  });
}

function drawWheel() {
  ctx.clearRect(0,0,500,500);

  const totalVotes = currentOptions.reduce(
  (s,o)=>s+(o.votes ?? 0),0
) || 1;

  let startAngle = angle;

  currentOptions.forEach(option => {
    const slice =
  ((option.votes + 1) /
  (totalVotes + currentOptions.length))
  * Math.PI * 2;

    ctx.beginPath();
    ctx.moveTo(250,250);
    ctx.arc(250,250,250,startAngle,startAngle+slice);
    ctx.fillStyle = option.color;
    ctx.fill();

    ctx.save();
    ctx.translate(250,250);
    ctx.rotate(startAngle + slice/2);
    ctx.fillStyle = "black";
    ctx.fillText(option.text,120,10);
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

      if (!activeQuestionId) return;

      const { data } = await supabase
        .from("options")
        .select("*")
        .eq("question_id", activeQuestionId);

      currentOptions = data || [];

      renderVotes();
      drawWheel();
    }
  )
  .subscribe();
