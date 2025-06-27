class TrieNode {
  constructor() {
    this.children = {};
    this.isEnd = false;
  }
}

class ReverseTrie {
  constructor() {
    this.root = new TrieNode();
  }

  insert(word) {
    const reversed = word.split('').reverse().join('');
    let node = this.root;
    for (let char of reversed) {
      if (!node.children[char]) node.children[char] = new TrieNode();
      node = node.children[char];
    }
    node.isEnd = true;
  }

  findRhymes(suffix) {
    const reversed = suffix.split('').reverse().join('');
    let node = this.root;
    for (let char of reversed) {
      if (!node.children[char]) return [];
      node = node.children[char];
    }
    return this.collect(node, reversed).map(w => w.split('').reverse().join(''));
  }

  collect(node, prefix) {
    let results = [];
    if (node.isEnd) results.push(prefix);
    for (let char in node.children) {
      results.push(...this.collect(node.children[char], prefix + char));
    }
    return results;
  }
}

const trie = new ReverseTrie();
let words = [];
let isLoaded = false;

async function loadWords() {
  try {
    const res = await fetch("wordlist.txt");
    const text = await res.text();
    words = text.split("\n").map(w => w.trim().toLowerCase()).filter(w => w);
    for (let word of words) trie.insert(word);
    isLoaded = true;
  } catch (e) {
    alert("Failed to load word list.");
    console.error(e);
  }
}

function findAlliterations(word, wordList) {
  const firstChar = word[0].toLowerCase();
  return wordList
    .filter(w => w.startsWith(firstChar) && w !== word)
    .slice(0, 10);
}

function estimateSyllables(word) {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

function findRhythmicMatches(input, wordList) {
  const syllables = estimateSyllables(input);
  return wordList
    .filter(w => estimateSyllables(w) === syllables && w !== input)
    .slice(0, 10);
}

async function handleAssistant() {
  const inputBox = document.getElementById("wordInput");
  const input = inputBox.value.trim().toLowerCase();
  const output = document.getElementById("output");
  const mode = document.getElementById("modeSelect").value;

  // Clear previous results
  output.innerHTML = '';

  // Validation
  if (!input || input.length < 2) {
    output.innerHTML = "<li>Please enter at least 2 letters</li>";
    return;
  }

  // Load word list if needed
  if (!isLoaded) {
    output.innerHTML = "<li>Loading word list, please wait...</li>";
    await loadWords();
    output.innerHTML = ''; // clear "loading" message after loading
  }

  // Prepare result header
  let results = [];
  if (mode === "rhyme") {
    results = trie.findRhymes(input).filter(w => w !== input);
    output.innerHTML = `<li><strong>Rhymes for "${input}":</strong></li>`;
  } else if (mode === "alliteration") {
    results = findAlliterations(input, words);
    output.innerHTML = `<li><strong>Alliterations with "${input}":</strong></li>`;
  } else if (mode === "rhythm") {
    results = findRhythmicMatches(input, words);
    output.innerHTML = `<li><strong>Words with same rhythm/metre as "${input}":</strong></li>`;
  }

  // Show results
  if (results.length === 0) {
    output.innerHTML += `<li>No matches found</li>`;
  } else {
    results.forEach(word => {
      const li = document.createElement("li");
      li.textContent = word;
      output.appendChild(li);
    });
  }

  // Automatically refocus input for next search
  inputBox.focus();
  inputBox.select();
}
function clearResults() {
  document.getElementById("output").innerHTML = '';
  document.getElementById("wordInput").value = '';
  document.getElementById("wordInput").focus();
}
