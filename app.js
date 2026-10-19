let words = [];
let queue = [];
let current = null;
let done = 0;

const $ = id => document.getElementById(id);

function shuffle(a) {
  return [...a].sort(() => Math.random() - .5);
}

function reset() {
  queue = shuffle(words);
  done = 0;
  next();
}

function next() {
  if (!queue.length) {
    current = null;
    $("question").textContent = "Geschafft! 🎉";
    $("answer").hidden = true;
    $("counter").textContent = `${done} Wörter geübt`;
    $("restart").hidden = false;
    $("next").hidden = true;
    return;
  }
  $("restart").hidden = true;
  $("next").hidden = false;
  current = queue.shift();
  $("question").textContent = current[$("direction").value];
  $("answer").textContent =
    current[$("direction").value === "de" ? "en" : "de"];

  $("answer").hidden = true;
  $("counter").textContent =
    `${done + 1} / ${words.length} · noch ${queue.length + 1}`;

  $("message").textContent = "";
}

// Verbesserte Sprachausgabe für iPhone und Safari

let speechKeepAlive = null;
let activeUtterance = null;

function speak() {
  if (!current) return;
  if (!("speechSynthesis" in window)) {
    $("message").textContent =
      "Sprachausgabe wird nicht unterstützt.";
    return;
  }

  const synth = window.speechSynthesis;

  synth.cancel();

  if (speechKeepAlive) {
    clearInterval(speechKeepAlive);
    speechKeepAlive = null;
  }

  const u = new SpeechSynthesisUtterance(current.en);

  activeUtterance = u;

  u.lang = "en-GB";
  u.rate = 0.85;
  u.pitch = 1;
  u.volume = 1;

  const voices = synth.getVoices();
  const britishVoice = voices.find(
    v => v.lang.toLowerCase() === "en-gb"
  );

  const englishVoice = voices.find(
    v => v.lang.toLowerCase().startsWith("en")
  );

  if (britishVoice || englishVoice) {
    u.voice = britishVoice || englishVoice;
  }

  u.onstart = () => {
    $("message").textContent = "";
  };
  u.onerror = event => {
    if (event.error !== "canceled" &&
        event.error !== "interrupted") {
      $("message").textContent =
        "Sprachausgabe fehlgeschlagen. Bitte erneut tippen.";
    }
    clearSpeechTimer();
  };

  u.onend = () => {
    clearSpeechTimer();
  };

  synth.speak(u);
  synth.resume();

  speechKeepAlive = setInterval(() => {
    if (synth.speaking && synth.paused) {
      synth.resume();
    }
    if (!synth.speaking && !synth.pending) {
      clearSpeechTimer();
    }
  }, 1000);
}

function clearSpeechTimer() {
  if (speechKeepAlive) {
    clearInterval(speechKeepAlive);
    speechKeepAlive = null;
  }
  activeUtterance = null;
}

// Bedienung

$("reveal").onclick = () => {
  if (current) $("answer").hidden = false;
};

$("speak").onclick = speak;

$("next").onclick = () => {
  if (current) done++;
  next();
};
$("repeat").onclick = () => {
  if (current) {
    queue.push(current);
    next();
  }
};

$("restart").onclick = reset;
$("direction").onchange = reset;

// Eigene Vokabeln laden

$("upload").onchange = async e => {
  try {
    const data = JSON.parse(
      await e.target.files[0].text()
    );

    if (
      !Array.isArray(data) ||
      !data.length ||
      !data.every(x =>
        typeof x.en === "string" &&
        typeof x.de === "string"
      )
    ) {
      throw Error("Ungültiges Format");
    }
    words = data;
    reset();

  } catch (err) {
    $("message").textContent =
      "Fehler beim Laden: " + err.message;
  }
};

// Vokabeln laden

fetch("vocabulary.json")
  .then(r => {
    if (!r.ok) {
      throw Error("Datei nicht gefunden");
    }
    return r.json();
  })
  .then(data => {
    words = data;
    reset();
  })
  .catch(e => {
    $("message").textContent = e.message;
  });
